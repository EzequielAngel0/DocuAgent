"""Reordenamiento semántico con Cohere Rerank v3.

Toma los candidatos recuperados de Qdrant y los reordena por relevancia
real frente a la consulta, devolviendo (índice_original, score).
"""

from functools import lru_cache

from app.core.config import settings


@lru_cache(maxsize=1)
def _client():
    import cohere

    return cohere.Client(api_key=settings.COHERE_API_KEY or "missing_cohere_key")


def rerank(query: str, documents: list[str], top_n: int) -> list[tuple[int, float]]:
    """Devuelve los `top_n` documentos más relevantes como (index, score)."""
    if not documents:
        return []
    response = _client().rerank(
        query=query,
        documents=documents,
        model=settings.COHERE_RERANK_MODEL,
        top_n=min(top_n, len(documents)),
    )
    return [(item.index, float(item.relevance_score)) for item in response.results]
