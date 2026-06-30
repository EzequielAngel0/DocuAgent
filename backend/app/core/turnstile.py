"""Verificación de Cloudflare Turnstile (anti-bot) y cache de IPs verificadas.

`verify_turnstile` valida un token contra Cloudflare. `TurnstileGate` recuerda
qué IPs ya pasaron la verificación (con TTL) para no exigir un token en cada
mensaje del chat (el WebSocket abre una conexión por mensaje).
"""

import time

import httpx

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


async def verify_turnstile(token: str) -> bool:
    """Verifica el token de Turnstile contra la API de Cloudflare."""
    if not settings.TURNSTILE_SECRET_KEY or not token:
        return False
    try:
        async with httpx.AsyncClient() as client:
            res = await client.post(
                "https://challenges.cloudflare.com/turnstile/v0/siteverify",
                data={"secret": settings.TURNSTILE_SECRET_KEY, "response": token},
                timeout=5.0,
            )
            return res.json().get("success", False)
    except Exception:  # noqa: BLE001
        return False


class TurnstileGate:
    """Cache en memoria de IPs ya verificadas por Turnstile (con TTL)."""

    def __init__(self, ttl_seconds: int) -> None:
        self.ttl = ttl_seconds
        self._verified: dict[str, float] = {}

    def is_verified(self, ip: str) -> bool:
        exp = self._verified.get(ip)
        if exp is None:
            return False
        if time.monotonic() > exp:
            self._verified.pop(ip, None)
            return False
        return True

    def mark_verified(self, ip: str) -> None:
        self._verified[ip] = time.monotonic() + self.ttl


chat_turnstile_gate = TurnstileGate(settings.TURNSTILE_GATE_TTL_SECONDS)
