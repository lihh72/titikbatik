import subprocess
import sys
import time
from collections.abc import Sequence

from app.runtime import ensure_project_runtime

ensure_project_runtime("app.dev", ("uvicorn", "sqlalchemy"))


def _start(command: Sequence[str]) -> subprocess.Popen:
    return subprocess.Popen(command)


def main() -> None:
    processes = [
        _start([sys.executable, "-m", "app.server"]),
        _start([sys.executable, "-m", "app.worker"]),
    ]
    try:
        while True:
            exited = [process for process in processes if process.poll() is not None]
            if exited:
                break
            time.sleep(1)
    except KeyboardInterrupt:
        pass
    finally:
        for process in processes:
            if process.poll() is None:
                process.terminate()
        for process in processes:
            try:
                process.wait(timeout=10)
            except subprocess.TimeoutExpired:
                process.kill()


if __name__ == "__main__":
    main()
