from datetime import datetime

from fastapi import APIRouter, Depends, File, Form, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.database import get_session
from app.core.exceptions import AppError, ConflictError, NotFoundError
from app.core.security import require_admin_key
from app.models import CostumeTemplate
from app.schemas.costume_template import CostumeTemplateCreate, CostumeTemplateRead, CostumeTemplateUpdate
from app.services.storage_service import StorageService
from app.utils.filenames import random_token, slugify
from app.utils.responses import ok
from app.utils.time import utcnow

router = APIRouter(prefix="/api/admin/costume-templates", tags=["admin costume templates"], dependencies=[Depends(require_admin_key)])


@router.get("")
async def list_templates(session: AsyncSession = Depends(get_session)):
    templates = list(
        (
            await session.scalars(
                select(CostumeTemplate)
                .where(CostumeTemplate.deleted_at.is_(None))
                .order_by(CostumeTemplate.sort_order, CostumeTemplate.id)
            )
        ).all()
    )
    return ok([CostumeTemplateRead.model_validate(template).model_dump(mode="json") for template in templates])


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_template(request: CostumeTemplateCreate, session: AsyncSession = Depends(get_session)):
    template = CostumeTemplate(**request.model_dump())
    session.add(template)
    await session.commit()
    await session.refresh(template)
    return ok(CostumeTemplateRead.model_validate(template).model_dump(mode="json"), "Costume template created")


@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_template(
    file: UploadFile = File(...),
    name: str = Form(...),
    description: str | None = Form(default=None),
    is_active: bool = Form(default=True),
    sort_order: int = Form(default=0),
    session: AsyncSession = Depends(get_session),
):
    settings = get_settings()
    data = await file.read()
    max_size = settings.max_upload_size_mb * 1024 * 1024
    if not data:
        raise AppError("Uploaded file is empty")
    if len(data) > max_size:
        raise AppError(f"Uploaded file exceeds {settings.max_upload_size_mb} MB")

    filename = f"{slugify(name)}_{random_token(8)}.webp"
    storage = StorageService(settings)
    storage.ensure_directories()
    saved_path = await storage.save_image_bytes_as_webp(data, filename=filename, category="template")
    template = CostumeTemplate(
        name=name,
        filename=saved_path.name,
        description=description,
        is_active=is_active,
        sort_order=sort_order,
    )
    session.add(template)
    try:
        await session.commit()
    except Exception as exc:
        saved_path.unlink(missing_ok=True)
        raise ConflictError("Unable to save costume template") from exc
    await session.refresh(template)
    return ok(CostumeTemplateRead.model_validate(template).model_dump(mode="json"), "Costume template uploaded")


@router.patch("/{template_id}")
async def update_template(template_id: int, request: CostumeTemplateUpdate, session: AsyncSession = Depends(get_session)):
    template = await session.get(CostumeTemplate, template_id)
    if not template or template.deleted_at:
        raise NotFoundError("Costume template not found")
    for key, value in request.model_dump(exclude_unset=True).items():
        setattr(template, key, value)
    await session.commit()
    await session.refresh(template)
    return ok(CostumeTemplateRead.model_validate(template).model_dump(mode="json"), "Costume template updated")


@router.delete("/{template_id}")
async def delete_template(template_id: int, session: AsyncSession = Depends(get_session)):
    template = await session.get(CostumeTemplate, template_id)
    if not template or template.deleted_at:
        raise NotFoundError("Costume template not found")
    template.is_active = False
    template.deleted_at = utcnow()
    await session.commit()
    return ok(message="Costume template deleted")
