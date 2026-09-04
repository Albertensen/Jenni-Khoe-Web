# Definition of Done — Project MUA

Setiap milestone dinyatakan **DONE** hanya jika semua item di bawah hijau.

## Phase 1: Environment Setup & Scaffolding
- [ ] PHP 8.3 + Composer terverifikasi (`php -v`, `composer --version`)
- [ ] `backend/` adalah Laravel 11 fresh install, bisa `php artisan serve`
- [ ] `frontend/` adalah Next.js App Router, bisa `npm run dev`
- [ ] ESLint + Prettier config aktif, `npm run lint` lulus tanpa error
- [ ] Branch `main` dilindungi (branch protection rule via GitHub)
- [ ] Remote `origin` terverifikasi push/pull

## Phase 2: Design System & Company Profile (Frontend)
- [ ] Tailwind config memuat palet champagne/rose gold token
- [ ] Hero + Nav + Galeri render di mobile & desktop (Chrome DevTools)
- [ ] Before/After slider interaktif berfungsi (drag/click)
- [ ] Form "Cek Tanggal" validasi input + error state
- [ ] Lighthouse Mobile > 80 untuk halaman landing

## Phase 3: Database, API Architecture & Gated Logic
- [ ] Migrasi `Clients`, `Bookings`, `Quotes`, `Payments`, `Logs` berjalan tanpa error
- [ ] State machine transisi Inquiry→Nego→Approved→Paid→Confirmed tervalidasi via unit test
- [ ] Endpoint pricelist & invoice return 403 jika status != Approved
- [ ] Auth token/API key expired logic teruji
- [ ] Tidak ada SQL injection (parameterized query all)

## Phase 4: Payment Gateway & Calendar Sync
- [ ] Midtrans/Xendit Snap transaction sukses di sandbox
- [ ] Webhook endpoint verifikasi HMAC signature cocok
- [ ] Google Calendar event ter-create setelah status = Paid
- [ ] Duplicate webhook ignored (idempotency key)
- [ ] Notifikasi WhatsApp terkirim di tiap status change

## Phase 5: Admin Dashboard & Approval
- [ ] Dashboard admin menampilkan list inquiry real dari DB
- [ ] Tombol "Approve & Send Quote" mengubah state + trigger email/WA
- [ ] UI kalender menampilkan booked vs available dates
- [ ] End-to-end flow: Cek Tanggal → Booking → Approved → Bayar → Kalender ter-lock

## Phase 6: Hardening & Deployment
- [ ] Form input disanitasi (XSS prevention)
- [ ] Rate limiting aktif di endpoint publik (100 req/min)
- [ ] Lighthouse Mobile > 90
- [ ] Deploy frontend ke Vercel — domain kustom nyala HTTPS
- [ ] Webhook endpoint live reachable dari Midtrans sandbox