"""Rate limiting para el WebSocket de chat (ventana deslizante en memoria).

slowapi no cubre WebSockets, así que se usa un limitador por-IP propio. Es
in-memory: válido para una sola instancia (staging/prod actual). Con varias
réplicas habría que respaldarlo en Redis.
"""

import asyncio
import time
from collections import defaultdict, deque

from starlette.websockets import WebSocket


def ws_client_ip(websocket: WebSocket) -> str:
    cf = websocket.headers.get("cf-connecting-ip")
    if cf:
        return cf
    xff = websocket.headers.get("x-forwarded-for")
    if xff:
        return xff.split(",")[0].strip()
    return websocket.client.host if websocket.client else "unknown"


class WSRateLimiter:
    def __init__(self, max_events: int, window_seconds: int) -> None:
        self.max_events = max_events
        self.window = window_seconds
        self._hits: dict[str, deque[float]] = defaultdict(deque)
        self._lock = asyncio.Lock()

    async def allow(self, key: str) -> bool:
        """True si la clave puede emitir otro evento dentro de la ventana."""
        now = time.monotonic()
        async with self._lock:
            hits = self._hits[key]
            while hits and now - hits[0] > self.window:
                hits.popleft()
            if len(hits) >= self.max_events:
                return False
            hits.append(now)
            return True
