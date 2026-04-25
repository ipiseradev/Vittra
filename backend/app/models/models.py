from datetime import datetime
from enum import Enum

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum as SqlEnum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class UserRole(str, Enum):
    ADMIN = "admin"
    DOCTOR = "doctor"
    NURSE = "nurse"
    RECEPTIONIST = "receptionist"
    PATIENT = "patient"


class Gender(str, Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"


class AppointmentStatus(str, Enum):
    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"
    RESCHEDULED = "rescheduled"


class AppointmentType(str, Enum):
    CONSULTATION = "consultation"
    FOLLOW_UP = "follow_up"
    PROCEDURE = "procedure"
    CHECKUP = "checkup"


class PaymentStatus(str, Enum):
    PENDING = "pending"
    PAID = "paid"
    FAILED = "failed"
    REFUNDED = "refunded"


class PaymentMethod(str, Enum):
    CASH = "cash"
    CARD = "card"
    INSURANCE = "insurance"
    BANK_TRANSFER = "bank_transfer"


class PrescriptionStatus(str, Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class Clinic(Base):
    __tablename__ = "clinics"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), index=True)
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    address: Mapped[str | None] = mapped_column(String(500), nullable=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    country: Mapped[str | None] = mapped_column(String(100), nullable=True)
    license_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    subscription_status: Mapped[str] = mapped_column(String(50), default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    staff: Mapped[list["User"]] = relationship(back_populates="clinic")
    patients: Mapped[list["Patient"]] = relationship(back_populates="clinic")


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    clinic_id: Mapped[int] = mapped_column(ForeignKey("clinics.id"), index=True)
    email: Mapped[str] = mapped_column(String(255))
    hashed_password: Mapped[str] = mapped_column(String(255))
    full_name: Mapped[str] = mapped_column(String(255))
    role: Mapped[UserRole] = mapped_column(SqlEnum(UserRole), default=UserRole.RECEPTIONIST)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    specialty: Mapped[str | None] = mapped_column(String(255), nullable=True)
    license_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    last_login: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    clinic: Mapped["Clinic"] = relationship(back_populates="staff")
    appointments: Mapped[list["Appointment"]] = relationship(
        foreign_keys="Appointment.doctor_id",
        back_populates="doctor",
    )

    __table_args__ = (UniqueConstraint("clinic_id", "email", name="uq_clinic_user_email"),)


class Patient(Base):
    __tablename__ = "patients"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    clinic_id: Mapped[int] = mapped_column(ForeignKey("clinics.id"), index=True)
    email: Mapped[str] = mapped_column(String(255), index=True)
    full_name: Mapped[str] = mapped_column(String(255))
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    date_of_birth: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    gender: Mapped[Gender | None] = mapped_column(SqlEnum(Gender), nullable=True)
    document_id: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True)
    insurance_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    insurance_provider: Mapped[str | None] = mapped_column(String(255), nullable=True)
    coverage_plan: Mapped[str | None] = mapped_column(String(255), nullable=True)
    address: Mapped[str | None] = mapped_column(String(500), nullable=True)
    emergency_contact_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    emergency_contact_phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    visible_allergies: Mapped[str | None] = mapped_column(Text, nullable=True)
    chronic_medications: Mapped[str | None] = mapped_column(Text, nullable=True)
    clinical_alerts: Mapped[str | None] = mapped_column(Text, nullable=True)
    preferred_pharmacy: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    clinic: Mapped["Clinic"] = relationship(back_populates="patients")
    appointments: Mapped[list["Appointment"]] = relationship(back_populates="patient")
    medical_records: Mapped[list["MedicalRecord"]] = relationship(back_populates="patient")
    prescriptions: Mapped[list["Prescription"]] = relationship(back_populates="patient")
    payments: Mapped[list["Payment"]] = relationship(back_populates="patient")
    study_orders: Mapped[list["StudyOrder"]] = relationship(back_populates="patient")

    __table_args__ = (UniqueConstraint("clinic_id", "email", name="uq_clinic_patient_email"),)


class Appointment(Base):
    __tablename__ = "appointments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    clinic_id: Mapped[int] = mapped_column(ForeignKey("clinics.id"), index=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id"), index=True)
    doctor_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    appointment_type: Mapped[AppointmentType] = mapped_column(
        SqlEnum(AppointmentType),
        default=AppointmentType.CONSULTATION,
    )
    status: Mapped[AppointmentStatus] = mapped_column(
        SqlEnum(AppointmentStatus),
        default=AppointmentStatus.SCHEDULED,
    )
    workflow_stage: Mapped[str] = mapped_column(String(50), default="scheduled")
    scheduled_at: Mapped[datetime] = mapped_column(DateTime, index=True)
    duration_minutes: Mapped[int] = mapped_column(Integer, default=30)
    visit_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    room: Mapped[str | None] = mapped_column(String(50), nullable=True)
    is_waitlist: Mapped[bool] = mapped_column(Boolean, default=False)
    is_overbooked: Mapped[bool] = mapped_column(Boolean, default=False)
    reminder_channel: Mapped[str | None] = mapped_column(String(50), nullable=True)
    reminder_sent_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    checked_in_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    consultation_started_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    consultation_completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    queue_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    cancellation_reason: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    clinic: Mapped[int] = mapped_column("clinic", ForeignKey("clinics.id"))
    patient: Mapped["Patient"] = relationship(back_populates="appointments")
    doctor: Mapped["User"] = relationship(back_populates="appointments")
    medical_record: Mapped["MedicalRecord | None"] = relationship(
        foreign_keys="MedicalRecord.appointment_id",
        back_populates="appointment",
    )
    study_orders: Mapped[list["StudyOrder"]] = relationship(back_populates="appointment")


class MedicalRecord(Base):
    __tablename__ = "medical_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    clinic_id: Mapped[int] = mapped_column(ForeignKey("clinics.id"), index=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id"), index=True)
    appointment_id: Mapped[int | None] = mapped_column(ForeignKey("appointments.id"), nullable=True)
    specialty: Mapped[str | None] = mapped_column(String(255), nullable=True)
    chief_complaint: Mapped[str | None] = mapped_column(Text, nullable=True)
    history_of_present_illness: Mapped[str | None] = mapped_column(Text, nullable=True)
    medical_history: Mapped[str | None] = mapped_column(Text, nullable=True)
    surgical_history: Mapped[str | None] = mapped_column(Text, nullable=True)
    family_history: Mapped[str | None] = mapped_column(Text, nullable=True)
    social_history: Mapped[str | None] = mapped_column(Text, nullable=True)
    allergies: Mapped[str | None] = mapped_column(Text, nullable=True)
    chronic_conditions: Mapped[str | None] = mapped_column(Text, nullable=True)
    current_medications: Mapped[str | None] = mapped_column(Text, nullable=True)
    vital_signs_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    physical_exam: Mapped[str | None] = mapped_column(Text, nullable=True)
    diagnosis: Mapped[str | None] = mapped_column(Text, nullable=True)
    cie10_codes: Mapped[str | None] = mapped_column(Text, nullable=True)
    assessment: Mapped[str | None] = mapped_column(Text, nullable=True)
    evolution: Mapped[str | None] = mapped_column(Text, nullable=True)
    treatment_plan: Mapped[str | None] = mapped_column(Text, nullable=True)
    attachments: Mapped[str | None] = mapped_column(Text, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    sensitive_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    signed_off_by_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    signed_off_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    clinic: Mapped[int] = mapped_column("clinic", ForeignKey("clinics.id"))
    patient: Mapped["Patient"] = relationship(back_populates="medical_records")
    appointment: Mapped["Appointment | None"] = relationship(back_populates="medical_record")


class Prescription(Base):
    __tablename__ = "prescriptions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    clinic_id: Mapped[int] = mapped_column(ForeignKey("clinics.id"), index=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id"), index=True)
    appointment_id: Mapped[int | None] = mapped_column(ForeignKey("appointments.id"), nullable=True)
    medication_name: Mapped[str] = mapped_column(String(255))
    dosage: Mapped[str] = mapped_column(String(100))
    frequency: Mapped[str] = mapped_column(String(100))
    administration_route: Mapped[str | None] = mapped_column(String(100), nullable=True)
    duration_days: Mapped[int | None] = mapped_column(Integer, nullable=True)
    diagnosis: Mapped[str | None] = mapped_column(Text, nullable=True)
    indication: Mapped[str | None] = mapped_column(Text, nullable=True)
    treatment_plan: Mapped[str | None] = mapped_column(Text, nullable=True)
    interaction_warnings: Mapped[str | None] = mapped_column(Text, nullable=True)
    printable_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    renewal_count: Mapped[int] = mapped_column(Integer, default=0)
    renewals_used: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[PrescriptionStatus] = mapped_column(
        SqlEnum(PrescriptionStatus),
        default=PrescriptionStatus.ACTIVE,
    )
    prescribed_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    signed_by_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    signed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    clinic: Mapped[int] = mapped_column("clinic", ForeignKey("clinics.id"))
    patient: Mapped["Patient"] = relationship(back_populates="prescriptions")


class StudyOrder(Base):
    __tablename__ = "study_orders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    clinic_id: Mapped[int] = mapped_column(ForeignKey("clinics.id"), index=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id"), index=True)
    appointment_id: Mapped[int | None] = mapped_column(ForeignKey("appointments.id"), nullable=True)
    ordered_by_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    category: Mapped[str] = mapped_column(String(50), default="lab")
    title: Mapped[str] = mapped_column(String(255))
    instructions: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="ordered")
    ordered_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    due_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    results_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    result_files: Mapped[str | None] = mapped_column(Text, nullable=True)
    comparison_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    patient: Mapped["Patient"] = relationship(back_populates="study_orders")
    appointment: Mapped["Appointment | None"] = relationship(back_populates="study_orders")


class ScheduleBlock(Base):
    __tablename__ = "schedule_blocks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    clinic_id: Mapped[int] = mapped_column(ForeignKey("clinics.id"), index=True)
    doctor_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)
    room: Mapped[str | None] = mapped_column(String(50), nullable=True)
    starts_at: Mapped[datetime] = mapped_column(DateTime, index=True)
    ends_at: Mapped[datetime] = mapped_column(DateTime, index=True)
    reason: Mapped[str] = mapped_column(String(255))
    is_all_day: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    clinic_id: Mapped[int] = mapped_column(ForeignKey("clinics.id"), index=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id"), index=True)
    amount: Mapped[float] = mapped_column(Float)
    coverage_amount: Mapped[float | None] = mapped_column(Float, nullable=True)
    patient_amount: Mapped[float | None] = mapped_column(Float, nullable=True)
    status: Mapped[PaymentStatus] = mapped_column(
        SqlEnum(PaymentStatus),
        default=PaymentStatus.PENDING,
    )
    method: Mapped[PaymentMethod] = mapped_column(
        SqlEnum(PaymentMethod),
        default=PaymentMethod.CASH,
    )
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    invoice_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    due_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    paid_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    clinic: Mapped[int] = mapped_column("clinic", ForeignKey("clinics.id"))
    patient: Mapped["Patient"] = relationship(back_populates="payments")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    clinic_id: Mapped[int] = mapped_column(ForeignKey("clinics.id"), index=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)
    action: Mapped[str] = mapped_column(String(100), index=True)
    resource_type: Mapped[str] = mapped_column(String(50), index=True)
    resource_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    old_value: Mapped[str | None] = mapped_column(Text, nullable=True)
    new_value: Mapped[str | None] = mapped_column(Text, nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)

    clinic: Mapped[int] = mapped_column("clinic", ForeignKey("clinics.id"))
