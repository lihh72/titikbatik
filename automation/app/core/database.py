import asyncio
from collections.abc import AsyncGenerator, Awaitable, Callable
from datetime import datetime
from typing import Any, TypeVar

from sqlalchemy import DateTime, event
from sqlalchemy.exc import OperationalError
from sqlalchemy.ext.asyncio import AsyncAttrs, AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

from app.core.config import get_settings
from app.utils.time import utcnow

T = TypeVar("T")


class Base(AsyncAttrs, DeclarativeBase):
    pass


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=utcnow, onupdate=utcnow, nullable=False
    )


settings = get_settings()
engine = create_async_engine(settings.database_url, future=True)
async_session_factory = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


@event.listens_for(engine.sync_engine, "connect")
def configure_sqlite(dbapi_connection: Any, _: Any) -> None:
    if "sqlite" not in settings.database_url:
        return
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.execute(f"PRAGMA busy_timeout={settings.database_busy_timeout_ms}")
    cursor.close()


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_factory() as session:
        yield session


async def create_database_schema() -> None:
    import app.models  # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def retry_on_locked(
    operation: Callable[[], Awaitable[T]],
    *,
    retries: int = 3,
    base_delay: float = 0.1,
) -> T:
    for attempt in range(retries + 1):
        try:
            return await operation()
        except OperationalError as exc:
            message = str(exc).lower()
            if "database is locked" not in message or attempt >= retries:
                raise
            await asyncio.sleep(base_delay * (2**attempt))
    raise RuntimeError("unreachable database retry state")
