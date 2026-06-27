# 🌿 Flujo de Trabajo con Git (Branching Strategy)

## Estrategia de Branches

El proyecto utiliza un flujo **Git Flow simplificado** con tres niveles de branches:

```mermaid
gitgraph
    commit id: "init"
    branch develop
    checkout develop
    commit id: "setup"
    branch feature/ingestion-pipeline
    checkout feature/ingestion-pipeline
    commit id: "extractors"
    commit id: "chunker"
    checkout develop
    merge feature/ingestion-pipeline id: "merge-ingestion"
    branch feature/rag-pipeline
    checkout feature/rag-pipeline
    commit id: "retriever"
    commit id: "reranker"
    checkout develop
    merge feature/rag-pipeline id: "merge-rag"
    checkout main
    merge develop id: "release-v0.1" tag: "v0.1.0"
    checkout develop
    branch feature/frontend
    checkout feature/frontend
    commit id: "landing"
    commit id: "chat-ui"
    checkout develop
    merge feature/frontend id: "merge-frontend"
    checkout main
    merge develop id: "release-v0.2" tag: "v0.2.0"
```

## Branches Principales

| Branch | Propósito | Deploy | Protección |
|--------|-----------|--------|------------|
| `main` | **Producción** — Código estable desplegado en OCI | Automático → `tu-dominio.dev` | Requiere PR aprobado desde `develop` |
| `develop` | **Staging / Local** — Integración y pruebas con Cloudflare Tunnel | Local con tunnel → `dev.tu-dominio.dev` | Requiere PR desde feature branches |

## Feature Branches

```
feature/<nombre>     → Funcionalidades nuevas
fix/<nombre>         → Correcciones de bugs
docs/<nombre>        → Cambios en documentación
refactor/<nombre>    → Refactorizaciones
test/<nombre>        → Adición/mejora de tests
infra/<nombre>       → Cambios de infraestructura
```

### Convención de Nombres

```bash
# Formato: tipo/descripcion-corta
feature/ingestion-pipeline
feature/rag-retrieval
feature/frontend-chat
fix/pdf-extraction-unicode
docs/api-endpoints
refactor/provider-factory
infra/oci-deployment
```

## Flujo de Trabajo

### 1. Desarrollo de una nueva funcionalidad

```bash
# 1. Asegurarse de estar en develop actualizado
git checkout develop
git pull origin develop

# 2. Crear feature branch
git checkout -b feature/rag-retrieval

# 3. Desarrollar (commits frecuentes)
git add .
git commit -m "feat(rag): implementar búsqueda semántica en Qdrant"
git commit -m "feat(rag): agregar filtrado por metadatos"
git commit -m "test(rag): tests de retrieval quality"

# 4. Push al remoto
git push origin feature/rag-retrieval

# 5. Crear Pull Request → develop
# (en GitHub)

# 6. Después del merge, eliminar el branch
git checkout develop
git pull origin develop
git branch -d feature/rag-retrieval
```

### 2. Testing local con Cloudflare Tunnel (develop)

```bash
# En develop, después de mergear features
git checkout develop
git pull origin develop

# Levantar con tunnel local
podman-compose -f podman-compose.yml -f podman-compose.dev.yml up -d

# Esto expone:
# - Frontend:  https://dev.tu-dominio.dev (vía Cloudflare Tunnel)
# - API:       https://api-dev.tu-dominio.dev (vía Cloudflare Tunnel)
# - Local:     http://localhost:3000 y http://localhost:8000
```

### 3. Deploy a producción (main)

```bash
# Solo cuando develop está estable y probado
# Crear PR: develop → main

# El merge a main dispara:
# 1. GitHub Actions: build, test, push a OCIR
# 2. Deploy automático a OCI
# 3. Disponible en https://tu-dominio.dev
```

## Convención de Commits

Usamos **Conventional Commits**:

```
tipo(alcance): descripción

[cuerpo opcional]

[footer opcional]
```

### Tipos

| Tipo | Descripción |
|------|-------------|
| `feat` | Nueva funcionalidad |
| `fix` | Corrección de bug |
| `docs` | Cambios en documentación |
| `style` | Formato (sin cambios de lógica) |
| `refactor` | Refactorización (sin cambios de funcionalidad) |
| `test` | Adición o corrección de tests |
| `chore` | Tareas de mantenimiento (deps, config) |
| `ci` | Cambios en CI/CD |
| `perf` | Mejoras de rendimiento |
| `infra` | Cambios de infraestructura |

### Ejemplos

```
feat(agent): implementar grafo LangGraph con reranking
fix(extraction): corregir encoding Unicode en PDFs
docs(api): documentar endpoint de WebSocket
test(rag): agregar tests de similitud semántica multilingüe
chore(deps): actualizar langchain-core a 0.3.1
ci(actions): agregar workflow de deploy a OCI
infra(podman): agregar Cloudflare Tunnel al compose
```

## Tags y Releases

```bash
# Versionado semántico
v0.1.0  # MVP: Pipeline RAG funcional
v0.2.0  # Frontend chat + admin
v0.3.0  # Deploy OCI
v1.0.0  # Release estable completa
```

## Protección de Branches

### `main`
- ❌ No se puede hacer push directo
- ✅ Solo merge vía Pull Request desde `develop`
- ✅ Requiere que CI pase (tests + build)
- ✅ Requiere al menos 1 review (o auto-merge si es solo tú)

### `develop`
- ❌ No se puede hacer push directo
- ✅ Solo merge vía Pull Request desde feature branches
- ✅ Requiere que CI pase (tests)

## Diagrama del Flujo Completo

```mermaid
flowchart LR
    FB[Feature Branch] -->|PR + Tests| DEV[develop]
    DEV -->|Cloudflare Tunnel| LOCAL[Test Local]
    LOCAL -->|✅ Probado| PR[PR → main]
    PR -->|Tests + Review| MAIN[main]
    MAIN -->|GitHub Actions| OCI[Deploy OCI]
    OCI -->|HTTPS| PROD[tu-dominio.dev]

    style FB fill:#9b59b6,color:#fff
    style DEV fill:#f39c12,color:#fff
    style MAIN fill:#2ecc71,color:#fff
    style PROD fill:#e74c3c,color:#fff
```

## Setup Inicial

```bash
# Inicializar repositorio
git init
git add .
git commit -m "chore: initial project setup"

# Crear branches
git branch develop
git checkout develop

# Configurar remoto
git remote add origin https://github.com/<tu-usuario>/docuagent.git
git push -u origin main
git push -u origin develop

# Configurar branch default a develop para PRs
# (en GitHub: Settings → Branches → Default branch: develop)
```
