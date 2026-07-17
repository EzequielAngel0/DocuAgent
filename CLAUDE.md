# DocuAgent

Agente RAG conversacional para consulta de documentación empresarial.
Proyecto Alura LATAM — deadline **20 de julio 2026**.

> **Estado actual (2026-06-29)**: sistema **funcionando end-to-end en staging**
> (`dev.angelezequiel.dev` vía túnel): chat RAG con citas (Cohere + Gemini
> `gemini-2.5-flash`), panel admin (auth en cookie httponly, CRUD, subida con
> drag&drop), ingesta/indexado reales. **OCI** aún SIN provisionar: el deploy
> está automatizado y documentado pero **inactivo** hasta crear la instancia
> (workflow gateado por `vars.DEPLOY_ENABLED`). Qué falta para completar el
> proyecto → `docs/project/pendientes.md`. Subir a OCI →
> `docs/deployment/oci-go-live.md`. **Plan temporal (2026-07)**: desplegar en
> una VM ARM existente del proyecto ACP con build en la propia VM
> (`DEPLOY_MODE=local`) → guía en `DEPLOY-VM-ACP.md` (raíz). Correr staging →
> `docs/deployment/staging-runbook.md`.

## Orientación rápida

Antes de explorar archivos o hacer grep, consulta la doc relevante:

- **Arquitectura completa** → `docs/architecture/system-overview.md`
- **Backend (estructura, patrones, dependencias)** → `docs/architecture/backend-architecture.md`
- **Frontend (páginas, componentes)** → `docs/architecture/frontend-architecture.md`
- **Base de datos (ER, tablas, Qdrant)** → `docs/architecture/database-design.md`
- **Seguridad (prompt injection, API, BD, red)** → `docs/architecture/security.md`
- **Análisis de seguridad (hallazgos + recomendaciones)** → `docs/architecture/security-audit.md`
- **Pipeline RAG** → `docs/pipeline/01-*` a `05-*` (en orden)
- **API REST + WebSocket** → `docs/api/`
- **Decisiones técnicas** → `docs/project/decisions-log.md`
- **Fases y cronograma** → `docs/project/phases.md`
- **Pendientes (qué falta para completar)** → `docs/project/pendientes.md`
- **Branching y commits** → `docs/development/git-workflow.md`
- **Setup local desde cero** → `docs/development/local-setup.md`
- **Guía de ejecución fase a fase** → `docs/development/execution-guide.md`
- **Testing (unit, integration, e2e)** → `docs/development/testing-strategy.md`
- **Prueba de humo del RAG (10 preguntas)** → `docs/development/prueba-rag-preguntas.md`
- **Documentos de ejemplo (seed)** → `backend/documents/` (empresa ficticia)
- **Legales (borradores)** → `docs/legal/` (aviso de privacidad, T&C)
- **Capturas de staging** → `docs/assets/screenshots/` (ver README de la carpeta)
- **Contenedores y compose** → `docs/deployment/containerfiles.md`
- **CI/CD (GitHub Actions)** → `docs/deployment/ci-cd.md`
- **Deploy OCI paso a paso** → `docs/deployment/oci-setup.md`
- **Levantar staging local (runbook)** → `docs/deployment/staging-runbook.md`
- **Checklist para subir a OCI (go-live)** → `docs/deployment/oci-go-live.md`
- **Dominio y tunnels (SENSIBLE, no en git)** → `docs/private/domain-setup.md`
- **Índice completo** → `docs/README.md`

**Decisiones clave**: frontend conectado a **endpoints reales** (CERO mock: ante
fallo de red muestra aviso + "Reintentar", nunca datos inventados), 3 áreas
(landing + chat público + admin protegido), auth con email/password + Cloudflare
Turnstile + TOTP 2FA, documentos pre-cargados vía admin UI o scripts, todo 100%
responsive (mobile-first).

## Qué hace el sistema

Un colaborador escribe una pregunta en lenguaje natural. El agente busca
fragmentos relevantes en la base vectorial (Qdrant), los reclasifica con
Cohere Rerank, ensambla contexto y genera una respuesta con citación de
fuentes vía un LLM configurable. Si no encuentra información suficiente,
lo dice explícitamente en vez de inventar.

Soporta documentos en PDF, Word, Excel, Markdown, CSV, JSON y texto plano.
Opera en español, inglés y portugués (embeddings multilingües Cohere v3).

## Stack

Python 3.12+ · FastAPI · LangGraph · SQLAlchemy+Alembic · PostgreSQL 16 ·
Qdrant · Cohere Embed v3 + Rerank v3 · Multi-LLM (OpenAI/Gemini/Claude/Ollama) ·
Next.js 16 + React 19 (TypeScript) · Vanilla CSS · structlog + LangSmith ·
Podman · GitHub Actions · OCI.

## Monorepo

```
backend/app/
  api/v1/          Endpoints: chat, documents, categories, feedback, health
  agent/           LangGraph: state, prompts, graph, nodes/ (6 + fallback)
  rag/             embeddings, vector_store, reranker, retrieval
  ingestion/       extractors, cleaner, chunker semántico, indexer
  providers/       base + openai/gemini/anthropic/ollama + factory (fallback)
  models/          orm.py (SQLAlchemy) y schemas.py (Pydantic)
  db/              session.py (engine async + get_db)
  core/            config, logging (structlog), exceptions, security, sanitizer
  scripts/         seed_documents.py
backend/alembic/   Migraciones PostgreSQL
backend/tests/     unit/ · integration/

frontend/src/
  app/             / (landing) · /chat (WebSocket) · /admin/login · /admin/(dashboard)/*
  components/      chat/ · landing/ · layout/
  middleware.ts    Auth guard: /admin/* → /admin/login si no autenticado
  (llamadas API/WS inline en cada page.tsx; capa hooks/lib/types = refactor futuro)

docs/              Documentación pública
docs/private/      Doc sensible (.gitignored): dominio, tokens
.github/workflows/ CI (lint+tests) · Deploy (build→OCIR + SSH a OCI)
podman-compose*.yml  Compose base + dev (tunnel) + prod (raíz del repo)
ops/               Runners de contenedores (docuagent.ps1 / docuagent.sh)
```

## Pipeline RAG (flujo de una consulta)

```
Pregunta → Cohere Embed (search_query) → Qdrant top 20 → Cohere Rerank top 5
→ ensamblar contexto con metadatos → LLM genera respuesta → validar
(anti-alucinación) → respuesta con fuentes citadas
```

Si `needs_fallback=true` en cualquier punto (sin resultados, baja confianza,
alucinación detectada), el agente responde honestamente que no encontró la
información.

## Pipeline de ingesta (carga de documento)

```
Upload (multipart) → validar formato + hash duplicados → extractor por MIME
→ limpiar texto → chunking semántico (min 200, max 1500 chars, overlap 100)
→ Cohere Embed (search_document) batch → upsert Qdrant + registrar PostgreSQL
→ status: indexed
```

## Grafo LangGraph

Nodos en `agent/nodes/`: `query_analyzer` → `retriever` → `reranker` →
`context_builder` → `generator` → `validator`. Estado tipado en `agent/state.py`
(TypedDict: messages, query, query_embedding, retrieved_chunks, reranked_chunks,
context, response, sources, confidence, needs_fallback).

Transiciones condicionales: sin resultados → fallback; baja confianza → fallback;
alucinación → fallback; necesita re-generación → generator de nuevo.

## Multi-LLM

Variable `LLM_PROVIDER` selecciona el proveedor activo. Factory en
`providers/factory.py`. Cada proveedor implementa `BaseLLMProvider` con
`generate()` y `stream()`. Temperature 0.1 para respuestas factuales.
Fallback chain: openai → gemini → anthropic → ollama.

## Base de datos

**PostgreSQL**: `admin_users`, `categories` (1—N) `documents`, y `audit_logs`
(historial plano de cada consulta con citas en JSON + feedback). Los chunks NO
se guardan en PostgreSQL: viven en Qdrant. Categorías dinámicas (CRUD).
Migraciones con Alembic. Detalle: `docs/architecture/database-design.md`.

**Qdrant**: colección `documents`, 1024 dims, cosine. Payload: document_id,
document_name, category, page, content. Filtro por `category`. Umbral sobre el
score de Cohere Rerank (`CONFIDENCE_THRESHOLD`, 0.3).

## Seguridad

- **Prompt injection**: sanitizador regex en input, system prompt blindado con
  7 reglas NUNCA, delimitadores XML para contexto, validator post-generación.
- **API**: CORS por allowlist (sin comodín con credenciales), **security headers**
  (CSP/HSTS/X-Frame/nosniff/Referrer-Policy), **rate limit** de login/2FA
  (slowapi, clave por IP real CF), TrustedHost en prod, validación Pydantic
  estricta. _Pendiente_: rate limit del WebSocket de chat.
- **Auth admin**: email+password (bcrypt) → Cloudflare Turnstile (anti-bot) →
  TOTP 2FA (pyotp) → JWT con `iss`/`aud` (7d) en **cookie httponly+secure**
  (dominio compartido; frontend con `credentials:include`, sin token en JS).
  Admin **sembrado desde `.env` al arrancar**. _Pendiente_: refresh con rotación.
- **Uploads**: allowlist de extensiones + límite de tamaño (50MB, streaming) +
  **verificación de magic bytes** (contenido vs. extensión).
- **Config prod**: fail-fast si arranca con secretos inseguros/incompletos.
- **Análisis completo + recomendaciones**: `docs/architecture/security-audit.md`.
- **BD**: SQLAlchemy parametrizado (anti SQL injection), usuario dedicado,
  Qdrant con API key, red interna (no expuesta).
- **Contenedores**: multi-stage build, usuario no-root, redes aisladas
  (frontend vs internal).
- **Secrets**: `.env` local (.gitignored), OCI Vault en prod, `docs/private/`
  ignorado. NUNCA en código.

## Ramas

Flujo: `main` (prod) ← PR ← `develop` (integración) ← ramas de trabajo cortas.

- **`main`** = producción → deploy automático a OCI (build→OCIR + SSH, GitHub
  Actions). **100% MANUAL**: nunca hago push ni merge a `main` por mi cuenta;
  lo hace el dueño con un PR `develop → main`. **Merge a `main` SOLO con la
  feature 100% TERMINADA y probada** (CI verde + validada en staging local con
  tunnel): un merge a medias publica a prod algo incompleto.
- **`develop`** = integración (CI valida; NO despliega). Es donde se trabaja o
  se integran las ramas. **Push automático permitido** a la rama de trabajo y a
  `develop` (incluido su merge) al cerrar un cambio.
- **Ramas de trabajo** CORTAS desde `develop`, una por cambio, del mismo tipo
  que el commit: `feature/`, `fix/`, `docs/`, `refactor/`, `test/`, `chore/`,
  `ci/`, `infra/`. **El área va en el NOMBRE** (`feature/backend-langgraph`,
  `fix/chat-ws`), no en ramas permanentes por módulo. Se borran al mergear.
  Hotfix a prod: `fix/hotfix-…` desde `main` + back-merge a `develop`.
- Dos sesiones en el MISMO working tree no se aíslan con ramas → usar
  `git worktree`.

## Dominio

**Detalle sensible en `docs/private/domain-setup.md` (fuera de git).**

Producción: `docuagent.angelezequiel.dev` (API: `api-docuagent.angelezequiel.dev`) → OCI.
Staging: `dev.angelezequiel.dev` (API: `api-dev.angelezequiel.dev`) → Cloudflare
Tunnel local (contenedor cloudflared).
HTTPS automático por Cloudflare en ambos entornos.

## Runners (`ops/`)

Dos scripts para operar el stack sin recordar flags de compose.

**`.\ops\docuagent.ps1`** — desarrollo local (Windows/PowerShell, build local + tunnel).
**`./ops/docuagent.sh`** — producción en OCI (Ubuntu, pull de OCIR, NO build).

### Desarrollo local (Windows)

```powershell
.\ops\docuagent.ps1 up          # Build + levantar con Cloudflare Tunnel
.\ops\docuagent.ps1 up-local    # Build + levantar SIN tunnel (solo localhost)
.\ops\docuagent.ps1 down        # Apagar
.\ops\docuagent.ps1 restart     # down + build + up
.\ops\docuagent.ps1 build       # Solo construir imagenes
.\ops\docuagent.ps1 logs        # Seguir logs (Ctrl-C salir)
.\ops\docuagent.ps1 logs backend  # Logs de un servicio
.\ops\docuagent.ps1 ps          # Estado de contenedores
.\ops\docuagent.ps1 clean       # down + borrar volumenes e imagenes
.\ops\docuagent.ps1 prune       # Limpieza profunda (cache de build)
.\ops\docuagent.ps1 env         # Ver config activa
```

`up` exige `CLOUDFLARE_TUNNEL_TOKEN` en `.env`; `up-local` no.
Detecta Podman o Docker automaticamente (prefiere Podman).
Build en serie para evitar la carrera de buildah en Windows.

Acceso con `up`:
- Local: `http://localhost:3000` (frontend) · `http://localhost:8000/docs` (API)
- Tunnel: `https://dev.tu-dominio.dev` · `https://api-dev.tu-dominio.dev`

### Produccion (Ubuntu / OCI)

```bash
./ops/docuagent.sh up           # Pull OCIR + levantar
./ops/docuagent.sh down         # Apagar
./ops/docuagent.sh restart      # down + pull + up
./ops/docuagent.sh pull         # Solo descargar imagenes nuevas
./ops/docuagent.sh migrate      # Aplicar migraciones de BD (alembic)
./ops/docuagent.sh logs         # Seguir logs
./ops/docuagent.sh ps           # Estado
./ops/docuagent.sh clean        # down + volumenes + imagenes
./ops/docuagent.sh prune        # Limpieza profunda
```

Servicios: `backend` · `frontend` · `postgres` · `qdrant` · `cloudflared`

### Verificación — SIEMPRE en contenedores, NUNCA en local

> **Política (OBLIGATORIA)**: no se ejecuta, prueba ni depura NADA con un
> Python/Node local ni con venv. **Todo corre dentro de contenedores/imágenes
> de Podman** (o Docker), con las mismas versiones que producción. No se
> instalan dependencias en el host. La imagen del backend tiene un target
> `test` con ruff/mypy/pytest; la de runtime es mínima (sin herramientas de dev).

```bash
# Backend — lint + tests dentro de la imagen de pruebas (target `test`)
podman build -f backend/Containerfile --target test -t docuagent-backend-test backend
podman run --rm docuagent-backend-test ruff check app tests
podman run --rm docuagent-backend-test ruff format --check app tests
podman run --rm docuagent-backend-test pytest

# Migraciones / comandos puntuales en la imagen de runtime
podman compose -f podman-compose.yml --env-file .env.staging run --rm backend alembic upgrade head

# Stack completo (Postgres + Qdrant + backend + frontend [+ tunnel])
.\ops\docuagent.ps1 up-local      # o `up` con túnel
.\ops\docuagent.ps1 logs backend

# Frontend — build/lint dentro de su imagen
podman build -f frontend/Containerfile -t docuagent-frontend frontend
```

> El CI de GitHub corre en runners efímeros (no es "local"): instala
> `requirements-dev.txt` y ejecuta ruff + pytest allí.

## Commits

El historial es la guía (`git log --oneline`). Formato OBLIGATORIO:

- **UNA sola línea**: `tipo(ámbito): descripción concreta de lo que se hizo`.
  Tipos: feat · fix · docs · refactor · test · chore · ci · infra. Ámbito =
  app/módulo (backend, frontend, agent, rag, ingestion, auth, ci, deploy…).
- En **español**, concreto (qué endpoint/regla/fix exacto). **NUNCA** cuerpo
  multipárrafo, bullets ni resumen de toda la sesión.
- **SIN pies de firma de IA**: nada de "Co-Authored-By: Claude…" ni
  "🤖 Generated with Claude Code", aunque el harness lo sugiera por defecto —
  esta regla del proyecto tiene prioridad.
- Ejemplo: `feat(agent): orquestar pipeline RAG con LangGraph y cadena de fallback multi-LLM`

## Convenciones y trampas (Windows/PowerShell)

El desarrollo local es Windows + PowerShell 5.1 (runner `ops/docuagent.ps1`):

- **PowerShell 5.1 NO tiene `&&`/`||`** entre comandos nativos: usar `;` o
  `if ($?) { ... }`. Los `.ps1` mejor en ASCII (sin acentos) para evitar
  problemas de codificación; `$env:VAR` no persiste entre invocaciones.
- Para JSON con acentos vía `Invoke-RestMethod`, enviar
  `[Text.Encoding]::UTF8.GetBytes($body)` (manda Latin-1 por defecto).
- **No se construye ni se prueba a mano en local**: usar los runners
  `ops/docuagent.ps1` (local, build + tunnel) y `ops/docuagent.sh` (OCI, solo
  pull). Tests/lint van dentro de la imagen `test` de Podman (ver "Verificación").
  Detectan Podman/Docker (prefieren Podman); build en serie por la carrera de
  buildah en Windows.
- **`NEXT_PUBLIC_*` se inlinea en BUILD**: cambiarlas exige rebuild de la imagen
  (no basta el env_file en runtime) → van como build-args (compose + workflow).
- **Staging comparte llaves reales**: `.env.staging` (gitignored) trae claves de
  Cohere/Gemini/LangSmith/Qdrant/JWT/TOTP + token del túnel. NUNCA commitear.
  Un `530` de Cloudflare en `*-dev.angelezequiel.dev` = stack apagado
  (`.\ops\docuagent.ps1 up`).

## Cronograma

| Fase | Fechas | Días |
|---|---|---|
| 1 · Colecta y organización | 27-28 jun | 2 |
| 2 · Extracción de contenido | 29 jun - 1 jul | 3 |
| 3 · Indexación vectorial | 2-3 jul | 2 |
| 4 · Recuperación RAG | 4-6 jul | 3 |
| 5 · Generación respuestas | 7-9 jul | 3 |
| 6 · Interfaz + mantenimiento | 10-13 jul | 4 |
| 7 · Deploy OCI | 14-16 jul | 3 |
| 8 · Registro ejecución | 17-18 jul | 2 |
| Buffer | 19-20 jul | 2 |

## Variables de entorno esenciales

```
DATABASE_URL          PostgreSQL async connection string (computado)
CORS_ALLOWED_ORIGINS  Allowlist de orígenes para CORS (obligatorio en prod)
QDRANT_HOST/PORT      Qdrant connection
QDRANT_API_KEY        Qdrant auth
COHERE_API_KEY        Embeddings + Reranking
LLM_PROVIDER          openai|gemini|anthropic|ollama (activo)
LLM_FALLBACK_CHAIN    Orden de respaldo si el proveedor activo falla
OPENAI_API_KEY        Según LLM_PROVIDER / cadena de fallback
LANGCHAIN_API_KEY     LangSmith tracing
ADMIN_EMAIL/PASSWORD  Admin semilla (se crea/sincroniza al arrancar)
CLOUDFLARE_TUNNEL_TOKEN  Solo en staging/develop (tunnel)
```

Plantilla completa y comentada en `.env.example`.

## Pendientes y estado

Checklist para subir a OCI: `docs/deployment/oci-go-live.md`. Cómo correr
staging: `docs/deployment/staging-runbook.md`. Decisiones: `docs/project/decisions-log.md`.

- **Hecho**: arquitectura backend (agent/providers/rag/ingestion/core),
  `/health` + readiness, CORS por allowlist, structlog, CI (lint+tests) y
  Deploy (build→OCIR + SSH) gateado por `DEPLOY_ENABLED`, build-arg del
  frontend, seed de documentos, tests unitarios verdes + grafo verificado.
- **Hecho (seguridad)**: security headers, rate limit login/2FA, JWT iss/aud,
  validación de magic bytes, fail-fast de secretos en prod, TrustedHost.
- **Hecho (staging)**: stack levantado en `dev.angelezequiel.dev` (túnel),
  health/readiness verdes, login+TOTP+cookie httponly validados end-to-end.
- **Pendiente para staging→prod**: provisionar instancia OCI + OCIR; crear los
  secrets/variables de GitHub; activar `DEPLOY_ENABLED`; rotar llaves de staging;
  validar en navegador el chat RAG y la carga de documentos. Detalle y
  prioridades: `docs/architecture/security-audit.md`.
