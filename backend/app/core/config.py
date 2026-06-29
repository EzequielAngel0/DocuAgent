"""Configuración central de la aplicación (pydantic-settings).

Carga variables de entorno desde `.env` y expone un objeto `settings`
inmutable usado en todo el backend. Mantener este módulo libre de
dependencias pesadas: lo importan Alembic, scripts y la app.
"""

from pydantic import computed_field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # ------------------------------------------------------------------
    # Entorno
    # ------------------------------------------------------------------
    ENVIRONMENT: str = "development"  # development | staging | production

    @computed_field
    @property
    def IS_PRODUCTION(self) -> bool:
        return self.ENVIRONMENT == "production"

    # ------------------------------------------------------------------
    # API
    # ------------------------------------------------------------------
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    API_PREFIX: str = "/api/v1"
    NEXT_PUBLIC_APP_NAME: str = "DocuAgent"

    # Orígenes permitidos para CORS (coma-separados). En producción es
    # obligatorio fijarlos; en dev se permite localhost por defecto.
    CORS_ALLOWED_ORIGINS: str = ""

    @computed_field
    @property
    def cors_origins(self) -> list[str]:
        raw = [o.strip() for o in self.CORS_ALLOWED_ORIGINS.split(",") if o.strip()]
        if raw:
            return raw
        if not self.IS_PRODUCTION:
            return [
                "http://localhost:3000",
                "http://127.0.0.1:3000",
            ]
        # En producción sin configuración explícita: sin orígenes (deniega).
        return []

    # ------------------------------------------------------------------
    # Observabilidad / logging
    # ------------------------------------------------------------------
    LOG_LEVEL: str = "INFO"
    LOG_JSON: bool = False  # True => salida JSON estructurada (prod)

    # ------------------------------------------------------------------
    # PostgreSQL
    # ------------------------------------------------------------------
    DB_USER: str = "docuagent_app"
    DB_PASSWORD: str = "change_me_local_dev"
    DB_HOST: str = "postgres"
    DB_PORT: int = 5432
    DB_NAME: str = "docuagent"

    @computed_field
    @property
    def DATABASE_URL(self) -> str:
        return (
            f"postgresql+asyncpg://{self.DB_USER}:{self.DB_PASSWORD}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
        )

    # ------------------------------------------------------------------
    # Qdrant
    # ------------------------------------------------------------------
    QDRANT_HOST: str = "qdrant"
    QDRANT_PORT: int = 6333
    QDRANT_API_KEY: str = ""
    QDRANT_COLLECTION: str = "documents"
    QDRANT_VECTOR_SIZE: int = 1024  # Cohere embed-multilingual-v3.0

    # ------------------------------------------------------------------
    # Cohere (embeddings + reranking)
    # ------------------------------------------------------------------
    COHERE_API_KEY: str = ""
    COHERE_EMBED_MODEL: str = "embed-multilingual-v3.0"
    COHERE_RERANK_MODEL: str = "rerank-multilingual-v3.0"

    # ------------------------------------------------------------------
    # LLM — proveedor activo y cadena de fallback
    # ------------------------------------------------------------------
    LLM_PROVIDER: str = "gemini"  # openai | gemini | anthropic | ollama
    LLM_MODEL: str = "gemini-1.5-flash"  # modelo del proveedor ACTIVO
    LLM_TEMPERATURE: float = 0.1
    LLM_MAX_TOKENS: int = 2048
    # Orden de respaldo si el proveedor activo falla (coma-separado).
    LLM_FALLBACK_CHAIN: str = "openai,gemini,anthropic,ollama"

    @computed_field
    @property
    def fallback_chain(self) -> list[str]:
        seen: list[str] = []
        # El proveedor activo va primero, luego la cadena (sin duplicados).
        for name in [self.LLM_PROVIDER, *self.LLM_FALLBACK_CHAIN.split(",")]:
            name = name.strip().lower()
            if name and name not in seen:
                seen.append(name)
        return seen

    # Claves y modelos por proveedor (modelos usados como fallback).
    OPENAI_API_KEY: str | None = None
    OPENAI_MODEL: str = "gpt-4o-mini"
    GEMINI_API_KEY: str | None = None
    GEMINI_MODEL: str = "gemini-1.5-flash"
    ANTHROPIC_API_KEY: str | None = None
    ANTHROPIC_MODEL: str = "claude-haiku-4-5-20251001"
    OLLAMA_BASE_URL: str = "http://ollama:11434"
    OLLAMA_MODEL: str = "llama3.1:8b"

    # ------------------------------------------------------------------
    # LangSmith (observabilidad de cadenas)
    # ------------------------------------------------------------------
    LANGCHAIN_TRACING_V2: bool = False
    LANGCHAIN_API_KEY: str | None = None
    LANGCHAIN_PROJECT: str = "docuagent-staging"

    # ------------------------------------------------------------------
    # Administrador semilla (se crea/sincroniza al arrancar)
    # ------------------------------------------------------------------
    ADMIN_EMAIL: str = "admin@empresa.com"
    ADMIN_PASSWORD: str = "change_me_admin"
    ADMIN_TOTP_SECRET: str = "JBSWY3DPEHPK3PXP"

    # ------------------------------------------------------------------
    # JWT
    # ------------------------------------------------------------------
    JWT_SECRET_KEY: str = "change_me_64_chars_secret_for_local_development_only_xxxxxxxx"
    JWT_ACCESS_EXPIRE_MINUTES: int = 15
    JWT_REFRESH_EXPIRE_DAYS: int = 7
    JWT_ISSUER: str = "docuagent"
    JWT_AUDIENCE: str = "docuagent-admin"

    # Rate limiting (slowapi) en endpoints sensibles
    RATE_LIMIT_LOGIN: str = "5/15minute"
    RATE_LIMIT_2FA: str = "10/15minute"
    # Rate limit del WebSocket de chat (mensajes por minuto por IP)
    RATE_LIMIT_CHAT_PER_MIN: int = 20
    # Dominio de la cookie de sesión (".angelezequiel.dev" comparte subdominios;
    # vacío = host-only, válido para localhost en desarrollo)
    COOKIE_DOMAIN: str = ""

    # Hosts permitidos (TrustedHostMiddleware en prod; vacío = sin restricción)
    ALLOWED_HOSTS: str = ""

    # ------------------------------------------------------------------
    # Cloudflare Turnstile (anti-bot)
    # ------------------------------------------------------------------
    TURNSTILE_SITE_KEY: str = ""
    TURNSTILE_SECRET_KEY: str = ""

    # ------------------------------------------------------------------
    # Parámetros RAG
    # ------------------------------------------------------------------
    RETRIEVAL_TOP_K: int = 20
    RERANK_TOP_N: int = 5
    CONFIDENCE_THRESHOLD: float = 0.3

    # ------------------------------------------------------------------
    # Chunking (ingesta)
    # ------------------------------------------------------------------
    CHUNK_MIN_SIZE: int = 200
    CHUNK_MAX_SIZE: int = 1500
    CHUNK_OVERLAP: int = 100

    # ------------------------------------------------------------------
    # Almacenamiento de uploads
    # ------------------------------------------------------------------
    UPLOAD_DIR: str = "./uploads"
    MAX_FILE_SIZE_MB: int = 50

    @computed_field
    @property
    def allowed_hosts(self) -> list[str]:
        return [h.strip() for h in self.ALLOWED_HOSTS.split(",") if h.strip()]

    @model_validator(mode="after")
    def _validate_production_secrets(self):
        """Falla rápido si producción arranca con secretos inseguros/incompletos."""
        if self.ENVIRONMENT == "production":
            insecure: list[str] = []
            if "change_me" in self.JWT_SECRET_KEY or len(self.JWT_SECRET_KEY) < 32:
                insecure.append("JWT_SECRET_KEY")
            if self.ADMIN_PASSWORD in ("", "admin", "change_me_admin"):
                insecure.append("ADMIN_PASSWORD")
            if not self.COHERE_API_KEY:
                insecure.append("COHERE_API_KEY")
            if not self.CORS_ALLOWED_ORIGINS:
                insecure.append("CORS_ALLOWED_ORIGINS")
            if insecure:
                raise ValueError(
                    "Configuración insegura/incompleta en producción: " + ", ".join(insecure)
                )
        return self


settings = Settings()
