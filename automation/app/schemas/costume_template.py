from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.common import OrmModel


class CostumeTemplateCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    filename: str = Field(min_length=1, max_length=255)
    description: str | None = None
    is_active: bool = True
    sort_order: int = 0


class CostumeTemplateUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    filename: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    is_active: bool | None = None
    sort_order: int | None = None


class CostumeTemplateRead(OrmModel):
    id: int
    name: str
    filename: str
    description: str | None = None
    is_active: bool
    sort_order: int
    created_at: datetime
    updated_at: datetime
