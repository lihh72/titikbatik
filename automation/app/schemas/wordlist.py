from pydantic import BaseModel, Field

from app.schemas.common import OrmModel


class WordlistCategoryBase(BaseModel):
    code: str = Field(min_length=1, max_length=80)
    name: str = Field(min_length=1, max_length=120)
    description: str | None = None
    is_required: bool = True
    selection_min: int = Field(default=1, ge=0)
    selection_max: int = Field(default=1, ge=1)
    sort_order: int = 0
    is_active: bool = True


class WordlistCategoryCreate(WordlistCategoryBase):
    pass


class WordlistCategoryUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    description: str | None = None
    is_required: bool | None = None
    selection_min: int | None = Field(default=None, ge=0)
    selection_max: int | None = Field(default=None, ge=1)
    sort_order: int | None = None
    is_active: bool | None = None


class WordlistCategoryRead(OrmModel):
    id: int
    code: str
    name: str
    description: str | None = None
    is_required: bool
    selection_min: int
    selection_max: int
    sort_order: int
    is_active: bool


class WordlistItemBase(BaseModel):
    category_id: int
    value: str = Field(min_length=1, max_length=255)
    label: str | None = None
    weight: float = Field(default=1.0, gt=0)
    is_active: bool = True
    metadata_json: dict | None = None


class WordlistItemCreate(WordlistItemBase):
    pass


class WordlistItemUpdate(BaseModel):
    category_id: int | None = None
    value: str | None = Field(default=None, min_length=1, max_length=255)
    label: str | None = None
    weight: float | None = Field(default=None, gt=0)
    is_active: bool | None = None
    metadata_json: dict | None = None


class WordlistItemRead(OrmModel):
    id: int
    category_id: int
    value: str
    label: str | None = None
    weight: float
    is_active: bool
    metadata_json: dict | None = None


class WordlistImportRequest(BaseModel):
    category_code: str
    items: list[str]
    replace: bool = False
