import argparse
import asyncio
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.core.database import async_session_factory
from app.services.legacy_import_service import LegacyImportService


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Import legacy Titik Batik API data.")
    parser.add_argument("--start-page", type=int, default=1)
    parser.add_argument("--max-pages", type=int, default=1)
    parser.add_argument("--download-images", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    return parser.parse_args()


async def main() -> None:
    args = parse_args()
    async with async_session_factory() as session:
        result = await LegacyImportService().import_pages(
            session,
            start_page=args.start_page,
            max_pages=args.max_pages,
            download_images=args.download_images,
            dry_run=args.dry_run,
        )
    print(result)


if __name__ == "__main__":
    asyncio.run(main())
