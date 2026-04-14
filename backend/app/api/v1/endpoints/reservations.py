from fastapi import APIRouter, Depends

from app.api.deps import get_current_user

router = APIRouter(prefix="/reservations", tags=["reservations"])


@router.get("")
def list_reservations(_user=Depends(get_current_user)) -> dict[str, list]:
    return {"items": []}


@router.post("")
def add_reservation(_user=Depends(get_current_user)) -> dict[str, str]:
    # TODO: connect create reservation use-case.
    return {"message": "Reservation creation scaffold ready"}
