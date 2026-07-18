import pytest

from app.core.ws_ratelimit import WSRateLimiter


@pytest.mark.asyncio
async def test_permite_hasta_el_limite_y_luego_bloquea():
    lim = WSRateLimiter(max_events=3, window_seconds=60)
    assert await lim.allow("ip1") is True
    assert await lim.allow("ip1") is True
    assert await lim.allow("ip1") is True
    assert await lim.allow("ip1") is False


@pytest.mark.asyncio
async def test_claves_independientes_por_ip():
    lim = WSRateLimiter(max_events=1, window_seconds=60)
    assert await lim.allow("a") is True
    assert await lim.allow("b") is True
    assert await lim.allow("a") is False
