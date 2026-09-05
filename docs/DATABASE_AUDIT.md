# Phase 5 Audit — Database Schema, Foreign Keys & Indexes

## 1. Database Tables (MySQL 8)

| Table | Schema Complete | FK | Indexes | Status |
|-------|----------------|----|---------|--------|
| users | ✅ id, name, email, password | — | PRIMARY, email UNIQUE | ✅ |
| clients | ✅ id, name, email, phone, instagram_handle, wedding_date | — | PRIMARY | ✅ |
| bookings | ✅ id, client_id, service_package, event_date, venue, guest_count, status ENUM, total_amount, dp_amount, hold_expires_at, notes | ✅ client_id -> clients.id | PRIMARY, status, event_date | ✅ |
| quotations | ✅ id, booking_id, quote_number, base_items JSON, selected_addons JSON, subtotal, discount, grand_total, dp_required, valid_until, status ENUM, pdf_path | ✅ booking_id -> bookings.id | PRIMARY | ✅ |
| contracts | ✅ id, booking_id, quotation_id, spk_number, terms_content LONGTEXT, client_signature_data LONGTEXT, client_signature_path, signed_ip, signed_at, pdf_path | ✅ booking_id, quotation_id | PRIMARY | ✅ |
| payments | ✅ id, booking_id, payment_method ENUM, transaction_id UNIQUE, amount, fee, status ENUM, paid_at, xendit_charge_id, raw_webhook JSON | ✅ booking_id -> bookings.id | PRIMARY, transaction_id UNIQUE | ✅ |
| schedules | ✅ id, booking_id, start_datetime, end_datetime, google_event_id, google_event_link, synced_at | ✅ booking_id -> bookings.id | PRIMARY | ✅ |
| logs | ✅ id, booking_id, event, payload JSON, actor | ✅ booking_id -> bookings.id | PRIMARY, created_at | ✅ |
| social_accounts | ✅ id, user_id, provider, provider_id | ✅ user_id -> users.id | PRIMARY | ✅ |
| inquiries | ✅ id, name, whatsapp, email, event_date, venue, package, guest_count, message, source, consent | — | PRIMARY, created_at | ✅ |
| gated_tokens | ✅ id, booking_id, token UNIQUE, expires_at, used_at | ✅ booking_id -> bookings.id | PRIMARY, token, expires_at | ✅ |

## 2. Foreign Keys
- All foreign keys use `cascadeOnDelete()` for referential integrity
- contracts table has composite FK to both bookings and quotations
- gated_tokens cascades on booking delete

## 3. State Machine Validation

| Transition | Allowed | Notes |
|------------|---------|-------|
| inquiry -> negotiation | ✅ | Start negotiation with client |
| inquiry -> cancelled | ✅ | Client cancels before negotiation |
| negotiation -> approved | ✅ | Admin approves booking |
| negotiation -> inquiry | ✅ | Revert to inquiry |
| negotiation -> cancelled | ✅ | Cancel during negotiation |
| approved -> down_payment | ✅ | Client pays DP (triggers hold_expires_at = now+48h) |
| approved -> hold_expired | ✅ | Auto-transition after 48h inactivity |
| approved -> cancelled | ✅ | Cancel even after approval |
| hold_expired -> inquiry | ✅ | Revert to inquiry after hold expires |
| down_payment -> paid | ✅ | Full payment received |
| down_payment -> cancelled | ✅ | Cancel after DP (refund required) |
| paid -> confirmed | ✅ | Booking confirmed, calendar locked |
| paid -> cancelled | ✅ | Cancel after full payment (refund required) |
| confirmed -> cancelled | ✅ | Last-resort cancellation |

## 4. Sanitization
- Laravel Query Builder / Eloquent: parameterized queries (no SQL injection)
- Input validation: `Validator` with `regex:/^62\d{8,15}$/` for WA
- XSS: Blade `{{ }}` auto-escapes, API returns JSON only
- Rate limiting: `throttle:5,1` on public inquiry endpoint
- Signed URLs: 64-char random token with TTL 48h
- Canvas signature: base64 stored as LONGTEXT (validated server-side in Phase 6)

## 5. Index Recommendations
- `bookings.status` ✅ (already indexed)
- `bookings.event_date` ✅ (already indexed)
- `logs.created_at` ✅ (already indexed)
- `inquiries.created_at` ✅ (already indexed)
- `gated_tokens.token` ✅ (indexed)
- `gated_tokens.expires_at` ✅ (indexed)
- Consider composite index: `bookings(client_id, status)` for per-client queries

✅ Audit Complete — all tables have proper FK, indexes, and state validation.
