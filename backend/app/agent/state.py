"""Estado tipado del grafo del agente (LangGraph).

Cada nodo recibe el estado y devuelve un diccionario parcial que LangGraph
fusiona. `total=False` permite construir el estado incrementalmente.
"""

from typing import Any, TypedDict


class AgentState(TypedDict, total=False):
    # Entrada
    query: str  # consulta ya sanitizada
    category: str | None  # filtro por categoría (opcional)

    # Recuperación
    query_embedding: list[float]
    retrieved_chunks: list[dict[str, Any]]  # candidatos crudos de Qdrant
    reranked_chunks: list[dict[str, Any]]  # filtrados y enriquecidos

    # Generación
    context: str  # contexto ensamblado para el prompt
    sources: list[dict[str, Any]]  # citas estructuradas para el front
    response: str
    confidence: float  # 0-100 (máxima de los chunks usados)
    provider_used: str

    # Control de flujo
    needs_fallback: bool
    regenerate: bool  # señal transitoria: reintentar la generación una vez
    regenerated: bool  # ya se reintentó (evita bucles infinitos)
