"""Nodo 1 — Análisis y saneamiento de la consulta.

Primera defensa anti-inyección: si la consulta coincide con patrones de
manipulación, corta el flujo hacia el fallback antes de tocar el LLM.
"""
from app.agent.state import AgentState
from app.agent.prompts import INJECTION_MESSAGE
from app.core.sanitizer import detect_injection, sanitize_query


def query_analyzer(state: AgentState) -> dict:
    raw = state.get("query", "")
    if detect_injection(raw):
        return {
            "query": sanitize_query(raw),
            "needs_fallback": True,
            "response": INJECTION_MESSAGE,
            "sources": [],
            "confidence": 0.0,
        }
    return {"query": sanitize_query(raw), "needs_fallback": False}
