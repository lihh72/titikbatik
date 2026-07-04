from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, inspect, text

from app.core.config import get_settings


ROOT = Path(__file__).resolve().parents[1]


def test_slugify_batik_normalizes_keyword() -> None:
    from app.utils.slugs import slugify_batik

    assert slugify_batik("  Kawung Geometris -- Biru! ") == "kawung-geometris-biru"


def test_slugify_batik_prefixes_numeric_keyword() -> None:
    from app.utils.slugs import slugify_batik

    assert slugify_batik("10") == "batik-10"


def test_slugify_batik_falls_back_for_empty_result() -> None:
    from app.utils.slugs import slugify_batik

    assert slugify_batik("!!!") == "batik"


def test_deduplicate_slug_uses_next_available_suffix() -> None:
    from app.utils.slugs import deduplicate_slug

    assert deduplicate_slug("kawung", {"kawung", "kawung-2", "kawung-3"}) == "kawung-4"


def test_batik_model_has_permanent_unique_slug() -> None:
    from app.models.batik import Batik

    slug_column = Batik.__table__.c.slug

    assert slug_column.nullable is False
    assert slug_column.unique is True
    assert slug_column.index is True
    assert slug_column.type.length == 255


def test_migration_backfills_permanent_unique_slugs(tmp_path, monkeypatch) -> None:
    database_path = tmp_path / "batik-slugs.db"
    monkeypatch.setenv("DATABASE_URL", f"sqlite+aiosqlite:///{database_path.as_posix()}")
    get_settings.cache_clear()

    config = Config()
    config.set_main_option("script_location", str(ROOT / "alembic"))
    engine = None

    try:
        command.upgrade(config, "20260701_0002")

        engine = create_engine(f"sqlite:///{database_path.as_posix()}")
        now = "2026-07-04 12:00:00"
        rows = [
            {"keyword": "Kawung", "file_preview": "kawung-1.webp", "prompt_hash": "a" * 64},
            {"keyword": "Kawung", "file_preview": "kawung-2.webp", "prompt_hash": "b" * 64},
            {"keyword": "10", "file_preview": "ten.webp", "prompt_hash": "c" * 64},
        ]
        with engine.begin() as connection:
            connection.execute(
                text(
                    """
                    INSERT INTO batiks (
                        keyword, warna, style, seed, positive_prompt, negative_prompt,
                        file_preview, file_video, prompt_hash, generation_job_id,
                        is_published, deleted_at, created_at, updated_at
                    ) VALUES (
                        :keyword, 'biru', 'geometris', 1, 'positive', 'negative',
                        :file_preview, NULL, :prompt_hash, NULL, 1, NULL, :created_at, :updated_at
                    )
                    """
                ),
                [{**row, "created_at": now, "updated_at": now} for row in rows],
            )

        command.upgrade(config, "head")

        with engine.connect() as connection:
            slugs = connection.execute(text("SELECT slug FROM batiks ORDER BY id")).scalars().all()
        schema = inspect(engine)
        slug_column = next(column for column in schema.get_columns("batiks") if column["name"] == "slug")
        slug_index = next(index for index in schema.get_indexes("batiks") if index["name"] == "ix_batiks_slug")

        assert slugs == ["kawung", "kawung-2", "batik-10"]
        assert slug_column["nullable"] is False
        assert slug_index["unique"] == 1
    finally:
        if engine is not None:
            engine.dispose()
        get_settings.cache_clear()
