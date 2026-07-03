from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import GenerationBatch, GenerationJob
from app.utils.time import utcnow


class BatchRepository:
    async def list_batches(self, session: AsyncSession, *, limit: int = 50, offset: int = 0) -> list[GenerationBatch]:
        stmt = select(GenerationBatch).order_by(GenerationBatch.created_at.desc()).offset(offset).limit(limit)
        return list((await session.scalars(stmt)).all())

    async def get(self, session: AsyncSession, batch_id: str) -> GenerationBatch | None:
        stmt = select(GenerationBatch).options(selectinload(GenerationBatch.jobs)).where(GenerationBatch.id == batch_id)
        return await session.scalar(stmt)

    async def refresh_counts(self, session: AsyncSession, batch_id: str) -> GenerationBatch | None:
        batch = await session.get(GenerationBatch, batch_id)
        if not batch:
            return None
        rows = (
            await session.execute(
                select(GenerationJob.status, func.count(GenerationJob.id))
                .where(GenerationJob.batch_id == batch_id)
                .group_by(GenerationJob.status)
            )
        ).all()
        counts = {status: count for status, count in rows}
        batch.queued_count = int(counts.get("queued", 0) + counts.get("retry_wait", 0))
        batch.running_count = int(counts.get("claimed", 0) + counts.get("submitting", 0) + counts.get("running", 0))
        batch.completed_count = int(counts.get("completed", 0))
        batch.failed_count = int(counts.get("failed", 0))
        batch.cancelled_count = int(counts.get("cancelled", 0))

        active = batch.queued_count + batch.running_count
        terminal = batch.completed_count + batch.failed_count + batch.cancelled_count
        total = int(await session.scalar(select(func.count(GenerationJob.id)).where(GenerationJob.batch_id == batch_id)) or 0)
        now = utcnow()

        if total == 0:
            batch.status = "queued"
        elif batch.cancelled_count == total:
            batch.status = "cancelled"
            batch.completed_at = batch.completed_at or now
        elif active > 0:
            batch.status = "running" if batch.running_count else "queued"
            batch.completed_at = None
        elif terminal == total and batch.failed_count and batch.completed_count:
            batch.status = "partially_completed"
            batch.completed_at = batch.completed_at or now
        elif terminal == total and batch.failed_count:
            batch.status = "failed"
            batch.completed_at = batch.completed_at or now
        elif terminal == total:
            batch.status = "completed"
            batch.completed_at = batch.completed_at or now
        await session.flush()
        return batch
