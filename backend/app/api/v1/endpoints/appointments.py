from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_clinic_id, get_db, require_permission
from app.models.models import AppointmentStatus, User
from app.schemas.schemas import (
    AppointmentCreate,
    AppointmentOut,
    AppointmentReminderResponse,
    AppointmentUpdate,
)
from app.services.services import (
    check_in_appointment,
    complete_appointment_workflow,
    create_appointment,
    get_appointment,
    get_appointments_by_doctor,
    get_appointments_by_patient,
    list_appointments_by_clinic,
    log_audit,
    mark_appointment_no_show,
    send_appointment_reminder,
    start_consultation,
    update_appointment,
)

router = APIRouter(prefix="/appointments", tags=["appointments"])


@router.post("", response_model=AppointmentOut, status_code=status.HTTP_201_CREATED)
def create_appointment_endpoint(
    payload: AppointmentCreate,
    db: Session = Depends(get_db),
    clinic_id: int = Depends(get_clinic_id),
    current_user: User = Depends(require_permission("appointments:write")),
) -> AppointmentOut:
    try:
        appointment = create_appointment(db, clinic_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    log_audit(
        db,
        clinic_id=clinic_id,
        user_id=current_user.id,
        action="CREATE",
        resource_type="Appointment",
        resource_id=appointment.id,
    )
    return appointment


@router.get("", response_model=list[AppointmentOut])
def list_appointments(
    patient_id: int | None = None,
    doctor_id: int | None = None,
    status_filter: AppointmentStatus | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    include_waitlist: bool = True,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
    clinic_id: int = Depends(get_clinic_id),
    current_user: User = Depends(require_permission("appointments:read")),
) -> list[AppointmentOut]:
    _ = current_user
    if patient_id:
        return get_appointments_by_patient(db, clinic_id, patient_id, skip=skip, limit=limit)
    if doctor_id:
        return get_appointments_by_doctor(
            db,
            clinic_id,
            doctor_id,
            status=status_filter,
            skip=skip,
            limit=limit,
        )
    return list_appointments_by_clinic(
        db,
        clinic_id,
        status=status_filter,
        date_from=date_from,
        date_to=date_to,
        include_waitlist=include_waitlist,
        skip=skip,
        limit=limit,
    )


@router.get("/{appointment_id}", response_model=AppointmentOut)
def get_appointment_endpoint(
    appointment_id: int,
    db: Session = Depends(get_db),
    clinic_id: int = Depends(get_clinic_id),
    current_user: User = Depends(require_permission("appointments:read")),
) -> AppointmentOut:
    _ = current_user
    appointment = get_appointment(db, clinic_id, appointment_id)
    if not appointment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")
    return appointment


@router.put("/{appointment_id}", response_model=AppointmentOut)
def update_appointment_endpoint(
    appointment_id: int,
    payload: AppointmentUpdate,
    db: Session = Depends(get_db),
    clinic_id: int = Depends(get_clinic_id),
    current_user: User = Depends(require_permission("appointments:write")),
) -> AppointmentOut:
    try:
        appointment = update_appointment(db, clinic_id, appointment_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    if not appointment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")

    log_audit(
        db,
        clinic_id=clinic_id,
        user_id=current_user.id,
        action="UPDATE",
        resource_type="Appointment",
        resource_id=appointment.id,
        new_value=f"Status: {appointment.status.value}",
    )
    return appointment


@router.put("/{appointment_id}/check-in", response_model=AppointmentOut)
def check_in_appointment_endpoint(
    appointment_id: int,
    db: Session = Depends(get_db),
    clinic_id: int = Depends(get_clinic_id),
    current_user: User = Depends(require_permission("appointments:check_in")),
) -> AppointmentOut:
    appointment = check_in_appointment(db, clinic_id, appointment_id)
    if not appointment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")
    log_audit(
        db,
        clinic_id=clinic_id,
        user_id=current_user.id,
        action="UPDATE",
        resource_type="AppointmentCheckIn",
        resource_id=appointment.id,
        new_value="Checked in",
    )
    return appointment


@router.put("/{appointment_id}/start-consultation", response_model=AppointmentOut)
def start_consultation_endpoint(
    appointment_id: int,
    db: Session = Depends(get_db),
    clinic_id: int = Depends(get_clinic_id),
    current_user: User = Depends(require_permission("appointments:consultation")),
) -> AppointmentOut:
    appointment = start_consultation(db, clinic_id, appointment_id)
    if not appointment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")
    log_audit(
        db,
        clinic_id=clinic_id,
        user_id=current_user.id,
        action="UPDATE",
        resource_type="AppointmentConsultation",
        resource_id=appointment.id,
        new_value="Consultation started",
    )
    return appointment


@router.post("/{appointment_id}/complete", response_model=AppointmentOut)
def complete_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    clinic_id: int = Depends(get_clinic_id),
    current_user: User = Depends(require_permission("appointments:consultation")),
) -> AppointmentOut:
    appointment = complete_appointment_workflow(db, clinic_id, appointment_id)
    if not appointment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")
    log_audit(
        db,
        clinic_id=clinic_id,
        user_id=current_user.id,
        action="UPDATE",
        resource_type="Appointment",
        resource_id=appointment.id,
        new_value="Status: COMPLETED",
    )
    return appointment


@router.post("/{appointment_id}/cancel", response_model=AppointmentOut)
def cancel_appointment(
    appointment_id: int,
    reason: str | None = None,
    db: Session = Depends(get_db),
    clinic_id: int = Depends(get_clinic_id),
    current_user: User = Depends(require_permission("appointments:write")),
) -> AppointmentOut:
    appointment = update_appointment(
        db,
        clinic_id,
        appointment_id,
        AppointmentUpdate(status=AppointmentStatus.CANCELLED, cancellation_reason=reason),
    )
    if not appointment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")
    log_audit(
        db,
        clinic_id=clinic_id,
        user_id=current_user.id,
        action="UPDATE",
        resource_type="Appointment",
        resource_id=appointment.id,
        new_value=f"Status: CANCELLED (Reason: {reason})",
    )
    return appointment


@router.put("/{appointment_id}/no-show", response_model=AppointmentOut)
def no_show_appointment_endpoint(
    appointment_id: int,
    db: Session = Depends(get_db),
    clinic_id: int = Depends(get_clinic_id),
    current_user: User = Depends(require_permission("appointments:write")),
) -> AppointmentOut:
    appointment = mark_appointment_no_show(db, clinic_id, appointment_id)
    if not appointment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")
    log_audit(
        db,
        clinic_id=clinic_id,
        user_id=current_user.id,
        action="UPDATE",
        resource_type="Appointment",
        resource_id=appointment.id,
        new_value="Status: NO_SHOW",
    )
    return appointment


@router.post("/{appointment_id}/send-reminder", response_model=AppointmentReminderResponse)
def send_reminder(
    appointment_id: int,
    channel: str = Query("whatsapp", min_length=2, max_length=20),
    db: Session = Depends(get_db),
    clinic_id: int = Depends(get_clinic_id),
    current_user: User = Depends(require_permission("appointments:write")),
) -> AppointmentReminderResponse:
    appointment = send_appointment_reminder(db, clinic_id, appointment_id, channel)
    if not appointment or not appointment.reminder_sent_at:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")
    log_audit(
        db,
        clinic_id=clinic_id,
        user_id=current_user.id,
        action="UPDATE",
        resource_type="AppointmentReminder",
        resource_id=appointment.id,
        new_value=f"Reminder via {channel}",
    )
    return AppointmentReminderResponse(
        id=appointment.id,
        reminder_sent_at=appointment.reminder_sent_at,
        reminder_channel=channel,
    )
