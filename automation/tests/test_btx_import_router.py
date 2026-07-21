import httpx
import pytest

import app.core.security as security
from app.core.config import Settings
from app.core.database import get_session
from app.main import create_app


@pytest.mark.asyncio
async def test_btx_import_requires_admin_key(session, monkeypatch):
    monkeypatch.setattr(security, "get_settings", lambda: Settings(admin_api_key="test-key"))
    app = create_app()
    async def override_session():
        yield session
    app.dependency_overrides[get_session] = override_session
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/admin/batik-imports/btx", json={"limit": 1})
    assert response.status_code == 401
