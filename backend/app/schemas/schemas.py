from datetime import datetime
from typing import Any, Generic, TypeVar

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


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    clinic_id: int = 1


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone: str | None = None
    role: UserRole = UserRole.RECEPTIONIST
    specialty: str | None = None
    license_number: str | None = None
    clinic_id: int


class UserUpdate(BaseModel):
    full_name: str | None = None
    phone: str | None = None
    specialty: str | None = None
    license_number: str | None = None
    is_active: bool | None = None


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    full_name: str
    role: UserRole
    phone: str | None = None
    specialty: str | None = None
    license_number: str | None = None
    is_active: bool
    last_login: datetime | None = None
    created_at: datetime
    updated_at: datetime


class AuthMeOut(BaseModel):
    user: UserOut
    permissions: list[str]


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


class PatientBase(BaseModel):
    full_name: str = Field(min_length=2, max_length=255)
    email: EmailStr
    phone: str | None = Field(default=None, max_length=20)
    date_of_birth: datetime | None = None
    gender: Gender | None = None
    document_id: str | None = None
    insurance_id: str | None = None
    insurance_provider: str | None = None
    coverage_plan: str | None = None
    address: str | None = None
    emergency_contact_name: str | None = None
    emergency_contact_phone: str | None = None
    visible_allergies: str | None = None
    chronic_medications: str | None = None
    clinical_alerts: str | None = None
    preferred_pharmacy: str | None = None

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

    @field_validator("phone", "emergency_contact_phone")
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
    coverage_plan: str | None = None
    address: str | None = None
    emergency_contact_name: str | None = None
    emergency_contact_phone: str | None = None
    visible_allergies: str | None = None
    chronic_medications: str | None = None
    clinical_alerts: str | None = None
    preferred_pharmacy: str | None = None
    is_active: bool | None = None


class PatientOut(PatientBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime


class AppointmentCreate(BaseModel):
    patient_id: int
    doctor_id: int
    appointment_type: AppointmentType = AppointmentType.CONSULTATION
    scheduled_at: datetime
    duration_minutes: int = 30
    visit_reason: str | None = None
    notes: str | None = None
    room: str | None = None
    is_waitlist: bool = False
    is_overbooked: bool = False
    reminder_channel: str | None = None
    queue_notes: str | None = None


class AppointmentUpdate(BaseModel):
    appointment_type: AppointmentType | None = None
    status: AppointmentStatus | None = None
    scheduled_at: datetime | None = None
    duration_minutes: int | None = None
    visit_reason: str | None = None
    workflow_stage: str | None = None
    notes: str | None = None
    room: str | None = None
    is_waitlist: bool | None = None
    is_overbooked: bool | None = None
    reminder_channel: str | None = None
    queue_notes: str | None = None
    cancellation_reason: str | None = None


class AppointmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    patient_id: int
    doctor_id: int
    appointment_type: AppointmentType
    status: AppointmentStatus
    workflow_stage: str
    scheduled_at: datetime
    duration_minutes: int
    visit_reason: str | None = None
    notes: str | None = None
    room: str | None = None
    is_waitlist: bool
    is_overbooked: bool
    reminder_channel: str | None = None
    reminder_sent_at: datetime | None = None
    checked_in_at: datetime | None = None
    consultation_started_at: datetime | None = None
    consultation_completed_at: datetime | None = None
    queue_notes: str | None = None
    cancellation_reason: str | None = None
    created_at: datetime
    updated_at: datetime


class AppointmentReminderResponse(BaseModel):
    id: int
    reminder_sent_at: datetime
    reminder_channel: str


class ScheduleBlockCreate(BaseModel):
    doctor_id: int | None = None
    room: str | None = None
    starts_at: datetime
    ends_at: datetime
    reason: str = Field(min_length=2, max_length=255)
    is_all_day: bool = False


class ScheduleBlockOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    doctor_id: int | None = None
    room: str | None = None
    starts_at: datetime
    ends_at: datetime
    reason: str
    is_all_day: bool
    created_at: datetime


class MedicalRecordCreate(BaseModel):
    patient_id: int
    appointment_id: int | None = None
    specialty: str | None = None
    chief_complaint: str | None = None
    history_of_present_illness: str | None = None
    medical_history: str | None = None
    surgical_history: str | None = None
    family_history: str | None = None
    social_history: str | None = None
    allergies: str | None = None
    chronic_conditions: str | None = None
    current_medications: str | None = None
    vital_signs_json: str | None = None
    physical_exam: str | None = None
    diagnosis: str | None = None
    cie10_codes: str | None = None
    assessment: str | None = None
    evolution: str | None = None
    treatment_plan: str | None = None
    attachments: str | None = None
    notes: str | None = None
    sensitive_notes: str | None = None


class MedicalRecordUpdate(BaseModel):
    specialty: str | None = None
    chief_complaint: str | None = None
    history_of_present_illness: str | None = None
    medical_history: str | None = None
    surgical_history: str | None = None
    family_history: str | None = None
    social_history: str | None = None
    allergies: str | None = None
    chronic_conditions: str | None = None
    current_medications: str | None = None
    vital_signs_json: str | None = None
    physical_exam: str | None = None
    diagnosis: str | None = None
    cie10_codes: str | None = None
    assessment: str | None = None
    evolution: str | None = None
    treatment_plan: str | None = None
    attachments: str | None = None
    notes: str | None = None
    sensitive_notes: str | None = None


class MedicalRecordOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    patient_id: int
    appointment_id: int | None = None
    specialty: str | None = None
    chief_complaint: str | None = None
    history_of_present_illness: str | None = None
    medical_history: str | None = None
    surgical_history: str | None = None
    family_history: str | None = None
    social_history: str | None = None
    allergies: str | None = None
    chronic_conditions: str | None = None
    current_medications: str | None = None
    vital_signs_json: str | None = None
    physical_exam: str | None = None
    diagnosis: str | None = None
    cie10_codes: str | None = None
    assessment: str | None = None
    evolution: str | None = None
    treatment_plan: str | None = None
    attachments: str | None = None
    notes: str | None = None
    sensitive_notes: str | None = None
    signed_off_by_user_id: int | None = None
    signed_off_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class PrescriptionCreate(BaseModel):
    patient_id: int
    appointment_id: int | None = None
    medication_name: str
    dosage: str
    frequency: str
    administration_route: str | None = None
    duration_days: int | None = None
    diagnosis: str | None = None
    indication: str | None = None
    treatment_plan: str | None = None
    printable_notes: str | None = None
    renewal_count: int = 0


class PrescriptionUpdate(BaseModel):
    medication_name: str | None = None
    dosage: str | None = None
    frequency: str | None = None
    administration_route: str | None = None
    duration_days: int | None = None
    diagnosis: str | None = None
    indication: str | None = None
    treatment_plan: str | None = None
    printable_notes: str | None = None
    renewal_count: int | None = None
    status: PrescriptionStatus | None = None


class PrescriptionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    patient_id: int
    appointment_id: int | None = None
    medication_name: str
    dosage: str
    frequency: str
    administration_route: str | None = None
    duration_days: int | None = None
    diagnosis: str | None = None
    indication: str | None = None
    treatment_plan: str | None = None
    interaction_warnings: str | None = None
    printable_notes: str | None = None
    renewal_count: int
    renewals_used: int
    status: PrescriptionStatus
    prescribed_at: datetime
    signed_by_user_id: int | None = None
    signed_at: datetime | None = None
    created_at: datetime


class PrescriptionPrintableOut(BaseModel):
    id: int
    html: str


class StudyOrderCreate(BaseModel):
    patient_id: int
    appointment_id: int | None = None
    category: str = Field(default="lab", max_length=50)
    title: str = Field(min_length=2, max_length=255)
    instructions: str | None = None
    due_at: datetime | None = None


class StudyOrderUpdate(BaseModel):
    category: str | None = None
    title: str | None = None
    instructions: str | None = None
    status: str | None = None
    due_at: datetime | None = None
    results_summary: str | None = None
    result_files: str | None = None
    comparison_notes: str | None = None
    reviewed_at: datetime | None = None


class StudyOrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    patient_id: int
    appointment_id: int | None = None
    ordered_by_user_id: int | None = None
    category: str
    title: str
    instructions: str | None = None
    status: str
    ordered_at: datetime
    due_at: datetime | None = None
    results_summary: str | None = None
    result_files: str | None = None
    comparison_notes: str | None = None
    reviewed_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class PaymentCreate(BaseModel):
    patient_id: int
    amount: float = Field(gt=0)
    coverage_amount: float | None = Field(default=None, ge=0)
    patient_amount: float | None = Field(default=None, ge=0)
    method: PaymentMethod = PaymentMethod.CASH
    description: str | None = None
    invoice_number: str | None = None
    due_at: datetime | None = None


class PaymentUpdate(BaseModel):
    status: PaymentStatus | None = None
    method: PaymentMethod | None = None
    coverage_amount: float | None = Field(default=None, ge=0)
    patient_amount: float | None = Field(default=None, ge=0)
    description: str | None = None
    invoice_number: str | None = None
    due_at: datetime | None = None
    paid_at: datetime | None = None


class PaymentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    patient_id: int
    amount: float
    coverage_amount: float | None = None
    patient_amount: float | None = None
    status: PaymentStatus
    method: PaymentMethod
    description: str | None = None
    invoice_number: str | None = None
    due_at: datetime | None = None
    paid_at: datetime | None = None
    created_at: datetime


class PatientAssistantChatRequest(BaseModel):
    message: str = Field(min_length=2, max_length=3000)
    provider: str = Field(default="auto", pattern="^(auto|openai|anthropic|demo)$")

    @field_validator("message")
    @classmethod
    def validate_message(cls, value: str) -> str:
        trimmed = value.strip()
        if len(trimmed) < 2:
            raise ValueError("message must contain at least 2 non-space characters")
        return trimmed


class ClinicalNoteDraftRequest(BaseModel):
    patient_id: int
    appointment_id: int | None = None
    specialty: str | None = None
    dictation: str = Field(min_length=2, max_length=4000)
    provider: str = Field(default="auto", pattern="^(auto|openai|anthropic|demo)$")


class PatientAssistantContext(BaseModel):
    patient_id: int
    full_name: str
    patient: dict[str, Any]
    recent_medical_records: list[dict[str, Any]]
    upcoming_appointments: list[dict[str, Any]]
    active_prescriptions: list[dict[str, Any]] = []
    pending_studies: list[dict[str, Any]] = []
    generated_at: str | None = None


class AIGenerationResponse(BaseModel):
    provider_requested: str
    provider_used: str
    model: str
    fallback_used: bool
    system_prompt: str
    patient_context: dict[str, Any]
    reply: str
    error: str | None = None


class PatientAssistantChatResponse(AIGenerationResponse):
    pass


class Patient360Out(BaseModel):
    patient: PatientOut
    alerts: list[str]
    debt_summary: dict[str, float]
    latest_diagnoses: list[str]
    upcoming_appointments: list[AppointmentOut]
    recent_medical_records: list[MedicalRecordOut]
    active_prescriptions: list[PrescriptionOut]
    pending_studies: list[StudyOrderOut]
    payments: list[PaymentOut]
    documents: list[str]


class DashboardSummaryOut(BaseModel):
    total_patients: int
    total_appointments: int
    checked_in_today: int
    completed_today: int
    pending_studies: int
    monthly_revenue: float
