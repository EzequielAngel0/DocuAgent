from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.security import verify_token
from app.db.session import get_db
from app.models import AdminUser

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


async def get_current_user(
    token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)
) -> AdminUser:
    # Si no viene en el header, intentar leerlo de la cookie 'auth_token' (usado por el middleware/front)
    # FastAPI no lee cookies de forma automática en OAuth2PasswordBearer
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciales no válidas o expiradas.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not token:
        # Intentar obtener de cookies de forma manual si es necesario
        raise credentials_exception

    payload = verify_token(token)
    if payload is None:
        raise credentials_exception

    email: str = payload.get("sub")
    if email is None:
        raise credentials_exception

    # Buscar usuario en la base de datos
    result = await db.execute(select(AdminUser).where(AdminUser.email == email))
    user = result.scalars().first()
    if user is None:
        raise credentials_exception

    return user
