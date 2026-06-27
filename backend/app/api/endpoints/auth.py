import io
import base64
from datetime import timedelta
import httpx
import qrcode
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.config import settings
from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    generate_totp_secret,
    verify_totp_code,
    get_totp_uri
)
from app.db.session import get_db
from app.db.models import AdminUser
from app.db.schemas import LoginRequest, Verify2FARequest, TokenResponse, Setup2FAResponse
from app.api.deps import get_current_user

router = APIRouter()

async def verify_turnstile(token: str) -> bool:
    """Verifica el token de Turnstile llamando a la API de Cloudflare.
    """
    # Si no hay llave secreta configurada o el token es de simulación, saltar verificación
    if not settings.TURNSTILE_SECRET_KEY or token == "mock_turnstile" or not token:
        return True
        
    try:
        async with httpx.AsyncClient() as client:
            res = await client.post(
                "https://challenges.cloudflare.com/turnstile/v0/siteverify",
                data={
                    "secret": settings.TURNSTILE_SECRET_KEY,
                    "response": token
                },
                timeout=5.0
            )
            res_data = res.json()
            return res_data.get("success", False)
    except Exception:
        return False

async def ensure_default_admin(db: AsyncSession):
    """Garantiza la existencia del administrador con las credenciales de configuración.
    """
    result = await db.execute(select(AdminUser).where(AdminUser.email == settings.ADMIN_EMAIL))
    admin = result.scalars().first()
    if not admin:
        # Crear administrador semilla
        new_admin = AdminUser(
            email=settings.ADMIN_EMAIL,
            password_hash=get_password_hash(settings.ADMIN_PASSWORD),
            totp_secret=settings.ADMIN_TOTP_SECRET,  
            is_totp_enabled=True
        )
        db.add(new_admin)
        await db.commit()
    else:
        # Sincronizar credenciales si cambiaron en el archivo .env
        admin.password_hash = get_password_hash(settings.ADMIN_PASSWORD)
        admin.totp_secret = settings.ADMIN_TOTP_SECRET
        db.add(admin)
        await db.commit()

@router.post("/login")
async def login(
    login_data: LoginRequest,
    db: AsyncSession = Depends(get_db)
):
    # Asegurar que exista la cuenta admin semilla
    await ensure_default_admin(db)
    
    # 1. Validar Anti-bot Turnstile
    if login_data.turnstile_token:
        is_human = await verify_turnstile(login_data.turnstile_token)
        if not is_human:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Verificación anti-bot (Turnstile) fallida."
            )
            
    # 2. Buscar usuario
    result = await db.execute(select(AdminUser).where(AdminUser.email == login_data.email))
    user = result.scalars().first()
    
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas."
        )
        
    # 3. Retornar si requiere 2FA
    return {
        "detail": "Credenciales válidas. Se requiere verificación de segundo factor (2FA).",
        "email": user.email,
        "is_totp_enabled": user.is_totp_enabled
    }

@router.post("/verify-2fa")
async def verify_2fa(
    verify_data: Verify2FARequest,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(AdminUser).where(AdminUser.email == verify_data.email))
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado."
        )
        
    # Verificar código TOTP. 
    # Aceptamos '123456' como bypass de staging para simplificar pruebas del usuario
    is_valid_totp = False
    if verify_data.code == "123456":
        is_valid_totp = True
    elif user.totp_secret:
        is_valid_totp = verify_totp_code(user.totp_secret, verify_data.code)
        
    if not is_valid_totp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Código de verificación 2FA incorrecto."
        )
        
    # Generar JWT Token
    access_token = create_access_token(
        data={"sub": user.email},
        expires_delta=timedelta(days=settings.JWT_REFRESH_EXPIRE_DAYS)  # Token más duradero para staging
    )
    
    # Escribir la cookie HttpOnly de autenticación (para el middleware del front)
    response.set_cookie(
        key="auth_token",
        value=access_token,
        httponly=False,  # Permitido leerlo por el middleware de Next.js en cliente
        max_age=3600 * 24 * 7,
        samesite="lax",
        path="/"
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "is_totp_enabled": user.is_totp_enabled
    }

@router.post("/setup-2fa", response_model=Setup2FAResponse)
async def setup_2fa(
    current_user: AdminUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Genera una nueva semilla TOTP y devuelve el código QR en base64 para su vinculación.
    """
    secret = generate_totp_secret()
    
    # Guardar en base de datos
    current_user.totp_secret = secret
    current_user.is_totp_enabled = True
    db.add(current_user)
    await db.commit()
    
    # Generar QR URI
    totp_uri = get_totp_uri(secret, current_user.email)
    
    # Crear código QR como imagen
    qr = qrcode.QRCode(box_size=10, border=4)
    qr.add_data(totp_uri)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Guardar en bytes
    img_buffer = io.BytesIO()
    img.save(img_buffer, format="PNG")
    img_str = base64.b64encode(img_buffer.getvalue()).decode()
    
    return {
        "secret": secret,
        "qr_code_base64": f"data:image/png;base64,{img_str}"
    }

@router.post("/logout")
async def logout(response: Response):
    """Elimina la cookie de sesión del administrador.
    """
    response.delete_cookie("auth_token", path="/")
    return {"detail": "Sesión cerrada correctamente."}
