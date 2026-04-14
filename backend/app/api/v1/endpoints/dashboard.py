from fastapi import APIRouter, Depends

from app.api.deps import get_current_user

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary")
def dashboard_summary(_user=Depends(get_current_user)) -> dict[str, int | float]:
    # TODO: connect dashboard aggregation query layer.
    return {
        "total_clients": 0,
        "total_classes": 0,
        "active_reservations": 0,
        "check_ins_today": 0,
        "monthly_revenue": 0.0,
    }
