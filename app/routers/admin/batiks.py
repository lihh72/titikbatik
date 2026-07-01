from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_session
from app.core.exceptions import ConflictError, NotFoundError
from app.core.security import require_admin_key
from app.models import Batik, BatikCostumeFile, GenerationBatch, GenerationJob
from app.repositories.batik_repository import BatikRepository
from app.schemas.batik import BatikRead, BatikUpdate
from app.services.combination_service import CombinationService
from app.services.image_service import ImageService
from app.services.video_generation_service import VideoGenerationService
from app.utils.responses import ok

router = APIRouter(prefix="/api/admin/batiks", tags=["admin batiks"], dependencies=[Depends(require_admin_key)])
repository = BatikRepository()
image_service = ImageService()
combination_service = CombinationService()
video_generation_service = VideoGenerationService()


@router.get("")
async def list_batiks(
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    session: AsyncSession = Depends(get_session),
):
    stmt = (
        select(Batik)
        .options(selectinload(Batik.costume_files).selectinload(BatikCostumeFile.template))
        .where(Batik.deleted_at.is_(None))
        .order_by(Batik.created_at.desc(), Batik.id.desc())
        .offset(offset)
        .limit(limit)
    )
    items = list((await session.scalars(stmt)).all())
    for item in items:
        image_service.enrich_batik(item)
    return ok([BatikRead.model_validate(item).model_dump(mode="json") for item in items])


@router.get("/{batik_id}")
async def get_batik(batik_id: int, session: AsyncSession = Depends(get_session)):
    batik = await repository.get(session, batik_id)
    if not batik:
        raise NotFoundError("Batik not found")
    image_service.enrich_batik(batik)
    return ok(BatikRead.model_validate(batik).model_dump(mode="json"))


@router.patch("/{batik_id}")
async def update_batik(batik_id: int, request: BatikUpdate, session: AsyncSession = Depends(get_session)):
    batik = await repository.get(session, batik_id)
    if not batik:
        raise NotFoundError("Batik not found")
    for key, value in request.model_dump(exclude_unset=True).items():
        setattr(batik, key, value)
    await session.commit()
    await session.refresh(batik)
    image_service.enrich_batik(batik)
    return ok(BatikRead.model_validate(batik).model_dump(mode="json"), "Batik updated")


@router.delete("/{batik_id}")
async def delete_batik(batik_id: int, session: AsyncSession = Depends(get_session)):
    batik = await repository.get(session, batik_id)
    if not batik:
        raise NotFoundError("Batik not found")
    await repository.soft_delete(session, batik)
    await session.commit()
    return ok(message="Batik deleted")


@router.post("/{batik_id}/publish")
async def publish_batik(batik_id: int, session: AsyncSession = Depends(get_session)):
    batik = await repository.get(session, batik_id)
    if not batik:
        raise NotFoundError("Batik not found")
    batik.is_published = True
    await session.commit()
    return ok(message="Batik published")


@router.post("/{batik_id}/unpublish")
async def unpublish_batik(batik_id: int, session: AsyncSession = Depends(get_session)):
    batik = await repository.get(session, batik_id)
    if not batik:
        raise NotFoundError("Batik not found")
    batik.is_published = False
    await session.commit()
    return ok(message="Batik unpublished")


@router.post("/{batik_id}/regenerate-costume")
async def regenerate_costume(batik_id: int, session: AsyncSession = Depends(get_session)):
    batik = await repository.get(session, batik_id)
    if not batik:
        raise NotFoundError("Batik not found")
    source_job = await session.get(GenerationJob, batik.generation_job_id) if batik.generation_job_id else None
    if not source_job:
        raise NotFoundError("Original generation job not found")
    batch = await session.get(GenerationBatch, source_job.batch_id)
    if not batch:
        raise NotFoundError("Generation batch not found")
    jobs = await combination_service.create_combine_jobs(session, batch=batch, source_batik=batik, source_job=source_job)
    await session.commit()
    return ok({"queued_count": len(jobs)}, "Costume regeneration queued")


@router.post("/{batik_id}/regenerate-video")
async def regenerate_video(batik_id: int, session: AsyncSession = Depends(get_session)):
    batik = await repository.get(session, batik_id)
    if not batik:
        raise NotFoundError("Batik not found")
    if len(batik.costume_files) != 1:
        raise ConflictError("Exactly one costume output is required to generate video")
    costume = batik.costume_files[0]
    source_job = await session.scalar(
        select(GenerationJob)
        .where(
            GenerationJob.job_type == "combine",
            GenerationJob.source_batik_id == batik.id,
            GenerationJob.output_filename == costume.filename,
        )
        .order_by(GenerationJob.completed_at.desc())
    )
    if not source_job:
        raise NotFoundError("Completed combine job not found")
    batch = await session.get(GenerationBatch, source_job.batch_id)
    if not batch:
        raise NotFoundError("Generation batch not found")
    job = await video_generation_service.create_video_job(
        session,
        batch=batch,
        source_batik=batik,
        source_costume=costume,
        source_job=source_job,
        force=True,
    )
    await session.commit()
    return ok({"queued_count": 1, "job_id": job.id}, "Video regeneration queued")
