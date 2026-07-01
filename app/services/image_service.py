from app.core.config import get_settings
from app.models import Batik


class ImageService:
    def image_url(self, filename: str) -> str:
        return f"/api/image/{filename}"

    def enrich_batik(self, batik: Batik) -> None:
        batik.preview_url = self.image_url(batik.file_preview)  # type: ignore[attr-defined]
        batik.costume_urls = [self.image_url(costume.filename) for costume in batik.costume_files]  # type: ignore[attr-defined]
        for costume in batik.costume_files:
            costume.video_url = self.image_url(costume.file_video) if costume.file_video else None  # type: ignore[attr-defined]

    def absolute_image_url(self, filename: str) -> str:
        settings = get_settings()
        return f"{settings.app_base_url.rstrip('/')}/api/image/{filename}"
