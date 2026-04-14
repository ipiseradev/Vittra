from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.security import get_password_hash, verify_password
from app.models.models import (
    Attendance,
    ClassSession,
    Client,
    Payment,
    Reservation,
    ReservationStatus,
    User,
)
from app.schemas.schemas import (
    AttendanceCreate,
    ClassSessionCreate,
    ClientCreate,
    PaymentCreate,
    ReservationCreate,
    UserCreate,
)


def create_user(db: Session, payload: UserCreate) -> User:
    user = User(
        email=payload.email,
        hashed_password=get_password_hash(payload.password),
        full_name=payload.full_name,
        role=payload.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    user = db.execute(select(User).where(User.email == email)).scalar_one_or_none()
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


def create_client(db: Session, payload: ClientCreate) -> Client:
    client = Client(**payload.model_dump())
    db.add(client)
    db.commit()
    db.refresh(client)
    return client


def create_class_session(db: Session, payload: ClassSessionCreate) -> ClassSession:
    session = ClassSession(**payload.model_dump())
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def create_reservation(db: Session, payload: ReservationCreate) -> Reservation:
    reservation = Reservation(**payload.model_dump())
    db.add(reservation)
    db.commit()
    db.refresh(reservation)
    return reservation


def create_attendance(db: Session, payload: AttendanceCreate) -> Attendance:
    attendance = Attendance(**payload.model_dump())
    reservation = db.get(Reservation, payload.reservation_id)
    if reservation:
        reservation.status = ReservationStatus.CHECKED_IN
    db.add(attendance)
    db.commit()
    db.refresh(attendance)
    return attendance


def create_payment(db: Session, payload: PaymentCreate) -> Payment:
    payment = Payment(**payload.model_dump())
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment


def get_dashboard_summary(db: Session) -> dict[str, int | float]:
    today = datetime.utcnow().date()
    month_start = today.replace(day=1)

    total_clients = db.scalar(select(func.count(Client.id))) or 0
    total_sessions = db.scalar(select(func.count(ClassSession.id))) or 0
    active_reservations = (
        db.scalar(
            select(func.count(Reservation.id)).where(
                Reservation.status == ReservationStatus.BOOKED
            )
        )
        or 0
    )
    check_ins_today = (
        db.scalar(
            select(func.count(Attendance.id)).where(func.date(Attendance.checked_in_at) == today)
        )
        or 0
    )
    monthly_revenue = (
        db.scalar(select(func.coalesce(func.sum(Payment.amount), 0.0)).where(Payment.paid_at >= month_start))
        or 0.0
    )

    return {
        "total_clients": total_clients,
        "total_sessions": total_sessions,
        "active_reservations": active_reservations,
        "check_ins_today": check_ins_today,
        "monthly_revenue": float(monthly_revenue),
    }
