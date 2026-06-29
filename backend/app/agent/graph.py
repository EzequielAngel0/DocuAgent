"""Grafo del agente RAG (LangGraph).

Flujo: query_analyzer → retriever → reranker → context_builder → generator →
validator, con un nodo terminal `fallback`. Las transiciones condicionales
desvían al fallback ante inyección, ausencia de contexto o respuesta inválida.

Además de `run_agent` (ejecución completa, no-streaming), se expone
`prepare_context`, que ejecuta los nodos previos a la generación reutilizando
las mismas funciones para que el WebSocket pueda transmitir tokens en vivo.
"""

from functools import lru_cache

from langgraph.graph import END, START, StateGraph

from app.agent.nodes import (
    context_builder,
    fallback,
    generator,
    query_analyzer,
    reranker,
    retriever,
    validator,
)
from app.agent.state import AgentState


def _route_after_analyzer(state: AgentState) -> str:
    return "fallback" if state.get("needs_fallback") else "retriever"


def _route_after_context(state: AgentState) -> str:
    return "fallback" if state.get("needs_fallback") else "generator"


def _route_after_validator(state: AgentState) -> str:
    return "fallback" if state.get("needs_fallback") else "end"


@lru_cache(maxsize=1)
def build_agent_graph():
    graph = StateGraph(AgentState)

    graph.add_node("query_analyzer", query_analyzer)
    graph.add_node("retriever", retriever)
    graph.add_node("reranker", reranker)
    graph.add_node("context_builder", context_builder)
    graph.add_node("generator", generator)
    graph.add_node("validator", validator)
    graph.add_node("fallback", fallback)

    graph.add_edge(START, "query_analyzer")
    graph.add_conditional_edges(
        "query_analyzer",
        _route_after_analyzer,
        {"retriever": "retriever", "fallback": "fallback"},
    )
    graph.add_edge("retriever", "reranker")
    graph.add_edge("reranker", "context_builder")
    graph.add_conditional_edges(
        "context_builder",
        _route_after_context,
        {"generator": "generator", "fallback": "fallback"},
    )
    graph.add_edge("generator", "validator")
    graph.add_conditional_edges(
        "validator",
        _route_after_validator,
        {"end": END, "fallback": "fallback"},
    )
    graph.add_edge("fallback", END)

    return graph.compile()


async def run_agent(query: str, category: str | None = None) -> AgentState:
    """Ejecuta el grafo completo (sin streaming) y devuelve el estado final."""
    graph = build_agent_graph()
    initial: AgentState = {"query": query, "category": category}
    return await graph.ainvoke(initial)


def prepare_context(query: str, category: str | None = None) -> AgentState:
    """Ejecuta los nodos previos a la generación (para streaming en el WS).

    Síncrono a propósito: hace IO bloqueante (Cohere/Qdrant), por lo que el
    WebSocket lo invoca con `asyncio.to_thread`. Reutiliza exactamente las
    mismas funciones de nodo que el grafo, de modo que el camino con streaming
    y el camino completo son consistentes.
    """
    state: AgentState = {"query": query, "category": category}
    state.update(query_analyzer(state))
    if state.get("needs_fallback"):
        return state

    state.update(retriever(state))
    state.update(reranker(state))
    state.update(context_builder(state))
    return state
