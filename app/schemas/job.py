from datetime import datetime

from app.schemas.common import OrmModel


class GenerationJobRead(OrmModel):
    id: str
    batch_id: str
    sequence_number: int
    job_type: str
    status: str
    attempt_count: int
    max_attempts: int
    positive_prompt: str | None = None
    negative_prompt: str | None = None
    prompt_hash: str | None = None
    seed: int | None = None
    workflow_name: str
    comfyui_prompt_id: str | None = None
    source_batik_id: int | None = None
    costume_template_id: int | None = None
    source_costume_file_id: int | None = None
    input_preview_filename: str | None = None
    output_filename: str | None = None
    error_message: str | None = None
    locked_by: str | None = None
    locked_at: datetime | None = None
    available_at: datetime
    started_at: datetime | None = None
    completed_at: datetime | None = None
    created_at: datetime
    updated_at: datetime
    settings_json: dict | None = None
