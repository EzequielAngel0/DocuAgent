from datetime import datetime, timedelta, timezone
from typing import Optional, Union, Dict, Any
from jose import jwt, JWTError
from passlib.context import CryptContext
import pyotp

from app.core.config import settings

# Configurar contexto de cifrado para contraseñas
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ALGORITHM = "HS256"

# ============================================================
# Contraseñas
# ============================================================
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

# ============================================================
# JWT Tokens
# ============================================================
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_ACCESS_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None

# ============================================================
# TOTP (MFA 2FA)
# ============================================================
def generate_totp_secret() -> str:
    """Genera un secreto base32 aleatorio compatible con Google Authenticator.
    """
    return pyotp.random_base32()

def verify_totp_code(secret: str, code: str) -> bool:
    """Verifica un código TOTP de 6 dígitos.
    """
    totp = pyotp.TOTP(secret)
    # Permite una pequeña tolerancia de tiempo (30 segundos antes/después)
    return totp.verify(code, valid_window=1)

def get_totp_uri(secret: str, email: str) -> str:
    """Genera el URI para el código QR de vinculación TOTP.
    """
    return pyotp.TOTP(secret).provisioning_uri(
        name=email,
        issuer_name="DocuAgent"
    )
