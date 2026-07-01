from pathlib import Path

import pytest
from PIL import Image

from app.core.config import Settings
from app.core.exceptions import AppError
from app.services.storage_service import StorageService


@pytest.mark.asyncio
async def test_storage_saves_webp_and_resolves_public_file(tmp_path):
    settings = Settings(
        storage_root=str(tmp_path / "storage"),
        storage_input_dir=str(tmp_path / "storage/input"),
        storage_preview_dir=str(tmp_path / "storage/output/preview"),
        storage_costume_dir=str(tmp_path / "storage/output/costume"),
        storage_video_dir=str(tmp_path / "storage/output/video"),
        storage_template_dir=str(tmp_path / "storage/templates"),
        storage_temp_dir=str(tmp_path / "storage/output/temporary"),
    )
    storage = StorageService(settings)
    storage.ensure_directories()
    source = tmp_path / "source.png"
    Image.new("RGB", (8, 8), color="blue").save(source)

    path = await storage.save_local_image_as_webp(source, filename="safe_preview.webp", category="preview")
    resolved = storage.resolve_public_file("safe_preview.webp")

    assert path.exists()
    assert resolved.content_type == "image/webp"


def test_storage_rejects_path_traversal(tmp_path):
    settings = Settings(storage_root=str(tmp_path / "storage"))
    storage = StorageService(settings)
    with pytest.raises(AppError):
        storage.resolve_public_file("../secret.webp")


def test_storage_rejects_unknown_category(tmp_path):
    settings = Settings(storage_root=str(tmp_path / "storage"))
    storage = StorageService(settings)
    with pytest.raises(AppError, match="Unknown storage category"):
        storage.resolve_public_file("safe.webp", category="unknown")


def video_storage(tmp_path) -> StorageService:
    settings = Settings(
        storage_root=str(tmp_path / "storage"),
        storage_input_dir=str(tmp_path / "storage/input"),
        storage_preview_dir=str(tmp_path / "storage/output/preview"),
        storage_costume_dir=str(tmp_path / "storage/output/costume"),
        storage_video_dir=str(tmp_path / "storage/output/video"),
        storage_template_dir=str(tmp_path / "storage/templates"),
        storage_temp_dir=str(tmp_path / "storage/output/temporary"),
    )
    storage = StorageService(settings)
    storage.ensure_directories()
    return storage


@pytest.mark.asyncio
async def test_storage_saves_mp4_atomically(tmp_path):
    storage = video_storage(tmp_path)
    data = b"\x00\x00\x00\x18ftypisom" + b"0" * 128

    path = await storage.save_video_bytes(data, filename="result.mp4")

    assert path.read_bytes() == data
    assert path.parent == storage.settings.storage_video_path
    assert not list(storage.settings.storage_temp_path.glob("*.tmp"))


@pytest.mark.asyncio
async def test_storage_saves_webm_with_ebml_signature(tmp_path):
    storage = video_storage(tmp_path)
    data = b"\x1a\x45\xdf\xa3" + b"0" * 128

    path = await storage.save_video_bytes(data, filename="result.webm")

    assert path.read_bytes() == data


@pytest.mark.asyncio
@pytest.mark.parametrize(
    ("filename", "data", "message"),
    [
        ("result.avi", b"0" * 128, "Unsupported video format"),
        ("result.mp4", b"not-an-mp4" * 16, "Invalid video output"),
        ("../result.mp4", b"\x00\x00\x00\x18ftypisom" + b"0" * 128, "Invalid filename"),
    ],
)
async def test_storage_rejects_invalid_video_output(tmp_path, filename, data, message):
    storage = video_storage(tmp_path)

    with pytest.raises(AppError, match=message):
        await storage.save_video_bytes(data, filename=filename)
