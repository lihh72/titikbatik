import random
import uuid
from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Batik, CostumeTemplate, GenerationBatch, GenerationJob
from app.utils.time import utcnow


class CombinationService:
    async def create_combine_jobs(
        self,
        session: AsyncSession,
        *,
        batch: GenerationBatch,
        source_batik: Batik,
        source_job: GenerationJob,
    ) -> list[GenerationJob]:
        settings = (batch.settings_json or {}).copy()
        if not batch.combine_enabled or batch.costume_template_mode == "none":
            return []
        templates = await self._select_templates(session, batch, source_batik.id)
        if not templates:
            return []
        max_sequence = int(
            await session.scalar(select(func.max(GenerationJob.sequence_number)).where(GenerationJob.batch_id == batch.id)) or 0
        )
        jobs: list[GenerationJob] = []
        for index, template in enumerate(templates, start=1):
            job = GenerationJob(
                id=str(uuid.uuid4()),
                batch_id=batch.id,
                sequence_number=max_sequence + index,
                job_type="combine",
                status="queued",
                attempt_count=0,
                max_attempts=source_job.max_attempts,
                positive_prompt=settings.get("combine", {}).get("prompt"),
                negative_prompt=settings.get("combine", {}).get("negative_prompt", ""),
                seed=(source_job.seed or 0) + index,
                workflow_name="combinebatik",
                source_batik_id=source_batik.id,
                costume_template_id=template.id,
                input_preview_filename=source_batik.file_preview,
                available_at=utcnow(),
                settings_json={"batch": settings, "template": {"id": template.id, "filename": template.filename}},
            )
            session.add(job)
            jobs.append(job)
        await session.flush()
        return jobs

    async def _select_templates(self, session: AsyncSession, batch: GenerationBatch, source_batik_id: int) -> list[CostumeTemplate]:
        settings = batch.settings_json or {}
        mode = batch.costume_template_mode
        stmt = select(CostumeTemplate).where(CostumeTemplate.is_active.is_(True), CostumeTemplate.deleted_at.is_(None))
        selected_ids = settings.get("costume_template_ids") or []
        if mode == "selected":
            stmt = stmt.where(CostumeTemplate.id.in_(selected_ids))
        templates = list((await session.scalars(stmt.order_by(CostumeTemplate.sort_order, CostumeTemplate.id))).all())
        if mode == "random_one" and templates:
            seed = settings.get("random_seed")
            rng = random.Random(f"{seed}:{source_batik_id}")
            return [rng.choice(templates)]
        return templates
