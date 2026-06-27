import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.endpoints import auth, admin, chat
from app.services.rag_pipeline import create_collection_if_not_exists

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Inicializar la colección vectorial en Qdrant
    create_collection_if_not_exists()
    yield

app = FastAPI(
    title=settings.NEXT_PUBLIC_APP_NAME,
    openapi_url=f"{settings.API_PREFIX}/openapi.json",
    docs_url=f"{settings.API_PREFIX}/docs",
    redoc_url=f"{settings.API_PREFIX}/redoc",
    lifespan=lifespan
)

# Configurar middleware CORS
# Permitir todos los orígenes en staging para dar soporte al túnel de Cloudflare
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar Routers de la API v1
app.include_router(auth.router, prefix=f"{settings.API_PREFIX}/auth", tags=["Autenticación"])
app.include_router(admin.router, prefix=f"{settings.API_PREFIX}/admin", tags=["Administración"])
app.include_router(chat.router, prefix=f"{settings.API_PREFIX}/chat", tags=["Chat"])

@app.get("/")
def read_root():
    return {
        "status": "online",
        "app_name": settings.NEXT_PUBLIC_APP_NAME,
        "environment": settings.ENVIRONMENT
    }
