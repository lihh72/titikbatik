from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Titik Batik API"
    app_host: str = "0.0.0.0"
    app_port: int = 8000
    app_env: str = "development"
    app_base_url: str = "http://127.0.0.1:8000"

    database_url: str = "sqlite+aiosqlite:///./storage/database/titikbatik.db"

    comfyui_base_url: str = "http://127.0.0.1:8188"
    comfyui_client_id: str = "titikbatik-worker"
    generate_workflow_path: str = "../workflows/generatebatik.json"
    combine_workflow_path: str = "../workflows/combinebatik.json"
    video_workflow_path: str = "../workflows/videobatik.json"

    storage_root: str = "storage"
    storage_input_dir: str = "storage/input"
    storage_preview_dir: str = "storage/output/preview"
    storage_costume_dir: str = "storage/output/costume"
    storage_video_dir: str = "storage/output/video"
    storage_template_dir: str = "storage/templates"
    storage_temp_dir: str = "storage/output/temporary"

    admin_api_key: str = "change-this-secret"
    max_batch_size: int = 500
    max_upload_size_mb: int = 20
    worker_concurrency: int = 1
    worker_poll_interval_seconds: int = 2
    comfyui_request_timeout_seconds: int = 30
    comfyui_prompt_submit_timeout_seconds: int = 120
    comfyui_generation_timeout_seconds: int = 900
    comfyui_max_retries: int = 3

    public_page_size: int = 32
    public_max_page_size: int = 100
    public_ordering: Literal["newest", "random"] = "newest"

    legacy_api_base_url: str = "https://btx.agunghakase.my.id"
    btx_catalogue_url: str = "https://btx.agunghakase.my.id/api/batik/getall"
    btx_catalogue_timeout_seconds: int = 120
    btx_media_timeout_seconds: int = 60
    btx_import_default_limit: int = 10
    btx_import_max_limit: int = 100
    allowed_origins: str = "http://localhost:8000,http://127.0.0.1:8000,http://localhost:3000"

    database_busy_timeout_ms: int = 5000
    image_webp_quality: int = 92
    stale_job_lock_seconds: int = 1800
    worker_id: str = Field(default="titikbatik-worker-local")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @field_validator("max_batch_size", "public_page_size", "public_max_page_size")
    @classmethod
    def positive_int(cls, value: int) -> int:
        if value < 1:
            raise ValueError("must be greater than zero")
        return value

    @property
    def allowed_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]

    def path(self, value: str) -> Path:
        path = Path(value)
        return path.resolve() if path.is_absolute() else (Path.cwd() / path).resolve()

    @property
    def storage_root_path(self) -> Path:
        return self.path(self.storage_root)

    @property
    def storage_input_path(self) -> Path:
        return self.path(self.storage_input_dir)

    @property
    def storage_preview_path(self) -> Path:
        return self.path(self.storage_preview_dir)

    @property
    def storage_costume_path(self) -> Path:
        return self.path(self.storage_costume_dir)

    @property
    def storage_video_path(self) -> Path:
        return self.path(self.storage_video_dir)

    @property
    def storage_template_path(self) -> Path:
        return self.path(self.storage_template_dir)

    @property
    def storage_temp_path(self) -> Path:
        return self.path(self.storage_temp_dir)


@lru_cache
def get_settings() -> Settings:
    return Settings()
