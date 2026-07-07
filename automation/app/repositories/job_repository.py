from datetime import datetime, timedelta

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import GenerationJob
from app.utils.time import utcnow


class JobRepository:
    async def claim_next(self, session: AsyncSession, *, worker_id: str) -> GenerationJob | None:
        now = utcnow()
        subquery = (
            select(GenerationJob.id)
            .where(
                GenerationJob.status.in_(["queued", "retry_wait"]),
                GenerationJob.available_at <= now,
            )
            .order_by(GenerationJob.available_at.asc(), GenerationJob.created_at.asc())
            .limit(1)
            .scalar_subquery()
        )
        result = await session.execute(
            update(GenerationJob)
            .where(GenerationJob.id == subquery)
            .values(status="claimed", locked_by=worker_id, locked_at=now, started_at=now, updated_at=now)
            .returning(GenerationJob.id)
        )
        job_id = result.scalar_one_or_none()
        if not job_id:
            return None
        await session.flush()
        return await session.get(GenerationJob, job_id)

    async def reset_stale_locks(self, session: AsyncSession, *, older_than_seconds: int) -> int:
        cutoff = utcnow() - timedelta(seconds=older_than_seconds)
        result = await session.execute(
            update(GenerationJob)
            .where(
                GenerationJob.status.in_(["claimed", "submitting", "running"]),
                GenerationJob.locked_at.is_not(None),
                GenerationJob.locked_at < cutoff,
            )
            .values(status="retry_wait", locked_by=None, locked_at=None, available_at=utcnow())
        )
        await session.flush()
        return int(result.rowcount or 0)

    async def mark_retry_or_failed(
        self,
        session: AsyncSession,
        job: GenerationJob,
        *,
        message: str,
        retryable: bool = True,
    ) -> None:
        job.error_message = message[:4000]
        job.locked_by = None
        job.locked_at = None
        job.comfyui_prompt_id = None
        job.attempt_count += 1
        if retryable and job.attempt_count < job.max_attempts:
            delay_seconds = min(300, 2 ** max(job.attempt_count, 1) * 5)
            job.status = "retry_wait"
            job.available_at = utcnow() + timedelta(seconds=delay_seconds)
        else:
            job.status = "failed"
            job.completed_at = utcnow()
        await session.flush()

    async def complete(self, session: AsyncSession, job: GenerationJob, *, output_filename: str | None = None) -> None:
        job.status = "completed"
        job.output_filename = output_filename or job.output_filename
        job.locked_by = None
        job.locked_at = None
        job.completed_at = utcnow()
        await session.flush()

    async def jobs_for_batch(self, session: AsyncSession, batch_id: str) -> list[GenerationJob]:
        stmt = select(GenerationJob).where(GenerationJob.batch_id == batch_id).order_by(GenerationJob.sequence_number)
        return list((await session.scalars(stmt)).all())
