import random
import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, get_settings
from app.core.exceptions import ConflictError, NotFoundError
from app.models import Batik, CostumeTemplate, GenerationBatch, GenerationJob
from app.repositories.batik_repository import BatikRepository
from app.repositories.batch_repository import BatchRepository
from app.schemas.generation import GenerationBatchCreate
from app.services.prompt_generator_service import PromptGeneratorService
from app.utils.time import utcnow, utcnow_iso


class GenerationService:
    def __init__(
        self,
        settings: Settings | None = None,
        prompt_generator: PromptGeneratorService | None = None,
        batch_repository: BatchRepository | None = None,
        batik_repository: BatikRepository | None = None,
    ) -> None:
        self.settings = settings or get_settings()
        self.prompt_generator = prompt_generator or PromptGeneratorService()
        self.batch_repository = batch_repository or BatchRepository()
        self.batik_repository = batik_repository or BatikRepository()

    async def create_batch(self, session: AsyncSession, request: GenerationBatchCreate) -> GenerationBatch:
        if request.amount > self.settings.max_batch_size:
            raise ConflictError(f"amount must be less than or equal to {self.settings.max_batch_size}")
        if not self.settings.path(self.settings.generate_workflow_path).exists():
            raise ConflictError("Generate workflow file is missing")
        if request.combine_enabled and request.costume_template_mode != "none":
            if not self.settings.path(self.settings.combine_workflow_path).exists():
                raise ConflictError("Combine workflow file is missing")
            templates = await self._resolve_templates(session, request)
            if not templates:
                raise ConflictError("At least one active costume template is required when combine is enabled")
        if request.video_enabled:
            if not request.combine_enabled or request.costume_template_mode == "none":
                raise ConflictError("Video generation requires combine with exactly one costume template")
            if not self.settings.path(self.settings.video_workflow_path).exists():
                raise ConflictError("Video workflow file is missing")
            templates = await self._resolve_templates(session, request)
            resolved_count = 1 if request.costume_template_mode == "random_one" and templates else len(templates)
            if resolved_count != 1:
                raise ConflictError("Video generation requires exactly one costume template")

        batch_id = str(uuid.uuid4())
        rng = random.Random(request.random_seed)
        settings_json = request.model_dump()
        settings_json["resolved_at"] = utcnow_iso()

        batch = GenerationBatch(
            id=batch_id,
            requested_count=request.amount,
            generate_count=request.amount,
            combine_enabled=request.combine_enabled,
            video_enabled=request.video_enabled,
            costume_template_mode=request.costume_template_mode,
            status="queued",
            queued_count=request.amount,
            requested_by=request.requested_by,
            settings_json=settings_json,
        )
        session.add(batch)

        generated_hashes: set[str] = set()
        for sequence in range(1, request.amount + 1):
            prompt = await self._unique_prompt(session, request, rng, generated_hashes)
            seed = self._seed_for_job(rng, request.random_seed, sequence)
            job = GenerationJob(
                id=str(uuid.uuid4()),
                batch_id=batch_id,
                sequence_number=sequence,
                job_type="generate",
                status="queued",
                max_attempts=self.settings.comfyui_max_retries,
                positive_prompt=prompt.positive_prompt,
                negative_prompt=prompt.negative_prompt,
                prompt_hash=prompt.prompt_hash,
                seed=seed,
                workflow_name="generatebatik",
                settings_json={
                    "keyword": prompt.keyword,
                    "warna": prompt.warna,
                    "style": prompt.style,
                    "selections": prompt.selections,
                    "batch": settings_json,
                },
            )
            session.add(job)

        await session.flush()
        return batch

    async def cancel_batch(self, session: AsyncSession, batch_id: str) -> GenerationBatch:
        batch = await self.batch_repository.get(session, batch_id)
        if not batch:
            raise NotFoundError("Generation batch not found")
        await session.execute(
            update(GenerationJob)
            .where(
                GenerationJob.batch_id == batch_id,
                GenerationJob.status.in_(["queued", "retry_wait", "claimed", "submitting", "running"]),
            )
            .values(status="cancelled", locked_by=None, locked_at=None, completed_at=utcnow())
        )
        await self.batch_repository.refresh_counts(session, batch_id)
        await session.flush()
        return batch

    async def retry_failed_jobs(self, session: AsyncSession, batch_id: str) -> GenerationBatch:
        batch = await self.batch_repository.get(session, batch_id)
        if not batch:
            raise NotFoundError("Generation batch not found")
        await session.execute(
            update(GenerationJob)
            .where(GenerationJob.batch_id == batch_id, GenerationJob.status == "failed")
            .values(
                status="queued",
                error_message=None,
                locked_by=None,
                locked_at=None,
                available_at=utcnow(),
                comfyui_prompt_id=None,
            )
        )
        await self.batch_repository.refresh_counts(session, batch_id)
        await session.flush()
        return batch

    async def create_batik_from_job(
        self,
        session: AsyncSession,
        job: GenerationJob,
        *,
        file_preview: str,
    ) -> Batik:
        meta = job.settings_json or {}
        keyword = meta.get("keyword", "batik pattern")
        batik = Batik(
            keyword=keyword,
            slug=await self.batik_repository.next_slug(session, keyword),
            warna=meta.get("warna", ""),
            style=meta.get("style", ""),
            seed=job.seed or 0,
            positive_prompt=job.positive_prompt or "",
            negative_prompt=job.negative_prompt or "",
            file_preview=file_preview,
            prompt_hash=job.prompt_hash or "",
            generation_job_id=job.id,
            is_published=True,
        )
        session.add(batik)
        await session.flush()
        return batik

    async def dashboard(self, session: AsyncSession) -> dict[str, Any]:
        total_batik = int(await session.scalar(select(func.count(Batik.id)).where(Batik.deleted_at.is_(None))) or 0)
        published_batik = int(
            await session.scalar(select(func.count(Batik.id)).where(Batik.deleted_at.is_(None), Batik.is_published.is_(True)))
            or 0
        )
        active_batches = int(
            await session.scalar(select(func.count(GenerationBatch.id)).where(GenerationBatch.status.in_(["queued", "running"])))
            or 0
        )
        job_counts = {}
        rows = (await session.execute(select(GenerationJob.status, func.count()).group_by(GenerationJob.status))).all()
        for status, count in rows:
            job_counts[status] = int(count)
        return {
            "total_batik": total_batik,
            "published_batik": published_batik,
            "active_batches": active_batches,
            "job_queued": job_counts.get("queued", 0) + job_counts.get("retry_wait", 0),
            "job_running": job_counts.get("claimed", 0) + job_counts.get("submitting", 0) + job_counts.get("running", 0),
            "job_failed": job_counts.get("failed", 0),
        }

    async def _unique_prompt(
        self,
        session: AsyncSession,
        request: GenerationBatchCreate,
        rng: random.Random,
        generated_hashes: set[str],
    ):
        for _ in range(100):
            prompt = await self.prompt_generator.generate(
                session,
                rng=rng,
                mode=request.mode,
                fixed_wordlist_items=request.fixed_wordlist_items,
            )
            if request.allow_duplicate_prompts:
                generated_hashes.add(prompt.prompt_hash)
                return prompt
            if prompt.prompt_hash in generated_hashes:
                continue
            existing_batik = await session.scalar(select(Batik.id).where(Batik.prompt_hash == prompt.prompt_hash))
            existing_job = await session.scalar(select(GenerationJob.id).where(GenerationJob.prompt_hash == prompt.prompt_hash))
            if not existing_batik and not existing_job:
                generated_hashes.add(prompt.prompt_hash)
                return prompt
        raise ConflictError("Unable to create a unique prompt from the available wordlist")

    def _seed_for_job(self, rng: random.Random, random_seed: int | None, sequence: int) -> int:
        if random_seed is not None:
            return random.Random(f"{random_seed}:{sequence}").randint(1, 2**48 - 1)
        return rng.randint(1, 2**48 - 1)

    async def _resolve_templates(self, session: AsyncSession, request: GenerationBatchCreate) -> list[CostumeTemplate]:
        stmt = select(CostumeTemplate).where(CostumeTemplate.is_active.is_(True), CostumeTemplate.deleted_at.is_(None))
        if request.costume_template_mode == "selected":
            stmt = stmt.where(CostumeTemplate.id.in_(request.costume_template_ids))
        return list((await session.scalars(stmt.order_by(CostumeTemplate.sort_order, CostumeTemplate.id))).all())
