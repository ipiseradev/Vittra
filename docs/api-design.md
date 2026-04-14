# Trainity API Design (MVP)

## Base
- Base URL: `/api/v1`
- Auth: JWT bearer token (`Authorization: Bearer <token>`)
- Content type: `application/json`

## Auth
- `POST /auth/register`
  - Creates studio user account (`admin` or `staff`)
- `POST /auth/login`
  - Accepts form body (`username`, `password`)
  - Returns `{ access_token, token_type }`

## Clients
- `GET /clients`
  - Lists gym/studio clients
- `POST /clients`
  - Creates a new client profile

## Class Sessions
- `GET /sessions`
  - Lists scheduled class sessions
- `POST /sessions`
  - Creates a class session with coach, datetime, and capacity

## Reservations
- `GET /reservations`
  - Lists reservations
- `POST /reservations`
  - Creates reservation linking client and class session

## Attendance
- `GET /attendance`
  - Lists check-ins
- `POST /attendance`
  - Marks reservation as checked in

## Payments
- `GET /payments`
  - Lists payments
- `POST /payments`
  - Registers payment for a client

## Dashboard
- `GET /dashboard/summary`
  - Returns aggregated summary:
    - `total_clients`
    - `total_sessions`
    - `active_reservations`
    - `check_ins_today`
    - `monthly_revenue`

## Suggested Next Endpoints (Post-MVP)
- `PATCH /reservations/{id}` for cancellation or reschedule
- `GET /clients/{id}/payments` for billing timeline
- `GET /sessions/{id}/attendance` for coach roster
- `POST /payments/webhook` for Stripe event ingestion
