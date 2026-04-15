from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_clinic_id, get_current_user, get_db, require_admin
from app.models.models import Patient, User
from app.schemas.schemas import PatientCreate, PatientOut, PatientUpdate
from app.services.services import (
    count_patients_by_clinic,
    create_patient,
    get_patients_by_clinic,
    get_patient,
    log_audit,
    update_patient,
)

router = APIRouter(prefix="/patients", tags=["patients"])


@router.post("", response_model=PatientOut, status_code=status.HTTP_201_CREATED)
def create_patient_endpoint(
    payload: PatientCreate,
    db: Session = Depends(get_db),
    clinic_id: int = Depends(get_clinic_id),
    current_user: User = Depends(get_current_user),
) -> PatientOut:
    """Create new patient record"""
    patient = create_patient(db, clinic_id, payload)
    log_audit(
        db,
        clinic_id=clinic_id,
        user_id=current_user.id,
        action="CREATE",
        resource_type="Patient",
        resource_id=patient.id,
        new_value=f"Patient: {patient.full_name}",
    )
    return patient


@router.get("", response_model=list[PatientOut])
def list_patients(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    is_active: bool | None = None,
    db: Session = Depends(get_db),
    clinic_id: int = Depends(get_clinic_id),
) -> list[PatientOut]:
    """List all patients in clinic"""
    return get_patients_by_clinic(db, clinic_id, is_active=is_active, skip=skip, limit=limit)


@router.get("/stats", response_model=dict)
def get_patient_stats(
    db: Session = Depends(get_db),
    clinic_id: int = Depends(get_clinic_id),
) -> dict:
    """Get patient statistics"""
    total = count_patients_by_clinic(db, clinic_id)
    return {"total_patients": total}


@router.get("/{patient_id}", response_model=PatientOut)
def get_patient_endpoint(
    patient_id: int,
    db: Session = Depends(get_db),
    clinic_id: int = Depends(get_clinic_id),
) -> PatientOut:
    """Get specific patient"""
    patient = get_patient(db, clinic_id, patient_id)
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
    return patient


@router.put("/{patient_id}", response_model=PatientOut)
def update_patient_endpoint(
    patient_id: int,
    payload: PatientUpdate,
    db: Session = Depends(get_db),
    clinic_id: int = Depends(get_clinic_id),
    current_user: User = Depends(get_current_user),
) -> PatientOut:
    """Update patient"""
    patient = update_patient(db, clinic_id, patient_id, payload)
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
    
    log_audit(
        db,
        clinic_id=clinic_id,
        user_id=current_user.id,
        action="UPDATE",
        resource_type="Patient",
        resource_id=patient.id,
    )
    return patient


@router.delete("/{patient_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    clinic_id: int = Depends(get_clinic_id),
    current_user: User = Depends(require_admin),
) -> None:
    """Soft delete patient (mark as inactive)"""
    patient = get_patient(db, clinic_id, patient_id)
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
    
    update_patient(db, clinic_id, patient_id, PatientUpdate(is_active=False))
    log_audit(
        db,
        clinic_id=clinic_id,
        user_id=current_user.id,
        action="DELETE",
        resource_type="Patient",
        resource_id=patient.id,
    )
