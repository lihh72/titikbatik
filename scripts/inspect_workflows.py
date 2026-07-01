from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.services.workflow_service import WorkflowService


def render_table(rows: list[dict[str, str]]) -> str:
    headers = ["node_id", "class_type", "title", "inputs", "connection", "candidate_parameter"]
    widths = {
        header: min(
            52,
            max(len(header), *(len(str(row.get(header, ""))) for row in rows)) if rows else len(header),
        )
        for header in headers
    }
    separator = " | ".join("-" * widths[header] for header in headers)
    lines = [" | ".join(header.ljust(widths[header]) for header in headers), separator]
    for row in rows:
        lines.append(" | ".join(str(row.get(header, ""))[: widths[header]].ljust(widths[header]) for header in headers))
    return "\n".join(lines)


def main() -> None:
    service = WorkflowService()
    for path in [
        Path("workflows/generatebatik.json"),
        Path("workflows/combinebatik.json"),
        Path("workflows/videobatik.json"),
    ]:
        print(f"\n{path}")
        print(render_table(service.inspect_workflow(path)))


if __name__ == "__main__":
    main()
