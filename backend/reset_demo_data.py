#!/usr/bin/env python3
"""
Reset and reseed demo data with new password hashing.
"""

import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import text
from app.db.session import SessionLocal, engine
from app.db.base import Base


def reset_demo_data():
    """Delete demo clinic and all related data, then reseed."""
    
    db = SessionLocal()
    
    try:
        print("🗑️  Cleaning demo data...")
        
        # Get clinic ID first
        result = db.execute(text("SELECT id FROM clinic WHERE slug = 'demo-clinic'")).first()
        
        if result:
            clinic_id = result[0]
            
            # Delete in order of dependencies
            db.execute(text("DELETE FROM medical_record WHERE clinic_id = :clinic_id"), {"clinic_id": clinic_id})
            db.execute(text("DELETE FROM appointment WHERE clinic_id = :clinic_id"), {"clinic_id": clinic_id})
            db.execute(text("DELETE FROM patient WHERE clinic_id = :clinic_id"), {"clinic_id": clinic_id})
            db.execute(text("DELETE FROM user WHERE clinic_id = :clinic_id"), {"clinic_id": clinic_id})
            db.execute(text("DELETE FROM clinic WHERE id = :clinic_id"), {"clinic_id": clinic_id})
            db.commit()
            print("✅ Demo data cleaned")
        else:
            print("ℹ️  No demo data found")
            
    except Exception as e:
        print(f"❌ Error cleaning data: {e}")
        db.rollback()
    finally:
        db.close()
    
    print("\n🌱 Reseeding demo data...")
    # Import and run seed
    from seed_demo_data import seed_database
    seed_database()
    print("✅ Demo data reseeded with new password hashing")


if __name__ == "__main__":
    reset_demo_data()
