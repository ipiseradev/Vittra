from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm

from app.core.security import create_access_token
from app.schemas.schemas import Token

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register")
def register() -> dict[str, str]:
    # TODO: wire registration service and persistence.
    return {"message": "Registration scaffold ready"}


@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends()) -> Token:
    # Foundation-only token issuance for local scaffolding.
    access_token = create_access_token(subject=form_data.username)
    return Token(access_token=access_token)
