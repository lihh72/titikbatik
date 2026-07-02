# TitikBatik AI — Public Gallery + Private Admin Studio

Project ini sudah diubah agar **pengguna umum hanya dapat melihat galeri**, sedangkan tujuh fitur AI hanya tersedia untuk administrator.

## Struktur akses

### Area publik

- `/` — beranda galeri
- `/gallery` — koleksi motif terkurasi
- `/gallery/[id]` — detail motif
- `/about` — informasi proyek dan proses kurasi
- `/help` — bantuan penggunaan galeri

Area publik tidak menampilkan tombol generate, riwayat internal, prompt teknis, atau tautan menuju tujuh modul AI.

### Area administrator

- `/admin/login` — login administrator
- `/admin` — dashboard internal
- `/admin/studio` — FR-01 sampai FR-07
- `/admin/history` — riwayat hasil
- `/admin/gallery` — kurasi, publish, dan unpublish

Akses langsung ke halaman `/admin/*` dilindungi cookie sesi melalui `proxy.ts`.

## Tujuh fitur internal

1. FR-01 Generate Motif
2. FR-02 Batik Baju
3. FR-03 Orang Pakai Batik
4. FR-04 Video Visualisasi
5. FR-05 Auto Generate
6. FR-06 Seamless Pattern
7. FR-07 AI Upscaling

Hasil baru berstatus **draft**. Admin memilih hasil yang layak melalui halaman **Publikasi Galeri**.

## Menjalankan frontend

```powershell
cd C:\laragon\www\titikbatik-ai-complete
npm.cmd install --no-audit --no-fund
npm.cmd run dev
```

Buka:

```text
http://localhost:3000
```

## Login admin lokal

Konfigurasi lokal terdapat pada `.env.local`.

Kredensial bawaan untuk pengujian:

```text
Email    : admin@titikbatik.local
Password : admin123
```

Buka:

```text
http://localhost:3000/admin/login
```

**Ganti email, password, session token, dan API token sebelum deployment.**

## Menjalankan backend FastAPI

```powershell
cd C:\laragon\www\titikbatik-ai-complete\backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Pemeriksaan backend:

```text
http://127.0.0.1:8000/health
http://127.0.0.1:8000/docs
```

`/docs` hanya aktif saat `ENVIRONMENT=development`.

## Pemisahan API publik dan admin

### Endpoint publik

```text
GET /api/public/gallery
GET /api/public/gallery/{item_id}
```

Endpoint publik hanya mengembalikan data dengan status `published` dan `is_public = 1`.

### Endpoint admin

```text
GET    /api/admin/stats
POST   /api/admin/generate
GET    /api/admin/history
POST   /api/admin/history
PATCH  /api/admin/gallery/{item_id}
DELETE /api/admin/history/{item_id}
```

Endpoint admin membutuhkan header:

```text
Authorization: Bearer <ADMIN_API_TOKEN>
```

Frontend tidak mengirim token admin ke browser. Request diteruskan melalui Next.js route handlers pada folder `app/api/admin`.

## Menghubungkan API milik sendiri

Alamat backend diatur pada `.env.local`:

```env
INTERNAL_API_URL=http://127.0.0.1:8000
```

Jika nama endpoint API milik tim berbeda, sesuaikan mapping di:

```text
app/api/admin/generate/route.ts
app/api/admin/history/route.ts
app/api/admin/gallery/[id]/route.ts
app/api/public/gallery/route.ts
app/api/public/gallery/[id]/route.ts
```

Jangan meletakkan token rahasia pada variabel `NEXT_PUBLIC_*` karena nilai tersebut dapat terlihat oleh browser.

## Konfigurasi penting

Root `.env.local`:

```env
INTERNAL_API_URL=http://127.0.0.1:8000
ADMIN_EMAIL=admin@titikbatik.local
ADMIN_PASSWORD=admin123
ADMIN_SESSION_TOKEN=dev-titikbatik-admin-session-change-me
ADMIN_API_TOKEN=dev-titikbatik-api-token-change-me
ALLOW_LOCAL_DEMO=true
```

`backend/.env`:

```env
ENVIRONMENT=development
ENGINE_MODE=demo
DATABASE_PATH=./titikbatik.db
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
ADMIN_API_TOKEN=dev-titikbatik-api-token-change-me
COMFYUI_URL=http://127.0.0.1:8188
```

Nilai `ADMIN_API_TOKEN` pada kedua file harus sama.

## Catatan mode demo

- Tampilan motif masih menggunakan SVG lokal.
- Jika FastAPI tidak aktif dan `ALLOW_LOCAL_DEMO=true`, studio tetap dapat menghasilkan metadata demo.
- Status publikasi lokal disimpan pada `localStorage` untuk pengujian satu browser.
- Untuk publikasi lintas perangkat, jalankan FastAPI agar status tersimpan di SQLite.
- Ganti fungsi demo backend dengan adapter ComfyUI/Stable Diffusion milik tim untuk produksi.

## Validasi yang sudah dijalankan

```text
npm run lint
npx tsc --noEmit
python -m py_compile backend/main.py
```
