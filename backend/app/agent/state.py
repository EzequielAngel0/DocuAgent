"""Estado tipado del grafo del agente (LangGraph).

Cada nodo recibe el estado y devuelve un diccionario parcial que LangGraph
fusiona. `total=False` permite construir el estado incrementalmente.
"""
from typing import Any, Dict, List, Optional, TypedDict


class AgentState(TypedDict, total=False):
    # Entrada
    query: str  # consulta ya sanitizada
    category: Optional[str]  # filtro por categoría (opcional)

    # Recuperación
    query_embedding: List[float]
    retrieved_chunks: List[Dict[str, Any]]  # candidatos crudos de Qdrant
    reranked_chunks: List[Dict[str, Any]]  # filtrados y enriquecidos

    # Generación
    context: str  # contexto ensamblado para el prompt
    sources: List[Dict[str, Any]]  # citas estructuradas para el front
    response: str
    confidence: float  # 0-100 (máxima de los chunks usados)
    provider_used: str

    # Control de flujo
    needs_fallback: bool
