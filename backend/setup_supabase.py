#!/usr/bin/env python3
"""
Interactive setup script for Supabase configuration.
Guides users through the process of setting up Supabase for Trainity.
"""

import os
import sys
from pathlib import Path


def print_banner():
    """Print welcome banner."""
    print("\n" + "="*70)
    print("🚀 TRAINITY - SUPABASE SETUP WIZARD 🚀".center(70))
    print("="*70 + "\n")


def print_section(title: str):
    """Print section header."""
    print(f"\n📌 {title}")
    print("-" * 70)


def get_supabase_url() -> str:
    """Get Supabase connection string from user."""
    print_section("SUPABASE CONNECTION STRING")
    print("""
To get your Supabase connection string:
1. Go to https://supabase.com and sign in
2. Select your project
3. Click Settings → Database
4. Copy the "Connection String" (PostgreSQL format)
5. It should look like: postgresql://postgres:PASSWORD@db.PROJECT_ID.supabase.co:5432/postgres
""")
    
    while True:
        url = input("Paste your Supabase connection string: ").strip()
        
        if not url.startswith("postgresql://"):
            print("❌ Invalid format. Must start with 'postgresql://'")
            continue
        
        if "@db." not in url or ".supabase.co" not in url:
            print("❌ Invalid format. Must be a Supabase URL")
            continue
        
        return url


def get_secret_key() -> str:
    """Get or generate secret key."""
    print_section("SECRET KEY")
    print("""
You need a secure SECRET_KEY for JWT tokens.
Your current key: dev-secret-key-minimum-32-chars-longsecure (NOT secure!)

Use option 1 to generate a cryptographically secure key (recommended).
Use option 2 to provide your own.
""")
    
    while True:
        choice = input("Generate new secret key? (1=yes, 2=use existing, 3=provide custom): ").strip()
        
        if choice == "1":
            import secrets
            import string
            key = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(64))
            print(f"✅ Generated: {key}")
            return key
        elif choice == "2":
            key = "dev-secret-key-minimum-32-chars-longsecure"
            print(f"⚠️  Using default key: {key}")
            return key
        elif choice == "3":
            key = input("Enter your custom secret key (min 32 chars required): ").strip()
            if len(key) < 32:
                print(f"❌ Key too short! Must be at least 32 characters ({len(key)} entered)")
                continue
            return key
        else:
            print("❌ Invalid choice. Enter 1, 2, or 3")


def update_env_file(db_url: str, secret_key: str):
    """Update .env file with new values."""
    print_section("UPDATING .env FILE")
    
    env_path = Path(".env")
    env_backup_path = Path(".env.backup")
    
    # Backup existing .env
    if env_path.exists():
        import shutil
        shutil.copy(env_path, env_backup_path)
        print(f"✅ Backed up existing .env to {env_backup_path.name}")
    
    # Read current .env
    env_content = env_path.read_text() if env_path.exists() else ""
    
    # Update DATABASE_URL
    if "DATABASE_URL=" in env_content:
        # Replace existing DATABASE_URL
        lines = env_content.split('\n')
        new_lines = []
        for line in lines:
            if line.startswith("DATABASE_URL="):
                new_lines.append(f"DATABASE_URL={db_url}")
            else:
                new_lines.append(line)
        env_content = '\n'.join(new_lines)
    else:
        # Add new DATABASE_URL
        env_content += f"\nDATABASE_URL={db_url}\n"
    
    # Update SECRET_KEY
    if "SECRET_KEY=" in env_content:
        lines = env_content.split('\n')
        new_lines = []
        for line in lines:
            if line.startswith("SECRET_KEY="):
                new_lines.append(f"SECRET_KEY={secret_key}")
            else:
                new_lines.append(line)
        env_content = '\n'.join(new_lines)
    else:
        env_content += f"\nSECRET_KEY={secret_key}\n"
    
    # Write updated .env
    env_path.write_text(env_content)
    print(f"✅ Updated {env_path.name}")


def next_steps():
    """Print next steps."""
    print_section("NEXT STEPS")
    print("""
1. Create database tables:
   cd backend
   source .venv/bin/activate
   alembic upgrade head

2. Seed demo data:
   python seed_demo_data.py

3. Start the backend:
   uvicorn app.main:app --reload --log-level info

4. Start the frontend (in another terminal):
   cd frontend
   npm run dev

5. Open in browser:
   http://localhost:5173

6. Login with demo credentials:
   Email: admin@clinic.com
   Password: 123456

Troubleshooting:
- Run: python -c "from sqlalchemy import create_engine; create_engine('YOUR_DB_URL').connect(); print('✅ Connection OK')"
  to test your database connection
""")


def main():
    """Run the setup wizard."""
    print_banner()
    
    try:
        # Get Supabase URL
        db_url = get_supabase_url()
        print("✅ Supabase URL configured")
        
        # Get Secret Key
        secret_key = get_secret_key()
        print("✅ Secret key configured")
        
        # Update .env
        update_env_file(db_url, secret_key)
        
        # Print next steps
        next_steps()
        
        print("\n" + "="*70)
        print("✅ SETUP COMPLETE!".center(70))
        print("="*70 + "\n")
        
    except KeyboardInterrupt:
        print("\n\n❌ Setup cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
