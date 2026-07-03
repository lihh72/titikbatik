from pathlib import Path

import pytest

import app.runtime as runtime


def test_project_venv_python_uses_platform_layout(tmp_path):
    assert runtime.project_venv_python(tmp_path, platform_name="nt") == tmp_path / ".venv/Scripts/python.exe"
    assert runtime.project_venv_python(tmp_path, platform_name="posix") == tmp_path / ".venv/bin/python"


def test_ensure_project_runtime_reexecutes_with_venv_python(tmp_path, monkeypatch):
    venv_python = runtime.project_venv_python(tmp_path, platform_name="nt")
    venv_python.parent.mkdir(parents=True)
    venv_python.touch()
    executed = {}

    def fake_execv(executable, arguments):
        executed["executable"] = executable
        executed["arguments"] = arguments
        raise RuntimeError("exec intercepted")

    monkeypatch.setattr(runtime, "PROJECT_ROOT", tmp_path)
    monkeypatch.setattr(runtime, "_dependencies_available", lambda _: False)
    monkeypatch.setattr(runtime.os, "name", "nt")
    monkeypatch.setattr(runtime.os, "execv", fake_execv)

    with pytest.raises(RuntimeError, match="exec intercepted"):
        runtime.ensure_project_runtime("app.worker", ("sqlalchemy",))

    assert Path(executed["executable"]) == venv_python
    assert executed["arguments"][1:3] == ["-m", "app.worker"]
