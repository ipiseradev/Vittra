from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import (
    get_clinic_id,
    get_current_user,
    get_db,
    require_admin,
    require_doctor,
)
from app.models.models import Appointment, AppointmentStatus, User
from app.schemas.schemas import AppointmentCreate, AppointmentOut, AppointmentUpdate
from app.services.services import (
    create_appointment,
    get_appointment,
    get_appointments_by_doctor,
    get_appointments_by_patient,
    log_audit,
    update_appointment,
)

router = APIRouter(prefix="/appointments", tags=["appointments"])


@router.post("", response_model=AppointmentOut, status_code=status.HTTP_201_CREATED)
def create_appointment_endpoint(
    payload: AppointmentCreate,
    db: Session = Depends(get_db),
    clinic_id: int = Depends(get_clinic_id),
    current_user: User = Depends(get_current_user),
) -> AppointmentOut:
    """Create new appointment"""
    appointment = create_appointment(db, clinic_id, payload)
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
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
    clinic_id: int = Depends(get_clinic_id),
) -> list[AppointmentOut]:
    """List appointments (filterable)"""
    if patient_id:
        return get_appointments_by_patient(db, clinic_id, patient_id, skip=skip, limit=limit)
    elif doctor_id:
        return get_appointments_by_doctor(
            db, clinic_id, doctor_id, status=status_filter, skip=skip, limit=limit
        )
    # Generic list (with filters)
    # TODO: Implement generic filtered list
    return []


@router.get("/{appointment_id}", response_model=AppointmentOut)
def get_appointment_endpoint(
    appointment_id: int,
    db: Session = Depends(get_db),
    clinic_id: int = Depends(get_clinic_id),
) -> AppointmentOut:
    """Get specific appointment"""
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
    current_user: User = Depends(get_current_user),
) -> AppointmentOut:
    """Update appointment"""
    appointment = update_appointment(db, clinic_id, appointment_id, payload)
    if not appointment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")
    
    log_audit(
        db,
        clinic_id=clinic_id,
        user_id=current_user.id,
        action="UPDATE",
        resource_type="Appointment",
        resource_id=appointment.id,
        new_value=f"Status: {payload.status}",
    )
    return appointment


@router.post("/{appointment_id}/complete", response_model=AppointmentOut)
def complete_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    clinic_id: int = Depends(get_clinic_id),
    current_user: User = Depends(require_doctor),
) -> AppointmentOut:
    """Mark appointment as completed"""
    appointment = get_appointment(db, clinic_id, appointment_id)
    if not appointment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")
    
    updated = update_appointment(
        db, clinic_id, appointment_id, AppointmentUpdate(status=AppointmentStatus.COMPLETED)
    )
    log_audit(
        db,
        clinic_id=clinic_id,
        user_id=current_user.id,
        action="UPDATE",
        resource_type="Appointment",
        resource_id=appointment.id,
        new_value="Status: COMPLETED",
    )
    return updated


@router.post("/{appointment_id}/cancel", response_model=AppointmentOut)
def cancel_appointment(
    appointment_id: int,
    reason: str | None = None,
    db: Session = Depends(get_db),
    clinic_id: int = Depends(get_clinic_id),
    current_user: User = Depends(get_current_user),
) -> AppointmentOut:
    """Cancel appointment"""
    appointment = get_appointment(db, clinic_id, appointment_id)
    if not appointment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")
    
    updated = update_appointment(
        db,
        clinic_id,
        appointment_id,
        AppointmentUpdate(
            status=AppointmentStatus.CANCELLED, cancellation_reason=reason
        ),
    )
    log_audit(
        db,
        clinic_id=clinic_id,
        user_id=current_user.id,
        action="UPDATE",
        resource_type="Appointment",
        resource_id=appointment.id,
        new_value=f"Status: CANCELLED (Reason: {reason})",
    )
    return updated
