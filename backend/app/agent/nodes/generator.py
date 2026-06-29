"""Nodo 5 — Generación de la respuesta con el LLM (cadena de fallback)."""

from app.agent.prompts import build_system_prompt
from app.agent.state import AgentState
from app.providers import generate_with_fallback


async def generator(state: AgentState) -> dict:
    system_prompt = build_system_prompt(state["context"])
    text, provider = await generate_with_fallback(system_prompt, state["query"])
    return {"response": text, "provider_used": provider}
