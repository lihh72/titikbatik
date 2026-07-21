from datetime import timedelta

from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import BtxImportJob
from app.utils.time import utcnow


class BtxImportJobRepository:
    active_statuses = ("queued", "claimed", "running", "retry_wait")

    async def get_current(self, session: AsyncSession) -> BtxImportJob | None:
        return await session.get(BtxImportJob, 1)

    async def enqueue_or_reuse(self, session: AsyncSession, *, limit: int) -> BtxImportJob:
        job = await self.get_current(session)
        if job and job.status in self.active_statuses:
            return job
        if not job:
            job = BtxImportJob(id=1, status="queued", requested_limit=limit)
            session.add(job)
        else:
            job.status, job.requested_limit = "queued", limit
            job.examined = job.imported = job.skipped_duplicates = job.failed = 0
            job.errors_json, job.attempt_count, job.error_message = [], 0, None
            job.locked_by = job.locked_at = job.started_at = job.completed_at = None
            job.available_at = utcnow()
        await session.flush()
        return job

    async def claim_next(self, session: AsyncSession, *, worker_id: str) -> BtxImportJob | None:
        now = utcnow()
        result = await session.execute(update(BtxImportJob).where(BtxImportJob.id == 1, BtxImportJob.status.in_(("queued", "retry_wait")), BtxImportJob.available_at <= now).values(status="claimed", locked_by=worker_id, locked_at=now, started_at=now).returning(BtxImportJob.id))
        job_id = result.scalar_one_or_none()
        return await session.get(BtxImportJob, job_id) if job_id else None

    async def reset_stale_locks(self, session: AsyncSession, *, older_than_seconds: int) -> int:
        cutoff = utcnow() - timedelta(seconds=older_than_seconds)
        result = await session.execute(update(BtxImportJob).where(BtxImportJob.status.in_(("claimed", "running")), BtxImportJob.locked_at < cutoff).values(status="retry_wait", locked_by=None, locked_at=None, available_at=utcnow()))
        return int(result.rowcount or 0)

    async def mark_retry_or_failed(self, session: AsyncSession, job: BtxImportJob, *, message: str) -> None:
        job.error_message, job.locked_by, job.locked_at = message[:4000], None, None
        job.attempt_count += 1
        if job.attempt_count < job.max_attempts:
            job.status, job.available_at = "retry_wait", utcnow() + timedelta(seconds=min(300, 2 ** job.attempt_count * 5))
        else:
            job.status, job.completed_at = "failed", utcnow()
        await session.flush()
