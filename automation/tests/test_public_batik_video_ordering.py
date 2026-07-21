from datetime import datetime, timedelta
import uuid

import pytest

from app.models import Batik
from app.repositories.batik_repository import BatikRepository


def make_batik(*, created_at: datetime, file_video: str | None = None, **source: str | None) -> Batik:
    token = uuid.uuid4().hex
    return Batik(
        keyword=f"Batik {token}",
        slug=f"batik-{token}",
        warna="indigo",
        style="modern",
        seed=1,
        positive_prompt="batik",
        negative_prompt="blur",
        file_preview=f"{token}.webp",
        file_video=file_video,
        prompt_hash=token,
        is_published=True,
        created_at=created_at,
        updated_at=created_at,
        **source,
    )


@pytest.mark.asyncio
async def test_public_list_places_video_before_newer_non_video(session):
    newer = make_batik(created_at=datetime.now())
    older_video = make_batik(
        created_at=datetime.now() - timedelta(days=1),
        file_video="visualizer.mp4",
    )
    session.add_all([newer, older_video])
    await session.commit()

    items, _ = await BatikRepository().list_public(session, page=1, per_page=20)

    assert [item.id for item in items] == [older_video.id, newer.id]


@pytest.mark.asyncio
async def test_source_lookup_prefers_source_id_then_media_hash(session):
    existing = make_batik(
        created_at=datetime.now(),
        source_provider="btx",
        source_id="btx-42",
        source_media_hash="unused",
    )
    session.add(existing)
    await session.commit()

    found = await BatikRepository().find_imported_source(
        session,
        provider="btx",
        source_id="btx-42",
        media_hash="different",
    )

    assert found is not None
    assert found.id == existing.id
