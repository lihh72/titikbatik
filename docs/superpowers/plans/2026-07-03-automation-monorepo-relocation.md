# Automation Monorepo Relocation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Memindahkan backend FastAPI/ComfyUI lengkap ke `automation/`, menghapus backend demo `web/backend/`, dan menggabungkan frontend terbaru dari `origin/main` tanpa kehilangan workflow lokal.

**Architecture:** `automation/` menjadi proyek Python mandiri yang dijalankan dari direktori tersebut dengan import `app.*`. Workflow tetap menjadi aset bersama di root repository dan diakses melalui `../workflows`; `web/` menjadi proyek Next.js frontend-only.

**Tech Stack:** FastAPI, SQLAlchemy async, SQLite/Alembic, pytest, ComfyUI API, Next.js, TypeScript, Git.

---

### Task 1: Kunci Kontrak Path Automation

**Files:**
- Create: `tests/test_automation_layout.py` lalu pindahkan menjadi `automation/tests/test_automation_layout.py`
- Modify after move: `automation/app/core/config.py`
- Modify after move: `automation/app/main.py`
- Modify after move: `automation/app/server.py`
- Modify after move: `automation/scripts/inspect_workflows.py`
- Modify after move: `automation/tests/helpers.py`
- Modify after move: workflow tests yang memakai path root

- [ ] **Step 1: Tulis test path yang gagal sebelum relokasi**

```python
from pathlib import Path

from app.core.config import Settings


def test_default_workflows_resolve_from_automation_to_repository_root(monkeypatch):
    automation_root = Path(__file__).resolve().parents[1]
    monkeypatch.chdir(automation_root)
    settings = Settings(_env_file=None)
    assert settings.path(settings.generate_workflow_path) == (automation_root.parent / "workflows/generatebatik.json").resolve()
    assert settings.path(settings.combine_workflow_path) == (automation_root.parent / "workflows/combinebatik.json").resolve()
    assert settings.path(settings.video_workflow_path) == (automation_root.parent / "workflows/videobatik.json").resolve()
```

- [ ] **Step 2: Jalankan test dari root dan pastikan RED**

Run: `.\.venv\Scripts\python.exe -m pytest tests/test_automation_layout.py -v`

Expected: FAIL karena test masih menganggap parent project adalah repository root, sedangkan backend belum berada di `automation/` dan default workflow masih `workflows/...`.

- [ ] **Step 3: Verifikasi target lalu pindahkan runtime secara mekanis**

```powershell
$root = (Resolve-Path '.').Path
$automation = (Resolve-Path 'automation').Path
if (-not $automation.StartsWith($root, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw "automation target is outside repository"
}

Remove-Item -LiteralPath "$automation\New Dokumen Teks.txt"
foreach ($name in @('app', 'alembic', 'scripts', 'tests', 'storage', 'docs')) {
  $source = Join-Path $root $name
  $target = Join-Path $automation $name
  if ((Resolve-Path $source).Path -notlike "$root*") { throw "Invalid source: $source" }
  Move-Item -LiteralPath $source -Destination $target
}
foreach ($name in @('.env', '.env.example', 'alembic.ini', 'README.md', 'requirements.txt')) {
  Move-Item -LiteralPath (Join-Path $root $name) -Destination (Join-Path $automation $name)
}
Move-Item -LiteralPath "$root\prompt_titikbatik_fastapi_comfyui_sqlite_v2.md" -Destination "$automation\docs\prompt_titikbatik_fastapi_comfyui_sqlite_v2.md"
```

Expected: root hanya menyisakan monorepo files, reports/output, `web` bila sudah tersedia, dan `workflows`; backend berada di `automation/`.

- [ ] **Step 4: Ubah default workflow dan path static**

```python
# automation/app/core/config.py
generate_workflow_path: str = "../workflows/generatebatik.json"
combine_workflow_path: str = "../workflows/combinebatik.json"
video_workflow_path: str = "../workflows/videobatik.json"

# automation/app/main.py
APP_DIR = Path(__file__).resolve().parent
app.mount("/admin/static", StaticFiles(directory=APP_DIR / "web" / "static"), name="admin-static")
```

Pada `automation/app/server.py`, bentuk reload directories dari absolute `AUTOMATION_ROOT / "app"`, `AUTOMATION_ROOT / "scripts"`, dan `AUTOMATION_ROOT.parent / "workflows"`.

- [ ] **Step 5: Ubah inspector dan helper test ke repository workflows**

```python
# automation/scripts/inspect_workflows.py
AUTOMATION_ROOT = Path(__file__).resolve().parents[1]
WORKFLOWS_ROOT = AUTOMATION_ROOT.parent / "workflows"

for path in [
    WORKFLOWS_ROOT / "generatebatik.json",
    WORKFLOWS_ROOT / "combinebatik.json",
    WORKFLOWS_ROOT / "videobatik.json",
]:
    ...

# automation/tests/helpers.py
AUTOMATION_ROOT = Path(__file__).resolve().parents[1]
WORKFLOWS_ROOT = AUTOMATION_ROOT.parent / "workflows"
```

Ganti setiap `Path("workflows/...json").resolve()` pada test menjadi `(WORKFLOWS_ROOT / "...json").resolve()` dan path static test menjadi `AUTOMATION_ROOT / "app/web/..."`.

- [ ] **Step 6: Jalankan test path dan workflow hingga GREEN**

Run dari `automation/`:

```powershell
& '..\.venv\Scripts\python.exe' -m pytest tests/test_automation_layout.py tests/test_workflow_service.py -v
& '..\.venv\Scripts\python.exe' scripts/inspect_workflows.py
```

Expected: test PASS; inspector menampilkan ketiga workflow dari root repository.

### Task 2: Pindahkan Environment, Storage, dan Dokumentasi

**Files:**
- Modify: `automation/.env`
- Modify: `automation/.env.example`
- Modify: `automation/README.md`
- Modify: `.gitignore`
- Verify: `automation/storage/database/titikbatik.db`

- [ ] **Step 1: Ubah workflow path environment**

```env
GENERATE_WORKFLOW_PATH=../workflows/generatebatik.json
COMBINE_WORKFLOW_PATH=../workflows/combinebatik.json
VIDEO_WORKFLOW_PATH=../workflows/videobatik.json
```

Pertahankan database dan storage sebagai `storage/...` karena current working directory runtime adalah `automation/`.

- [ ] **Step 2: Perbarui ignore rules root**

```gitignore
.venv/
automation/.venv/
automation/.env
automation/storage/database/*.db
automation/storage/database/*.db-*
automation/storage/output/preview/*
automation/storage/output/costume/*
automation/storage/output/video/*
automation/storage/output/temporary/*
automation/storage/templates/*
```

Pertahankan exception `.gitkeep` pada setiap direktori storage automation.

- [ ] **Step 3: Perbarui README automation**

README harus memakai:

```powershell
cd C:\Users\faihi\OneDrive\Dokumen\GitHub\titikbatik\automation
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
python -m app.dev
```

Dokumentasikan workflow di `../workflows`, database di `automation/storage`, API port 8000, worker, migration, dan command Linux `cd automation && python3 -m app.dev`.

- [ ] **Step 4: Buat venv automation tanpa memindahkan venv lama**

```powershell
& '..\.venv\Scripts\python.exe' -m venv .venv
& '.\.venv\Scripts\python.exe' -m pip install -r requirements.txt
```

Expected: `automation/.venv/Scripts/python.exe` dapat import `sqlalchemy`, `uvicorn`, dan `PIL`. Root `.venv` tetap diabaikan dan tidak masuk commit.

- [ ] **Step 5: Verifikasi database dan migration dari automation**

Run:

```powershell
.\.venv\Scripts\python.exe -m alembic upgrade head
.\.venv\Scripts\python.exe -m alembic current
```

Expected: `20260701_0002 (head)` dan database lama tetap berada di `automation/storage/database/titikbatik.db`.

### Task 3: Verifikasi Backend Setelah Relokasi dan Commit

**Files:**
- Test: `automation/tests/`
- Verify: `automation/app/`, `automation/scripts/`, `automation/alembic/`
- Commit: seluruh backend automation, workflow lokal, dan root ignore

- [ ] **Step 1: Jalankan seluruh test Python**

Run dari `automation/`:

```powershell
$base=(Resolve-Path '..\output').Path + '\pytest-temp'
$env:TEMP=$base
$env:TMP=$base
.\.venv\Scripts\python.exe -m pytest -p no:cacheprovider --basetemp "$base\automation-relocation" -W error::DeprecationWarning -q
```

Expected: seluruh test PASS tanpa warning.

- [ ] **Step 2: Uji runner gabungan**

Start `python -m app.dev` dari `automation/`, tunggu `GET http://127.0.0.1:8000/health/live` mengembalikan status `live`, pastikan log worker memuat `Worker idle` atau claim job, lalu hentikan hanya process tree yang dibuat test.

- [ ] **Step 3: Periksa schema dan file statis**

```powershell
.\.venv\Scripts\python.exe -c "from app.main import app; s=app.openapi(); print('/api/admin/generation-batches' in s['paths'])"
.\.venv\Scripts\python.exe -m compileall -q app scripts tests
```

Expected: output `True`; compileall exit 0; `GET /admin` dan `/admin/static/admin.js` merespons 200 saat server aktif.

- [ ] **Step 4: Commit relokasi sebelum merge**

```powershell
git add -A -- automation app alembic scripts tests storage docs .env.example alembic.ini README.md requirements.txt prompt_titikbatik_fastapi_comfyui_sqlite_v2.md .gitignore workflows/generatebatik.json workflows/combinebatik.json workflows/videobatik.json
git commit -m "refactor: isolate automation backend"
```

Expected: semua source backend tercatat di bawah `automation/`; root `app`, `alembic`, `scripts`, `tests`, `storage`, requirements, dan README tidak lagi ada.

### Task 4: Gabungkan origin/main dan Hapus Backend Demo

**Files:**
- Merge: `origin/main`
- Delete: `web/backend/`
- Modify: `web/README.md`
- Preserve: seluruh file Next.js lain di `web/`
- Preserve: workflow lokal generate/combine/video

- [ ] **Step 1: Pastikan perubahan runtime sudah committed**

Run: `git status --short`

Expected: hanya laporan/output lokal yang diabaikan atau untracked; tidak ada perubahan tracked backend yang tertinggal.

- [ ] **Step 2: Merge origin/main tanpa auto-commit**

```powershell
git merge --no-commit origin/main
```

Jika generate/combine konflik, selesaikan secara deterministik:

```powershell
git checkout --ours -- workflows/generatebatik.json workflows/combinebatik.json
git add workflows/generatebatik.json workflows/combinebatik.json
```

File merge non-konflik sudah berada di index Git, termasuk Next.js dan workflow tambahan. Jangan gunakan reset atau checkout pada file pengguna lain.

- [ ] **Step 3: Selesaikan merge**

```powershell
git commit -m "merge: integrate latest web application"
```

- [ ] **Step 4: Hapus backend demo web**

```powershell
$backend=(Resolve-Path 'web/backend').Path
$root=(Resolve-Path '.').Path
if (-not $backend.StartsWith((Join-Path $root 'web'), [System.StringComparison]::OrdinalIgnoreCase)) {
  throw "Invalid web backend target"
}
Remove-Item -LiteralPath $backend -Recurse
```

- [ ] **Step 5: Perbarui README web**

Ganti instruksi `cd ...\backend` dengan:

```powershell
cd ..\automation
python -m app.dev
```

Nyatakan bahwa frontend berada di `web/`, backend automation di `automation/`, dan `INTERNAL_API_URL=http://127.0.0.1:8000` tetap digunakan. Hapus penjelasan backend demo yang sudah tidak berlaku.

- [ ] **Step 6: Commit pemisahan frontend/backend**

```powershell
git add -A -- web/backend web/README.md
git commit -m "refactor: remove superseded web demo backend"
```

### Task 5: Verifikasi Monorepo Akhir

**Files:**
- Verify: `automation/`, `web/`, `workflows/`, Git history

- [ ] **Step 1: Verifikasi Python setelah merge**

Run dari `automation/`:

```powershell
$base=(Resolve-Path '..\output').Path + '\pytest-temp'
$env:TEMP=$base
$env:TMP=$base
.\.venv\Scripts\python.exe -m pytest -p no:cacheprovider --basetemp "$base\monorepo-final" -q
.\.venv\Scripts\python.exe -m alembic current
python scripts/inspect_workflows.py
```

Expected: seluruh test PASS; migration head; tiga workflow terbaca.

- [ ] **Step 2: Verifikasi frontend terbaru**

Run dari `web/`:

```powershell
npm.cmd ci --no-audit --no-fund
npm.cmd run lint
npx.cmd tsc --noEmit
```

Expected: install, lint, dan TypeScript check exit 0.

- [ ] **Step 3: Verifikasi struktur**

```powershell
Test-Path automation/app/worker.py
Test-Path automation/app/server.py
Test-Path web/backend
Test-Path web/package.json
Test-Path workflows/videobatik.json
```

Expected: `True`, `True`, `False`, `True`, `True`.

- [ ] **Step 4: Verifikasi Git**

```powershell
git diff --check
git status --short
git rev-list --left-right --count origin/main...HEAD
```

Expected: tidak ada whitespace error; frontend origin terintegrasi; worktree hanya dapat memuat laporan/output lokal yang sengaja tidak di-commit.
