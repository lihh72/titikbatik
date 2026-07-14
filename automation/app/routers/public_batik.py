from datetime import date
from math import ceil

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.database import get_session
from app.core.exceptions import AppError, NotFoundError
from app.repositories.batik_repository import BatikRepository
from app.schemas.batik import BatikListResponse, BatikRead, BatikStatisticsResponse
from app.schemas.common import PaginationMeta
from app.services.image_service import ImageService
from app.utils.responses import ok

router = APIRouter(prefix="/api/v1/batiks", tags=["public batiks"])
statistics_router = APIRouter(prefix="/api/v1/catalog", tags=["public batik statistics"])
repository = BatikRepository()
image_service = ImageService()


@router.get("")
async def list_batiks(
    page: int = Query(default=1, ge=1),
    per_page: int | None = Query(default=None, ge=1),
    created_date: date | None = Query(default=None, alias="date"),
    session: AsyncSession = Depends(get_session),
):
    settings = get_settings()
    page_size = min(per_page or settings.public_page_size, settings.public_max_page_size)
    items, total = await repository.list_public(
        session,
        page=page,
        per_page=page_size,
        created_date=created_date,
    )
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
    created_date: date | None = Query(default=None, alias="date"),
    session: AsyncSession = Depends(get_session),
):
    query = q.strip()
    if not query:
        raise AppError("Search query 'q' must not be empty")
    settings = get_settings()
    page_size = min(per_page or settings.public_page_size, settings.public_max_page_size)
    items, total = await repository.list_public(
        session,
        page=page,
        per_page=page_size,
        search=query,
        created_date=created_date,
    )
    for item in items:
        image_service.enrich_batik(item)
    data = BatikListResponse(
        items=[BatikRead.model_validate(item) for item in items],
        pagination=PaginationMeta(page=page, per_page=page_size, total=total, total_pages=ceil(total / page_size) if total else 0),
    )
    return ok(data.model_dump(mode="json"))


@statistics_router.get("/batiks/statistics")
async def get_batik_statistics(
    q: str | None = Query(default=None, min_length=1, pattern=r".*\S.*"),
    created_date: date | None = Query(default=None, alias="date"),
    session: AsyncSession = Depends(get_session),
):
    query = q.strip() if q else None
    count, latest_created_at = await repository.public_statistics(
        session,
        search=query,
        created_date=created_date,
    )
    data = BatikStatisticsResponse(
        count=count,
        latest_date=latest_created_at.date() if latest_created_at else None,
        query=query,
        date=created_date,
    )
    return ok(data.model_dump(mode="json"))


@router.get("/{slug}")
async def get_batik(slug: str, session: AsyncSession = Depends(get_session)):
    item = await repository.get_by_slug(session, slug)
    if not item or not item.is_published:
        raise NotFoundError("Batik not found")
    image_service.enrich_batik(item)
    return ok(BatikRead.model_validate(item).model_dump(mode="json"))
