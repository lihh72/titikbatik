from app.runtime import ensure_project_runtime

ensure_project_runtime("app.server", ("uvicorn", "sqlalchemy"))

import uvicorn

from app.core.config import get_settings


def main() -> None:
    settings = get_settings()
    uvicorn.run(
        "app.main:app",
        host=settings.app_host,
        port=settings.app_port,
        reload=True,
        reload_dirs=["app", "scripts", "workflows"],
    )


if __name__ == "__main__":
    main()
