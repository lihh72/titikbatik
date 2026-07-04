import re
import unicodedata
from collections.abc import Collection


MAX_SLUG_LENGTH = 220


def slugify_batik(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^a-z0-9]+", "-", normalized.lower()).strip("-")
    if not slug:
        return "batik"
    if slug.isdigit():
        slug = f"batik-{slug}"
    return slug[:MAX_SLUG_LENGTH].rstrip("-")


def deduplicate_slug(base: str, used: Collection[str]) -> str:
    if base not in used:
        return base

    suffix = 2
    while f"{base}-{suffix}" in used:
        suffix += 1
    return f"{base}-{suffix}"
