"""Proveedor Anthropic (Claude) sobre langchain-anthropic."""

from app.core.config import settings
from app.providers.base import BaseLLMProvider


class AnthropicProvider(BaseLLMProvider):
    name = "anthropic"

    def _build_client(self):
        from langchain_anthropic import ChatAnthropic

        if not settings.ANTHROPIC_API_KEY:
            raise ValueError("ANTHROPIC_API_KEY no configurada.")
        return ChatAnthropic(
            model=self.model,
            temperature=self.temperature,
            max_tokens=self.max_tokens,
            api_key=settings.ANTHROPIC_API_KEY,
        )
