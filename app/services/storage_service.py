import asyncio
import hashlib
import mimetypes
from dataclasses import dataclass
from datetime import datetime, timezone
from email.utils import format_datetime
from io import BytesIO
from pathlib import Path

from PIL import Image

from app.core.config import Settings, get_settings
from app.core.exceptions import AppError, NotFoundError
from app.utils.filenames import safe_filename


@dataclass(frozen=True)
class StoredFile:
    path: Path
    filename: str
    content_type: str
    etag: str
    last_modified: str


class StorageService:
    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()

    def ensure_directories(self) -> None:
        for path in [
            self.settings.storage_root_path,
            self.settings.storage_input_path,
            self.settings.storage_preview_path,
            self.settings.storage_costume_path,
            self.settings.storage_video_path,
            self.settings.storage_template_path,
            self.settings.storage_temp_path,
        ]:
            path.mkdir(parents=True, exist_ok=True)

    async def save_image_bytes_as_webp(self, data: bytes, *, filename: str, category: str) -> Path:
        target_dir = self.category_dir(category)
        safe_name = safe_filename(filename)
        if not safe_name.lower().endswith(".webp"):
            safe_name = f"{Path(safe_name).stem}.webp"
        target = target_dir / safe_name
        tmp = self.settings.storage_temp_path / f"{safe_name}.tmp"
        target_dir.mkdir(parents=True, exist_ok=True)
        self.settings.storage_temp_path.mkdir(parents=True, exist_ok=True)

        def write_image() -> Path:
            with Image.open(BytesIO(data)) as image:
                image.load()
                image = image.convert("RGB")
                image.save(tmp, format="WEBP", quality=self.settings.image_webp_quality, method=6)
            with Image.open(tmp) as verify:
                verify.verify()
            tmp.replace(target)
            return target

        return await asyncio.to_thread(write_image)

    async def save_local_image_as_webp(self, source: Path, *, filename: str, category: str) -> Path:
        data = await asyncio.to_thread(source.read_bytes)
        return await self.save_image_bytes_as_webp(data, filename=filename, category=category)

    async def save_video_bytes(self, data: bytes, *, filename: str) -> Path:
        try:
            safe_name = safe_filename(filename)
        except ValueError as exc:
            raise AppError("Invalid filename") from exc
        suffix = Path(safe_name).suffix.lower()
        if suffix not in {".mp4", ".webm"}:
            raise AppError("Unsupported video format")
        if len(data) < 32 or not self._valid_video_signature(data, suffix):
            raise AppError("Invalid video output")

        target_dir = self.settings.storage_video_path
        target = target_dir / safe_name
        tmp = self.settings.storage_temp_path / f"{safe_name}.tmp"
        target_dir.mkdir(parents=True, exist_ok=True)
        self.settings.storage_temp_path.mkdir(parents=True, exist_ok=True)

        def write_video() -> Path:
            try:
                tmp.write_bytes(data)
                tmp.replace(target)
                return target
            except Exception:
                tmp.unlink(missing_ok=True)
                raise

        return await asyncio.to_thread(write_video)

    def category_dir(self, category: str) -> Path:
        mapping = {
            "preview": self.settings.storage_preview_path,
            "costume": self.settings.storage_costume_path,
            "video": self.settings.storage_video_path,
            "input": self.settings.storage_input_path,
            "template": self.settings.storage_template_path,
            "temporary": self.settings.storage_temp_path,
        }
        if category not in mapping:
            raise AppError("Unknown storage category")
        return mapping[category]

    def resolve_public_file(self, filename: str, *, category: str | None = None) -> StoredFile:
        try:
            safe_name = safe_filename(filename)
        except ValueError as exc:
            raise AppError("Invalid filename") from exc
        categories = [category] if category else ["preview", "costume", "video", "template", "input"]
        for candidate_category in categories:
            base = self.category_dir(candidate_category)
            path = (base / safe_name).resolve()
            if not self._is_inside(path, base.resolve()):
                continue
            if path.exists() and path.is_file():
                return self._stored_file(path)
        raise NotFoundError("File not found")

    def template_file_path(self, filename: str) -> Path:
        try:
            safe_name = safe_filename(filename)
        except ValueError as exc:
            raise AppError("Invalid template filename") from exc
        path = (self.settings.storage_template_path / safe_name).resolve()
        if not self._is_inside(path, self.settings.storage_template_path.resolve()):
            raise ValueError("Invalid template filename")
        return path

    def _stored_file(self, path: Path) -> StoredFile:
        stat = path.stat()
        digest = hashlib.sha256(f"{path.name}:{stat.st_mtime_ns}:{stat.st_size}".encode()).hexdigest()
        content_type = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
        if path.suffix.lower() == ".webp":
            content_type = "image/webp"
        last_modified = format_datetime(datetime.fromtimestamp(stat.st_mtime, timezone.utc), usegmt=True)
        return StoredFile(path=path, filename=path.name, content_type=content_type, etag=digest, last_modified=last_modified)

    @staticmethod
    def _valid_video_signature(data: bytes, suffix: str) -> bool:
        if suffix == ".mp4":
            return len(data) >= 12 and data[4:8] == b"ftyp"
        if suffix == ".webm":
            return data.startswith(b"\x1a\x45\xdf\xa3")
        return False

    @staticmethod
    def _is_inside(path: Path, base: Path) -> bool:
        try:
            path.relative_to(base)
            return True
        except ValueError:
            return False
