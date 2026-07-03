# TitikBatik AI Web

Aplikasi Next.js untuk galeri publik dan pengelolaan automation Titik Batik. FastAPI, durable worker, SQLite, storage, dan admin backend berada di `../automation`.

## Konfigurasi

Salin file environment frontend:

```powershell
cd C:\path\to\titikbatik\web
Copy-Item .env.example .env.local
```

Isi `web/.env.local`:

```env
INTERNAL_API_URL=http://127.0.0.1:8000
ADMIN_API_KEY=nilai-yang-sama-dengan-automation
ADMIN_EMAIL=admin@titikbatik.local
ADMIN_PASSWORD=replace-with-a-strong-password
ADMIN_SESSION_TOKEN=replace-with-a-long-random-session-token
```

`ADMIN_API_KEY` wajib sama dengan nilai pada `automation/.env`. Key hanya dibaca route handler Next.js dan tidak dikirim ke browser.

## Menjalankan

Terminal pertama menjalankan FastAPI dan worker:

```powershell
cd C:\path\to\titikbatik\automation
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
Copy-Item .env.example .env
python -m app.dev
```

Terminal kedua menjalankan web:

```powershell
cd C:\path\to\titikbatik\web
npm.cmd install
npm.cmd run dev
```

Linux/macOS menggunakan perintah yang sama dengan `python3`, `./.venv/bin/python`, dan `npm`.

Alamat aplikasi:

- Web: `http://localhost:3000`
- Login admin: `http://localhost:3000/admin/login`
- FastAPI: `http://127.0.0.1:8000`
- Dokumentasi API: `http://127.0.0.1:8000/docs`

## Fitur Admin

- Dashboard kesehatan FastAPI, worker, dan ComfyUI.
- Generation batch dengan mode random, mixed, atau fixed.
- Pipeline generate, combine costume, dan video 720x1280 tanpa audio.
- Pemantauan batch/job, cancel, serta retry pekerjaan gagal.
- Preview pasangan motif, costume, dan video.
- Publish, unpublish, hapus, regenerate costume, dan regenerate video.
- CRUD dan import wordlist.
- Upload serta pengelolaan costume template.
- Penyimpanan app settings.

Semua proses generation bersifat asynchronous. Web menampilkan status yang disimpan worker; tidak ada fallback hasil simulasi ketika FastAPI atau ComfyUI mati.

## Pemeriksaan

```powershell
npm.cmd test
npm.cmd run lint
npx.cmd tsc --noEmit
npm.cmd run build
```
