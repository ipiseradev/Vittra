from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_clinic_id, get_db, require_permission
from app.models.models import User
from app.schemas.schemas import UserOut
from app.services.services import list_doctors_by_clinic

router = APIRouter(prefix="/doctors", tags=["doctors"])


@router.get("", response_model=list[UserOut])
def list_doctors(
    is_active: bool | None = Query(default=True),
    db: Session = Depends(get_db),
    clinic_id: int = Depends(get_clinic_id),
    current_user: User = Depends(require_permission("staff:read")),
) -> list[UserOut]:
    _ = current_user
    return list_doctors_by_clinic(db, clinic_id, is_active=is_active)
