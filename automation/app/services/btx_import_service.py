import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, get_settings
from app.models import Batik, BatikCostumeFile, BtxImportJob
from app.repositories.batik_repository import BatikRepository
from app.schemas.batik_import import BtxImportSummary
from app.services.storage_service import StorageService
from app.utils.hashing import stable_hash


@dataclass(frozen=True)
class BtxCandidate:
    source_id: str | None
    keyword: str
    warna: str
    style: str
    preview_url: str
    costume_urls: list[str]
    video_url: str | None
    source_media_hash: str


def unwrap_btx_records(payload: Any) -> list[dict[str, Any]]:
    if isinstance(payload, list):
        return [item for item in payload if isinstance(item, dict)]
    if not isinstance(payload, dict):
        raise ValueError("BTX catalogue has an unsupported JSON shape")
    for key in ("batiks", "items", "results", "data"):
        value = payload.get(key)
        if isinstance(value, list):
            return [item for item in value if isinstance(item, dict)]
        if key == "data" and isinstance(value, dict):
            nested = value.get("items")
            if isinstance(nested, list):
                return [item for item in nested if isinstance(item, dict)]
    raise ValueError("BTX catalogue has an unsupported JSON shape")


def _first(record: dict[str, Any], *keys: str) -> str | None:
    for key in keys:
        value = record.get(key)
        if value is not None and str(value).strip():
            return str(value).strip()
    return None


def _urls(value: Any) -> list[str]:
    if isinstance(value, str):
        normalized = value.strip()
        if not normalized:
            return []
        if normalized.startswith("["):
            try:
                decoded = json.loads(normalized)
            except json.JSONDecodeError:
                return [normalized]
            return _urls(decoded)
        return [normalized]
    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]
    if isinstance(value, dict):
        return _urls(value.get("url") or value.get("image_url") or value.get("filename"))
    return []


def normalize_btx_record(record: dict[str, Any]) -> BtxCandidate:
    preview = _first(record, "preview_url", "image_url", "image", "file_preview")
    if not preview:
        raise ValueError("BTX record has no preview image")
    keyword = _first(record, "title", "name", "keyword") or "Batik BTX"
    costumes = _urls(record.get("costume_urls") or record.get("costume_url") or record.get("costume") or record.get("file_costume"))
    return BtxCandidate(
        source_id=_first(record, "id", "batik_id", "uuid"),
        keyword=keyword,
        warna=_first(record, "warna", "color", "palette") or "Tidak diketahui",
        style=_first(record, "style", "category", "type") or "Batik BTX",
        preview_url=preview,
        costume_urls=list(dict.fromkeys(costumes)),
        video_url=_first(record, "video_url", "file_video"),
        source_media_hash=stable_hash(preview),
    )


class BtxImportService:
    provider = "btx"

    def __init__(self, settings: Settings | None = None, storage: StorageService | None = None, repository: BatikRepository | None = None):
        self.settings = settings or get_settings()
        self.storage = storage or StorageService(self.settings)
        self.repository = repository or BatikRepository()

    async def fetch_catalogue(self) -> list[dict[str, Any]]:
        async with httpx.AsyncClient(timeout=self.settings.btx_catalogue_timeout_seconds) as client:
            response = await client.get(self.settings.btx_catalogue_url)
            response.raise_for_status()
        return unwrap_btx_records(response.json())

    def media_url(self, value: str) -> str:
        if value.startswith(("https://", "http://")):
            return value
        return f"{self.settings.legacy_api_base_url.rstrip('/')}/api/image/{value.lstrip('/')}"

    async def import_pairs(self, session: AsyncSession, *, limit: int) -> BtxImportSummary:
        records = await self.fetch_catalogue()
        summary = BtxImportSummary(requested_limit=limit)
        self.storage.ensure_directories()
        async with httpx.AsyncClient(timeout=self.settings.btx_media_timeout_seconds) as client:
            for raw in records[:limit]:
                summary.examined += 1
                try:
                    candidate = normalize_btx_record(raw)
                    existing = await self.repository.find_imported_source(session, provider=self.provider, source_id=candidate.source_id, media_hash=candidate.source_media_hash)
                    if existing:
                        summary.skipped_duplicates += 1
                        continue
                    await self._import_one(session, client, candidate)
                    summary.imported += 1
                except Exception as exc:  # noqa: BLE001
                    await session.rollback()
                    summary.failed += 1
                    summary.errors.append(str(exc)[:240])
        return summary

    async def process_job(self, session: AsyncSession, job: BtxImportJob) -> None:
        job.status = "running"
        await session.commit()
        records = await self.fetch_catalogue()
        self.storage.ensure_directories()
        async with httpx.AsyncClient(timeout=self.settings.btx_media_timeout_seconds) as client:
            for raw in records[:job.requested_limit]:
                job = await session.get(BtxImportJob, job.id)
                if not job:
                    return
                job.examined += 1
                await session.commit()
                try:
                    candidate = normalize_btx_record(raw)
                    existing = await self.repository.find_imported_source(session, provider=self.provider, source_id=candidate.source_id, media_hash=candidate.source_media_hash)
                    if existing:
                        job.skipped_duplicates += 1
                    else:
                        await self._import_one(session, client, candidate)
                        job.imported += 1
                except Exception as exc:  # noqa: BLE001
                    await session.rollback()
                    job = await session.get(BtxImportJob, job.id)
                    if not job:
                        return
                    job.failed += 1
                    job.errors_json = [*job.errors_json, str(exc)[:240]][-20:]
                await session.commit()
        job = await session.get(BtxImportJob, job.id)
        if job:
            job.status = "completed"
            job.locked_by = job.locked_at = None
            from app.utils.time import utcnow
            job.completed_at = utcnow()
            await session.commit()

    async def _download_image(self, client: httpx.AsyncClient, url: str, *, filename: str, category: str) -> str:
        response = await client.get(self.media_url(url))
        response.raise_for_status()
        path = await self.storage.save_image_bytes_as_webp(response.content, filename=filename, category=category)
        return path.name

    async def _import_one(self, session: AsyncSession, client: httpx.AsyncClient, candidate: BtxCandidate) -> None:
        identity = candidate.source_id or candidate.source_media_hash
        preview = await self._download_image(client, candidate.preview_url, filename=f"btx_{stable_hash([identity, 'preview'])[:24]}.webp", category="preview")
        slug = await self.repository.next_slug(session, candidate.keyword)
        batik = Batik(keyword=candidate.keyword, slug=slug, warna=candidate.warna, style=candidate.style, seed=0, positive_prompt=candidate.keyword, negative_prompt="", file_preview=preview, file_video=None, prompt_hash=stable_hash({"btx": identity}), source_provider=self.provider, source_id=candidate.source_id, source_media_hash=candidate.source_media_hash, is_published=True)
        session.add(batik)
        await session.flush()
        for index, url in enumerate(candidate.costume_urls):
            filename = await self._download_image(client, url, filename=f"btx_{stable_hash([identity, 'costume', index])[:24]}.webp", category="costume")
            session.add(BatikCostumeFile(batik_id=batik.id, filename=filename, sort_order=index))
        if candidate.video_url:
            response = await client.get(self.media_url(candidate.video_url))
            response.raise_for_status()
            batik.file_video = (await self.storage.save_video_bytes(response.content, filename=f"btx_{stable_hash([identity, 'video'])[:24]}{Path(candidate.video_url).suffix or '.mp4'}")).name
        await session.commit()
