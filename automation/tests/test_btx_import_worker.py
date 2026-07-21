from unittest.mock import AsyncMock

import pytest


@pytest.mark.asyncio
async def test_worker_process_one_btx_import_returns_false_when_no_job(monkeypatch):
    import app.worker as worker_module
    from app.worker import Worker

    worker = Worker()
    worker.btx_import_jobs.claim_next = AsyncMock(return_value=None)

    assert await worker.process_one_btx_import() is False
