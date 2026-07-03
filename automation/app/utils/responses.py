from typing import Any

from app.core.exceptions import success_response


def ok(data: Any = None, message: str = "Operation completed successfully") -> dict[str, Any]:
    return success_response(data, message)
