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
from app.core.logging import get_logger
from app.db.session import SessionLocal
from app.models import AuditLog
from app.providers import stream_with_fallback

router = APIRouter()
logger = get_logger(__name__)


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
    try:
        while True:
            data = json.loads(await websocket.receive_text())
            query = (data.get("query") or "").strip()
            category = data.get("category")
            if not query:
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
