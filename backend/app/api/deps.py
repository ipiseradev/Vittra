from typing import Any

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import ALGORITHM
from app.db.session import get_db  # Re-export for endpoints
from app.models.models import User, UserRole

__all__ = ["get_db", "get_current_user", "get_clinic_id", "require_role", "oauth2_scheme"]

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """Get current authenticated user from JWT token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int | None = payload.get("sub")
        clinic_id: int | None = payload.get("clinic_id")
        if user_id is None or clinic_id is None:
            raise credentials_exception
    except JWTError as exc:
        raise credentials_exception from exc
    
    user = db.get(User, user_id)
    if not user or user.clinic_id != clinic_id:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Inactive user")
    return user


def get_clinic_id(current_user: User = Depends(get_current_user)) -> int:
    """Get clinic_id from current user - ensures data is scoped to clinic"""
    return current_user.clinic_id


def require_role(*required_roles: UserRole) -> callable:
    """Factory to require specific roles"""
    def check_role(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in required_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return current_user
    return check_role


def require_doctor(current_user: User = Depends(get_current_user)) -> User:
    """Require doctor role"""
    if current_user.role != UserRole.DOCTOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors can access this resource"
        )
    return current_user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Require admin role"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


# Explicit re-export for clarity
__all__ = ["get_db", "get_current_user", "get_clinic_id", "require_role", "require_doctor", "require_admin", "oauth2_scheme"]
