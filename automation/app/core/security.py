import secrets
from typing import Annotated

from fastapi import Header

from app.core.config import get_settings
from app.core.exceptions import AuthenticationError


async def require_admin_key(x_admin_key: Annotated[str | None, Header()] = None) -> None:
    settings = get_settings()
    if not x_admin_key or not secrets.compare_digest(x_admin_key, settings.admin_api_key):
        raise AuthenticationError("Invalid or missing admin API key")
