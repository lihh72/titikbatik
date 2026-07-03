from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import WordlistCategory, WordlistItem


class WordlistRepository:
    async def active_categories_with_items(self, session: AsyncSession) -> list[WordlistCategory]:
        stmt = (
            select(WordlistCategory)
            .options(selectinload(WordlistCategory.items))
            .where(WordlistCategory.is_active.is_(True))
            .order_by(WordlistCategory.sort_order, WordlistCategory.id)
        )
        return list((await session.scalars(stmt)).all())

    async def list_categories(self, session: AsyncSession) -> list[WordlistCategory]:
        stmt = select(WordlistCategory).order_by(WordlistCategory.sort_order, WordlistCategory.id)
        return list((await session.scalars(stmt)).all())

    async def list_items(self, session: AsyncSession, *, category_id: int | None = None) -> list[WordlistItem]:
        stmt = select(WordlistItem).order_by(WordlistItem.category_id, WordlistItem.id)
        if category_id:
            stmt = stmt.where(WordlistItem.category_id == category_id)
        return list((await session.scalars(stmt)).all())

    async def get_category_by_code(self, session: AsyncSession, code: str) -> WordlistCategory | None:
        return await session.scalar(select(WordlistCategory).where(WordlistCategory.code == code))

    async def clear_category_items(self, session: AsyncSession, category_id: int) -> None:
        await session.execute(delete(WordlistItem).where(WordlistItem.category_id == category_id))
        await session.flush()
