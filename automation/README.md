# Titik Batik V2 Backend

Backend FastAPI untuk katalog dan otomasi generasi Titik Batik memakai SQLite, durable worker, dan ComfyUI.

## Fitur Utama

- API compatibility untuk Laravel lama:
  - `GET /api/batik/getbatik`
  - `GET /api/batik/search?q=keyword`
  - `GET /api/image/{filename}`
- API baru:
  - `GET /api/v1/batiks`
  - `GET /api/v1/batiks/{id}`
  - `GET /api/v1/batiks/search?q=keyword`
- Admin API dengan header `X-Admin-Key` untuk batch generation, jobs, batik, wordlist, template costume, dan dashboard.
- Worker durable terpisah: `python -m app.worker`.
- Prompt generator berbasis database wordlist, tanpa LLM eksternal.
- Workflow ComfyUI UI export dikonversi otomatis menjadi API prompt sebelum submit.
- Output gambar disimpan sebagai WebP, sedangkan video bisu disimpan sebagai MP4/WebM di `storage/output/video`.

## Workflow Mapping

Workflow boleh berupa ComfyUI UI export (`nodes` + `links`) atau ComfyUI API prompt format (`node_id` sebagai key dengan `class_type` dan `inputs`).
Backend akan menormalisasi keduanya menjadi API prompt sebelum submit ke ComfyUI.
Parameter node seperti seed, steps, cfg, sampler, scheduler, denoise, width, height, checkpoint, LoRA, dan prompt combine mengikuti file workflow apa adanya.
Admin API hanya mengganti prompt generate, input gambar model/batik, dan prefix nama output.

`../workflows/generatebatik.json`:

- Positive prompt: node `6`, `CLIPTextEncode`
- Negative prompt: node `7`, `CLIPTextEncode`
- Sampler: node `3`, `KSampler`
- Latent image: node `5`, `EmptyLatentImage`
- Save preview: node `9`, `SaveImage`
- Checkpoint: node `4`, `CheckpointLoaderSimple`
- LoRA: node `11`, `LoraLoader`

`../workflows/combinebatik.json`:

- Sampler: node `3`, `KSampler`
- Positive edit prompt: node `111`, `TextEncodeQwenImageEditPlus`
- Negative prompt: node `110`, `TextEncodeQwenImageEditPlus`
- Base costume image: node `78`, `LoadImage`
- Batik motif image: node `106`, `LoadImage`
- Latent image: node `112`, `EmptySD3LatentImage`
- Save costume: node `60`, `SaveImage`

`../workflows/videobatik.json`:

- Input hasil combine: node `269`, `LoadImage`
- Width: node `320:312`, dipaksa `720`
- Height: node `320:299`, dipaksa `1280`
- Create video: node `320:310`, input audio dilepas
- Save video: node `75`, `SaveVideo`

Parameter model, prompt, sampler, frame rate, durasi, dan LoRA video tetap mengikuti workflow. Hasil akhirnya selalu 720x1280 tanpa audio.

Lihat tabel node:

```powershell
python scripts/inspect_workflows.py
```

## Instalasi Windows

```powershell
cd C:\Users\faihi\OneDrive\Dokumen\GitHub\titikbatik\automation
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
copy .env.example .env
```

Linux/macOS:

```bash
cd /path/to/titikbatik/automation
python3 -m venv .venv
./.venv/bin/python -m pip install -r requirements.txt
cp .env.example .env
```

Runner `app.dev`, `app.server`, dan `app.worker` otomatis berpindah ke interpreter `.venv` jika perintah dijalankan dari Python global yang belum mempunyai dependensi proyek.

Edit `.env`, terutama:

- `ADMIN_API_KEY`
- `COMFYUI_BASE_URL`
- `GENERATE_WORKFLOW_PATH`, `COMBINE_WORKFLOW_PATH`, dan `VIDEO_WORKFLOW_PATH`
- path storage bila berbeda

## Database

```powershell
alembic upgrade head
python scripts/seed_wordlists.py
```

SQLite disimpan di:

```text
storage/database/titikbatik.db
```

Koneksi mengaktifkan WAL, foreign keys, dan busy timeout.

## Menjalankan API

Development satu terminal, menjalankan API dan worker sekaligus:

```powershell
python -m app.dev
```

Atau jalankan terpisah:

```powershell
python -m app.server
```

Runner `python -m app.server` bersifat cross-platform dan hanya memantau folder `app`, `scripts`, dan `../workflows`.
Ini mencegah reload terus-menerus karena SQLite `db-wal`, `db-shm`, dan heartbeat worker di folder `storage`.
Jika menjalankan manual:

```powershell
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload --reload-dir app --reload-dir scripts --reload-dir ../workflows
```

Swagger:

```text
http://127.0.0.1:8000/docs
```

Admin web:

```text
http://127.0.0.1:8000/admin
```

Masukkan `ADMIN_API_KEY` dari `.env` ke field Admin Key di halaman admin. Browser akan menyimpannya di localStorage.

Health:

```text
GET /health
GET /health/live
GET /health/ready
```

## Menjalankan Worker

Buka terminal kedua jika API dijalankan terpisah:

```powershell
cd C:\Users\faihi\OneDrive\Dokumen\GitHub\titikbatik\automation
python -m app.worker
```

Jika `.venv` belum dibuat, selesaikan langkah instalasi terlebih dahulu. Perintah langsung tanpa bootstrap juga tersedia melalui `.\.venv\Scripts\python.exe -m app.worker` di Windows atau `./.venv/bin/python -m app.worker` di Linux/macOS.

Worker akan:

1. Claim job `queued` atau `retry_wait`.
2. Submit workflow ke ComfyUI.
3. Poll `/history/{prompt_id}`.
4. Download output dari `/view`.
5. Simpan WebP atau video lokal secara atomik.
6. Insert metadata ke SQLite.
7. Buat job combine dan video berikutnya jika batch mengaktifkannya.

Recovery:

- Jika ComfyUI mati sebelum prompt terkirim, job masuk `retry_wait`.
- Jika ComfyUI mati setelah prompt terkirim, `comfyui_prompt_id` tetap disimpan.
- Saat worker retry atau restart, worker mengecek `/history/{prompt_id}` dan `/queue`.
- Jika prompt masih ada, worker lanjut mengambil hasil tanpa submit ulang.
- Jika prompt hilang karena ComfyUI restart, worker submit ulang workflow yang sama.
- Job yang gagal permanen bisa dikembalikan lewat `POST /api/admin/generation-batches/{batch_id}/retry-failed`.
- Recovery yang sama berlaku untuk tahap video; kegagalan video tidak menghapus motif atau costume yang sudah selesai.

## Contoh Admin Batch

```powershell
$headers = @{ "X-Admin-Key" = "change-this-secret" }
$body = @{
  amount = 10
  mode = "random"
  combine_enabled = $false
  allow_duplicate_prompts = $false
} | ConvertTo-Json

Invoke-RestMethod `
  -Method Post `
  -Uri "http://127.0.0.1:8000/api/admin/generation-batches" `
  -Headers $headers `
  -ContentType "application/json" `
  -Body $body
```

Pipeline tepat `1 generate : 1 combine : 1 video`:

```powershell
$headers = @{ "X-Admin-Key" = "change-this-secret" }
$body = @{
  amount = 1
  mode = "random"
  combine_enabled = $true
  video_enabled = $true
  costume_template_mode = "random_one"
  allow_duplicate_prompts = $false
} | ConvertTo-Json

Invoke-RestMethod `
  -Method Post `
  -Uri "http://127.0.0.1:8000/api/admin/generation-batches" `
  -Headers $headers `
  -ContentType "application/json" `
  -Body $body
```

Batch video wajib mengaktifkan combine dan menghasilkan tepat satu costume. Video dibuat otomatis dari output combine. Untuk membuat ulang video batik yang sudah mempunyai satu costume:

```text
POST /api/admin/batiks/{batik_id}/regenerate-video
X-Admin-Key: {ADMIN_API_KEY}
```

## Import Legacy

Dry run:

```powershell
python scripts/import_legacy_api.py --start-page 1 --max-pages 2 --dry-run
```

Import dengan gambar:

```powershell
python scripts/import_legacy_api.py --start-page 1 --max-pages 20 --download-images
```

## Costume Model Templates

Costume template adalah gambar model orang atau pakaian polos yang menjadi input workflow combine.
Upload template lewat admin API, lalu batch generation akan memasangkan hasil batik dengan template aktif tersebut.

Endpoint upload:

```text
POST /api/admin/costume-templates/upload
X-Admin-Key: {ADMIN_API_KEY}
multipart/form-data:
  file=<gambar model orang>
  name=Person Model - Plain Shirt
  description=Model lokal untuk combine batik
  is_active=true
  sort_order=10
```

Gambar template disimpan sebagai WebP di `storage/templates`.

## Dummy Data

Buat ulang gambar dummy dan isi database lokal:

```powershell
python scripts/seed_dummy_data.py
```

Hanya buat file gambar tanpa insert database:

```powershell
python scripts/seed_dummy_data.py --images-only
```

Script ini membuat preview di `storage/output/preview`, costume dummy di `storage/output/costume`, dan template dummy di `storage/templates`.
Setiap dummy batik dipasangkan dengan beberapa costume lewat `batik_costume_files.template_id`, termasuk template orang lokal `dummy_template_person_model.webp`.
Template dummy dibuat nonaktif supaya batch real dengan `costume_template_mode=all` hanya memakai template model yang di-upload admin.

## Cleanup File Orphan

```powershell
python scripts/cleanup_orphan_files.py
python scripts/cleanup_orphan_files.py --delete
```

## Testing

```powershell
pytest
```

Test utama mencakup prompt generator deterministik, ketiga workflow, chain job 1:1:1, recovery ComfyUI, penyimpanan WebP/video, API, dan proteksi path traversal.

## Troubleshooting

- `ComfyUI is offline`: pastikan ComfyUI berjalan di `COMFYUI_BASE_URL`.
- Costume belum jadi saat ComfyUI mati: nyalakan ComfyUI lagi, lalu worker akan retry/resume dari `comfyui_prompt_id`; gunakan `retry-failed` bila job sudah melewati batas retry.
- Video belum jadi saat ComfyUI mati: costume tetap tersimpan; nyalakan ComfyUI dan worker akan resume atau retry job video.
- `Video generation requires exactly one costume template`: gunakan `costume_template_mode=random_one` atau pilih tepat satu template.
- `Workflow mapping ... expected ...`: workflow JSON berubah; jalankan `scripts/inspect_workflows.py` lalu update mapping di `app/services/workflow_service.py`.
- `At least one active costume template is required`: tambahkan data template costume dan file gambarnya di `storage/templates`, atau buat batch dengan `combine_enabled=false`.
- `Invalid filename`: endpoint image menolak nama file dengan slash, backslash, atau karakter tidak aman.
- Database terkunci: worker default `WORKER_CONCURRENCY=1`; naikkan hanya jika SQLite dan GPU sanggup.
