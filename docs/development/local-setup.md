# 🛠️ Setup Local (desde cero)

## Prerrequisitos

| Herramienta | Versión mínima | Instalación |
|-------------|---------------|-------------|
| **Python** | 3.12+ | [python.org](https://python.org) o `winget install Python.Python.3.12` |
| **Node.js** | 20 LTS+ | [nodejs.org](https://nodejs.org) o `winget install OpenJS.NodeJS.LTS` |
| **Podman** | 5.0+ | `winget install RedHat.Podman` + `winget install RedHat.Podman-Desktop` |
| **Git** | 2.40+ | `winget install Git.Git` |

### Verificar instalación

```powershell
python --version      # 3.12+
node --version        # 20+
npm --version         # 10+
podman --version      # 5+
git --version         # 2.40+
```

### Podman en Windows

```powershell
# Inicializar la VM de Podman (solo la primera vez)
podman machine init
podman machine start

# Verificar que funciona
podman run --rm hello-world

# Instalar podman-compose
pip install podman-compose
```

---

## 1. Clonar y configurar

```powershell
git clone https://github.com/<tu-usuario>/docuagent.git
cd docuagent

# Crear branch de trabajo
git checkout develop
git checkout -b feature/initial-setup

# Copiar variables de entorno
cp .env.example .env
# Editar .env con tus API keys reales
```

### Variables obligatorias para desarrollo

```
DATABASE_URL=postgresql+asyncpg://docuagent_app:localpass@localhost:5432/docuagent
QDRANT_HOST=localhost
QDRANT_PORT=6333
QDRANT_API_KEY=dev-key-local
COHERE_API_KEY=<tu-api-key>          # Requerido: embeddings + reranking
LLM_PROVIDER=openai                   # o gemini, anthropic, ollama
OPENAI_API_KEY=<tu-api-key>          # Solo si LLM_PROVIDER=openai
```

> **Nota**: Sin `COHERE_API_KEY` no funcionan embeddings ni reranking. Es la única key 100% obligatoria para el pipeline RAG.

---

## 2. Levantar servicios con Podman

### Opción A: Con el runner (recomendado)

```powershell
.\ops\docuagent.ps1 up-local    # Sin tunnel, solo localhost
```

### Opción B: Manual

```powershell
podman-compose up -d postgres qdrant    # Solo BDs
```

### Verificar que los servicios están corriendo

```powershell
podman-compose ps

# PostgreSQL
podman exec -it docuagent-postgres psql -U docuagent_app -d docuagent -c "SELECT 1"

# Qdrant
curl http://localhost:6333/healthz     # Debería devolver "ok"
```

---

## 3. Backend

```powershell
cd backend

# Crear entorno virtual
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Instalar dependencias
pip install -e ".[dev]"

# Aplicar migraciones
alembic upgrade head

# Verificar
pytest tests/unit/ -v

# Levantar servidor de desarrollo
uvicorn app.main:app --reload --port 8000
```

Acceder a:
- API Docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- Health: http://localhost:8000/api/v1/health

---

## 4. Frontend

```powershell
cd frontend

# Instalar dependencias
npm install

# Levantar servidor de desarrollo
npm run dev
```

Acceder a: http://localhost:3000

---

## 5. Verificación completa

```powershell
# 1. Health check del backend
curl http://localhost:8000/api/v1/health/detailed

# 2. Subir un documento de prueba
curl -X POST http://localhost:8000/api/v1/documents `
  -F "file=@docs/project/overview.md" `
  -F "category_id=<uuid-de-categoria>"

# 3. Hacer una pregunta
curl -X POST http://localhost:8000/api/v1/chat `
  -H "Content-Type: application/json" `
  -d '{"query": "¿Cuál es el objetivo del proyecto?"}'
```

---

## Troubleshooting

| Problema | Solución |
|----------|----------|
| `podman machine` no inicia | `podman machine rm` y `podman machine init --cpus 4 --memory 4096` |
| Puerto 5432 ocupado | Apagar PostgreSQL local o cambiar `DB_PORT` en `.env` |
| Puerto 6333 ocupado | `podman stop` contenedor viejo de Qdrant |
| `ModuleNotFoundError` | Activar el venv: `.\.venv\Scripts\Activate.ps1` |
| Qdrant connection refused | Verificar que el contenedor está corriendo: `podman ps` |
| `COHERE_API_KEY` error | Obtener key en [dashboard.cohere.com](https://dashboard.cohere.com) |
| Build de Podman falla (buildah race) | El runner ya lo maneja (build en serie); si falla manual, reintentar |
