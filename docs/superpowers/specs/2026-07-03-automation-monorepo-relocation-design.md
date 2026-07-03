# Automation Monorepo Relocation Design

## Tujuan

Memindahkan seluruh backend FastAPI, durable worker ComfyUI, admin web sederhana, migration, test, script, dan storage Titik Batik ke folder `automation/`. Folder `web/` hanya berisi aplikasi Next.js terbaru, sedangkan workflow ComfyUI tetap berada di root `workflows/` sebagai aset bersama.

## Struktur Target

```text
automation/
  app/
  alembic/
  docs/
  scripts/
  storage/
  tests/
  .env.example
  alembic.ini
  README.md
  requirements.txt
web/
workflows/
```

File placeholder `automation/New Dokumen Teks.txt` dihapus. Backend demo `web/backend/` dari `origin/main` juga dihapus karena digantikan backend lengkap di `automation/`.

## Batas Pemindahan

Komponen berikut dipindahkan dari root ke `automation/`:

- `app/`
- `alembic/` dan `alembic.ini`
- `scripts/`
- `tests/`
- `storage/`
- `.env.example`
- `requirements.txt`
- README backend
- dokumentasi desain dan rencana backend di `docs/`
- file `.env` lokal tanpa memasukkannya ke Git

Laporan pengujian, output dokumen, dan file laporan akademik tetap di root karena bukan runtime backend.

## Workflow dan Path

Workflow tetap di root repository:

- `workflows/generatebatik.json`
- `workflows/combinebatik.json`
- `workflows/videobatik.json`

Nilai default dan `.env.example` automation memakai path `../workflows/...`. Script inspector, test workflow, dan watcher development menggunakan lokasi root tersebut. Storage dan database tetap relatif terhadap `automation/`, sehingga database aktif berada di `automation/storage/database/titikbatik.db`.

Path static admin tidak bergantung pada current working directory; aplikasi menyelesaikannya dari lokasi package `automation/app/web/static`.

## Cara Menjalankan

Backend dijalankan dari folder automation:

```powershell
cd automation
python -m app.dev
```

Worker dan API terpisah tetap tersedia:

```powershell
python -m app.server
python -m app.worker
```

Bootstrap runtime mencari virtual environment di `automation/.venv`. Windows memakai `.venv/Scripts/python.exe`; Linux dan macOS memakai `.venv/bin/python`.

## Integrasi Git

Branch lokal saat ini divergen dari `origin/main`. Integrasi dilakukan tanpa membuang perubahan pengguna:

1. Pindahkan dan verifikasi backend lokal di `automation/`.
2. Commit relokasi dan workflow lokal agar worktree bersih.
3. Merge `origin/main` terbaru.
4. Pertahankan seluruh frontend `web/` dari `origin/main`.
5. Hapus `web/backend/` setelah merge.
6. Jika workflow generate/combine konflik, pertahankan workflow lokal yang sudah dipakai backend; workflow lain dari `origin/main` tetap ditambahkan.
7. Perbarui dokumentasi web agar backend diarahkan ke `../automation` dan port 8000.

Tidak ada force push, reset, atau penghapusan perubahan pengguna.

## Kompatibilitas API

Relokasi tidak mengubah endpoint, schema database, job recovery, storage URL, admin key, maupun alur `generate -> combine -> video`. Frontend terbaru belum dipaksa mengikuti endpoint automation pada tahap ini karena web akan dikembangkan terpisah. Hanya dokumentasi lokasi backend yang diperbarui.

## Verifikasi

- Jalankan migration dari `automation/` dan pastikan revision `20260701_0002` aktif.
- Jalankan seluruh test Python dari `automation/`.
- Jalankan `python scripts/inspect_workflows.py` dan pastikan ketiga workflow terbaca.
- Jalankan `python -m app.dev`, periksa `/health/live`, dan pastikan worker idle atau memproses queue.
- Jalankan lint dan TypeScript check pada `web/` setelah merge.
- Periksa OpenAPI, admin static assets, database lama, output gambar/video, dan path traversal protection setelah relokasi.
- Jalankan `git diff --check` dan pastikan perubahan web terbaru tidak hilang.

