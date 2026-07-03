from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.exceptions import NotFoundError
from app.core.security import require_admin_key
from app.models import GenerationJob
from app.schemas.job import GenerationJobRead
from app.utils.responses import ok

router = APIRouter(prefix="/api/admin/generation-jobs", tags=["admin jobs"], dependencies=[Depends(require_admin_key)])


@router.get("/{job_id}")
async def get_job(job_id: str, session: AsyncSession = Depends(get_session)):
    job = await session.get(GenerationJob, job_id)
    if not job:
        raise NotFoundError("Generation job not found")
    return ok(GenerationJobRead.model_validate(job).model_dump(mode="json"))
