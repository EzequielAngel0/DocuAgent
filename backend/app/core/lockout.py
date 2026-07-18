"""Bloqueo temporal de cuenta tras varios fallos de 2FA (en memoria).

Defensa anti fuerza-bruta sobre el código TOTP, complementaria al rate limit
por IP. In-memory: válido para una sola instancia; con réplicas usar Redis.
"""

import time
from collections import defaultdict

from app.core.config import settings


class LoginLockout:
    def __init__(self, max_fails: int, window_seconds: int) -> None:
        self.max_fails = max_fails
        self.window = window_seconds
        self._fails: dict[str, list[float]] = defaultdict(list)

    def _recent(self, key: str) -> list[float]:
        now = time.monotonic()
        fails = [t for t in self._fails[key] if now - t < self.window]
        self._fails[key] = fails
        return fails

    def is_locked(self, key: str) -> bool:
        return len(self._recent(key)) >= self.max_fails

    def record_fail(self, key: str) -> None:
        self._fails[key].append(time.monotonic())

    def reset(self, key: str) -> None:
        self._fails.pop(key, None)


login_lockout = LoginLockout(
    settings.LOGIN_LOCKOUT_MAX_FAILS, settings.LOGIN_LOCKOUT_WINDOW_SECONDS
)
