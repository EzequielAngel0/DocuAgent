"""Embeddings multilingües con Cohere embed-v3.

Cohere distingue el tipo de entrada: `search_document` al indexar y
`search_query` al consultar. Respetar esa distinción es clave para la
calidad de recuperación.
"""
from functools import lru_cache
from typing import List

from app.core.config import settings


@lru_cache(maxsize=1)
def _client():
    import cohere

    return cohere.Client(api_key=settings.COHERE_API_KEY or "missing_cohere_key")


def embed_documents(texts: List[str]) -> List[List[float]]:
    """Vectoriza fragmentos de documentos para indexar en Qdrant."""
    if not texts:
        return []
    response = _client().embed(
        texts=texts,
        model=settings.COHERE_EMBED_MODEL,
        input_type="search_document",
    )
    return response.embeddings


def embed_query(text: str) -> List[float]:
    """Vectoriza una consulta del usuario para buscar en Qdrant."""
    response = _client().embed(
        texts=[text],
        model=settings.COHERE_EMBED_MODEL,
        input_type="search_query",
    )
    return response.embeddings[0]
