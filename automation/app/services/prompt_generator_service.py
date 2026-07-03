import random
from dataclasses import dataclass
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.models import WordlistCategory, WordlistItem
from app.repositories.wordlist_repository import WordlistRepository
from app.utils.hashing import prompt_hash

POSITIVE_TEMPLATE = (
    "Authentic Indonesian batik textile pattern featuring {motif_subject}, "
    "formed with {motif_shape}, using {color_palette}, in {batik_style}, "
    "arranged as {composition}, with {density} ornament density, {ornament}, "
    "traditional wax-resist texture, clean handcrafted linework, balanced textile design, "
    "seamless repeat, culturally respectful, high detail, production-ready fabric pattern."
)

KEYWORD_TEMPLATE = "batik pattern, {motif_subject}, {motif_shape}, {composition}"

DEFAULT_NEGATIVE_PROMPT = (
    "low quality, blurry, malformed ornament, broken repetition, inconsistent pattern, random text, "
    "watermark, logo, signature, photographic person, cropped motif, frame, border, distorted fabric, "
    "duplicate artifacts, oversaturated, compression artifacts"
)

REQUIRED_PROMPT_CATEGORIES = [
    "motif_subject",
    "motif_shape",
    "color_palette",
    "batik_style",
    "composition",
    "density",
    "ornament",
]


@dataclass(frozen=True)
class PromptBundle:
    keyword: str
    warna: str
    style: str
    positive_prompt: str
    negative_prompt: str
    prompt_hash: str
    selections: dict[str, dict[str, Any]]


class PromptGeneratorService:
    def __init__(self, repository: WordlistRepository | None = None) -> None:
        self.repository = repository or WordlistRepository()

    async def generate(
        self,
        session: AsyncSession,
        *,
        rng: random.Random,
        mode: str,
        fixed_wordlist_items: dict[str, int | list[int] | str | list[str]] | None = None,
    ) -> PromptBundle:
        categories = await self.repository.active_categories_with_items(session)
        by_code = {category.code: category for category in categories}
        fixed_wordlist_items = fixed_wordlist_items or {}

        values: dict[str, str] = {}
        selections: dict[str, dict[str, Any]] = {}
        for code in REQUIRED_PROMPT_CATEGORIES:
            category = by_code.get(code)
            if not category:
                raise ValueError(f"Wordlist category '{code}' is missing or inactive")
            item = self._select_item(category, rng, mode, fixed_wordlist_items.get(code))
            values[code] = item.value
            selections[code] = {"id": item.id, "value": item.value, "category_id": item.category_id}

        negative_prompt = DEFAULT_NEGATIVE_PROMPT
        negative_category = by_code.get("negative")
        if negative_category:
            negative_items = [item for item in negative_category.items if item.is_active]
            if negative_items:
                negative_mode = mode if fixed_wordlist_items.get("negative") is not None else "random"
                negative = self._select_item(negative_category, rng, negative_mode, fixed_wordlist_items.get("negative"))
                negative_prompt = f"{DEFAULT_NEGATIVE_PROMPT}, {negative.value}"
                selections["negative"] = {"id": negative.id, "value": negative.value, "category_id": negative.category_id}

        positive_prompt = POSITIVE_TEMPLATE.format(**values)
        keyword = KEYWORD_TEMPLATE.format(**values)
        hash_value = prompt_hash(positive_prompt, negative_prompt, selections)
        return PromptBundle(
            keyword=keyword,
            warna=values["color_palette"],
            style=values["batik_style"],
            positive_prompt=positive_prompt,
            negative_prompt=negative_prompt,
            prompt_hash=hash_value,
            selections=selections,
        )

    def _select_item(
        self,
        category: WordlistCategory,
        rng: random.Random,
        mode: str,
        fixed_value: int | list[int] | str | list[str] | None,
    ) -> WordlistItem:
        active_items = [item for item in category.items if item.is_active]
        if not active_items:
            raise ValueError(f"Wordlist category '{category.code}' has no active items")

        if mode in {"fixed", "mixed"} and fixed_value is not None:
            fixed_values = fixed_value if isinstance(fixed_value, list) else [fixed_value]
            candidates = [
                item
                for item in active_items
                if item.id in fixed_values or item.value in fixed_values or str(item.id) in fixed_values
            ]
            if not candidates:
                raise ValueError(f"Fixed wordlist item for '{category.code}' was not found or inactive")
            return candidates[0] if len(candidates) == 1 else rng.choice(candidates)

        if mode == "fixed":
            raise ValueError(f"Fixed mode requires a selected item for '{category.code}'")

        weights = [max(item.weight, 0.0001) for item in active_items]
        return rng.choices(active_items, weights=weights, k=1)[0]
