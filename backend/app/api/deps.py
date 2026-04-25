from collections.abc import Callable
from typing import Final

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import ALGORITHM
from app.db.session import get_db
from app.models.models import User, UserRole

__all__ = [
    "get_db",
    "get_current_user",
    "get_clinic_id",
    "get_permissions_for_user",
    "require_permission",
    "require_role",
    "require_doctor",
    "require_admin",
    "oauth2_scheme",
]

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

PERMISSIONS_BY_ROLE: Final[dict[UserRole, set[str]]] = {
    UserRole.ADMIN: {
        "dashboard:read",
        "patients:read",
        "patients:write",
        "patients:sensitive",
        "patient360:read",
        "appointments:read",
        "appointments:write",
        "appointments:check_in",
        "appointments:consultation",
        "medical_records:read",
        "medical_records:write",
        "medical_records:sign",
        "prescriptions:read",
        "prescriptions:write",
        "prescriptions:sign",
        "studies:read",
        "studies:write",
        "payments:read",
        "payments:write",
        "staff:read",
        "schedule:read",
        "schedule:write",
        "ai:use",
    },
    UserRole.DOCTOR: {
        "dashboard:read",
        "patients:read",
        "patients:write",
        "patients:sensitive",
        "patient360:read",
        "appointments:read",
        "appointments:write",
        "appointments:check_in",
        "appointments:consultation",
        "medical_records:read",
        "medical_records:write",
        "medical_records:sign",
        "prescriptions:read",
        "prescriptions:write",
        "prescriptions:sign",
        "studies:read",
        "studies:write",
        "payments:read",
        "staff:read",
        "schedule:read",
        "ai:use",
    },
    UserRole.NURSE: {
        "dashboard:read",
        "patients:read",
        "patient360:read",
        "appointments:read",
        "appointments:check_in",
        "medical_records:read",
        "medical_records:write",
        "prescriptions:read",
        "studies:read",
        "payments:read",
        "staff:read",
        "schedule:read",
        "ai:use",
    },
    UserRole.RECEPTIONIST: {
        "dashboard:read",
        "patients:read",
        "patients:write",
        "patient360:read",
        "appointments:read",
        "appointments:write",
        "appointments:check_in",
        "payments:read",
        "payments:write",
        "staff:read",
        "schedule:read",
        "schedule:write",
    },
    UserRole.PATIENT: {
        "patients:read",
        "appointments:read",
    },
}


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        raw_user_id = payload.get("sub")
        clinic_id = payload.get("clinic_id")
        if raw_user_id is None or clinic_id is None:
            raise credentials_exception
        user_id = int(raw_user_id)
        clinic_id = int(clinic_id)
    except (JWTError, TypeError, ValueError) as exc:
        raise credentials_exception from exc

    user = db.get(User, user_id)
    if not user or user.clinic_id != clinic_id:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Inactive user")
    return user


def get_clinic_id(current_user: User = Depends(get_current_user)) -> int:
    return current_user.clinic_id


def get_permissions_for_user(user: User) -> list[str]:
    return sorted(PERMISSIONS_BY_ROLE.get(user.role, set()))


def require_role(*required_roles: UserRole) -> Callable[..., User]:
    def check_role(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in required_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return current_user

    return check_role


def require_permission(permission: str) -> Callable[..., User]:
    def check_permission(current_user: User = Depends(get_current_user)) -> User:
        allowed = PERMISSIONS_BY_ROLE.get(current_user.role, set())
        if permission not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Missing permission: {permission}",
            )
        return current_user

    return check_permission


def require_doctor(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.DOCTOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors can access this resource",
        )
    return current_user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user
