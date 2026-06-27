# Guía Rápida de Sistemas e Infraestructura Interna

## 1. Stack Tecnológico Principal
DocuAgent es un asistente conversacional RAG multi-proveedor diseñado con la siguiente arquitectura:
- **Backend:** Python 3.12, FastAPI, SQLAlchemy, Asyncpg, Alembic y LangGraph.
- **Frontend:** Next.js 15 (TypeScript), Vanilla CSS con soporte para tema claro y oscuro.
- **Bases de Datos:** PostgreSQL 16 (metadatos y auditoría) y Qdrant (búsqueda vectorial HNSW).
- **Embeddings y Reranking:** Cohere Embed v3 Multilingual + Cohere Rerank v3.
- **Contenedores:** Podman / Docker Compose con runner automatizado (`ops/docuagent.ps1` en Windows y `ops/docuagent.sh` en Linux/OCI).

## 2. Comandos Operativos del Runner Local
- `.\ops\docuagent.ps1 up`: Construye y levanta el stack conectando el túnel de Cloudflare para staging.
- `.\ops\docuagent.ps1 up-local`: Levanta el stack en modo exclusivo localhost (sin túnel).
- `.\ops\docuagent.ps1 logs backend`: Muestra los logs en tiempo real del servicio backend.
- `.\ops\docuagent.ps1 down`: Detiene y remueve los contenedores activos.
