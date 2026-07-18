"""Recuperación RAG de alto nivel: embed → buscar → rerank → filtrar.

Devuelve fragmentos enriquecidos con metadatos y una confianza (0-100)
proveniente del score de rerank, ya filtrados por el umbral configurado.
"""

from typing import Any

from app.core.config import settings
from app.rag import embeddings, reranker
from app.rag.vector_store import vector_store


def retrieve_and_rerank(query: str, category_filter: str | None = None) -> list[dict[str, Any]]:
    # 1. Vectorizar consulta
    query_vector = embeddings.embed_query(query)

    # 2. Recuperar candidatos (top-K) de Qdrant
    candidates = vector_store.search(
        query_vector=query_vector,
        category=category_filter,
        limit=settings.RETRIEVAL_TOP_K,
    )
    if not candidates:
        return []

    # 3. Reordenar con Cohere Rerank
    documents = [c["payload"]["content"] for c in candidates]
    ranked = reranker.rerank(query, documents, settings.RERANK_TOP_N)

    # 4. Filtrar por umbral de confianza y enriquecer metadatos
    results: list[dict[str, Any]] = []
    for index, score in ranked:
        if score < settings.CONFIDENCE_THRESHOLD:
            continue
        payload = candidates[index]["payload"]
        results.append(
            {
                "content": payload["content"],
                "document_id": payload["document_id"],
                "document_name": payload["document_name"],
                "category": payload.get("category", "General"),
                "page": payload.get("page", 1),
                "confidence": round(score * 100, 1),
            }
        )
    return results
