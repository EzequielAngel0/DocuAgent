"""Proveedor Google Gemini sobre langchain-google-genai."""

from app.core.config import settings
from app.providers.base import BaseLLMProvider


class GeminiProvider(BaseLLMProvider):
    name = "gemini"

    def _build_client(self):
        from langchain_google_genai import ChatGoogleGenerativeAI

        if not settings.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY no configurada.")
        return ChatGoogleGenerativeAI(
            model=self.model,
            temperature=self.temperature,
            max_output_tokens=self.max_tokens,
            google_api_key=settings.GEMINI_API_KEY,
        )
