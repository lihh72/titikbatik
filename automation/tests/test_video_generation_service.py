import uuid

import pytest

from app.models import Batik, BatikCostumeFile, GenerationBatch, GenerationJob
from app.services.video_generation_service import VideoGenerationService
from app.utils.time import utcnow


async def create_combine_context(session):
    batch = GenerationBatch(
        id=str(uuid.uuid4()),
        requested_count=1,
        generate_count=1,
        combine_enabled=True,
        video_enabled=True,
        costume_template_mode="random_one",
        status="running",
        settings_json={},
    )
    session.add(batch)
    batik = Batik(
        keyword="kawung",
        slug="kawung",
        warna="indigo",
        style="traditional",
        seed=42,
        positive_prompt="batik kawung",
        negative_prompt="blur",
        file_preview="preview.webp",
        prompt_hash=uuid.uuid4().hex,
        is_published=True,
    )
    session.add(batik)
    await session.flush()
    costume = BatikCostumeFile(batik_id=batik.id, filename="costume.webp", sort_order=1)
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
    await session.flush()
    return batch, batik, costume, combine_job


@pytest.mark.asyncio
async def test_create_video_job_is_idempotent(session):
    batch, batik, costume, combine_job = await create_combine_context(session)
    service = VideoGenerationService()

    first = await service.create_video_job(
        session,
        batch=batch,
        source_batik=batik,
        source_costume=costume,
        source_job=combine_job,
    )
    second = await service.create_video_job(
        session,
        batch=batch,
        source_batik=batik,
        source_costume=costume,
        source_job=combine_job,
    )

    assert first.id == second.id
    assert first.job_type == "video"
    assert first.status == "queued"
    assert first.source_costume_file_id == costume.id
    assert first.input_preview_filename == costume.filename
    assert first.sequence_number == 3


@pytest.mark.asyncio
async def test_forced_video_regeneration_creates_a_new_job(session):
    batch, batik, costume, combine_job = await create_combine_context(session)
    service = VideoGenerationService()

    first = await service.create_video_job(
        session,
        batch=batch,
        source_batik=batik,
        source_costume=costume,
        source_job=combine_job,
    )
    replacement = await service.create_video_job(
        session,
        batch=batch,
        source_batik=batik,
        source_costume=costume,
        source_job=combine_job,
        force=True,
    )

    assert replacement.id != first.id
    assert replacement.sequence_number == 4
