# Project Roadmap: Jenni Khoe MUA - Web Profile & Gated Booking System

## Target Repositori & Environment
- Remote: https://github.com/Albertensen/Jenni-Khoe-Web.git
- Frontend: Next.js (App Router), Tailwind CSS (Champagne/Rose Gold Theme) -> Vercel
- Backend: Laravel API, MySQL, Laravel Socialite -> Webhook & API Handler
- Integrations: Midtrans/Xendit (HMAC verification), Google Calendar API, WhatsApp Notification

---

## Phase 1: Environment Setup & Scaffolding
- [ ] Inisialisasi toolchain: PHP 8.3, Composer, Node 22 (@Qwen)
- [ ] Scaffolding Next.js App Router di `/frontend` (@Qwen)
- [ ] Scaffolding Laravel API di `/backend` (@Qwen)
- [ ] Setup linting, branch rule, dan repo connection (@Qa Testing)

## Phase 2: Design System & Company Profile (Frontend)
- [ ] Setup token desain Tailwind (palet luxury champagne & rose gold) (@Gemini -> @Qwen)
- [ ] Hero section, navigasi, dan galeri portofolio kategori responsive (@Gemini -> @Qwen)
- [ ] Komponen slider Before/After interaktif (@Gemini -> @Qwen)
- [ ] Form publik "Cek Ketersediaan Tanggal" + WhatsApp floating widget (@Gemini -> @Qwen)
- [ ] Audit responsivitas mobile & clean build check (@Qa Testing)

## Phase 3: Database, API Architecture & Gated Logic
- [ ] Migrasi tabel database MySQL: Clients, Bookings, Quotes, Payments, Logs (@Hermes -> @Qwen)
- [ ] State Machine logic: Inquiry -> Nego -> Approved -> Paid -> Confirmed (@Hermes -> @Qwen)
- [ ] Proteksi halaman & token rute: Gated Pricelist & Invoice Generator (@Hermes -> @Qwen)
- [ ] Audit integrasi endpoint & validasi keamanan request (@Qa Testing)

### Phase 3 Detail — Skema Database (spec @Hermes)

Tabel yang wajib ada di migrasi MySQL:

- **clients** — data dasar klien: `id, name, email, phone, instagram_handle, wedding_date, created_at`
- **bookings** — core state machine: `id, client_id, service_package, event_date, venue, guest_count, status ENUM('inquiry','negotiation','approved','down_payment','paid','confirmed','cancelled'), total_amount, dp_amount (50%), notes, created_at, updated_at`
- **quotations** — riwayat penawaran: `id, booking_id, quote_number, items (JSON), subtotal, tax, grand_total, valid_until, status('sent','accepted','expired'), pdf_path`
- **payments** — transaksi & verifikasi: `id, booking_id, payment_method('QRIS','VA','transfer'), transaction_id (3rd party, UNIQUE), amount, fee, status('pending','settled','failed','refund'), paid_at, xendit_charge_id, raw_webhook (JSON)`
- **schedules** — slot kalender: `id, booking_id, start_datetime, end_datetime, google_event_id, google_event_link, synced_at`
- **logs** — audit trail mutasi status booking & webhook receipt (booking_id, event, payload JSON, created_at)

State machine flow (transisi wajib tervalidasi di service layer, bukan cuma UI):

```
inquiry ──[client submit form]──> negotiation ──[admin approve + send quote]──> approved
approved ──[client pay DP >= 50%]──> down_payment ──[client lunas]──> paid
down_payment / paid ──[admin confirm schedule]──> confirmed ──[sync Google Calendar]
any ──[admin or client cancel]──> cancelled
```

Gated API logic: endpoint `GET /api/pricelist` dan `POST /api/payments/create-link` return **403** jika `booking.status != 'approved'`. Akses pricelist & invoice di frontend memakai signed token per-booking (token route), bukan session publik.

## Phase 4: Integrasi Payment Gateway & Auto-Sync Kalender
- [ ] Integrasi Midtrans/Xendit Snap & Core API (QRIS, VA) (@Hermes -> @Qwen)
- [ ] Webhook endpoint handler dengan verifikasi keamanan HMAC (@Hermes -> @Qwen)
- [ ] Integrasi Google Calendar API (auto-lock slot event pasca-bayar) (@Hermes -> @Qwen)
- [ ] Notifikasi status booking via WhatsApp Gateway (@Qwen)
- [ ] Audit idempotency webhook & simulasi payment sandbox (@Qa Testing)

### Phase 4 Detail — Webhook & Calendar (spec @Hermes)

Webhook handler (endpoint `POST /api/webhooks/xendit`):
- Verifikasi signature: `HMAC_SHA256(JSON body + callback_token)` dibandingkan dengan header `x-callback-token`; request dengan signature tidak valid ditolak **401** sebelum masuk logic.
- Idempotency: `xendit_charge_id` dipetakan ke `payments.transaction_id` dengan constraint UNIQUE — duplicate delivery di-drop, tidak mutasi ulang.
- Alur mutasi: `payment.pending -> settled -> booking.status = paid -> schedule.sync = queued`.
- Simpan `raw_webhook` (JSON) ke tabel `payments`/`logs` untuk forensik.

Integrasi Google Calendar (via Laravel Socialite OAuth2):
- Admin consent sekali jalan, refresh token disimpan terenkripsi di DB.
- Job queue `SyncCalendarBooking` triggered setelah `booking.status = paid`:
  1. Query `schedules` + cek bentrok slot via Google **FreeBusy API**.
  2. Buat `CalendarEvent` (judul, start/end, lokasi, deskripsi berisi info klien).
  3. Simpan `google_event_id` + `google_event_link` ke `schedules`.
  4. Kirim notifikasi konfirmasi via WhatsApp.

Notifikasi WhatsApp Gateway (status booking):
- Trigger: submit inquiry (ke admin), quote dikirim (ke klien), DP diterima, lunas, jadwal terkunci, cancel.
- Template teks per event dengan tombol link (cek pricelist / bayar / konfirmasi jadwal).

## Phase 5: Admin Dashboard & Workflow Approval
- [ ] UI Dashboard Admin: manajemen jadwal kalender & list inquiry klien (@Gemini -> @Qwen)
- [ ] Tombol aksi 1-Click: "Approve Schedule & Send Quotation" (@Hermes -> @Qwen)
- [ ] Audit alur end-to-end booking dari cek tanggal sampai terbayar (@Qa Testing)

Detail interface (@Gemini):
- Halaman admin login terpisah (route `/admin`) — tabel inquiry ber-status + calendar view slot booking (busy/free) yang sync dari `schedules`.
- Tombol aksi 1-click "Approve Schedule & Send Quotation": sekali klik mutasi `negotiation -> approved`, generate PDF quotation, generate token pricelist, kirim ke klien via WhatsApp — semua dalam satu request (DB transaction + queue).
- Halaman klien gated (`/g/{token}`): pricelist detail paket, invoice/penawaran harga, tombol "Bayar DP" (buka Snap/VA), progress status booking.

## Phase 6: Final Hardening & Deployment
- [ ] Security audit: sanitasi input form & rate-limiting API (@Qa Testing)
- [ ] Optimasi bundle Next.js & asset gambar (Lighthouse Mobile > 90) (@Qa Testing)
- [ ] Deploy production Frontend ke Vercel & setup webhook live (@Qa Testing)
