from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_clinic_id, get_db, require_permission
from app.models.models import User
from app.schemas.schemas import PaymentCreate, PaymentOut, PaymentUpdate
from app.services.services import (
    create_payment,
    get_clinic_revenue,
    get_payments_by_patient,
    list_payments_by_clinic,
    log_audit,
    update_payment,
)

router = APIRouter(prefix="/payments", tags=["payments"])


@router.get("", response_model=list[PaymentOut])
def list_payments(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    clinic_id: int = Depends(get_clinic_id),
    current_user: User = Depends(require_permission("payments:read")),
) -> list[PaymentOut]:
    _ = current_user
    return list_payments_by_clinic(db, clinic_id, skip=skip, limit=limit)


@router.post("", response_model=PaymentOut, status_code=status.HTTP_201_CREATED)
def create_payment_endpoint(
    payload: PaymentCreate,
    db: Session = Depends(get_db),
    clinic_id: int = Depends(get_clinic_id),
    current_user: User = Depends(require_permission("payments:write")),
) -> PaymentOut:
    try:
        payment = create_payment(db, clinic_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    log_audit(
        db,
        clinic_id=clinic_id,
        user_id=current_user.id,
        action="CREATE",
        resource_type="Payment",
        resource_id=payment.id,
        new_value=f"Amount: ${payment.amount}, Status: {payment.status}",
    )
    return payment


@router.put("/{payment_id}", response_model=PaymentOut)
def update_payment_endpoint(
    payment_id: int,
    payload: PaymentUpdate,
    db: Session = Depends(get_db),
    clinic_id: int = Depends(get_clinic_id),
    current_user: User = Depends(require_permission("payments:write")),
) -> PaymentOut:
    payment = update_payment(db, clinic_id, payment_id, payload)
    if not payment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")
    log_audit(
        db,
        clinic_id=clinic_id,
        user_id=current_user.id,
        action="UPDATE",
        resource_type="Payment",
        resource_id=payment.id,
        new_value=f"Status: {payment.status}",
    )
    return payment


@router.get("/patient/{patient_id}", response_model=list[PaymentOut])
def get_patient_payments(
    patient_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    clinic_id: int = Depends(get_clinic_id),
    current_user: User = Depends(require_permission("payments:read")),
) -> list[PaymentOut]:
    _ = current_user
    return get_payments_by_patient(db, clinic_id, patient_id, skip=skip, limit=limit)


@router.get("/stats/revenue", response_model=dict)
def get_revenue_stats(
    db: Session = Depends(get_db),
    clinic_id: int = Depends(get_clinic_id),
    current_user: User = Depends(require_permission("payments:read")),
) -> dict:
    _ = current_user
    today = datetime.utcnow().date()
    month_start = datetime(today.year, today.month, 1)
    monthly_revenue = get_clinic_revenue(db, clinic_id, month_start)
    return {
        "period": f"{today.year}-{today.month:02d}",
        "monthly_revenue": float(monthly_revenue),
    }
