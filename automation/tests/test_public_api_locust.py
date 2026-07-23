from pathlib import Path
import subprocess
import sys


def test_public_locust_user_uses_only_read_only_public_tasks():
    command = (
        "from tests.performance.locustfile import PublicBatikApiUser; "
        "print(','.join(sorted(task.__name__ for task in PublicBatikApiUser.tasks)))"
    )
    result = subprocess.run(
        [sys.executable, "-c", command],
        check=True,
        capture_output=True,
        text=True,
    )
    task_names = set(result.stdout.strip().split(","))

    assert task_names == {
        "list_batiks",
        "search_batiks",
        "get_batik_detail",
        "list_legacy_batiks",
        "search_legacy_batiks",
    }


def test_readme_documents_the_public_locust_command():
    readme = Path("README.md").read_text(encoding="utf-8")

    assert "locust -f tests/performance/locustfile.py" in readme
    assert "--users 1000" in readme
    assert "--spawn-rate 25" in readme
    assert "--run-time 1m" in readme
