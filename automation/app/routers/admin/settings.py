from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.security import require_admin_key
from app.models import AppSetting
from app.services.comfyui_service import ComfyUIService
from app.services.generation_service import GenerationService
from app.utils.responses import ok

router = APIRouter(prefix="/api/admin", tags=["admin settings"], dependencies=[Depends(require_admin_key)])
generation_service = GenerationService()


@router.get("/dashboard")
async def dashboard(session: AsyncSession = Depends(get_session)):
    data = await generation_service.dashboard(session)
    data["comfyui"] = "connected" if await ComfyUIService().check_health() else "disconnected"
    heartbeat = await session.get(AppSetting, "worker_heartbeat")
    data["last_worker_heartbeat"] = heartbeat.value_json if heartbeat else None
    return ok(data)


@router.get("/settings")
async def list_settings(session: AsyncSession = Depends(get_session)):
    settings = list((await session.scalars(select(AppSetting).order_by(AppSetting.key))).all())
    return ok({setting.key: setting.value_json for setting in settings})


@router.put("/settings/{key}")
async def put_setting(key: str, value: dict, session: AsyncSession = Depends(get_session)):
    setting = await session.get(AppSetting, key)
    if setting:
        setting.value_json = value
    else:
        session.add(AppSetting(key=key, value_json=value))
    await session.commit()
    return ok({"key": key, "value": value}, "Setting saved")
