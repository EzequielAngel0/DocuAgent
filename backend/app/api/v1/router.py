"""Router agregador de la API v1.

Mantiene rutas estables consumidas por el frontend:
  /auth/*            autenticación
  /admin/categories  · /admin/documents · /admin/history   (panel admin)
  /chat/ws           WebSocket del chat
  /health            liveness · /health/ready readiness
"""

from fastapi import APIRouter

from app.api.v1.endpoints import auth, categories, chat, documents, feedback, health

api_router = APIRouter()

api_router.include_router(health.router, tags=["Salud"])
api_router.include_router(auth.router, prefix="/auth", tags=["Autenticación"])
api_router.include_router(categories.router, prefix="/admin", tags=["Admin · Categorías"])
api_router.include_router(documents.router, prefix="/admin", tags=["Admin · Documentos"])
api_router.include_router(feedback.router, prefix="/admin", tags=["Admin · Historial"])
api_router.include_router(chat.router, prefix="/chat", tags=["Chat"])
