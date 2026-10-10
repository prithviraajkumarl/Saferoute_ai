import time
import uuid
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response, JSONResponse
from app.core.logging import logger
from app.core.exceptions import SafeRouteException


class RequestTrackingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        request.state.request_id = request_id

        start_time = time.perf_counter()
        try:
            response = await call_next(request)
            duration = time.perf_counter() - start_time
            response.headers["X-Request-ID"] = request_id
            response.headers["X-Process-Time"] = f"{duration:.4f}s"

            logger.info(
                f"{request.method} {request.url.path} completed with {response.status_code} in {duration:.4f}s",
                extra={"request_id": request_id}
            )
            return response
        except SafeRouteException as ex:
            duration = time.perf_counter() - start_time
            logger.warning(
                f"Domain exception on {request.method} {request.url.path}: {ex.detail}",
                extra={"request_id": request_id}
            )
            return JSONResponse(
                status_code=ex.status_code,
                content={
                    "error": True,
                    "error_code": ex.error_code,
                    "message": ex.detail,
                    "extra": ex.extra,
                    "request_id": request_id,
                },
                headers={"X-Request-ID": request_id, "X-Process-Time": f"{duration:.4f}s"},
            )
        except Exception as exc:
            duration = time.perf_counter() - start_time
            logger.error(
                f"Unhandled error on {request.method} {request.url.path}: {str(exc)}",
                exc_info=True,
                extra={"request_id": request_id}
            )
            return JSONResponse(
                status_code=500,
                content={
                    "error": True,
                    "error_code": "INTERNAL_SERVER_ERROR",
                    "message": "An unexpected internal server error occurred.",
                    "request_id": request_id,
                },
                headers={"X-Request-ID": request_id, "X-Process-Time": f"{duration:.4f}s"},
            )
