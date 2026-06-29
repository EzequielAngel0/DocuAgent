"""Nodo 3 — Reordenamiento semántico (Cohere Rerank) + filtro por umbral."""

from app.agent.state import AgentState
from app.core.config import settings
from app.rag import reranker as rerank_module


def reranker(state: AgentState) -> dict:
    query = state["query"]
    candidates = state.get("retrieved_chunks", [])
    if not candidates:
        return {"reranked_chunks": []}

    documents = [c["payload"]["content"] for c in candidates]
    ranked = rerank_module.rerank(query, documents, settings.RERANK_TOP_N)

    reranked = []
    for index, score in ranked:
        if score < settings.CONFIDENCE_THRESHOLD:
            continue
        payload = candidates[index]["payload"]
        reranked.append(
            {
                "content": payload["content"],
                "document_id": payload["document_id"],
                "document_name": payload["document_name"],
                "category": payload.get("category", "General"),
                "page": payload.get("page", 1),
                "confidence": round(score * 100, 1),
            }
        )
    return {"reranked_chunks": reranked}
