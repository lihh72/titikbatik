from datetime import datetime

from pydantic import Field

from app.schemas.common import OrmModel


class BtxImportJobRead(OrmModel):
    id: int
    status: str
    requested_limit: int
    examined: int
    imported: int
    skipped_duplicates: int
    failed: int
    errors: list[str] = Field(validation_alias="errors_json")
    error_message: str | None = None
    attempt_count: int
    max_attempts: int
    started_at: datetime | None = None
    completed_at: datetime | None = None
    created_at: datetime
    updated_at: datetime
