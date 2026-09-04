# Project Roadmap: Jenni Khoe MUA - Web Profile & Gated Booking System

## Target Repositori & Environment
- Remote: https://github.com/Albertensen/Jenni-Khoe-Web.git
- Frontend: Next.js (App Router), Tailwind CSS (Champagne/Rose Gold Theme) -> Vercel
- Backend: Laravel API, MySQL, Laravel Socialite -> Webhook & API Handler
- Integrations: Midtrans/Xendit (HMAC verification), Google Calendar API, WhatsApp Notification

---

## Phase 1: Environment Setup & Scaffolding
- [ ] Install toolchain: PHP 8.3, Composer, Node 22 (@Qwen)
- [ ] Scaffold Next.js App Router di `/frontend` (@Qwen)
- [ ] Scaffold Laravel API di `/backend` (@Qwen)
- [ ] Setup ESLint, Prettier, branch protection, remote verified (@Qa Testing)

## Phase 2: Design System & Company Profile (Frontend)
- [ ] Setup Tailwind token: luxury champagne & rose gold palette (@Gemini -> @Qwen)
- [ ] Hero section, nav, kategori galeri portofolio responsive (@Gemini -> @Qwen)
- [ ] Before/After interactive image slider component (@Gemini -> @Qwen)
- [ ] Form "Cek Ketersediaan Tanggal" + floating WhatsApp widget (@Gemini -> @Qwen)
- [ ] Audit mobile responsiveness & clean build (@Qa Testing)

## Phase 3: Database, API Architecture & Gated Logic
- [ ] Migrasi MySQL: `clients`, `bookings`, `quotations`, `payments`, `schedules` tables (@Hermes -> @Qwen)
- [ ] State machine: inquiry → negotiation → approved → down_payment → paid → confirmed → cancelled (@Hermes -> @Qwen)
- [ ] Gated endpoint: `GET /api/pricelist` & `POST /api/payments/create-link` return 403 if `booking.status != approved` (@Hermes -> @Qwen)
- [ ] API auth token validation & error handling (@Hermes -> @Qwen)
- [ ] Audit endpoint security & DB integrity (@Qa Testing)

### DB Schema (Phase 3 Detail)
- **clients**: id, name, email, phone, instagram_handle, wedding_date, created_at
- **bookings**: id, client_id, service_package, event_date, venue, guest_count, status ENUM('inquiry','negotiation','approved','down_payment','paid','confirmed','cancelled'), total_amount, dp_amount(50%), notes, created_at, updated_at
- **quotations**: id, booking_id, quote_number, items(JSON), subtotal, tax, grand_total, valid_until, status(sent/accepted/expired), pdf_path
- **payments**: id, booking_id, payment_method(QRIS/VA/transfer), transaction_id, amount, fee, status(pending/settled/failed/refund), paid_at, xendit_charge_id, raw_webhook(JSON)
- **schedules**: id, booking_id, start_datetime, end_datetime, google_event_id, google_event_link, synced_at

### State Machine Detail
```
inquiry → [client submit] → negotiation
negotiation → [admin approve + send quote] → approved
approved → [client pay DP ≥50%] → down_payment
down_payment → [client lunas] → paid
paid → [admin confirm] → confirmed → [sync Google Calendar]
any state → cancelled [admin or client cancel]
```

## Phase 4: Payment Gateway & Auto-Sync Calendar
- [ ] Integrasi Xendit Snap/API (QRIS, VA) for payment creation (@Hermes -> @Qwen)
- [ ] Webhook `POST /api/webhooks/xendit` with HMAC SHA256 verification (@Hermes -> @Qwen)
- [ ] Idempotency via `payments.transaction_id` UNIQUE constraint + duplicate webhook ignore (@Hermes -> @Qwen)
- [ ] Google Calendar OAuth via Laravel Socialite — admin consent flow (@Hermes -> @Qwen)
- [ ] Job `SyncCalendarBooking` triggered on `booking.status = paid`: check FreeBusy API overlap, create event, store google_event_id (@Hermes -> @Qwen)
- [ ] WhatsApp notification on each status change (@Qwen)
- [ ] Audit: sandbox payment simulation, webhook replay idempotency, calendar lock test (@Qa Testing)

### Webhook HMAC Detail
- Endpoint: `POST /api/webhooks/xendit`
- Verification: `HMAC_SHA256(body + callback_token)` → compare `x-callback-token` header
- Mutation: `payments.status: pending → settled` → `bookings.status = paid` → queue `SyncCalendarBooking`

## Phase 5: Admin Dashboard & Workflow Approval
- [ ] Dashboard layout: booking list, calendar view, client data table (@Gemini -> @Qwen)
- [ ] 1-Click actions: "Approve & Send Quotation" changes state + triggers email/WA (@Hermes -> @Qwen)
- [ ] Calendar UI shows available vs booked dates (@Gemini -> @Qwen)
- [ ] End-to-end audit: cek tanggal → book → approve → bayar → calendar lock (@Qa Testing)

## Phase 6: Final Hardening & Deployment
- [ ] Security: input sanitization (XSS), rate limiting (100 req/min public endpoints) (@Qa Testing)
- [ ] Optimasi: Next.js bundle, WebP assets, Lighthouse Mobile > 90 (@Qa Testing)
- [ ] Deploy frontend ke Vercel + custom domain HTTPS (@Qa Testing)
- [ ] Live webhook endpoint reachable from Xendit sandbox (@Qa Testing)

---

## Definition of Done
Lihat `docs/CHECKLIST.md` untuk checklist tiap phase.

## Pembagian Peran
- **@Hermes**: System Architect — desain DB, state machine, webhook spec, Google Calendar integration
- **@Gemini**: UI/UX — design token, komponen interaktif, dashboard layout
- **@Qwen**: Fullstack Worker — implementasi semua spec, scaffold, migration, controller, component
- **@Qa Testing**: DevOps & QA — git workflow, audit, lint/type check, Vercel deploy, security review