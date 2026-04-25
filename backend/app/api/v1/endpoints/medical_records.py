from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_clinic_id, get_db, require_permission
from app.models.models import User
from app.schemas.schemas import MedicalRecordCreate, MedicalRecordOut, MedicalRecordUpdate
from app.services.services import (
    create_medical_record,
    get_medical_record,
    get_medical_records_by_patient,
    log_audit,
    sign_off_medical_record,
    update_medical_record,
)

router = APIRouter(prefix="/medical-records", tags=["medical_records"])


@router.post("", response_model=MedicalRecordOut, status_code=status.HTTP_201_CREATED)
def create_medical_record_endpoint(
    payload: MedicalRecordCreate,
    db: Session = Depends(get_db),
    clinic_id: int = Depends(get_clinic_id),
    current_user: User = Depends(require_permission("medical_records:write")),
) -> MedicalRecordOut:
    try:
        record = create_medical_record(db, clinic_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    log_audit(
        db,
        clinic_id=clinic_id,
        user_id=current_user.id,
        action="CREATE",
        resource_type="MedicalRecord",
        resource_id=record.id,
    )
    return record


@router.get("/patient/{patient_id}", response_model=list[MedicalRecordOut])
def get_patient_medical_history(
    patient_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    clinic_id: int = Depends(get_clinic_id),
    current_user: User = Depends(require_permission("medical_records:read")),
) -> list[MedicalRecordOut]:
    records = get_medical_records_by_patient(db, clinic_id, patient_id, skip=skip, limit=limit)
    log_audit(
        db,
        clinic_id=clinic_id,
        user_id=current_user.id,
        action="READ",
        resource_type="MedicalRecord",
        resource_id=patient_id,
    )
    return records


@router.get("/{record_id}", response_model=MedicalRecordOut)
def get_medical_record_endpoint(
    record_id: int,
    db: Session = Depends(get_db),
    clinic_id: int = Depends(get_clinic_id),
    current_user: User = Depends(require_permission("medical_records:read")),
) -> MedicalRecordOut:
    record = get_medical_record(db, clinic_id, record_id)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Medical record not found")
    log_audit(
        db,
        clinic_id=clinic_id,
        user_id=current_user.id,
        action="READ",
        resource_type="MedicalRecord",
        resource_id=record.id,
    )
    return record


@router.put("/{record_id}", response_model=MedicalRecordOut)
def update_medical_record_endpoint(
    record_id: int,
    payload: MedicalRecordUpdate,
    db: Session = Depends(get_db),
    clinic_id: int = Depends(get_clinic_id),
    current_user: User = Depends(require_permission("medical_records:write")),
) -> MedicalRecordOut:
    record = update_medical_record(db, clinic_id, record_id, payload)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Medical record not found")
    log_audit(
        db,
        clinic_id=clinic_id,
        user_id=current_user.id,
        action="UPDATE",
        resource_type="MedicalRecord",
        resource_id=record.id,
    )
    return record


@router.post("/{record_id}/sign-off", response_model=MedicalRecordOut)
def sign_medical_record_endpoint(
    record_id: int,
    db: Session = Depends(get_db),
    clinic_id: int = Depends(get_clinic_id),
    current_user: User = Depends(require_permission("medical_records:sign")),
) -> MedicalRecordOut:
    record = sign_off_medical_record(db, clinic_id, record_id, current_user.id)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Medical record not found")
    log_audit(
        db,
        clinic_id=clinic_id,
        user_id=current_user.id,
        action="UPDATE",
        resource_type="MedicalRecordSignOff",
        resource_id=record.id,
    )
    return record
