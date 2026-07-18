"""Proveedor OpenAI (GPT) sobre langchain-openai."""

from app.core.config import settings
from app.providers.base import BaseLLMProvider


class OpenAIProvider(BaseLLMProvider):
    name = "openai"

    def _build_client(self):
        from langchain_openai import ChatOpenAI

        if not settings.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY no configurada.")
        return ChatOpenAI(
            model=self.model,
            temperature=self.temperature,
            max_tokens=self.max_tokens,
            api_key=settings.OPENAI_API_KEY,
            max_retries=settings.LLM_MAX_RETRIES,
        )
