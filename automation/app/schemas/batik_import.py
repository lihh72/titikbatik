from pydantic import BaseModel, Field


class BtxImportRequest(BaseModel):
    limit: int = Field(default=10, ge=1, le=100)


class BtxImportSummary(BaseModel):
    requested_limit: int
    examined: int = 0
    imported: int = 0
    skipped_duplicates: int = 0
    failed: int = 0
    errors: list[str] = Field(default_factory=list)
