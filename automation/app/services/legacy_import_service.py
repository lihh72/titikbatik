import json
from pathlib import Path
from typing import Any

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, get_settings
from app.models import Batik, BatikCostumeFile
from app.services.storage_service import StorageService
from app.utils.hashing import stable_hash


class LegacyImportService:
    def __init__(self, settings: Settings | None = None, storage: StorageService | None = None) -> None:
        self.settings = settings or get_settings()
        self.storage = storage or StorageService(self.settings)

    async def import_pages(
        self,
        session: AsyncSession,
        *,
        start_page: int = 1,
        max_pages: int = 1,
        download_images: bool = False,
        dry_run: bool = False,
    ) -> dict[str, Any]:
        imported = 0
        skipped = 0
        failed: list[dict[str, Any]] = []
        async with httpx.AsyncClient(base_url=self.settings.legacy_api_base_url, timeout=30) as client:
            for page in range(start_page, start_page + max_pages):
                response = await client.get("/api/batik/getbatik", params={"page": page})
                response.raise_for_status()
                payload = response.json()
                items = payload.get("batiks", [])
                if not items:
                    break
                for item in items:
                    try:
                        existing = await session.scalar(select(Batik).where(Batik.file_preview == item.get("file_preview")))
                        if existing:
                            skipped += 1
                            continue
                        if dry_run:
                            imported += 1
                            continue
                        preview_name = item["file_preview"]
                        costume_names = self._parse_costumes(item.get("file_costume"))
                        if download_images:
                            await self._download_image(client, preview_name, "preview")
                            for costume in costume_names:
                                await self._download_image(client, costume, "costume")
                        batik = Batik(
                            keyword=item.get("keyword") or "",
                            warna=item.get("warna") or "",
                            style=item.get("style") or "",
                            seed=int(item.get("seed") or 0),
                            positive_prompt=item.get("keyword") or "",
                            negative_prompt="",
                            file_preview=preview_name,
                            file_video=item.get("file_video"),
                            prompt_hash=stable_hash({"legacy_id": item.get("id"), "file_preview": preview_name}),
                            is_published=True,
                        )
                        session.add(batik)
                        await session.flush()
                        for index, costume_name in enumerate(costume_names, start=1):
                            session.add(
                                BatikCostumeFile(
                                    batik_id=batik.id,
                                    filename=costume_name,
                                    sort_order=index,
                                )
                            )
                        imported += 1
                    except Exception as exc:  # noqa: BLE001
                        failed.append({"item": item.get("id"), "error": str(exc)})
                await session.commit()
        return {"imported": imported, "skipped": skipped, "failed": failed}

    def _parse_costumes(self, value: str | None) -> list[str]:
        if not value:
            return []
        parsed = json.loads(value)
        return [str(item) for item in parsed if item]

    async def _download_image(self, client: httpx.AsyncClient, filename: str, category: str) -> None:
        target_dir = self.storage.category_dir(category)
        target = target_dir / Path(filename).name
        if target.exists():
            return
        response = await client.get(f"/api/image/{filename}")
        response.raise_for_status()
        await self.storage.save_image_bytes_as_webp(response.content, filename=target.name, category=category)
