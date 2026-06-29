"""Nodo 6 — Validación anti-alucinación post-generación.

Comprobación ligera: si el modelo no produjo texto, o admitió no tener la
información, se enruta al fallback estándar. No re-evalúa el contenido con
otro LLM (eso encarecería cada consulta); la garantía fuerte la dan el
system prompt blindado y el filtro por umbral de confianza.
"""

from app.agent.prompts import FALLBACK_MESSAGE
from app.agent.state import AgentState

_NO_INFO_MARKERS = (
    "no tengo suficiente información",
    "no encontré información",
    "no tengo información",
)


def validator(state: AgentState) -> dict:
    response = (state.get("response") or "").strip()
    if not response:
        return {"needs_fallback": True, "response": FALLBACK_MESSAGE}

    lowered = response.lower()
    if any(marker in lowered for marker in _NO_INFO_MARKERS):
        # El modelo admitió no tener la información: respeta esa honestidad.
        return {"needs_fallback": True, "sources": [], "confidence": 0.0}

    return {"needs_fallback": False}
