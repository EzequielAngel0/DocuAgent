"""Esquemas Pydantic (contrato de la API REST/WebSocket).

Separados de los modelos ORM: estos definen lo que entra y sale por HTTP.
"""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, EmailStr, Field


# ----------------------------------------------------------------------
# Autenticación
# ----------------------------------------------------------------------
class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    turnstile_token: str | None = None


class Verify2FARequest(BaseModel):
    email: EmailStr
    code: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    is_totp_enabled: bool


class Setup2FAResponse(BaseModel):
    secret: str
    qr_code_base64: str


# ----------------------------------------------------------------------
# Categorías
# ----------------------------------------------------------------------
class CategoryCreate(BaseModel):
    name: str = Field(..., max_length=100)
    slug: str = Field(..., max_length=100)
    color: str = Field("terracotta", max_length=50)
    icon_name: str = Field("Folder", max_length=50)


class CategoryUpdate(BaseModel):
    name: str | None = Field(None, max_length=100)
    slug: str | None = Field(None, max_length=100)
    color: str | None = Field(None, max_length=50)
    icon_name: str | None = Field(None, max_length=50)


class CategoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    slug: str
    color: str
    icon_name: str
    created_at: datetime


# ----------------------------------------------------------------------
# Documentos
# ----------------------------------------------------------------------
class DocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    file_path: str
    category_id: str
    chunks_count: int
    status: str
    uploaded_at: datetime


class ChunkInspectorResponse(BaseModel):
    id: str
    content: str
    page: int
    category: str
    document_name: str
    vector: list[float] | None = None


# ----------------------------------------------------------------------
# Logs / feedback
# ----------------------------------------------------------------------
class FeedbackUpdateRequest(BaseModel):
    feedback: str = Field(..., pattern="^(positive|negative|none)$")


class AuditLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    query: str
    response: str
    confidence: float
    category: str
    feedback: str | None = None
    citations: list[dict[str, Any]] | None = None
    created_at: datetime


# ----------------------------------------------------------------------
# Salud
# ----------------------------------------------------------------------
class HealthResponse(BaseModel):
    status: str
    environment: str
    version: str
    checks: dict[str, str]
