# Architecture: Jenni Khoe MUA – Backend System Design

## 1. Database Schema (MySQL)

### Table: clients
| Column | Type | Notes |
|--------|------|-------|
| id | bigint AI PK | |
| name | varchar(255) | |
| email | varchar(255) UNIQUE | |
| phone | varchar(20) | |
| instagram_handle | varchar(255) nullable | |
| wedding_date | date nullable | |
| notes | text nullable | |
| created_at | timestamp | |

### Table: bookings
| Column | Type | Notes |
|--------|------|-------|
| id | bigint AI PK | |
| client_id | bigint FK→clients | |
| service_package | varchar(255) | e.g. "Wedding Full Day" |
| event_date | date | |
| venue | varchar(255) nullable | |
| guest_count | int nullable | |
| status | enum | inquiry/negotiating/approved/down_payment/paid/confirmed/cancelled |
| total_amount | decimal(12,2) | |
| dp_amount | decimal(12,2) | 50% default |
| notes | text nullable | |
| created_at | timestamp | |
| updated_at | timestamp | |

### Table: quotations
| Column | Type | Notes |
|--------|------|-------|
| id | bigint AI PK | |
| booking_id | bigint FK→bookings | |
| quote_number | varchar(50) UNIQUE | auto-generated |
| items | json | [{description, qty, unit_price, amount}] |
| subtotal | decimal(12,2) | |
| tax | decimal(12,2) | 11% PPN |
| grand_total | decimal(12,2) | |
| valid_until | date | |
| status | enum | sent/accepted/expired |
| pdf_path | varchar(255) nullable | |
| created_at | timestamp | |

### Table: payments
| Column | Type | Notes |
|--------|------|-------|
| id | bigint AI PK | |
| booking_id | bigint FK→bookings | |
| payment_method | enum | QRIS/VA/transfer |
| transaction_id | varchar(255) UNIQUE | idempotency key |
| amount | decimal(12,2) | |
| fee | decimal(12,2) default 0 | |
| status | enum | pending/settled/failed/refund |
| paid_at | timestamp nullable | |
| xendit_charge_id | varchar(255) UNIQUE nullable | |
| raw_webhook | json nullable | |
| created_at | timestamp | |

### Table: schedules
| Column | Type | Notes |
|--------|------|-------|
| id | bigint AI PK | |
| booking_id | bigint FK→bookings | |
| start_datetime | datetime | |
| end_datetime | datetime | |
| google_event_id | varchar(255) nullable | |
| google_event_link | text nullable | |
| synced_at | timestamp nullable | |
| created_at | timestamp | |

## 2. State Machine Booking

```
inquiry ──[submit form]──> negotiating
negotiating ──[admin approve + send quote]──> approved
approved ──[client pay DP ≥50%]──> down_payment
down_payment ──[client lunas]──> paid
paid ──[admin confirm schedule]──> confirmed ──[sync Google Calendar]
any state ──[cancel]──> cancelled
```

**Transition rules:**
- `inquiry→negotiating`: automatic after client submits "Cek Tanggal" form
- `negotiating→approved`: admin action only (dashboard Approve button)
- `approved→down_payment`: webhook verified callback (payment ≥50%)
- `down_payment→paid`: webhook verified callback (remaining balance)
- `paid→confirmed`: admin action (confirm schedule slot + trigger calendar sync)
- `→cancelled`: admin or client cancel (grace period 24h)
- All transitions logged in a `booking_logs` audit table.

## 3. Webhook Payment Gateway (HMAC SHA256)

### Endpoint
`POST /api/webhooks/xendit`

### Verification
```
HMAC_SHA256(rawRequestBody + callbackToken) == x-callback-token header
```
- Mismatch → 403, no leak of what went wrong
- Match → process mutation

### Payload processing
```
payments.status: pending → settled
  → bookings.status = paid (or down_payment if ≤50%)
  → dispatch SyncCalendarBooking job
  → send WhatsApp notification
```

### Security
- `callback_token` stored in `.env`, never exposed
- IP whitelist: Xendit callback IPs only
- UNIQUE constraint on `payments.transaction_id` for idempotency
- Duplicate callback → silently ignored

## 4. Google Calendar Integration

### OAuth Flow
- Admin consent via Laravel Socialite (`google` driver)
- Scopes: `https://www.googleapis.com/auth/calendar`, `https://www.googleapis.com/auth/calendar.events`
- Refresh token stored in `settings` table (encrypted)

### SyncCalendarBooking Job
Triggered on: `booking.status = paid`

Steps:
1. Query `schedules` for this booking
2. Check overlap via `Google FreeBusy API` for the requested time slot
3. If overlap → notify admin, no event created (status stays `paid`)
4. If clear → create `CalendarEvent`:
   - Title: `Jenni Khoe - {client_name}`
   - Start/end: from `schedules`
   - Location: venue (from booking)
   - Description: client name, phone, package, guest count
5. Save `google_event_id` + `google_event_link` to `schedules`
6. Update `bookings.status = confirmed`

## 5. Gated Access Logic

| Endpoint | Gate | Response |
|----------|------|----------|
| `GET /api/pricelist` | `booking.status = approved` | 403 if not approved |
| `POST /api/payments/create-link` | `booking.status = approved` | 403 if not approved |
| `GET /api/invoice/{quoteToken}` | `booking.status` in [approved, paid, confirmed] | 404 silent otherwise |

**QuoteToken**: `SHA256(booking_id + env('QUOTE_SECRET'))` — 7-day expiry, cached server-side.