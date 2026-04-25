from __future__ import annotations

from datetime import datetime, timedelta
from html import escape

from sqlalchemy import and_, func, or_, select
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
    PaymentStatus,
    Prescription,
    PrescriptionStatus,
    ScheduleBlock,
    StudyOrder,
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
    PaymentUpdate,
    PrescriptionCreate,
    PrescriptionUpdate,
    ScheduleBlockCreate,
    StudyOrderCreate,
    StudyOrderUpdate,
    UserCreate,
)


def _legacy_clinic_fields(clinic_id: int) -> dict[str, int]:
    return {"clinic_id": clinic_id, "clinic": clinic_id}


def _split_lines(value: str | None) -> list[str]:
    if not value:
        return []
    return [line.strip() for line in value.splitlines() if line.strip()]


def _appointment_window(start_at: datetime, duration_minutes: int) -> tuple[datetime, datetime]:
    return start_at, start_at + timedelta(minutes=duration_minutes)


def _ranges_overlap(
    left_start: datetime,
    left_end: datetime,
    right_start: datetime,
    right_end: datetime,
) -> bool:
    return left_start < right_end and right_start < left_end


def _ensure_patient_exists(db: Session, clinic_id: int, patient_id: int) -> Patient:
    patient = get_patient(db, clinic_id, patient_id)
    if not patient:
        raise ValueError("Patient not found")
    return patient


def _ensure_doctor_exists(db: Session, clinic_id: int, doctor_id: int) -> User:
    doctor = db.execute(
        select(User).where(
            and_(
                User.clinic_id == clinic_id,
                User.id == doctor_id,
                User.role == UserRole.DOCTOR,
            )
        )
    ).scalar_one_or_none()
    if not doctor:
        raise ValueError("Doctor not found")
    return doctor


def _ensure_appointment_slot_available(
    db: Session,
    clinic_id: int,
    scheduled_at: datetime,
    duration_minutes: int,
    doctor_id: int,
    room: str | None,
    *,
    is_overbooked: bool,
    exclude_appointment_id: int | None = None,
) -> None:
    if is_overbooked:
        return

    window_start, window_end = _appointment_window(scheduled_at, duration_minutes)
    same_day_start = scheduled_at.replace(hour=0, minute=0, second=0, microsecond=0)
    same_day_end = same_day_start + timedelta(days=1)

    appointments = db.execute(
        select(Appointment).where(
            and_(
                Appointment.clinic_id == clinic_id,
                Appointment.scheduled_at >= same_day_start,
                Appointment.scheduled_at < same_day_end,
                Appointment.status != AppointmentStatus.CANCELLED,
            )
        )
    ).scalars().all()

    for item in appointments:
        if exclude_appointment_id and item.id == exclude_appointment_id:
            continue
        item_start, item_end = _appointment_window(item.scheduled_at, item.duration_minutes)
        same_doctor = item.doctor_id == doctor_id
        same_room = bool(room and item.room and item.room == room)
        if (same_doctor or same_room) and _ranges_overlap(window_start, window_end, item_start, item_end):
            raise ValueError("The requested schedule overlaps an existing appointment")

    blocks = db.execute(
        select(ScheduleBlock).where(
            and_(
                ScheduleBlock.clinic_id == clinic_id,
                ScheduleBlock.starts_at < window_end,
                ScheduleBlock.ends_at > window_start,
            )
        )
    ).scalars().all()

    for block in blocks:
        affects_doctor = block.doctor_id is None or block.doctor_id == doctor_id
        affects_room = bool(room and block.room and block.room == room)
        generic_roomless = block.doctor_id is None and block.room is None
        if affects_doctor or affects_room or generic_roomless:
            raise ValueError(f"The requested schedule is blocked: {block.reason}")


def create_clinic(db: Session, payload: ClinicCreate) -> Clinic:
    clinic = Clinic(**payload.model_dump())
    db.add(clinic)
    db.commit()
    db.refresh(clinic)
    return clinic


def get_clinic(db: Session, clinic_id: int) -> Clinic | None:
    return db.get(Clinic, clinic_id)


def create_user(db: Session, payload: UserCreate) -> User:
    user = User(
        clinic_id=payload.clinic_id,
        email=payload.email.lower(),
        hashed_password=get_password_hash(payload.password),
        full_name=payload.full_name,
        role=payload.role,
        phone=payload.phone,
        specialty=payload.specialty,
        license_number=payload.license_number,
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
                func.lower(User.email) == email.lower(),
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
        select(User).where(User.clinic_id == clinic_id).offset(skip).limit(limit)
    ).scalars().all()


def list_doctors_by_clinic(
    db: Session,
    clinic_id: int,
    *,
    is_active: bool | None = True,
) -> list[User]:
    query = select(User).where(
        and_(
            User.clinic_id == clinic_id,
            User.role == UserRole.DOCTOR,
        )
    )
    if is_active is not None:
        query = query.where(User.is_active == is_active)
    return db.execute(query.order_by(User.full_name.asc())).scalars().all()


def update_user_login(db: Session, user_id: int) -> None:
    user = db.get(User, user_id)
    if user:
        user.last_login = datetime.utcnow()
        db.commit()


def create_patient(db: Session, clinic_id: int, payload: PatientCreate) -> Patient:
    patient = Patient(clinic_id=clinic_id, **payload.model_dump())
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient


def get_patient(db: Session, clinic_id: int, patient_id: int) -> Patient | None:
    return db.execute(
        select(Patient).where(
            and_(
                Patient.clinic_id == clinic_id,
                Patient.id == patient_id,
            )
        )
    ).scalar_one_or_none()


def get_patients_by_clinic(
    db: Session,
    clinic_id: int,
    *,
    search: str | None = None,
    is_active: bool | None = None,
    skip: int = 0,
    limit: int = 100,
) -> list[Patient]:
    query = select(Patient).where(Patient.clinic_id == clinic_id)
    if is_active is not None:
        query = query.where(Patient.is_active == is_active)
    if search:
        term = f"%{search.lower()}%"
        query = query.where(
            or_(
                func.lower(Patient.full_name).like(term),
                func.lower(Patient.email).like(term),
                func.lower(func.coalesce(Patient.phone, "")).like(term),
                func.lower(func.coalesce(Patient.document_id, "")).like(term),
            )
        )
    return db.execute(
        query.order_by(Patient.full_name.asc()).offset(skip).limit(limit)
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
    return db.scalar(select(func.count(Patient.id)).where(Patient.clinic_id == clinic_id)) or 0


def create_appointment(db: Session, clinic_id: int, payload: AppointmentCreate) -> Appointment:
    _ensure_patient_exists(db, clinic_id, payload.patient_id)
    _ensure_doctor_exists(db, clinic_id, payload.doctor_id)
    _ensure_appointment_slot_available(
        db,
        clinic_id,
        payload.scheduled_at,
        payload.duration_minutes,
        payload.doctor_id,
        payload.room,
        is_overbooked=payload.is_overbooked,
    )
    appointment = Appointment(
        **_legacy_clinic_fields(clinic_id),
        workflow_stage="scheduled",
        **payload.model_dump(),
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
                Appointment.id == appointment_id,
            )
        )
    ).scalar_one_or_none()


def get_appointments_by_patient(
    db: Session,
    clinic_id: int,
    patient_id: int,
    *,
    skip: int = 0,
    limit: int = 50,
) -> list[Appointment]:
    return db.execute(
        select(Appointment)
        .where(
            and_(
                Appointment.clinic_id == clinic_id,
                Appointment.patient_id == patient_id,
            )
        )
        .order_by(Appointment.scheduled_at.desc())
        .offset(skip)
        .limit(limit)
    ).scalars().all()


def get_appointments_by_doctor(
    db: Session,
    clinic_id: int,
    doctor_id: int,
    *,
    status: AppointmentStatus | None = None,
    skip: int = 0,
    limit: int = 50,
) -> list[Appointment]:
    query = select(Appointment).where(
        and_(
            Appointment.clinic_id == clinic_id,
            Appointment.doctor_id == doctor_id,
        )
    )
    if status:
        query = query.where(Appointment.status == status)
    return db.execute(
        query.order_by(Appointment.scheduled_at.asc()).offset(skip).limit(limit)
    ).scalars().all()


def list_appointments_by_clinic(
    db: Session,
    clinic_id: int,
    *,
    status: AppointmentStatus | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    include_waitlist: bool = True,
    skip: int = 0,
    limit: int = 50,
) -> list[Appointment]:
    query = select(Appointment).where(Appointment.clinic_id == clinic_id)
    if status is not None:
        query = query.where(Appointment.status == status)
    if date_from is not None:
        query = query.where(Appointment.scheduled_at >= date_from)
    if date_to is not None:
        query = query.where(Appointment.scheduled_at <= date_to)
    if not include_waitlist:
        query = query.where(Appointment.is_waitlist.is_(False))
    return db.execute(
        query.order_by(Appointment.scheduled_at.asc()).offset(skip).limit(limit)
    ).scalars().all()


def update_appointment(
    db: Session,
    clinic_id: int,
    appointment_id: int,
    payload: AppointmentUpdate,
) -> Appointment | None:
    appointment = get_appointment(db, clinic_id, appointment_id)
    if not appointment:
        return None

    updates = payload.model_dump(exclude_unset=True)
    new_scheduled_at = updates.get("scheduled_at", appointment.scheduled_at)
    new_duration = updates.get("duration_minutes", appointment.duration_minutes)
    new_doctor_id = appointment.doctor_id
    new_room = updates.get("room", appointment.room)
    new_is_overbooked = updates.get("is_overbooked", appointment.is_overbooked)
    if (
        "scheduled_at" in updates
        or "duration_minutes" in updates
        or "room" in updates
        or "is_overbooked" in updates
    ):
        _ensure_appointment_slot_available(
            db,
            clinic_id,
            new_scheduled_at,
            new_duration,
            new_doctor_id,
            new_room,
            is_overbooked=new_is_overbooked,
            exclude_appointment_id=appointment.id,
        )

    for field, value in updates.items():
        setattr(appointment, field, value)
    if "status" in updates and updates["status"] == AppointmentStatus.COMPLETED:
        appointment.consultation_completed_at = datetime.utcnow()
        appointment.workflow_stage = "completed"
    elif "status" in updates and updates["status"] == AppointmentStatus.CANCELLED:
        appointment.workflow_stage = "cancelled"
    elif "status" in updates and updates["status"] == AppointmentStatus.NO_SHOW:
        appointment.workflow_stage = "no_show"
    db.commit()
    db.refresh(appointment)
    return appointment


def check_in_appointment(db: Session, clinic_id: int, appointment_id: int) -> Appointment | None:
    appointment = get_appointment(db, clinic_id, appointment_id)
    if not appointment:
        return None
    appointment.checked_in_at = datetime.utcnow()
    appointment.workflow_stage = "checked_in"
    db.commit()
    db.refresh(appointment)
    return appointment


def start_consultation(db: Session, clinic_id: int, appointment_id: int) -> Appointment | None:
    appointment = get_appointment(db, clinic_id, appointment_id)
    if not appointment:
        return None
    if appointment.checked_in_at is None:
        appointment.checked_in_at = datetime.utcnow()
    appointment.consultation_started_at = datetime.utcnow()
    appointment.workflow_stage = "in_consultation"
    db.commit()
    db.refresh(appointment)
    return appointment


def complete_appointment_workflow(db: Session, clinic_id: int, appointment_id: int) -> Appointment | None:
    appointment = get_appointment(db, clinic_id, appointment_id)
    if not appointment:
        return None
    now = datetime.utcnow()
    if appointment.checked_in_at is None:
        appointment.checked_in_at = now
    if appointment.consultation_started_at is None:
        appointment.consultation_started_at = now
    appointment.consultation_completed_at = now
    appointment.status = AppointmentStatus.COMPLETED
    appointment.workflow_stage = "completed"
    db.commit()
    db.refresh(appointment)
    return appointment


def mark_appointment_no_show(db: Session, clinic_id: int, appointment_id: int) -> Appointment | None:
    appointment = get_appointment(db, clinic_id, appointment_id)
    if not appointment:
        return None
    appointment.status = AppointmentStatus.NO_SHOW
    appointment.workflow_stage = "no_show"
    db.commit()
    db.refresh(appointment)
    return appointment


def send_appointment_reminder(
    db: Session,
    clinic_id: int,
    appointment_id: int,
    channel: str,
) -> Appointment | None:
    appointment = get_appointment(db, clinic_id, appointment_id)
    if not appointment:
        return None
    appointment.reminder_channel = channel
    appointment.reminder_sent_at = datetime.utcnow()
    db.commit()
    db.refresh(appointment)
    return appointment


def create_schedule_block(db: Session, clinic_id: int, payload: ScheduleBlockCreate) -> ScheduleBlock:
    block = ScheduleBlock(clinic_id=clinic_id, **payload.model_dump())
    db.add(block)
    db.commit()
    db.refresh(block)
    return block


def list_schedule_blocks(
    db: Session,
    clinic_id: int,
    *,
    doctor_id: int | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
) -> list[ScheduleBlock]:
    query = select(ScheduleBlock).where(ScheduleBlock.clinic_id == clinic_id)
    if doctor_id is not None:
        query = query.where(
            or_(
                ScheduleBlock.doctor_id == doctor_id,
                ScheduleBlock.doctor_id.is_(None),
            )
        )
    if date_from is not None:
        query = query.where(ScheduleBlock.ends_at >= date_from)
    if date_to is not None:
        query = query.where(ScheduleBlock.starts_at <= date_to)
    return db.execute(query.order_by(ScheduleBlock.starts_at.asc())).scalars().all()


def create_medical_record(db: Session, clinic_id: int, payload: MedicalRecordCreate) -> MedicalRecord:
    _ensure_patient_exists(db, clinic_id, payload.patient_id)
    if payload.appointment_id:
        appointment = get_appointment(db, clinic_id, payload.appointment_id)
        if not appointment:
            raise ValueError("Appointment not found")
    record = MedicalRecord(**_legacy_clinic_fields(clinic_id), **payload.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def get_medical_record(db: Session, clinic_id: int, record_id: int) -> MedicalRecord | None:
    return db.execute(
        select(MedicalRecord).where(
            and_(
                MedicalRecord.clinic_id == clinic_id,
                MedicalRecord.id == record_id,
            )
        )
    ).scalar_one_or_none()


def get_medical_records_by_patient(
    db: Session,
    clinic_id: int,
    patient_id: int,
    *,
    skip: int = 0,
    limit: int = 100,
) -> list[MedicalRecord]:
    return db.execute(
        select(MedicalRecord)
        .where(
            and_(
                MedicalRecord.clinic_id == clinic_id,
                MedicalRecord.patient_id == patient_id,
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
    payload: MedicalRecordUpdate,
) -> MedicalRecord | None:
    record = get_medical_record(db, clinic_id, record_id)
    if not record:
        return None
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(record, field, value)
    db.commit()
    db.refresh(record)
    return record


def sign_off_medical_record(
    db: Session,
    clinic_id: int,
    record_id: int,
    user_id: int,
) -> MedicalRecord | None:
    record = get_medical_record(db, clinic_id, record_id)
    if not record:
        return None
    record.signed_off_by_user_id = user_id
    record.signed_off_at = datetime.utcnow()
    db.commit()
    db.refresh(record)
    return record


def _build_prescription_warnings(patient: Patient, medication_name: str) -> str | None:
    warnings: list[str] = []
    if patient.visible_allergies:
        warnings.append(f"Revisar alergias declaradas: {patient.visible_allergies}")
    if patient.chronic_medications:
        warnings.append(f"Verificar interacciones con medicacion cronica: {patient.chronic_medications}")
    if patient.visible_allergies and medication_name.lower() in patient.visible_allergies.lower():
        warnings.append("El medicamento coincide con una alergia visible del paciente.")
    return "\n".join(warnings) if warnings else None


def create_prescription(
    db: Session,
    clinic_id: int,
    payload: PrescriptionCreate,
    *,
    signed_by_user_id: int | None = None,
) -> Prescription:
    patient = _ensure_patient_exists(db, clinic_id, payload.patient_id)
    prescription = Prescription(
        **_legacy_clinic_fields(clinic_id),
        **payload.model_dump(),
        interaction_warnings=_build_prescription_warnings(patient, payload.medication_name),
        signed_by_user_id=signed_by_user_id,
        signed_at=datetime.utcnow() if signed_by_user_id else None,
    )
    db.add(prescription)
    db.commit()
    db.refresh(prescription)
    return prescription


def get_prescription(db: Session, clinic_id: int, prescription_id: int) -> Prescription | None:
    return db.execute(
        select(Prescription).where(
            and_(
                Prescription.clinic_id == clinic_id,
                Prescription.id == prescription_id,
            )
        )
    ).scalar_one_or_none()


def get_prescriptions_by_patient(
    db: Session,
    clinic_id: int,
    patient_id: int,
    *,
    skip: int = 0,
    limit: int = 100,
) -> list[Prescription]:
    return db.execute(
        select(Prescription)
        .where(
            and_(
                Prescription.clinic_id == clinic_id,
                Prescription.patient_id == patient_id,
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
    payload: PrescriptionUpdate,
) -> Prescription | None:
    prescription = get_prescription(db, clinic_id, prescription_id)
    if not prescription:
        return None
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(prescription, field, value)
    if "medication_name" in payload.model_dump(exclude_unset=True):
        patient = _ensure_patient_exists(db, clinic_id, prescription.patient_id)
        prescription.interaction_warnings = _build_prescription_warnings(
            patient,
            prescription.medication_name,
        )
    db.commit()
    db.refresh(prescription)
    return prescription


def renew_prescription(
    db: Session,
    clinic_id: int,
    prescription_id: int,
    *,
    signed_by_user_id: int | None = None,
) -> Prescription | None:
    prescription = get_prescription(db, clinic_id, prescription_id)
    if not prescription:
        return None
    if prescription.renewals_used >= prescription.renewal_count:
        raise ValueError("No renewals remaining for this prescription")
    prescription.renewals_used += 1
    clone = Prescription(
        **_legacy_clinic_fields(clinic_id),
        patient_id=prescription.patient_id,
        appointment_id=prescription.appointment_id,
        medication_name=prescription.medication_name,
        dosage=prescription.dosage,
        frequency=prescription.frequency,
        administration_route=prescription.administration_route,
        duration_days=prescription.duration_days,
        diagnosis=prescription.diagnosis,
        indication=prescription.indication,
        treatment_plan=prescription.treatment_plan,
        interaction_warnings=prescription.interaction_warnings,
        printable_notes=prescription.printable_notes,
        renewal_count=max(prescription.renewal_count - prescription.renewals_used, 0),
        renewals_used=0,
        status=PrescriptionStatus.ACTIVE,
        prescribed_at=datetime.utcnow(),
        signed_by_user_id=signed_by_user_id,
        signed_at=datetime.utcnow() if signed_by_user_id else None,
    )
    db.add(clone)
    db.commit()
    db.refresh(clone)
    return clone


def render_prescription_html(
    db: Session,
    clinic_id: int,
    prescription_id: int,
) -> str | None:
    prescription = get_prescription(db, clinic_id, prescription_id)
    if not prescription:
        return None
    patient = _ensure_patient_exists(db, clinic_id, prescription.patient_id)
    doctor_name = "Profesional tratante"
    if prescription.signed_by_user_id:
        signer = db.get(User, prescription.signed_by_user_id)
        if signer:
            doctor_name = signer.full_name
    notes = escape(prescription.printable_notes or prescription.treatment_plan or "")
    warnings = "<br/>".join(escape(line) for line in _split_lines(prescription.interaction_warnings))
    return f"""
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Receta #{prescription.id}</title>
        <style>
          body {{ font-family: Arial, sans-serif; margin: 32px; color: #0f172a; }}
          h1, h2 {{ margin: 0 0 12px; }}
          .card {{ border: 1px solid #cbd5e1; border-radius: 16px; padding: 20px; margin-top: 16px; }}
          .muted {{ color: #64748b; font-size: 12px; }}
        </style>
      </head>
      <body>
        <h1>Receta medica</h1>
        <p class="muted">Paciente: {escape(patient.full_name)} | Fecha: {prescription.prescribed_at.strftime("%d/%m/%Y %H:%M")}</p>
        <div class="card">
          <h2>{escape(prescription.medication_name)}</h2>
          <p><strong>Dosis:</strong> {escape(prescription.dosage)}</p>
          <p><strong>Frecuencia:</strong> {escape(prescription.frequency)}</p>
          <p><strong>Via:</strong> {escape(prescription.administration_route or "No indicada")}</p>
          <p><strong>Duracion:</strong> {prescription.duration_days or 0} dias</p>
          <p><strong>Indicacion:</strong> {escape(prescription.indication or "No indicada")}</p>
          <p><strong>Plan:</strong> {escape(prescription.treatment_plan or "No indicado")}</p>
          <p><strong>Observaciones:</strong> {notes or "Sin observaciones"}</p>
        </div>
        <div class="card">
          <h2>Alertas clinicas</h2>
          <p>{warnings or "Sin alertas generadas"}</p>
        </div>
        <div class="card">
          <h2>Firma</h2>
          <p>{escape(doctor_name)}</p>
          <p class="muted">{escape(prescription.signed_at.isoformat()) if prescription.signed_at else "Pendiente de firma"}</p>
        </div>
      </body>
    </html>
    """.strip()


def create_study_order(
    db: Session,
    clinic_id: int,
    payload: StudyOrderCreate,
    *,
    ordered_by_user_id: int | None = None,
) -> StudyOrder:
    _ensure_patient_exists(db, clinic_id, payload.patient_id)
    study = StudyOrder(
        clinic_id=clinic_id,
        ordered_by_user_id=ordered_by_user_id,
        **payload.model_dump(),
    )
    db.add(study)
    db.commit()
    db.refresh(study)
    return study


def get_study_order(db: Session, clinic_id: int, study_id: int) -> StudyOrder | None:
    return db.execute(
        select(StudyOrder).where(
            and_(
                StudyOrder.clinic_id == clinic_id,
                StudyOrder.id == study_id,
            )
        )
    ).scalar_one_or_none()


def list_study_orders_by_patient(
    db: Session,
    clinic_id: int,
    patient_id: int,
    *,
    status: str | None = None,
    skip: int = 0,
    limit: int = 100,
) -> list[StudyOrder]:
    query = select(StudyOrder).where(
        and_(
            StudyOrder.clinic_id == clinic_id,
            StudyOrder.patient_id == patient_id,
        )
    )
    if status:
        query = query.where(StudyOrder.status == status)
    return db.execute(
        query.order_by(StudyOrder.ordered_at.desc()).offset(skip).limit(limit)
    ).scalars().all()


def update_study_order(
    db: Session,
    clinic_id: int,
    study_id: int,
    payload: StudyOrderUpdate,
) -> StudyOrder | None:
    study = get_study_order(db, clinic_id, study_id)
    if not study:
        return None
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(study, field, value)
    db.commit()
    db.refresh(study)
    return study


def create_payment(db: Session, clinic_id: int, payload: PaymentCreate) -> Payment:
    _ensure_patient_exists(db, clinic_id, payload.patient_id)
    payment_data = payload.model_dump()
    if payment_data["patient_amount"] is None:
        payment_data["patient_amount"] = payment_data["amount"]
    payment = Payment(**_legacy_clinic_fields(clinic_id), **payment_data)
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment


def update_payment(
    db: Session,
    clinic_id: int,
    payment_id: int,
    payload: PaymentUpdate,
) -> Payment | None:
    payment = db.execute(
        select(Payment).where(
            and_(
                Payment.clinic_id == clinic_id,
                Payment.id == payment_id,
            )
        )
    ).scalar_one_or_none()
    if not payment:
        return None
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(payment, field, value)
    if payment.status == PaymentStatus.PAID and payment.paid_at is None:
        payment.paid_at = datetime.utcnow()
    db.commit()
    db.refresh(payment)
    return payment


def get_payments_by_patient(
    db: Session,
    clinic_id: int,
    patient_id: int,
    *,
    skip: int = 0,
    limit: int = 100,
) -> list[Payment]:
    return db.execute(
        select(Payment)
        .where(
            and_(
                Payment.clinic_id == clinic_id,
                Payment.patient_id == patient_id,
            )
        )
        .order_by(Payment.created_at.desc())
        .offset(skip)
        .limit(limit)
    ).scalars().all()


def list_payments_by_clinic(db: Session, clinic_id: int, *, skip: int = 0, limit: int = 100) -> list[Payment]:
    return db.execute(
        select(Payment)
        .where(Payment.clinic_id == clinic_id)
        .order_by(Payment.created_at.desc())
        .offset(skip)
        .limit(limit)
    ).scalars().all()


def get_clinic_revenue(db: Session, clinic_id: int, month_start: datetime) -> float:
    return db.scalar(
        select(func.coalesce(func.sum(Payment.amount), 0.0)).where(
            and_(
                Payment.clinic_id == clinic_id,
                Payment.status == PaymentStatus.PAID,
                Payment.created_at >= month_start,
            )
        )
    ) or 0.0


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
        **_legacy_clinic_fields(clinic_id),
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


def safe_log_audit(
    db: Session,
    clinic_id: int,
    user_id: int | None,
    action: str,
    resource_type: str,
    resource_id: int | None,
    old_value: str | None = None,
    new_value: str | None = None,
    ip_address: str | None = None,
) -> AuditLog | None:
    try:
        return log_audit(
            db=db,
            clinic_id=clinic_id,
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            old_value=old_value,
            new_value=new_value,
            ip_address=ip_address,
        )
    except Exception:
        db.rollback()
        return None


def get_patient_360(db: Session, clinic_id: int, patient_id: int) -> dict[str, object] | None:
    patient = get_patient(db, clinic_id, patient_id)
    if not patient:
        return None

    upcoming_appointments = db.execute(
        select(Appointment)
        .where(
            and_(
                Appointment.clinic_id == clinic_id,
                Appointment.patient_id == patient_id,
                Appointment.status.in_((AppointmentStatus.SCHEDULED, AppointmentStatus.RESCHEDULED)),
                Appointment.scheduled_at >= datetime.utcnow(),
            )
        )
        .order_by(Appointment.scheduled_at.asc())
        .limit(10)
    ).scalars().all()

    recent_medical_records = get_medical_records_by_patient(db, clinic_id, patient_id, limit=5)
    active_prescriptions = db.execute(
        select(Prescription)
        .where(
            and_(
                Prescription.clinic_id == clinic_id,
                Prescription.patient_id == patient_id,
                Prescription.status == PrescriptionStatus.ACTIVE,
            )
        )
        .order_by(Prescription.prescribed_at.desc())
        .limit(10)
    ).scalars().all()
    pending_studies = db.execute(
        select(StudyOrder)
        .where(
            and_(
                StudyOrder.clinic_id == clinic_id,
                StudyOrder.patient_id == patient_id,
                StudyOrder.status.in_(("ordered", "in_progress")),
            )
        )
        .order_by(StudyOrder.ordered_at.desc())
        .limit(10)
    ).scalars().all()
    payments = get_payments_by_patient(db, clinic_id, patient_id, limit=10)

    latest_diagnoses = [
        record.diagnosis
        for record in recent_medical_records
        if record.diagnosis
    ][:5]

    alerts = _split_lines(patient.clinical_alerts)
    if patient.visible_allergies:
        alerts.append(f"Alergias visibles: {patient.visible_allergies}")
    if patient.chronic_medications:
        alerts.append(f"Medicacion cronica: {patient.chronic_medications}")

    pending_balance = sum(
        (payment.patient_amount or payment.amount)
        for payment in payments
        if payment.status == PaymentStatus.PENDING
    )
    total_paid = sum(payment.amount for payment in payments if payment.status == PaymentStatus.PAID)
    total_billed = sum(payment.amount for payment in payments)

    documents: list[str] = []
    for record in recent_medical_records:
        documents.extend(_split_lines(record.attachments))
    for study in pending_studies:
        documents.extend(_split_lines(study.result_files))

    return {
        "patient": patient,
        "alerts": alerts,
        "debt_summary": {
            "pending_balance": float(pending_balance),
            "total_paid": float(total_paid),
            "total_billed": float(total_billed),
        },
        "latest_diagnoses": latest_diagnoses,
        "upcoming_appointments": upcoming_appointments,
        "recent_medical_records": recent_medical_records,
        "active_prescriptions": active_prescriptions,
        "pending_studies": pending_studies,
        "payments": payments,
        "documents": documents,
    }


def get_clinic_dashboard_summary(db: Session, clinic_id: int) -> dict[str, int | float]:
    today = datetime.utcnow().date()
    month_start = datetime(today.year, today.month, 1)

    total_patients = db.scalar(
        select(func.count(Patient.id)).where(Patient.clinic_id == clinic_id)
    ) or 0
    total_appointments = db.scalar(
        select(func.count(Appointment.id)).where(Appointment.clinic_id == clinic_id)
    ) or 0
    checked_in_today = db.scalar(
        select(func.count(Appointment.id)).where(
            and_(
                Appointment.clinic_id == clinic_id,
                func.date(Appointment.scheduled_at) == today,
                Appointment.checked_in_at.is_not(None),
            )
        )
    ) or 0
    completed_today = db.scalar(
        select(func.count(Appointment.id)).where(
            and_(
                Appointment.clinic_id == clinic_id,
                func.date(Appointment.scheduled_at) == today,
                Appointment.status == AppointmentStatus.COMPLETED,
            )
        )
    ) or 0
    pending_studies = db.scalar(
        select(func.count(StudyOrder.id)).where(
            and_(
                StudyOrder.clinic_id == clinic_id,
                StudyOrder.status.in_(("ordered", "in_progress")),
            )
        )
    ) or 0
    monthly_revenue = get_clinic_revenue(db, clinic_id, month_start)

    return {
        "total_patients": total_patients,
        "total_appointments": total_appointments,
        "checked_in_today": checked_in_today,
        "completed_today": completed_today,
        "pending_studies": pending_studies,
        "monthly_revenue": float(monthly_revenue),
    }
