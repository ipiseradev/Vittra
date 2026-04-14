from fastapi import APIRouter, Depends

from app.api.deps import get_current_user

router = APIRouter(prefix="/payments", tags=["payments"])


@router.get("")
def list_payments(_user=Depends(get_current_user)) -> dict[str, list]:
    return {"items": []}


@router.post("")
def add_payment(_user=Depends(get_current_user)) -> dict[str, str]:
    # TODO: connect payment recording use-case.
    return {"message": "Payment scaffold ready"}
