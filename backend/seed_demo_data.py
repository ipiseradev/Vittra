#!/usr/bin/env python3
"""
Seed script for demo data in Trainity.
Creates sample clinic, users, patients, appointments, and medical records.
"""

import sys
from datetime import datetime, timedelta
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy.orm import Session
from app.db.session import SessionLocal, engine
from app.db.base import Base
from app.models.models import (
    Clinic, User, Patient, Appointment, MedicalRecord, 
    UserRole, Gender, AppointmentStatus, AppointmentType
)
from app.core.security import get_password_hash
from app.schemas.schemas import ClinicCreate, UserCreate, PatientCreate
from app.services.services import create_clinic, create_user, create_patient


def seed_database() -> None:
    """Populate database with demo data."""
    
    # Create tables
    print("📦 Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ Tables created")
    
    db = SessionLocal()
    
    try:
        # Check if data already exists
        existing_clinic = db.query(Clinic).filter_by(slug="demo-clinic").first()
        if existing_clinic:
            print("⚠️  Demo data already exists. Skipping seed.")
            return
        
        print("\n🏥 Creating demo clinic...")
        clinic_data = ClinicCreate(
            name="Clínica Demo",
            slug="demo-clinic",
            email="info@clinicademo.com",
            phone="+34 900 123 456",
            address="Calle Principal 123",
            city="Madrid",
            country="España",
            license_number="LIC-2024-001"
        )
        clinic = create_clinic(db, clinic_data)
        print(f"✅ Clinic created: {clinic.name} (ID: {clinic.id})")
        
        # Users
        print("\n👥 Creating demo users...")
        users_data = [
            {
                "email": "admin@clinic.com",
                "password": "123456",
                "full_name": "Admin User",
                "phone": "+34 900 111 111",
                "role": UserRole.ADMIN,
                "clinic_id": clinic.id,
            },
            {
                "email": "doctor@clinic.com",
                "password": "123456",
                "full_name": "Dr. Juan García",
                "phone": "+34 900 222 222",
                "role": UserRole.DOCTOR,
                "clinic_id": clinic.id,
            },
            {
                "email": "nurse@clinic.com",
                "password": "123456",
                "full_name": "Enfermera María López",
                "phone": "+34 900 333 333",
                "role": UserRole.NURSE,
                "clinic_id": clinic.id,
            },
            {
                "email": "receptionist@clinic.com",
                "password": "123456",
                "full_name": "Recepcionista Carlos Ruiz",
                "phone": "+34 900 444 444",
                "role": UserRole.RECEPTIONIST,
                "clinic_id": clinic.id,
            },
        ]
        
        users = {}
        for user_data in users_data:
            user_create = UserCreate(**user_data)
            user = create_user(db, user_create)
            users[user_data["email"]] = user
            print(f"  ✅ {user.full_name} ({user.role}) - {user.email}")
        
        # Patients
        print("\n🏥 Creating demo patients...")
        patients_data = [
            {
                "full_name": "Pedro Martínez González",
                "email": "pedro@email.com",
                "phone": "600 123 456",
                "date_of_birth": datetime(1985, 5, 15),
                "gender": Gender.MALE,
                "document_id": "12345678A",
                "insurance_id": "INS001",
                "insurance_provider": "Asisa",
                "address": "Calle Salud 10, Madrid",
                "clinic_id": clinic.id,
            },
            {
                "full_name": "Laura Fernández Rodríguez",
                "email": "laura@email.com",
                "phone": "600 234 567",
                "date_of_birth": datetime(1990, 3, 22),
                "gender": Gender.FEMALE,
                "document_id": "87654321B",
                "insurance_id": "INS002",
                "insurance_provider": "Sanitas",
                "address": "Avenida Salud 25, Madrid",
                "clinic_id": clinic.id,
            },
            {
                "full_name": "Miguel Sánchez López",
                "email": "miguel@email.com",
                "phone": "600 345 678",
                "date_of_birth": datetime(1988, 8, 10),
                "gender": Gender.MALE,
                "document_id": "55555555C",
                "insurance_id": "INS003",
                "insurance_provider": "Axa",
                "address": "Plaza Central 5, Madrid",
                "clinic_id": clinic.id,
            },
        ]
        
        patients = {}
        for patient_data in patients_data:
            patient_create = PatientCreate(**patient_data)
            # create_patient expects clinic_id separately
            patient = create_patient(db, clinic.id, patient_create)
            patients[patient_data["email"]] = patient
            print(f"  ✅ {patient.full_name} - {patient.email}")
        
        # Appointments
        print("\n📅 Creating demo appointments...")
        doctor = users["doctor@clinic.com"]
        tomorrow = datetime.now() + timedelta(days=1)
        
        appointments = [
            Appointment(
                clinic_id=clinic.id,
                patient_id=patients["pedro@email.com"].id,
                doctor_id=doctor.id,
                appointment_type=AppointmentType.CONSULTATION,
                status=AppointmentStatus.SCHEDULED,
                appointment_date=tomorrow,
                duration_minutes=30,
                notes="Consulta general de seguimiento",
            ),
            Appointment(
                clinic_id=clinic.id,
                patient_id=patients["laura@email.com"].id,
                doctor_id=doctor.id,
                appointment_type=AppointmentType.CHECKUP,
                status=AppointmentStatus.SCHEDULED,
                appointment_date=tomorrow + timedelta(hours=1),
                duration_minutes=30,
                notes="Chequeo anual",
            ),
            Appointment(
                clinic_id=clinic.id,
                patient_id=patients["miguel@email.com"].id,
                doctor_id=doctor.id,
                appointment_type=AppointmentType.FOLLOW_UP,
                status=AppointmentStatus.COMPLETED,
                appointment_date=datetime.now() - timedelta(days=2),
                duration_minutes=30,
                notes="Seguimiento post-tratamiento",
            ),
        ]
        
        for appt in appointments:
            db.add(appt)
        db.commit()
        print(f"  ✅ {len(appointments)} Appointments created")
        
        # Medical Records
        print("\n📋 Creating demo medical records...")
        pedro = patients["pedro@email.com"]
        
        medical_records = [
            MedicalRecord(
                clinic_id=clinic.id,
                patient_id=pedro.id,
                created_by_id=doctor.id,
                diagnosis="Hipertensión arterial leve",
                treatment="Farmacoterapia + cambios en estilo de vida",
                notes="Paciente con antecedentes de hipertensión familiar. Se recomienda seguimiento mensual.",
                record_date=datetime.now() - timedelta(days=5),
            ),
            MedicalRecord(
                clinic_id=clinic.id,
                patient_id=pedro.id,
                created_by_id=doctor.id,
                diagnosis="Revisión periódica",
                treatment="Análisis de sangre, tensión arterial",
                notes="Parámetros dentro de los rangos normales. Continuar con tratamiento actual.",
                record_date=datetime.now() - timedelta(days=2),
            ),
        ]
        
        for record in medical_records:
            db.add(record)
        db.commit()
        print(f"  ✅ {len(medical_records)} Medical records created")
        
        print("\n" + "="*60)
        print("✅ DEMO DATA SEEDED SUCCESSFULLY!")
        print("="*60)
        print("\n📱 Demo Credentials:")
        print("  Email: admin@clinic.com")
        print("  Password: 123456")
        print("  Clinic ID: 1")
        print("\n👥 Other demo accounts:")
        print("  - doctor@clinic.com (Doctor)")
        print("  - nurse@clinic.com (Nurse)")
        print("  - receptionist@clinic.com (Receptionist)")
        print("  (All with password: 123456)")
        print("\n🚀 Start the server with:")
        print("  uvicorn app.main:app --reload")
        print("\n🌐 Then visit:")
        print("  - Frontend: http://localhost:5173")
        print("  - Backend Docs: http://localhost:8000/docs")
        print("="*60)
        
    except Exception as e:
        print(f"❌ Error during seeding: {str(e)}")
        import traceback
        traceback.print_exc()
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
