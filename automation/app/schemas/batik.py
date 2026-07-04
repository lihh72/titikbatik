from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.common import OrmModel, PaginationMeta


class CostumeTemplateMini(OrmModel):
    id: int
    name: str
    filename: str


class LegacyBatikItem(BaseModel):
    id: int
    keyword: str
    warna: str
    style: str
    seed: int
    file_preview: str
    file_costume: str | None
    file_video: str | None
    created_at: str


class LegacyBatikList(BaseModel):
    batiks: list[LegacyBatikItem]
    count: int


class BatikCostumeFileRead(OrmModel):
    id: int
    filename: str
    file_video: str | None = None
    video_url: str | None = None
    template_id: int | None = None
    template: CostumeTemplateMini | None = None
    sort_order: int
    created_at: datetime


class BatikRead(OrmModel):
    id: int
    slug: str
    keyword: str
    warna: str
    style: str
    seed: int
    positive_prompt: str | None = None
    negative_prompt: str | None = None
    file_preview: str
    file_video: str | None = None
    prompt_hash: str
    is_published: bool
    created_at: datetime
    updated_at: datetime
    preview_url: str | None = None
    costume_urls: list[str] = Field(default_factory=list)
    costume_files: list[BatikCostumeFileRead] = Field(default_factory=list)


class BatikListResponse(BaseModel):
    items: list[BatikRead]
    pagination: PaginationMeta


class BatikUpdate(BaseModel):
    keyword: str | None = None
    warna: str | None = None
    style: str | None = None
    is_published: bool | None = None
