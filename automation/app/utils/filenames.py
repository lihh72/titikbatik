import re
import secrets
import unicodedata
from pathlib import Path

SAFE_FILENAME_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]{0,254}$")


def slugify(value: str, *, max_length: int = 60) -> str:
    normalized = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^A-Za-z0-9]+", "-", normalized).strip("-").lower()
    slug = re.sub(r"-{2,}", "-", slug)
    return (slug[:max_length].strip("-") or "batik")


def random_token(length: int = 12) -> str:
    return secrets.token_urlsafe(length).replace("-", "").replace("_", "")[:length]


def safe_filename(value: str) -> str:
    if "/" in value or "\\" in value:
        raise ValueError("Invalid filename")
    name = Path(value).name
    if name != value:
        raise ValueError("Invalid filename")
    if not SAFE_FILENAME_RE.match(name):
        raise ValueError("Invalid filename")
    return name


def build_output_filename(seed: int | None, slug: str, kind: str, suffix: str = "webp") -> str:
    token = random_token()
    seed_part = str(seed) if seed is not None else "noseed"
    return f"{token}_{seed_part}_{slugify(slug)}_{kind}.{suffix}"
