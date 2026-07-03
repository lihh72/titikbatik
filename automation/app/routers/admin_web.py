from pathlib import Path

from fastapi import APIRouter
from fastapi.responses import FileResponse, RedirectResponse


router = APIRouter(tags=["admin web"])
WEB_ROOT = Path(__file__).resolve().parents[1] / "web"


@router.get("/admin", include_in_schema=False)
async def admin_index():
    return FileResponse(WEB_ROOT / "index.html")


@router.get("/admin/", include_in_schema=False)
async def admin_index_slash():
    return RedirectResponse("/admin")
