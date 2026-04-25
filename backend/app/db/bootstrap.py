from __future__ import annotations

from datetime import datetime
from pathlib import Path

from sqlalchemy import inspect

from app.core.security import get_password_hash
from app.db.session import SessionLocal, engine
from app.models.models import Base, Clinic, Gender, Patient, User, UserRole

REQUIRED_COLUMNS: dict[str, set[str]] = {
    "clinics": {
        "id",
        "name",
        "slug",
        "email",
        "phone",
        "address",
        "city",
        "country",
        "license_number",
        "subscription_status",
        "created_at",
        "updated_at",
    },
    "users": {
        "id",
        "clinic_id",
        "email",
        "hashed_password",
        "full_name",
        "role",
        "phone",
        "specialty",
        "license_number",
        "is_active",
        "last_login",
        "created_at",
        "updated_at",
    },
    "patients": {
        "id",
        "clinic_id",
        "email",
        "full_name",
        "phone",
        "date_of_birth",
        "gender",
        "document_id",
        "insurance_id",
        "insurance_provider",
        "coverage_plan",
        "address",
        "emergency_contact_name",
        "emergency_contact_phone",
        "visible_allergies",
        "chronic_medications",
        "clinical_alerts",
        "preferred_pharmacy",
        "is_active",
        "created_at",
        "updated_at",
    },
}


def _resolve_sqlite_path() -> Path | None:
    if not engine.url.drivername.startswith("sqlite"):
        return None
    database = engine.url.database
    if not database or database == ":memory:":
        return None
    path = Path(database)
    if not path.is_absolute():
        path = Path.cwd() / path
    return path


def _schema_needs_reset() -> bool:
    try:
        inspector = inspect(engine)
        table_names = set(inspector.get_table_names())
        if not table_names:
            return True

        for table_name, required_columns in REQUIRED_COLUMNS.items():
            if table_name not in table_names:
                return True
            existing_columns = {
                column["name"]
                for column in inspector.get_columns(table_name)
            }
            if not required_columns.issubset(existing_columns):
                return True
    except Exception:
        return True

    return False


def _seed_demo_data() -> None:
    db = SessionLocal()
    try:
        clinic = db.query(Clinic).filter(Clinic.slug == "demo-clinic").first()
        if clinic is None:
            clinic = Clinic(
                name="MediClinic Demo",
                slug="demo-clinic",
                email="admin@clinic.com",
                phone="+1234567890",
                address="123 Medical Street",
                city="San Francisco",
                country="USA",
                license_number="LIC123456",
                subscription_status="active",
            )
            db.add(clinic)
            db.commit()
            db.refresh(clinic)

        existing_users = {
            user.email: user
            for user in db.query(User).filter(User.clinic_id == clinic.id).all()
        }
        demo_users = [
            User(
                email="admin@clinic.com",
                hashed_password=get_password_hash("123456"),
                full_name="Admin User",
                phone="+1111111111",
                role=UserRole.ADMIN,
                specialty=None,
                license_number="ADM-001",
                clinic_id=clinic.id,
                is_active=True,
            ),
            User(
                email="doctor@clinic.com",
                hashed_password=get_password_hash("123456"),
                full_name="Dr. John Doe",
                phone="+2222222222",
                role=UserRole.DOCTOR,
                specialty="Clinica Medica",
                license_number="DOC-001",
                clinic_id=clinic.id,
                is_active=True,
            ),
            User(
                email="receptionist@clinic.com",
                hashed_password=get_password_hash("123456"),
                full_name="Jane Smith",
                phone="+3333333333",
                role=UserRole.RECEPTIONIST,
                specialty=None,
                license_number=None,
                clinic_id=clinic.id,
                is_active=True,
            ),
        ]
        for user in demo_users:
            existing_user = existing_users.get(user.email)
            if existing_user is None:
                db.add(user)
                continue

            existing_user.hashed_password = get_password_hash("123456")
            existing_user.full_name = user.full_name
            existing_user.phone = user.phone
            existing_user.role = user.role
            existing_user.specialty = user.specialty
            existing_user.license_number = user.license_number
            existing_user.is_active = True

        existing_patient_emails = {
            email
            for (email,) in db.query(Patient.email).filter(Patient.clinic_id == clinic.id).all()
        }
        demo_patients = [
            Patient(
                clinic_id=clinic.id,
                full_name="John Patient",
                email="patient1@example.com",
                phone="+4444444444",
                date_of_birth=datetime(1990, 5, 15),
                gender=Gender.MALE,
                document_id="ID123456",
                address="456 Patient Ave",
                visible_allergies="Penicilina",
                chronic_medications="Losartan 50 mg",
                clinical_alerts="Hipertension arterial",
                is_active=True,
            ),
            Patient(
                clinic_id=clinic.id,
                full_name="Jane Patient",
                email="patient2@example.com",
                phone="+5555555555",
                date_of_birth=datetime(1985, 3, 20),
                gender=Gender.FEMALE,
                document_id="ID654321",
                address="789 Patient Lane",
                is_active=True,
            ),
        ]
        for patient in demo_patients:
            if patient.email not in existing_patient_emails:
                db.add(patient)

        db.commit()
    finally:
        db.close()


def bootstrap_local_sqlite() -> None:
    sqlite_path = _resolve_sqlite_path()
    if sqlite_path is None:
        return

    if _schema_needs_reset():
        engine.dispose()
        if sqlite_path.exists():
            sqlite_path.unlink()

    Base.metadata.create_all(bind=engine)
    _seed_demo_data()
