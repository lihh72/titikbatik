import json

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.database import get_session
from app.core.exceptions import AppError
from app.models import Batik
from app.repositories.batik_repository import BatikRepository
from app.schemas.batik import LegacyBatikItem, LegacyBatikList

router = APIRouter(prefix="/api/batik", tags=["compatibility"])
repository = BatikRepository()


@router.get("/getbatik", response_model=LegacyBatikList)
async def get_batik(
    page: int = Query(default=1, ge=1),
    per_page: int | None = Query(default=None, ge=1),
    session: AsyncSession = Depends(get_session),
) -> LegacyBatikList:
    settings = get_settings()
    page_size = min(per_page or settings.public_page_size, settings.public_max_page_size)
    items, _ = await repository.list_public(
        session,
        page=page,
        per_page=page_size,
        ordering=settings.public_ordering,
    )
    batiks = [_legacy_item(item) for item in items]
    return LegacyBatikList(batiks=batiks, count=len(batiks))


@router.get("/search", response_model=LegacyBatikList)
async def search_batik(
    q: str = Query(...),
    page: int = Query(default=1, ge=1),
    per_page: int | None = Query(default=None, ge=1),
    session: AsyncSession = Depends(get_session),
) -> LegacyBatikList:
    query = q.strip()
    if not query:
        raise AppError("Search query 'q' must not be empty")
    settings = get_settings()
    page_size = min(per_page or settings.public_page_size, settings.public_max_page_size)
    items, _ = await repository.list_public(session, page=page, per_page=page_size, search=query)
    batiks = [_legacy_item(item) for item in items]
    return LegacyBatikList(batiks=batiks, count=len(batiks))


def _legacy_item(item: Batik) -> LegacyBatikItem:
    costume_files = [costume.filename for costume in item.costume_files]
    return LegacyBatikItem(
        id=item.id,
        keyword=item.keyword,
        warna=item.warna,
        style=item.style,
        seed=item.seed,
        file_preview=item.file_preview,
        file_costume=json.dumps(costume_files) if costume_files else None,
        file_video=item.file_video,
        created_at=item.created_at.strftime("%Y-%m-%d %H:%M:%S"),
    )
