# Video Generation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menambahkan pipeline durable `1 generate : 1 combine : 1 video` yang membuat video 512x512 tanpa audio dari output combine costume.

**Architecture:** Batch menyimpan pilihan `video_enabled`; combine yang berhasil membuat satu `BatikCostumeFile`, lalu `VideoGenerationService` membuat job `video` yang menunjuk file tersebut. Worker membangun prompt dari `videobatik.json`, mengunggah costume, menunggu ComfyUI, menyimpan video secara atomik, dan memperbarui pasangan costume serta mirror `Batik.file_video`.

**Tech Stack:** FastAPI, SQLAlchemy async, SQLite/Alembic, Pydantic, httpx, pytest, vanilla HTML/CSS/JavaScript, ComfyUI API.

---

## Struktur File

- `app/services/video_generation_service.py`: pembuatan job video otomatis dan regenerate.
- `app/services/workflow_service.py`: validasi dan patch workflow video.
- `app/services/comfyui_service.py`: ekstraksi dan download metadata output video.
- `app/services/storage_service.py`: validasi container dan atomic write video.
- `app/worker.py`: dispatch dan eksekusi durable job video.
- `app/models/*.py`, `app/schemas/*.py`, dan migration Alembic: kontrak data video.
- `app/routers/admin/batiks.py`: endpoint regenerate video.
- `app/web/*`: kontrol batch video dan preview hasil.
- `tests/test_video_*.py`: kontrak workflow, chain, storage, worker, dan API.

### Task 1: Kontrak Workflow Video

**Files:**
- Modify: `app/core/config.py`
- Modify: `.env.example`
- Modify: `app/services/workflow_service.py`
- Modify: `scripts/inspect_workflows.py`
- Modify: `tests/test_workflow_service.py`

- [ ] **Step 1: Tulis test workflow video yang gagal**

```python
def test_video_workflow_uses_costume_at_512_square_without_audio():
    service = WorkflowService()
    prompt = service.build_video_prompt(
        costume_image_name="costume.webp",
        filename_prefix="video_test",
    )
    assert prompt["269"]["inputs"]["image"] == "costume.webp"
    assert prompt["320:312"]["inputs"]["value"] == 512
    assert prompt["320:299"]["inputs"]["value"] == 512
    assert "audio" not in prompt["320:310"]["inputs"]
    assert prompt["75"]["inputs"]["filename_prefix"] == "video_test"
    assert prompt["320:300"]["inputs"]["value"] == 25
    assert prompt["320:301"]["inputs"]["value"] == 5
```

- [ ] **Step 2: Jalankan test dan pastikan RED**

Run: `pytest tests/test_workflow_service.py::test_video_workflow_uses_costume_at_512_square_without_audio -v`

Expected: FAIL karena `WorkflowService` belum mempunyai `build_video_prompt`.

- [ ] **Step 3: Tambahkan mapping dan builder minimal**

```python
VIDEO_NODE_MAPPING = {
    "input_image": {"id": "269", "class_type": "LoadImage"},
    "width": {"id": "320:312", "class_type": "PrimitiveInt"},
    "height": {"id": "320:299", "class_type": "PrimitiveInt"},
    "create_video": {"id": "320:310", "class_type": "CreateVideo"},
    "save_video": {"id": "75", "class_type": "SaveVideo"},
}

def build_video_prompt(self, *, costume_image_name: str, filename_prefix: str) -> dict[str, Any]:
    workflow = self._load_workflow(self.settings.path(self.settings.video_workflow_path))
    self._validate_mapping(workflow, VIDEO_NODE_MAPPING)
    self._set_input(workflow, "269", "image", costume_image_name)
    self._set_input(workflow, "320:312", "value", 512)
    self._set_input(workflow, "320:299", "value", 512)
    self._node(workflow, "320:310").setdefault("inputs", {}).pop("audio", None)
    self._set_input(workflow, "75", "filename_prefix", filename_prefix)
    return workflow
```

Tambahkan `video_workflow_path: str = "workflows/videobatik.json"` pada `Settings` dan `VIDEO_WORKFLOW_PATH=workflows/videobatik.json` pada `.env.example`.

Tambahkan `Path("workflows/videobatik.json")` ke daftar workflow pada `scripts/inspect_workflows.py` agar inspeksi CLI mencakup ketiga tahap.

- [ ] **Step 4: Jalankan test workflow**

Run: `pytest tests/test_workflow_service.py -v`

Expected: seluruh test PASS dan parameter workflow selain lima perubahan tersebut tetap sama.

- [ ] **Step 5: Commit task**

```bash
git add app/core/config.py app/services/workflow_service.py scripts/inspect_workflows.py tests/test_workflow_service.py .env.example
git commit -m "feat: add silent 512 video workflow mapping"
```

### Task 2: Model Data dan Migration Video

**Files:**
- Create: `alembic/versions/20260701_0002_video_generation.py`
- Modify: `app/models/generation_batch.py`
- Modify: `app/models/generation_job.py`
- Modify: `app/models/costume_file.py`
- Modify: `app/schemas/generation.py`
- Modify: `app/schemas/batch.py`
- Modify: `app/schemas/job.py`
- Modify: `app/schemas/batik.py`
- Create: `tests/test_video_models.py`

- [ ] **Step 1: Tulis test model yang gagal**

```python
@pytest.mark.asyncio
async def test_video_fields_persist(session):
    batch = GenerationBatch(
        id=str(uuid.uuid4()), requested_count=1, generate_count=1,
        combine_enabled=True, video_enabled=True,
        costume_template_mode="random_one", status="queued", settings_json={},
    )
    session.add(batch)
    await session.flush()
    assert batch.video_enabled is True
    assert "file_video" in BatikCostumeFile.__table__.columns
    assert "source_costume_file_id" in GenerationJob.__table__.columns
```

- [ ] **Step 2: Jalankan test dan pastikan RED**

Run: `pytest tests/test_video_models.py -v`

Expected: FAIL karena kolom video belum tersedia.

- [ ] **Step 3: Tambahkan kolom model dan schema**

```python
# GenerationBatch
video_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

# BatikCostumeFile
file_video: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)

# GenerationJob
source_costume_file_id: Mapped[int | None] = mapped_column(
    ForeignKey("batik_costume_files.id", ondelete="SET NULL"), nullable=True
)
source_costume_file = relationship("BatikCostumeFile", foreign_keys=[source_costume_file_id])
```

Tambahkan `video_enabled: bool = False` ke `GenerationBatchCreate` dan `GenerationBatchRead`; tambahkan `source_costume_file_id` ke `GenerationJobRead`; tambahkan `file_video` dan `video_url` ke `BatikCostumeFileRead`.

- [ ] **Step 4: Buat migration non-destruktif**

```python
def upgrade() -> None:
    op.add_column("generation_batches", sa.Column("video_enabled", sa.Boolean(), nullable=False, server_default=sa.false()))
    with op.batch_alter_table("batik_costume_files") as batch_op:
        batch_op.add_column(sa.Column("file_video", sa.String(length=255), nullable=True))
        batch_op.create_unique_constraint("uq_batik_costume_files_file_video", ["file_video"])
    with op.batch_alter_table("generation_jobs") as batch_op:
        batch_op.add_column(sa.Column("source_costume_file_id", sa.Integer(), nullable=True))
        batch_op.create_foreign_key(
            "fk_generation_jobs_source_costume_file_id", "batik_costume_files",
            ["source_costume_file_id"], ["id"], ondelete="SET NULL",
        )

def downgrade() -> None:
    with op.batch_alter_table("generation_jobs") as batch_op:
        batch_op.drop_constraint("fk_generation_jobs_source_costume_file_id", type_="foreignkey")
        batch_op.drop_column("source_costume_file_id")
    with op.batch_alter_table("batik_costume_files") as batch_op:
        batch_op.drop_constraint("uq_batik_costume_files_file_video", type_="unique")
        batch_op.drop_column("file_video")
    op.drop_column("generation_batches", "video_enabled")
```

- [ ] **Step 5: Jalankan test model dan migration**

Run: `pytest tests/test_video_models.py -v && alembic upgrade head`

Expected: PASS; database lama meningkat ke revision baru tanpa kehilangan batik/costume.

- [ ] **Step 6: Commit task**

```bash
git add alembic/versions/20260701_0002_video_generation.py app/models app/schemas tests/test_video_models.py
git commit -m "feat: persist video generation state"
```

### Task 3: Validasi Batch dan Pembuatan Job 1:1:1

**Files:**
- Create: `app/services/video_generation_service.py`
- Modify: `app/services/generation_service.py`
- Modify: `app/services/combination_service.py`
- Modify: `tests/test_generation_batch.py`
- Create: `tests/test_video_generation_service.py`

- [ ] **Step 1: Tulis test validasi batch yang gagal**

```python
@pytest.mark.asyncio
async def test_video_batch_requires_combine_and_exactly_one_template(session):
    await seed_wordlists(session)
    service = GenerationService(settings=Settings(max_batch_size=10))
    with pytest.raises(ConflictError, match="Video generation requires combine"):
        await service.create_batch(session, GenerationBatchCreate(amount=1, combine_enabled=False, video_enabled=True))
```

Tambahkan kasus `selected` dengan dua ID dan `all` ketika dua template aktif; keduanya harus ditolak.

- [ ] **Step 2: Jalankan test dan pastikan RED**

Run: `pytest tests/test_generation_batch.py -v`

Expected: FAIL karena `video_enabled` belum divalidasi.

- [ ] **Step 3: Implementasikan validasi satu template**

```python
if request.video_enabled:
    if not request.combine_enabled or request.costume_template_mode == "none":
        raise ConflictError("Video generation requires combine with exactly one costume template")
    templates = await self._resolve_templates(session, request)
    resolved_count = 1 if request.costume_template_mode == "random_one" and templates else len(templates)
    if resolved_count != 1:
        raise ConflictError("Video generation requires exactly one costume template")
    if not self.settings.path(self.settings.video_workflow_path).exists():
        raise ConflictError("Video workflow file is missing")
```

Simpan `video_enabled=request.video_enabled` pada batch. `CombinationService` tetap memilih satu template untuk mode `random_one` dan tidak mengubah perilaku batch tanpa video.

- [ ] **Step 4: Tulis test service job video yang gagal**

```python
@pytest.mark.asyncio
async def test_create_video_job_is_idempotent(session, completed_combine_context):
    batch, batik, costume, combine_job = completed_combine_context
    service = VideoGenerationService()
    first = await service.create_video_job(
        session, batch=batch, source_batik=batik,
        source_costume=costume, source_job=combine_job,
    )
    second = await service.create_video_job(
        session, batch=batch, source_batik=batik,
        source_costume=costume, source_job=combine_job,
    )
    assert first.id == second.id
    assert first.job_type == "video"
    assert first.input_preview_filename == costume.filename
```

- [ ] **Step 5: Implementasikan service job video**

```python
class VideoGenerationService:
    async def create_video_job(self, session, *, batch, source_batik, source_costume, source_job, force=False):
        if not force:
            existing = await session.scalar(select(GenerationJob).where(
                GenerationJob.job_type == "video",
                GenerationJob.source_costume_file_id == source_costume.id,
            ).order_by(GenerationJob.created_at.desc()))
            if existing:
                return existing
        max_sequence = int(await session.scalar(select(func.max(GenerationJob.sequence_number)).where(
            GenerationJob.batch_id == batch.id
        )) or 0)
        job = GenerationJob(
            id=str(uuid.uuid4()), batch_id=batch.id, sequence_number=max_sequence + 1,
            job_type="video", status="queued", max_attempts=source_job.max_attempts,
            seed=source_job.seed, workflow_name="videobatik",
            source_batik_id=source_batik.id, source_costume_file_id=source_costume.id,
            input_preview_filename=source_costume.filename, available_at=utcnow(),
            settings_json={"source_costume_file_id": source_costume.id},
        )
        session.add(job)
        await session.flush()
        return job
```

- [ ] **Step 6: Jalankan test chain**

Run: `pytest tests/test_generation_batch.py tests/test_video_generation_service.py -v`

Expected: PASS; satu context generate/combine hanya memperoleh satu job video otomatis.

- [ ] **Step 7: Commit task**

```bash
git add app/services/generation_service.py app/services/combination_service.py app/services/video_generation_service.py tests
git commit -m "feat: create one video job per costume"
```

### Task 4: Output ComfyUI dan Penyimpanan Video

**Files:**
- Modify: `app/services/comfyui_service.py`
- Modify: `app/services/storage_service.py`
- Create: `tests/test_comfyui_video.py`
- Modify: `tests/test_storage_service.py`

- [ ] **Step 1: Tulis test ekstraksi output yang gagal**

```python
def test_get_output_videos_reads_save_video_metadata():
    service = ComfyUIService(Settings())
    history = {"outputs": {"75": {"videos": [
        {"filename": "video/result.mp4", "subfolder": "", "type": "output"}
    ]}}}
    assert service.get_output_videos(history, save_node_id="75")[0]["filename"] == "video/result.mp4"
```

Sertakan bentuk ComfyUI yang memakai key `video` tunggal agar parser tidak bergantung pada satu versi node.

- [ ] **Step 2: Jalankan test dan pastikan RED**

Run: `pytest tests/test_comfyui_video.py -v`

Expected: FAIL karena parser video belum ada.

- [ ] **Step 3: Implementasikan parser dan downloader generik**

```python
def get_output_videos(self, history_item, *, save_node_id=None):
    outputs = history_item.get("outputs", {})
    nodes = [save_node_id] if save_node_id else list(outputs)
    result = []
    for node_id in nodes:
        output = outputs.get(str(node_id), {})
        for key in ("videos", "video", "gifs"):
            value = output.get(key, [])
            if isinstance(value, dict):
                value = [value]
            if isinstance(value, list):
                result.extend(item for item in value if isinstance(item, dict) and item.get("filename"))
    return result

async def download_output_file(self, file_info):
    return await self._download_view(file_info)
```

Gunakan helper `/view` yang sama untuk gambar dan video sehingga error offline/HTTP tetap memakai `ExternalServiceError`.

- [ ] **Step 4: Tulis test atomic video storage yang gagal**

```python
@pytest.mark.asyncio
async def test_save_video_bytes_atomically_accepts_mp4(storage):
    data = b"\x00\x00\x00\x18ftypisom" + b"0" * 128
    path = await storage.save_video_bytes(data, filename="result.mp4")
    assert path.read_bytes() == data
    assert path.parent == storage.settings.storage_video_path
```

Tambahkan test file kosong, ekstensi selain `.mp4`/`.webm`, signature salah, dan traversal filename ditolak.

- [ ] **Step 5: Implementasikan atomic video storage**

```python
async def save_video_bytes(self, data: bytes, *, filename: str) -> Path:
    safe_name = safe_filename(filename)
    suffix = Path(safe_name).suffix.lower()
    if suffix not in {".mp4", ".webm"}:
        raise AppError("Unsupported video format")
    if len(data) < 32 or not self._valid_video_signature(data, suffix):
        raise AppError("Invalid video output")
    target = self.settings.storage_video_path / safe_name
    tmp = self.settings.storage_temp_path / f"{safe_name}.tmp"
    await asyncio.to_thread(tmp.write_bytes, data)
    await asyncio.to_thread(tmp.replace, target)
    return target
```

MP4 valid bila byte 4-8 adalah `ftyp`; WebM valid bila diawali EBML `1A 45 DF A3`. Hapus temporary file jika write/replace gagal.

- [ ] **Step 6: Jalankan test service**

Run: `pytest tests/test_comfyui_video.py tests/test_storage_service.py -v`

Expected: PASS.

- [ ] **Step 7: Commit task**

```bash
git add app/services/comfyui_service.py app/services/storage_service.py tests/test_comfyui_video.py tests/test_storage_service.py
git commit -m "feat: download and store ComfyUI video output"
```

### Task 5: Eksekusi Worker dan Recovery Video

**Files:**
- Modify: `app/worker.py`
- Create: `tests/test_video_worker.py`

- [ ] **Step 1: Tulis test worker yang gagal**

```python
async def seed_video_job_context(session, settings):
    batch = GenerationBatch(
        id=str(uuid.uuid4()), requested_count=1, generate_count=1,
        combine_enabled=True, video_enabled=True,
        costume_template_mode="random_one", status="running", settings_json={},
    )
    session.add(batch)
    batik = Batik(
        keyword="kawung", warna="indigo", style="traditional", seed=42,
        positive_prompt="batik kawung", negative_prompt="blur",
        file_preview="preview.webp", prompt_hash=uuid.uuid4().hex, is_published=True,
    )
    session.add(batik)
    await session.flush()
    costume = BatikCostumeFile(batik_id=batik.id, filename="costume.webp", sort_order=1)
    session.add(costume)
    await session.flush()
    job = GenerationJob(
        id=str(uuid.uuid4()), batch_id=batch.id, sequence_number=3,
        job_type="video", status="queued", max_attempts=3,
        workflow_name="videobatik", source_batik_id=batik.id,
        source_costume_file_id=costume.id, input_preview_filename=costume.filename,
        available_at=utcnow(),
    )
    session.add(job)
    await session.flush()
    source = Path(settings.storage_costume_dir) / costume.filename
    source.parent.mkdir(parents=True, exist_ok=True)
    source.write_bytes(b"source-image")
    return batch, batik, costume, job

@pytest_asyncio.fixture
async def worker_context(tmp_path, monkeypatch):
    engine = create_async_engine(f"sqlite+aiosqlite:///{tmp_path / 'worker.db'}")
    factory = async_sessionmaker(engine, expire_on_commit=False)
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
    monkeypatch.setattr(worker_module, "async_session_factory", factory)
    settings = Settings(
        database_url=f"sqlite+aiosqlite:///{tmp_path / 'worker.db'}",
        storage_root=str(tmp_path / "storage"),
        storage_costume_dir=str(tmp_path / "storage/output/costume"),
        storage_video_dir=str(tmp_path / "storage/output/video"),
        storage_temp_dir=str(tmp_path / "storage/output/temporary"),
    )
    monkeypatch.setattr(worker_module, "get_settings", lambda: settings)
    worker = Worker()
    async with factory() as session:
        batch, batik, costume, job = await seed_video_job_context(session, settings)
        await session.commit()
    yield SimpleNamespace(worker=worker, factory=factory, job_id=job.id, batik_id=batik.id, costume_id=costume.id)
    await engine.dispose()

@pytest.mark.asyncio
async def test_process_video_uses_combine_output_and_updates_pair(worker_context, monkeypatch):
    worker = worker_context.worker
    monkeypatch.setattr(worker.comfyui, "upload_image", AsyncMock(return_value="costume.webp"))
    monkeypatch.setattr(worker.comfyui, "queue_prompt", AsyncMock(return_value="prompt-video"))
    monkeypatch.setattr(worker.comfyui, "wait_for_completion", AsyncMock(return_value={
        "outputs": {"75": {"videos": [{"filename": "result.mp4", "type": "output"}]}}
    }))
    monkeypatch.setattr(worker.comfyui, "download_output_file", AsyncMock(
        return_value=b"\x00\x00\x00\x18ftypisom" + b"0" * 128
    ))
    await worker.process_job(worker_context.job_id)
    async with worker_context.factory() as session:
        costume = await session.get(BatikCostumeFile, worker_context.costume_id)
        batik = await session.get(Batik, worker_context.batik_id)
        assert costume.file_video.endswith(".mp4")
        assert batik.file_video == costume.file_video
```

Tambahkan test bahwa combine sukses memanggil `create_video_job` hanya saat `batch.video_enabled`, serta test retry/resume memakai `comfyui_prompt_id` yang sudah tersimpan.

- [ ] **Step 2: Jalankan test dan pastikan RED**

Run: `pytest tests/test_video_worker.py -v`

Expected: FAIL karena worker belum mengenali `job_type="video"`.

- [ ] **Step 3: Tambahkan dispatch dan proses video**

```python
elif job.job_type == "video":
    await self._process_video(job_id)

async def _process_video(self, job_id: str) -> None:
    async with async_session_factory() as session:
        job = await session.get(GenerationJob, job_id)
        costume = await session.get(BatikCostumeFile, job.source_costume_file_id)
        if not job or not costume:
            raise AppError("Costume output not found for video job")
        source = self.storage.resolve_public_file(costume.filename, category="costume")
        uploaded = await self.comfyui.upload_image(source.path)
        prompt = self.workflow.build_video_prompt(
            costume_image_name=uploaded,
            filename_prefix=f"titikbatik_video_{job.id}",
        )
        prompt_id = await self._resume_or_queue_prompt(job, prompt)
        job.comfyui_prompt_id = prompt_id
        job.status = "running"
        await session.commit()
    history = await self.comfyui.wait_for_completion(prompt_id)
    videos = self.comfyui.get_output_videos(history, save_node_id="75")
    if not videos:
        raise AppError("ComfyUI video workflow did not produce a video")
    data = await self.comfyui.download_output_file(videos[0])
```

Bangun nama `.mp4`/`.webm` dari ekstensi output ComfyUI, simpan atomically, lalu dalam satu transaksi set `costume.file_video`, `batik.file_video`, selesaikan job, dan refresh batch counts. Hapus file baru bila transaksi gagal.

- [ ] **Step 4: Hubungkan combine ke video service**

Setelah `BatikCostumeFile` dibuat, lakukan `await session.flush()`. Jika `batch.video_enabled`, panggil `VideoGenerationService.create_video_job(...)` dengan costume dan combine job yang baru selesai.

- [ ] **Step 5: Jalankan test worker dan recovery**

Run: `pytest tests/test_video_worker.py -v`

Expected: PASS untuk sukses, offline/retry, resume, dan pembuatan chain.

- [ ] **Step 6: Commit task**

```bash
git add app/worker.py tests/test_video_worker.py
git commit -m "feat: run durable video generation jobs"
```

### Task 6: API Admin dan Response Video

**Files:**
- Modify: `app/services/image_service.py`
- Modify: `app/routers/admin/batiks.py`
- Modify: `app/schemas/batik.py`
- Create: `tests/test_video_api.py`

- [ ] **Step 1: Tulis test endpoint yang gagal**

```python
@pytest_asyncio.fixture
async def seeded_batik_with_costume(session):
    batch = GenerationBatch(
        id=str(uuid.uuid4()), requested_count=1, generate_count=1,
        combine_enabled=True, video_enabled=True,
        costume_template_mode="random_one", status="completed", settings_json={},
    )
    session.add(batch)
    batik = Batik(
        keyword="kawung", warna="indigo", style="traditional", seed=42,
        positive_prompt="batik kawung", negative_prompt="blur",
        file_preview="preview.webp", prompt_hash=uuid.uuid4().hex, is_published=True,
    )
    session.add(batik)
    await session.flush()
    costume = BatikCostumeFile(batik_id=batik.id, filename="costume.webp", sort_order=1)
    session.add(costume)
    combine = GenerationJob(
        id=str(uuid.uuid4()), batch_id=batch.id, sequence_number=2,
        job_type="combine", status="completed", max_attempts=3,
        workflow_name="combinebatik", source_batik_id=batik.id,
        output_filename=costume.filename, available_at=utcnow(), completed_at=utcnow(),
    )
    session.add(combine)
    await session.flush()
    return batik

@pytest_asyncio.fixture
async def client(session, monkeypatch):
    monkeypatch.setattr(security, "get_settings", lambda: Settings(admin_api_key="test-admin-key"))
    app = create_app()
    async def override_session():
        yield session
    app.dependency_overrides[get_session] = override_session
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as value:
        yield value
    app.dependency_overrides.clear()

@pytest.mark.asyncio
async def test_regenerate_video_requires_admin_and_queues_job(client, seeded_batik_with_costume):
    batik = seeded_batik_with_costume
    unauthorized = await client.post(f"/api/admin/batiks/{batik.id}/regenerate-video")
    assert unauthorized.status_code in {401, 403}
    response = await client.post(
        f"/api/admin/batiks/{batik.id}/regenerate-video",
        headers={"X-Admin-Key": "test-admin-key"},
    )
    assert response.status_code == 200
    assert response.json()["data"]["queued_count"] == 1
```

Tambahkan test costume tidak ada, lebih dari satu costume, serta response batik mempunyai `file_video` dan `video_url`.

- [ ] **Step 2: Jalankan test dan pastikan RED**

Run: `pytest tests/test_video_api.py -v`

Expected: FAIL 404 karena endpoint belum ada.

- [ ] **Step 3: Implementasikan regenerate endpoint**

```python
@router.post("/{batik_id}/regenerate-video")
async def regenerate_video(batik_id: int, session: AsyncSession = Depends(get_session)):
    batik = await repository.get(session, batik_id)
    if not batik:
        raise NotFoundError("Batik not found")
    if len(batik.costume_files) != 1:
        raise ConflictError("Exactly one costume output is required to generate video")
    costume = batik.costume_files[0]
    source_job = await session.scalar(select(GenerationJob).where(
        GenerationJob.job_type == "combine",
        GenerationJob.source_batik_id == batik.id,
        GenerationJob.output_filename == costume.filename,
    ).order_by(GenerationJob.completed_at.desc()))
    if not source_job:
        raise NotFoundError("Completed combine job not found")
    batch = await session.get(GenerationBatch, source_job.batch_id)
    job = await video_service.create_video_job(
        session, batch=batch, source_batik=batik,
        source_costume=costume, source_job=source_job, force=True,
    )
    await session.commit()
    return ok({"queued_count": 1, "job_id": job.id}, "Video regeneration queued")
```

- [ ] **Step 4: Enrich response video**

Dalam `ImageService.enrich_batik`, set `costume.video_url = self.image_url(costume.file_video)` bila tersedia. Pastikan compatibility API tetap mengambil `batik.file_video`.

- [ ] **Step 5: Jalankan test API**

Run: `pytest tests/test_video_api.py -v`

Expected: PASS untuk auth, validasi sumber, queue, dan response.

- [ ] **Step 6: Commit task**

```bash
git add app/services/image_service.py app/routers/admin/batiks.py app/schemas/batik.py tests/test_video_api.py
git commit -m "feat: expose and regenerate batik videos"
```

### Task 7: Admin Web dan Dokumentasi

**Files:**
- Modify: `app/web/index.html`
- Modify: `app/web/static/admin.js`
- Modify: `app/web/static/admin.css`
- Modify: `README.md`

- [ ] **Step 1: Tambahkan kontrak UI ke test API atau test statis**

```python
def test_admin_web_contains_video_controls():
    html = Path("app/web/index.html").read_text(encoding="utf-8")
    js = Path("app/web/static/admin.js").read_text(encoding="utf-8")
    assert 'name="video_enabled"' in html
    assert "video_enabled" in js
    assert "<video" in js
    assert "muted" in js
```

- [ ] **Step 2: Jalankan test dan pastikan RED**

Run: `pytest tests/test_video_api.py::test_admin_web_contains_video_controls -v`

Expected: FAIL karena kontrol video belum ada.

- [ ] **Step 3: Implementasikan kontrol UI**

Tambahkan select `Video` dengan nilai aktif/mati. `createBatch()` mengirim:

```javascript
video_enabled: boolValue(form.get("video_enabled")),
```

Saat video aktif, paksa mode template `random_one` atau validasi `selectedTemplateIds().length === 1`. Render pasangan video:

```javascript
const video = costume.file_video
  ? `<video controls muted playsinline preload="metadata" src="/api/image/${encodeURIComponent(costume.file_video)}"></video>`
  : `<div class="video-pending">Video sedang diproses.</div>`;
```

CSS memberi video `aspect-ratio: 1`, `width: 100%`, dan `object-fit: cover` tanpa mengubah ukuran card.

- [ ] **Step 4: Dokumentasikan konfigurasi dan endpoint**

Tambahkan `VIDEO_WORKFLOW_PATH`, contoh request `video_enabled=true`, aturan tepat satu costume, lokasi output, endpoint regenerate, dan penjelasan recovery ComfyUI ke README.

- [ ] **Step 5: Jalankan test UI dan seluruh suite**

Run: `pytest -q`

Expected: seluruh test PASS tanpa warning baru.

- [ ] **Step 6: Commit task**

```bash
git add app/web README.md tests/test_video_api.py
git commit -m "feat: manage video generation from admin web"
```

### Task 8: Verifikasi Akhir

**Files:**
- Verify: seluruh file di atas

- [ ] **Step 1: Jalankan migration pada salinan database**

Run: `$env:DATABASE_URL='sqlite+aiosqlite:///./storage/database/video-verification.db'; alembic upgrade head`

Expected: revision `20260701_0002` diterapkan tanpa error.

- [ ] **Step 2: Jalankan seluruh test**

Run: `pytest -q`

Expected: seluruh test PASS.

- [ ] **Step 3: Periksa workflow hasil builder**

Run: `python scripts/inspect_workflows.py`

Expected: ketiga workflow terbaca; node video `269`, `320:312`, `320:299`, `320:310`, dan `75` tercantum.

- [ ] **Step 4: Uji server tanpa ComfyUI**

Run: `python -c "from app.main import app; print(app.title)"`

Expected: output `Titik Batik API`; test worker membuktikan gangguan ComfyUI menjadi retry tanpa menghapus motif/costume.

- [ ] **Step 5: Periksa worktree**

Run: `git status --short` dan `git diff --check`

Expected: tidak ada whitespace error; perubahan pengguna yang tidak terkait tetap utuh.
