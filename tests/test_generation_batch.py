from pathlib import Path

import pytest

from app.core.config import Settings
from app.core.exceptions import ConflictError
from sqlalchemy import select

from app.models import CostumeTemplate, GenerationJob
from app.schemas.generation import GenerationBatchCreate
from app.services.generation_service import GenerationService
from tests.helpers import seed_wordlists


@pytest.mark.asyncio
async def test_batch_creation_creates_requested_generate_jobs(session):
    await seed_wordlists(session)
    settings = Settings(
        max_batch_size=10,
        generate_workflow_path=str(Path("workflows/generatebatik.json").resolve()),
        combine_workflow_path=str(Path("workflows/combinebatik.json").resolve()),
    )
    service = GenerationService(settings=settings)

    batch = await service.create_batch(
        session,
        GenerationBatchCreate(amount=2, combine_enabled=False, random_seed=99, allow_duplicate_prompts=False),
    )
    await session.flush()

    jobs = list((await session.scalars(select(GenerationJob).where(GenerationJob.batch_id == batch.id))).all())
    assert batch.requested_count == 2
    assert batch.status == "queued"
    assert len(jobs) == 2
    assert {job.status for job in jobs} == {"queued"}
    assert jobs[0].prompt_hash != jobs[1].prompt_hash


@pytest.mark.asyncio
async def test_video_batch_requires_combine(session):
    await seed_wordlists(session)
    service = GenerationService(settings=Settings(max_batch_size=10))

    with pytest.raises(ConflictError, match="requires combine"):
        await service.create_batch(
            session,
            GenerationBatchCreate(amount=1, combine_enabled=False, video_enabled=True),
        )


@pytest.mark.asyncio
async def test_video_batch_requires_exactly_one_resolved_template(session):
    await seed_wordlists(session)
    session.add_all(
        [
            CostumeTemplate(name="Model A", filename="model-a.webp", is_active=True, sort_order=1),
            CostumeTemplate(name="Model B", filename="model-b.webp", is_active=True, sort_order=2),
        ]
    )
    await session.flush()
    service = GenerationService(settings=Settings(max_batch_size=10))

    with pytest.raises(ConflictError, match="exactly one costume template"):
        await service.create_batch(
            session,
            GenerationBatchCreate(
                amount=1,
                combine_enabled=True,
                video_enabled=True,
                costume_template_mode="all",
            ),
        )


@pytest.mark.asyncio
async def test_video_batch_allows_random_one_template_mode(session):
    await seed_wordlists(session)
    session.add_all(
        [
            CostumeTemplate(name="Model A", filename="model-a.webp", is_active=True, sort_order=1),
            CostumeTemplate(name="Model B", filename="model-b.webp", is_active=True, sort_order=2),
        ]
    )
    await session.flush()
    service = GenerationService(settings=Settings(max_batch_size=10))

    batch = await service.create_batch(
        session,
        GenerationBatchCreate(
            amount=1,
            combine_enabled=True,
            video_enabled=True,
            costume_template_mode="random_one",
        ),
    )

    assert batch.video_enabled is True
