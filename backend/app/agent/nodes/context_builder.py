"""Nodo 4 — Ensamblado de contexto y citas.

Si no quedaron fragmentos tras el rerank, marca `needs_fallback` para que el
grafo responda honestamente sin invocar al LLM.
"""

from app.agent.prompts import build_context
from app.agent.state import AgentState


def context_builder(state: AgentState) -> dict:
    chunks = state.get("reranked_chunks", [])
    if not chunks:
        return {
            "context": "",
            "sources": [],
            "confidence": 0.0,
            "needs_fallback": True,
        }

    sources = []
    max_confidence = 0.0
    for chunk in chunks:
        max_confidence = max(max_confidence, chunk["confidence"])
        snippet = chunk["content"]
        sources.append(
            {
                "id": chunk["document_id"],
                "title": chunk["document_name"],
                "page": chunk["page"],
                "confidence": chunk["confidence"],
                "snippet": snippet[:300] + "..." if len(snippet) > 300 else snippet,
            }
        )

    return {
        "context": build_context(chunks),
        "sources": sources,
        "confidence": max_confidence,
        "needs_fallback": False,
    }
