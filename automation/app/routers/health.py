from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.models import AppSetting
from app.services.comfyui_service import ComfyUIService

router = APIRouter(tags=["health"])


@router.get("/health")
async def health(session: AsyncSession = Depends(get_session)):
    database_status = "connected"
    try:
        await session.execute(text("SELECT 1"))
    except Exception:  # noqa: BLE001
        database_status = "disconnected"
    comfyui_status = "connected" if await ComfyUIService().check_health() else "disconnected"
    worker_setting = await session.get(AppSetting, "worker_heartbeat")
    worker_status = "connected" if worker_setting else "unknown"
    healthy = database_status == "connected"
    return {
        "success": healthy,
        "status": "healthy" if healthy else "unhealthy",
        "services": {
            "api": "connected",
            "database": database_status,
            "comfyui": comfyui_status,
            "worker": worker_status,
        },
    }


@router.get("/health/live")
async def live():
    return {"success": True, "status": "live"}


@router.get("/health/ready")
async def ready(session: AsyncSession = Depends(get_session)):
    await session.execute(text("SELECT 1"))
    return {"success": True, "status": "ready"}
