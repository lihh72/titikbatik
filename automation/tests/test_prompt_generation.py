import random

import pytest

from app.services.prompt_generator_service import PromptGeneratorService
from tests.helpers import seed_wordlists


@pytest.mark.asyncio
async def test_prompt_generation_is_deterministic(session):
    await seed_wordlists(session)
    service = PromptGeneratorService()

    first = await service.generate(session, rng=random.Random(123), mode="random")
    second = await service.generate(session, rng=random.Random(123), mode="random")

    assert first.positive_prompt == second.positive_prompt
    assert first.prompt_hash == second.prompt_hash
    assert first.keyword.startswith("batik pattern,")
    assert first.warna
    assert first.style


@pytest.mark.asyncio
async def test_fixed_mode_uses_selected_items(session):
    await seed_wordlists(session)
    service = PromptGeneratorService()
    prompt = await service.generate(
        session,
        rng=random.Random(1),
        mode="mixed",
        fixed_wordlist_items={"motif_subject": "parang wave", "color_palette": "soft peach and dove grey"},
    )

    assert "parang wave" in prompt.positive_prompt
    assert prompt.warna == "soft peach and dove grey"
