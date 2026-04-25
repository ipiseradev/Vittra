from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_clinic_id, get_db, require_permission
from app.models.models import User
from app.schemas.schemas import (
    PrescriptionCreate,
    PrescriptionOut,
    PrescriptionPrintableOut,
    PrescriptionUpdate,
)
from app.services.services import (
    create_prescription,
    get_prescriptions_by_patient,
    log_audit,
    render_prescription_html,
    renew_prescription,
    update_prescription,
)

router = APIRouter(prefix="/prescriptions", tags=["prescriptions"])


@router.post("", response_model=PrescriptionOut, status_code=status.HTTP_201_CREATED)
def create_prescription_endpoint(
    payload: PrescriptionCreate,
    db: Session = Depends(get_db),
    clinic_id: int = Depends(get_clinic_id),
    current_user: User = Depends(require_permission("prescriptions:write")),
) -> PrescriptionOut:
    try:
        prescription = create_prescription(
            db,
            clinic_id,
            payload,
            signed_by_user_id=current_user.id,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
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
    current_user: User = Depends(require_permission("prescriptions:read")),
) -> list[PrescriptionOut]:
    _ = current_user
    return get_prescriptions_by_patient(db, clinic_id, patient_id, skip=skip, limit=limit)


@router.put("/{prescription_id}", response_model=PrescriptionOut)
def update_prescription_endpoint(
    prescription_id: int,
    payload: PrescriptionUpdate,
    db: Session = Depends(get_db),
    clinic_id: int = Depends(get_clinic_id),
    current_user: User = Depends(require_permission("prescriptions:write")),
) -> PrescriptionOut:
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


@router.post("/{prescription_id}/renew", response_model=PrescriptionOut)
def renew_prescription_endpoint(
    prescription_id: int,
    db: Session = Depends(get_db),
    clinic_id: int = Depends(get_clinic_id),
    current_user: User = Depends(require_permission("prescriptions:sign")),
) -> PrescriptionOut:
    try:
        prescription = renew_prescription(
            db,
            clinic_id,
            prescription_id,
            signed_by_user_id=current_user.id,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    if not prescription:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prescription not found")
    log_audit(
        db,
        clinic_id=clinic_id,
        user_id=current_user.id,
        action="CREATE",
        resource_type="PrescriptionRenewal",
        resource_id=prescription.id,
    )
    return prescription


@router.get("/{prescription_id}/printable", response_model=PrescriptionPrintableOut)
def get_prescription_printable(
    prescription_id: int,
    db: Session = Depends(get_db),
    clinic_id: int = Depends(get_clinic_id),
    current_user: User = Depends(require_permission("prescriptions:read")),
) -> PrescriptionPrintableOut:
    _ = current_user
    html = render_prescription_html(db, clinic_id, prescription_id)
    if not html:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prescription not found")
    return PrescriptionPrintableOut(id=prescription_id, html=html)
