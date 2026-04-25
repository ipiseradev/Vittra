from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_clinic_id, get_db, require_permission
from app.models.models import User
from app.schemas.schemas import DashboardSummaryOut
from app.services.services import get_clinic_dashboard_summary

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummaryOut)
def get_dashboard_summary(
    db: Session = Depends(get_db),
    clinic_id: int = Depends(get_clinic_id),
    current_user: User = Depends(require_permission("dashboard:read")),
) -> DashboardSummaryOut:
    _ = current_user
    return DashboardSummaryOut(**get_clinic_dashboard_summary(db, clinic_id))
