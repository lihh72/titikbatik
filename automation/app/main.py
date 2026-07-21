from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import get_settings
from app.core.exceptions import install_exception_handlers
from app.core.logging import configure_logging
from app.routers import admin_web, compatibility_batik, health, images, public_batik
from app.routers.admin import batik_imports, batches, batiks, costume_templates, jobs, settings as admin_settings, wordlists
from app.services.storage_service import StorageService


APP_DIR = Path(__file__).resolve().parent


def create_app() -> FastAPI:
    settings = get_settings()
    configure_logging()

    @asynccontextmanager
    async def lifespan(_: FastAPI):
        StorageService(settings).ensure_directories()
        yield

    app = FastAPI(title=settings.app_name, lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    install_exception_handlers(app)

    app.mount("/admin/static", StaticFiles(directory=APP_DIR / "web" / "static"), name="admin-static")
    app.include_router(admin_web.router)
    app.include_router(health.router)
    app.include_router(images.router)
    app.include_router(compatibility_batik.router)
    app.include_router(public_batik.statistics_router)
    app.include_router(public_batik.router)
    app.include_router(batches.router)
    app.include_router(jobs.router)
    app.include_router(batiks.router)
    app.include_router(batik_imports.router)
    app.include_router(wordlists.router)
    app.include_router(costume_templates.router)
    app.include_router(admin_settings.router)

    return app


app = create_app()
