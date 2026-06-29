from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.security import verify_token
from app.db.session import get_db
from app.models import AdminUser

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


async def get_current_user(
    request: Request,
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> AdminUser:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciales no válidas o expiradas.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # El token puede venir en el header Authorization o en la cookie httponly
    # (esta última es la vía segura: el JS del front no la lee).
    if not token:
        token = request.cookies.get("auth_token")
    if not token:
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
