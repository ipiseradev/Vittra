#!/usr/bin/env python
"""
Script para inicializar la base de datos con datos de prueba.
"""
import os
import sys
from datetime import datetime, timedelta

# Añade el directorio del backend al path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.config import settings
from app.core.security import get_password_hash
from app.db.session import SessionLocal, engine
from app.models.models import (
    Base,
    Clinic,
    User,
    UserRole,
    Patient,
    Gender,
)


def init_database():
    """Inicializa la base de datos con datos de prueba."""
    # Crear tablas
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Verificar si ya existe data
        clinic_count = db.query(Clinic).count()
        if clinic_count > 0:
            print("✅ Database ya tiene datos. Omitiendo inicialización.")
            return
        
        # Crear clínica por defecto
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
        print(f"✅ Clínica creada: {clinic.name} (ID: {clinic.id})")
        
        # Crear usuarios de prueba
        admin_user = User(
            email="admin@clinic.com",
            hashed_password=get_password_hash("123456"),
            full_name="Admin User",
            phone="+1111111111",
            role=UserRole.ADMIN,
            clinic_id=clinic.id,
            is_active=True,
            last_login=None,
        )
        db.add(admin_user)
        db.commit()
        print(f"✅ Admin creado: {admin_user.email} (Password: 123456)")
        
        # Crear doctor de prueba
        doctor_user = User(
            email="doctor@clinic.com",
            hashed_password=get_password_hash("123456"),
            full_name="Dr. John Doe",
            phone="+2222222222",
            role=UserRole.DOCTOR,
            clinic_id=clinic.id,
            is_active=True,
        )
        db.add(doctor_user)
        db.commit()
        print(f"✅ Doctor creado: {doctor_user.email} (Password: 123456)")
        
        # Crear receptionist
        receptionist_user = User(
            email="receptionist@clinic.com",
            hashed_password=get_password_hash("123456"),
            full_name="Jane Smith",
            phone="+3333333333",
            role=UserRole.RECEPTIONIST,
            clinic_id=clinic.id,
            is_active=True,
        )
        db.add(receptionist_user)
        db.commit()
        print(f"✅ Receptionist creado: {receptionist_user.email} (Password: 123456)")
        
        # Crear pacientes de prueba
        patient1 = Patient(
            clinic_id=clinic.id,
            full_name="John Patient",
            email="patient1@example.com",
            phone="+4444444444",
            date_of_birth=datetime(1990, 5, 15),
            gender=Gender.MALE,
            document_id="ID123456",
            address="456 Patient Ave",
            is_active=True,
        )
        db.add(patient1)
        
        patient2 = Patient(
            clinic_id=clinic.id,
            full_name="Jane Patient",
            email="patient2@example.com",
            phone="+5555555555",
            date_of_birth=datetime(1985, 3, 20),
            gender=Gender.FEMALE,
            document_id="ID654321",
            address="789 Patient Lane",
            is_active=True,
        )
        db.add(patient2)
        db.commit()
        print(f"✅ Pacientes creados: {patient1.full_name}, {patient2.full_name}")
        
        print("\n🎉 Base de datos inicializada exitosamente!")
        print("\n📝 Credenciales de prueba:")
        print("  Admin: admin@clinic.com / 123456")
        print("  Doctor: doctor@clinic.com / 123456")
        print("  Receptionist: receptionist@clinic.com / 123456")
        
    except Exception as e:
        print(f"❌ Error durante inicialización: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    print("🚀 Inicializando base de datos...\n")
    # Asegurarse de que el archivo SQLite existe (se crea automáticamente)
    init_database()
