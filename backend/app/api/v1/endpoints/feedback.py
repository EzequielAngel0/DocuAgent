"""Historial de consultas (auditoría) y registro de feedback 👍/👎."""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import AdminUser, AuditLog, AuditLogResponse, FeedbackUpdateRequest

router = APIRouter()


@router.get("/history", response_model=List[AuditLogResponse])
async def get_history(
    search: Optional[str] = None,
    category: Optional[str] = None,
    rating: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user),
):
    stmt = select(AuditLog)

    if search:
        stmt = stmt.where(
            AuditLog.query.icontains(search) | AuditLog.response.icontains(search)
        )
    if category:
        stmt = stmt.where(AuditLog.category == category)
    if rating == "positive":
        stmt = stmt.where(AuditLog.feedback == "positive")
    elif rating == "negative":
        stmt = stmt.where(AuditLog.feedback == "negative")
    elif rating == "unrated":
        stmt = stmt.where(AuditLog.feedback.is_(None))

    stmt = stmt.order_by(AuditLog.created_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("/history/{id}/feedback")
async def update_feedback(
    id: int,
    feedback_data: FeedbackUpdateRequest,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(AuditLog).where(AuditLog.id == id))
    log = result.scalars().first()
    if not log:
        raise HTTPException(status_code=404, detail="Registro de auditoría no encontrado.")

    log.feedback = feedback_data.feedback if feedback_data.feedback != "none" else None
    await db.commit()
    return {"detail": "Feedback registrado correctamente."}
