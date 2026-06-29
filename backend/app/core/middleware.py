"""Middleware de cabeceras de seguridad HTTP.

Añade cabeceras defensivas a cada respuesta. La CSP estricta no se aplica a
las rutas de documentación (Swagger/ReDoc) porque cargan recursos de un CDN.
"""

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.types import ASGIApp

from app.core.config import settings


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp) -> None:
        super().__init__(app)
        self._docs_paths = (
            f"{settings.API_PREFIX}/docs",
            f"{settings.API_PREFIX}/redoc",
            f"{settings.API_PREFIX}/openapi.json",
        )

    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)

        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("Referrer-Policy", "no-referrer")
        response.headers.setdefault(
            "Permissions-Policy", "geolocation=(), microphone=(), camera=()"
        )

        # HSTS solo fuera de desarrollo (requiere HTTPS, lo provee Cloudflare).
        if settings.ENVIRONMENT != "development":
            response.headers.setdefault(
                "Strict-Transport-Security", "max-age=31536000; includeSubDomains"
            )

        # CSP restrictiva para la API JSON; se omite en las rutas de docs.
        if not request.url.path.startswith(self._docs_paths):
            response.headers.setdefault(
                "Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'"
            )

        return response
