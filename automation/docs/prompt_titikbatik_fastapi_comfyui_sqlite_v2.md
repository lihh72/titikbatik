# Prompt Implementasi Titik Batik V2
## FastAPI + ComfyUI + SQLite + Wordlist Prompt Generator + Batch Automation

Buat implementasi backend lengkap untuk project **Titik Batik**.

Lokasi project:

```text
C:\Users\faihi\OneDrive\Dokumen\GitHub\titikbatik
```

Workflow ComfyUI:

```text
C:\Users\faihi\OneDrive\Dokumen\GitHub\titikbatik\workflows\generatebatik.json
C:\Users\faihi\OneDrive\Dokumen\GitHub\titikbatik\workflows\combinebatik.json
```

Jangan hanya memberi pseudocode atau potongan file. Analisis workflow JSON yang sebenarnya, lalu buat seluruh source code yang dapat dijalankan.

---

# 1. Tujuan Sistem

Sistem terdiri dari dua bagian utama:

1. **Serve Backend**
   - Menyediakan API katalog batik untuk aplikasi Laravel.
   - Menyajikan file preview, costume, dan hasil lain.
   - Menyimpan metadata batik ke SQLite.
   - Meniru behavior API lama agar kode Laravel yang ada tetap kompatibel.

2. **Generation Automation**
   - Admin menentukan jumlah batik yang ingin dibuat.
   - Sistem membuat prompt otomatis dari wordlist.
   - Worker menjalankan workflow `generatebatik.json`.
   - Hasil motif dikirim ke workflow `combinebatik.json`.
   - Semua hasil disimpan ke folder lokal dan SQLite.
   - Proses dapat dilanjutkan setelah aplikasi restart.

Gunakan arsitektur job queue berbasis SQLite. Jangan memakai `FastAPI BackgroundTasks` sebagai mekanisme utama untuk job generasi panjang karena job harus tetap tercatat dan dapat dilanjutkan setelah restart.

---

# 2. Teknologi

Gunakan:

```text
Python 3.11+
FastAPI
Uvicorn
SQLAlchemy 2.x
aiosqlite
Alembic
Pydantic 2
pydantic-settings
httpx
python-multipart
Pillow
aiofiles
WebSocket atau polling ComfyUI
pytest
```

Gunakan asynchronous I/O untuk HTTP dan file handling yang sesuai.

Database:

```text
SQLite
storage/database/titikbatik.db
```

Aktifkan:

```text
PRAGMA journal_mode=WAL
PRAGMA foreign_keys=ON
PRAGMA busy_timeout
```

Gunakan transaksi, index, unique constraint, dan retry singkat ketika database terkunci.

---

# 3. Behavior API Lama yang Harus Dipertahankan

API lama:

```http
GET https://btx.agunghakase.my.id/api/batik/getbatik
GET https://btx.agunghakase.my.id/api/batik/getbatik?page=2
GET https://btx.agunghakase.my.id/api/batik/search?q=keyword
GET https://btx.agunghakase.my.id/api/image/{filename}
```

Bentuk response `getbatik` yang harus kompatibel:

```json
{
  "batiks": [
    {
      "id": 1639,
      "keyword": "batik pattern, parang wave with cloud accent",
      "warna": "baby blue and warm ivory",
      "style": "batik kontemporer watercolor wash soft bleed effect",
      "seed": 901817028514041,
      "file_preview": "filename_preview.webp",
      "file_costume": "[\"filename_costume_1.webp\"]",
      "file_video": null,
      "created_at": "2026-04-14 18:37:56"
    }
  ],
  "count": 32
}
```

Catatan kompatibilitas:

- `batiks` harus berupa array.
- `count` adalah jumlah item yang dikembalikan pada response tersebut.
- `file_costume` pada public compatibility API harus dikembalikan sebagai JSON string array atau `null`, karena frontend lama melakukan `json_decode`.
- Di database dan internal service, costume files harus dinormalisasi sebagai relasi/list, bukan disimpan sebagai string JSON jika tidak diperlukan.
- `file_video` boleh `null`.
- Search harus membutuhkan query `q`.
- Jika `q` kosong, return HTTP 400 atau 422 dengan pesan yang jelas.
- Image URL harus tetap berbentuk `/api/image/{filename}`.
- Jangan mengubah field lama karena akan dipakai oleh Laravel yang sudah ada.

Boleh menyediakan API versi baru di `/api/v1`, tetapi endpoint compatibility di atas wajib tetap tersedia.

---

# 4. Struktur Project

Gunakan struktur modular:

```text
titikbatik/
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── worker.py
│   ├── core/
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── logging.py
│   │   ├── security.py
│   │   └── exceptions.py
│   ├── models/
│   │   ├── batik.py
│   │   ├── costume_file.py
│   │   ├── wordlist.py
│   │   ├── generation_batch.py
│   │   ├── generation_job.py
│   │   ├── costume_template.py
│   │   └── app_setting.py
│   ├── schemas/
│   │   ├── batik.py
│   │   ├── wordlist.py
│   │   ├── generation.py
│   │   ├── batch.py
│   │   ├── job.py
│   │   └── common.py
│   ├── routers/
│   │   ├── compatibility_batik.py
│   │   ├── public_batik.py
│   │   ├── images.py
│   │   ├── health.py
│   │   └── admin/
│   │       ├── batches.py
│   │       ├── jobs.py
│   │       ├── batiks.py
│   │       ├── wordlists.py
│   │       ├── costume_templates.py
│   │       └── settings.py
│   ├── repositories/
│   │   ├── batik_repository.py
│   │   ├── batch_repository.py
│   │   ├── job_repository.py
│   │   └── wordlist_repository.py
│   ├── services/
│   │   ├── comfyui_service.py
│   │   ├── workflow_service.py
│   │   ├── prompt_generator_service.py
│   │   ├── generation_service.py
│   │   ├── combination_service.py
│   │   ├── storage_service.py
│   │   ├── image_service.py
│   │   └── legacy_import_service.py
│   └── utils/
│       ├── filenames.py
│       ├── hashing.py
│       └── responses.py
├── alembic/
├── workflows/
│   ├── generatebatik.json
│   └── combinebatik.json
├── storage/
│   ├── database/
│   ├── input/
│   ├── output/
│   │   ├── preview/
│   │   ├── costume/
│   │   ├── video/
│   │   └── temporary/
│   └── templates/
├── tests/
├── scripts/
│   ├── seed_wordlists.py
│   ├── import_legacy_api.py
│   └── inspect_workflows.py
├── .env.example
├── alembic.ini
├── requirements.txt
└── README.md
```

---

# 5. Environment Configuration

Buat `.env.example`:

```env
APP_NAME=Titik Batik API
APP_HOST=0.0.0.0
APP_PORT=8000
APP_ENV=development
APP_BASE_URL=http://127.0.0.1:8000

DATABASE_URL=sqlite+aiosqlite:///./storage/database/titikbatik.db

COMFYUI_BASE_URL=http://127.0.0.1:8188
COMFYUI_CLIENT_ID=titikbatik-worker
GENERATE_WORKFLOW_PATH=workflows/generatebatik.json
COMBINE_WORKFLOW_PATH=workflows/combinebatik.json

STORAGE_ROOT=storage
STORAGE_INPUT_DIR=storage/input
STORAGE_PREVIEW_DIR=storage/output/preview
STORAGE_COSTUME_DIR=storage/output/costume
STORAGE_VIDEO_DIR=storage/output/video
STORAGE_TEMPLATE_DIR=storage/templates
STORAGE_TEMP_DIR=storage/output/temporary

ADMIN_API_KEY=change-this-secret
MAX_BATCH_SIZE=500
MAX_UPLOAD_SIZE_MB=20
WORKER_CONCURRENCY=1
WORKER_POLL_INTERVAL_SECONDS=2
COMFYUI_REQUEST_TIMEOUT_SECONDS=30
COMFYUI_GENERATION_TIMEOUT_SECONDS=900
COMFYUI_MAX_RETRIES=3

PUBLIC_PAGE_SIZE=32
PUBLIC_MAX_PAGE_SIZE=100

LEGACY_API_BASE_URL=https://btx.agunghakase.my.id
ALLOWED_ORIGINS=http://localhost:8000,http://127.0.0.1:8000,http://localhost:3000
```

Jangan hardcode path, URL, limit, timeout, API key, atau jumlah worker.

---

# 6. Analisis Workflow ComfyUI

Analisis file asli:

```text
workflows/generatebatik.json
workflows/combinebatik.json
```

Pastikan workflow menggunakan **ComfyUI API Format**.

Buat script:

```text
scripts/inspect_workflows.py
```

Script menampilkan tabel:

```text
node_id
class_type
_meta.title
inputs
connection
candidate_parameter
```

Identifikasi node untuk:

```text
positive prompt
negative prompt
seed
steps
cfg
sampler
scheduler
width
height
batch size
denoise
LoadImage motif
LoadImage base costume
SaveImage preview
SaveImage costume
checkpoint
VAE
ControlNet/IPAdapter jika ada
```

Jangan mengasumsikan node ID. Buat mapping berdasarkan hasil workflow, menggunakan kombinasi:

```text
node ID
class_type
_meta.title
```

Gunakan mapping dari konfigurasi, misalnya:

```python
GENERATE_NODE_MAPPING = {
    "positive_prompt": "6",
    "negative_prompt": "7",
    "sampler": "3",
    "latent_image": "5",
    "save_image": "9"
}
```

Nilai di atas hanya contoh dan harus diganti berdasarkan workflow nyata.

Jika mapping tidak ditemukan, hentikan job dengan status `failed` dan error yang jelas. Jangan diam-diam memakai node yang salah.

---

# 7. Database Schema

## 7.1 `batiks`

Kolom minimal:

```text
id
keyword
warna
style
seed
positive_prompt
negative_prompt
file_preview
file_video nullable
prompt_hash unique
generation_job_id nullable
is_published
created_at
updated_at
```

`keyword`, `warna`, dan `style` harus tetap disimpan karena dipakai API lama.

## 7.2 `batik_costume_files`

```text
id
batik_id foreign key
filename
template_id nullable
sort_order
created_at
```

Satu batik dapat memiliki banyak costume image.

## 7.3 `wordlist_categories`

```text
id
code unique
name
description
is_required
selection_min
selection_max
sort_order
is_active
```

Contoh `code`:

```text
motif_subject
motif_shape
color_palette
batik_style
composition
density
ornament
texture
mood
negative
```

## 7.4 `wordlist_items`

```text
id
category_id
value
label nullable
weight default 1
is_active
metadata_json nullable
created_at
updated_at
```

Tambahkan index pada:

```text
category_id
is_active
```

## 7.5 `generation_batches`

```text
id UUID
requested_count
generate_count
combine_enabled
costume_template_mode
status
queued_count
running_count
completed_count
failed_count
cancelled_count
requested_by
settings_json
created_at
started_at nullable
completed_at nullable
```

Status:

```text
draft
queued
running
partially_completed
completed
failed
cancelled
```

## 7.6 `generation_jobs`

```text
id UUID
batch_id
sequence_number
job_type
status
attempt_count
max_attempts
positive_prompt
negative_prompt
prompt_hash
seed
workflow_name
comfyui_prompt_id nullable
source_batik_id nullable
input_preview_filename nullable
output_filename nullable
error_message nullable
locked_by nullable
locked_at nullable
available_at
started_at nullable
completed_at nullable
created_at
updated_at
```

`job_type`:

```text
generate
combine
```

Status:

```text
queued
claimed
submitting
running
completed
retry_wait
failed
cancelled
```

Gunakan unique constraint agar satu `sequence_number` tidak duplikat dalam satu batch.

## 7.7 `costume_templates`

```text
id
name
filename
description nullable
is_active
sort_order
created_at
updated_at
```

Template adalah gambar pakaian/model/produk yang digunakan workflow combine.

## 7.8 `app_settings`

```text
key unique
value_json
updated_at
```

Gunakan untuk pengaturan generator yang dapat diubah admin.

---

# 8. Prompt Generator Berbasis Wordlist

Prompt tidak dibuat oleh LLM eksternal. Prompt harus dibentuk dari wordlist database.

Admin dapat mengelola wordlist:

```text
warna
bentuk motif
objek motif
style batik
komposisi
kepadatan
ornamen tambahan
tekstur
mood
negative prompt
```

Contoh data:

```text
motif_subject:
- lotus flower
- hibiscus blossom
- peacock feather
- parang wave
- kawung circle
- cloud motif
- butterfly
- tropical leaf

motif_shape:
- flowing curved lines
- layered geometric repetition
- diagonal lereng arrangement
- circular four-petal geometry
- scattered botanical arrangement

color_palette:
- deep indigo and warm ivory
- dark navy and cream
- royal blue and old gold
- soft peach and dove grey

batik_style:
- traditional wax-resist Indonesian batik
- contemporary watercolor batik
- classic Solo sogan batik
- Cirebon mega mendung style
- modern geometric batik

composition:
- seamless repeat pattern
- balanced all-over textile composition
- sparse placement with generous negative space
- dense ornamental repeat

density:
- sparse
- medium density
- dense intricate fill
```

Template positive prompt:

```text
Authentic Indonesian batik textile pattern featuring {motif_subject},
formed with {motif_shape}, using {color_palette},
in {batik_style}, arranged as {composition},
with {density} ornament density, {ornament},
traditional wax-resist texture, clean handcrafted linework,
balanced textile design, seamless repeat, culturally respectful,
high detail, production-ready fabric pattern.
```

Template keyword singkat untuk field API lama:

```text
batik pattern, {motif_subject}, {motif_shape}, {composition}
```

Field database:

```text
keyword = gabungan motif utama, bentuk, dan komposisi
warna = nilai category color_palette
style = nilai category batik_style
```

Negative prompt template:

```text
low quality, blurry, malformed ornament, broken repetition,
inconsistent pattern, random text, watermark, logo, signature,
photographic person, cropped motif, frame, border, distorted fabric,
duplicate artifacts, oversaturated, compression artifacts
```

Persyaratan generator:

1. Pilih item aktif menggunakan weighted random.
2. Dukung deterministic generation dengan `random_seed`.
3. Simpan semua pilihan wordlist dalam `settings_json`.
4. Buat `prompt_hash`.
5. Hindari prompt yang sama jika `allow_duplicate_prompts=false`.
6. Retry kombinasi wordlist jika hash sudah ada.
7. Batasi percobaan untuk menghindari infinite loop.
8. Admin dapat memilih mode:
   - `random`
   - `fixed`
   - `mixed`
9. Pada mode fixed, admin dapat menentukan item/category tertentu.
10. Pada mode mixed, sebagian dipilih admin dan sisanya acak.
11. Seed ComfyUI dapat dibuat random untuk setiap job atau deterministik dari batch seed.
12. Simpan prompt final agar dapat diaudit dan diulang.

---

# 9. Batch Generation oleh Admin

Admin harus dapat memasukkan jumlah batik yang akan dibuat.

Endpoint:

```http
POST /api/admin/generation-batches
X-Admin-Key: {ADMIN_API_KEY}
```

Request contoh:

```json
{
  "amount": 100,
  "mode": "random",
  "combine_enabled": true,
  "costume_template_mode": "all",
  "costume_template_ids": [],
  "random_seed": 12345,
  "allow_duplicate_prompts": false,
  "fixed_wordlist_items": {}
}
```

Catatan implementasi: parameter workflow seperti seed, steps, cfg, sampler, scheduler, denoise, width, height, checkpoint, LoRA, dan prompt combine tidak diatur dari API. Nilai tersebut harus mengikuti file workflow JSON yang sedang dipakai. API hanya mengganti nilai dinamis yang wajib: prompt generate, input image combine, dan filename prefix output.

Validasi:

```text
amount >= 1
amount <= MAX_BATCH_SIZE
minimal satu costume template aktif jika combine_enabled=true
workflow tersedia
ComfyUI health boleh dicek, tetapi batch tetap dapat disimpan sebagai queued jika ComfyUI sedang offline
```

Saat batch dibuat:

1. Simpan `generation_batches`.
2. Buat sejumlah `generation_jobs` tipe `generate`.
3. Set status batch `queued`.
4. Return HTTP 202.

Response:

```json
{
  "success": true,
  "message": "Generation batch queued",
  "data": {
    "batch_id": "uuid",
    "requested_count": 100,
    "status": "queued",
    "status_url": "/api/admin/generation-batches/uuid"
  }
}
```

Endpoint lain:

```http
GET    /api/admin/generation-batches
GET    /api/admin/generation-batches/{batch_id}
POST   /api/admin/generation-batches/{batch_id}/cancel
POST   /api/admin/generation-batches/{batch_id}/retry-failed
GET    /api/admin/generation-batches/{batch_id}/jobs
GET    /api/admin/generation-jobs/{job_id}
```

Detail batch harus menampilkan progress:

```json
{
  "requested_count": 100,
  "queued_count": 60,
  "running_count": 1,
  "completed_count": 35,
  "failed_count": 4,
  "progress_percent": 35.0
}
```

---

# 10. Durable Worker

Buat worker terpisah:

```bash
python -m app.worker
```

API dijalankan terpisah:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Worker loop:

1. Cari job `queued` atau `retry_wait` yang `available_at <= now`.
2. Claim satu job menggunakan transaksi.
3. Isi `locked_by` dan `locked_at`.
4. Ubah status ke `claimed`.
5. Jalankan job.
6. Simpan hasil.
7. Ubah status selesai/gagal.
8. Update counter batch secara transaction-safe.
9. Lanjut ke job berikutnya.

Recovery:

- Saat worker startup, cari job `claimed`, `submitting`, atau `running` yang lock-nya kedaluwarsa.
- Periksa `comfyui_prompt_id`.
- Jika ComfyUI sudah selesai, ambil hasil.
- Jika tidak ditemukan, reset ke queued atau retry.
- Jangan membuat hasil duplikat.
- Simpan `prompt_hash` dan output filename dengan unique constraint.
- Gunakan exponential backoff untuk error sementara.
- Error validasi workflow tidak perlu retry terus-menerus.
- Saat ComfyUI offline, job masuk `retry_wait`, bukan langsung hilang.
- Worker concurrency default 1 agar aman untuk GPU dan SQLite.
- Dukung konfigurasi concurrency, tetapi jangan submit lebih banyak job daripada kapasitas yang ditentukan.

---

# 11. Pipeline Generate dan Combine

## Generate

```text
Generation job
    ↓
Pilih wordlist
    ↓
Bentuk positive/negative prompt
    ↓
Load generatebatik.json
    ↓
Patch node
    ↓
POST /prompt
    ↓
Poll /history atau WebSocket
    ↓
Ambil output
    ↓
Simpan sebagai WebP
    ↓
Insert record batik
```

## Combine

Jika `combine_enabled=true`:

1. Setelah preview berhasil, buat job combine untuk setiap template yang dipilih.
2. `batik_image` adalah preview yang baru dibuat.
3. `base_image` adalah costume template.
4. Jalankan `combinebatik.json`.
5. Simpan hasil ke `storage/output/costume`.
6. Insert ke `batik_costume_files`.
7. Batik dianggap berhasil jika preview berhasil.
8. Jika sebagian combine gagal, tandai batch `partially_completed` atau simpan failure per combine job.
9. Jangan membuat batik preview ulang hanya karena combine gagal.

Dukung mode costume template:

```text
all
random_one
selected
none
```

---

# 12. Penyimpanan File

Semua hasil ComfyUI harus disalin dari ComfyUI dan disimpan di project:

```text
storage/output/preview
storage/output/costume
storage/output/video
```

Jangan hanya menyimpan URL sementara ComfyUI.

Format hasil final:

```text
WebP
```

Gunakan Pillow untuk:

- Validasi file image.
- Mengubah PNG/JPEG hasil ComfyUI menjadi WebP.
- Menjaga kualitas melalui konfigurasi.
- Menghapus metadata yang tidak diperlukan.
- Memastikan file dapat dibuka sebelum masuk database.

Contoh nama file:

```text
{batik_id}_{seed}_{slug}_preview.webp
{batik_id}_{seed}_{slug}_costume_{index}.webp
```

Karena `batik_id` baru diketahui setelah insert, boleh menggunakan temporary filename/UUID dahulu, lalu rename setelah record dibuat.

Persyaratan:

- Nama file harus aman.
- Cegah path traversal.
- Gunakan atomic write: simpan `.tmp`, validasi, lalu rename.
- Jangan insert database sebelum file final berhasil ditulis.
- Jika insert database gagal, hapus file orphan.
- Buat script pembersihan orphan file.
- Endpoint image harus memeriksa filename dengan `Path.resolve()` dan memastikan masih berada di storage root.

Endpoint:

```http
GET /api/image/{filename}
GET /api/v1/images/{category}/{filename}
```

Endpoint compatibility harus dapat menemukan preview dan costume berdasarkan nama file tanpa membocorkan path sistem.

Tambahkan:

```text
ETag
Last-Modified
Cache-Control
Content-Type image/webp
```

---

# 13. ComfyUI Client

Gunakan:

```text
POST /prompt
GET /history/{prompt_id}
GET /queue
GET /view
POST /upload/image
WS /ws
```

Buat fungsi:

```python
async def check_health()
async def upload_image()
async def queue_prompt()
async def get_history()
async def get_queue()
async def wait_for_completion()
async def get_output_images()
async def download_output_image()
```

Tangani:

```text
ComfyUI offline
timeout
workflow invalid
node mapping salah
upload gagal
queue reject
execution error
output kosong
connection reset
```

Simpan `comfyui_prompt_id` segera setelah `/prompt` berhasil agar job dapat dipulihkan setelah restart.

---

# 14. Public Serve API

## Compatibility API

```http
GET /api/batik/getbatik
GET /api/batik/getbatik?page=1
GET /api/batik/getbatik?page=1&per_page=32
GET /api/batik/search?q=mega+mendung
GET /api/image/{filename}
```

`getbatik` hanya menampilkan batik:

```text
is_published = true
file_preview tidak null
```

Default page size:

```text
PUBLIC_PAGE_SIZE
```

Response harus tetap:

```json
{
  "batiks": [],
  "count": 0
}
```

Jangan menambahkan pagination metadata ke compatibility response jika berpotensi merusak frontend lama.

Urutan default harus bisa dikonfigurasi:

```text
newest
random
```

Jika mode random digunakan, jangan memakai `ORDER BY RANDOM()` pada tabel sangat besar tanpa strategi yang aman. Untuk SQLite ukuran kecil-menengah masih boleh, tetapi pisahkan implementasi agar mudah diganti.

## API V1

```http
GET /api/v1/batiks
GET /api/v1/batiks/{id}
GET /api/v1/batiks/search?q=...
```

Versi V1 boleh mengembalikan:

```text
pagination metadata
preview_url
costume_urls sebagai array
generation metadata yang aman
```

---

# 15. Admin CRUD

Lindungi seluruh `/api/admin/*` dengan:

```http
X-Admin-Key
```

Gunakan constant-time comparison.

Endpoint wordlist:

```http
GET    /api/admin/wordlist-categories
POST   /api/admin/wordlist-categories
PATCH  /api/admin/wordlist-categories/{id}
DELETE /api/admin/wordlist-categories/{id}

GET    /api/admin/wordlist-items
POST   /api/admin/wordlist-items
PATCH  /api/admin/wordlist-items/{id}
DELETE /api/admin/wordlist-items/{id}
POST   /api/admin/wordlist-items/import
```

Endpoint costume template:

```http
GET    /api/admin/costume-templates
POST   /api/admin/costume-templates
PATCH  /api/admin/costume-templates/{id}
DELETE /api/admin/costume-templates/{id}
```

Endpoint batik:

```http
GET    /api/admin/batiks
GET    /api/admin/batiks/{id}
PATCH  /api/admin/batiks/{id}
DELETE /api/admin/batiks/{id}
POST   /api/admin/batiks/{id}/publish
POST   /api/admin/batiks/{id}/unpublish
POST   /api/admin/batiks/{id}/regenerate-costume
```

Delete harus aman:

- Soft delete lebih disarankan.
- File jangan langsung hilang jika masih direferensikan.
- Sediakan cleanup terpisah.

---

# 16. Import Data API Lama

Buat script:

```bash
python scripts/import_legacy_api.py
```

Fungsi:

1. Ambil data dari legacy `getbatik`.
2. Dukung pagination sampai data kosong atau batas maksimum.
3. Upsert berdasarkan legacy ID atau kombinasi seed/filename.
4. Parse `file_costume` JSON string menjadi list.
5. Download preview dan costume.
6. Simpan lokal.
7. Jangan mengunduh file yang sudah ada dan valid.
8. Simpan checkpoint import agar dapat dilanjutkan.
9. Gunakan timeout dan retry.
10. Jangan membuat infinite loop.
11. Catat item gagal ke log/report.

Sediakan opsi:

```bash
--start-page
--max-pages
--download-images
--dry-run
```

---

# 17. Health dan Monitoring

Endpoint:

```http
GET /health
GET /health/live
GET /health/ready
```

Response utama:

```json
{
  "success": true,
  "status": "healthy",
  "services": {
    "api": "connected",
    "database": "connected",
    "comfyui": "connected",
    "worker": "connected"
  }
}
```

Worker heartbeat disimpan di database/app setting.

Tambahkan endpoint admin:

```http
GET /api/admin/dashboard
```

Isi:

```text
total batik
published batik
batch aktif
job queued
job running
job failed
jumlah hasil hari ini
status ComfyUI
last worker heartbeat
```

---

# 18. Response dan Error

Success:

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "message": "Readable error message",
  "errors": {}
}
```

Gunakan status code:

```text
200
201
202
400
401
404
409
413
422
429
500
502
503
504
```

Jangan expose stack trace, database path, atau API key.

---

# 19. Laravel Integration

Contoh mengambil daftar:

```php
$response = Http::timeout(10)
    ->get('http://127.0.0.1:8000/api/batik/getbatik', [
        'page' => 1,
    ]);
```

Search:

```php
$response = Http::timeout(10)
    ->get('http://127.0.0.1:8000/api/batik/search', [
        'q' => $keyword,
    ]);
```

Create batch admin:

```php
$response = Http::withHeaders([
        'X-Admin-Key' => config('services.titikbatik.admin_key'),
    ])
    ->timeout(30)
    ->post('http://127.0.0.1:8000/api/admin/generation-batches', [
        'amount' => 100,
        'mode' => 'random',
        'combine_enabled' => true,
        'costume_template_mode' => 'all',
        'allow_duplicate_prompts' => false,
    ]);
```

Check batch:

```php
$response = Http::withHeaders([
        'X-Admin-Key' => config('services.titikbatik.admin_key'),
    ])
    ->timeout(10)
    ->get("http://127.0.0.1:8000/api/admin/generation-batches/{$batchId}");
```

---

# 20. Testing

Buat test untuk:

```text
database migration
wordlist CRUD
weighted random dengan deterministic seed
prompt uniqueness
batch creation amount
MAX_BATCH_SIZE validation
job claim race condition
stale job recovery
ComfyUI mock success
ComfyUI timeout/retry
preview storage
costume storage
file_costume compatibility string
pagination
search q validation
image path traversal
admin API key
cancel batch
retry failed jobs
legacy importer
```

Gunakan temporary SQLite database dan temporary storage pada test.

---

# 21. Menjalankan Aplikasi

```bash
cd C:\Users\faihi\OneDrive\Dokumen\GitHub\titikbatik

python -m venv .venv
.venv\Scripts\activate

pip install -r requirements.txt

alembic upgrade head

python scripts/seed_wordlists.py

uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Jalankan worker pada terminal terpisah:

```bash
.venv\Scripts\activate
python -m app.worker
```

Swagger:

```text
http://127.0.0.1:8000/docs
```

---

# 22. Acceptance Criteria

Implementasi dianggap selesai jika:

1. FastAPI dan worker dapat dijalankan terpisah.
2. SQLite dan Alembic berjalan.
3. Admin dapat mengelola wordlist.
4. Admin dapat memasukkan jumlah batik yang ingin dibuat.
5. Batch membuat tepat sejumlah generation job yang diminta.
6. Prompt dibuat hanya dari wordlist dan template.
7. Duplicate prompt dapat dicegah.
8. Worker dapat resume setelah restart.
9. Workflow generate dijalankan melalui ComfyUI API.
10. Workflow combine menerima preview batik dan costume template yang benar.
11. Preview disimpan ke `storage/output/preview`.
12. Costume disimpan ke `storage/output/costume`.
13. Metadata masuk SQLite.
14. API compatibility memiliki field dan bentuk response yang sesuai API lama.
15. `file_costume` di API compatibility berupa JSON string array.
16. `/api/image/{filename}` dapat menyajikan file yang disimpan.
17. Path traversal ditolak.
18. ComfyUI offline tidak membuat data batch hilang.
19. Job gagal dapat di-retry.
20. Batch dapat dibatalkan.
21. Hasil dapat dipublish/unpublish.
22. Semua admin route dilindungi API key.
23. Seluruh endpoint terdokumentasi di Swagger.
24. Ada unit/integration test.
25. README berisi instalasi Windows, konfigurasi, migration, API, worker, dan troubleshooting.
26. Source code diberikan lengkap per file, bukan hanya potongan.

---

# 23. Urutan Pengerjaan yang Wajib

Kerjakan dalam urutan berikut:

1. Analisis `generatebatik.json` dan `combinebatik.json`.
2. Tampilkan tabel node dan mapping.
3. Tentukan node input/output yang benar.
4. Buat struktur project.
5. Buat SQLAlchemy model dan Alembic migration.
6. Buat wordlist seed.
7. Buat prompt generator.
8. Buat ComfyUI client.
9. Buat durable worker.
10. Buat storage service.
11. Buat public compatibility API.
12. Buat admin API.
13. Buat import script.
14. Buat test.
15. Buat README.
16. Tampilkan seluruh isi file implementasi.

Jangan menebak node workflow. Jika workflow JSON belum diberikan kepada AI, minta pengguna mengunggah kedua file JSON tersebut sebelum menentukan node mapping, tetapi tetap boleh membuat struktur umum yang tidak bergantung pada ID node.
