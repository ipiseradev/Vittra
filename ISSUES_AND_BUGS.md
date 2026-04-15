# Trainity - Critical Issues & Bugs to Fix

## 🔴 BLOCKERS (App Won't Run Properly)

### Issue #1: ClassSession Model Missing Fields
**Severity**: CRITICAL  
**File**: `backend/app/models/models.py` (line 50-57)  
**Problem**: 
```python
class ClassSession(Base):
    __tablename__ = "class_sessions"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255), index=True)
    coach_name: Mapped[str] = mapped_column(String(255))
    starts_at: Mapped[datetime] = mapped_column(DateTime, index=True)
    capacity: Mapped[int] = mapped_column(Integer, default=15)
    reservations: Mapped[list["Reservation"]] = relationship(back_populates="session")
    # ❌ MISSING: gym_id, created_at, updated_at
```

**Impact**:
- `services.py` line 119: `session.gym_id` will cause `AttributeError`
- No gym scoping for classes (multi-tenancy broken)
- No audit trail
- Cannot track when sessions were created

**Fix Required**:
```python
class ClassSession(Base):
    __tablename__ = "class_sessions"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255), index=True)
    coach_name: Mapped[str] = mapped_column(String(255))
    starts_at: Mapped[datetime] = mapped_column(DateTime, index=True)
    capacity: Mapped[int] = mapped_column(Integer, default=15)
    gym_id: Mapped[int | None] = mapped_column(Integer, index=True, nullable=True)  # ADD THIS
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)  # ADD THIS
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)  # ADD THIS
    reservations: Mapped[list["Reservation"]] = relationship(back_populates="session")
```

**Migration Needed**:
```python
# alembic/versions/0003_classsession_fields.py
def upgrade() -> None:
    op.add_column("class_sessions", sa.Column("gym_id", sa.Integer(), nullable=True))
    op.add_column("class_sessions", sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()))
    op.add_column("class_sessions", sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()))
    op.create_index("ix_class_sessions_gym_id", "class_sessions", ["gym_id"], unique=False)

def downgrade() -> None:
    op.drop_index("ix_class_sessions_gym_id")
    op.drop_column("class_sessions", "updated_at")
    op.drop_column("class_sessions", "created_at")
    op.drop_column("class_sessions", "gym_id")
```

---

### Issue #2: Reservation Model Missing created_at Field
**Severity**: CRITICAL  
**File**: `backend/app/models/models.py` (line 60-69)  
**Problem**:
```python
class Reservation(Base):
    __tablename__ = "reservations"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    client_id: Mapped[int] = mapped_column(ForeignKey("clients.id"))
    class_session_id: Mapped[int] = mapped_column(ForeignKey("class_sessions.id"))
    status: Mapped[ReservationStatus] = mapped_column(
        SqlEnum(ReservationStatus), default=ReservationStatus.BOOKED
    )
    session: Mapped["ClassSession"] = relationship(back_populates="reservations")
    # ❌ MISSING: created_at
```

**Impact**:
- `reservations.py` line 45: `query.order_by(Reservation.created_at.desc())` fails
- Dashboard can't aggregate by date
- No audit trail for reservations

**Fix Required**:
```python
class Reservation(Base):
    __tablename__ = "reservations"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    client_id: Mapped[int] = mapped_column(ForeignKey("clients.id"))
    class_session_id: Mapped[int] = mapped_column(ForeignKey("class_sessions.id"))
    status: Mapped[ReservationStatus] = mapped_column(
        SqlEnum(ReservationStatus), default=ReservationStatus.BOOKED
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)  # ADD THIS
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)  # ADD THIS
    session: Mapped["ClassSession"] = relationship(back_populates="reservations")
```

**Migration Needed**:
```python
def upgrade() -> None:
    op.add_column("reservations", sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()))
    op.add_column("reservations", sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()))
    op.create_index("ix_reservations_created_at", "reservations", ["created_at"], unique=False)

def downgrade() -> None:
    op.drop_index("ix_reservations_created_at")
    op.drop_column("reservations", "updated_at")
    op.drop_column("reservations", "created_at")
```

---

### Issue #3: Dashboard Endpoint Returns Hardcoded Zeros
**Severity**: CRITICAL  
**File**: `backend/app/api/v1/endpoints/dashboard.py` (line 7-18)  
**Problem**:
```python
@router.get("/summary")
def dashboard_summary(_user=Depends(get_current_user)) -> dict[str, int | float]:
    # TODO: connect dashboard aggregation query layer.
    return {
        "total_clients": 0,
        "total_classes": 0,
        "active_reservations": 0,
        "check_ins_today": 0,
        "monthly_revenue": 0.0,
    }
```

**Impact**:
- Frontend shows all-zero dashboard (unusable)
- No actual business metrics
- There's a `get_dashboard_summary()` function in `services.py` that's never called!

**Fix Required**:
```python
from app.services.services import get_dashboard_summary

@router.get("/summary")
def dashboard_summary(
    _user=Depends(get_current_user),
    current_gym_id: int | None = Depends(get_current_gym_id),
    db: Session = Depends(get_db),
) -> dict[str, int | float]:
    return get_dashboard_summary(db, gym_id=current_gym_id)
```

But first, update `get_dashboard_summary()` to accept `gym_id`:
```python
def get_dashboard_summary(db: Session, gym_id: int | None = None) -> dict[str, int | float]:
    today = datetime.utcnow().date()
    month_start = today.replace(day=1)

    # Add gym_id filter to all queries
    query_filter = (Client.gym_id == gym_id) if gym_id else True
    
    total_clients = db.scalar(
        select(func.count(Client.id)).where(query_filter)
    ) or 0
    # ... etc for other metrics
```

---

## 🔴 SECURITY ISSUES (Production Risk)

### Issue #4: Hardcoded SECRET_KEY
**Severity**: CRITICAL  
**File**: `backend/app/core/config.py` (line 6)  
**Problem**:
```python
SECRET_KEY: str = "wTh5XwUnbJekxKy9n1P3vUoYFVSRtnMybI4QCGa6QSzr3RWBrD78O_Cln3X2dnb7cYx7c4qbUqW785g6yF9kEg"
```

**Impact**:
- Secret exposed in git repository
- Anyone with code access can forge JWT tokens
- Cannot safely deploy to production

**Fix Required**:
```python
from pydantic import Field

class Settings(BaseSettings):
    SECRET_KEY: str = Field(
        default="change-me-in-production",
        env_file_key="SECRET_KEY"
    )
    # ... rest of settings
```

Create `.env.example`:
```
SECRET_KEY=your-secure-256-bit-key-here
DATABASE_URL=sqlite:///./trainity.db
ENVIRONMENT=development
```

---

### Issue #5: No Rate Limiting
**Severity**: HIGH  
**File**: `backend/app/main.py`  
**Problem**: Anyone can brute-force login or DOS the API

**Fix Required**:
```bash
pip install slowapi
```

```python
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_handler)

# In auth.py
@router.post("/login", response_model=Token)
@limiter.limit("5/minute")
def login(request: Request, db: Session = Depends(get_db), ...):
    # Login attempts limited to 5 per minute per IP
    pass
```

---

### Issue #6: JWT Access Token Expiry Too Long (24 hours)
**Severity**: HIGH  
**File**: `backend/app/core/config.py` (line 8)  
**Problem**:
```python
ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours!
```

**Impact**:
- If token is leaked, attacker has 24 hour window
- No way to revoke tokens before expiry
- No refresh token mechanism

**Fix Required**:
```python
ACCESS_TOKEN_EXPIRE_MINUTES: int = 15  # 15 minutes
REFRESH_TOKEN_EXPIRE_DAYS: int = 7  # 7 days

# Implement refresh token flow in auth.py
@router.post("/refresh", response_model=Token)
def refresh_token(
    current_user: dict = Depends(get_current_user),
) -> Token:
    access_token = create_access_token(subject=str(current_user["user_id"]))
    return Token(access_token=access_token)

# Add token_type field to create_access_token
def create_access_token(subject: str, token_type: str = "access", expires_delta: timedelta | None = None) -> str:
    if token_type == "refresh":
        expire = datetime.now(UTC) + (expires_delta or timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS))
    else:
        expire = datetime.now(UTC) + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    
    to_encode = {
        "exp": expire,
        "sub": subject,
        "type": token_type
    }
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
```

---

### Issue #7: Weak Tenant Isolation
**Severity**: HIGH  
**File**: `backend/app/api/deps.py` (line 19-24)  
**Problem**:
```python
def get_current_gym_id(current_user: dict[str, Any] = Depends(get_current_user)) -> int | None:
    gym_id = current_user.get("gym_id")
    if isinstance(gym_id, int):
        return gym_id
    return None  # ❌ Returns None for users without gym, 
                 # then endpoints treat None as "show all data"
```

**Impact**:
- Users without `gym_id` bypass tenant checks
- Can access all gyms' data

**Fix Required**:
```python
def get_current_gym_id_required(
    current_user: dict[str, Any] = Depends(get_current_user)
) -> int:
    gym_id = current_user.get("gym_id")
    if not isinstance(gym_id, int):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User must belong to a gym"
        )
    return gym_id

# Use in endpoints that require gym context (most of them):
@router.get("", response_model=list[ClientOut])
def list_clients(
    db: Session = Depends(get_db),
    gym_id: int = Depends(get_current_gym_id_required),  # Now required!
) -> list[ClientOut]:
    query = select(Client).where(Client.gym_id == gym_id)
    return list(db.scalars(query))
```

---

### Issue #8: CORS Too Permissive
**Severity**: MEDIUM  
**File**: `backend/app/main.py` (line 9-15)  
**Problem**:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],  # ⚠️ Allows DELETE, PATCH, HEAD, etc.
    allow_headers=["*"],  # ⚠️ Too permissive
)
```

**Fix Required**:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT"],
    allow_headers=["Content-Type", "Authorization"],
)
```

---

## 🟠 HIGH PRIORITY ISSUES (Incomplete Features)

### Issue #9: Classes Endpoint is Just a Scaffold
**Severity**: HIGH  
**File**: `backend/app/api/v1/endpoints/classes.py` (line 12-18)  
**Problem**:
```python
@router.get("")
def list_classes(_user=Depends(get_current_user)) -> dict[str, list]:
    return {"items": []}  # ❌ Returns empty

@router.post("")
def create_class(_user=Depends(get_current_user)) -> dict[str, str]:
    return {"message": "Class creation scaffold ready"}  # ❌ Scaffold
```

**Fix Required**: Implement full CRUD:
```python
@router.get("", response_model=list[ClassSessionOut])
def list_classes(
    db: Session = Depends(get_db),
    gym_id: int = Depends(get_current_gym_id_required),
    _user=Depends(get_current_user),
) -> list[ClassSessionOut]:
    query = select(ClassSession).where(ClassSession.gym_id == gym_id).order_by(ClassSession.starts_at)
    return list(db.scalars(query))

@router.post("", response_model=ClassSessionOut, status_code=status.HTTP_201_CREATED)
def create_class(
    payload: ClassSessionCreate,
    db: Session = Depends(get_db),
    gym_id: int = Depends(get_current_gym_id_required),
    _user=Depends(get_current_user),
) -> ClassSessionOut:
    session = ClassSession(**payload.model_dump(), gym_id=gym_id)
    db.add(session)
    db.commit()
    db.refresh(session)
    return session

# ... PUT, DELETE endpoints
```

---

### Issue #10: Attendance Endpoint is Just a Scaffold
**Severity**: HIGH  
**File**: `backend/app/api/v1/endpoints/attendance.py` (line 12-18)  

**Fix Required**: Implement check-in logic:
```python
@router.post("", response_model=AttendanceOut, status_code=status.HTTP_201_CREATED)
def check_in(
    payload: AttendanceCreate,
    db: Session = Depends(get_db),
    gym_id: int = Depends(get_current_gym_id_required),
    _user=Depends(get_current_user),
) -> AttendanceOut:
    attendance = create_attendance(db, payload)
    # Verify reservation belongs to user's gym
    reservation = db.get(Reservation, payload.reservation_id)
    if not reservation or reservation.client.gym_id != gym_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    
    return attendance
```

---

### Issue #11: Payments Endpoint is Just a Scaffold
**Severity**: HIGH  
**File**: `backend/app/api/v1/endpoints/payments.py` (line 12-18)  

**Fix Required**: Implement payment tracking (without Stripe integration for MVP):
```python
@router.get("", response_model=list[PaymentOut])
def list_payments(
    db: Session = Depends(get_db),
    gym_id: int = Depends(get_current_gym_id_required),
    _user=Depends(get_current_user),
) -> list[PaymentOut]:
    query = select(Payment).join(Client).where(Client.gym_id == gym_id)
    return list(db.scalars(query))

@router.post("", response_model=PaymentOut, status_code=status.HTTP_201_CREATED)
def record_payment(
    payload: PaymentCreate,
    db: Session = Depends(get_db),
    gym_id: int = Depends(get_current_gym_id_required),
    _user=Depends(get_current_user),
) -> PaymentOut:
    client = db.get(Client, payload.client_id)
    if not client or client.gym_id != gym_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    
    payment = create_payment(db, payload)
    return payment
```

---

## 🟠 FRONTEND ISSUES

### Issue #12: No Authentication Context/State Management
**Severity**: HIGH  
**File**: `frontend/src/` (missing feature)  
**Problem**: Auth token is stored in localStorage but there's no way to:
- Check if user is logged in
- Redirect to login on 401
- Manage global auth state
- Handle logout

**Fix Required**: Create auth context and provider

---

### Issue #13: No Protected Routes
**Severity**: HIGH  
**File**: `frontend/src/App.tsx` (line 15-19)  
**Problem**:
```typescript
export default function App() {
    return (
        <Routes>
            <Route element={<AppLayout />}>
                <Route path="/" element={<DashboardPage />} />  // ❌ No auth check
                <Route path="/clients" element={<ClientsPage />} />  // ❌ Anyone can access
```

**Fix Required**: Add ProtectedRoute wrapper

---

### Issue #14: Missing Features Pages
**Severity**: MEDIUM  
**Missing**: 
- Sessions/Classes management page
- Attendance tracking page
- Payments/Billing page
- Settings/Profile page
- Admin page

---

## 🟡 MEDIUM PRIORITY

### Issue #15: No Logging System
**Severity**: MEDIUM  
**File**: `backend/` (missing everywhere)  
**Problem**: Can't debug production issues, can't track user actions

**Fix Required**:
```bash
pip install structlog
```

---

### Issue #16: No Input Validation on ClientCreate
**Severity**: MEDIUM  
**File**: `backend/app/schemas/schemas.py` (line 44-60)  
**Problem**: Some validations exist but incomplete

**Fix Required**: Add validation for phone format, ensure email is lowercase

---

### Issue #17: No Database Indexes on Foreign Keys
**Severity**: MEDIUM  
**Impact**: Performance issues with large datasets

**Fix Required**:
```python
# In models
class Reservation(Base):
    client_id: Mapped[int] = mapped_column(ForeignKey("clients.id"), index=True)  # Add index
    class_session_id: Mapped[int] = mapped_column(ForeignKey("class_sessions.id"), index=True)  # Add index
```

---

### Issue #18: No Error Handling Middleware
**Severity**: MEDIUM  
**Impact**: Generic 500 errors without details

**Fix Required**: Add global exception handlers

---

## Summary Table

| Issue | Severity | Type | Hours | File |
|-------|----------|------|-------|------|
| ClassSession missing fields | CRITICAL | Bug | 2 | models.py |
| Reservation missing created_at | CRITICAL | Bug | 1 | models.py |
| Dashboard returns hardcoded zeros | CRITICAL | Bug | 1 | dashboard.py |
| Hardcoded SECRET_KEY | CRITICAL | Security | 1 | config.py |
| No rate limiting | HIGH | Security | 3 | main.py |
| Long JWT expiry | HIGH | Security | 2 | security.py |
| Weak tenant isolation | HIGH | Security | 2 | deps.py |
| Classes endpoint scaffold | HIGH | Feature | 4 | classes.py |
| Attendance endpoint scaffold | HIGH | Feature | 4 | attendance.py |
| Payments endpoint scaffold | HIGH | Feature | 4 | payments.py |
| No auth context | HIGH | Frontend | 4 | App.tsx |
| No protected routes | HIGH | Frontend | 2 | App.tsx |
| No logging | MEDIUM | Bug | 5 | all |
| Missing indexes | MEDIUM | Performance | 1 | models.py |
| No error handlers | MEDIUM | Bug | 3 | main.py |

**Total estimated fix time**: ~39 hours (1 week of work)
