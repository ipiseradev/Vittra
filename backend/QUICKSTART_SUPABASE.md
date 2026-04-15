# 🚀 Trainity con Supabase - Quick Start

## Video Tutorial (Recomendado)
Si prefieres, sigue este video tutorial: [Supabase Setup]

---

## Opción A: Configuración Automática ⚡ (RECOMENDADO)

```bash
cd backend
python setup_supabase.py
```

El script te guiará interactivamente por todo el proceso. Solo necesitas:
1. Tu CONNECTION STRING de Supabase (copiar/pegar)
2. Confirmar opciones predeterminadas

---

## Opción B: Configuración Manual

### 1️⃣ Crear Proyecto en Supabase

1. Abre [supabase.com](https://supabase.com)
2. Registrate o inicia sesión
3. Click "New Project"
4. Usa las credenciales:
   - **Project name**: `trainity-demo`
   - **Database password**: Escribe una contraseña segura
   - **Region**: Tu región más cercana
5. Espera 1-2 minutos a que se cree

### 2️⃣ Obtener Connection String

1. Abre tu proyecto en Supabase
2. Ve a **Settings → Database** (izquierda)
3. Copia la **Connection String** (PostgreSQL)
4. Se verá así:
   ```
   postgresql://postgres:[PASSWORD]@db.xxxxxxxxxxxx.supabase.co:5432/postgres
   ```

### 3️⃣ Actualizar .env

En `/backend/.env`, reemplaza:

```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xxxxxxxxxxxx.supabase.co:5432/postgres
SECRET_KEY=your-super-secret-key-minimum-32-chars-longsecure-change-this
```

**⚠️ IMPORTANTE**: 
- Reemplaza `[PASSWORD]` con tu contraseña real
- NO incluyas los brackets `[]`
- El SECRET_KEY debe tener al menos 32 caracteres

---

## ⚙️ Configurar Base de Datos

### 1. Crear Tablas

```bash
cd backend
source .venv/bin/activate
alembic upgrade head
```

### 2. Cargar Datos Demo

```bash
python seed_demo_data.py
```

Esto crea:
- ✅ 1 Clínica de demo
- ✅ 4 Usuarios demo (Admin, Doctor, Nurse, Receptionist)
- ✅ 3 Pacientes
- ✅ 3 Citas
- ✅ 2 Registros médicos

---

## 🚀 Iniciar la Aplicación

### Terminal 1: Backend
```bash
cd /home/nacho/Trainity/backend
source .venv/bin/activate
uvicorn app.main:app --reload --log-level info
```

### Terminal 2: Frontend
```bash
cd /home/nacho/Trainity/frontend
npm run dev
```

---

## 📱 Credenciales Demo

Después de ejecutar `seed_demo_data.py`:

| Email | Contraseña | Rol |
|-------|-----------|-----|
| `admin@clinic.com` | `123456` | Admin |
| `doctor@clinic.com` | `123456` | Doctor |
| `nurse@clinic.com` | `123456` | Nurse |
| `receptionist@clinic.com` | `123456` | Receptionist |

---

## 🌐 Acceder a la App

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Supabase Dashboard**: https://supabase.com

---

## ✅ Verificar Conexión

### Opción 1: Dashboard Supabase
1. Abre tu proyecto en supabase.com
2. Ve a **SQL Editor**
3. Ejecuta:
   ```sql
   SELECT COUNT(*) as total_users FROM "user";
   SELECT COUNT(*) as total_patients FROM patient;
   ```

### Opción 2: Terminal
```bash
python -c "
from app.db.session import SessionLocal
db = SessionLocal()
from app.models.models import User
print(f'Usuarios: {len(db.query(User).all())}')
print('✅ Conexión OK!')
"
```

### Opción 3: Make Login Request
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@clinic.com",
    "password": "123456",
    "clinic_id": 1
  }'
```

---

## 🐛 Troubleshooting

### ❌ "connection refused"
```bash
# Verifica que Supabase esté corriendo:
python -c "from sqlalchemy import create_engine; create_engine('YOUR_DB_URL').connect()"
```

### ❌ "relation X does not exist"
```bash
# Resetea las migraciones:
cd backend
alembic downgrade base
alembic upgrade head
python seed_demo_data.py
```

### ❌ "permission denied" o "authentication failed"
- Verifica tu contraseña en DATABASE_URL
- Resetea la contraseña en Supabase Settings
- Copia nuevamente la CONNECTION STRING

### ❌ Frontend no conecta con Backend
```bash
# Verifica CORS en .env:
BACKEND_CORS_ORIGINS=["http://localhost:5173","http://127.0.0.1:5173"]

# Reinicia el backend después de cambiar
```

---

## 📚 Documentación Completa

- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) - Guía detallada de Supabase
- [README.md](./README.md) - Documentación general del proyecto
- [API Docs](http://localhost:8000/docs) - Swagger UI del backend

---

## 💡 Tips

- **Cambiar entre Local y Supabase**: Solo cambia `DATABASE_URL` en `.env`
- **Hacer backup de datos**: En Supabase, usa "Backups" en Settings
- **Reset completo**: Supabase Dashboard → SQL Editor → `DROP SCHEMA public CASCADE; CREATE SCHEMA public;`

---

## 🎉 ¡Listo!

Ahora puedes:
1. ✅ Lograrte con las credenciales demo
2. ✅ Ver pacientes, citas y registros médicos
3. ✅ Demostrar la app en vivo
4. ✅ Compartir el link si está deployada

¿Necesitas ayuda? Revisa los logs en el backend y los errores del navegador.
