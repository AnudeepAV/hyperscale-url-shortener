"""Security utilities: password hashing + JWT token handling."""
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def _hash_password_sha256(password: str) -> str:
    """Convert any-length password to 64-char SHA256 hash (bcrypt-safe)."""
    return hashlib.sha256(password.encode()).hexdigest()


def hash_password(plain: str) -> str:
    """Hash a password using SHA256 + bcrypt for any length support."""
    # First, hash with SHA256 (makes it fixed 64 chars, safe for bcrypt)
    sha256_hash = _hash_password_sha256(plain)
    # Then bcrypt the SHA256 hash
    return pwd_context.hash(sha256_hash)


def verify_password(plain: str, hashed: str) -> bool:
    """Verify a password against its hash."""
    # Hash the incoming password the same way
    sha256_hash = _hash_password_sha256(plain)
    # Compare with stored bcrypt hash
    return pwd_context.verify(sha256_hash, hashed)


def create_access_token(sub: str, expires_delta: Optional[timedelta] = None) -> str:
    """Create a short-lived JWT access token."""
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    payload = {"sub": sub, "exp": expire, "type": "access"}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(sub: str) -> str:
    """Long-lived refresh token for silent re-auth."""
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    payload = {"sub": sub, "exp": expire, "type": "refresh"}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> Optional[dict]:
    """Decode and verify a JWT. Returns None on failure."""
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    except JWTError:
        return None