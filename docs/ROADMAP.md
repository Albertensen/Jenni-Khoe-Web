# Master Roadmap: Jenni Khoe MUA - Luxury Portfolio & Autonomous Booking Engine

## Modern Tech Stack & Architecture (2026 Standard)
- **Frontend:** Next.js 15 (App Router, Server Actions), React 19, Tailwind CSS v4, Framer Motion, Lenis Smooth Scroll
- **Visual & Canvas Engine:** Canvas Texture Magnifier (Ultra-HD micro-zoom), Smooth Image Comparison Slider
- **Backend API & Data:** Laravel 11 API (PHP 8.3), MySQL 8, Redis (Queue & Webhook Processing)
- **Storage & Media:** Cloudinary / Supabase Storage (Auto-format WebP/AVIF, Blurhash generation)
- **Payments & Integrations:** Midtrans / Xendit Core API (Snap, QRIS Realtime, Virtual Account with HMAC-SHA256), Google Calendar API (FreeBusy sync), WhatsApp Business Gateway
- **Infrastructure & CI/CD:** Vercel (Frontend), VPS / Cloud Server (Backend & Workers), GitHub Actions

---

### Phase 1: Toolchain, Repository Governance & Monorepo Setup
- [x] Inisialisasi toolchain: PHP 8.3, Composer, Node 22 (@Prime_Agent)
- [x] Scaffolding Next.js App Router di `/frontend`
- [x] Scaffolding Laravel API di `/backend` (@Prime_Agent)
- [x] Setup Git branching policy (`main`, `dev`, `feature/*`), commit convention, dan remote repo verification (@Prime_Agent)
- [x] Konfigurasi linting & formatting: ESLint, Prettier, TypeScript strict mode, PHP Pint (@Prime_Agent)

---

### Phase 2: Brand Identity, Design Tokens & Luxury Visual System
- [x] Setup token desain Tailwind (palet luxury champagne, rose gold, warm nude, deep charcoal)
- [x] Standardisasi tipografi: Editorial Display Serif (Cormorant Garamond / Cinzel) dipadukan dengan Plus Jakarta Sans (@Prime_Agent)
- [x] Integrasi Lenis Smooth Scroll untuk interaksi scroll editorial (@Prime_Agent)
- [x] Pembuatan komponen UI atomik: Button glassmorphism, floating label inputs, dialog modals, toast alerts (@Prime_Agent)
- [x] Transisi halaman Framer Motion: Layout fade, image stagger, dan subtle text reveals (@Prime_Agent)

---

### Phase 3: High-End Interactive Portfolio & Visual Proof
- [x] Hero section, navigasi responsif, dan galeri portofolio kategori
- [x] Komponen slider Before/After interaktif
- [ ] **Ultra-HD Texture Loupe (Magnifier):** Fitur inspeksi mikro tekstur kulit wajah pada galeri portofolio untuk membuktikan riasan *flawless* tanpa efek *cakey* (@Prime_Agent -> @Qwen_Worker)
- [ ] **Multidimensional Lookbook Matrix:** Filter portofolio dinamis berdasarkan *Skin Undertone* (Warm, Neutral, Cool) dan *Venue Lighting* (Indoor Ballroom Chandelier vs Outdoor Sunset) (@Prime_Agent -> @Qwen_Worker)
- [ ] **Slider Before/After 2.0:** Dual-lighting toggle (*Studio Flash* vs *Natural Sunlight*) dengan pembatas *metallic gold bar* (@Prime_Agent -> @Qwen_Worker)
- [ ] **Social Proof & Bride Stories:** Carousel video reels vertikal dan review testimoni pengantin (@Prime_Agent -> @Qwen_Worker)
- [ ] Audit responsivitas mobile & optimasi aset WebP/AVIF (@Prime_Agent)

---

### Phase 4: Lead Intake, Date Verification & Autonomous AI CS
- [x] Form publik "Cek Ketersediaan Tanggal" + WhatsApp floating widget
- [ ] **Autonomous AI Customer Service (CS) Chat Widget:** Widget chat cerdas 24/7 konversi pengunjung jadi qualified lead. Zero server cost, zero RAM (serverless edge).
  - **Frontend:** Floating chat bubble + draggable popup panel (React, Tailwind, Framer Motion). State: idle -> typing -> response -> escalate/capture.
  - **Backend:** Vercel AI SDK edge function, streaming SSE. Model GPT-4o-mini (budget cap $5/bln via Vercel env).
  - **System Prompt:** Persona "Jenni Khoe Virtual Assistant" — luxury tone, BI/EN, knowledge base from website content. Scope: jadwal, paket, harga, venue, skin prep only.
  - **Intent Detection:** Classifier: `greeting`, `faq_package`, `faq_price`, `availability_check`, `booking_intent`, `complaint`, `spam`. Escalate ke WhatsApp CS untuk `booking_intent` / `complaint`.
  - **Lead Capture:** After 3-5 messages -> trigger inline form (nama, WA, tanggal acara) -> POST `/api/leads` (Laravel). Simpan localStorage consent.
  - **Context Memory:** Ringkas histori per 10 pesan -> <4K tokens. Session cache di Vercel Edge Config (gratis).
  - **Fallback:** API LLM fail/timeout -> FAQ tree statis offline. Nonsense -> "Hubungkan ke Kak Jenni via WhatsApp" buka wa.me.
- [ ] **Public Date Availability Calendar:** Tampilan visual kalender untuk slot *available*, *booked*, dan *on hold* (@Prime_Agent -> @Qwen_Worker)
- [ ] **Smart WhatsApp Payload Dispatcher:** Form submit memicu WhatsApp dengan pesan terstruktur otomatis berisi rincian tanggal, lokasi, dan paket riasan impian (@Prime_Agent -> @Qwen_Worker)
- [ ] **Inquiry API Endpoint (`POST /api/inquiries`):** Sanitasi data, rate limiter (`throttle:5,1`), dan pencatatan otomatis ke tabel database (@Prime_Agent -> @Qwen_Worker)

---

### Phase 5: Database Architecture, Gated Logic & Closing Engine
- [ ] Migrasi database MySQL lengkap (tabel clients, bookings, quotations, contracts, payments, schedules, logs) (@Prime_Agent -> @Qwen_Worker)
- [ ] **State Machine Enforcement:** Validasi transisi status booking di level service layer (`inquiry` -> `negotiation` -> `approved` -> `down_payment` / `paid` -> `confirmed`) (@Prime_Agent -> @Qwen_Worker)
- [ ] **Gated Route Cryptographic Generator:** Pembuatan token URL sekali pakai (`/g/{signed_token}`) dengan TTL (Time To Live) 24â€“48 jam (@Prime_Agent -> @Qwen_Worker)
- [ ] Audit skema database, foreign keys, indeks transaksi, dan validasi request sanitization (@Prime_Agent)

#### Detail Skema Database (MySQL 8)
- **clients:** `id, name, email, phone, instagram_handle, wedding_date, created_at`
- **bookings:** `id, client_id, service_package, event_date, venue, guest_count, status ENUM('inquiry','negotiation','approved','hold_expired','down_payment','paid','confirmed','cancelled'), total_amount, dp_amount, hold_expires_at, notes, created_at, updated_at`
- **quotations:** `id, booking_id, quote_number, base_items (JSON), selected_addons (JSON), subtotal, discount, grand_total, dp_required, valid_until, status ENUM('draft','sent','accepted','expired'), pdf_path, created_at`
- **contracts:** `id, booking_id, quotation_id, spk_number, terms_content (LONGTEXT), client_signature_data (LONGTEXT/BASE64), client_signature_path, signed_ip, signed_at, pdf_path, created_at`
- **payments:** `id, booking_id, payment_method ENUM('QRIS','VA','credit_card'), transaction_id (UNIQUE), amount, fee, status ENUM('pending','settled','failed','expired','refund'), paid_at, xendit_charge_id, raw_webhook (JSON), created_at`
- **schedules:** `id, booking_id, start_datetime, end_datetime, google_event_id, google_event_link, synced_at`
- **logs:** `id, booking_id, event, payload (JSON), actor, created_at`

---

### Phase 6: The Closing Portal (`/g/{token}`), E-Signature & Payment
- [ ] **Urgency Countdown Banner:** Jam hitung mundur sisa waktu penahanan slot tanggal (misal: "23:59:00 sebelum slot dilepas ke calon pengantin lain") (@Prime_Agent -> @Qwen_Worker)
- [ ] **Dynamic Add-on Customizer (Real-time Calculator):** Checkbox interaktif untuk penambahan rias Ibu/Mertua, Bridesmaid, Extra Touch-Up Malam, dan Transport Luar Kota yang langsung memperbarui subtotal dan kalkulasi DP 50% secara instan (@Prime_Agent -> @Qwen_Worker)
- [ ] **Digital SPK Canvas (Surat Perjanjian Kerja):** Canvas tanda tangan digital interaktif via jari / stylus lengkap dengan klausul hukum sebelum pembayaran (@Prime_Agent -> @Qwen_Worker)
- [ ] **Automated PDF Engine:** Penggabungan invoice rincian add-on dan tanda tangan digital klien ke file PDF resmi ber-watermark (@Prime_Agent -> @Qwen_Worker)
- [ ] **Payment Gateway Integration:** Checkout terintegrasi QRIS instan dan Virtual Account via Midtrans / Xendit Snap & Core API (@Prime_Agent -> @Qwen_Worker)

---

### Phase 7: Automation Engine, Calendar Sync & Admin Center
- [ ] **HMAC-SHA256 Webhook Receiver (`POST /api/webhooks/payment`):** Verifikasi signature callback dari payment gateway dan proteksi idempotency anti-duplicate delivery (@Prime_Agent -> @Qwen_Worker)
- [ ] **Scheduled Task / Cron Laravel:** Pemeriksaan berkala tiap menit untuk otomatis mengubah status booking yang kedaluwarsa menjadi `hold_expired` (@Prime_Agent -> @Qwen_Worker)
- [ ] **Google Calendar Bi-Directional Sync:** Cek bentrok via FreeBusy API dan auto-create event saat status booking masuk ke `down_payment` atau `paid` (@Prime_Agent -> @Qwen_Worker)
- [ ] **WhatsApp Automated Messenger:** Notifikasi konfirmasi otomatis terkirim beserta file PDF invoice dan jadwal resmi (@Prime_Agent -> @Qwen_Worker)
- [ ] **Admin Command Dashboard (`/admin`):** Kalender jadwal kerja terpadu, pipeline Kanban inquiry, dan tombol 1-Click "Approve & Generate Closing Link" (@Prime_Agent -> @Qwen_Worker)
- [ ] Audit simulasi sandbox: Form -> Nego -> Approve -> Add-on -> SPK -> QRIS Bayar -> Calendar Lock (@Prime_Agent)

---

### Phase 8: Hardening, SEO Performance & Production Launch
- [ ] **Security Hardening:** Sanitasi payload canvas tanda tangan (mencegah XSS), rate-limiting API route publik (`throttle:10,1`), dan enkripsi token URL (@Prime_Agent)
- [ ] **Performance & Asset Optimization:** Next.js bundle optimization, font subsetting, dan target skor Lighthouse Mobile > 90 (@Prime_Agent)
- [ ] **Local SEO & Rich Snippets:** Implementasi Schema.org JSON-LD (LocalBusiness & Service) untuk ranking pencarian MUA (@Prime_Agent -> @Qwen_Worker)
- [ ] **Production Deployment:** Deployment frontend Next.js ke Vercel dan backend Laravel API ke hosting/server produksi (@Prime_Agent)

---

INSTRUKSI EKSEKUSI SEKARANG:
1. Simpan konten di atas ke path `C:\Users\Administrator\Documents\WEB MUA\docs\ROADMAP.md`.
2. Verifikasi keutuhan berkas.
3. Jalankan perintah Git berikut di terminal:
   git add docs/ROADMAP.md && git commit -m "docs: establish comprehensive 8-phase master roadmap with luxury engine specs" && git push origin main
4. Laporkan commit hash dan status push remote setelah selesai.