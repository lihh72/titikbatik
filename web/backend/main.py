"""TitikBatik AI FastAPI service.

Public visitors can only read published gallery items. All AI generation,
history, publishing, and deletion endpoints require an administrator bearer
token. The service runs in demo mode until the ComfyUI adapter is installed.
"""

from __future__ import annotations

import json
import os
import sqlite3
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Annotated, Literal

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

DB_PATH = Path(os.getenv("DATABASE_PATH", str(BASE_DIR / "titikbatik.db")))
if not DB_PATH.is_absolute():
    DB_PATH = (BASE_DIR / DB_PATH).resolve()

ENGINE_MODE = os.getenv("ENGINE_MODE", "demo")
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
ADMIN_API_TOKEN = os.getenv("ADMIN_API_TOKEN", "dev-titikbatik-api-token-change-me")

app = FastAPI(
    title="TitikBatik AI API",
    version="2.0.0",
    docs_url="/docs" if ENVIRONMENT == "development" else None,
    redoc_url=None,
    openapi_url="/openapi.json" if ENVIRONMENT == "development" else None,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",") if origin.strip()],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

security = HTTPBearer(auto_error=False)


class GenerateRequest(BaseModel):
    motif: Literal["ceplok", "mega-mendung", "buketan", "kawung", "parang", "sekar-jagad"]
    primaryColor: str = Field(pattern=r"^#[0-9A-Fa-f]{6}$")
    secondaryColor: str = Field(pattern=r"^#[0-9A-Fa-f]{6}$")
    accentColor: str = Field(pattern=r"^#[0-9A-Fa-f]{6}$")
    style: Literal["Tradisional", "Modern", "Minimalis", "Eksperimental"]
    composition: Literal["Simetris", "Diagonal", "Berulang", "Organik"]
    density: Literal["Renggang", "Seimbang", "Padat"]
    count: Literal[1, 2, 4] = 1
    stage: Literal["motif", "auto-generate", "seamless", "garment", "human", "video", "upscale"] = "motif"


class HistoryItem(BaseModel):
    id: str
    title: str
    variant: str
    stage: str
    prompt: str
    colors: list[str]
    createdAt: str
    resolution: str
    style: str
    composition: str
    density: str
    sourceId: str | None = None


class PublishRequest(BaseModel):
    published: bool = True


def require_admin(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)],
) -> None:
    if credentials is None or credentials.scheme.lower() != "bearer" or credentials.credentials != ADMIN_API_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Administrator token is missing or invalid.",
            headers={"WWW-Authenticate": "Bearer"},
        )


def db_connection() -> sqlite3.Connection:
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def initialize_database() -> None:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with db_connection() as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS generation_history (
                id TEXT PRIMARY KEY,
                payload TEXT NOT NULL,
                created_at TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'draft',
                is_public INTEGER NOT NULL DEFAULT 0,
                published_at TEXT
            )
            """
        )
        existing_columns = {
            row["name"] for row in connection.execute("PRAGMA table_info(generation_history)").fetchall()
        }
        migrations = {
            "status": "ALTER TABLE generation_history ADD COLUMN status TEXT NOT NULL DEFAULT 'draft'",
            "is_public": "ALTER TABLE generation_history ADD COLUMN is_public INTEGER NOT NULL DEFAULT 0",
            "published_at": "ALTER TABLE generation_history ADD COLUMN published_at TEXT",
        }
        for column, statement in migrations.items():
            if column not in existing_columns:
                connection.execute(statement)


def prompt_from_request(request: GenerateRequest) -> str:
    motif = request.motif.replace("-", " ")
    return ", ".join(
        [
            f"batik {motif}",
            f"{request.style.lower()} style",
            f"{request.composition.lower()} composition",
            f"{request.density.lower()} ornament density",
            f"primary color {request.primaryColor}",
            f"secondary color {request.secondaryColor}",
            "Indonesian textile pattern, clean repeatable fabric design",
        ]
    )


def save_history(item: dict, *, status_value: str = "draft", is_public: bool = False) -> None:
    payload = {**item, "status": status_value, "isPublic": is_public}
    with db_connection() as connection:
        connection.execute(
            """
            INSERT INTO generation_history(id, payload, created_at, status, is_public, published_at)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                payload = excluded.payload,
                created_at = excluded.created_at,
                status = excluded.status,
                is_public = excluded.is_public,
                published_at = excluded.published_at
            """,
            (
                item["id"],
                json.dumps(payload),
                item["createdAt"],
                status_value,
                1 if is_public else 0,
                datetime.now(timezone.utc).isoformat() if is_public else None,
            ),
        )


def row_to_payload(row: sqlite3.Row) -> dict:
    payload = json.loads(row["payload"])
    payload["status"] = row["status"]
    payload["isPublic"] = bool(row["is_public"])
    payload["publishedAt"] = row["published_at"]
    return payload


def generate_demo_results(request: GenerateRequest) -> list[dict]:
    time.sleep(0.7)
    now = datetime.now(timezone.utc).isoformat()
    label = request.motif.replace("-", " ").title()
    prompt = prompt_from_request(request)
    results: list[dict] = []
    for index in range(request.count):
        item = {
            "id": f"{request.stage}-{uuid.uuid4().hex[:12]}",
            "title": f"{label} {index + 1:02d}",
            "variant": request.motif,
            "stage": request.stage,
            "prompt": prompt,
            "colors": [request.primaryColor, request.secondaryColor, request.accentColor],
            "createdAt": now,
            "resolution": "4096 × 4096" if request.stage == "upscale" else "1024 × 1024",
            "style": request.style,
            "composition": request.composition,
            "density": request.density,
            "status": "draft",
            "isPublic": False,
        }
        save_history(item)
        results.append(item)
    return results


@app.on_event("startup")
def startup() -> None:
    initialize_database()


@app.get("/health", tags=["System"])
def health() -> dict:
    return {"status": "ok", "engine_mode": ENGINE_MODE, "environment": ENVIRONMENT}


@app.get("/api/public/gallery", tags=["Public Gallery"])
def public_gallery(limit: int = 100) -> dict:
    safe_limit = max(1, min(limit, 200))
    with db_connection() as connection:
        rows = connection.execute(
            """
            SELECT payload, status, is_public, published_at
            FROM generation_history
            WHERE is_public = 1 AND status = 'published'
            ORDER BY published_at DESC
            LIMIT ?
            """,
            (safe_limit,),
        ).fetchall()
    return {"results": [row_to_payload(row) for row in rows]}


@app.get("/api/public/gallery/{item_id}", tags=["Public Gallery"])
def public_gallery_detail(item_id: str) -> dict:
    with db_connection() as connection:
        row = connection.execute(
            """
            SELECT payload, status, is_public, published_at
            FROM generation_history
            WHERE id = ? AND is_public = 1 AND status = 'published'
            """,
            (item_id,),
        ).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Published gallery item not found")
    return {"result": row_to_payload(row)}


@app.get("/api/admin/stats", tags=["Admin"], dependencies=[Depends(require_admin)])
def admin_stats() -> dict:
    with db_connection() as connection:
        total = connection.execute("SELECT COUNT(*) AS total FROM generation_history").fetchone()["total"]
        published = connection.execute("SELECT COUNT(*) AS total FROM generation_history WHERE is_public = 1").fetchone()["total"]
    return {
        "dataset_reference": 3000,
        "functional_modules": 7,
        "saved_results": total,
        "published_results": published,
        "engine_mode": ENGINE_MODE,
    }


@app.post("/api/admin/generate", tags=["Admin"], dependencies=[Depends(require_admin)])
def admin_generate(request: GenerateRequest) -> dict:
    if ENGINE_MODE != "demo":
        raise HTTPException(
            status_code=501,
            detail="ComfyUI production adapter has not been configured.",
        )
    return {"results": generate_demo_results(request)}


@app.get("/api/admin/history", tags=["Admin"], dependencies=[Depends(require_admin)])
def admin_history(limit: int = 100) -> dict:
    safe_limit = max(1, min(limit, 300))
    with db_connection() as connection:
        rows = connection.execute(
            """
            SELECT payload, status, is_public, published_at
            FROM generation_history
            ORDER BY created_at DESC
            LIMIT ?
            """,
            (safe_limit,),
        ).fetchall()
    return {"results": [row_to_payload(row) for row in rows]}


@app.post("/api/admin/history", tags=["Admin"], dependencies=[Depends(require_admin)])
def admin_create_history(item: HistoryItem) -> dict:
    payload = item.model_dump()
    save_history(payload)
    return {"result": {**payload, "status": "draft", "isPublic": False}}


@app.patch("/api/admin/gallery/{item_id}", tags=["Admin"], dependencies=[Depends(require_admin)])
def admin_publish(item_id: str, request: PublishRequest) -> dict:
    status_value = "published" if request.published else "draft"
    published_at = datetime.now(timezone.utc).isoformat() if request.published else None
    with db_connection() as connection:
        row = connection.execute("SELECT payload FROM generation_history WHERE id = ?", (item_id,)).fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="History item not found")
        payload = json.loads(row["payload"])
        payload["status"] = status_value
        payload["isPublic"] = request.published
        connection.execute(
            """
            UPDATE generation_history
            SET payload = ?, status = ?, is_public = ?, published_at = ?
            WHERE id = ?
            """,
            (json.dumps(payload), status_value, 1 if request.published else 0, published_at, item_id),
        )
    return {"result": payload}


@app.delete("/api/admin/history/{item_id}", tags=["Admin"], dependencies=[Depends(require_admin)])
def admin_delete_history(item_id: str) -> dict:
    with db_connection() as connection:
        cursor = connection.execute("DELETE FROM generation_history WHERE id = ?", (item_id,))
    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="History item not found")
    return {"deleted": item_id}
