# 🔌 WebSocket — Chat en Tiempo Real

El chat se sirve por WebSocket: el cliente manda una pregunta y el servidor
transmite la respuesta del agente RAG **token a token** (streaming), seguida de
las fuentes citadas.

> Implementación real: [`backend/app/api/v1/endpoints/chat.py`](../../backend/app/api/v1/endpoints/chat.py).

## Endpoint

```
wss://api-docuagent.angelezequiel.dev/api/v1/chat/ws     # producción
wss://api-dev.angelezequiel.dev/api/v1/chat/ws           # staging (túnel)
ws://localhost:8000/api/v1/chat/ws                       # local
```

El frontend lo toma de `NEXT_PUBLIC_WS_URL` (inlineado en build). No usa
`session_id` en la URL: la conversación se reduce a pregunta→respuesta y cada
consulta se persiste en `audit_logs`.

## Protocolo

### Cliente → Servidor

Un mensaje de texto JSON por pregunta:

```json
{
  "query": "¿Cuántos días de viáticos cubre la política?",
  "category": "finanzas",
  "turnstile_token": "0.abc..."
}
```

| Campo | Tipo | Notas |
|-------|------|-------|
| `query` | string | Pregunta del usuario. Vacío → se ignora. |
| `category` | string \| null | Filtra la búsqueda por categoría (opcional). |
| `turnstile_token` | string | Solo si `CHAT_REQUIRE_TURNSTILE=true`. Se valida **una vez por IP** (luego se cachea). |

### Servidor → Cliente

```json
// 1. Estado: recuperando contexto (Qdrant + Cohere Rerank)
{"type": "status", "status": "searching"}

// 2. Estado: generando con el LLM
{"type": "status", "status": "generating"}

// 3. Streaming de tokens (uno por fragmento que emite el LLM)
{"type": "token", "token": "Según"}
{"type": "token", "token": " la"}
{"type": "token", "token": " política"}

// 4. Fin: id del registro de auditoría + fuentes citadas
{"type": "done", "log_id": 42, "citations": [
  {
    "document_name": "politica_gastos_viaticos.md",
    "category": "finanzas",
    "page": 2,
    "content": "Los viáticos cubren...",
    "score": 0.91
  }
]}

// Error (anti-bot, rate limit, o fallo interno)
{"type": "error", "error": "Demasiadas consultas, espera un momento."}
```

| `type` | Campos | Descripción |
|--------|--------|-------------|
| `status` | `status`: `searching` \| `generating` | Fase del pipeline. |
| `token` | `token` | Fragmento de la respuesta (streaming). |
| `done` | `log_id`, `citations[]` | Respuesta completa; `log_id` referencia `audit_logs` para el feedback. |
| `error` | `error` | Mensaje seguro para el usuario (el detalle se loguea en el server). |

### Caso fallback (sin alucinar)

Si la recuperación no da contexto suficiente o el sanitizador detecta inyección,
el servidor **no llama al LLM**: emite un único `token` con el mensaje honesto
(`FALLBACK_MESSAGE`) y cierra con `done` y `citations: []`. Nunca inventa datos.

## Controles de abuso (en el propio loop del WS)

El endpoint aplica, en orden, antes de gastar LLM/Cohere:

1. **Turnstile gate** (`CHAT_REQUIRE_TURNSTILE`): verificación anti-bot una vez
   por IP, cacheada `TURNSTILE_GATE_TTL_SECONDS`.
2. **Rate limit por IP**: `RATE_LIMIT_CHAT_PER_MIN` consultas/minuto
   (`WSRateLimiter` en memoria, IP real vía cabecera de Cloudflare).
3. **Tope GLOBAL por hora**: `RATE_LIMIT_CHAT_GLOBAL_PER_HOUR` sumando todas las
   IPs — límite duro del costo total de la API aunque el tráfico venga repartido.

Cualquiera que se exceda responde con un `error` y descarta la consulta.

## Flujo interno (servidor)

```
recibir {query, category}
  → [Turnstile gate] → [rate limit IP] → [tope global]
  → status: searching
  → prepare_context(query, category)   # embed → Qdrant top 20 → Cohere Rerank top 5 → ensamblar
  → si needs_fallback → token(FALLBACK_MESSAGE) → done(citations=[])
  → status: generating
  → stream_with_fallback(system_prompt, query)  # cadena de proveedores; emite tokens
  → guardar AuditLog → done(log_id, citations=sources)
```

## Cliente (frontend)

La página [`frontend/src/app/chat/page.tsx`](../../frontend/src/app/chat/page.tsx)
abre el socket, manda `{query, category, turnstile_token}`, y va construyendo el
mensaje del asistente con cada `token` (el globo se crea con el **primer** token,
no en `onopen`, para no mostrar una burbuja vacía). Al `done` adjunta las
`citations` y habilita el feedback (👍/👎 sobre `log_id`).
