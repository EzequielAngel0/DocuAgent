# 📡 Catálogo de Endpoints

Base: `/api/v1`. Rutas reales en
[`backend/app/api/v1/`](../../backend/app/api/v1/) (router + `endpoints/`).
Las respuestas/forma exacta de cada modelo están en
[`schemas.md`](schemas.md) (Pydantic en `models/schemas.py`).

> **Auth**: el chat y la salud son públicos. **Todo lo de `/admin/*` requiere la
> cookie de sesión httponly** (JWT con `iss`/`aud`) que emite el login con 2FA.
> No se manda token por header/JS; el frontend usa `credentials: 'include'`.

## Chat (público)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `WS` | `/api/v1/chat/ws` | Chat RAG en tiempo real (streaming de tokens) |

**No hay `POST /chat` REST ni endpoints de sesiones**: el chat es solo WebSocket.
Protocolo completo (mensajes, Turnstile, rate limits, fuentes) →
[`websocket.md`](websocket.md). Cada consulta se persiste en `audit_logs`.

## Autenticación admin (público para autenticarse)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/api/v1/auth/login` | email + password (bcrypt) + Cloudflare Turnstile |
| `POST` | `/api/v1/auth/verify-2fa` | TOTP de 6 dígitos → set-cookie httponly (JWT) |
| `POST` | `/api/v1/auth/setup-2fa` | Provisión del secreto TOTP (otpauth/QR) |
| `POST` | `/api/v1/auth/logout` | Invalida la sesión (borra la cookie) |

Flujo: `login` (con Turnstile) → `verify-2fa` (TOTP) → cookie de sesión. El login
y la verificación 2FA tienen **rate limit** y **lockout** tras N fallos
(`LOGIN_LOCKOUT_*`). El admin se siembra desde `.env` al arrancar.

```bash
# 1) login (devuelve que requiere 2FA)
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@...","password":"...","turnstile_token":"..."}'

# 2) verificar TOTP → set-cookie httponly
curl -X POST http://localhost:8000/api/v1/auth/verify-2fa \
  -H "Content-Type: application/json" -c cookies.txt \
  -d '{"email":"admin@...","code":"123456"}'
```

## Documentos (admin · prefijo `/admin`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/v1/admin/documents` | Listar documentos |
| `POST` | `/api/v1/admin/documents/upload` | Subir documento (multipart) → ingesta + indexado |
| `POST` | `/api/v1/admin/documents/{id}/reindex` | Re-procesar e indexar de nuevo |
| `DELETE` | `/api/v1/admin/documents/{id}` | Eliminar documento (y sus chunks en Qdrant) |
| `GET` | `/api/v1/admin/documents/{id}/chunks` | Inspeccionar los chunks de un documento |

La subida valida **extensión + tamaño (50 MB, streaming) + magic bytes** (el
contenido debe coincidir con la extensión) y rechaza duplicados por hash. `{id}`
es entero.

```bash
curl -X POST http://localhost:8000/api/v1/admin/documents/upload \
  -b cookies.txt \
  -F "file=@politica_gastos_viaticos.md" \
  -F "category=finanzas"
```

## Categorías (admin · prefijo `/admin`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/v1/admin/categories` | Listar categorías |
| `POST` | `/api/v1/admin/categories` | Crear categoría (201) |
| `PUT` | `/api/v1/admin/categories/{id}` | Actualizar categoría |
| `DELETE` | `/api/v1/admin/categories/{id}` | Eliminar categoría |

## Historial y feedback (admin · prefijo `/admin`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/v1/admin/history` | Historial de consultas (`audit_logs`) con citas |
| `POST` | `/api/v1/admin/history/{id}/feedback` | Registrar feedback 👍/👎 sobre una consulta |

El `{id}` corresponde al `log_id` que el WebSocket devuelve en el evento `done`.

## Salud (público)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/v1/health` | Liveness: la API responde |
| `GET` | `/api/v1/health/ready` | Readiness: verifica PostgreSQL + Qdrant |

```json
// GET /api/v1/health/ready (ejemplo)
{ "status": "healthy", "checks": { "database": "ok", "qdrant": "ok" } }
```

`/health/ready` es el que usan los healthchecks de contenedor y el go-live.
