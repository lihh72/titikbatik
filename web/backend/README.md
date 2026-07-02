# Backend TitikBatik AI

Backend ini memisahkan endpoint publik dan endpoint administrator.

## Instalasi

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

## Endpoint publik

```text
GET /health
GET /api/public/gallery
GET /api/public/gallery/{item_id}
```

Pengunjung umum hanya menerima item yang telah dipublikasikan.

## Endpoint administrator

```text
GET    /api/admin/stats
POST   /api/admin/generate
GET    /api/admin/history
POST   /api/admin/history
PATCH  /api/admin/gallery/{item_id}
DELETE /api/admin/history/{item_id}
```

Gunakan bearer token yang sama dengan `ADMIN_API_TOKEN` di `backend/.env`.

## Publish dan unpublish

Publish:

```json
{
  "published": true
}
```

Unpublish:

```json
{
  "published": false
}
```

Kirim ke:

```text
PATCH /api/admin/gallery/{item_id}
```

## Produksi

Untuk menonaktifkan Swagger dan OpenAPI publik:

```env
ENVIRONMENT=production
```

Implementasikan adapter ComfyUI pada fungsi generate sebelum mengubah:

```env
ENGINE_MODE=production
```
