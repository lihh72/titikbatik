from typing import Literal

from pydantic import BaseModel, Field


class GenerationBatchCreate(BaseModel):
    amount: int = Field(ge=1)
    mode: Literal["random", "fixed", "mixed"] = "random"
    combine_enabled: bool = True
    video_enabled: bool = False
    costume_template_mode: Literal["all", "random_one", "selected", "none"] = "all"
    costume_template_ids: list[int] = Field(default_factory=list)
    random_seed: int | None = None
    allow_duplicate_prompts: bool = False
    fixed_wordlist_items: dict[str, int | list[int] | str | list[str]] = Field(default_factory=dict)
    requested_by: str | None = None
