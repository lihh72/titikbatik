import argparse
import asyncio
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from sqlalchemy import select

from app.core.config import get_settings
from app.core.database import async_session_factory
from app.models import Batik, BatikCostumeFile


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Find or delete orphan output files.")
    parser.add_argument("--delete", action="store_true")
    return parser.parse_args()


async def main() -> None:
    args = parse_args()
    settings = get_settings()
    async with async_session_factory() as session:
        preview_names = set((await session.scalars(select(Batik.file_preview))).all())
        costume_names = set((await session.scalars(select(BatikCostumeFile.filename))).all())

    orphaned: list[Path] = []
    for directory, known in [(settings.storage_preview_path, preview_names), (settings.storage_costume_path, costume_names)]:
        if not directory.exists():
            continue
        for path in directory.iterdir():
            if path.is_file() and path.name not in known:
                orphaned.append(path)
                if args.delete:
                    path.unlink()
    print({"orphaned_count": len(orphaned), "deleted": args.delete, "files": [str(path) for path in orphaned]})


if __name__ == "__main__":
    asyncio.run(main())
