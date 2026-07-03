from app.models import BatikCostumeFile, GenerationBatch, GenerationJob
from app.schemas.generation import GenerationBatchCreate


def test_video_columns_are_declared_on_persistent_models():
    assert "video_enabled" in GenerationBatch.__table__.columns
    assert "file_video" in BatikCostumeFile.__table__.columns
    assert "source_costume_file_id" in GenerationJob.__table__.columns


def test_video_generation_is_disabled_by_default_for_compatibility():
    request = GenerationBatchCreate(amount=1)

    assert request.video_enabled is False
