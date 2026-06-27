# 🟢 Runbook de Staging (local + Cloudflare Tunnel)

Cómo levantar DocuAgent en **staging** y verificarlo. Staging corre **local**
con Podman y se expone por un **túnel de Cloudflare** (`dev.angelezequiel.dev`).
No requiere OCI.

> Resumen del stack: `backend` · `frontend` · `postgres` · `qdrant` ·
> `cloudflared`. Runner: `ops/docuagent.ps1` (Windows/PowerShell).

## 1. Prerrequisitos

- **Podman** (o Docker) instalado. El runner detecta el motor automáticamente.
- **`.env.staging`** completo en la raíz (gitignored). Claves necesarias:
  `COHERE_API_KEY`, la del proveedor LLM activo (`GEMINI_API_KEY` por defecto),
  `QDRANT_API_KEY`, `JWT_SECRET_KEY`, `ADMIN_EMAIL/PASSWORD/TOTP_SECRET`,
  `TURNSTILE_SITE_KEY/SECRET_KEY` (+ `NEXT_PUBLIC_TURNSTILE_SITE_KEY`),
  `CORS_ALLOWED_ORIGINS`, `NEXT_PUBLIC_API_URL/WS_URL` y
  `CLOUDFLARE_TUNNEL_TOKEN` (solo para `up` con túnel).
- **Túnel de Cloudflare** creado con 4 hostnames apuntando al stack local
  (detalle sensible en `docs/private/domain-setup.md`):
  `dev` y `api-dev` → frontend (`:3000`) y backend (`:8000`).

## 2. Levantar el stack

```powershell
.\ops\docuagent.ps1 env        # Verifica motor, compose y .env activos
.\ops\docuagent.ps1 up         # Build + levantar CON túnel (requiere TUNNEL_TOKEN)
# o, sin túnel (solo localhost):
.\ops\docuagent.ps1 up-local
```

`up` construye las imágenes (build en serie por la carrera de buildah en
Windows), aplica las migraciones de Alembic al arrancar el backend e inicia el
túnel. Recuerda: `NEXT_PUBLIC_*` se **inlinea en build** vía build-args del
compose; si cambias esas URLs, reconstruye (`.\ops\docuagent.ps1 build`).

## 3. Cargar documentos

**Opción A — Panel admin (recomendada):** inicia sesión en `/admin/login` y
sube documentos por categoría desde la UI (se indexan en segundo plano).

**Opción B — Seed masivo:** coloca archivos en `documents/{rh,finanzas,seguridad,general}/`
y corre el script montando esa carpeta en el contenedor:

```powershell
podman compose -f podman-compose.yml --env-file .env.staging `
  run --rm -v ${PWD}/documents:/app/documents backend `
  python -m app.scripts.seed_documents
```

## 4. Verificar

```powershell
.\ops\docuagent.ps1 ps                 # Todos los servicios "Up" / healthy
.\ops\docuagent.ps1 logs backend       # Revisar arranque (app_started)
```

Comprobaciones funcionales:

| Qué | Cómo | Esperado |
|-----|------|----------|
| Liveness API | `curl http://localhost:8000/api/v1/health` | `{"status":"ok",...}` |
| Readiness | `curl http://localhost:8000/api/v1/health/ready` | `database` y `qdrant` = `ok` |
| Docs API | abrir `http://localhost:8000/api/v1/docs` | Swagger UI |
| Frontend | abrir `http://localhost:3000` (o `https://dev.angelezequiel.dev`) | Landing |
| Login admin | `/admin/login` con `ADMIN_EMAIL` + TOTP | Entra al dashboard |
| Chat | hacer una pregunta sobre un doc cargado | Respuesta con citas; si no hay info, lo dice |

Smoke test del chat por WebSocket (opcional, con `wscat`):

```bash
wscat -c ws://localhost:8000/api/v1/chat/ws
> {"query":"¿Cuántos días de vacaciones tengo?","category":null}
# Recibes: status(searching) → status(generating) → tokens → done(citations)
```

## 5. Operación

```powershell
.\ops\docuagent.ps1 restart    # down + build + up
.\ops\docuagent.ps1 logs       # seguir logs (Ctrl-C salir)
.\ops\docuagent.ps1 down       # apagar
.\ops\docuagent.ps1 clean      # apagar + borrar volúmenes e imágenes
```

## 6. Problemas comunes

- **`530` de Cloudflare** en `*-dev.angelezequiel.dev` → el stack está apagado:
  `.\ops\docuagent.ps1 up`.
- **Backend `unhealthy`** → revisar `logs backend`; suele ser `.env` incompleto
  (faltan claves) o Postgres/Qdrant aún iniciando.
- **CORS bloquea el front** → añadir el origen a `CORS_ALLOWED_ORIGINS` y
  reiniciar el backend.
- **Chat responde "no encontré información"** siempre → no hay documentos
  indexados (cargar por admin o seed) o `COHERE_API_KEY` inválida.
- **El front no apunta al API correcto** → `NEXT_PUBLIC_*` se hornean en build;
  reconstruye tras cambiarlas.

Para llevar esto a producción en OCI: `docs/deployment/oci-go-live.md`.
