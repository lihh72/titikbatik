from math import ceil

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.database import get_session
from app.core.exceptions import AppError, NotFoundError
from app.repositories.batik_repository import BatikRepository
from app.schemas.batik import BatikListResponse, BatikRead
from app.schemas.common import PaginationMeta
from app.services.image_service import ImageService
from app.utils.responses import ok

router = APIRouter(prefix="/api/v1/batiks", tags=["public batiks"])
repository = BatikRepository()
image_service = ImageService()


@router.get("")
async def list_batiks(
    page: int = Query(default=1, ge=1),
    per_page: int | None = Query(default=None, ge=1),
    session: AsyncSession = Depends(get_session),
):
    settings = get_settings()
    page_size = min(per_page or settings.public_page_size, settings.public_max_page_size)
    items, total = await repository.list_public(session, page=page, per_page=page_size)
    for item in items:
        image_service.enrich_batik(item)
    data = BatikListResponse(
        items=[BatikRead.model_validate(item) for item in items],
        pagination=PaginationMeta(page=page, per_page=page_size, total=total, total_pages=ceil(total / page_size) if total else 0),
    )
    return ok(data.model_dump(mode="json"))


@router.get("/search")
async def search_batiks(
    q: str = Query(...),
    page: int = Query(default=1, ge=1),
    per_page: int | None = Query(default=None, ge=1),
    session: AsyncSession = Depends(get_session),
):
    query = q.strip()
    if not query:
        raise AppError("Search query 'q' must not be empty")
    settings = get_settings()
    page_size = min(per_page or settings.public_page_size, settings.public_max_page_size)
    items, total = await repository.list_public(session, page=page, per_page=page_size, search=query)
    for item in items:
        image_service.enrich_batik(item)
    data = BatikListResponse(
        items=[BatikRead.model_validate(item) for item in items],
        pagination=PaginationMeta(page=page, per_page=page_size, total=total, total_pages=ceil(total / page_size) if total else 0),
    )
    return ok(data.model_dump(mode="json"))


@router.get("/{batik_id}")
async def get_batik(batik_id: int, session: AsyncSession = Depends(get_session)):
    item = await repository.get(session, batik_id)
    if not item or not item.is_published:
        raise NotFoundError("Batik not found")
    image_service.enrich_batik(item)
    return ok(BatikRead.model_validate(item).model_dump(mode="json"))
