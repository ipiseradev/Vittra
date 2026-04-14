from fastapi import APIRouter, Depends

from app.api.deps import get_current_user

router = APIRouter(prefix="/attendance", tags=["attendance"])


@router.get("")
def list_attendance(_user=Depends(get_current_user)) -> dict[str, list]:
    return {"items": []}


@router.post("")
def add_attendance(_user=Depends(get_current_user)) -> dict[str, str]:
    # TODO: connect attendance check-in use-case.
    return {"message": "Attendance scaffold ready"}
