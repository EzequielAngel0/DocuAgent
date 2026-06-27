# 🤖 DocuAgent — Agente RAG de Documentación Empresarial

<p align="center">
  <img src="docs/assets/logo-placeholder.png" alt="DocuAgent Logo" width="200"/>
</p>

<p align="center">
  <strong>Agente inteligente de búsqueda y consulta sobre documentación corporativa</strong><br/>
  Powered by RAG (Retrieval-Augmented Generation) con LangGraph, FastAPI y Next.js
</p>

<p align="center">
  <a href="#-características">Características</a> •
  <a href="#-arquitectura">Arquitectura</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-inicio-rápido">Inicio Rápido</a> •
  <a href="#-despliegue">Despliegue</a> •
  <a href="#-documentación">Documentación</a>
</p>

---

## 📋 Descripción

**DocuAgent** es un agente de IA que permite a los colaboradores de una empresa consultar documentación interna (políticas de RH, contratos, procedimientos operacionales, normativas financieras, etc.) a través de una interfaz conversacional.

El sistema utiliza **RAG (Retrieval-Augmented Generation)** para buscar información relevante en la base de documentos y generar respuestas precisas con citación de fuentes, eliminando la necesidad de buscar manualmente entre cientos de documentos dispersos.

### ¿Cómo funciona?

```
Colaborador hace una pregunta
        │
        ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Embedding de   │────▶│ Búsqueda en Base │────▶│    Reranking     │
│   la consulta    │     │    Vectorial      │     │   (Cohere)       │
└─────────────────┘     └──────────────────┘     └────────┬────────┘
                                                           │
                                                           ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ Respuesta con   │◀────│  Generación con   │◀────│  Ensamblaje de  │
│ citación de     │     │     LLM           │     │    contexto     │
│ fuentes         │     └──────────────────┘     └─────────────────┘
└─────────────────┘
```

## ✨ Características

- 🔍 **Búsqueda semántica** — Encuentra documentos por significado, no solo por palabras clave
- 📄 **Multi-formato** — Soporta PDF (nativo + OCR), Word, Excel, Markdown, CSV, JSON y texto plano
- 🌐 **Multilingüe** — Operación en español, inglés y portugués
- 🔄 **Multi-proveedor LLM** — Compatible con OpenAI, Google Gemini, Anthropic Claude y modelos locales
- 📊 **Reranking inteligente** — Cohere Rerank para precisión superior en los resultados
- 💬 **Memoria conversacional** — Mantiene contexto dentro de una sesión de chat
- 📎 **Citación de fuentes** — Cada respuesta incluye referencias al documento original
- 🏷️ **Categorías dinámicas** — Sistema de categorización configurable (RH, Legal, Financiero, etc.)
- 📈 **Observabilidad** — Trazabilidad completa con LangSmith
- 🐳 **Containerizado** — Desplegable con Podman/Docker en cualquier entorno
- ☁️ **Cloud-ready** — Diseñado para Oracle Cloud Infrastructure (OCI)

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│                   Next.js (React + TypeScript)                │
│    ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│    │ Landing  │  │   Chat   │  │  Upload  │  │  Admin   │  │
│    │  Page    │  │Interface │  │  Docs    │  │  Panel   │  │
│    └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/WebSocket
┌────────────────────────▼────────────────────────────────────┐
│                     API GATEWAY                              │
│                 FastAPI (Python 3.12+)                        │
│    ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│    │ /chat    │  │ /docs    │  │/categories│  │ /health  │  │
│    │ endpoint │  │ management│  │ CRUD     │  │ metrics  │  │
│    └────┬─────┘  └──────────┘  └──────────┘  └──────────┘  │
└─────────┼───────────────────────────────────────────────────┘
          │
┌─────────▼───────────────────────────────────────────────────┐
│                  AGENT ORCHESTRATION                          │
│                   LangGraph (Python)                          │
│    ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│    │ Query    │  │ Retrieve │  │ Rerank   │  │ Generate │  │
│    │ Analysis │  │ Context  │  │ Results  │  │ Response │  │
│    └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
└─────────┬──────────┬──────────────┬─────────────┬───────────┘
          │          │              │             │
     ┌────▼───┐ ┌───▼────┐  ┌─────▼─────┐ ┌────▼──────┐
     │Cohere  │ │ Qdrant │  │PostgreSQL │ │LLM Provider│
     │Embed v3│ │Vector  │  │ Metadata  │ │(multi)    │
     │        │ │  DB    │  │  & Logs   │ │           │
     └────────┘ └────────┘  └───────────┘ └───────────┘
```

> Para la arquitectura detallada, ver [`docs/architecture/`](docs/architecture/)

## 🛠️ Tech Stack

| Capa | Tecnología | Justificación |
|------|-----------|---------------|
| **Lenguaje** | Python 3.12+ | Ecosistema maduro para IA/ML |
| **Orquestación IA** | LangGraph | Grafos de estado, control fino del flujo RAG |
| **API Backend** | FastAPI | Async, OpenAPI auto-docs, Pydantic |
| **Frontend** | Next.js (React + TypeScript) | SPA profesional, SSR, TypeScript |
| **Base Vectorial** | Qdrant | Open-source, alto rendimiento, containerizable |
| **Base Relacional** | PostgreSQL + Alembic | Metadatos, logs, auditoría, migraciones |
| **Embeddings** | Cohere Embed v3 (multilingual) | Soporte nativo ES/EN/PT, 1024 dims |
| **Reranking** | Cohere Rerank | Alta precisión, multilingüe |
| **LLM** | Multi-proveedor (OpenAI, Gemini, Claude, Ollama) | Flexibilidad y fallback |
| **Observabilidad** | LangSmith | Trazabilidad de chains/agents |
| **Contenedores** | Podman + Podman Compose | Compatible OCI, rootless |
| **CI/CD** | GitHub Actions | Integración directa con GitHub |
| **Cloud** | Oracle Cloud Infrastructure (OCI) | Requisito del proyecto |
| **Testing** | pytest + pytest-asyncio + scripts e2e | Cobertura completa |

## 🚀 Inicio Rápido

### Prerrequisitos

- Python 3.12+
- Node.js 20+ (para el frontend)
- Podman (o Docker)
- Git

### Instalación local

```bash
# 1. Clonar el repositorio
git clone https://github.com/<tu-usuario>/docuagent.git
cd docuagent

# 2. Copiar variables de entorno
cp .env.example .env
# Editar .env con tus API keys

# 3. Levantar servicios con Podman Compose
podman-compose up -d

# 4. La aplicación estará disponible en:
# - Frontend: http://localhost:3000
# - API Backend: http://localhost:8000
# - API Docs: http://localhost:8000/docs
# - Qdrant Dashboard: http://localhost:6333/dashboard
```

### Desarrollo local (sin contenedores)

```bash
# Backend
cd backend
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
# .venv\Scripts\activate   # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend (en otra terminal)
cd frontend
npm install
npm run dev
```

## 📦 Despliegue

### Contenedores con Podman

```bash
# Construir imágenes
podman-compose build

# Ejecutar en modo producción
podman-compose -f podman-compose.yml -f podman-compose.prod.yml up -d
```

### Oracle Cloud Infrastructure (OCI)

El proyecto utiliza los siguientes servicios de OCI:

- **OCI Container Registry (OCIR)** — Almacenamiento de imágenes de contenedor
- **OCI Container Instances / OKE** — Ejecución de contenedores
- **OCI Object Storage** — Almacenamiento de documentos originales
- **OCI Vault** — Gestión de secretos y API keys
- **OCI VCN + Load Balancer** — Red y balanceo de carga

> Para instrucciones detalladas, ver [`docs/deployment/`](docs/deployment/)

## 📚 Documentación

| Documento | Descripción |
|-----------|-------------|
| [`docs/architecture/`](docs/architecture/) | Arquitectura del sistema, diagramas, ADRs |
| [`docs/pipeline/`](docs/pipeline/) | Pipeline RAG completo (ingesta → respuesta) |
| [`docs/api/`](docs/api/) | Especificación de la API REST |
| [`docs/deployment/`](docs/deployment/) | Guías de despliegue (local, Podman, OCI) |
| [`docs/development/`](docs/development/) | Guía para desarrolladores, convenciones |
| [`docs/operations/`](docs/operations/) | Mantenimiento, monitoreo, runbooks |
| [`docs/project/`](docs/project/) | Plan de proyecto, fases, decisiones |

## 🧪 Testing

```bash
# Tests unitarios
cd backend
pytest tests/unit/ -v

# Tests de integración
pytest tests/integration/ -v

# Tests e2e
python scripts/e2e_test.py

# Cobertura
pytest --cov=app --cov-report=html
```

## 📁 Estructura del Proyecto

```
docuagent/
├── backend/                    # API y lógica del agente (Python/FastAPI)
│   ├── app/
│   │   ├── api/               # Endpoints REST
│   │   ├── agent/             # LangGraph agent y nodos
│   │   ├── rag/               # Pipeline RAG (retrieval, reranking)
│   │   ├── ingestion/         # Procesamiento de documentos
│   │   ├── models/            # Modelos SQLAlchemy / Pydantic
│   │   ├── services/          # Lógica de negocio
│   │   ├── providers/         # Integraciones LLM multi-proveedor
│   │   └── core/              # Configuración, utilidades
│   ├── tests/
│   ├── alembic/               # Migraciones de BD
│   └── requirements.txt
├── frontend/                   # Interfaz web (Next.js)
│   ├── src/
│   │   ├── app/               # App Router pages
│   │   ├── components/        # Componentes React
│   │   ├── hooks/             # Custom hooks
│   │   ├── lib/               # Utilidades, API client
│   │   └── styles/            # CSS / diseño
│   └── package.json
├── docs/                       # Documentación completa
├── infra/                      # Infraestructura como código
│   ├── podman/                # Containerfiles y compose
│   ├── oci/                   # Scripts/Terraform para OCI
│   └── github-actions/        # Workflows CI/CD
├── scripts/                    # Scripts de utilidad
├── .env.example
├── podman-compose.yml
└── README.md
```

## 🤝 Contribución

1. Fork el repositorio
2. Crea tu branch (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'feat: agregar nueva funcionalidad'`)
4. Push al branch (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT — ver el archivo [LICENSE](LICENSE) para más detalles.

---

<p align="center">
  Desarrollado como parte del programa de formación en IA de <strong>Alura LATAM</strong> 🚀
</p>

