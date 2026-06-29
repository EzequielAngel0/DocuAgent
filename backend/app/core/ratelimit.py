"""Rate limiting con slowapi.

La clave de límite es la IP real del cliente: detrás de Cloudflare/túnel la
IP del proxy es inútil, por lo que se prioriza `CF-Connecting-IP` y luego
`X-Forwarded-For`. Se aplica por-endpoint (login, 2FA) con decoradores.
"""

from slowapi import Limiter
from starlette.requests import Request


def client_ip(request: Request) -> str:
    cf = request.headers.get("CF-Connecting-IP")
    if cf:
        return cf
    xff = request.headers.get("X-Forwarded-For")
    if xff:
        return xff.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


limiter = Limiter(key_func=client_ip)
