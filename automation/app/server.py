from app.runtime import ensure_project_runtime

ensure_project_runtime("app.server", ("uvicorn", "sqlalchemy"))

import uvicorn
from pathlib import Path

from app.core.config import get_settings


AUTOMATION_ROOT = Path(__file__).resolve().parents[1]
REPOSITORY_ROOT = AUTOMATION_ROOT.parent


def main() -> None:
    settings = get_settings()
    uvicorn.run(
        "app.main:app",
        host=settings.app_host,
        port=settings.app_port,
        reload=True,
        reload_dirs=[
            str(AUTOMATION_ROOT / "app"),
            str(AUTOMATION_ROOT / "scripts"),
            str(REPOSITORY_ROOT / "workflows"),
        ],
    )


if __name__ == "__main__":
    main()
