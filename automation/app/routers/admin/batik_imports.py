from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.security import require_admin_key
from app.schemas.batik_import import BtxImportRequest
from app.services.btx_import_service import BtxImportService
from app.utils.responses import ok


router = APIRouter(
    prefix="/api/admin/batik-imports",
    tags=["admin batik imports"],
    dependencies=[Depends(require_admin_key)],
)


@router.post("/btx")
async def import_btx_batiks(request: BtxImportRequest, session: AsyncSession = Depends(get_session)):
    summary = await BtxImportService().import_pairs(session, limit=request.limit)
    return ok(summary.model_dump(), "BTX import completed")
