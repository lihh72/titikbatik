import pytest


@pytest.mark.asyncio
async def test_enqueue_reuses_active_job(session):
    from app.repositories.btx_import_job_repository import BtxImportJobRepository

    repository = BtxImportJobRepository()
    queued = await repository.enqueue_or_reuse(session, limit=3)

    reused = await repository.enqueue_or_reuse(session, limit=9)

    assert reused.id == queued.id
    assert reused.requested_limit == 3


@pytest.mark.asyncio
async def test_enqueue_resets_terminal_job(session):
    from app.repositories.btx_import_job_repository import BtxImportJobRepository

    repository = BtxImportJobRepository()
    job = await repository.enqueue_or_reuse(session, limit=3)
    job.status = "completed"
    job.imported = 3
    await session.commit()

    replacement = await repository.enqueue_or_reuse(session, limit=5)

    assert replacement.id == job.id
    assert replacement.status == "queued"
    assert replacement.requested_limit == 5
    assert replacement.imported == 0
