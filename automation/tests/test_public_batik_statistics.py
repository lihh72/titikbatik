import uuid
from datetime import datetime

import httpx
import pytest
import pytest_asyncio

import app.core.security as security
from app.core.config import Settings
from app.core.database import get_session
from app.main import create_app
from app.models import Batik


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


def batik(*, keyword: str, warna: str, created_at: datetime, published: bool = True, deleted_at: datetime | None = None, slug: str | None = None):
    token = uuid.uuid4().hex
    return Batik(
        keyword=keyword,
        slug=slug or f"{keyword.lower().replace(' ', '-')}-{token[:8]}",
        warna=warna,
        style="modern geometric batik",
        seed=42,
        positive_prompt=keyword,
        negative_prompt="blur",
        file_preview=f"{token}.webp",
        prompt_hash=token,
        is_published=published,
        deleted_at=deleted_at,
        created_at=created_at,
        updated_at=created_at,
    )


@pytest.mark.asyncio
async def test_public_statistics_filters_date_and_search_atomically(client, session):
    session.add_all([
        batik(keyword="blue peacock", warna="dark blue", created_at=datetime(2026, 7, 11, 8, 0)),
        batik(keyword="blue lotus", warna="navy blue", created_at=datetime(2026, 7, 12, 9, 0)),
        batik(keyword="red lotus", warna="red", created_at=datetime(2026, 7, 11, 10, 0)),
        batik(keyword="hidden blue", warna="blue", created_at=datetime(2026, 7, 11, 11, 0), published=False),
        batik(keyword="deleted blue", warna="blue", created_at=datetime(2026, 7, 11, 12, 0), deleted_at=datetime(2026, 7, 12, 12, 0)),
    ])
    await session.commit()

    filtered = await client.get("/api/v1/catalog/batiks/statistics", params={"q": "blue", "date": "2026-07-11"})
    latest_blue = await client.get("/api/v1/catalog/batiks/statistics", params={"q": "blue"})
    filtered_items = await client.get("/api/v1/batiks/search", params={"q": "blue", "date": "2026-07-11"})
    all_items_on_date = await client.get("/api/v1/batiks", params={"date": "2026-07-11"})

    assert filtered.status_code == 200
    assert filtered.json()["data"] == {
        "count": 1,
        "latest_date": "2026-07-11",
        "query": "blue",
        "date": "2026-07-11",
    }
    assert latest_blue.status_code == 200
    assert latest_blue.json()["data"] == {
        "count": 2,
        "latest_date": "2026-07-12",
        "query": "blue",
        "date": None,
    }
    assert filtered_items.status_code == 200
    assert [item["keyword"] for item in filtered_items.json()["data"]["items"]] == ["blue peacock"]
    assert all_items_on_date.status_code == 200
    assert {item["keyword"] for item in all_items_on_date.json()["data"]["items"]} == {"blue peacock", "red lotus"}


@pytest.mark.asyncio
async def test_public_statistics_rejects_an_empty_search_query(client):
    response = await client.get("/api/v1/catalog/batiks/statistics", params={"q": "   "})

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_statistics_endpoint_does_not_shadow_a_batik_slug(client, session):
    session.add(batik(
        keyword="statistics",
        warna="indigo",
        created_at=datetime(2026, 7, 11, 8, 0),
        slug="statistics",
    ))
    await session.commit()

    response = await client.get("/api/v1/batiks/statistics")

    assert response.status_code == 200
    assert response.json()["data"]["slug"] == "statistics"
