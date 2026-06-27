# 📡 Catálogo de Endpoints

## Chat

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/chat` | Enviar pregunta y recibir respuesta |
| `WS` | `/chat/ws` | WebSocket para chat en tiempo real (streaming) |
| `GET` | `/chat/sessions/:id` | Obtener historial de una sesión |
| `DELETE` | `/chat/sessions/:id` | Eliminar sesión y su historial |

### `POST /chat`

```bash
curl -X POST http://localhost:8000/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{
    "query": "¿Cuántos días de vacaciones me corresponden?",
    "session_id": "optional-session-id",
    "category_filter": null,
    "language": null
  }'
```

**Response 200:**
```json
{
  "data": {
    "message": {
      "role": "assistant",
      "content": "Según la política de vacaciones vigente [Fuente 1]...",
      "sources": [
        {
          "index": 1,
          "filename": "politica_vacaciones_2024.pdf",
          "section_title": "Días por antigüedad",
          "page_number": 5,
          "category": "Recursos Humanos",
          "rerank_score": 0.92,
          "snippet": "Los colaboradores con menos de 1 año..."
        }
      ],
      "confidence": 0.89,
      "is_fallback": false,
      "response_time_ms": 2340,
      "provider": "openai",
      "model": "gpt-4o-mini"
    },
    "session_id": "abc-123-def-456"
  }
}
```

---

## Documentos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/documents` | Cargar un nuevo documento |
| `GET` | `/documents` | Listar documentos (con filtros) |
| `GET` | `/documents/:id` | Obtener detalle de un documento |
| `DELETE` | `/documents/:id` | Eliminar documento (y sus chunks) |
| `POST` | `/documents/:id/reindex` | Re-procesar e indexar un documento |
| `GET` | `/documents/:id/chunks` | Listar chunks de un documento |

### `POST /documents`

```bash
curl -X POST http://localhost:8000/api/v1/documents \
  -F "file=@politica_vacaciones.pdf" \
  -F "category_id=cat-rh-001" \
  -F "author=María García" \
  -F "version=2.1"
```

**Response 201:**
```json
{
  "data": {
    "id": "doc-abc-123",
    "original_filename": "politica_vacaciones.pdf",
    "mime_type": "application/pdf",
    "file_size": 245760,
    "category": { "id": "cat-rh-001", "name": "Recursos Humanos" },
    "status": "processing",
    "created_at": "2026-06-27T10:00:00Z"
  },
  "message": "Documento cargado. El procesamiento se ejecuta en background."
}
```

### `GET /documents`

```bash
curl "http://localhost:8000/api/v1/documents?category=rh&status=indexed&page=1&page_size=20"
```

**Query Parameters:**

| Param | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `category` | string | null | Filtrar por slug de categoría |
| `status` | string | null | `pending`, `processing`, `indexed`, `error` |
| `search` | string | null | Buscar por nombre de archivo |
| `page` | int | 1 | Número de página |
| `page_size` | int | 20 | Resultados por página (max: 100) |
| `sort_by` | string | `created_at` | Campo de ordenamiento |
| `sort_order` | string | `desc` | `asc` o `desc` |

---

## Categorías

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/categories` | Crear categoría |
| `GET` | `/categories` | Listar categorías |
| `GET` | `/categories/:id` | Obtener categoría |
| `PUT` | `/categories/:id` | Actualizar categoría |
| `DELETE` | `/categories/:id` | Eliminar categoría (soft delete) |

### `POST /categories`

```bash
curl -X POST http://localhost:8000/api/v1/categories \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Recursos Humanos",
    "slug": "rh",
    "description": "Políticas de RH, beneficios, vacaciones",
    "color": "#3498db",
    "icon": "users"
  }'
```

---

## Feedback

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/feedback` | Enviar feedback sobre una respuesta |
| `GET` | `/feedback/stats` | Estadísticas de feedback |

### `POST /feedback`

```bash
curl -X POST http://localhost:8000/api/v1/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "message_id": "msg-abc-123",
    "is_positive": true,
    "comment": "Respuesta muy útil y precisa"
  }'
```

---

## Health

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/health` | Health check general |
| `GET` | `/health/detailed` | Health check detallado de cada servicio |

### `GET /health/detailed`

```json
{
  "status": "healthy",
  "services": {
    "api": { "status": "up", "version": "1.0.0" },
    "postgresql": { "status": "up", "latency_ms": 5 },
    "qdrant": { "status": "up", "points_count": 15234, "latency_ms": 12 },
    "cohere": { "status": "up", "latency_ms": 120 },
    "llm_provider": { "status": "up", "provider": "openai", "latency_ms": 350 }
  },
  "timestamp": "2026-06-27T10:00:00Z"
}
```
