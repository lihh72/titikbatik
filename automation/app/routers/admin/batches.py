from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.exceptions import NotFoundError
from app.core.security import require_admin_key
from app.repositories.batch_repository import BatchRepository
from app.repositories.job_repository import JobRepository
from app.schemas.batch import GenerationBatchQueued, GenerationBatchRead
from app.schemas.generation import GenerationBatchCreate
from app.schemas.job import GenerationJobRead
from app.services.generation_service import GenerationService
from app.utils.responses import ok

router = APIRouter(prefix="/api/admin/generation-batches", tags=["admin batches"], dependencies=[Depends(require_admin_key)])
service = GenerationService()
batch_repository = BatchRepository()
job_repository = JobRepository()


@router.post("", status_code=status.HTTP_202_ACCEPTED)
async def create_batch(request: GenerationBatchCreate, session: AsyncSession = Depends(get_session)):
    batch = await service.create_batch(session, request)
    await session.commit()
    data = GenerationBatchQueued(
        batch_id=batch.id,
        requested_count=batch.requested_count,
        status=batch.status,
        status_url=f"/api/admin/generation-batches/{batch.id}",
    )
    return ok(data.model_dump(), "Generation batch queued")


@router.get("")
async def list_batches(
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    session: AsyncSession = Depends(get_session),
):
    batches = await batch_repository.list_batches(session, limit=limit, offset=offset)
    return ok([GenerationBatchRead.model_validate(batch).model_dump(mode="json") for batch in batches])


@router.get("/{batch_id}")
async def get_batch(batch_id: str, session: AsyncSession = Depends(get_session)):
    batch = await batch_repository.get(session, batch_id)
    if not batch:
        raise NotFoundError("Generation batch not found")
    await batch_repository.refresh_counts(session, batch_id)
    await session.commit()
    return ok(GenerationBatchRead.model_validate(batch).model_dump(mode="json"))


@router.post("/{batch_id}/cancel")
async def cancel_batch(batch_id: str, session: AsyncSession = Depends(get_session)):
    batch = await service.cancel_batch(session, batch_id)
    await session.commit()
    return ok(GenerationBatchRead.model_validate(batch).model_dump(mode="json"), "Generation batch cancelled")


@router.post("/{batch_id}/retry-failed")
async def retry_failed(batch_id: str, session: AsyncSession = Depends(get_session)):
    batch = await service.retry_failed_jobs(session, batch_id)
    await session.commit()
    return ok(GenerationBatchRead.model_validate(batch).model_dump(mode="json"), "Failed jobs queued for retry")


@router.get("/{batch_id}/jobs")
async def list_jobs(batch_id: str, session: AsyncSession = Depends(get_session)):
    batch = await batch_repository.get(session, batch_id)
    if not batch:
        raise NotFoundError("Generation batch not found")
    jobs = await job_repository.jobs_for_batch(session, batch_id)
    return ok([GenerationJobRead.model_validate(job).model_dump(mode="json") for job in jobs])
