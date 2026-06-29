"""Proveedor Ollama (modelos locales) sobre langchain-ollama.

Útil como respaldo offline o para entornos sin claves de API en la nube.
"""

from app.core.config import settings
from app.providers.base import BaseLLMProvider


class OllamaProvider(BaseLLMProvider):
    name = "ollama"

    def _build_client(self):
        from langchain_ollama import ChatOllama

        return ChatOllama(
            model=self.model,
            temperature=self.temperature,
            num_predict=self.max_tokens,
            base_url=settings.OLLAMA_BASE_URL,
        )
