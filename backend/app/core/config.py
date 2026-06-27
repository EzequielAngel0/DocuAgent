from typing import Optional
from pydantic import Field, computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # Entorno
    ENVIRONMENT: str = "development"

    # PostgreSQL
    DB_USER: str = "docuagent_app"
    DB_PASSWORD: str = "a_i=a5*BD83p|WfP"
    DB_HOST: str = "postgres"
    DB_PORT: int = 5432
    DB_NAME: str = "docuagent"

    @computed_field
    @property
    def DATABASE_URL(self) -> str:
        return f"postgresql+asyncpg://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

    # Qdrant
    QDRANT_HOST: str = "qdrant"
    QDRANT_PORT: int = 6333
    QDRANT_API_KEY: str = ""
    QDRANT_COLLECTION: str = "documents"

    # Cohere
    COHERE_API_KEY: str = ""
    COHERE_EMBED_MODEL: str = "embed-multilingual-v3.0"
    COHERE_RERANK_MODEL: str = "rerank-multilingual-v3.0"

    # LLM
    LLM_PROVIDER: str = "gemini"  # openai | gemini | ollama
    LLM_MODEL: str = "gemini-1.5-flash"
    LLM_TEMPERATURE: float = 0.1
    LLM_MAX_TOKENS: int = 2048

    # LLM Keys
    OPENAI_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None
    ANTHROPIC_API_KEY: Optional[str] = None
    OLLAMA_BASE_URL: str = "http://ollama:11434"
    OLLAMA_MODEL: str = "llama3.1:8b"

    # LangSmith Observabilidad
    LANGCHAIN_TRACING_V2: bool = False
    LANGCHAIN_API_KEY: Optional[str] = None
    LANGCHAIN_PROJECT: str = "docuagent-staging"

    # JWT Autenticación
    JWT_SECRET_KEY: str = "cambiar_por_un_secreto_super_seguro_de_64_caracteres_por_defecto"
    JWT_ACCESS_EXPIRE_MINUTES: int = 15
    JWT_REFRESH_EXPIRE_DAYS: int = 7

    # Cloudflare Turnstile
    TURNSTILE_SITE_KEY: str = ""
    TURNSTILE_SECRET_KEY: str = ""

    # Parámetros RAG
    RETRIEVAL_TOP_K: int = 20
    RERANK_TOP_N: int = 5
    CONFIDENCE_THRESHOLD: float = 0.3

settings = Settings()
