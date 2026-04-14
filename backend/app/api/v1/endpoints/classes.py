from fastapi import APIRouter, Depends

from app.api.deps import get_current_user

router = APIRouter(prefix="/classes", tags=["classes"])


@router.get("")
def list_classes(_user=Depends(get_current_user)) -> dict[str, list]:
    return {"items": []}


@router.post("")
def create_class(_user=Depends(get_current_user)) -> dict[str, str]:
    # TODO: connect create class/session use-case.
    return {"message": "Class creation scaffold ready"}
