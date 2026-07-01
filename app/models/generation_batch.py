from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.utils.time import utcnow


class GenerationBatch(Base):
    __tablename__ = "generation_batches"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    requested_count: Mapped[int] = mapped_column(Integer, nullable=False)
    generate_count: Mapped[int] = mapped_column(Integer, nullable=False)
    combine_enabled: Mapped[bool] = mapped_column(default=True, nullable=False)
    video_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    costume_template_mode: Mapped[str] = mapped_column(String(30), default="all", nullable=False)
    status: Mapped[str] = mapped_column(String(40), index=True, nullable=False)
    queued_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    running_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    completed_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    failed_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    cancelled_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    requested_by: Mapped[str | None] = mapped_column(String(120), nullable=True)
    settings_json: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)
    started_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    jobs = relationship("GenerationJob", back_populates="batch", cascade="all, delete-orphan", lazy="selectin")
