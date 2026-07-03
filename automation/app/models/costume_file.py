from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.utils.time import utcnow


class BatikCostumeFile(Base):
    __tablename__ = "batik_costume_files"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    batik_id: Mapped[int] = mapped_column(ForeignKey("batiks.id", ondelete="CASCADE"), index=True, nullable=False)
    filename: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    file_video: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)
    template_id: Mapped[int | None] = mapped_column(ForeignKey("costume_templates.id", ondelete="SET NULL"), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)

    batik = relationship("Batik", back_populates="costume_files")
    template = relationship("CostumeTemplate")
