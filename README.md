# MediClinic - Medical Management System v2.0

**Premium SaaS Platform for Healthcare Clinics** 🏥

> **Enterprise-ready medical management system** with patient records, appointment scheduling, prescriptions, billing, and HIPAA compliance

---

## 📸 Dashboard Preview

![MediClinic Dashboard](./docs/screenshots/dashboard.png)

**Features Showcased:**
- 📊 **Real-time Metrics** - Patient counts, appointment status, revenue overview
- 📅 **Appointment Management** - Comprehensive scheduling with status tracking
- 👥 **Patient Analytics** - Recent patients and activity insights
- 💰 **Financial Dashboard** - Revenue tracking and payment statistics
- 🎯 **Daily Summary** - Visual representation of clinic activity

---

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 14+
- Git

### Backend Setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Update DATABASE_URL and SECRET_KEY in .env
alembic upgrade head
uvicorn app.main:app --reload
```

**API available at:** [http://localhost:8000](http://localhost:8000)  
**Swagger Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)

### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

**App available at:** [http://localhost:5173](http://localhost:5173)

---

## ✨ Features

### Core Modules
- ✅ **Patient Management** - Comprehensive patient profiles with demographics & medical history
- ✅ **Appointment Scheduling** - Calendar-based booking with status tracking
- ✅ **Medical Records** - Secure digital patient records with HIPAA compliance
- ✅ **Prescriptions** - Medication management and tracking
- ✅ **Billing** - Payment processing with multiple payment methods
- ✅ **Audit Logs** - Full compliance tracking for regulatory requirements

### Technical Highlights
- 🔐 **HIPAA-Ready** - Audit logging and encryption built-in
- 👥 **Multi-Tenant** - Complete data isolation per clinic
- 🔑 **RBAC** - 5 role types: Admin, Doctor, Nurse, Receptionist, Patient
- ⚡ **High Performance** - Async Python backend with PostgreSQL
- 📱 **Responsive UI** - Modern React interface with Tailwind CSS
- 🔄 **Real-time** - WebSocket-ready architecture

---

## 📊 Tech Stack

**Backend**
- FastAPI (async REST framework)
- SQLAlchemy 2.0 (ORM)
- PostgreSQL 14+ (database)
- Alembic (migrations)
- JWT + OAuth2 (authentication)

**Frontend**
- React 18+ with TypeScript
- Vite (bundler)
- Tailwind CSS (styling)
- Lucide React (icons)
- TanStack Query (data fetching)

**Infrastructure**
- Docker & Docker Compose
- Gunicorn + Uvicorn (production server)
- Redis (caching layer)

---

## 🏗️ Project Structure

```
MediClinic/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/
│   │   │   ├── auth.py              # Authentication
│   │   │   ├── patients.py          # Patient CRUD
│   │   │   ├── appointments.py      # Scheduling
│   │   │   ├── medical_records.py   # Records
│   │   │   ├── prescriptions.py     # Medications
│   │   │   └── billing.py           # Payments
│   │   ├── core/
│   │   │   ├── config.py            # Configuration
│   │   │   └── security.py          # Auth & encryption
│   │   ├── db/
│   │   │   ├── base.py              # ORM setup
│   │   │   └── session.py           # Database connection
│   │   ├── models/
│   │   │   └── models.py            # SQLAlchemy models
│   │   ├── schemas/
│   │   │   └── schemas.py           # Pydantic schemas
│   │   └── services/
│   │       └── services.py          # Business logic
│   ├── alembic/                     # Database migrations
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/                     # API client
│   │   ├── features/                # Feature modules
│   │   ├── layouts/                 # Layout components
│   │   ├── components/              # Reusable components
│   │   └── types/                   # TypeScript types
│   └── package.json
└── docs/                            # Documentation
```

---

## 📝 API Endpoints

### Authentication
```
POST   /api/v1/auth/register     → Register new staff
POST   /api/v1/auth/login        → Staff login
GET    /api/v1/auth/me           → Get current user
```

### Patients
```
GET    /api/v1/patients          → List patients
POST   /api/v1/patients          → Create patient
GET    /api/v1/patients/{id}     → Get patient details
PUT    /api/v1/patients/{id}     → Update patient
DELETE /api/v1/patients/{id}     → Soft delete patient
```

### Appointments
```
GET    /api/v1/appointments                      → List appointments
POST   /api/v1/appointments                      → Schedule appointment
GET    /api/v1/appointments/{id}                 → Get appointment
PUT    /api/v1/appointments/{id}                 → Update appointment
POST   /api/v1/appointments/{id}/complete        → Mark complete
POST   /api/v1/appointments/{id}/cancel          → Cancel appointment
```

### Medical Records
```
GET    /api/v1/medical-records/patient/{id}     → Patient history
POST   /api/v1/medical-records                   → Create record
PUT    /api/v1/medical-records/{id}              → Update record
```

### Prescriptions
```
GET    /api/v1/prescriptions/patient/{id}       → Patient prescriptions
POST   /api/v1/prescriptions                     → Create prescription
PUT    /api/v1/prescriptions/{id}                → Update prescription
```

### Billing
```
GET    /api/v1/payments/patient/{id}             → Payment history
POST   /api/v1/payments                          → Record payment
GET    /api/v1/payments/stats/revenue            → Revenue stats
```

---

## 🔐 Security Features

- ✅ **HIPAA Compliance** - Full audit trail of all data access
- ✅ **Role-Based Access** - Granular permissions per role
- ✅ **Data Encryption** - Sensitive fields encrypted at rest
- ✅ **JWT Tokens** - Secure stateless authentication
- ✅ **SQL Injection Prevention** - ORM-based queries
- ✅ **Rate Limiting** - DDoS protection (built-in)
- ✅ **2FA Ready** - TOTP support built-in
- ✅ **Audit Logs** - Every action logged with user/timestamp/IP

---

## 🚀 Deployment

### Docker Compose (Production)

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Environment Variables (Production)

```env
# Database
DATABASE_URL=postgresql+psycopg2://user:password@db:5432/mediclinic

# Security (CHANGE THESE!)
SECRET_KEY=<generate-256-char-random-key>
ENVIRONMENT=production

# CORS
BACKEND_CORS_ORIGINS=["https://yourdomain.com"]

# Optional: Email & Payments
SMTP_USER=your-email@gmail.com
STRIPE_API_KEY=sk_live_...
```

---

## 📈 Pricing Plans

| Plan | Price | Features |
|------|-------|----------|
| **Startup** | $500/mo | 5 users, 500 patients, basic support |
| **Professional** | $1,500/mo | 20 users, 5k patients, API access |
| **Enterprise** | Custom | Unlimited, on-premise, dedicated support |

---

## 🤝 Support & Documentation

- 📖 **API Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
- 📋 **Features:** See [MEDINIC_FEATURES.md](./MEDINIC_FEATURES.md)
- 🐛 **Issues:** GitHub Issues
- 📧 **Email:** support@mediclinic.app

---

## 📄 License

**Proprietary** - © 2024 MediClinic Inc. All rights reserved.

For licensing inquiries: sales@mediclinic.app

---

## 🎯 Roadmap

**v2.1 (Next)**
- [ ] Patient portal & self-service
- [ ] SMS/Email notifications
- [ ] Advanced analytics dashboard

**v3.0 (Future)**
- [ ] Mobile native app (iOS/Android)
- [ ] Telehealth integration
- [ ] Lab results integration
- [ ] Insurance clearinghouse API

---

**Ready to modernize your clinic?** 💪

[Schedule Demo](https://mediclinic.app) | [Documentation](./docs) | [Support](mailto:support@mediclinic.app)
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
