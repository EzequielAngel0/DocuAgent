import json
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.session import SessionLocal
from app.db.models import AuditLog
from app.services.rag_pipeline import hybrid_search_and_rerank

# Importar modelos de LangChain para orquestación unificada
from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage

router = APIRouter()

def get_llm():
    """Retorna la instancia del LLM unificada según la configuración.
    """
    if settings.LLM_PROVIDER == "openai":
        return ChatOpenAI(
            model=settings.LLM_MODEL,
            temperature=settings.LLM_TEMPERATURE,
            max_tokens=settings.LLM_MAX_TOKENS,
            openai_api_key=settings.OPENAI_API_KEY,
        )
    elif settings.LLM_PROVIDER == "gemini":
        return ChatGoogleGenerativeAI(
            model=settings.LLM_MODEL,
            temperature=settings.LLM_TEMPERATURE,
            max_output_tokens=settings.LLM_MAX_TOKENS,
            google_api_key=settings.GEMINI_API_KEY,
        )
    else:
        # Fallback OLLAMA o Mock
        raise ValueError(f"Proveedor de LLM no soportado: {settings.LLM_PROVIDER}")

@router.websocket("/ws")
async def chat_websocket(websocket: WebSocket):
    await websocket.accept()
    
    try:
        while True:
            # 1. Recibir pregunta y filtros del cliente
            raw_data = await websocket.receive_text()
            data = json.loads(raw_data)
            
            query = data.get("query", "").strip()
            category_filter = data.get("category", None)
            
            if not query:
                continue
                
            # Enviar señal de cargando (procesando RAG)
            await websocket.send_json({"type": "status", "status": "searching"})
            
            # 2. Ejecutar Búsqueda Híbrida y Reranking en Qdrant
            retrieved_chunks = hybrid_search_and_rerank(query, category_filter)
            
            # 3. Validar si existen resultados
            if not retrieved_chunks:
                # Responder directamente con respuesta estándar si no hay datos
                response_text = "Lo siento, no encontré información en los documentos de la organización para responder a tu pregunta."
                await websocket.send_json({"type": "token", "token": response_text})
                
                # Registrar log en base de datos con confianza 0
                async with SessionLocal() as db:
                    new_log = AuditLog(
                        query=query,
                        response=response_text,
                        confidence=0.0,
                        category=category_filter if category_filter else "General",
                        citations=[]
                    )
                    db.add(new_log)
                    await db.commit()
                    log_id = new_log.id
                    
                await websocket.send_json({
                    "type": "done",
                    "log_id": log_id,
                    "citations": []
                })
                continue
                
            # 4. Formatear contexto para el Prompt
            context_str = ""
            citations_metadata = []
            max_confidence = 0.0
            
            for idx, chunk in enumerate(retrieved_chunks):
                doc_name = chunk["document_name"]
                page = chunk["page"]
                content = chunk["content"]
                conf = chunk["confidence"]
                
                max_confidence = max(max_confidence, conf)
                
                # Sumar fragmento al contexto del prompt
                context_str += f"[{idx + 1}] Documento: {doc_name}, Página {page}\nContenido: {content}\n\n"
                
                # Estructurar metadatos para la citación del front
                citations_metadata.append({
                    "id": chunk["document_id"],
                    "title": doc_name,
                    "page": page,
                    "confidence": conf,
                    "snippet": content[:300] + "..." if len(content) > 300 else content
                })
                
            # 5. Construir System Prompt RAG estricto
            system_prompt = (
                "Eres DocuAgent, un asistente virtual experto que responde preguntas de colaboradores de una empresa.\n"
                "Instrucciones estrictas:\n"
                "1. Responde a la pregunta basándote ÚNICAMENTE en el contexto de documentos proporcionado abajo.\n"
                "2. Si la información no está en el contexto, di textualmente: 'Lo siento, no tengo suficiente información en los documentos organizacionales para responder'.\n"
                "3. No inventes datos ni utilices conocimientos externos no documentados.\n"
                "4. Si usas información de un fragmento, cita el número del documento al final de la frase (ej: [1], [2]).\n\n"
                f"Contexto proporcionado:\n{context_str}\n"
                f"Pregunta del colaborador: {query}\n"
                "Respuesta:"
            )
            
            # Enviar señal de que el LLM está generando la respuesta
            await websocket.send_json({"type": "status", "status": "generating"})
            
            # 6. Ejecutar LLM con Streaming (astream)
            llm = get_llm()
            messages = [HumanMessage(content=system_prompt)]
            
            accumulated_response = ""
            async for chunk in llm.astream(messages):
                token = chunk.content
                if token:
                    accumulated_response += token
                    # Transmitir token a token en tiempo real
                    await websocket.send_json({"type": "token", "token": token})
                    
            # 7. Registrar Log de Auditoría en la Base de Datos PostgreSQL
            async with SessionLocal() as db:
                new_log = AuditLog(
                    query=query,
                    response=accumulated_response,
                    confidence=max_confidence,
                    category=category_filter if category_filter else "General",
                    citations=citations_metadata
                )
                db.add(new_log)
                await db.commit()
                log_id = new_log.id
                
            # Enviar señal de fin de flujo junto con las citas y el log_id para el feedback (👍/👎)
            await websocket.send_json({
                "type": "done",
                "log_id": log_id,
                "citations": citations_metadata
            })
            
    except WebSocketDisconnect:
        print("Cliente WebSocket desconectado.")
    except Exception as e:
        print(f"Error en WebSocket de chat: {e}")
        try:
            await websocket.send_json({"type": "error", "error": str(e)})
        except Exception:
            pass
