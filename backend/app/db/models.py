from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy import String, Integer, Boolean, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

class Base(DeclarativeBase):
    pass

class AdminUser(Base):
    __tablename__ = "admin_users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    totp_secret: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    is_totp_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class Category(Base):
    __tablename__ = "categories"

    id: Mapped[str] = mapped_column(String(50), primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    color: Mapped[str] = mapped_column(String(50), nullable=False, default="terracotta")
    icon_name: Mapped[str] = mapped_column(String(50), nullable=False, default="Folder")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relación con Documentos
    documents: Mapped[List["Document"]] = relationship("Document", back_populates="category", cascade="all, delete-orphan")

class Document(Base):
    __tablename__ = "documents"

    id: Mapped[str] = mapped_column(String(50), primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(512), nullable=False)
    category_id: Mapped[str] = mapped_column(String(50), ForeignKey("categories.id", ondelete="CASCADE"), nullable=False)
    chunks_count: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String(20), default="Indexando")  # "Indexando", "Indexado", "Fallo"
    uploaded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relaciones
    category: Mapped["Category"] = relationship("Category", back_populates="documents")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    query: Mapped[str] = mapped_column(String(1024), nullable=False)
    response: Mapped[str] = mapped_column(String(4096), nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    feedback: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)  # "positive", "negative", None
    citations: Mapped[Optional[List[Dict[str, Any]]]] = mapped_column(JSON, nullable=True)  # Lista de dicts
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
