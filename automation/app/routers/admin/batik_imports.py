from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.security import require_admin_key
from app.schemas.batik_import import BtxImportRequest
from app.schemas.btx_import_job import BtxImportJobRead
from app.repositories.btx_import_job_repository import BtxImportJobRepository
from app.services.btx_import_service import BtxImportService
from app.utils.responses import ok


router = APIRouter(
    prefix="/api/admin/batik-imports",
    tags=["admin batik imports"],
    dependencies=[Depends(require_admin_key)],
)


@router.post("/btx")
async def import_btx_batiks(request: BtxImportRequest, session: AsyncSession = Depends(get_session)):
    job = await BtxImportJobRepository().enqueue_or_reuse(session, limit=request.limit)
    await session.commit()
    return ok(BtxImportJobRead.model_validate(job).model_dump(mode="json"), "BTX import queued")


@router.get("/btx")
async def get_btx_import(session: AsyncSession = Depends(get_session)):
    job = await BtxImportJobRepository().get_current(session)
    data = BtxImportJobRead.model_validate(job).model_dump(mode="json") if job else None
    return ok(data)
