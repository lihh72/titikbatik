from datetime import datetime
from typing import Any, Generic, TypeVar

from pydantic import BaseModel, ConfigDict, Field

T = TypeVar("T")


class APIResponse(BaseModel, Generic[T]):
    success: bool = True
    message: str = "Operation completed successfully"
    data: T | dict[str, Any] = Field(default_factory=dict)


class ErrorResponse(BaseModel):
    success: bool = False
    message: str
    errors: dict[str, Any] | list[Any] = Field(default_factory=dict)


class PaginationMeta(BaseModel):
    page: int
    per_page: int
    total: int
    total_pages: int


class OrmModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class Timestamped(OrmModel):
    created_at: datetime
    updated_at: datetime | None = None
