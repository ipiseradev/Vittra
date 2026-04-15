# Trainity - 3-Month Production Roadmap

## Timeline Overview

```
Week 1-2   : Critical fixes (schemas, security, errors)
Week 3-4   : Core features completion (classes, payments, attendance)
Week 5-6   : Frontend modernization (state, hooks, components)
Week 7-8   : Testing & optimization
Week 9-10  : Deployment infrastructure
Week 11-12 : Final polish & launch
```

---

## Month 1: Foundation & Fixes

### Week 1: Critical Bug Fixes (38 hours)

**Days 1-2: Database Schema Fixes (8 hours)**
- [ ] Add `gym_id`, `created_at`, `updated_at` to ClassSession
- [ ] Add `created_at`, `updated_at` to Reservation
- [ ] Create Alembic migration files
- [ ] Test migrations locally
- [ ] Update services to use new fields

**Days 3: Endpoint Fixes (8 hours)**
- [ ] Fix dashboard endpoint to call `get_dashboard_summary()` 
- [ ] Add `gym_id` filter to dashboard service function
- [ ] Fix services.py logic for gym_id checks
- [ ] Test dashboard returns actual data

**Days 4: Implement Logging (8 hours)**
- [ ] Add structlog package
- [ ] Create logging configuration
- [ ] Add structured logging to all endpoints
- [ ] Add request/response middleware
- [ ] Test log output

**Days 5: Security - Move Secrets (6 hours)**
- [ ] Create `.env` file handler
- [ ] Move SECRET_KEY to .env
- [ ] Create `.env.example`
- [ ] Update docs
- [ ] Test with environment variables

**Days 6-7: Error Handling (8 hours)**
- [ ] Create custom exception classes
- [ ] Add global exception handler
- [ ] Add validation error handlers
- [ ] Add database error handlers
- [ ] Write error response middleware

**Deliverables**:
- ✅ App runs without errors
- ✅ Dashboard shows actual data
- ✅ Logs visible in terminal
- ✅ Secrets in environment

---

### Week 2: Security Hardening & Rate Limiting (40 hours)

**Days 1-2: Rate Limiting (8 hours)**
- [ ] Install slowapi
- [ ] Configure rate limits for /auth/login (5 attempts/min)
- [ ] Configure rate limits for list endpoints (100 requests/min)
- [ ] Test with concurrent requests
- [ ] Document rate limiting strategy

**Days 3: JWT Improvements (8 hours)**
- [ ] Reduce ACCESS_TOKEN_EXPIRE_MINUTES to 15
- [ ] Implement refresh token flow
- [ ] Add `/auth/refresh` endpoint
- [ ] Update frontend to use refresh tokens
- [ ] Test token rotation

**Days 4: Tenant Isolation (8 hours)**
- [ ] Create `get_current_gym_id_required()` dependency
- [ ] Update all endpoints to require gym_id
- [ ] Add gym_id to auth token creation
- [ ] Test tenant isolation
- [ ] Document multi-tenancy enforcement

**Days 5-6: CORS & Headers Security (8 hours)**
- [ ] Fix CORS to allow only necessary methods
- [ ] Add security headers middleware
- [ ] Add HSTS headers
- [ ] Add CSP headers
- [ ] Test header security

**Days 7: Input Validation (8 hours)**
- [ ] Add phone number validation
- [ ] Add capacity constraints (0 < capacity < 500)
- [ ] Add payment amount constraints
- [ ] Add stronger email validation
- [ ] Write validation tests (if tests available)

**Deliverables**:
- ✅ Rate limiting in place
- ✅ JWT improvements implemented
- ✅ Multi-tenancy enforced
- ✅ Security headers set

---

## Month 2: Features & Frontend

### Week 3: Complete Core Endpoints (42 hours)

**Days 1-2: Classes/Sessions Endpoints (10 hours)**
- [ ] Implement GET /sessions (list with gym scoping)
- [ ] Implement POST /sessions (create with gym_id)
- [ ] Implement GET /sessions/{id} (with auth check)
- [ ] Implement PUT /sessions/{id} (update)
- [ ] Implement DELETE /sessions/{id} (soft delete pattern)
- [ ] Implement GET /sessions/{id}/reservations (roster)

**Days 3: Attendance Endpoints (8 hours)**
- [ ] Implement GET /attendance (list with filters)
- [ ] Implement POST /attendance (check-in)
- [ ] Implement GET /attendance/{id}
- [ ] Add proper gym scoping
- [ ] Add validation (can only check-in if reservation exists & future time)

**Days 4: Payment Endpoints (8 hours)**
- [ ] Implement GET /payments (list with gym scoping)
- [ ] Implement POST /payments (record payment)
- [ ] Implement GET /payments/{id}
- [ ] Implement GET /payments?client_id={id} (client payment history)
- [ ] Add payment status validation

**Days 5-6: Extend Schemas (8 hours)**
- [ ] Update ReservationOut to include nested client/session names
- [ ] Create response models for all endpoints
- [ ] Add pagination support to all list endpoints
- [ ] Update API design doc
- [ ] Test schema validation

**Days 7: Admin Endpoints (8 hours)**
- [ ] Implement GET /admin/gyms (list all gyms - admin only)
- [ ] Implement POST /admin/gyms (create gym)
- [ ] Implement GET /admin/gyms/{id}/dashboard (gym analytics)
- [ ] Implement GET /admin/gyms/{id}/usage (usage metrics)
- [ ] Add admin role checks throughout

**Deliverables**:
- ✅ All CRUD endpoints working
- ✅ Proper scoping & validation
- ✅ Consistent response formats

---

### Week 4: Frontend State Management (40 hours)

**Days 1-2: Auth Context (10 hours)**
- [ ] Create AuthContext with login/logout/user state
- [ ] Create AuthProvider component
- [ ] Create useAuth hook
- [ ] Handle 401 responses globally
- [ ] Implement logout functionality

**Days 3: Protected Routes (8 hours)**
- [ ] Create ProtectedRoute wrapper
- [ ] Redirect unauthenticated users
- [ ] Protect all routes under /dashboard
- [ ] Create public routes (login, register)
- [ ] Test navigation flow

**Days 4: API Improvements (8 hours)**
- [ ] Implement retry logic with exponential backoff
- [ ] Add request timeout handling
- [ ] Add response caching for list endpoints
- [ ] Add request deduplication
- [ ] Create error interceptor

**Days 5-6: Custom Hooks (10 hours)**
- [ ] Create useFetch() hook (with caching)
- [ ] Create useForm() hook (form state + validation)
- [ ] Create useLocalStorage() hook
- [ ] Create useDebounce() hook (for search)
- [ ] Create useNotification() hook (for toasts)

**Days 7: Testing**
- [ ] Test auth flow end-to-end
- [ ] Test protected route access
- [ ] Test error handling
- [ ] Test state persistence

**Deliverables**:
- ✅ Auth context working
- ✅ Protected routes in place
- ✅ Custom hooks available
- ✅ API client improved

---

## Month 3: Components & Deployment

### Week 5: Component Library (35 hours)

**Days 1-2: Base Components (12 hours)**
- [ ] Button (variants, sizes, states)
- [ ] Input (with label, error state)
- [ ] Select/Dropdown
- [ ] Checkbox/Radio
- [ ] Modal/Dialog
- [ ] Toast notifications
- [ ] Spinner/Loading indicator

**Days 3-4: Complex Components (14 hours)**
- [ ] Table (with sorting, pagination, filtering)
- [ ] Form wrapper (with error display)
- [ ] Search input with debouncing
- [ ] Date picker
- [ ] Time picker
- [ ] Status badge (for reservations, payments)
- [ ] Card grid layout

**Days 5-6: Page Components (9 hours)**
- [ ] Layout wrapper
- [ ] Header with nav toggle
- [ ] Sidebar (collapsible)
- [ ] Empty state component
- [ ] Error boundary
- [ ] Page loading state

**Deliverables**:
- ✅ Reusable component library
- ✅ Consistent styling
- ✅ Type-safe props

---

### Week 6: Complete Feature Pages (42 hours)

**Days 1-2: Sessions/Classes Page (10 hours)**
- [ ] List sessions (with filtering by date)
- [ ] Create session form
- [ ] Edit session modal
- [ ] Delete session confirmation
- [ ] Show available spots
- [ ] Connection to API working

**Days 3: Attendance Page (8 hours)**
- [ ] Check-in form
- [ ] Today's check-ins list
- [ ] Search by client name
- [ ] View check-in history
- [ ] Print roster

**Days 4: Payments Page (10 hours)**
- [ ] List all payments
- [ ] Record payment form
- [ ] Payment status badge
- [ ] Client payment history modal
- [ ] Revenue summary card

**Days 5: Settings Page (8 hours)**
- [ ] Gym profile view/edit
- [ ] Current subscription
- [ ] Payment method management
- [ ] Team members (view only for MVP)
- [ ] Profile settings for user

**Days 6-7: Polish & Navigation (6 hours)**
- [ ] Add missing nav items to sidebar
- [ ] Navigation between all pages works
- [ ] Fix any routing issues
- [ ] Add page titles dynamically
- [ ] Test on mobile

**Deliverables**:
- ✅ All pages UI complete
- ✅ All API integrations working
- ✅ Responsive on mobile

---

### Week 7-8: Testing & Optimization (60 hours)

**Week 7: Backend Testing (28 hours)**
- [ ] Write unit tests for services
- [ ] Write integration tests for endpoints
- [ ] Set up pytest fixtures
- [ ] Test database interactions
- [ ] Test error scenarios
- [ ] Aim for 70% coverage

**Testing Checklist**:
- Auth (register, login, token refresh)
- Clients (CRUD with gym scoping)
- Sessions (CRUD with capacity)
- Reservations (creation, cancellation, with validation)
- Payments (recording, status)
- Dashboard (aggregation queries)

**Week 8: Frontend Polish (32 hours)**
- [ ] Write integration tests for main flows
- [ ] Performance audit (Lighthouse)
- [ ] Load testing (k6) for API
- [ ] Security audit (npm audit)
- [ ] Bug fixes
- [ ] Mobile UX testing
- [ ] Accessibility review (WCAG)

**Deliverables**:
- ✅ 70%+ test coverage
- ✅ No security vulnerabilities
- ✅ Performance optimized
- ✅ Mobile responsive verified

---

### Week 9: DevOps & Deployment (35 hours)

**Days 1-2: Docker Setup (10 hours)**
- [ ] Create Dockerfile for backend
- [ ] Create Dockerfile for frontend
- [ ] Create docker-compose.yml for local dev
- [ ] Configure PostgreSQL container
- [ ] Test local deployment

**Days 3-4: CI/CD Pipeline (12 hours)**
- [ ] Create GitHub Actions workflow
- [ ] Run tests on every PR
- [ ] Build Docker images
- [ ] Push to registry (Docker Hub or AWS ECR)
- [ ] Deploy to staging automatically

**Days 5-6: Environment Management (8 hours)**
- [ ] Create .env templates for dev/staging/prod
- [ ] Set up secrets in GitHub/AWS
- [ ] Configure environment variables
- [ ] Test env switching

**Days 7: Production Deployment (5 hours)**
- [ ] Choose hosting (Railway recommended)
- [ ] Deploy backend
- [ ] Deploy frontend
- [ ] Configure DNS
- [ ] SSL certificate setup

**Deliverables**:
- ✅ Docker setup complete
- ✅ CI/CD pipeline working
- ✅ Staging environment ready
- ✅ Production deployed

---

### Week 10: Monitoring & Hardening (38 hours)

**Days 1-2: Monitoring (10 hours)**
- [ ] Set up Sentry for error tracking
- [ ] Set up Datadog or similar for metrics
- [ ] Create health check endpoints
- [ ] Set up uptime monitoring
- [ ] Create alert rules

**Days 3: Database Optimization (10 hours)**
- [ ] Add strategic indexes
- [ ] Optimize slow queries
- [ ] Set up query logging
- [ ] Create backup strategy
- [ ] Test backup/restore

**Days 4-5: Security Review (12 hours)**
- [ ] Penetration testing checklist
- [ ] HTTPS enforcement
- [ ] HSTS headers
- [ ] API rate limiting verification
- [ ] SQL injection tests
- [ ] XSS protection tests
- [ ] CSRF protection

**Days 6: Documentation (6 hours)**
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Deployment guide
- [ ] Admin guide
- [ ] User guide
- [ ] Troubleshooting guide

**Deliverables**:
- ✅ Production monitoring active
- ✅ Backup strategy implemented
- ✅ Security hardened
- ✅ Documentation complete

---

### Week 11-12: Final Polish & Launch (45 hours)

**Week 11: Beta Testing & Feedback (22 hours)**
- [ ] Internal team testing
- [ ] Bug fixes from team feedback
- [ ] Performance tuning
- [ ] UX refinements
- [ ] Edge case handling

**Week 12: Launch (23 hours)**
- [ ] Final security audit
- [ ] Load testing
- [ ] Deployment to production
- [ ] Monitor first 72 hours
- [ ] Customer onboarding docs
- [ ] Launch announcement
- [ ] Support handoff

**Deliverables**:
- ✅ Production live
- ✅ Initial customers onboarded
- ✅ Support resources ready

---

## Resource Requirements

### Team Composition (Recommended)
- 2-3 Backend Engineers
- 1-2 Frontend Engineers
- 1 DevOps/Infrastructure
- 1 QA Engineer

### Tech Stack to Complete
- ✅ Backend: FastAPI, SQLAlchemy, PostgreSQL
- ✅ Frontend: React, Vite, TypeScript, Tailwind
- ⏳ Testing: pytest (backend), Vitest (frontend)
- ⏳ Deployment: Docker, GitHub Actions
- ⏳ Monitoring: Sentry, Datadog
- ⏳ Documentation: Swagger/OpenAPI

---

## Success Metrics

### By End of Month 1
- ✅ Zero runtime errors
- ✅ All core endpoints functional
- ✅ Security vulnerabilities < 5
- ✅ Dashboard working with real data

### By End of Month 2
- ✅ 100% feature endpoint coverage
- ✅ Frontend complete for all features
- ✅ Responsive design working
- ✅ Auth flow end-to-end working

### By End of Month 3
- ✅ 70%+ test coverage
- ✅ Production deployed and stable
- ✅ Zero critical vulnerabilities
- ✅ Second user onboarded successfully

---

## Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Database migration fails | Medium | Critical | Test on replica, rollback plan |
| Performance issues at scale | Medium | High | Load test early, optimize indexes |
| Security breach | Low | Critical | Penetration testing, bug bounty |
| Team member unavailable | Medium | Medium | Cross-training, documentation |
| Third-party API issues | Low | High | Fallback options, monitoring |

---

## Budget Estimate

| Phase | Work Hours | Cost (@$150/hr) |
|-------|-----------|-----------------|
| Month 1 | 155 | $23,250 |
| Month 2 | 155 | $23,250 |
| Month 3 | 138 | $20,700 |
| **TOTAL** | **448** | **$67,200** |

**Alternative**: 2 engineers × 3 months = $67,200 (aligns with estimate)

---

## Quick Start Checklist

### Immediately (This Sprint)
- [ ] Read TECHNICAL_ASSESSMENT.md
- [ ] Read ISSUES_AND_BUGS.md
- [ ] Create sprint board in Jira/GitHub
- [ ] Assign team members
- [ ] Schedule daily standups
- [ ] Set up monitoring

### Week 1
- [ ] Complete schema fixes
- [ ] Deploy test migration
- [ ] Fix dashboard
- [ ] Move secrets to .env

### Week 2
- [ ] Add rate limiting
- [ ] Implement refresh tokens
- [ ] Enforce tenant isolation
- [ ] Lock down CORS

### Ongoing
- [ ] Daily standup (15 min)
- [ ] Code review before merge
- [ ] Run tests before deploy
- [ ] Monitor errors in Sentry
- [ ] Weekly retrospective

---

## Sign-Off

**Project Manager**: _________________  
**Tech Lead**: _________________  
**Stakeholder**: _________________  

**Start Date**: April 21, 2026  
**Target Launch**: July 21, 2026  

---

## Appendix: Command Reference

### Development Setup
```bash
# Backend
cd backend
python -m venv .venv
source .venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
cp .env.example .env
alembic upgrade head
uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

### Testing
```bash
# Backend tests
pytest backend/ -v --cov=app

# Frontend tests
npm test -- --run

# Load testing
k6 run -u 100 -d 30s api_test.js
```

### Deployment
```bash
# Build Docker images
docker-compose build

# Test locally
docker-compose up

# Deploy to production
git push deploy main
```

### Monitoring
- Sentry: https://sentry.io/trainity
- Datadog: https://app.datadoghq.com
- Logs: `docker logs -f container_name`
