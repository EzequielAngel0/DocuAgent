# 🧪 Estrategia de Testing

> **Política (OBLIGATORIA)**: no se ejecuta, prueba ni depura nada con un
> Python/Node local ni con venv. **Todo corre dentro de contenedores/imágenes de
> Podman** (o Docker), con las mismas versiones que producción. La imagen del
> backend tiene un target `test` con ruff/mypy/pytest; la de runtime es mínima.
> El CI de GitHub usa runners efímeros (no es "local").

## Capas de tests

| Capa | Qué prueba | Herramienta | Dónde |
|------|-----------|-------------|-------|
| **Unit (backend)** | Lógica pura: chunker, cleaner, extractores, sanitizer, validación, factory de proveedores, grafo/nodos del agente, rate limit WS, lockout, Turnstile, prompts, security | pytest | `backend/tests/unit/` |
| **Integration (backend)** | API con app real (TestClient) | pytest | `backend/tests/integration/` |
| **Unit (frontend)** | Helper de API (`apiFetch`, `credentials:include`) | Vitest | `frontend/src/**/*.test.ts` |

No hay capa E2E automatizada: el flujo completo (upload → indexar → preguntar →
respuesta con fuentes) se valida **manualmente en staging** con el túnel
(ver [`../deployment/staging-runbook.md`](../deployment/staging-runbook.md)).

---

## Backend — tests dentro de la imagen `test`

La etapa `test` del [`backend/Containerfile`](../../backend/Containerfile)
(builder → **test** → runtime) trae `requirements-dev.txt` (ruff, mypy, pytest).

```bash
# Construir la imagen de pruebas (target test)
podman build -f backend/Containerfile --target test -t docuagent-backend-test backend

# Lint + formato + tests
podman run --rm docuagent-backend-test ruff check app tests
podman run --rm docuagent-backend-test ruff format --check app tests
podman run --rm docuagent-backend-test pytest
```

> **Memoria**: no construyas la imagen `test` con el stack de staging levantado a
> la vez (riesgo de OOM / exit 137). Haz `down`, construye/prueba, y vuelve a
> `up`.

### Tests unitarios actuales (`backend/tests/unit/`)

```
test_chunker.py            Chunking semántico: tamaños, overlap, fusión bajo el mínimo
test_cleaner.py            Limpieza de texto
test_extractor.py          Extractores por MIME
test_sanitizer.py          Patrones de prompt injection
test_validation.py         Anti-alucinación (validator) + regeneración
test_providers_factory.py  Factory devuelve el proveedor correcto
test_agent_graph.py        Grafo LangGraph: transiciones y fallback
test_agent_nodes.py        Nodos individuales del grafo
test_ws_ratelimit.py       Rate limiter del WebSocket
test_lockout.py            Bloqueo de login/2FA tras N fallos
test_turnstile.py          Verificación + gate de Turnstile
test_prompts.py            Construcción del system prompt
test_security.py           Helpers de seguridad (hashing, JWT, etc.)
```

### Integración (`backend/tests/integration/`)

```
test_api.py                Endpoints REST con la app real (FastAPI TestClient)
```

---

## Frontend — Vitest dentro de contenedor

`node_modules` sobre el mount de Windows es impráctico (lento). El patrón es
sincronizar el lock sin escribir `node_modules` al host y correr Vitest con un
**volumen nombrado**:

```bash
# Sincronizar package-lock sin instalar node_modules en el host (rápido)
podman run --rm -v "C:/Proyectos/agentes/frontend:/app" -w /app node:20-alpine \
  npm install --package-lock-only

# Ejecutar Vitest con node_modules en un volumen nombrado (no en el mount)
podman run --rm -v "C:/Proyectos/agentes/frontend:/app" -v docuagent_fe_nm:/app/node_modules \
  -w /app node:20-alpine sh -c "npm install && npx vitest run"
```

`frontend/src/lib/api.test.ts` cubre el helper `apiFetch` (incluye
`credentials: 'include'` para la cookie httponly).

---

## CI (GitHub Actions)

El workflow `ci.yml` corre en runners efímeros (instala `requirements-dev.txt`):

```yaml
- ruff check app tests
- ruff format --check app tests
- pytest
# Frontend: lint + build + vitest
```

No despliega: el deploy es otro workflow (`deploy.yml`) gateado por
`vars.DEPLOY_ENABLED`. Ver [`../deployment/ci-cd.md`](../deployment/ci-cd.md).

---

## Verificación end-to-end (manual, en staging)

Con el stack arriba (`.\ops\docuagent.ps1 up`) y el túnel publicando
`dev.angelezequiel.dev`:

1. `GET /api/v1/health` y readiness (DB + Qdrant) en verde.
2. Login admin → Turnstile → TOTP → cookie httponly presente.
3. Subir un documento (PDF/MD) → status `indexed` → ver chunks.
4. Preguntar en el chat → respuesta con **fuentes citadas** (no inventa).
5. Pregunta sin contexto → mensaje de fallback honesto.
6. Feedback 👍/👎 sobre el `log_id` de la respuesta.

Detalle paso a paso en [`../deployment/staging-runbook.md`](../deployment/staging-runbook.md).
