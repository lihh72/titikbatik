import uuid
from io import BytesIO
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest
import pytest_asyncio
from PIL import Image
from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

import app.worker as worker_module
from app.core.config import Settings
from app.core.database import Base
from app.core.exceptions import ServiceUnavailableError
from app.models import Batik, BatikCostumeFile, CostumeTemplate, GenerationBatch, GenerationJob
from app.utils.time import utcnow
from app.worker import Worker


@pytest_asyncio.fixture
async def worker_context(tmp_path, monkeypatch):
    db_path = tmp_path / "worker.db"
    engine = create_async_engine(f"sqlite+aiosqlite:///{db_path}")
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
    factory = async_sessionmaker(engine, expire_on_commit=False)
    settings = Settings(
        database_url=f"sqlite+aiosqlite:///{db_path}",
        generate_workflow_path=str(Path("workflows/generatebatik.json").resolve()),
        combine_workflow_path=str(Path("workflows/combinebatik.json").resolve()),
        video_workflow_path=str(Path("workflows/videobatik.json").resolve()),
        storage_root=str(tmp_path / "storage"),
        storage_input_dir=str(tmp_path / "storage/input"),
        storage_preview_dir=str(tmp_path / "storage/output/preview"),
        storage_costume_dir=str(tmp_path / "storage/output/costume"),
        storage_video_dir=str(tmp_path / "storage/output/video"),
        storage_template_dir=str(tmp_path / "storage/templates"),
        storage_temp_dir=str(tmp_path / "storage/output/temporary"),
    )
    monkeypatch.setattr(worker_module, "async_session_factory", factory)
    monkeypatch.setattr(worker_module, "get_settings", lambda: settings)
    worker = Worker()
    worker.storage.ensure_directories()
    yield SimpleNamespace(worker=worker, factory=factory, settings=settings)
    await engine.dispose()


async def seed_video_job(context):
    async with context.factory() as session:
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
        await session.flush()
        job = GenerationJob(
            id=str(uuid.uuid4()),
            batch_id=batch.id,
            sequence_number=3,
            job_type="video",
            status="queued",
            max_attempts=3,
            workflow_name="videobatik",
            source_batik_id=batik.id,
            source_costume_file_id=costume.id,
            input_preview_filename=costume.filename,
            available_at=utcnow(),
        )
        session.add(job)
        await session.commit()
        costume_path = context.settings.storage_costume_path / costume.filename
        Image.new("RGB", (8, 8), color="blue").save(costume_path, format="WEBP")
        return job.id, batik.id, costume.id


@pytest.mark.asyncio
async def test_worker_processes_video_and_updates_costume_pair(worker_context):
    job_id, batik_id, costume_id = await seed_video_job(worker_context)
    worker = worker_context.worker
    worker.comfyui.upload_image = AsyncMock(return_value="costume.webp")
    worker.comfyui.queue_prompt = AsyncMock(return_value="video-prompt-id")
    worker.comfyui.wait_for_completion = AsyncMock(
        return_value={
            "outputs": {
                "75": {
                    "videos": [
                        {"filename": "result.mp4", "subfolder": "video", "type": "output"}
                    ]
                }
            }
        }
    )
    worker.comfyui.download_output_file = AsyncMock(
        return_value=b"\x00\x00\x00\x18ftypisom" + b"0" * 128
    )

    await worker.process_job(job_id)

    queued_prompt = worker.comfyui.queue_prompt.call_args.args[0]
    assert queued_prompt["269"]["inputs"]["image"] == "costume.webp"
    assert queued_prompt["320:312"]["inputs"]["value"] == 512
    assert queued_prompt["320:299"]["inputs"]["value"] == 512
    assert "audio" not in queued_prompt["320:310"]["inputs"]
    async with worker_context.factory() as session:
        job = await session.get(GenerationJob, job_id)
        batik = await session.get(Batik, batik_id)
        costume = await session.get(BatikCostumeFile, costume_id)
        assert job.status == "completed"
        assert costume.file_video.endswith(".mp4")
        assert batik.file_video == costume.file_video
        assert (worker_context.settings.storage_video_path / costume.file_video).exists()


@pytest.mark.asyncio
async def test_video_job_resumes_existing_comfyui_prompt(worker_context):
    job_id, _, _ = await seed_video_job(worker_context)
    async with worker_context.factory() as session:
        job = await session.get(GenerationJob, job_id)
        job.comfyui_prompt_id = "existing-video-prompt"
        await session.commit()
    worker = worker_context.worker
    worker.comfyui.upload_image = AsyncMock(return_value="costume.webp")
    worker.comfyui.get_history = AsyncMock(
        return_value={"existing-video-prompt": {"status": {"completed": False}}}
    )
    worker.comfyui.queue_prompt = AsyncMock(return_value="unexpected-new-prompt")
    worker.comfyui.wait_for_completion = AsyncMock(
        return_value={
            "outputs": {
                "75": {
                    "videos": [
                        {"filename": "result.mp4", "subfolder": "", "type": "output"}
                    ]
                }
            }
        }
    )
    worker.comfyui.download_output_file = AsyncMock(
        return_value=b"\x00\x00\x00\x18ftypisom" + b"0" * 128
    )

    await worker.process_job(job_id)

    worker.comfyui.queue_prompt.assert_not_awaited()
    worker.comfyui.wait_for_completion.assert_awaited_once_with("existing-video-prompt")


@pytest.mark.asyncio
async def test_video_job_retries_when_comfyui_is_offline(worker_context):
    job_id, _, costume_id = await seed_video_job(worker_context)
    worker = worker_context.worker
    worker.comfyui.upload_image = AsyncMock(side_effect=ServiceUnavailableError("ComfyUI is offline"))

    await worker.process_job(job_id)

    async with worker_context.factory() as session:
        job = await session.get(GenerationJob, job_id)
        costume = await session.get(BatikCostumeFile, costume_id)
        assert job.status == "retry_wait"
        assert job.attempt_count == 1
        assert job.error_message == "ComfyUI is offline"
        assert costume.file_video is None


async def seed_combine_job(context):
    async with context.factory() as session:
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
        template = CostumeTemplate(name="Model", filename="model.webp", is_active=True, sort_order=1)
        session.add_all([batch, template])
        batik = Batik(
            keyword="kawung",
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
        job = GenerationJob(
            id=str(uuid.uuid4()),
            batch_id=batch.id,
            sequence_number=2,
            job_type="combine",
            status="queued",
            max_attempts=3,
            seed=42,
            workflow_name="combinebatik",
            source_batik_id=batik.id,
            costume_template_id=template.id,
            input_preview_filename=batik.file_preview,
            available_at=utcnow(),
        )
        session.add(job)
        await session.commit()
        Image.new("RGB", (8, 8), color="blue").save(
            context.settings.storage_preview_path / batik.file_preview,
            format="WEBP",
        )
        Image.new("RGB", (8, 8), color="white").save(
            context.settings.storage_template_path / template.filename,
            format="WEBP",
        )
        return job.id, batch.id, batik.id


@pytest.mark.asyncio
async def test_successful_combine_queues_one_video_job(worker_context):
    job_id, batch_id, batik_id = await seed_combine_job(worker_context)
    worker = worker_context.worker
    worker.comfyui.upload_image = AsyncMock(side_effect=["model.webp", "preview.webp"])
    worker.comfyui.queue_prompt = AsyncMock(return_value="combine-prompt-id")
    worker.comfyui.wait_for_completion = AsyncMock(
        return_value={
            "outputs": {
                "60": {
                    "images": [
                        {"filename": "costume.png", "subfolder": "", "type": "output"}
                    ]
                }
            }
        }
    )
    image_buffer = BytesIO()
    Image.new("RGB", (8, 8), color="purple").save(image_buffer, format="PNG")
    worker.comfyui.download_output_image = AsyncMock(return_value=image_buffer.getvalue())

    await worker.process_job(job_id)

    async with worker_context.factory() as session:
        video_jobs = list(
            (
                await session.scalars(
                    select(GenerationJob).where(
                        GenerationJob.batch_id == batch_id,
                        GenerationJob.job_type == "video",
                    )
                )
            ).all()
        )
        costumes = list(
            (await session.scalars(select(BatikCostumeFile).where(BatikCostumeFile.batik_id == batik_id))).all()
        )
        assert len(costumes) == 1
        assert len(video_jobs) == 1
        assert video_jobs[0].source_costume_file_id == costumes[0].id
        assert video_jobs[0].input_preview_filename == costumes[0].filename
