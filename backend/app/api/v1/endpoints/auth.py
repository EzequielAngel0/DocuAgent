"""Autenticación del panel admin: password → Turnstile → TOTP 2FA → JWT."""

import base64
import io
from datetime import timedelta

import httpx
import qrcode
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.ratelimit import limiter
from app.core.security import (
    create_access_token,
    generate_totp_secret,
    get_password_hash,
    get_totp_uri,
    verify_password,
    verify_totp_code,
)
from app.db.session import get_db
from app.models import AdminUser, LoginRequest, Setup2FAResponse, Verify2FARequest

router = APIRouter()


async def verify_turnstile(token: str) -> bool:
    """Verifica el token de Turnstile contra la API de Cloudflare."""
    if not settings.TURNSTILE_SECRET_KEY or not token:
        return False
    try:
        async with httpx.AsyncClient() as client:
            res = await client.post(
                "https://challenges.cloudflare.com/turnstile/v0/siteverify",
                data={"secret": settings.TURNSTILE_SECRET_KEY, "response": token},
                timeout=5.0,
            )
            return res.json().get("success", False)
    except Exception:  # noqa: BLE001
        return False


async def ensure_default_admin(db: AsyncSession) -> None:
    """Crea o sincroniza el administrador semilla definido en configuración."""
    result = await db.execute(select(AdminUser).where(AdminUser.email == settings.ADMIN_EMAIL))
    admin = result.scalars().first()
    if not admin:
        admin = AdminUser(
            email=settings.ADMIN_EMAIL,
            password_hash=get_password_hash(settings.ADMIN_PASSWORD),
            totp_secret=settings.ADMIN_TOTP_SECRET,
            is_totp_enabled=True,
        )
        db.add(admin)
    else:
        admin.password_hash = get_password_hash(settings.ADMIN_PASSWORD)
        admin.totp_secret = settings.ADMIN_TOTP_SECRET
        db.add(admin)
    await db.commit()


@router.post("/login")
@limiter.limit(settings.RATE_LIMIT_LOGIN)
async def login(request: Request, login_data: LoginRequest, db: AsyncSession = Depends(get_db)):
    await ensure_default_admin(db)

    # 1. Anti-bot (Turnstile) — obligatorio en producción.
    if settings.IS_PRODUCTION or login_data.turnstile_token:
        if not await verify_turnstile(login_data.turnstile_token or ""):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Verificación anti-bot (Turnstile) fallida.",
            )

    # 2. Credenciales.
    result = await db.execute(select(AdminUser).where(AdminUser.email == login_data.email))
    user = result.scalars().first()
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales incorrectas."
        )

    # 3. Pasa a 2FA.
    return {
        "detail": "Credenciales válidas. Se requiere verificación de segundo factor (2FA).",
        "email": user.email,
        "is_totp_enabled": user.is_totp_enabled,
    }


@router.post("/verify-2fa")
@limiter.limit(settings.RATE_LIMIT_2FA)
async def verify_2fa(
    request: Request,
    verify_data: Verify2FARequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(AdminUser).where(AdminUser.email == verify_data.email))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado.")

    if not (user.totp_secret and verify_totp_code(user.totp_secret, verify_data.code)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Código de verificación 2FA incorrecto.",
        )

    access_token = create_access_token(
        data={"sub": user.email},
        expires_delta=timedelta(days=settings.JWT_REFRESH_EXPIRE_DAYS),
    )

    # NOTA SEGURIDAD: hoy `httponly=False` porque el frontend lee la cookie con
    # `document.cookie` para enviarla en Authorization. El backend YA acepta la
    # cookie (get_current_user) y la fija con dominio compartido, así que migrar
    # a `httponly=True` solo requiere refactorizar el frontend a
    # `credentials: "include"` (P0 en security-audit.md). Mientras tanto:
    response.set_cookie(
        key="auth_token",
        value=access_token,
        httponly=False,
        secure=settings.ENVIRONMENT != "development",
        max_age=3600 * 24 * settings.JWT_REFRESH_EXPIRE_DAYS,
        samesite="lax",
        path="/",
        domain=settings.COOKIE_DOMAIN or None,
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "is_totp_enabled": user.is_totp_enabled,
    }


@router.post("/setup-2fa", response_model=Setup2FAResponse)
async def setup_2fa(
    current_user: AdminUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Genera una nueva semilla TOTP y devuelve el QR en base64."""
    secret = generate_totp_secret()
    current_user.totp_secret = secret
    current_user.is_totp_enabled = True
    db.add(current_user)
    await db.commit()

    qr = qrcode.QRCode(box_size=10, border=4)
    qr.add_data(get_totp_uri(secret, current_user.email))
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")

    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    img_str = base64.b64encode(buffer.getvalue()).decode()

    return Setup2FAResponse(secret=secret, qr_code_base64=f"data:image/png;base64,{img_str}")


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("auth_token", path="/", domain=settings.COOKIE_DOMAIN or None)
    return {"detail": "Sesión cerrada correctamente."}
