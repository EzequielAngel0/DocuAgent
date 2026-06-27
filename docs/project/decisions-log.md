# 📝 Registro de Decisiones Técnicas (ADR)

Este documento registra las decisiones arquitectónicas y tecnológicas del proyecto, con su contexto y justificación.

> **Formato**: [Architecture Decision Records (ADR)](https://adr.github.io/)

---

## ADR-001: Lenguaje de Programación — Python

**Fecha**: 2026-06-27
**Estado**: ✅ Aceptada

### Contexto
Se necesita un lenguaje con ecosistema maduro para IA/ML, buena integración con frameworks de agentes y capacidad async para APIs.

### Decisión
**Python 3.12+** como lenguaje principal del backend.

### Justificación
- Ecosistema de IA/ML más maduro (LangChain, LangGraph, LlamaIndex)
- FastAPI para APIs async de alto rendimiento
- Tipado estático con type hints y Pydantic
- Gran comunidad y documentación
- SDKs oficiales de todos los proveedores LLM

### Consecuencias
- El frontend se desarrolla por separado (Next.js / TypeScript)
- Se requiere gestión de entornos virtuales (venv)

---

## ADR-002: Framework de Orquestación — LangGraph

**Fecha**: 2026-06-27
**Estado**: ✅ Aceptada

### Contexto
Se necesita un framework para orquestar el pipeline RAG con control fino sobre el flujo: query → retrieval → reranking → generation.

### Opciones Evaluadas

| Framework | Pros | Contras |
|-----------|------|---------|
| **LangGraph** | Grafos de estado, control fino, checkpointing | Curva de aprendizaje, documentación en evolución |
| LangChain | Gran comunidad, chains simples | Menos control sobre el flujo, abstracciones pesadas |
| LlamaIndex | Especializado en RAG | Menos flexible para flujos custom |
| Haystack | Open-source, pipelines modulares | Comunidad más pequeña |
| CrewAI | Multi-agente | Overhead para un solo agente |

### Decisión
**LangGraph** como framework principal de orquestación.

### Justificación
- Los grafos de estado permiten modelar el pipeline RAG como un flujo con nodos condicionales
- Mejor control sobre reranking, fallbacks y validación de respuestas
- Soporte nativo para memoria conversacional (checkpoints)
- Integración natural con LangSmith para observabilidad
- Arquitectura modular y extensible para producción

---

## ADR-003: Base de Datos Vectorial — Qdrant

**Fecha**: 2026-06-27
**Estado**: ✅ Aceptada

### Contexto
Se necesita una base de datos vectorial para almacenar y buscar embeddings de los fragmentos de documentos.

### Opciones Evaluadas

| BD Vectorial | Pros | Contras |
|-------------|------|---------|
| **Qdrant** | Open-source, alto rendimiento, containerizable, filtros avanzados | Menos conocido que Pinecone |
| ChromaDB | Ligero, embebido en Python | No escala bien, ideal solo para prototipos |
| Weaviate | Híbrido (vectorial + keyword) | Más complejo de configurar |
| Pinecone | Serverless, managed | Vendor lock-in, costo |
| pgvector | Una sola BD para todo | Rendimiento inferior para búsquedas vectoriales puras |

### Decisión
**Qdrant** como base de datos vectorial.

### Justificación
- Open-source con imagen oficial de contenedor (ideal para Podman)
- Alto rendimiento con índice HNSW
- Filtrado avanzado por metadatos (payload filtering)
- API REST y gRPC
- Dashboard web incluido para debugging
- Escala bien de desarrollo a producción

---

## ADR-004: Base de Datos Relacional — PostgreSQL

**Fecha**: 2026-06-27
**Estado**: ✅ Aceptada

### Contexto
Se necesita una base de datos para almacenar metadatos de documentos, categorías, logs de auditoría, feedback de usuarios y sesiones de chat. Se evaluó MongoDB como alternativa.

### Decisión
**PostgreSQL** con **SQLAlchemy** (ORM) y **Alembic** (migraciones).

### Justificación de PostgreSQL sobre MongoDB
- **Complementa Qdrant**: Qdrant maneja lo vectorial, PostgreSQL maneja relaciones claras (categoría ↔ documento ↔ chunk ↔ feedback)
- **Transacciones ACID**: Crítico para logs de auditoría y trazabilidad
- **Migraciones**: Alembic da control total del esquema (MongoDB no tiene migraciones nativas)
- **OCI compatible**: Oracle Autonomous Database soporta SQL estándar
- **Madurez**: Ecosistema robusto, amplia documentación

---

## ADR-005: Modelo de Embeddings — Cohere Embed v3

**Fecha**: 2026-06-27
**Estado**: ✅ Aceptada

### Contexto
El agente opera en múltiples idiomas (ES/EN/PT), por lo que se necesita un modelo de embeddings con soporte multilingüe nativo.

### Decisión
**Cohere Embed v3** (`embed-multilingual-v3.0`), 1024 dimensiones.

### Justificación
- Soporte multilingüe nativo (100+ idiomas, incluyendo ES/EN/PT)
- 1024 dimensiones (buen balance calidad/rendimiento)
- Input types diferenciados: `search_document` vs `search_query`
- Complementa Cohere Rerank (misma plataforma, una sola API key)
- Benchmarks competitivos con OpenAI en escenarios multilingües

---

## ADR-006: Estrategia Multi-Proveedor LLM

**Fecha**: 2026-06-27
**Estado**: ✅ Aceptada

### Contexto
Se quiere flexibilidad para cambiar entre proveedores LLM sin modificar código, y poder usar modelos locales para desarrollo.

### Decisión
Implementar una **capa de abstracción multi-proveedor** con soporte para:
- OpenAI (GPT-4o, GPT-4o-mini)
- Google Gemini (2.5 Pro, 2.5 Flash)
- Anthropic Claude (Claude 4, Sonnet)
- Modelos locales vía Ollama (Llama 3, Mistral)

### Justificación
- Flexibilidad para optimizar costo/calidad según el caso de uso
- Fallback automático si un proveedor falla
- Desarrollo local sin costo con Ollama
- Evaluación comparativa de proveedores con LangSmith

---

## ADR-007: Frontend — Next.js

**Fecha**: 2026-06-27
**Estado**: ✅ Aceptada

### Contexto
Se necesita una interfaz web profesional que incluya landing page, chat conversacional y panel de administración.

### Opciones Evaluadas

| Frontend | Pros | Contras |
|----------|------|---------|
| **Next.js** | Profesional, SSR, TypeScript, extensible | Más complejo, requiere Node.js |
| Streamlit | Rápido, Python nativo | Limitado en personalización y diseño |
| Chainlit | Especializado en chatbots | Limitado en personalización |
| Gradio | Rápido para demos ML | No profesional |

### Decisión
**Next.js** (App Router) con TypeScript.

### Justificación
- Resultado profesional y extensible
- App Router con layouts compartidos
- TypeScript para tipado estricto
- Server-side rendering para SEO (landing page)
- Comunicación con backend via REST + WebSocket

---

## ADR-008: Contenedores — Podman

**Fecha**: 2026-06-27
**Estado**: ✅ Aceptada

### Contexto
Se necesita contenerizar la aplicación para desarrollo local y despliegue en OCI.

### Decisión
**Podman** con **Podman Compose** en lugar de Docker.

### Justificación
- Compatible con formatos Docker/OCI
- Rootless por defecto (mejor seguridad)
- Sin daemon (daemonless) — más ligero
- Compatible con OCI Container Registry
- Misma sintaxis que Docker para facilitar la migración
- Requisito del usuario

---

## ADR-009: Reranking — Cohere Rerank

**Fecha**: 2026-06-27
**Estado**: ✅ Aceptada

### Decisión
**Cohere Rerank** para reclasificación de resultados post-búsqueda vectorial.

### Justificación
- Soporte multilingüe nativo
- API simple (enviar query + documentos, recibir scores)
- Misma plataforma que Cohere Embed v3 (una API key)
- Mejora significativa en la precisión del retrieval (vs. solo búsqueda vectorial)

---

## ADR-010: Observabilidad — LangSmith

**Fecha**: 2026-06-27
**Estado**: ✅ Aceptada

### Decisión
**LangSmith** para trazabilidad y debugging del agente.

### Justificación
- Integración nativa con LangGraph
- Trazabilidad visual de cada ejecución del grafo
- Historial de todas las consultas, contextos y respuestas
- Evaluación de calidad con datasets de prueba
- Detección de regresiones en la calidad

---

## ADR-011: Chunking Semántico

**Fecha**: 2026-06-27
**Estado**: ✅ Aceptada

### Decisión
**Chunking semántico** usando embeddings para detectar cambios de tema, con fallback a tamaño máximo.

### Justificación
- Preserva el contexto mejor que la división por tamaño fijo
- Cada chunk contiene una idea completa
- Mejor calidad en el retrieval (fragmentos más coherentes)
- Complementado con metadata del documento original

---

## Plantilla para Nuevas Decisiones

```markdown
## ADR-XXX: [Título]

**Fecha**: YYYY-MM-DD
**Estado**: 🟡 Propuesta | ✅ Aceptada | ❌ Rechazada | 🔄 Sustituida por ADR-YYY

### Contexto
[¿Qué problema se necesita resolver?]

### Opciones Evaluadas
[Tabla comparativa si aplica]

### Decisión
[¿Qué se decidió?]

### Justificación
[¿Por qué esta opción y no las otras?]

### Consecuencias
[¿Qué impacto tiene esta decisión?]
```
