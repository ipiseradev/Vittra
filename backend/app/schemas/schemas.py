from datetime import datetime
from typing import Generic, TypeVar

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.models.models import PaymentStatus, ReservationStatus, UserRole

DataT = TypeVar("DataT")


class ResponseModel(BaseModel, Generic[DataT]):
    data: DataT


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: UserRole = UserRole.ADMIN


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: EmailStr
    full_name: str
    role: UserRole


class ClientBase(BaseModel):
    full_name: str = Field(min_length=2, max_length=255)
    email: EmailStr
    phone: str | None = Field(default=None, min_length=7, max_length=50)

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, value: str) -> str:
        trimmed = value.strip()
        if len(trimmed) < 2:
            raise ValueError("full_name must contain at least 2 non-space characters")
        return trimmed

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: EmailStr) -> str:
        return str(value).strip().lower()

    @field_validator("phone")
    @classmethod
    def normalize_phone(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        return normalized or None


class ClientCreate(ClientBase):
    gym_id: int | None = None
    is_active: bool = True


class ClientUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=255)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, min_length=7, max_length=50)
    is_active: bool | None = None
    gym_id: int | None = None

    @field_validator("full_name")
    @classmethod
    def validate_optional_full_name(cls, value: str | None) -> str | None:
        if value is None:
            return None
        trimmed = value.strip()
        if len(trimmed) < 2:
            raise ValueError("full_name must contain at least 2 non-space characters")
        return trimmed

    @field_validator("email")
    @classmethod
    def normalize_optional_email(cls, value: EmailStr | None) -> str | None:
        if value is None:
            return None
        return str(value).strip().lower()

    @field_validator("phone")
    @classmethod
    def normalize_optional_phone(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        return normalized or None


class ClientOut(ClientBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    gym_id: int | None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class ClassSessionCreate(BaseModel):
    title: str
    coach_name: str
    starts_at: datetime
    capacity: int = 15


class ClassSessionOut(ClassSessionCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int


class ReservationCreate(BaseModel):
    client_id: int
    class_session_id: int


class ReservationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    client_id: int
    class_session_id: int
    status: ReservationStatus


class AttendanceCreate(BaseModel):
    reservation_id: int


class AttendanceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    reservation_id: int
    checked_in_at: datetime


class PaymentCreate(BaseModel):
    client_id: int
    amount: float
    status: PaymentStatus = PaymentStatus.PAID


class PaymentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    client_id: int
    amount: float
    status: PaymentStatus
    paid_at: datetime


class DashboardSummary(BaseModel):
    total_clients: int
    total_sessions: int
    active_reservations: int
    check_ins_today: int
    monthly_revenue: float
