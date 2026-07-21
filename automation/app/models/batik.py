from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, Boolean, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.costume_file import BatikCostumeFile
    from app.models.generation_job import GenerationJob


class Batik(TimestampMixin, Base):
    __tablename__ = "batiks"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    keyword: Mapped[str] = mapped_column(Text, nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    warna: Mapped[str] = mapped_column(String(255), nullable=False)
    style: Mapped[str] = mapped_column(String(255), nullable=False)
    seed: Mapped[int] = mapped_column(BigInteger, nullable=False)
    positive_prompt: Mapped[str] = mapped_column(Text, nullable=False)
    negative_prompt: Mapped[str] = mapped_column(Text, nullable=False)
    file_preview: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    file_video: Mapped[str | None] = mapped_column(String(255), nullable=True)
    prompt_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    source_provider: Mapped[str | None] = mapped_column(String(32), nullable=True)
    source_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    source_media_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)
    generation_job_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("generation_jobs.id", ondelete="SET NULL"), nullable=True
    )
    is_published: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    costume_files: Mapped[list["BatikCostumeFile"]] = relationship(
        back_populates="batik", cascade="all, delete-orphan", lazy="selectin", order_by="BatikCostumeFile.sort_order"
    )
    generation_job: Mapped["GenerationJob | None"] = relationship(
        back_populates="batik", lazy="selectin", foreign_keys=[generation_job_id]
    )
