from pathlib import Path

from app.models import WordlistCategory, WordlistItem


AUTOMATION_ROOT = Path(__file__).resolve().parents[1]
WORKFLOWS_ROOT = AUTOMATION_ROOT.parent / "workflows"


DEFAULT_ITEMS = {
    "motif_subject": ["lotus flower", "parang wave"],
    "motif_shape": ["flowing curved lines", "layered geometric repetition"],
    "color_palette": ["deep indigo and warm ivory", "soft peach and dove grey"],
    "batik_style": ["traditional wax-resist Indonesian batik", "modern geometric batik"],
    "composition": ["seamless repeat pattern", "dense ornamental repeat"],
    "density": ["sparse", "dense intricate fill"],
    "ornament": ["fine isen-isen dots", "soft wax crackle details"],
    "negative": ["watermark, logo", "cropped motif"],
}


async def seed_wordlists(session) -> None:
    for order, (code, values) in enumerate(DEFAULT_ITEMS.items(), start=1):
        category = WordlistCategory(code=code, name=code.replace("_", " ").title(), sort_order=order)
        session.add(category)
        await session.flush()
        for value in values:
            session.add(WordlistItem(category_id=category.id, value=value, weight=1.0, is_active=True))
    await session.flush()
