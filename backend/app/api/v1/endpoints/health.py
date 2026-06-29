"""Endpoints de salud: liveness (barato) y readiness (chequea dependencias).

El healthcheck del contenedor usa `/health` (liveness): debe responder rápido
sin tocar la red. `/health/ready` valida PostgreSQL y Qdrant para orquestación.
"""

import asyncio

from fastapi import APIRouter
from sqlalchemy import text

from app import __version__
from app.core.config import settings
from app.db.session import SessionLocal
from app.models import HealthResponse
from app.rag.vector_store import vector_store

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def liveness() -> HealthResponse:
    return HealthResponse(
        status="ok",
        environment=settings.ENVIRONMENT,
        version=__version__,
        checks={},
    )


@router.get("/health/ready", response_model=HealthResponse)
async def readiness() -> HealthResponse:
    checks: dict[str, str] = {}

    try:
        async with SessionLocal() as db:
            await db.execute(text("SELECT 1"))
        checks["database"] = "ok"
    except Exception:  # noqa: BLE001
        checks["database"] = "error"

    try:
        await asyncio.to_thread(vector_store.client.get_collections)
        checks["qdrant"] = "ok"
    except Exception:  # noqa: BLE001
        checks["qdrant"] = "error"

    status = "ok" if all(v == "ok" for v in checks.values()) else "degraded"
    return HealthResponse(
        status=status,
        environment=settings.ENVIRONMENT,
        version=__version__,
        checks=checks,
    )
