#!/usr/bin/env python3
"""
Script para resetear el usuario admin de demostración.
Se conecta a la base SQLite mediclinic.db y crea/actualiza el usuario admin.
"""

import sys
from pathlib import Path

# Add backend to path to allow imports from app
backend_path = Path(__file__).parent.parent
sys.path.insert(0, str(backend_path))

from app.core.security import get_password_hash, verify_password
from app.db.session import SessionLocal
from app.models.models import User, UserRole


def reset_demo_user():
    """Reset el usuario admin de demostración."""
    db = SessionLocal()

    try:
        # Eliminar usuario anterior si existe
        existing = db.query(User).filter(User.email == "admin@clinic.com").first()
        if existing:
            db.delete(existing)
            db.commit()
            print("🗑️  Usuario anterior eliminado")

        # Crear nuevo usuario admin
        password = "123456"
        hashed_pw = get_password_hash(password)
        
        user = User(
            email="admin@clinic.com",
            hashed_password=hashed_pw,
            full_name="Administrador Demo",
            clinic_id=1,
            role=UserRole.ADMIN,
            is_active=True
        )
        
        db.add(user)
        db.commit()
        db.refresh(user)

        print("✅ Usuario admin creado exitosamente:")
        print(f"   📧 Email: {user.email}")
        print(f"   🔐 Contraseña: {password}")
        print(f"   👤 Nombre: {user.full_name}")
        print(f"   🏥 Clínica ID: {user.clinic_id}")
        print(f"   👑 Rol: {user.role.value}")
        print(f"   ✔️  Activo: {user.is_active}")
        
        # Verificar que la contraseña se puede verificar correctamente
        print("\n🔍 Verificando contraseña:")
        is_valid = verify_password(password, user.hashed_password)
        print(f"   verify_password('{password}', user.hashed_password) = {is_valid}")
        
        if is_valid:
            print("   ✅ ¡La contraseña se verifica correctamente!")
        else:
            print("   ⚠️  ERROR: La contraseña no se verifica")
            return False

        return True

    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
        return False
    finally:
        db.close()


if __name__ == "__main__":
    success = reset_demo_user()
    exit(0 if success else 1)
