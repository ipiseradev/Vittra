from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import (
    get_clinic_id,
    get_current_user,
    get_db,
    require_admin,
)
from app.models.models import PaymentStatus, User
from app.schemas.schemas import (
    PaymentCreate,
    PaymentOut,
    PaymentUpdate,
)
from app.services.services import (
    create_payment,
    get_clinic_revenue,
    get_payments_by_patient,
    log_audit,
)
from datetime import datetime

router = APIRouter(prefix="/payments", tags=["payments"])


@router.post("", response_model=PaymentOut, status_code=status.HTTP_201_CREATED)
def create_payment_endpoint(
    payload: PaymentCreate,
    db: Session = Depends(get_db),
    clinic_id: int = Depends(get_clinic_id),
    current_user: User = Depends(get_current_user),
) -> PaymentOut:
    """Record new payment"""
    payment = create_payment(db, clinic_id, payload)
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


@router.get("/patient/{patient_id}", response_model=list[PaymentOut])
def get_patient_payments(
    patient_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    clinic_id: int = Depends(get_clinic_id),
) -> list[PaymentOut]:
    """Get payment history for patient"""
    return get_payments_by_patient(db, clinic_id, patient_id, skip=skip, limit=limit)


@router.get("/stats/revenue", response_model=dict)
def get_revenue_stats(
    db: Session = Depends(get_db),
    clinic_id: int = Depends(get_clinic_id),
    current_user: User = Depends(require_admin),
) -> dict:
    """Get monthly revenue stats"""
    today = datetime.utcnow().date()
    month_start = datetime(today.year, today.month, 1)
    
    monthly_revenue = get_clinic_revenue(db, clinic_id, month_start)
    
    return {
        "period": f"{today.year}-{today.month:02d}",
        "monthly_revenue": float(monthly_revenue),
    }
