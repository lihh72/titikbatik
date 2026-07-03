from datetime import datetime

from sqlalchemy import BigInteger, DateTime, ForeignKey, Integer, JSON, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.utils.time import utcnow


class GenerationJob(Base):
    __tablename__ = "generation_jobs"
    __table_args__ = (UniqueConstraint("batch_id", "sequence_number", name="uq_generation_jobs_batch_sequence"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    batch_id: Mapped[str] = mapped_column(ForeignKey("generation_batches.id", ondelete="CASCADE"), index=True)
    sequence_number: Mapped[int] = mapped_column(Integer, nullable=False)
    job_type: Mapped[str] = mapped_column(String(20), index=True, nullable=False)
    status: Mapped[str] = mapped_column(String(30), index=True, nullable=False)
    attempt_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    max_attempts: Mapped[int] = mapped_column(Integer, default=3, nullable=False)
    positive_prompt: Mapped[str | None] = mapped_column(Text, nullable=True)
    negative_prompt: Mapped[str | None] = mapped_column(Text, nullable=True)
    prompt_hash: Mapped[str | None] = mapped_column(String(64), index=True, nullable=True)
    seed: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    workflow_name: Mapped[str] = mapped_column(String(80), nullable=False)
    comfyui_prompt_id: Mapped[str | None] = mapped_column(String(120), nullable=True)
    source_batik_id: Mapped[int | None] = mapped_column(ForeignKey("batiks.id", ondelete="SET NULL"), nullable=True)
    costume_template_id: Mapped[int | None] = mapped_column(
        ForeignKey("costume_templates.id", ondelete="SET NULL"), nullable=True
    )
    source_costume_file_id: Mapped[int | None] = mapped_column(
        ForeignKey("batik_costume_files.id", ondelete="SET NULL"), nullable=True
    )
    input_preview_filename: Mapped[str | None] = mapped_column(String(255), nullable=True)
    output_filename: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    locked_by: Mapped[str | None] = mapped_column(String(120), nullable=True)
    locked_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    available_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, index=True, nullable=False)
    started_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=utcnow, onupdate=utcnow, nullable=False
    )
    settings_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    batch = relationship("GenerationBatch", back_populates="jobs")
    batik = relationship("Batik", back_populates="generation_job", foreign_keys="Batik.generation_job_id", uselist=False)
    source_batik = relationship("Batik", foreign_keys=[source_batik_id])
    costume_template = relationship("CostumeTemplate")
    source_costume_file = relationship("BatikCostumeFile", foreign_keys=[source_costume_file_id])
