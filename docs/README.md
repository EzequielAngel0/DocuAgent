# 📚 Documentación de DocuAgent

Índice completo de la documentación del proyecto.

## 📁 Estructura

```
docs/
├── README.md                          # Este archivo (índice)
│
├── project/                           # 📋 Gestión del proyecto
│   ├── overview.md                    # Visión general, objetivos, alcance
│   ├── phases.md                      # Fases y cronograma (deadline: 20 jul)
│   ├── decisions-log.md               # Registro de decisiones técnicas (ADR)
│   └── glossary.md                    # Glosario de términos
│
├── architecture/                      # 🏗️ Arquitectura del sistema
│   ├── system-overview.md             # Arquitectura de alto nivel
│   ├── backend-architecture.md        # Backend (FastAPI + LangGraph)
│   ├── frontend-architecture.md       # Frontend (Next.js)
│   ├── database-design.md             # BD (PostgreSQL + Qdrant)
│   ├── llm-providers.md               # Multi-proveedor LLM
│   ├── tech-stack.md                  # Stack tecnológico
│   └── security.md                    # Seguridad (prompt injection, API, BD, red)
│
├── pipeline/                          # 🔄 Pipeline RAG
│   ├── 01-document-collection.md      # Fase 1: Colecta y organización
│   ├── 02-content-extraction.md       # Fase 2: Extracción de contenido
│   ├── 03-indexing.md                 # Fase 3: Indexación vectorial
│   ├── 04-retrieval.md                # Fase 4: Recuperación (RAG)
│   ├── 05-response-generation.md      # Fase 5: Generación y validación
│   └── chunking-strategy.md           # Estrategia de chunking semántico
│
├── api/                               # 🌐 API
│   ├── overview.md                    # Formato, autenticación, códigos HTTP
│   ├── endpoints.md                   # Catálogo de endpoints REST
│   ├── schemas.md                     # Modelos Pydantic (request/response)
│   └── websocket.md                   # Protocolo WebSocket (chat streaming)
│
├── deployment/                        # 🚀 Despliegue
│   ├── containerfiles.md              # Containerfiles + compose (dev/prod)
│   ├── oci-setup.md                   # Deploy en Oracle Cloud (paso a paso)
│   └── ci-cd.md                       # GitHub Actions (CI + build + deploy)
│
├── development/                       # 👨‍💻 Desarrollo
│   ├── local-setup.md                 # Setup local desde cero
│   ├── git-workflow.md                # Branches, commits, PRs
│   └── testing-strategy.md            # Unit, integration, E2E
│
├── private/                           # 🔒 Doc sensible (NO en git)
│   └── domain-setup.md               # Dominio, Cloudflare Tunnel, tokens
│
└── assets/                            # 🎨 Recursos visuales
    ├── diagrams/                      # Diagramas de arquitectura
    └── screenshots/                   # Capturas del agente funcionando
```

## 🧭 Navegación Rápida

### Soy nuevo — quiero entender el proyecto
1. [`project/overview.md`](project/overview.md) → Qué hace, para quién, alcance
2. [`architecture/system-overview.md`](architecture/system-overview.md) → Cómo funciona
3. [`development/local-setup.md`](development/local-setup.md) → Configurar mi entorno

### Quiero entender el pipeline RAG
1. [`pipeline/01-document-collection.md`](pipeline/01-document-collection.md) → Cómo se recolectan documentos
2. [`pipeline/02-content-extraction.md`](pipeline/02-content-extraction.md) → Cómo se extraen y limpian
3. [`pipeline/03-indexing.md`](pipeline/03-indexing.md) → Cómo se indexan en Qdrant
4. [`pipeline/04-retrieval.md`](pipeline/04-retrieval.md) → Cómo se busca y reranquea
5. [`pipeline/05-response-generation.md`](pipeline/05-response-generation.md) → Cómo el LLM genera la respuesta

### Quiero desplegar
1. Local: [`development/local-setup.md`](development/local-setup.md)
2. Contenedores: [`deployment/containerfiles.md`](deployment/containerfiles.md)
3. OCI: [`deployment/oci-setup.md`](deployment/oci-setup.md)
4. CI/CD: [`deployment/ci-cd.md`](deployment/ci-cd.md)

### Quiero entender la seguridad
→ [`architecture/security.md`](architecture/security.md) — prompt injection, API, BD, contenedores, red

### Quiero ver las decisiones técnicas
→ [`project/decisions-log.md`](project/decisions-log.md) — Por qué LangGraph, Qdrant, Cohere, etc.

---

> **Nota**: `docs/private/` contiene documentación sensible (tokens, dominio) y está ignorada por `.gitignore`.
