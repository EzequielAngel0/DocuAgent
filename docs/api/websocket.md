# 🔌 WebSocket — Chat en Tiempo Real

## Endpoint

```
ws://localhost:8000/api/v1/chat/ws?session_id=<optional-session-id>
```

## Protocolo

### Mensaje del Cliente → Servidor

```json
{
  "type": "message",
  "content": "¿Cuántos días de vacaciones me corresponden?",
  "category_filter": null
}
```

### Eventos del Servidor → Cliente

| Evento | Descripción |
|--------|-------------|
| `session_start` | Sesión iniciada, devuelve session_id |
| `thinking` | El agente está procesando |
| `token` | Token individual de la respuesta (streaming) |
| `sources` | Fuentes citadas en la respuesta |
| `done` | Respuesta completa |
| `error` | Error en el procesamiento |

```json
// 1. Inicio de sesión
{"type": "session_start", "session_id": "abc-123"}

// 2. Procesando
{"type": "thinking", "message": "Buscando en documentos..."}

// 3. Streaming de tokens
{"type": "token", "content": "Según"}
{"type": "token", "content": " la"}
{"type": "token", "content": " política"}
{"type": "token", "content": " de"}
{"type": "token", "content": " vacaciones"}
// ... más tokens ...

// 4. Fuentes
{"type": "sources", "data": [
  {
    "index": 1,
    "filename": "politica_vacaciones_2024.pdf",
    "section_title": "Días por antigüedad",
    "page_number": 5,
    "category": "Recursos Humanos",
    "rerank_score": 0.92
  }
]}

// 5. Finalización
{
  "type": "done",
  "confidence": 0.89,
  "is_fallback": false,
  "response_time_ms": 2340,
  "provider": "openai",
  "model": "gpt-4o-mini"
}

// Error (si ocurre)
{"type": "error", "message": "Error al procesar la consulta", "code": "LLM_PROVIDER_ERROR"}
```

## Implementación Backend

```python
# api/v1/chat.py
from fastapi import WebSocket, WebSocketDisconnect

@router.websocket("/ws")
async def chat_websocket(websocket: WebSocket, session_id: str | None = None):
    await websocket.accept()

    # Crear o recuperar sesión
    session = await get_or_create_session(session_id)
    await websocket.send_json({
        "type": "session_start",
        "session_id": str(session.id)
    })

    try:
        while True:
            data = await websocket.receive_json()

            if data["type"] == "message":
                await websocket.send_json({"type": "thinking", "message": "Buscando..."})

                # Ejecutar el grafo LangGraph con streaming
                async for event in agent.astream(data["content"], session):
                    if event["type"] == "token":
                        await websocket.send_json(event)
                    elif event["type"] == "sources":
                        await websocket.send_json(event)
                    elif event["type"] == "done":
                        await websocket.send_json(event)

    except WebSocketDisconnect:
        pass  # Cliente desconectado
```

## Implementación Frontend

```typescript
// hooks/useWebSocket.ts
export function useChat(apiUrl: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const currentResponse = useRef<string>('');

  const connect = useCallback((sessionId?: string) => {
    const url = `${apiUrl}?session_id=${sessionId || ''}`;
    ws.current = new WebSocket(url);

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case 'session_start':
          // Guardar session_id
          break;
        case 'thinking':
          setIsStreaming(true);
          break;
        case 'token':
          currentResponse.current += data.content;
          // Actualizar último mensaje del asistente
          updateLastMessage(currentResponse.current);
          break;
        case 'sources':
          // Agregar fuentes al último mensaje
          break;
        case 'done':
          setIsStreaming(false);
          currentResponse.current = '';
          break;
      }
    };
  }, [apiUrl]);

  return { messages, isStreaming, connect, sendMessage };
}
```
