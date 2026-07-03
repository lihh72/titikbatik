import asyncio
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from sqlalchemy import select

from app.core.database import async_session_factory
from app.models import WordlistCategory, WordlistItem


CATEGORIES = [
    ("motif_subject", "Motif Subject", ["lotus flower", "hibiscus blossom", "peacock feather", "parang wave", "kawung circle", "cloud motif", "butterfly", "tropical leaf"]),
    ("motif_shape", "Motif Shape", ["flowing curved lines", "layered geometric repetition", "diagonal lereng arrangement", "circular four-petal geometry", "scattered botanical arrangement"]),
    ("color_palette", "Color Palette", ["deep indigo and warm ivory", "dark navy and cream", "royal blue and old gold", "soft peach and dove grey", "baby blue and warm ivory"]),
    ("batik_style", "Batik Style", ["traditional wax-resist Indonesian batik", "contemporary watercolor batik", "classic Solo sogan batik", "Cirebon mega mendung style", "modern geometric batik"]),
    ("composition", "Composition", ["seamless repeat pattern", "balanced all-over textile composition", "sparse placement with generous negative space", "dense ornamental repeat"]),
    ("density", "Density", ["sparse", "medium density", "dense intricate fill"]),
    ("ornament", "Ornament", ["fine isen-isen dots", "hand-drawn canting linework", "subtle floral filler", "geometric borderless accents", "soft wax crackle details"]),
    ("texture", "Texture", ["traditional wax-resist texture", "watercolor wash soft bleed effect", "clean handcrafted fabric texture"]),
    ("mood", "Mood", ["calm and elegant", "festive and refined", "heritage inspired", "fresh contemporary"]),
    ("negative", "Negative Prompt", ["low quality, blurry", "random text, watermark, logo", "cropped motif, frame, border", "broken repetition, malformed ornament"]),
]


async def main() -> None:
    async with async_session_factory() as session:
        for sort_order, (code, name, items) in enumerate(CATEGORIES, start=1):
            category = await session.scalar(select(WordlistCategory).where(WordlistCategory.code == code))
            if not category:
                category = WordlistCategory(
                    code=code,
                    name=name,
                    description=f"Default {name.lower()} wordlist",
                    sort_order=sort_order,
                    is_required=code in {"motif_subject", "motif_shape", "color_palette", "batik_style", "composition", "density", "ornament"},
                    selection_min=1,
                    selection_max=1,
                    is_active=True,
                )
                session.add(category)
                await session.flush()
            for value in items:
                existing = await session.scalar(
                    select(WordlistItem).where(WordlistItem.category_id == category.id, WordlistItem.value == value)
                )
                if not existing:
                    session.add(WordlistItem(category_id=category.id, value=value, weight=1.0, is_active=True))
        await session.commit()
    print("Seeded default wordlists.")


if __name__ == "__main__":
    asyncio.run(main())
