"""Factory de proveedores LLM con cadena de fallback.

`LLM_PROVIDER` define el proveedor activo y `LLM_FALLBACK_CHAIN` el orden de
respaldo. `generate_with_fallback`/`stream_with_fallback` intentan cada
proveedor de la cadena hasta obtener respuesta; si todos fallan lanzan
`LLMProviderError`. Los proveedores se construyen de forma perezosa para
no exigir que todos los SDK estén instalados.
"""

from collections.abc import AsyncIterator

from app.core.config import settings
from app.core.exceptions import LLMProviderError
from app.core.logging import get_logger
from app.providers.anthropic_provider import AnthropicProvider
from app.providers.base import BaseLLMProvider
from app.providers.gemini_provider import GeminiProvider
from app.providers.ollama_provider import OllamaProvider
from app.providers.openai_provider import OpenAIProvider

logger = get_logger(__name__)

_REGISTRY: dict[str, type[BaseLLMProvider]] = {
    "openai": OpenAIProvider,
    "gemini": GeminiProvider,
    "anthropic": AnthropicProvider,
    "ollama": OllamaProvider,
}

# Modelo por defecto usado cuando el proveedor actúa como respaldo
# (el proveedor ACTIVO usa siempre settings.LLM_MODEL).
_FALLBACK_MODELS: dict[str, str] = {
    "openai": settings.OPENAI_MODEL,
    "gemini": settings.GEMINI_MODEL,
    "anthropic": settings.ANTHROPIC_MODEL,
    "ollama": settings.OLLAMA_MODEL,
}

# Cache de instancias ya construidas.
_INSTANCES: dict[str, BaseLLMProvider] = {}


def _model_for(name: str) -> str:
    if name == settings.LLM_PROVIDER:
        return settings.LLM_MODEL
    return _FALLBACK_MODELS.get(name, settings.LLM_MODEL)


def get_provider(name: str) -> BaseLLMProvider:
    """Devuelve (y cachea) el proveedor indicado o lanza si no es válido."""
    name = name.lower().strip()
    if name in _INSTANCES:
        return _INSTANCES[name]
    if name not in _REGISTRY:
        raise LLMProviderError(f"Proveedor LLM desconocido: {name}")
    provider = _REGISTRY[name](
        model=_model_for(name),
        temperature=settings.LLM_TEMPERATURE,
        max_tokens=settings.LLM_MAX_TOKENS,
    )
    _INSTANCES[name] = provider
    return provider


def _candidate_providers() -> list[str]:
    return settings.fallback_chain


async def generate_with_fallback(system: str, user: str) -> tuple[str, str]:
    """Genera una respuesta probando la cadena de proveedores.

    Returns: (texto, nombre_proveedor_usado).
    """
    last_error: Exception | None = None
    for name in _candidate_providers():
        try:
            provider = get_provider(name)
            text = await provider.generate(system, user)
            if text:
                return text, name
        except Exception as exc:  # noqa: BLE001 — se prueba el siguiente proveedor
            last_error = exc
            logger.warning("llm_provider_failed", provider=name, error=str(exc))
            continue
    raise LLMProviderError(f"Todos los proveedores LLM fallaron. Último error: {last_error}")


async def stream_with_fallback(system: str, user: str) -> AsyncIterator[str]:
    """Transmite tokens probando la cadena de proveedores.

    El fallback solo aplica antes de emitir el primer token; si un proveedor
    falla a mitad de stream se propaga el error (no se puede rebobinar).
    """
    last_error: Exception | None = None
    for name in _candidate_providers():
        try:
            provider = get_provider(name)
            emitted = False
            async for token in provider.stream(system, user):
                emitted = True
                yield token
            if emitted:
                return
        except Exception as exc:  # noqa: BLE001
            last_error = exc
            logger.warning("llm_stream_failed", provider=name, error=str(exc))
            continue
    raise LLMProviderError(
        f"Todos los proveedores LLM fallaron en streaming. Último error: {last_error}"
    )
