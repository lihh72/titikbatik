import uuid

import httpx
import pytest
import pytest_asyncio

import app.core.security as security
from app.core.config import Settings
from app.core.database import get_session
from app.main import create_app
from app.models import Batik, BatikCostumeFile, GenerationBatch, GenerationJob
from app.utils.time import utcnow


@pytest_asyncio.fixture
async def client(session, monkeypatch):
    monkeypatch.setattr(security, "get_settings", lambda: Settings(admin_api_key="test-admin-key"))
    app = create_app()

    async def override_session():
        yield session

    app.dependency_overrides[get_session] = override_session
    async with httpx.AsyncClient(
        transport=httpx.ASGITransport(app=app),
        base_url="http://test",
    ) as value:
        yield value
    app.dependency_overrides.clear()


async def seed_batik_with_costume(session, *, with_video=False):
    batch = GenerationBatch(
        id=str(uuid.uuid4()),
        requested_count=1,
        generate_count=1,
        combine_enabled=True,
        video_enabled=True,
        costume_template_mode="random_one",
        status="completed",
        settings_json={},
    )
    session.add(batch)
    batik = Batik(
        keyword="kawung",
        warna="indigo",
        style="traditional",
        seed=42,
        positive_prompt="batik kawung",
        negative_prompt="blur",
        file_preview="preview.webp",
        file_video="fashion.mp4" if with_video else None,
        prompt_hash=uuid.uuid4().hex,
        is_published=True,
    )
    session.add(batik)
    await session.flush()
    costume = BatikCostumeFile(
        batik_id=batik.id,
        filename="costume.webp",
        file_video="fashion.mp4" if with_video else None,
        sort_order=1,
    )
    session.add(costume)
    combine_job = GenerationJob(
        id=str(uuid.uuid4()),
        batch_id=batch.id,
        sequence_number=2,
        job_type="combine",
        status="completed",
        max_attempts=3,
        seed=42,
        workflow_name="combinebatik",
        source_batik_id=batik.id,
        output_filename=costume.filename,
        available_at=utcnow(),
        completed_at=utcnow(),
    )
    session.add(combine_job)
    await session.commit()
    return batik


@pytest.mark.asyncio
async def test_regenerate_video_requires_admin_and_queues_job(client, session):
    batik = await seed_batik_with_costume(session)

    unauthorized = await client.post(f"/api/admin/batiks/{batik.id}/regenerate-video")
    response = await client.post(
        f"/api/admin/batiks/{batik.id}/regenerate-video",
        headers={"X-Admin-Key": "test-admin-key"},
    )

    assert unauthorized.status_code == 401
    assert response.status_code == 200
    assert response.json()["data"]["queued_count"] == 1
    assert response.json()["data"]["job_id"]


@pytest.mark.asyncio
async def test_admin_batik_response_pairs_costume_with_video_url(client, session):
    batik = await seed_batik_with_costume(session, with_video=True)

    response = await client.get(
        f"/api/admin/batiks/{batik.id}",
        headers={"X-Admin-Key": "test-admin-key"},
    )

    assert response.status_code == 200
    costume = response.json()["data"]["costume_files"][0]
    assert costume["file_video"] == "fashion.mp4"
    assert costume["video_url"] == "/api/image/fashion.mp4"


@pytest.mark.asyncio
async def test_compatibility_api_keeps_single_video_filename(client, session):
    await seed_batik_with_costume(session, with_video=True)

    response = await client.get("/api/batik/getbatik")

    assert response.status_code == 200
    assert response.json()["batiks"][0]["file_video"] == "fashion.mp4"
