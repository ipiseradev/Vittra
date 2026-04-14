# Trainity - Full-Stack SaaS MVP

Trainity is an MVP for fitness studios and boutique gyms to manage clients, class sessions, reservations, attendance, payments, and an operational dashboard.

## Stack
- Frontend: React + Vite + TypeScript + Tailwind CSS
- Backend: FastAPI + SQLAlchemy + PostgreSQL
- Auth: JWT
- Migrations: Alembic

## Project Structure
```text
Trainity/
  frontend/
    src/
      api/
      features/
      layouts/
      lib/
      pages/
      types/
  backend/
    app/
      api/v1/endpoints/
      core/
      db/
      models/
      schemas/
      services/
    alembic/
      versions/
  docs/
    api-design.md
```

## Backend Setup
1. Create a Postgres database:
   - database: `trainity`
2. Create and activate virtual environment:
   - `cd backend`
   - `python -m venv .venv`
   - `source .venv/bin/activate`
3. Install dependencies:
   - `pip install -r requirements.txt`
4. Configure environment:
   - `cp .env.example .env`
   - Update `DATABASE_URL` and `SECRET_KEY`
5. Run migrations:
   - `alembic upgrade head`
6. Start API:
   - `uvicorn app.main:app --reload`

API docs:
- Swagger: [http://localhost:8000/docs](http://localhost:8000/docs)

## Frontend Setup
1. Install dependencies:
   - `cd frontend`
   - `npm install`
2. Configure environment:
   - `cp .env.example .env`
3. Run dev server:
   - `npm run dev`

App URL:
- [http://localhost:5173](http://localhost:5173)

## Environment Variables

### Backend (`backend/.env`)
```env
PROJECT_NAME=Trainity API
ENVIRONMENT=development
DATABASE_URL=postgresql+psycopg2://postgres:postgres@localhost:5432/trainity
SECRET_KEY=replace_with_a_long_random_secret
ACCESS_TOKEN_EXPIRE_MINUTES=1440
BACKEND_CORS_ORIGINS=["http://localhost:5173"]
```

### Frontend (`frontend/.env`)
```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

## API Design
See `docs/api-design.md` for the endpoint proposal.

## Notes for Production Hardening
- Add RBAC checks by role (admin/staff)
- Add refresh tokens and token rotation
- Add pagination and filtering for list endpoints
- Add structured logging, metrics, and tracing
- Add test suites (backend + frontend) and CI
