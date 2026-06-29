"""Tests de la cadena de fallback del factory de proveedores (con fakes)."""

from collections.abc import AsyncIterator

import pytest

from app.core.exceptions import LLMProviderError
from app.providers import factory


class FakeProvider:
    def __init__(self, name: str, *, fail: bool = False, tokens: list[str] | None = None):
        self.name = name
        self.fail = fail
        self.tokens = tokens or ["ok-", name]

    async def generate(self, system: str, user: str) -> str:
        if self.fail:
            raise RuntimeError(f"{self.name} caído")
        return f"respuesta de {self.name}"

    async def stream(self, system: str, user: str) -> AsyncIterator[str]:
        if self.fail:
            raise RuntimeError(f"{self.name} caído")
        for t in self.tokens:
            yield t


def _wire(monkeypatch, chain, providers):
    monkeypatch.setattr(factory, "_candidate_providers", lambda: chain)
    monkeypatch.setattr(factory, "get_provider", lambda name: providers[name])


def test_fallback_chain_dedup_y_orden():
    # El proveedor activo va primero y no hay duplicados.
    chain = factory.settings.fallback_chain
    assert chain[0] == factory.settings.LLM_PROVIDER
    assert len(chain) == len(set(chain))


def test_get_provider_desconocido_lanza():
    with pytest.raises(LLMProviderError):
        factory.get_provider("proveedor_inexistente")


@pytest.mark.asyncio
async def test_generate_usa_primer_proveedor_sano(monkeypatch):
    _wire(monkeypatch, ["a", "b"], {"a": FakeProvider("a"), "b": FakeProvider("b")})
    text, used = await factory.generate_with_fallback("sys", "user")
    assert used == "a" and "a" in text


@pytest.mark.asyncio
async def test_generate_cae_al_siguiente_si_falla(monkeypatch):
    _wire(monkeypatch, ["a", "b"], {"a": FakeProvider("a", fail=True), "b": FakeProvider("b")})
    text, used = await factory.generate_with_fallback("sys", "user")
    assert used == "b"


@pytest.mark.asyncio
async def test_generate_lanza_si_todos_fallan(monkeypatch):
    _wire(
        monkeypatch,
        ["a", "b"],
        {"a": FakeProvider("a", fail=True), "b": FakeProvider("b", fail=True)},
    )
    with pytest.raises(LLMProviderError):
        await factory.generate_with_fallback("sys", "user")


@pytest.mark.asyncio
async def test_stream_emite_tokens_del_primer_proveedor(monkeypatch):
    _wire(
        monkeypatch, ["a", "b"], {"a": FakeProvider("a", tokens=["x", "y"]), "b": FakeProvider("b")}
    )
    out = [tok async for tok in factory.stream_with_fallback("sys", "user")]
    assert out == ["x", "y"]


@pytest.mark.asyncio
async def test_stream_cae_al_siguiente_si_el_primero_falla(monkeypatch):
    _wire(
        monkeypatch,
        ["a", "b"],
        {"a": FakeProvider("a", fail=True), "b": FakeProvider("b", tokens=["z"])},
    )
    out = [tok async for tok in factory.stream_with_fallback("sys", "user")]
    assert out == ["z"]
