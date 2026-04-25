from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_permissions_for_user
from app.db.session import get_db
from app.models.models import User
from app.schemas.schemas import AuthMeOut, Token, UserCreate, UserOut
from app.core.security import create_access_token
from app.services.services import authenticate_user, create_user, update_user_login

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)) -> UserOut:
    # Check existing user
    existing = db.scalar(select(User).where(func.lower(User.email) == payload.email.lower()))
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )
    user = create_user(db, payload)
    return user


@router.post("/login", response_model=Token)
def login(
    db: Session = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends(),
) -> Token:
    # Use first clinic or fixed clinic_id = 1
    clinic_id = 1
    user = authenticate_user(db, clinic_id, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    update_user_login(db, user.id)
    access_token = create_access_token(user.id, user.clinic_id, user.role)
    return Token(access_token=access_token, token_type="bearer")


@router.get("/me", response_model=AuthMeOut)
def me(current_user: User = Depends(get_current_user)) -> AuthMeOut:
    return AuthMeOut(user=current_user, permissions=get_permissions_for_user(current_user))

