# 🚀 Configuración de Supabase para Trainity

## Paso 1: Crear Proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y regístrate o inicia sesión
2. Click en "New Project"
3. Configura:
   - **Project Name**: `trainity-demo` (o el nombre que prefieras)
   - **Database Password**: Crea una contraseña segura (guárdala!)
   - **Region**: Elige la más cercana a ti
   - Click "Create new project" (espera 1-2 minutos)

## Paso 2: Obtener Credenciales

1. Una vez creado el proyecto, ve a **Settings → Database**
2. Copia la **Connection String** (formato PostgreSQL)
3. Debería verse algo como:
   ```
   postgresql://postgres:[PASSWORD]@db.xxxxxxxxxxxx.supabase.co:5432/postgres
   ```

## Paso 3: Actualizar .env

En el archivo `/backend/.env`, reemplaza:

```env
DATABASE_URL=postgresql://postgres:[TU_PASSWORD]@db.xxxxxxxxxxxx.supabase.co:5432/postgres
```

**⚠️ IMPORTANTE:** Mantén `[PASSWORD]` como tu contraseña real (sin brackets)

## Paso 4: Ejecutar Migraciones

Desde la carpeta `backend/`:

```bash
source .venv/bin/activate
alembic upgrade head
```

Esto creará todas las tablas en Supabase.

## Paso 5: Sembrar Datos Demo

```bash
python init_db.py
```

O si prefieres use el script de seed mejorado:

```bash
python seed_demo_data.py
```

## Paso 6: Reiniciar Backend

```bash
# Matar el proceso anterior si está corriendo
# Luego:
uvicorn app.main:app --reload --log-level info
```

## ✅ Verificación

### Opción A: Desde Supabase UI
1. Ve a tu proyecto en supabase.com
2. Click en **SQL Editor**
3. Ejecuta:
   ```sql
   SELECT COUNT(*) FROM "user" WHERE clinic_id = 1;
   SELECT COUNT(*) FROM patient WHERE clinic_id = 1;
   ```

### Opción B: Desde el Backend UI
1. Abre http://localhost:8000/docs (Swagger UI)
2. Click en "Authorize" y usa el token del login
3. Prueba los endpoints

### Opción C: Hacer Login
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@clinic.com",
    "password": "123456",
    "clinic_id": 1
  }'
```

## 🐛 Troubleshooting

### Error: "connection refused"
- Verifica que Supabase esté running
- Copia correctamente la DATABASE_URL desde Supabase UI
- Asegúrate de reemplazar [PASSWORD] con tu contraseña real

### Error: "relation X does not exist"
- Ejecuta: `alembic upgrade head`
- Verifica que no haya errores de migración

### Error: "permission denied"
- Verifica la contraseña en DATABASE_URL
- Intenta resetear la contraseña de la base de datos en Supabase Settings

## 📱 Credenciales Demo

Después de ejecutar `seed_demo_data.py`, puedes usar:

```
Email: admin@clinic.com
Contraseña: 123456
Clinic ID: 1
```

También se crean usuarios adicionales:
- `doctor@clinic.com` (rol: DOCTOR)
- `nurse@clinic.com` (rol: NURSE)
- `receptionist@clinic.com` (rol: RECEPTIONIST)

Todos con contraseña: `123456`

## 🔄 Volver a SQLite Local (opcional)

Si quieres volver al desarrollo local:

```env
DATABASE_URL=sqlite:///./mediclinic.db
```

Luego:
```bash
alembic downgrade base  # Para limpiar (opcional)
alembic upgrade head     # Recrear esquema local
python init_db.py
```
