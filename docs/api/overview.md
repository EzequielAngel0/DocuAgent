# 🌐 API — Visión General

## Base URL

```
Desarrollo: http://localhost:8000/api/v1
Producción: https://<domain>/api/v1
```

## Autenticación

- **Chat y salud**: públicos (el chat tiene anti-bot Turnstile opcional + rate
  limit; ver [`websocket.md`](websocket.md)).
- **Admin (`/api/v1/admin/*`)**: requiere **sesión autenticada**. Flujo:
  email+password (bcrypt) → **Cloudflare Turnstile** → **TOTP 2FA** → **JWT
  (iss/aud) en cookie httponly+secure**. El cliente envía la cookie con
  `credentials: 'include'` (no hay token en JS). Login/2FA con rate limit +
  lockout. Endpoints de auth → [`endpoints.md`](endpoints.md).

## Formato

- **Request/Response**: JSON (`Content-Type: application/json`)
- **Upload de archivos**: Multipart (`Content-Type: multipart/form-data`)
- **Chat streaming**: WebSocket (`ws://`)

## Respuesta Estándar

### Éxito
```json
{
  "data": { ... },
  "message": "Operación exitosa"
}
```

### Error
```json
{
  "error": {
    "code": "DOCUMENT_NOT_FOUND",
    "message": "El documento con ID xyz no fue encontrado",
    "details": null
  }
}
```

### Paginación
```json
{
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total": 150,
    "total_pages": 8
  }
}
```

## Códigos de Estado HTTP

| Código | Significado | Uso |
|--------|-------------|-----|
| 200 | OK | Operación exitosa |
| 201 | Created | Recurso creado |
| 204 | No Content | Eliminación exitosa |
| 400 | Bad Request | Datos de entrada inválidos |
| 404 | Not Found | Recurso no encontrado |
| 413 | Payload Too Large | Archivo excede límite de tamaño |
| 415 | Unsupported Media Type | Formato de archivo no soportado |
| 422 | Unprocessable Entity | Error de validación Pydantic |
| 500 | Internal Server Error | Error del servidor |
| 503 | Service Unavailable | Servicio externo no disponible (Qdrant, LLM) |

## Documentación Automática

FastAPI genera documentación interactiva automáticamente:

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`
- **OpenAPI JSON**: `http://localhost:8000/openapi.json`
