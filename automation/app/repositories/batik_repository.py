from datetime import datetime

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import Batik, BatikCostumeFile
from app.utils.slugs import deduplicate_slug, slugify_batik
from app.utils.time import utcnow


class BatikRepository:
    async def list_public(
        self,
        session: AsyncSession,
        *,
        page: int,
        per_page: int,
        search: str | None = None,
        ordering: str = "newest",
    ) -> tuple[list[Batik], int]:
        filters = [Batik.is_published.is_(True), Batik.file_preview.is_not(None), Batik.deleted_at.is_(None)]
        if search:
            pattern = f"%{search.lower()}%"
            filters.append(
                or_(
                    func.lower(Batik.keyword).like(pattern),
                    func.lower(Batik.warna).like(pattern),
                    func.lower(Batik.style).like(pattern),
                )
            )

        count_stmt = select(func.count(Batik.id)).where(*filters)
        total = int(await session.scalar(count_stmt) or 0)

        stmt = (
            select(Batik)
            .options(selectinload(Batik.costume_files).selectinload(BatikCostumeFile.template))
            .where(*filters)
        )
        if ordering == "random":
            stmt = stmt.order_by(func.random())
        else:
            stmt = stmt.order_by(Batik.created_at.desc(), Batik.id.desc())
        stmt = stmt.offset((page - 1) * per_page).limit(per_page)
        items = list((await session.scalars(stmt)).all())
        return items, total

    async def get(self, session: AsyncSession, batik_id: int) -> Batik | None:
        stmt = (
            select(Batik)
            .options(selectinload(Batik.costume_files).selectinload(BatikCostumeFile.template))
            .where(Batik.id == batik_id, Batik.deleted_at.is_(None))
        )
        return await session.scalar(stmt)

    async def get_by_slug(self, session: AsyncSession, slug: str) -> Batik | None:
        stmt = (
            select(Batik)
            .options(selectinload(Batik.costume_files).selectinload(BatikCostumeFile.template))
            .where(Batik.slug == slug, Batik.deleted_at.is_(None))
        )
        return await session.scalar(stmt)

    async def next_slug(self, session: AsyncSession, keyword: str) -> str:
        base = slugify_batik(keyword)
        existing = set(
            (await session.scalars(select(Batik.slug).where(Batik.slug.like(f"{base}%")))).all()
        )
        return deduplicate_slug(base, existing)

    async def find_by_prompt_hash(self, session: AsyncSession, prompt_hash: str) -> Batik | None:
        return await session.scalar(select(Batik).where(Batik.prompt_hash == prompt_hash))

    async def soft_delete(self, session: AsyncSession, batik: Batik) -> Batik:
        batik.deleted_at = utcnow()
        batik.is_published = False
        await session.flush()
        return batik
