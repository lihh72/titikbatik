from fastapi import APIRouter
from fastapi.responses import FileResponse

from app.services.storage_service import StorageService

router = APIRouter(tags=["images"])
storage = StorageService()


@router.get("/api/image/{filename}")
async def compatibility_image(filename: str):
    stored = storage.resolve_public_file(filename)
    return _file_response(stored)


@router.get("/api/v1/images/{category}/{filename}")
async def image_by_category(category: str, filename: str):
    stored = storage.resolve_public_file(filename, category=category)
    return _file_response(stored)


def _file_response(stored):
    return FileResponse(
        stored.path,
        media_type=stored.content_type,
        headers={
            "ETag": f'"{stored.etag}"',
            "Last-Modified": stored.last_modified,
            "Cache-Control": "public, max-age=604800, immutable",
        },
    )
