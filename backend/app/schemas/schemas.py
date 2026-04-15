from datetime import datetime
from typing import Generic, TypeVar

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.models.models import (
    AppointmentStatus,
    AppointmentType,
    Gender,
    PaymentMethod,
    PaymentStatus,
    PrescriptionStatus,
    UserRole,
)

DataT = TypeVar("DataT")


class ResponseModel(BaseModel, Generic[DataT]):
    data: DataT


# ============== AUTH ==============

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    """Login request with email and password (accepts JSON)"""
    email: EmailStr
    password: str
    clinic_id: int = 1


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone: str | None = None
    role: UserRole = UserRole.RECEPTIONIST
    clinic_id: int


class UserUpdate(BaseModel):
    full_name: str | None = None
    phone: str | None = None
    is_active: bool | None = None


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: str
    full_name: str
    role: UserRole
    phone: str | None = None
    is_active: bool
    last_login: datetime | None = None


# ============== CLINIC ==============

class ClinicCreate(BaseModel):
    name: str
    slug: str
    email: EmailStr
    phone: str | None = None
    address: str | None = None
    city: str | None = None
    country: str | None = None
    license_number: str | None = None


class ClinicOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    slug: str
    email: str
    phone: str | None = None
    address: str | None = None
    subscription_status: str


# ============== PATIENTS ==============

class PatientBase(BaseModel):
    full_name: str = Field(min_length=2, max_length=255)
    email: EmailStr
    phone: str | None = Field(default=None, max_length=20)
    date_of_birth: datetime | None = None
    gender: Gender | None = None
    document_id: str | None = None
    insurance_id: str | None = None
    insurance_provider: str | None = None
    address: str | None = None
    emergency_contact_name: str | None = None
    emergency_contact_phone: str | None = None

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
        return value.strip() or None


class PatientCreate(PatientBase):
    is_active: bool = True


class PatientUpdate(BaseModel):
    full_name: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    date_of_birth: datetime | None = None
    gender: Gender | None = None
    document_id: str | None = None
    insurance_id: str | None = None
    insurance_provider: str | None = None
    address: str | None = None
    emergency_contact_name: str | None = None
    emergency_contact_phone: str | None = None
    is_active: bool | None = None


class PatientOut(PatientBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime


# ============== APPOINTMENTS ==============

class AppointmentCreate(BaseModel):
    patient_id: int
    doctor_id: int
    appointment_type: AppointmentType = AppointmentType.CONSULTATION
    scheduled_at: datetime
    duration_minutes: int = 30
    notes: str | None = None
    room: str | None = None


class AppointmentUpdate(BaseModel):
    appointment_type: AppointmentType | None = None
    status: AppointmentStatus | None = None
    scheduled_at: datetime | None = None
    duration_minutes: int | None = None
    notes: str | None = None
    room: str | None = None
    cancellation_reason: str | None = None


class AppointmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    patient_id: int
    doctor_id: int
    appointment_type: AppointmentType
    status: AppointmentStatus
    scheduled_at: datetime
    duration_minutes: int
    notes: str | None = None
    room: str | None = None
    created_at: datetime
    updated_at: datetime


# ============== MEDICAL RECORDS ==============

class MedicalRecordCreate(BaseModel):
    patient_id: int
    appointment_id: int | None = None
    chief_complaint: str | None = None
    diagnosis: str | None = None
    treatment_plan: str | None = None
    allergies: str | None = None
    chronic_conditions: str | None = None
    vital_signs_json: str | None = None
    notes: str | None = None


class MedicalRecordUpdate(BaseModel):
    chief_complaint: str | None = None
    diagnosis: str | None = None
    treatment_plan: str | None = None
    allergies: str | None = None
    chronic_conditions: str | None = None
    vital_signs_json: str | None = None
    notes: str | None = None


class MedicalRecordOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    patient_id: int
    appointment_id: int | None = None
    chief_complaint: str | None = None
    diagnosis: str | None = None
    treatment_plan: str | None = None
    allergies: str | None = None
    chronic_conditions: str | None = None
    notes: str | None = None
    created_at: datetime
    updated_at: datetime


# ============== PRESCRIPTIONS ==============

class PrescriptionCreate(BaseModel):
    patient_id: int
    medication_name: str
    dosage: str
    frequency: str
    duration_days: int | None = None


class PrescriptionUpdate(BaseModel):
    medication_name: str | None = None
    dosage: str | None = None
    frequency: str | None = None
    duration_days: int | None = None
    status: PrescriptionStatus | None = None


class PrescriptionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    patient_id: int
    medication_name: str
    dosage: str
    frequency: str
    duration_days: int | None = None
    status: PrescriptionStatus
    prescribed_at: datetime


# ============== PAYMENTS ==============

class PaymentCreate(BaseModel):
    patient_id: int
    amount: float = Field(gt=0)
    method: PaymentMethod = PaymentMethod.CASH
    description: str | None = None


class PaymentUpdate(BaseModel):
    status: PaymentStatus | None = None
    method: PaymentMethod | None = None


class PaymentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    patient_id: int
    amount: float
    status: PaymentStatus
    method: PaymentMethod
    description: str | None = None
    paid_at: datetime | None = None
    created_at: datetime
