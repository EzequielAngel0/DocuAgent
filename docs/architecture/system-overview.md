# 🏗️ Arquitectura del Sistema — Visión General

## Diagrama de Alto Nivel

```mermaid
graph TB
    subgraph "Frontend - Next.js"
        LP[Landing Page]
        CI[Chat Interface]
        UP[Upload Panel]
        AP[Admin Panel]
    end

    subgraph "API Gateway - FastAPI"
        CE[Chat Endpoint]
        DE[Documents Endpoint]
        CAT[Categories Endpoint]
        HE[Health/Metrics]
    end

    subgraph "Agent Core - LangGraph"
        QA[Query Analyzer]
        RT[Retriever]
        RR[Reranker]
        CX[Context Assembler]
        GN[Response Generator]
        VL[Response Validator]
    end

    subgraph "Data Layer"
        QD[(Qdrant - Vectors)]
        PG[(PostgreSQL - Metadata)]
        FS[File Storage]
    end

    subgraph "External Services"
        CE3[Cohere Embed v3]
        CR[Cohere Rerank]
        LLM[LLM Provider]
        LS[LangSmith]
    end

    subgraph "Ingestion Pipeline"
        EX[Extractors]
        CL[Text Cleaner]
        CH[Chunker]
        IX[Indexer]
    end

    CI --> CE
    UP --> DE
    AP --> CAT

    CE --> QA
    QA --> RT
    RT --> RR
    RR --> CX
    CX --> GN
    GN --> VL
    VL --> CE

    RT --> QD
    RT --> CE3
    RR --> CR
    GN --> LLM
    QA --> LS
    GN --> LS

    DE --> EX
    EX --> CL
    CL --> CH
    CH --> IX
    IX --> QD
    IX --> PG
    DE --> FS

    style QD fill:#e74c3c,color:#fff
    style PG fill:#3498db,color:#fff
    style LLM fill:#9b59b6,color:#fff
    style LS fill:#f39c12,color:#fff
```

## Capas de la Arquitectura

### 1. Capa de Presentación (Frontend)

| Componente | Tecnología | Responsabilidad |
|------------|-----------|-----------------|
| Landing Page | Next.js (SSR) | Página de presentación del proyecto |
| Chat Interface | Next.js (CSR) | Interfaz conversacional con el agente |
| Upload Panel | Next.js (CSR) | Carga y gestión de documentos |
| Admin Panel | Next.js (CSR) | Administración de categorías y documentos |

### 2. Capa de API (Backend Gateway)

| Componente | Tecnología | Responsabilidad |
|------------|-----------|-----------------|
| Chat API | FastAPI + WebSocket | Recibe preguntas, streaming de respuestas |
| Documents API | FastAPI REST | CRUD de documentos, carga de archivos |
| Categories API | FastAPI REST | CRUD de categorías dinámicas |
| Health/Metrics | FastAPI | Health checks, métricas básicas |

### 3. Capa de Agente (Orquestación)

| Componente | Tecnología | Responsabilidad |
|------------|-----------|-----------------|
| Query Analyzer | LangGraph node | Analiza la intención de la pregunta |
| Retriever | LangGraph node | Búsqueda semántica en Qdrant |
| Reranker | LangGraph node | Reclasificación con Cohere Rerank |
| Context Assembler | LangGraph node | Ensamblaje del contexto para el LLM |
| Response Generator | LangGraph node | Generación de respuesta con LLM |
| Response Validator | LangGraph node | Validación anti-alucinación |

### 4. Capa de Datos

| Componente | Tecnología | Responsabilidad |
|------------|-----------|-----------------|
| Vector Store | Qdrant | Embeddings y búsqueda semántica |
| Relational DB | PostgreSQL | Metadatos, logs, categorías, feedback |
| File Storage | Local / OCI Object Storage | Documentos originales |

### 5. Capa de Ingesta

| Componente | Tecnología | Responsabilidad |
|------------|-----------|-----------------|
| Extractors | PyMuPDF, python-docx, openpyxl, etc. | Extracción de texto por formato |
| Text Cleaner | Custom | Limpieza de ruido y normalización |
| Chunker | LangChain text splitters + custom | División semántica del texto |
| Indexer | Cohere Embed v3 + Qdrant client | Vectorización e indexación |

### 6. Servicios Externos

| Servicio | Proveedor | Propósito |
|----------|-----------|-----------|
| Embeddings | Cohere | Vectorización de textos (multilingual) |
| Reranking | Cohere | Reclasificación de resultados |
| LLM | Multi (OpenAI/Gemini/Claude/Ollama) | Generación de respuestas |
| Observabilidad | LangSmith | Trazabilidad y debugging |

## Flujos Principales

### Flujo 1: Ingesta de Documentos

```mermaid
sequenceDiagram
    actor U as Admin/Usuario
    participant API as FastAPI
    participant FS as File Storage
    participant EX as Extractor
    participant CL as Cleaner
    participant CH as Chunker
    participant CE as Cohere Embed
    participant QD as Qdrant
    participant PG as PostgreSQL

    U->>API: POST /api/v1/documents (upload)
    API->>FS: Guardar archivo original
    API->>PG: Crear registro de documento (metadatos)
    API->>EX: Extraer texto según formato
    EX->>CL: Texto crudo
    CL->>CH: Texto limpio
    CH->>CE: Chunks de texto
    CE->>QD: Vectores + metadatos
    CH->>PG: Registrar chunks con referencias
    API-->>U: 201 Created (documento indexado)
```

### Flujo 2: Consulta del Agente (RAG)

```mermaid
sequenceDiagram
    actor C as Colaborador
    participant FE as Frontend
    participant API as FastAPI
    participant AG as LangGraph Agent
    participant CE as Cohere Embed
    participant QD as Qdrant
    participant CR as Cohere Rerank
    participant LLM as LLM Provider
    participant LS as LangSmith

    C->>FE: Escribe pregunta
    FE->>API: POST /api/v1/chat (WebSocket)
    API->>AG: Ejecutar grafo
    AG->>LS: Trace: inicio de ejecución
    AG->>CE: Embedding de la pregunta
    CE-->>AG: Vector de la query
    AG->>QD: Búsqueda semántica (top 20)
    QD-->>AG: 20 chunks candidatos
    AG->>CR: Reranking (query + 20 chunks)
    CR-->>AG: Top 5 chunks rerankeados
    AG->>AG: Ensamblar contexto + prompt
    AG->>LLM: Generar respuesta
    LLM-->>AG: Respuesta con citaciones
    AG->>AG: Validar (anti-alucinación)
    AG->>LS: Trace: fin de ejecución
    AG-->>API: Respuesta final
    API-->>FE: Stream de respuesta
    FE-->>C: Muestra respuesta + fuentes
```

## Principios de Diseño

1. **Separación de responsabilidades** — Cada capa tiene una función clara y definida
2. **Configurabilidad** — Las categorías, proveedores LLM y parámetros son configurables sin cambiar código
3. **Trazabilidad** — Cada consulta es rastreable desde la pregunta hasta la fuente del documento
4. **Fault tolerance** — Fallbacks en cada capa (LLM, reranking, búsqueda)
5. **Container-first** — Diseñado para correr en contenedores desde el inicio
6. **API-first** — El backend expone todo vía API REST/WebSocket, el frontend es intercambiable

## Comunicación entre Componentes

| De → A | Protocolo | Formato |
|--------|-----------|---------|
| Frontend → Backend | HTTP REST / WebSocket | JSON |
| Backend → Qdrant | HTTP REST / gRPC | JSON / Protobuf |
| Backend → PostgreSQL | TCP (SQLAlchemy) | SQL |
| Backend → Cohere | HTTPS REST | JSON |
| Backend → LLM Providers | HTTPS REST | JSON |
| Backend → LangSmith | HTTPS REST | JSON |
| Backend → File Storage | Filesystem / OCI SDK | Binary |
