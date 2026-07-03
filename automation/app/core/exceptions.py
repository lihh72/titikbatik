from typing import Any

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

HTTP_422_STATUS = (
    status.HTTP_422_UNPROCESSABLE_CONTENT
    if hasattr(status, "HTTP_422_UNPROCESSABLE_CONTENT")
    else 422
)


class AppError(Exception):
    status_code = status.HTTP_400_BAD_REQUEST

    def __init__(self, message: str, *, errors: dict[str, Any] | None = None) -> None:
        self.message = message
        self.errors = errors or {}


class AuthenticationError(AppError):
    status_code = status.HTTP_401_UNAUTHORIZED


class NotFoundError(AppError):
    status_code = status.HTTP_404_NOT_FOUND


class ConflictError(AppError):
    status_code = status.HTTP_409_CONFLICT


class WorkflowMappingError(AppError):
    status_code = HTTP_422_STATUS


class ExternalServiceError(AppError):
    status_code = status.HTTP_502_BAD_GATEWAY


class ServiceUnavailableError(AppError):
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE


def success_response(data: Any = None, message: str = "Operation completed successfully") -> dict[str, Any]:
    return {"success": True, "message": message, "data": data if data is not None else {}}


def error_response(message: str, errors: dict[str, Any] | list[Any] | None = None) -> dict[str, Any]:
    return {"success": False, "message": message, "errors": errors if errors is not None else {}}


async def app_error_handler(_: Request, exc: AppError) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content=error_response(exc.message, exc.errors))


async def validation_error_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
    return JSONResponse(
        status_code=HTTP_422_STATUS,
        content=error_response("Request validation failed", {"details": exc.errors()}),
    )


async def unhandled_error_handler(_: Request, __: Exception) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=error_response("Internal server error"),
    )


def install_exception_handlers(app: FastAPI) -> None:
    app.add_exception_handler(AppError, app_error_handler)
    app.add_exception_handler(RequestValidationError, validation_error_handler)
    app.add_exception_handler(Exception, unhandled_error_handler)
