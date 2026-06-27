"""Punto de entrada de la API DocuAgent (FastAPI)."""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import __version__
from app.api.v1.router import api_router
from app.core.config import settings
from app.core.logging import configure_logging, get_logger
from app.db.session import SessionLocal
from app.rag.vector_store import vector_store

configure_logging()
logger = get_logger("docuagent")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Inicializar la colección vectorial en Qdrant (no falla el arranque).
    vector_store.ensure_collection()

    # Crear/sincronizar el administrador semilla.
    try:
        from app.api.v1.endpoints.auth import ensure_default_admin

        async with SessionLocal() as db:
            await ensure_default_admin(db)
    except Exception as exc:  # noqa: BLE001
        logger.warning("admin_seed_skipped", error=str(exc))

    logger.info("app_started", environment=settings.ENVIRONMENT, version=__version__)
    yield


app = FastAPI(
    title=settings.NEXT_PUBLIC_APP_NAME,
    version=__version__,
    openapi_url=f"{settings.API_PREFIX}/openapi.json",
    docs_url=f"{settings.API_PREFIX}/docs",
    redoc_url=f"{settings.API_PREFIX}/redoc",
    lifespan=lifespan,
)

# CORS restringido a los orígenes configurados (ver CORS_ALLOWED_ORIGINS).
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_PREFIX)


@app.get("/")
def read_root():
    return {
        "status": "online",
        "app_name": settings.NEXT_PUBLIC_APP_NAME,
        "environment": settings.ENVIRONMENT,
        "version": __version__,
        "docs": f"{settings.API_PREFIX}/docs",
    }
