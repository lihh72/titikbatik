# TitikBatik AI Web

Aplikasi Next.js untuk galeri publik dan area administrator Titik Batik. Backend FastAPI, worker ComfyUI, database, storage, serta admin sederhana bawaan backend berada terpisah di folder `../automation`.

## Menjalankan Frontend

Windows:

```powershell
cd C:\path\to\titikbatik\web
copy .env.example .env.local
npm.cmd install
npm.cmd run dev
```

Linux/macOS:

```bash
cd /path/to/titikbatik/web
cp .env.example .env.local
npm install
npm run dev
```

Buka `http://localhost:3000`.

## Menjalankan Automation Backend

Windows:

```powershell
cd C:\path\to\titikbatik\automation
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
copy .env.example .env
python -m app.dev
```

Linux/macOS:

```bash
cd /path/to/titikbatik/automation
python3 -m venv .venv
./.venv/bin/python -m pip install -r requirements.txt
cp .env.example .env
python3 -m app.dev
```

API tersedia di `http://127.0.0.1:8000`, dokumentasi di `/docs`, dan admin sederhana bawaan automation di `/admin`.

## Konfigurasi Frontend

Salin `web/.env.example` menjadi `web/.env.local`, lalu atur:

```env
INTERNAL_API_URL=http://127.0.0.1:8000
ADMIN_EMAIL=admin@titikbatik.local
ADMIN_PASSWORD=replace-with-a-strong-password
ADMIN_SESSION_TOKEN=replace-with-a-long-random-session-token
ADMIN_API_TOKEN=replace-with-a-long-random-api-token
ALLOW_LOCAL_DEMO=true
```

Route handler Next.js saat ini masih mengikuti kontrak API web sebelumnya. Saat integrasi automation dilakukan, mapping endpoint dan header admin perlu disesuaikan dengan API di `../automation`; backend demo lama di `web/backend` sudah dihapus agar tidak ada dua sumber backend.

## Pemeriksaan

```powershell
npm.cmd run lint
npx.cmd tsc --noEmit
npm.cmd run build
```
