"""Interfaz común de proveedores LLM.

Cada proveedor concreto envuelve un modelo de chat de LangChain y expone
dos operaciones asíncronas: `generate` (respuesta completa) y `stream`
(tokens incrementales). El resto de la app depende solo de esta interfaz,
lo que permite intercambiar proveedores vía configuración.
"""
from abc import ABC, abstractmethod
from typing import AsyncIterator

from langchain_core.messages import HumanMessage, SystemMessage


class BaseLLMProvider(ABC):
    name: str = "base"

    def __init__(self, model: str, temperature: float, max_tokens: int) -> None:
        self.model = model
        self.temperature = temperature
        self.max_tokens = max_tokens
        self._client = self._build_client()

    @abstractmethod
    def _build_client(self):
        """Instancia el modelo de chat de LangChain (import perezoso)."""
        raise NotImplementedError

    def _messages(self, system: str, user: str):
        return [SystemMessage(content=system), HumanMessage(content=user)]

    async def generate(self, system: str, user: str) -> str:
        response = await self._client.ainvoke(self._messages(system, user))
        return response.content if hasattr(response, "content") else str(response)

    async def stream(self, system: str, user: str) -> AsyncIterator[str]:
        async for chunk in self._client.astream(self._messages(system, user)):
            token = getattr(chunk, "content", "")
            if token:
                yield token
