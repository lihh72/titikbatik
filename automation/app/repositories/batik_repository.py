from datetime import date, datetime, time, timedelta

from sqlalchemy import and_, case, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import Batik, BatikCostumeFile
from app.utils.slugs import deduplicate_slug, slugify_batik
from app.utils.time import utcnow


class BatikRepository:
    @staticmethod
    def video_first_ordering():
        has_video = case(
            ((Batik.file_video.is_not(None)) & (Batik.file_video != ""), 1),
            else_=0,
        )
        return (has_video.desc(), Batik.created_at.desc(), Batik.id.desc())

    @staticmethod
    def _public_filters(search: str | None = None, created_date: date | None = None):
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
        if created_date:
            start = datetime.combine(created_date, time.min)
            filters.extend((Batik.created_at >= start, Batik.created_at < start + timedelta(days=1)))
        return filters

    async def list_public(
        self,
        session: AsyncSession,
        *,
        page: int,
        per_page: int,
        search: str | None = None,
        created_date: date | None = None,
        ordering: str = "newest",
    ) -> tuple[list[Batik], int]:
        filters = self._public_filters(search, created_date)

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
            stmt = stmt.order_by(*self.video_first_ordering())
        stmt = stmt.offset((page - 1) * per_page).limit(per_page)
        items = list((await session.scalars(stmt)).all())
        return items, total

    async def public_statistics(
        self,
        session: AsyncSession,
        *,
        search: str | None = None,
        created_date: date | None = None,
    ) -> tuple[int, datetime | None]:
        filters = self._public_filters(search, created_date)

        stmt = select(func.count(Batik.id), func.max(Batik.created_at)).where(*filters)
        count, latest_created_at = (await session.execute(stmt)).one()
        return int(count or 0), latest_created_at

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

    async def find_imported_source(
        self,
        session: AsyncSession,
        *,
        provider: str,
        source_id: str | None,
        media_hash: str | None,
    ) -> Batik | None:
        clauses = []
        if source_id:
            clauses.append(and_(Batik.source_provider == provider, Batik.source_id == source_id))
        if media_hash:
            clauses.append(and_(Batik.source_provider == provider, Batik.source_media_hash == media_hash))
        if not clauses:
            return None
        return await session.scalar(select(Batik).where(or_(*clauses), Batik.deleted_at.is_(None)))

    async def soft_delete(self, session: AsyncSession, batik: Batik) -> Batik:
        batik.deleted_at = utcnow()
        batik.is_published = False
        await session.flush()
        return batik
