# 📋 Schemas de la API (Pydantic)

## Request Schemas

### Chat

```python
class ChatRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=2000, description="Pregunta del usuario")
    session_id: str | None = Field(None, description="ID de sesión para mantener historial")
    category_filter: str | None = Field(None, description="Filtrar por categoría (slug)")
    language: str | None = Field(None, description="Idioma preferido (es, en, pt)")
```

### Documentos

```python
class DocumentUpload(BaseModel):
    """Se recibe como form-data, no JSON."""
    file: UploadFile  # El archivo
    category_id: UUID
    author: str | None = None
    version: str | None = None
    document_date: date | None = None
    custom_fields: dict | None = None

class DocumentUpdate(BaseModel):
    category_id: UUID | None = None
    author: str | None = None
    version: str | None = None
```

### Categorías

```python
class CategoryCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    slug: str = Field(..., min_length=1, max_length=100, pattern=r"^[a-z0-9-]+$")
    description: str | None = None
    color: str | None = Field(None, pattern=r"^#[0-9a-fA-F]{6}$")
    icon: str | None = None

class CategoryUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    color: str | None = None
    icon: str | None = None
    is_active: bool | None = None
```

### Feedback

```python
class FeedbackCreate(BaseModel):
    message_id: UUID
    is_positive: bool
    comment: str | None = Field(None, max_length=500)
```

## Response Schemas

### Chat

```python
class SourceResponse(BaseModel):
    index: int
    filename: str
    section_title: str | None
    page_number: int | None
    category: str
    rerank_score: float
    snippet: str

class ChatMessageResponse(BaseModel):
    role: Literal["assistant"]
    content: str
    sources: list[SourceResponse]
    confidence: float
    is_fallback: bool
    response_time_ms: float
    provider: str
    model: str

class ChatResponse(BaseModel):
    message: ChatMessageResponse
    session_id: str
```

### Documentos

```python
class CategoryBrief(BaseModel):
    id: UUID
    name: str
    slug: str
    color: str | None

class DocumentResponse(BaseModel):
    id: UUID
    original_filename: str
    mime_type: str
    file_size: int
    category: CategoryBrief
    status: Literal["pending", "processing", "indexed", "error"]
    language: str | None
    chunk_count: int | None
    author: str | None
    version: str | None
    created_at: datetime
    updated_at: datetime
    indexed_at: datetime | None

class DocumentListResponse(BaseModel):
    data: list[DocumentResponse]
    pagination: PaginationResponse
```

### Categorías

```python
class CategoryResponse(BaseModel):
    id: UUID
    name: str
    slug: str
    description: str | None
    color: str | None
    icon: str | None
    is_active: bool
    document_count: int
    created_at: datetime
    updated_at: datetime
```

### Generales

```python
class PaginationResponse(BaseModel):
    page: int
    page_size: int
    total: int
    total_pages: int

class ErrorResponse(BaseModel):
    error: ErrorDetail

class ErrorDetail(BaseModel):
    code: str
    message: str
    details: dict | None = None

class HealthResponse(BaseModel):
    status: Literal["healthy", "degraded", "unhealthy"]
    services: dict[str, ServiceHealth]
    timestamp: datetime

class ServiceHealth(BaseModel):
    status: Literal["up", "down"]
    latency_ms: float | None = None
    details: dict | None = None
```
