from pathlib import Path

from app.core.config import Settings


def test_default_workflows_resolve_from_automation_to_repository_root(monkeypatch):
    automation_root = Path(__file__).resolve().parents[1]
    monkeypatch.chdir(automation_root)
    settings = Settings(_env_file=None)

    assert settings.path(settings.generate_workflow_path) == (
        automation_root.parent / "workflows/generatebatik.json"
    ).resolve()
    assert settings.path(settings.combine_workflow_path) == (
        automation_root.parent / "workflows/combinebatik.json"
    ).resolve()
    assert settings.path(settings.video_workflow_path) == (
        automation_root.parent / "workflows/videobatik.json"
    ).resolve()
