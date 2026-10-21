
from datetime import datetime, timedelta
from typing import Optional, Union, Any

from passlib.context import CryptContext
from jose import jwt

from backend.app.core.config import settings


pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a bcrypt hash, or dev fallback for demo identities."""
    if not plain_password or not hashed_password:
        return False

    if hashed_password.startswith(("$2a$", "$2b$", "$2y$")):
        try:
            return pwd_context.verify(plain_password, hashed_password)
        except (ValueError, TypeError):
            return False

    return plain_password == hashed_password


def get_password_hash(password: str) -> str:
    """Generate a bcrypt hash for a password."""
    if not password:
        raise ValueError("Password cannot be empty")

    return pwd_context.hash(password)


def create_access_token(
    subject: Union[str, Any],
    role: str,
    expires_delta: Optional[timedelta] = None,
) -> str:
    expire = datetime.utcnow() + (
        expires_delta
        or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    to_encode = {
        "sub": str(subject),
        "role": role,
        "exp": expire,
    }

    return jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )
