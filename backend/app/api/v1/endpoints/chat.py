"""Chat por WebSocket: ejecuta el agente RAG y transmite tokens en vivo.

Protocolo de mensajes (servidor → cliente):
  {"type": "status",  "status": "searching" | "generating"}
  {"type": "token",   "token": "..."}
  {"type": "done",    "log_id": int, "citations": [...]}
  {"type": "error",   "error": "..."}
"""

import asyncio
import json
from typing import Any

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.agent import prepare_context
from app.agent.prompts import FALLBACK_MESSAGE, build_system_prompt
from app.core.config import settings
from app.core.logging import get_logger
from app.core.turnstile import chat_turnstile_gate, verify_turnstile
from app.core.ws_ratelimit import WSRateLimiter, ws_client_ip
from app.db.session import SessionLocal
from app.models import AuditLog
from app.providers import stream_with_fallback

router = APIRouter()
logger = get_logger(__name__)
_chat_limiter = WSRateLimiter(settings.RATE_LIMIT_CHAT_PER_MIN, window_seconds=60)
# Tope GLOBAL (todas las IPs juntas) por hora: límite duro de costo de LLM/Cohere.
_chat_global_limiter = WSRateLimiter(settings.RATE_LIMIT_CHAT_GLOBAL_PER_HOUR, window_seconds=3600)


async def _save_log(
    query: str,
    response: str,
    confidence: float,
    category: str | None,
    citations: list[dict[str, Any]],
) -> int:
    async with SessionLocal() as db:
        log = AuditLog(
            query=query[:1024],
            response=response[:4096],
            confidence=confidence,
            category=category or "General",
            citations=citations,
        )
        db.add(log)
        await db.commit()
        return log.id


@router.websocket("/ws")
async def chat_websocket(websocket: WebSocket):
    await websocket.accept()
    client_ip = ws_client_ip(websocket)
    try:
        while True:
            data = json.loads(await websocket.receive_text())
            query = (data.get("query") or "").strip()
            category = data.get("category")
            if not query:
                continue

            # Anti-bot Turnstile (una sola vez por IP; la verificación se cachea).
            if settings.CHAT_REQUIRE_TURNSTILE and not chat_turnstile_gate.is_verified(client_ip):
                if await verify_turnstile(data.get("turnstile_token") or ""):
                    chat_turnstile_gate.mark_verified(client_ip)
                else:
                    await websocket.send_json(
                        {
                            "type": "error",
                            "error": "Verificación anti-bot requerida. Recarga la página.",
                        }
                    )
                    continue

            # Rate limit por IP: evita abuso y costo de LLM/Cohere.
            if not await _chat_limiter.allow(client_ip):
                await websocket.send_json(
                    {"type": "error", "error": "Demasiadas consultas, espera un momento."}
                )
                continue

            # Tope GLOBAL por hora: corta el costo total aunque vengan de muchas IPs.
            if not await _chat_global_limiter.allow("__global__"):
                await websocket.send_json(
                    {
                        "type": "error",
                        "error": "El servicio alcanzó su límite por ahora. Intenta más tarde.",
                    }
                )
                continue

            await websocket.send_json({"type": "status", "status": "searching"})

            # Recuperación + rerank + ensamblado (IO bloqueante → hilo aparte).
            state = await asyncio.to_thread(prepare_context, query, category)
            sources = state.get("sources", [])

            # Sin contexto o inyección detectada: respuesta honesta, sin LLM.
            if state.get("needs_fallback"):
                response_text = state.get("response") or FALLBACK_MESSAGE
                await websocket.send_json({"type": "token", "token": response_text})
                log_id = await _save_log(query, response_text, 0.0, category, [])
                await websocket.send_json({"type": "done", "log_id": log_id, "citations": []})
                continue

            # Generación con streaming (cadena de fallback de proveedores).
            await websocket.send_json({"type": "status", "status": "generating"})
            system_prompt = build_system_prompt(state["context"])
            accumulated = ""
            async for token in stream_with_fallback(system_prompt, query):
                accumulated += token
                await websocket.send_json({"type": "token", "token": token})

            log_id = await _save_log(
                query, accumulated, state.get("confidence", 0.0), category, sources
            )
            await websocket.send_json({"type": "done", "log_id": log_id, "citations": sources})

    except WebSocketDisconnect:
        logger.info("chat_ws_disconnected")
    except Exception as exc:  # noqa: BLE001
        # Se registra el detalle pero al cliente solo se le da un mensaje genérico.
        logger.error("chat_ws_error", error=str(exc))
        try:
            await websocket.send_json(
                {
                    "type": "error",
                    "error": "Ocurrió un error procesando tu consulta. Inténtalo de nuevo.",
                }
            )
        except Exception:  # noqa: BLE001
            pass
