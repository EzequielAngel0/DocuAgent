# 🐍 Arquitectura del Backend

El backend usa **FastAPI** como gateway HTTP/WebSocket y **LangGraph** para
orquestar el agente RAG, con una separación clara por capas: API → agente →
RAG/ingesta → proveedores LLM → datos.

> Esta página describe la estructura **real** del código en `backend/app/`.
> El flujo conceptual del pipeline está en `docs/pipeline/`.

## Estructura real

```
backend/
├── app/
│   ├── __init__.py                # __version__
│   ├── main.py                    # FastAPI: CORS, routers, lifespan
│   │
│   ├── core/                      # Transversal
│   │   ├── config.py              # Settings (pydantic-settings)
│   │   ├── logging.py             # structlog (consola/JSON)
│   │   ├── exceptions.py          # Excepciones de dominio
│   │   ├── security.py            # bcrypt, JWT, TOTP
│   │   └── sanitizer.py           # Anti prompt-injection (entrada)
│   │
│   ├── models/                    # Datos
│   │   ├── orm.py                 # SQLAlchemy (Base + 4 tablas)
│   │   └── schemas.py             # Pydantic (contrato API)
│   │
│   ├── db/
│   │   └── session.py             # engine async + SessionLocal + get_db
│   │
│   ├── api/
│   │   ├── deps.py                # get_current_user (JWT)
│   │   └── v1/
│   │       ├── router.py          # Agrega los routers v1
│   │       └── endpoints/
│   │           ├── health.py      # /health, /health/ready
│   │           ├── auth.py        # login, verify-2fa, setup-2fa, logout
│   │           ├── categories.py  # CRUD categorías (/admin/categories)
│   │           ├── documents.py   # subida/reindex/borrado/chunks (/admin/documents)
│   │           ├── feedback.py    # historial + feedback (/admin/history)
│   │           └── chat.py        # WebSocket /chat/ws
│   │
│   ├── agent/                     # Agente LangGraph
│   │   ├── state.py               # AgentState (TypedDict)
│   │   ├── prompts.py             # System prompt blindado + fallback
│   │   ├── graph.py               # build_agent_graph, run_agent, prepare_context
│   │   └── nodes/
│   │       ├── query_analyzer.py  # sanea + detecta inyección
│   │       ├── retriever.py       # embed + búsqueda Qdrant (top-K)
│   │       ├── reranker.py        # Cohere Rerank + umbral
│   │       ├── context_builder.py # ensambla contexto + citas
│   │       ├── generator.py       # LLM (cadena de fallback)
│   │       ├── validator.py       # anti-alucinación post-gen
│   │       └── fallback.py        # respuesta honesta terminal
│   │
│   ├── rag/                       # Recuperación
│   │   ├── embeddings.py          # Cohere embed (doc/query)
│   │   ├── vector_store.py        # Qdrant (VectorStore singleton)
│   │   ├── reranker.py            # Cohere rerank
│   │   └── retrieval.py           # retrieve_and_rerank (alto nivel)
│   │
│   ├── ingestion/                 # Ingesta de documentos
│   │   ├── extractors.py          # DocumentExtractor (PDF/DOCX/XLSX/CSV/MD/TXT/HTML/JSON)
│   │   ├── cleaner.py             # clean_text
│   │   ├── chunker.py             # chunk_text (semántico + páginas)
│   │   └── indexer.py             # index_document (orquestador)
│   │
│   ├── providers/                 # LLM multi-proveedor
│   │   ├── base.py                # BaseLLMProvider (generate/stream)
│   │   ├── openai_provider.py
│   │   ├── gemini_provider.py
│   │   ├── anthropic_provider.py
│   │   ├── ollama_provider.py
│   │   └── factory.py             # get_provider + *_with_fallback
│   │
│   └── scripts/
│       └── seed_documents.py      # Indexa documents/ a Qdrant + PostgreSQL
│
├── alembic/                       # Migraciones (env.py + versions/)
├── tests/                         # unit/ · integration/
├── requirements.txt               # Runtime
├── requirements-dev.txt           # + ruff, mypy
├── pyproject.toml                 # pytest + ruff
└── Containerfile                  # Build multi-stage, no-root
```

> **Nota de nombres**: los módulos de proveedores se llaman `*_provider.py`
> (no `openai.py`) para no ensombrecer los paquetes `openai`, etc. No existe
> una capa `services/`: la lógica de negocio vive en los endpoints (CRUD) y en
> `ingestion/indexer.py` / `agent/` (pipeline).

## Capas y responsabilidades

| Capa | Módulo | Responsabilidad |
|------|--------|-----------------|
| API | `api/v1/endpoints/` | Validación, auth, serialización |
| Agente | `agent/` | Grafo RAG (6 nodos + fallback) |
| RAG | `rag/` | Embeddings, Qdrant, rerank |
| Ingesta | `ingestion/` | Extraer → limpiar → chunkear → indexar |
| Proveedores | `providers/` | LLM intercambiable + fallback |
| Datos | `models/`, `db/` | ORM + esquemas + sesión |
| Core | `core/` | Config, logging, errores, seguridad |

## Dependencias principales

Ver `backend/requirements.txt` para versiones exactas (fijadas). Resumen:

- **API**: `fastapi`, `uvicorn[standard]`, `python-multipart`, `httpx`
- **Agente/LLM**: `langgraph`, `langchain`, `langchain-core`,
  `langchain-openai`, `langchain-google-genai`, `langchain-anthropic`,
  `langchain-ollama`
- **RAG**: `cohere` (embeddings + rerank), `qdrant-client`
- **Datos**: `sqlalchemy[asyncio]`, `asyncpg`, `alembic`, `pydantic-settings`
- **Seguridad**: `python-jose`, `passlib[bcrypt]`, `bcrypt`, `pyotp`, `qrcode`
- **Ingesta**: `pypdf`, `python-docx`, `openpyxl`
- **Observabilidad**: `structlog`
- **Dev/CI**: `ruff`, `mypy`, `pytest`, `pytest-asyncio`

## Patrones de diseño

### Factory + cadena de fallback (proveedores LLM)

`providers/factory.py` registra los 4 proveedores y los construye de forma
perezosa (no exige todos los SDK instalados). `generate_with_fallback` y
`stream_with_fallback` recorren `settings.fallback_chain` (proveedor activo +
`LLM_FALLBACK_CHAIN`, sin duplicados) hasta obtener respuesta; si todos fallan
lanzan `LLMProviderError`.

```python
text, provider = await generate_with_fallback(system_prompt, user_query)
```

### Máquina de estados (LangGraph)

`agent/state.py` define `AgentState` (TypedDict) y `agent/graph.py` arma el
grafo: `query_analyzer → retriever → reranker → context_builder → generator →
validator`, con un nodo terminal `fallback`. Transiciones condicionales
derivan al fallback ante inyección, ausencia de contexto o respuesta inválida.

Para el chat con streaming, `prepare_context()` ejecuta los nodos previos a la
generación (reutilizando las mismas funciones) y el WebSocket transmite los
tokens del `generator` en vivo — manteniendo consistentes el camino streaming
y el no-streaming (`run_agent`).

### Configuración (pydantic-settings)

`core/config.py` expone un único `settings`. Variables clave en
`UPPER_SNAKE_CASE` (ver `.env.example`). Campos computados:
`DATABASE_URL`, `cors_origins`, `fallback_chain`, `IS_PRODUCTION`.

## Manejo de errores y logging

- `core/exceptions.py`: `DocuAgentError` y subtipos (`IngestionError`,
  `UnsupportedFormatError`, `RetrievalError`, `LLMProviderError`,
  `PromptInjectionError`) con `status_code` mapeable a HTTP.
- `core/logging.py`: `structlog` con salida de consola en dev y **JSON en
  producción** (`LOG_JSON=true`). Se usa `get_logger(__name__)` y eventos
  clave-valor (`logger.info("ingestion_indexed", document_id=..., chunks=...)`).

## Seguridad (resumen)

Detalle en `docs/architecture/security.md`. En el backend:
- **Anti prompt-injection**: `core/sanitizer.py` (entrada) + system prompt
  blindado con 7 reglas NUNCA + delimitadores XML + nodo `validator` (salida).
- **Auth admin**: password (bcrypt) → Turnstile → TOTP → JWT.
- **CORS** restringido a `CORS_ALLOWED_ORIGINS` (sin comodín con credenciales).
- **Uploads**: allowlist de extensiones + límite de tamaño (streaming).
