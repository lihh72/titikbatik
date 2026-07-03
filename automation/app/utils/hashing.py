import hashlib
import json
from typing import Any


def stable_hash(value: Any) -> str:
    if isinstance(value, str):
        payload = value
    else:
        payload = json.dumps(value, sort_keys=True, ensure_ascii=False, separators=(",", ":"))
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def prompt_hash(positive_prompt: str, negative_prompt: str, selections: dict | None = None) -> str:
    return stable_hash(
        {
            "positive_prompt": positive_prompt.strip(),
            "negative_prompt": negative_prompt.strip(),
            "selections": selections or {},
        }
    )
