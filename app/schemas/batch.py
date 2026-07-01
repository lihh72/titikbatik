from datetime import datetime

from pydantic import BaseModel, computed_field

from app.schemas.common import OrmModel


class GenerationBatchRead(OrmModel):
    id: str
    requested_count: int
    generate_count: int
    combine_enabled: bool
    video_enabled: bool
    costume_template_mode: str
    status: str
    queued_count: int
    running_count: int
    completed_count: int
    failed_count: int
    cancelled_count: int
    requested_by: str | None = None
    settings_json: dict
    created_at: datetime
    started_at: datetime | None = None
    completed_at: datetime | None = None

    @computed_field
    @property
    def progress_percent(self) -> float:
        total = self.queued_count + self.running_count + self.completed_count + self.failed_count + self.cancelled_count
        if total <= 0:
            return 0.0
        return round((self.completed_count / total) * 100, 2)


class GenerationBatchQueued(BaseModel):
    batch_id: str
    requested_count: int
    status: str
    status_url: str
