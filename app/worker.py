import asyncio
import logging
from pathlib import Path

from app.runtime import ensure_project_runtime

ensure_project_runtime("app.worker", ("sqlalchemy", "httpx", "PIL"))

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.database import async_session_factory
from app.core.exceptions import AppError, WorkflowMappingError
from app.core.logging import configure_logging
from app.models import AppSetting, Batik, BatikCostumeFile, CostumeTemplate, GenerationBatch, GenerationJob
from app.repositories.batch_repository import BatchRepository
from app.repositories.job_repository import JobRepository
from app.services.combination_service import CombinationService
from app.services.comfyui_service import ComfyUIService
from app.services.generation_service import GenerationService
from app.services.storage_service import StorageService
from app.services.video_generation_service import VideoGenerationService
from app.services.workflow_service import WorkflowService
from app.utils.filenames import build_output_filename, slugify
from app.utils.time import utcnow, utcnow_iso

logger = logging.getLogger(__name__)


class Worker:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.storage = StorageService(self.settings)
        self.workflow = WorkflowService(self.settings)
        self.comfyui = ComfyUIService(self.settings)
        self.jobs = JobRepository()
        self.batches = BatchRepository()
        self.generation = GenerationService(self.settings)
        self.combination = CombinationService()
        self.video_generation = VideoGenerationService()
        self.worker_id = self.settings.worker_id

    async def run_forever(self) -> None:
        self.storage.ensure_directories()
        logger.info(
            "Worker %s started with concurrency=%s and poll_interval=%ss",
            self.worker_id,
            self.settings.worker_concurrency,
            self.settings.worker_poll_interval_seconds,
        )
        await self.recover_stale_jobs()
        next_idle_log_at = 0.0
        while True:
            did_work = False
            for _ in range(max(self.settings.worker_concurrency, 1)):
                job_id = await self.claim_next_job()
                if not job_id:
                    break
                did_work = True
                await self.process_job(job_id)
            await self.heartbeat()
            if not did_work:
                now = asyncio.get_running_loop().time()
                if now >= next_idle_log_at:
                    logger.info("Worker idle: no queued jobs; waiting for new work")
                    next_idle_log_at = now + 60
                await asyncio.sleep(self.settings.worker_poll_interval_seconds)

    async def recover_stale_jobs(self) -> None:
        async with async_session_factory() as session:
            count = await self.jobs.reset_stale_locks(session, older_than_seconds=self.settings.stale_job_lock_seconds)
            await session.commit()
            if count:
                logger.info("Recovered %s stale jobs", count)

    async def claim_next_job(self) -> str | None:
        async with async_session_factory() as session:
            job = await self.jobs.claim_next(session, worker_id=self.worker_id)
            if not job:
                await session.commit()
                return None
            batch = await session.get(GenerationBatch, job.batch_id)
            if batch and not batch.started_at:
                batch.started_at = utcnow()
            await self.batches.refresh_counts(session, job.batch_id)
            await session.commit()
            logger.info("Claimed %s job %s from batch %s", job.job_type, job.id, job.batch_id)
            return job.id

    async def process_job(self, job_id: str) -> None:
        try:
            async with async_session_factory() as session:
                job = await session.get(GenerationJob, job_id)
                if not job or job.status == "cancelled":
                    return
                job.status = "submitting"
                await session.commit()

            if job.job_type == "generate":
                await self._process_generate(job_id)
            elif job.job_type == "combine":
                await self._process_combine(job_id)
            elif job.job_type == "video":
                await self._process_video(job_id)
            else:
                raise WorkflowMappingError(f"Unknown job_type '{job.job_type}'")
            logger.info("Completed job %s", job_id)
        except Exception as exc:  # noqa: BLE001
            await self._fail_job(job_id, exc)

    async def _process_generate(self, job_id: str) -> None:
        async with async_session_factory() as session:
            job = await session.get(GenerationJob, job_id)
            if not job:
                return
            prefix = f"titikbatik_preview_{job.id}"
            prompt = self.workflow.build_generate_prompt(
                positive_prompt=job.positive_prompt or "",
                negative_prompt=job.negative_prompt or "",
                filename_prefix=prefix,
            )
            job.seed = self.workflow.get_input(prompt, "3", "seed", job.seed)
            prompt_id = await self._resume_or_queue_prompt(job, prompt)
            job.comfyui_prompt_id = prompt_id
            job.status = "running"
            await session.commit()

        history = await self.comfyui.wait_for_completion(prompt_id)
        images = self.comfyui.get_output_images(history, save_node_id="9")
        if not images:
            raise AppError("ComfyUI generate workflow did not produce an image")
        image_bytes = await self.comfyui.download_output_image(images[0])

        async with async_session_factory() as session:
            job = await session.get(GenerationJob, job_id)
            if not job:
                return
            slug = slugify((job.settings_json or {}).get("keyword", "batik"))
            filename = build_output_filename(job.seed, slug, "preview")
            saved_path = await self.storage.save_image_bytes_as_webp(image_bytes, filename=filename, category="preview")
            try:
                batik = await self.generation.create_batik_from_job(session, job, file_preview=saved_path.name)
                await self.jobs.complete(session, job, output_filename=saved_path.name)
                batch = await session.get(GenerationBatch, job.batch_id)
                if batch:
                    await self.combination.create_combine_jobs(session, batch=batch, source_batik=batik, source_job=job)
                    await self.batches.refresh_counts(session, batch.id)
                await session.commit()
            except Exception:
                saved_path.unlink(missing_ok=True)
                raise

    async def _process_combine(self, job_id: str) -> None:
        async with async_session_factory() as session:
            job = await session.get(GenerationJob, job_id)
            if not job:
                return
            template = await session.get(CostumeTemplate, job.costume_template_id) if job.costume_template_id else None
            if not template:
                raise AppError("Costume template not found for combine job")
            preview = self.storage.resolve_public_file(job.input_preview_filename or "", category="preview")
            template_path = self.storage.template_file_path(template.filename)
            uploaded_preview = await self.comfyui.upload_image(preview.path)
            uploaded_template = await self.comfyui.upload_image(template_path)
            prefix = f"titikbatik_costume_{job.id}"
            prompt = self.workflow.build_combine_prompt(
                costume_image_name=uploaded_template,
                batik_image_name=uploaded_preview,
                filename_prefix=prefix,
            )
            job.seed = self.workflow.get_input(prompt, "3", "seed", job.seed)
            prompt_id = await self._resume_or_queue_prompt(job, prompt)
            job.comfyui_prompt_id = prompt_id
            job.status = "running"
            await session.commit()

        history = await self.comfyui.wait_for_completion(prompt_id)
        images = self.comfyui.get_output_images(history, save_node_id="60")
        if not images:
            raise AppError("ComfyUI combine workflow did not produce an image")
        image_bytes = await self.comfyui.download_output_image(images[0])

        async with async_session_factory() as session:
            job = await session.get(GenerationJob, job_id)
            if not job:
                return
            filename = build_output_filename(job.seed, f"batik-{job.source_batik_id}", "costume")
            saved_path = await self.storage.save_image_bytes_as_webp(image_bytes, filename=filename, category="costume")
            try:
                max_order = 0
                if job.source_batik_id:
                    from sqlalchemy import func, select

                    max_order = int(
                        await session.scalar(
                            select(func.max(BatikCostumeFile.sort_order)).where(
                                BatikCostumeFile.batik_id == job.source_batik_id
                            )
                        )
                        or 0
                    )
                    costume_file = BatikCostumeFile(
                        batik_id=job.source_batik_id,
                        filename=saved_path.name,
                        template_id=job.costume_template_id,
                        sort_order=max_order + 1,
                    )
                    session.add(costume_file)
                    await session.flush()
                    batch = await session.get(GenerationBatch, job.batch_id)
                    batik = await session.get(Batik, job.source_batik_id)
                    if batch and batik and batch.video_enabled:
                        await self.video_generation.create_video_job(
                            session,
                            batch=batch,
                            source_batik=batik,
                            source_costume=costume_file,
                            source_job=job,
                        )
                await self.jobs.complete(session, job, output_filename=saved_path.name)
                await self.batches.refresh_counts(session, job.batch_id)
                await session.commit()
            except Exception:
                saved_path.unlink(missing_ok=True)
                raise

    async def _process_video(self, job_id: str) -> None:
        async with async_session_factory() as session:
            job = await session.get(GenerationJob, job_id)
            if not job:
                return
            costume = (
                await session.get(BatikCostumeFile, job.source_costume_file_id)
                if job.source_costume_file_id
                else None
            )
            if not costume:
                raise AppError("Costume output not found for video job")
            source = self.storage.resolve_public_file(costume.filename, category="costume")
            uploaded_costume = await self.comfyui.upload_image(source.path)
            prompt = self.workflow.build_video_prompt(
                costume_image_name=uploaded_costume,
                filename_prefix=f"titikbatik_video_{job.id}",
            )
            prompt_id = await self._resume_or_queue_prompt(job, prompt)
            job.comfyui_prompt_id = prompt_id
            job.status = "running"
            await session.commit()

        history = await self.comfyui.wait_for_completion(prompt_id)
        videos = self.comfyui.get_output_videos(history, save_node_id="75")
        if not videos:
            raise AppError("ComfyUI video workflow did not produce a video")
        video_bytes = await self.comfyui.download_output_file(videos[0])
        suffix = Path(str(videos[0]["filename"])).suffix.lower().lstrip(".")
        if suffix not in {"mp4", "webm"}:
            raise AppError("ComfyUI video workflow produced an unsupported format")

        async with async_session_factory() as session:
            job = await session.get(GenerationJob, job_id)
            if not job:
                return
            costume = (
                await session.get(BatikCostumeFile, job.source_costume_file_id)
                if job.source_costume_file_id
                else None
            )
            batik = await session.get(Batik, job.source_batik_id) if job.source_batik_id else None
            if not costume or not batik:
                raise AppError("Video output pair no longer exists")
            filename = build_output_filename(job.seed, f"batik-{batik.id}", "video", suffix=suffix)
            saved_path = await self.storage.save_video_bytes(video_bytes, filename=filename)
            try:
                costume.file_video = saved_path.name
                batik.file_video = saved_path.name
                await self.jobs.complete(session, job, output_filename=saved_path.name)
                await self.batches.refresh_counts(session, job.batch_id)
                await session.commit()
            except Exception:
                saved_path.unlink(missing_ok=True)
                raise

    async def _resume_or_queue_prompt(self, job: GenerationJob, prompt: dict) -> str:
        if job.comfyui_prompt_id:
            if await self._can_resume_prompt(job.comfyui_prompt_id):
                logger.info("Resuming ComfyUI prompt %s for job %s", job.comfyui_prompt_id, job.id)
                return job.comfyui_prompt_id
            logger.warning(
                "ComfyUI prompt %s for job %s was not found in history or queue; resubmitting",
                job.comfyui_prompt_id,
                job.id,
            )
        return await self.comfyui.queue_prompt(prompt)

    async def _can_resume_prompt(self, prompt_id: str) -> bool:
        history = await self.comfyui.get_history(prompt_id)
        if self.comfyui.history_item(history, prompt_id):
            return True
        queue = await self.comfyui.get_queue()
        return self.comfyui.prompt_in_queue(queue, prompt_id)

    async def _fail_job(self, job_id: str, exc: Exception) -> None:
        retryable = not isinstance(exc, WorkflowMappingError)
        message = exc.message if isinstance(exc, AppError) else str(exc)
        logger.exception("Job %s failed: %s", job_id, message)
        async with async_session_factory() as session:
            job = await session.get(GenerationJob, job_id)
            if not job:
                return
            await self.jobs.mark_retry_or_failed(session, job, message=message, retryable=retryable)
            await self.batches.refresh_counts(session, job.batch_id)
            await session.commit()

    async def heartbeat(self) -> None:
        async with async_session_factory() as session:
            value = {"worker_id": self.worker_id, "heartbeat_at": utcnow_iso()}
            setting = await session.get(AppSetting, "worker_heartbeat")
            if setting:
                setting.value_json = value
            else:
                session.add(AppSetting(key="worker_heartbeat", value_json=value))
            await session.commit()


async def main() -> None:
    configure_logging()
    await Worker().run_forever()


if __name__ == "__main__":
    asyncio.run(main())
