"""Nodo terminal de fallback: respuesta honesta sin invocar al LLM."""
from app.agent.prompts import FALLBACK_MESSAGE
from app.agent.state import AgentState


def fallback(state: AgentState) -> dict:
    return {
        "response": state.get("response") or FALLBACK_MESSAGE,
        "sources": [],
        "confidence": state.get("confidence", 0.0),
        "needs_fallback": True,
    }
