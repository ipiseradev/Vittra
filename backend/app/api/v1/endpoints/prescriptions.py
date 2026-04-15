from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import (
    get_clinic_id,
    get_current_user,
    get_db,
    require_doctor,
)
from app.models.models import User
from app.schemas.schemas import (
    PrescriptionCreate,
    PrescriptionOut,
    PrescriptionUpdate,
)
from app.services.services import (
    create_prescription,
    get_prescriptions_by_patient,
    log_audit,
    update_prescription,
)

router = APIRouter(prefix="/prescriptions", tags=["prescriptions"])


@router.post("", response_model=PrescriptionOut, status_code=status.HTTP_201_CREATED)
def create_prescription_endpoint(
    payload: PrescriptionCreate,
    db: Session = Depends(get_db),
    clinic_id: int = Depends(get_clinic_id),
    current_user: User = Depends(require_doctor),
) -> PrescriptionOut:
    """Create new prescription"""
    prescription = create_prescription(db, clinic_id, payload)
    log_audit(
        db,
        clinic_id=clinic_id,
        user_id=current_user.id,
        action="CREATE",
        resource_type="Prescription",
        resource_id=prescription.id,
    )
    return prescription


@router.get("/patient/{patient_id}", response_model=list[PrescriptionOut])
def get_patient_prescriptions(
    patient_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    clinic_id: int = Depends(get_clinic_id),
) -> list[PrescriptionOut]:
    """Get prescriptions for patient"""
    return get_prescriptions_by_patient(db, clinic_id, patient_id, skip=skip, limit=limit)


@router.put("/{prescription_id}", response_model=PrescriptionOut)
def update_prescription_endpoint(
    prescription_id: int,
    payload: PrescriptionUpdate,
    db: Session = Depends(get_db),
    clinic_id: int = Depends(get_clinic_id),
    current_user: User = Depends(require_doctor),
) -> PrescriptionOut:
    """Update prescription"""
    prescription = update_prescription(db, clinic_id, prescription_id, payload)
    if not prescription:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prescription not found")
    
    log_audit(
        db,
        clinic_id=clinic_id,
        user_id=current_user.id,
        action="UPDATE",
        resource_type="Prescription",
        resource_id=prescription.id,
    )
    return prescription
