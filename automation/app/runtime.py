import importlib.util
import os
import sys
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]


def project_venv_python(project_root: Path = PROJECT_ROOT, *, platform_name: str | None = None) -> Path:
    platform_name = platform_name or os.name
    if platform_name == "nt":
        return project_root / ".venv" / "Scripts" / "python.exe"
    return project_root / ".venv" / "bin" / "python"


def _dependencies_available(module_names: tuple[str, ...]) -> bool:
    return all(importlib.util.find_spec(module_name) is not None for module_name in module_names)


def ensure_project_runtime(module_name: str, required_modules: tuple[str, ...]) -> None:
    if _dependencies_available(required_modules):
        return

    venv_python = project_venv_python(PROJECT_ROOT)
    current_python = Path(sys.executable).resolve()
    if venv_python.exists() and current_python != venv_python.resolve():
        os.execv(
            str(venv_python),
            [str(venv_python), "-m", module_name, *sys.argv[1:]],
        )

    raise SystemExit(
        "Project dependencies are missing. Create .venv and run "
        f"'{venv_python} -m pip install -r requirements.txt'."
    )
