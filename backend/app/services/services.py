from datetime import datetime

from sqlalchemy import and_, func, select
from sqlalchemy.orm import Session

from app.core.security import get_password_hash, verify_password
from app.models.models import (
    Appointment,
    AppointmentStatus,
    AuditLog,
    Clinic,
    MedicalRecord,
    Patient,
    Payment,
    Prescription,
    User,
    UserRole,
)
from app.schemas.schemas import (
    AppointmentCreate,
    AppointmentUpdate,
    ClinicCreate,
    MedicalRecordCreate,
    MedicalRecordUpdate,
    PatientCreate,
    PatientUpdate,
    PaymentCreate,
    PrescriptionCreate,
    PrescriptionUpdate,
    UserCreate,
)


# ============== CLINIC MANAGEMENT ==============

def create_clinic(db: Session, payload: ClinicCreate) -> Clinic:
    clinic = Clinic(**payload.model_dump())
    db.add(clinic)
    db.commit()
    db.refresh(clinic)
    return clinic


def get_clinic(db: Session, clinic_id: int) -> Clinic | None:
    return db.get(Clinic, clinic_id)


# ============== USER MANAGEMENT ==============

def create_user(db: Session, payload: UserCreate) -> User:
    user = User(
        clinic_id=payload.clinic_id,
        email=payload.email.lower(),
        hashed_password=get_password_hash(payload.password),
        full_name=payload.full_name,
        role=payload.role,
        phone=payload.phone,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def get_user_by_email(db: Session, clinic_id: int, email: str) -> User | None:
    return db.execute(
        select(User).where(
            and_(
                User.clinic_id == clinic_id,
                func.lower(User.email) == email.lower()
            )
        )
    ).scalar_one_or_none()


def authenticate_user(db: Session, clinic_id: int, email: str, password: str) -> User | None:
    user = get_user_by_email(db, clinic_id, email)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


def get_users_by_clinic(db: Session, clinic_id: int, skip: int = 0, limit: int = 100) -> list[User]:
    return db.execute(
        select(User)
        .where(User.clinic_id == clinic_id)
        .offset(skip)
        .limit(limit)
    ).scalars().all()


def update_user_login(db: Session, user_id: int) -> None:
    user = db.get(User, user_id)
    if user:
        user.last_login = datetime.utcnow()
        db.commit()


# ============== PATIENT MANAGEMENT ==============

def create_patient(db: Session, clinic_id: int, payload: PatientCreate) -> Patient:
    patient = Patient(
        clinic_id=clinic_id,
        **payload.model_dump()
    )
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient


def get_patient(db: Session, clinic_id: int, patient_id: int) -> Patient | None:
    return db.execute(
        select(Patient).where(
            and_(
                Patient.clinic_id == clinic_id,
                Patient.id == patient_id
            )
        )
    ).scalar_one_or_none()


def get_patients_by_clinic(
    db: Session, 
    clinic_id: int, 
    is_active: bool | None = None,
    skip: int = 0, 
    limit: int = 100
) -> list[Patient]:
    query = select(Patient).where(Patient.clinic_id == clinic_id)
    if is_active is not None:
        query = query.where(Patient.is_active == is_active)
    return db.execute(
        query.offset(skip).limit(limit)
    ).scalars().all()


def update_patient(db: Session, clinic_id: int, patient_id: int, payload: PatientUpdate) -> Patient | None:
    patient = get_patient(db, clinic_id, patient_id)
    if not patient:
        return None
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(patient, field, value)
    db.commit()
    db.refresh(patient)
    return patient


def count_patients_by_clinic(db: Session, clinic_id: int) -> int:
    return db.scalar(
        select(func.count(Patient.id)).where(Patient.clinic_id == clinic_id)
    ) or 0


# ============== APPOINTMENT MANAGEMENT ==============

def create_appointment(db: Session, clinic_id: int, payload: AppointmentCreate) -> Appointment:
    appointment = Appointment(
        clinic_id=clinic_id,
        **payload.model_dump()
    )
    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    return appointment


def get_appointment(db: Session, clinic_id: int, appointment_id: int) -> Appointment | None:
    return db.execute(
        select(Appointment).where(
            and_(
                Appointment.clinic_id == clinic_id,
                Appointment.id == appointment_id
            )
        )
    ).scalar_one_or_none()


def get_appointments_by_patient(
    db: Session, 
    clinic_id: int, 
    patient_id: int, 
    skip: int = 0, 
    limit: int = 50
) -> list[Appointment]:
    return db.execute(
        select(Appointment)
        .where(
            and_(
                Appointment.clinic_id == clinic_id,
                Appointment.patient_id == patient_id
            )
        )
        .offset(skip)
        .limit(limit)
    ).scalars().all()


def get_appointments_by_doctor(
    db: Session, 
    clinic_id: int, 
    doctor_id: int, 
    status: AppointmentStatus | None = None,
    skip: int = 0, 
    limit: int = 50
) -> list[Appointment]:
    query = select(Appointment).where(
        and_(
            Appointment.clinic_id == clinic_id,
            Appointment.doctor_id == doctor_id
        )
    )
    if status:
        query = query.where(Appointment.status == status)
    return db.execute(
        query.offset(skip).limit(limit)
    ).scalars().all()


def update_appointment(
    db: Session, 
    clinic_id: int, 
    appointment_id: int, 
    payload: AppointmentUpdate
) -> Appointment | None:
    appointment = get_appointment(db, clinic_id, appointment_id)
    if not appointment:
        return None
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(appointment, field, value)
    db.commit()
    db.refresh(appointment)
    return appointment


# ============== MEDICAL RECORDS ==============

def create_medical_record(db: Session, clinic_id: int, payload: MedicalRecordCreate) -> MedicalRecord:
    record = MedicalRecord(
        clinic_id=clinic_id,
        **payload.model_dump()
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def get_medical_record(db: Session, clinic_id: int, record_id: int) -> MedicalRecord | None:
    return db.execute(
        select(MedicalRecord).where(
            and_(
                MedicalRecord.clinic_id == clinic_id,
                MedicalRecord.id == record_id
            )
        )
    ).scalar_one_or_none()


def get_medical_records_by_patient(
    db: Session, 
    clinic_id: int, 
    patient_id: int, 
    skip: int = 0, 
    limit: int = 100
) -> list[MedicalRecord]:
    return db.execute(
        select(MedicalRecord)
        .where(
            and_(
                MedicalRecord.clinic_id == clinic_id,
                MedicalRecord.patient_id == patient_id
            )
        )
        .order_by(MedicalRecord.created_at.desc())
        .offset(skip)
        .limit(limit)
    ).scalars().all()


def update_medical_record(
    db: Session, 
    clinic_id: int, 
    record_id: int, 
    payload: MedicalRecordUpdate
) -> MedicalRecord | None:
    record = get_medical_record(db, clinic_id, record_id)
    if not record:
        return None
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(record, field, value)
    db.commit()
    db.refresh(record)
    return record


# ============== PRESCRIPTIONS ==============

def create_prescription(db: Session, clinic_id: int, payload: PrescriptionCreate) -> Prescription:
    prescription = Prescription(
        clinic_id=clinic_id,
        **payload.model_dump()
    )
    db.add(prescription)
    db.commit()
    db.refresh(prescription)
    return prescription


def get_prescriptions_by_patient(
    db: Session, 
    clinic_id: int, 
    patient_id: int, 
    skip: int = 0, 
    limit: int = 100
) -> list[Prescription]:
    return db.execute(
        select(Prescription)
        .where(
            and_(
                Prescription.clinic_id == clinic_id,
                Prescription.patient_id == patient_id
            )
        )
        .order_by(Prescription.prescribed_at.desc())
        .offset(skip)
        .limit(limit)
    ).scalars().all()


def update_prescription(
    db: Session, 
    clinic_id: int, 
    prescription_id: int, 
    payload: PrescriptionUpdate
) -> Prescription | None:
    prescription = db.execute(
        select(Prescription).where(
            and_(
                Prescription.clinic_id == clinic_id,
                Prescription.id == prescription_id
            )
        )
    ).scalar_one_or_none()
    if not prescription:
        return None
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(prescription, field, value)
    db.commit()
    db.refresh(prescription)
    return prescription


# ============== PAYMENTS ==============

def create_payment(db: Session, clinic_id: int, payload: PaymentCreate) -> Payment:
    payment = Payment(
        clinic_id=clinic_id,
        **payload.model_dump()
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment


def get_payments_by_patient(
    db: Session, 
    clinic_id: int, 
    patient_id: int, 
    skip: int = 0, 
    limit: int = 100
) -> list[Payment]:
    return db.execute(
        select(Payment)
        .where(
            and_(
                Payment.clinic_id == clinic_id,
                Payment.patient_id == patient_id
            )
        )
        .order_by(Payment.created_at.desc())
        .offset(skip)
        .limit(limit)
    ).scalars().all()


def get_clinic_revenue(db: Session, clinic_id: int, month_start: datetime) -> float:
    return db.scalar(
        select(func.coalesce(func.sum(Payment.amount), 0.0))
        .where(
            and_(
                Payment.clinic_id == clinic_id,
                Payment.created_at >= month_start
            )
        )
    ) or 0.0


# ============== AUDIT LOGGING (HIPAA COMPLIANCE) ==============

def log_audit(
    db: Session,
    clinic_id: int,
    user_id: int | None,
    action: str,
    resource_type: str,
    resource_id: int | None,
    old_value: str | None = None,
    new_value: str | None = None,
    ip_address: str | None = None,
) -> AuditLog:
    audit = AuditLog(
        clinic_id=clinic_id,
        user_id=user_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        old_value=old_value,
        new_value=new_value,
        ip_address=ip_address,
    )
    db.add(audit)
    db.commit()
    db.refresh(audit)
    return audit


# ============== DASHBOARD ==============

def get_clinic_dashboard_summary(db: Session, clinic_id: int) -> dict[str, int | float]:
    today = datetime.utcnow().date()
    month_start = today.replace(day=1)

    total_patients = db.scalar(
        select(func.count(Patient.id)).where(Patient.clinic_id == clinic_id)
    ) or 0
    
    total_appointments = db.scalar(
        select(func.count(Appointment.id)).where(Appointment.clinic_id == clinic_id)
    ) or 0
    
    today_appointments = db.scalar(
        select(func.count(Appointment.id)).where(
            and_(
                Appointment.clinic_id == clinic_id,
                func.date(Appointment.scheduled_at) == today
            )
        )
    ) or 0
    
    completed_today = db.scalar(
        select(func.count(Appointment.id)).where(
            and_(
                Appointment.clinic_id == clinic_id,
                func.date(Appointment.scheduled_at) == today,
                Appointment.status == AppointmentStatus.COMPLETED
            )
        )
    ) or 0
    
    monthly_revenue = get_clinic_revenue(db, clinic_id, datetime(
        today.year, today.month, 1
    ))

    return {
        "total_patients": total_patients,
        "total_appointments": total_appointments,
        "today_appointments": today_appointments,
        "completed_today": completed_today,
        "monthly_revenue": float(monthly_revenue),
    }
