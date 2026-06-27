# 🐍 Arquitectura del Backend

## Visión General

El backend está construido con **FastAPI** (API Gateway) y **LangGraph** (orquestación del agente RAG), siguiendo una arquitectura modular por capas.

## Estructura del Backend

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                     # Punto de entrada FastAPI
│   ├── config.py                   # Configuración centralizada (Pydantic Settings)
│   │
│   ├── api/                        # Capa de API (endpoints)
│   │   ├── __init__.py
│   │   ├── deps.py                 # Dependencias compartidas (DB session, etc.)
│   │   ├── v1/
│   │   │   ├── __init__.py
│   │   │   ├── router.py           # Router principal v1
│   │   │   ├── chat.py             # POST /chat, WebSocket /chat/ws
│   │   │   ├── documents.py        # CRUD de documentos
│   │   │   ├── categories.py       # CRUD de categorías
│   │   │   ├── feedback.py         # Feedback de respuestas
│   │   │   └── health.py           # Health check, métricas
│   │   └── middleware/
│   │       ├── __init__.py
│   │       ├── cors.py             # Configuración CORS
│   │       ├── error_handler.py    # Manejo global de errores
│   │       └── request_logging.py  # Logging de requests
│   │
│   ├── agent/                      # Capa de Agente (LangGraph)
│   │   ├── __init__.py
│   │   ├── graph.py                # Definición del grafo principal
│   │   ├── state.py                # Estado del agente (TypedDict)
│   │   ├── nodes/
│   │   │   ├── __init__.py
│   │   │   ├── query_analyzer.py   # Análisis de la pregunta
│   │   │   ├── retriever.py        # Búsqueda semántica
│   │   │   ├── reranker.py         # Reclasificación con Cohere
│   │   │   ├── context_builder.py  # Ensamblaje de contexto
│   │   │   ├── generator.py        # Generación de respuesta
│   │   │   └── validator.py        # Validación anti-alucinación
│   │   └── prompts/
│   │       ├── __init__.py
│   │       ├── system.py           # System prompts
│   │       ├── rag.py              # Prompt template para RAG
│   │       └── fallback.py         # Prompts de fallback
│   │
│   ├── rag/                        # Pipeline RAG
│   │   ├── __init__.py
│   │   ├── embeddings.py           # Servicio de embeddings (Cohere)
│   │   ├── vector_store.py         # Cliente Qdrant
│   │   ├── reranker.py             # Cliente Cohere Rerank
│   │   └── retrieval.py            # Lógica de retrieval combinada
│   │
│   ├── ingestion/                  # Pipeline de Ingesta
│   │   ├── __init__.py
│   │   ├── pipeline.py             # Orquestador de ingesta
│   │   ├── extractors/
│   │   │   ├── __init__.py
│   │   │   ├── base.py             # Interfaz base del extractor
│   │   │   ├── pdf.py              # Extractor de PDF
│   │   │   ├── docx.py             # Extractor de Word
│   │   │   ├── xlsx.py             # Extractor de Excel
│   │   │   ├── markdown.py         # Extractor de Markdown
│   │   │   ├── csv_extractor.py    # Extractor de CSV
│   │   │   ├── json_extractor.py   # Extractor de JSON
│   │   │   └── text.py             # Extractor de texto plano
│   │   ├── cleaner.py              # Limpieza de texto
│   │   └── chunker.py              # Chunking semántico
│   │
│   ├── providers/                  # Proveedores LLM (multi-proveedor)
│   │   ├── __init__.py
│   │   ├── base.py                 # Interfaz base del proveedor
│   │   ├── openai.py               # Proveedor OpenAI
│   │   ├── gemini.py               # Proveedor Google Gemini
│   │   ├── anthropic.py            # Proveedor Anthropic Claude
│   │   ├── ollama.py               # Proveedor local (Ollama)
│   │   └── factory.py              # Factory pattern para selección
│   │
│   ├── models/                     # Modelos de datos
│   │   ├── __init__.py
│   │   ├── database.py             # Modelos SQLAlchemy (ORM)
│   │   ├── schemas.py              # Schemas Pydantic (API)
│   │   └── enums.py                # Enumeraciones
│   │
│   ├── services/                   # Lógica de negocio
│   │   ├── __init__.py
│   │   ├── document_service.py     # Gestión de documentos
│   │   ├── category_service.py     # Gestión de categorías
│   │   ├── chat_service.py         # Gestión de sesiones de chat
│   │   └── feedback_service.py     # Gestión de feedback
│   │
│   ├── db/                         # Base de datos
│   │   ├── __init__.py
│   │   ├── session.py              # SessionLocal, engine
│   │   └── base.py                 # Base declarativa SQLAlchemy
│   │
│   └── core/                       # Utilidades transversales
│       ├── __init__.py
│       ├── logging.py              # Configuración de logging
│       ├── exceptions.py           # Excepciones personalizadas
│       └── utils.py                # Funciones de utilidad
│
├── alembic/                        # Migraciones de BD
│   ├── env.py
│   ├── alembic.ini
│   └── versions/
│
├── tests/                          # Tests
│   ├── __init__.py
│   ├── conftest.py                 # Fixtures compartidas
│   ├── unit/
│   │   ├── test_extractors.py
│   │   ├── test_chunker.py
│   │   ├── test_cleaner.py
│   │   ├── test_providers.py
│   │   └── test_services.py
│   ├── integration/
│   │   ├── test_rag_pipeline.py
│   │   ├── test_agent_graph.py
│   │   └── test_api_endpoints.py
│   └── e2e/
│       └── test_full_flow.py
│
├── requirements.txt                # Dependencias de producción
├── requirements-dev.txt            # Dependencias de desarrollo
├── pyproject.toml                  # Configuración del proyecto Python
└── Containerfile                   # Imagen de contenedor (Podman)
```

## Dependencias Principales

```
# requirements.txt (estimado)

# API Framework
fastapi>=0.115.0
uvicorn[standard]>=0.30.0
python-multipart>=0.0.9
websockets>=12.0

# LangGraph / LangChain
langgraph>=0.2.0
langchain-core>=0.3.0
langchain-cohere>=0.3.0
langchain-openai>=0.2.0
langchain-google-genai>=2.0.0
langchain-anthropic>=0.2.0
langchain-community>=0.3.0
langsmith>=0.1.0

# Embeddings & Vectores
cohere>=5.0.0
qdrant-client>=1.10.0

# Base de Datos
sqlalchemy[asyncio]>=2.0.0
asyncpg>=0.29.0
alembic>=1.13.0

# Procesamiento de Documentos
pymupdf>=1.24.0            # PDF
python-docx>=1.1.0         # Word
openpyxl>=3.1.0             # Excel
markdown>=3.6               # Markdown
beautifulsoup4>=4.12.0      # HTML cleanup

# Utilidades
pydantic>=2.9.0
pydantic-settings>=2.5.0
python-dotenv>=1.0.0
httpx>=0.27.0               # HTTP client async
structlog>=24.0.0           # Structured logging

# Dev
pytest>=8.0.0
pytest-asyncio>=0.24.0
pytest-cov>=5.0.0
ruff>=0.6.0                 # Linter + formatter
mypy>=1.11.0                # Type checker
```

## Patrones de Diseño

### 1. Factory Pattern (Proveedores LLM)

```python
# providers/factory.py
class LLMProviderFactory:
    """Crea el proveedor LLM correcto según la configuración."""

    _providers = {
        "openai": OpenAIProvider,
        "gemini": GeminiProvider,
        "anthropic": AnthropicProvider,
        "ollama": OllamaProvider,
    }

    @classmethod
    def create(cls, provider_name: str, **kwargs) -> BaseLLMProvider:
        provider_class = cls._providers.get(provider_name)
        if not provider_class:
            raise ValueError(f"Proveedor desconocido: {provider_name}")
        return provider_class(**kwargs)
```

### 2. Strategy Pattern (Extractores)

```python
# ingestion/extractors/base.py
from abc import ABC, abstractmethod

class BaseExtractor(ABC):
    """Interfaz base para extractores de documentos."""

    @abstractmethod
    async def extract(self, file_path: str) -> ExtractedContent:
        """Extrae texto de un archivo."""
        ...

    @classmethod
    def supports(cls, mime_type: str) -> bool:
        """Indica si el extractor soporta este tipo de archivo."""
        ...
```

### 3. State Machine (LangGraph Agent)

```python
# agent/state.py
from typing import TypedDict, Annotated
from langgraph.graph import add_messages

class AgentState(TypedDict):
    """Estado que fluye a través del grafo del agente."""
    messages: Annotated[list, add_messages]  # Historial conversacional
    query: str                                # Pregunta original
    query_embedding: list[float]              # Vector de la pregunta
    retrieved_chunks: list[dict]              # Chunks recuperados
    reranked_chunks: list[dict]               # Chunks post-reranking
    context: str                              # Contexto ensamblado
    response: str                             # Respuesta generada
    sources: list[dict]                       # Fuentes citadas
    confidence: float                         # Confianza en la respuesta
    needs_fallback: bool                      # Si necesita fallback
```

### 4. Repository Pattern (Servicios)

```python
# services/document_service.py
class DocumentService:
    """Lógica de negocio para documentos, desacoplada del ORM."""

    def __init__(self, db: AsyncSession, vector_store: QdrantClient):
        self.db = db
        self.vector_store = vector_store

    async def create_document(self, data: DocumentCreate) -> Document:
        ...

    async def search_documents(self, query: str, category: str | None) -> list:
        ...
```

## Configuración

La configuración se centraliza con **Pydantic Settings**, cargando desde variables de entorno y `.env`:

```python
# config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # API
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    api_prefix: str = "/api/v1"

    # Database
    database_url: str = "postgresql+asyncpg://user:pass@localhost:5432/docuagent"

    # Qdrant
    qdrant_host: str = "localhost"
    qdrant_port: int = 6333
    qdrant_collection: str = "documents"

    # Cohere
    cohere_api_key: str
    cohere_embed_model: str = "embed-multilingual-v3.0"
    cohere_rerank_model: str = "rerank-multilingual-v3.0"

    # LLM Provider
    llm_provider: str = "openai"  # openai | gemini | anthropic | ollama
    openai_api_key: str | None = None
    gemini_api_key: str | None = None
    anthropic_api_key: str | None = None
    ollama_base_url: str = "http://localhost:11434"
    llm_model: str = "gpt-4o-mini"
    llm_temperature: float = 0.1

    # RAG
    retrieval_top_k: int = 20
    rerank_top_n: int = 5
    confidence_threshold: float = 0.3

    # LangSmith
    langchain_tracing_v2: bool = True
    langchain_api_key: str | None = None
    langchain_project: str = "docuagent"

    # Storage
    upload_dir: str = "./uploads"

    class Config:
        env_file = ".env"
        case_sensitive = False
```

## Manejo de Errores

```python
# core/exceptions.py
class DocuAgentError(Exception):
    """Base exception para DocuAgent."""

class DocumentNotFoundError(DocuAgentError):
    """Documento no encontrado."""

class ExtractionError(DocuAgentError):
    """Error en la extracción de texto."""

class EmbeddingError(DocuAgentError):
    """Error al generar embeddings."""

class LLMProviderError(DocuAgentError):
    """Error del proveedor LLM."""

class RetrievalError(DocuAgentError):
    """Error en la recuperación de documentos."""
```

## Logging Estructurado

```python
# core/logging.py
import structlog

structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer(),
    ],
    logger_factory=structlog.PrintLoggerFactory(),
)
```
