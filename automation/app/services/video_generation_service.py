import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Batik, BatikCostumeFile, GenerationBatch, GenerationJob
from app.utils.time import utcnow


class VideoGenerationService:
    async def create_video_job(
        self,
        session: AsyncSession,
        *,
        batch: GenerationBatch,
        source_batik: Batik,
        source_costume: BatikCostumeFile,
        source_job: GenerationJob,
        force: bool = False,
    ) -> GenerationJob:
        if not force:
            existing = await session.scalar(
                select(GenerationJob)
                .where(
                    GenerationJob.job_type == "video",
                    GenerationJob.source_costume_file_id == source_costume.id,
                )
                .order_by(GenerationJob.created_at.desc())
            )
            if existing:
                return existing

        max_sequence = int(
            await session.scalar(
                select(func.max(GenerationJob.sequence_number)).where(GenerationJob.batch_id == batch.id)
            )
            or 0
        )
        job = GenerationJob(
            id=str(uuid.uuid4()),
            batch_id=batch.id,
            sequence_number=max_sequence + 1,
            job_type="video",
            status="queued",
            attempt_count=0,
            max_attempts=source_job.max_attempts,
            seed=source_job.seed,
            workflow_name="videobatik",
            source_batik_id=source_batik.id,
            source_costume_file_id=source_costume.id,
            input_preview_filename=source_costume.filename,
            available_at=utcnow(),
            settings_json={"source_costume_file_id": source_costume.id},
        )
        session.add(job)
        await session.flush()
        return job
