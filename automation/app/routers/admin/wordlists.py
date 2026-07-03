from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.exceptions import NotFoundError
from app.core.security import require_admin_key
from app.models import WordlistCategory, WordlistItem
from app.repositories.wordlist_repository import WordlistRepository
from app.schemas.wordlist import (
    WordlistCategoryCreate,
    WordlistCategoryRead,
    WordlistCategoryUpdate,
    WordlistImportRequest,
    WordlistItemCreate,
    WordlistItemRead,
    WordlistItemUpdate,
)
from app.utils.responses import ok

router = APIRouter(prefix="/api/admin", tags=["admin wordlists"], dependencies=[Depends(require_admin_key)])
repository = WordlistRepository()


@router.get("/wordlist-categories")
async def list_categories(session: AsyncSession = Depends(get_session)):
    categories = await repository.list_categories(session)
    return ok([WordlistCategoryRead.model_validate(category).model_dump(mode="json") for category in categories])


@router.post("/wordlist-categories", status_code=status.HTTP_201_CREATED)
async def create_category(request: WordlistCategoryCreate, session: AsyncSession = Depends(get_session)):
    category = WordlistCategory(**request.model_dump())
    session.add(category)
    await session.commit()
    await session.refresh(category)
    return ok(WordlistCategoryRead.model_validate(category).model_dump(mode="json"), "Wordlist category created")


@router.patch("/wordlist-categories/{category_id}")
async def update_category(category_id: int, request: WordlistCategoryUpdate, session: AsyncSession = Depends(get_session)):
    category = await session.get(WordlistCategory, category_id)
    if not category:
        raise NotFoundError("Wordlist category not found")
    for key, value in request.model_dump(exclude_unset=True).items():
        setattr(category, key, value)
    await session.commit()
    await session.refresh(category)
    return ok(WordlistCategoryRead.model_validate(category).model_dump(mode="json"), "Wordlist category updated")


@router.delete("/wordlist-categories/{category_id}")
async def delete_category(category_id: int, session: AsyncSession = Depends(get_session)):
    category = await session.get(WordlistCategory, category_id)
    if not category:
        raise NotFoundError("Wordlist category not found")
    await session.delete(category)
    await session.commit()
    return ok(message="Wordlist category deleted")


@router.get("/wordlist-items")
async def list_items(category_id: int | None = Query(default=None), session: AsyncSession = Depends(get_session)):
    items = await repository.list_items(session, category_id=category_id)
    return ok([WordlistItemRead.model_validate(item).model_dump(mode="json") for item in items])


@router.post("/wordlist-items", status_code=status.HTTP_201_CREATED)
async def create_item(request: WordlistItemCreate, session: AsyncSession = Depends(get_session)):
    if not await session.get(WordlistCategory, request.category_id):
        raise NotFoundError("Wordlist category not found")
    item = WordlistItem(**request.model_dump())
    session.add(item)
    await session.commit()
    await session.refresh(item)
    return ok(WordlistItemRead.model_validate(item).model_dump(mode="json"), "Wordlist item created")


@router.patch("/wordlist-items/{item_id}")
async def update_item(item_id: int, request: WordlistItemUpdate, session: AsyncSession = Depends(get_session)):
    item = await session.get(WordlistItem, item_id)
    if not item:
        raise NotFoundError("Wordlist item not found")
    for key, value in request.model_dump(exclude_unset=True).items():
        setattr(item, key, value)
    await session.commit()
    await session.refresh(item)
    return ok(WordlistItemRead.model_validate(item).model_dump(mode="json"), "Wordlist item updated")


@router.delete("/wordlist-items/{item_id}")
async def delete_item(item_id: int, session: AsyncSession = Depends(get_session)):
    item = await session.get(WordlistItem, item_id)
    if not item:
        raise NotFoundError("Wordlist item not found")
    await session.delete(item)
    await session.commit()
    return ok(message="Wordlist item deleted")


@router.post("/wordlist-items/import")
async def import_items(request: WordlistImportRequest, session: AsyncSession = Depends(get_session)):
    category = await repository.get_category_by_code(session, request.category_code)
    if not category:
        raise NotFoundError("Wordlist category not found")
    if request.replace:
        await repository.clear_category_items(session, category.id)
    for value in request.items:
        session.add(WordlistItem(category_id=category.id, value=value, weight=1.0, is_active=True))
    await session.commit()
    return ok({"count": len(request.items)}, "Wordlist items imported")
