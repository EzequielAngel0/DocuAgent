"""Nodo 2 — Recuperación de candidatos desde Qdrant (top-K)."""
from app.agent.state import AgentState
from app.core.config import settings
from app.rag import embeddings
from app.rag.vector_store import vector_store


def retriever(state: AgentState) -> dict:
    query = state["query"]
    query_vector = embeddings.embed_query(query)
    candidates = vector_store.search(
        query_vector=query_vector,
        category=state.get("category"),
        limit=settings.RETRIEVAL_TOP_K,
    )
    return {"query_embedding": query_vector, "retrieved_chunks": candidates}
