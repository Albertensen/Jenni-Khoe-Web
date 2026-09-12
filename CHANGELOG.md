# Changelog — Jenni Khoe MUA

Semua perubahan signifikan dicatat di file ini.
Format: [YYYY-MM-DD HH:mm] — deskripsi perubahan.

---

## 2026-09-12 07:45 — Integrasi Google Calendar & Sinkronisasi Jadwal Rias MUA

### Added
- **Google OAuth 2.0 Integration & Auth Flow**:
  - `GET /api/google/auth`: Inisiasi redirect ke Google Consent Screen dengan scope `calendar`, `calendar.events`, dan `userinfo.email` (`offline access` & `consent prompt`).
  - `GET /api/google/callback`: Handler pertukaran authorization code menjadi access token, refresh token, expiry, dan email akun Google yang tersimpan aman di database Supabase.
  - `GET /api/google/settings`: Status koneksi akun Google, email, nama kalender, dan Authorized Redirect URI.
  - `POST /api/google/settings`: Pengaturan kredensial Google Client ID & Secret langsung melalui modal antarmuka admin (atau via environment variable).
  - `DELETE /api/google/settings`: Fitur pemutusan (disconnect) koneksi akun Google dengan aman.
- **Dua Arah (Bidirectional) Google Calendar Sync Engine (`/api/google/sync`)**:
  - Push jadwal booking klien ke Google Calendar secara terstruktur (nama klien, paket, nomor SPK, kontak, lokasi venue, pengingat 1 hari & 2 jam sebelum acara).
  - Simpan dan hubungkan `google_event_id` serta tautan langsung `google_event_link` ke database.
  - Pull agenda eksternal dari Google Calendar ke kalender MUA untuk mendeteksi kesibukan atau jadwal personal MUA.
  - Auto-refresh token Google secara transparan saat access token kadaluarsa menggunakan refresh token.
- **Revamp Antarmuka Admin Schedules (`/admin/schedules`)**:
  - Banner status Google Calendar (indikator terhubung/belum, akun email, waktu sync terakhir, tombol "Hubungkan Akun Google", "Sinkronkan Google", dan "Putuskan").
  - Modal panduan & setup kredensial Google OAuth 2.0 Client ID & Secret dengan fitur copy Authorized Redirect URI.
  - Tampilan kalender interaktif bulanan dengan penanda tanggal hari ini, navigasi bulan, badge jumlah agenda, dan pembedaan warna kategori (Booking MUA: Amber/Gold, Google Calendar: Blue, Studio Manual: Purple).
  - Panel agenda harian di sisi kanan beserta tombol WhatsApp langsung ke klien dan tombol pintas "Buka di Google Calendar".
  - Fitur tambah agenda manual atau blokir tanggal studio (photoshoot, libur, maintenance).
- **Database Refinement**:
  - Tabel `google_calendar_settings` di Supabase untuk persistensi OAuth tokens dan konfigurasi sync.
  - Kolom `title`, `description`, `location`, dan `source` pada tabel `schedules`.

---

## 2026-09-12 07:15 — Sinkronisasi Otomatis Metode & Status Pembayaran (Payments Ledger & Reconciliation)

### Added
- **Bidirectional Payment Sync Engine**:
  - `GET /api/payments`: Auto-reconciliation otomatis antara tabel `bookings`, `deal_customers`, dan `payments`. Booking yang belum tercatat di payments otomatis dibuatkan entri transaksi (dengan TRX ID unik, nominal DP, metode, dan status).
  - `PATCH /api/payments`: Mengubah status atau metode pembayaran di tabel `payments` secara otomatis menyinkronkan status booking (`status: 'confirmed'`, `payment_status: 'confirmed'`) dan deal terkait (`status: 'dp_paid'`), serta sebaliknya.
  - `POST /api/payments`: Mendukung aksi `{ action: 'sync_all' }` untuk sinkronisasi massal seluruh data riwayat booking ke payments.
- **Hook Sinkronisasi di Seluruh Alur Transaksi**:
  - `/api/bookings` (PATCH & POST): Perubahan status atau metode pembayaran pada booking langsung mengupdate atau membuat entri pada ledger `payments`.
  - `/api/deals` (PATCH): Perubahan status atau metode deal langsung menyinkronkan data booking dan ledger `payments`.
  - `/api/booking/[token]/payment` (POST): Pemilihan metode pembayaran oleh klien di checkout portal langsung menyinkronkan ke deal, booking, dan payments.
  - `/api/booking/[token]/sign` (POST): Tanda tangan SPK digital langsung mendaftarkan entri pembayaran di tabel `payments`.
- **Revamp Admin Payments Page (`/admin/payments`)**:
  - **Stat Cards**: Total Lunas (Settled), Menunggu Pembayaran (Pending), Total Ledger, dan Saluran Terpopuler.
  - **Filter & Pencarian**: Filter instan berdasarkan Status (Settled, Pending, Failed, Refund) dan Metode (Transfer BCA, QRIS, Kartu Kredit, VA), serta pencarian nama klien, SPK, dan TRX ID.
  - **Dropdown Metode Interaktif**: Admin dapat mengubah metode pembayaran langsung pada baris tabel, otomatis tersinkron ke Bookings dan Deals.
  - **Aksi Cepat Verifikasi Status**: Tombol "✓ Tandai Lunas" dan "Batal Lunas" satu-klik yang menyinkronkan status ke seluruh database.
  - **WhatsApp Direct Confirmation**: Tombol kirim pesan konfirmasi resmi WhatsApp ke klien dengan template pesan profesional sesuai status pembayaran.
  - **Salin ID Transaksi**: Tombol klik untuk menyalin TRX ID dengan visual feedback.
- **Database Refinement**:
  - Menghapus check constraint kaku `payments_payment_method_check` dan `payments_status_check` di database Supabase dan memperbarui skema `supabase_schema.sql` agar mendukung metode transfer dan nilai status fleksibel.
  - Menambahkan kolom `deal_id` pada tabel `payments`.

---

## 2026-09-12 06:46 — Pengaturan Default T&C SPK & Sinkronisasi ke Portal Klien

### Added
- **Default T&C Management di SPK Archive (`/admin/contracts`)**:
  - Menambahkan tab khusus **"⚙️ Default T&C SPK Klien"** di halaman `/admin/contracts`.
  - Admin dapat mengedit judul dan seluruh isi pasal/klausul Syarat & Ketentuan (T&C) SPK secara dinamis.
  - Tombol **"Simpan & Terapkan ke Klien"** (`POST /api/contracts/tnc`) dengan notifikasi status dan timestamp pembaruan terakhir.
  - Tombol **"Reset ke Standar Studio"** untuk mengembalikan klausul ke 6 pasal standar luxury Jenni Khoe MUA sewaktu-waktu.
  - **Pratinjau Langsung (Live Client Preview)**: Tampilan visual real-time di sisi admin yang menyimulasikan persis bagaimana klausul T&C, checkbox persetujuan, dan area tanda tangan tampil di layar HP/browser klien.
- **Backend & Database (`spk_tnc_settings`)**:
  - Membuat tabel `spk_tnc_settings` pada Supabase untuk menyimpan template T&C default aktif secara persisten.
  - Endpoint `GET /api/contracts/tnc` & `POST /api/contracts/tnc` untuk manipulasi template.
- **Sinkronisasi Otomatis ke Portal Klien (`/booking/[token]`)**:
  - `GET /api/booking/[token]` otomatis menyertakan data `spk_tnc` aktif.
  - Formulir tanda tangan digital klien di Step 2 secara dinamis memuat teks klausul T&C yang telah disimpan oleh admin (bukan lagi teks hardcoded).
  - Saat klien menandatangani SPK, `POST /api/booking/[token]/sign` mencatat dan membekukan (snapshot) klausul T&C aktif tersebut ke dalam kolom `contracts.terms_content` sehingga dokumen legal SPK di masa depan tetap autentik sesuai kesepakatan saat ditandatangani.

---

## 2026-09-12 06:40 — Sinkronisasi Otomatis SPK Digital ke SPK Archive (`/admin/contracts`)

### Added
- **Otomasi Penyimpanan SPK Archive (`contracts`)**:
  - `src/app/api/booking/[token]/sign/route.ts`: Menyimpan dan mengarsipkan secara otomatis surat perjanjian kerja (SPK) digital ke tabel `contracts` saat klien menandatangani di form/portal reservasi (`/booking/[token]`).
  - Menyimpan metadata lengkap: Nomor SPK, ID Booking & Deal, Nama Klien, WhatsApp, Paket Layanan, Tanggal Acara, Venue, Waktu Tanda Tangan, IP Audit, dan data goresan tanda tangan digital (Base64 PNG).
  - `src/app/api/bookings/route.ts`: Sinkronisasi otomatis dari reservasi Bookings ke `contracts` saat pembuatan atau pembaruan data booking.
  - `src/app/api/contracts/route.ts`:
    - Auto-reconciliation untuk memastikan seluruh reservasi yang telah memiliki SPK digital otomatis terarsip dan tidak ada data yang hilang.
    - Menambahkan endpoint `GET`, `POST`, dan `DELETE` dengan format data komprehensif.
- **Peningkatan Halaman SPK Archive (`/admin/contracts`)**:
  - Tampilan luxury bertema Jenni Khoe MUA dengan kartu metrik (Total SPK Terarsip, Sah Ditandatangani, Menunggu TTD).
  - Kolom pencarian instan (nama klien, WhatsApp, nomor SPK, paket, venue) dan filter status.
  - Tabel interaktif dengan tautan WhatsApp langsung, badge nomor SPK mono, dan status legal sah.
  - **Modal Viewer Dokumen SPK Sah**: Menampilkan surat perjanjian kerja lengkap dengan format kop surat studio, klausul kesepakatan resmi, verifikasi digital, stempel resmi Jenni Khoe MUA, dan goresan tanda tangan digital klien.
  - Fitur cetak / simpan PDF langsung dari browser (`window.print()`).

---

## 2026-09-12 06:10 — Peningkatan Desain Button Add Deal Manual di Deal Customer

### Changed
- **Penyempurnaan Tombol Add Deal Manual (`/admin/deals`)**:
  - Mengubah teks tombol dari "+ Tambah Deal Manual" menjadi **"Add Deal Manual"**.
  - Mengubah warna tombol dari hitam (`bg-luxury-charcoal`) menjadi palet luxury rose-gold khas Jenni Khoe MUA (`bg-gradient-to-r from-luxury-rose-gold-dark to-luxury-rose-gold` dengan border & shadow elegan).
  - Menyesuaikan proporsi ukuran dan padding (`px-5 py-2.5`, SVG plus icon presisi, efek hover halus) agar terlihat proporsional dan mewah di samping tombol Refresh.
  - Memperbarui tombol submit modal pembuatan deal agar senada dengan warna brand rose-gold.

---

## 2026-09-12 05:45 — Penyempurnaan Deal Customer Manual, Paket Makeup Editable, & Filter Alur Sukses

### Changed
- **Penyederhanaan Deal Customer (`/admin/deals`)**:
  - Menghapus kolom SPK digital dan status pembayaran dari tabel Deal Customer agar fokus pada tahap negosiasi jadwal & paket.
  - Menambahkan pengeditan paket riasan (dropdown paket standar + input paket kustom) yang dapat diubah dan disimpan langsung oleh admin.
  - Menambahkan tombol **"+ Tambah Deal Manual"** dan modal formulir untuk memasukkan customer luar website yang menghubungi langsung via WhatsApp.
  - Menambahkan label sumber customer yang jelas: **`🤖 Prospek CS CRM`** (dari AI website) atau **`✍️ Manual by Admin`** (dari WhatsApp luar).
  - Mengubah logika siklus hidup deal: setelah status pembayaran `Success` (dana DP terkonfirmasi masuk), customer otomatis **hilang dari daftar Deal Customer** dan hanya ada di menu **Bookings**.
- **Penyempurnaan Verifikasi Pembayaran di Bookings (`/admin/bookings`)**:
  - Tombol **"✓ Confirm Dana Masuk"** hanya dimunculkan khusus untuk metode **Transfer Bank BCA**.
  - Untuk metode QRIS dan Kartu Kredit, tombol konfirmasi manual disembunyikan dan dialihkan ke indikator "Menunggu Webhook Gateway (Otomatis)".
  - Menyediakan label status **`✅ Success`** berwarna hijau untuk pembayaran yang telah terverifikasi/lunas.

---

## 2026-09-12 05:00 — Otomatisasi Masuk Booking, Trigger Pembayaran Klien, & Konfirmasi Dana Masuk

### Added
- **Sinkronisasi Otomatis SPK ke Bookings**:
  - Saat klien menandatangani SPK digital pada `/booking/[token]`, sistem langsung membuat/menghubungkan data ke tabel `bookings` dan `clients`.
  - Reservasi langsung muncul di menu admin `/admin/bookings` dengan nomor SPK, tautan bukti tanda tangan digital, dan status awal `belum_bayar`.
- **Trigger Interaktif Metode Pembayaran di Portal Klien (Step 3)**:
  - Nomor rekening bank tidak langsung ditampilkan secara terbuka kepada klien.
  - Klien diwajibkan memilih opsi metode pembayaran: **Transfer Bank BCA**, **QRIS**, atau **Kartu Kredit**.
  - Pilihan metode langsung memicu pembaruan status pembayaran di database (`payment_method`: `transfer`/`qris`/`kartu_kredit`, `payment_status`: `menunggu_konfirmasi`).
  - Rincian nomor rekening (BCA `5271-8902-31` a/n JENNI KHOE) dan tombol WhatsApp konfirmasi bukti transfer hanya terbuka setelah tombol metode diklik.
- **Label & Aksi Admin "Belum Bayar" & Follow Up WhatsApp**:
  - Jika klien telah menandatangani SPK namun belum memilih metode/melakukan pembayaran, sistem memberikan label merah `❌ Belum Bayar`.
  - Admin memiliki tombol khusus **"Follow Up WA (Belum Bayar)"** pada menu `/admin/bookings` dan `/admin/deals` untuk mem-follow up klien secara personal via WhatsApp dengan pesan otomatis.
- **Tombol Aksi Admin "Confirm Dana Masuk"**:
  - Pada baris klien yang telah memilih metode pembayaran (Transfer BCA, QRIS, Kartu Kredit), admin disediakan tombol **"✓ Confirm Dana Masuk"**.
  - Tombol ini ditekan setelah admin mengecek mutasi bank/bukti transfer, langsung memperbarui status menjadi `✅ Dana Masuk (Confirmed)` serta sinkron di tabel `bookings` dan `deal_customers`.

---

## 2026-09-12 04:30 — Modul Deal Customer, SPK Digital, dan Portal Booking Mandiri

### Added
- **Database Supabase `deal_customers`**:
  - Tabel khusus untuk menampung klien yang telah deal dari CRM, mencakup tanggal & jam deal terkunci, lokasi venue, token unik booking, nomor SPK, persetujuan T&C, dan tanda tangan digital klien.
- **Tombol "Jadikan Deal" di Prospek CS CRM (`/admin/ai-leads`)**:
  - Tombol pada kolom Aksi Prospek untuk memindahkan klien langsung ke database Deal Customer dengan status lead tertutup (`closed`).
  - Notifikasi toast sukses dengan tautan langsung menuju menu Deal Customer.
- **Menu & Halaman Admin Baru: Deal Customer (`/admin/deals`)**:
  - Penguncian Jadwal: Form inline untuk admin memasukkan/mengubah tanggal dan jam deal yang otomatis mengunci form customer.
  - Tombol "Kirim Form via WA": Membuat draft pesan WhatsApp otomatis berisi tautan unik formulir reservasi klien (`/booking/[token]`).
  - Pelacakan progress reservasi multi-tahap (`draft` -> `form_sent` -> `form_submitted` -> `spk_signed` -> `dp_paid`).
  - Modal pratinjau SPK sah dan tanda tangan digital klien.
- **Portal Booking Mandiri Klien (`/booking/[token]`)**:
  - **Langkah 1 (Formulir Reservasi)**: Pengisian nama, nomor HP, dan lokasi/venue acara. Tanggal dan jam acara berstatus *read-only terkunci* sesuai pengaturan admin.
  - **Langkah 2 (T&C & SPK Digital)**: Dokumen Surat Perjanjian Kerja resmi Jenni Khoe MUA dengan klausul DP 50%, pelunasan H-7, kebijakan pembatalan/reschedule, dan kanvas tanda tangan digital interaktif.
  - **Langkah 3 (Pembayaran DP)**: Instruksi transfer Bank BCA (`5271-8902-31` a/n JENNI KHOE) dilengkapi tombol salin rekening dan tombol WhatsApp kirim bukti transfer otomatis.
- **Endpoint API**:
  - `GET`, `POST`, `PATCH /api/deals`
  - `GET`, `POST /api/booking/[token]`
  - `POST /api/booking/[token]/sign`
  - `POST /api/booking/[token]/payment`

### Removed
- Menghapus menu navigasi, kartu statistik dashboard, dan halaman `/admin/inquiries` yang sudah tidak terpakai.

---

## 2026-09-12 03:45 — Penyatuan Kanal "Kalender Slot" & Penghapusan Label "Cek Tanggal"

### Changed
- `src/components/CheckAvailabilityForm.tsx`:
  - Standarisasi `source: "kalender_tanggal"` dan `interest: "Kalender Slot: [EVENT]"` pada pengiriman data prospek ke `/api/ai-leads`.
  - Judul header diselaraskan menjadi "Kalender Slot & Kunci Tanggal Acara".
- `src/app/admin/ai-leads/page.tsx`:
  - Penghapusan opsi filter dan label "Cek Tanggal" (`cek_jadwal`).
  - Kanal CRM kini fokus pada 3 sumber utama: `🤖 Chat CS`, `⚡ Booking Cepat`, dan `📅 Kalender Slot`.
  - Pemetaan otomatis untuk data historis `cek_jadwal` menjadi badge dan filter `📅 Kalender Slot`.
- `src/app/api/ai-leads/route.ts`:
  - Fungsi `normalizeSource` memetakan varian sumber legacy (`cek_jadwal`, `chatbot`) secara transparan menjadi `kalender_tanggal` dan `chat_widget`.
  - Pelabelan log aktivitas: seluruh interaksi kalender terdata seragam sebagai *Pilih Slot Kalender* / *Kunci Slot Tanggal Kalender*.
- `src/app/page.tsx`, `src/components/chat/ChatBubble.tsx`, `src/data/faq.ts`, `src/lib/chat/system-prompt.ts`:
  - Penyelarasan navigasi anchor dan teks rujukan dari "Cek Jadwal" menjadi "Kalender Slot".

---

## 2026-09-12 03:20 — Anti-Duplikasi Kontak CRM Berbasis Nomor WhatsApp & Log Multi-Kanal Multi-Nama

### Added
- Database Supabase `ai_leads`: Penambahan kolom `activity_log jsonb DEFAULT '[]'::jsonb` untuk merekam riwayat seluruh interaksi dan touchpoint klien.
- Riwayat Multi-Nama (Client Name Preservation):
  - Jika klien dengan nomor WA yang sama memasukkan nama berbeda di formulir berbeda (misalnya: nama "Aura" di Booking Cepat dan "Aurelia Chandra" di Chat CS), kedua nama tetap tercatat secara utuh.
  - Setiap log aktivitas menyimpan `client_name` spesifik yang dimasukkan pada saat itu.
  - Halaman Admin menampilkan nama utama beserta badge alias nama lain: *`Nama di Booking Cepat: "Aura"`*.
- Timeline Log Aktivitas Interaktif (`/admin/ai-leads`):
  - Tombol ekspansi `🕒 X Log Aktivitas` pada setiap baris tabel CRM.
  - Laci timeline vertikal menampilkan detail per interaksi: Tanggal & Jam (WIB), badge kanal (`🤖 Chat CS`, `⚡ Booking Cepat`, `🔍 Cek Tanggal`, `📅 Kalender Slot`), aksi/paket yang dipilih, nama yang dimasukkan, detail jadwal/venue, dan kutipan pesan.

### Changed
- `src/app/api/ai-leads/route.ts`:
  - **Deduplikasi Level Database (POST)**: Pencarian prospek berbasis nomor WhatsApp yang dinormalisasi (`cleanPhone`). Jika sudah pernah terdaftar, sistem memperbarui (update in-place) dan menambahkan entri baru ke `activity_log`, bukan membuat baris duplikat.
  - **Deduplikasi Level Query & Aggregasi (GET)**: Mengelompokkan seluruh riwayat kontak berdasarkan nomor WhatsApp unik, menggabungkan log aktivitas, dan mengidentifikasi daftar alias nama yang pernah digunakan.
- `src/app/api/chat/route.ts`: Sinkronisasi pembaruan tahap closing chat langsung ke prospek dengan nomor telepon yang sama.

---

## 2026-09-12 02:45 — Penggabungan Cek Ketersediaan Tanggal & Kalender Slot Realtime

### Changed
- `frontend/src/components/CheckAvailabilityForm.tsx` — Menyatukan formulir cek ketersediaan dan kalender slot realtime menjadi 1 modul utuh:
  - **Sisi Kiri (Kalender Interaktif)**: Navigasi bulan, grid tanggal dengan status ketersediaan (hijau = tersedia, abu = terbooking, kuning = hold), dan highlight tanggal terpilih. Calon klien bisa langsung klik tanggal yang diinginkan di kalender.
  - **Sisi Kanan (Formulir Reservasi Tanggal)**: Sinkronisasi dua arah otomatis dengan tanggal yang diklik pada kalender. Meminta Nama Calon Klien & No WhatsApp aktif (wajib), kategori acara, dan kota/venue.
  - **Aksi 1-Klik**: Tombol *Lock Tanggal via WhatsApp Resmi* otomatis mencatat prospek ke CRM `ai_leads` (`source: 'cek_jadwal'`), menyimpan session ke `localStorage`, dan mengarahkan ke WhatsApp resmi Kak Jenni.
- `frontend/src/app/page.tsx` — Menghapus penumpukan `<DateCalendar />` terpisah di halaman utama sehingga layout menjadi rapi dan terpusat.
- `frontend/src/components/DateCalendar.tsx` — Di-refactor menjadi shim re-export ke `CheckAvailabilityForm` untuk menjaga kompatibilitas.

---

## 2026-09-12 02:25 — Removal of Price Details from CS Chat & Quick Booking (WhatsApp-Only Pricelist Policy)

### Changed
- `src/components/WhatsAppDispatcher.tsx` (Booking Cepat):
  - Menghapus seluruh nominal harga rupiah (Rp) dari daftar opsi paket.
  - Mempertahankan deskripsi fokus layanan:
    - *Luxury Royal Bridal (Akad + Resepsi, Full Retouch & Standby)*
    - *Intimate / Holy Matrimony (1 Sesi Riasan Sakral & Touch-up)*
    - *Engagement / Prewedding Photoshoot*
    - *Family, Bridesmaid & Pengiring Pengantin*
  - Menambahkan catatan ke calon klien: *Pricelist resmi & penawaran khusus akan langsung dikirimkan oleh Kak Jenni melalui WhatsApp setelah formulir terkirim.*
- `src/app/api/chat/route.ts`, `src/lib/chat/system-prompt.ts`, dan Database Supabase `ai_chat_presets` (id=1):
  - Menghapus seluruh angka harga pada info paket (`packages_info`), rekomendasi paket otomatis, dan smart fallback intent harga/paket.
  - Menerapkan aturan ketat: AI CS hanya menjelaskan cakupan fasilitas & keunggulan layanan paket, lalu secara elegan mengarahkan calon klien untuk menerima katalog PDF pricelist resmi lengkap via WhatsApp resmi Kak Jenni.
- `src/data/faq.ts`: Memperbarui jawaban FAQ harga riasan pengantin & wisuda/party agar bebas dari angka harga dan mengarahkan konsultasi pricelist langsung ke WhatsApp.
- `src/app/admin/ai-preset/page.tsx` & `src/app/api/admin/chat-preset/route.ts`: Menghapus nominal harga dari preset default admin.

---

## 2026-09-12 02:00 — Universal Pre-WhatsApp Gating & Multi-Touchpoint CRM Tracking

### Added
- **Gatekeeper Wajib Nama & No WA di Semua Jalur Kontak**:
  - `CheckAvailabilityForm.tsx` (Cek Ketersediaan Tanggal): Klien wajib input Nama & No WhatsApp. Saat dicek dan klik "Lock Tanggal via WhatsApp Resmi", data auto-tersimpan ke database CRM `ai_leads` (`source: 'cek_jadwal'`).
  - `WhatsAppDispatcher.tsx` (Booking Cepat): Ditambahkan field input No WhatsApp wajib. Klik "Kirim via WhatsApp" auto-mencatat ke database CRM (`source: 'booking_cepat'`, stage: `Siap Booking / Menuju WhatsApp`).
  - `DateCalendar.tsx` (Kalender Jadwal): Klik tanggal hijau membuka modal penguncian slot yang meminta Nama & No WhatsApp sebelum menuju WhatsApp resmi (`source: 'kalender_tanggal'`).
  - `ChatBubble.tsx` (AI CS): Gatekeeper sebelum sesi konsultasi chat dibuka (`source: 'chat_widget'`).
- **Sinkronisasi Identitas Global**: Klien hanya perlu mengisi nama dan nomor WhatsApp sekali di salah satu fitur; identitas tersinkronisasi via `localStorage` antar widget secara otomatis.
- `src/app/admin/ai-leads/page.tsx` (Prospek CS CRM):
  - Ditambahkan badge visual Kanal Sumber: 🤖 Chat CS, 🔍 Cek Tanggal, ⚡ Booking Cepat, 📅 Kalender Slot.
  - Ditambahkan filter dropdown "Semua Kanal Sumber".
  - Template pesan follow-up 1-klik WhatsApp cerdas yang menyesuaikan isi draf dengan kanal sumber dan data acara yang diinput klien.
- `src/app/layout.tsx` & `src/app/page.tsx`: Menghapus tombol floating WhatsApp bypass agar seluruh interaksi kontak klien dipastikan melewati pencatatan CRM.

---

## 2026-09-12 01:35 — Pre-Chat Gating dan CRM Prospek CS

### Added
- `frontend/src/components/chat/ChatBubble.tsx` — Wajibkan calon klien mengisi **Nama Lengkap + Nomor WhatsApp aktif** sebelum bisa chat dengan AI CS lewat form gatekeeper.
- Setelah submit, data klien langsung dibuatkan record di tabel Supabase `ai_leads` (nama, nomor HP, session_id, created_at, closing_stage awal = "Form Terisi (Lead Masuk)").
- Session klien disimpan di localStorage; jika kembali ke website, chat langsung lanjut tanpa isi formulir ulang. Tombol 🔄 untuk mulai sesi baru / ganti identitas.
- `frontend/src/app/api/chat/route.ts` — Setiap pesan chat memperbarui `ai_leads` (jumlah pesan, closing_stage otomatis dari percakapan, detail jadwal tanggal/venue/jam, pesan terakhir).
- `calculateClosingStage()` — Deteksi tahap closing otomatis: Form Terisi → Tanya Jawab Jadwal & Lokasi → Mendapat Rekomendasi Paket & Pricelist → Siap Booking / Menuju WhatsApp.
- `frontend/src/app/admin/ai-leads/page.tsx` — Panel **Prospek CS CRM** berisi: nama klien, nomor HP (klik salin), waktu chat (tanggal + jam), tahap closing saat ini (badge warna), detail jadwal terdata, pesan terakhir, status prospek dropdown (Baru/Prospek Ulang/Ditawari/Deal/Batal), dan tombol Chat WA dengan draft pesan follow-up otomatis sesuai tahap closing.
- KPI funnel 5 kartu: Total Calon Klien, Form Terisi, Tanya Jadwal, Dapat Pricelist, Siap Booking.
- `frontend/src/app/api/ai-leads/route.ts` — GET semua lead, POST upsert by session, PATCH update status/closing_stage, dan normalisasi nomor HP (08xxx → 628xxx).

---

## 2026-09-12 00:55 — Fix CS Chat Repetitive Question Loop & Context Memory

### Fixed
- `frontend/src/app/api/chat/route.ts` — Mengatasi bug perulangan chat CS yang terus-menerus menanyakan tanggal, lokasi, dan jam meskipun user sudah menjawab.
- Mengimplementasikan `extractEntities()` pada seluruh riwayat percakapan untuk mengekstrak dan mengingat entitas tanggal, lokasi/venue, jam acara, jenis acara, serta jumlah orang.
- Menerapkan aturan anti-repetisi ketat baik di fallback knowledge engine maupun injeksi prompt `[DATA KLIEN YANG SUDAH DITERIMA]` ke model `COMBO-UTAMA`.
- Jika tanggal, lokasi, dan jam sudah diterima, asisten langsung mengonfirmasi ketersediaan slot privat dan memandu pemilihan konsep riasan / penguncian tanggal via WhatsApp.
- Update rules preset di tabel database Supabase `ai_chat_presets`.

---

## 2026-09-12 00:35 — AI CS Chatbot COMBO-UTAMA & Admin Preset Customizer

### Added
- `frontend/src/app/api/admin/chat-preset/route.ts` — Serverless REST API untuk GET dan POST konfigurasi preset AI CS di Supabase table `ai_chat_presets`.
- `frontend/src/app/admin/ai-preset/page.tsx` — Halaman panel admin untuk kustomisasi penuh AI Customer Service: model identifier (`COMBO-UTAMA`), endpoint URL, API key, temperature, max tokens, greeting message, system prompt persona, aturan/tugas CS (cek jadwal, booking flow, batasan diskon), knowledge base paket & harga, serta integrasi WhatsApp hotline.
- Supabase Cloud DDL: tabel `ai_chat_presets` dengan RLS policy dan default seed data `COMBO-UTAMA`.
- `frontend/src/components/chat/ChatBubble.tsx` — Widget floating chat CS interaktif mewah dengan indikator online, dynamic greeting dari preset, quick-action chips (Cek Jadwal, Info Paket, Konsep Riasan, WhatsApp), dan auto-scroll.
- Sidebar menu item `CS AI Preset` di `frontend/src/app/admin/layout.tsx`.
- Dokumentasi modul AI CS Preset di `docs/ROADMAP.md` Phase 7.

### Changed
- `frontend/src/app/api/chat/route.ts` — Refactor dari Groq statis ke provider model dinamis (`COMBO-UTAMA`), injeksi aturan & knowledge base dari preset Supabase, auto-capture prospek nomor HP ke tabel `ai_leads`, dan graceful fallback cerdas anti-down ke knowledge base saat model timeout/offline.
- `frontend/src/app/page.tsx` — Ganti tombol WhatsApp statis dengan widget interaktif `ChatBubble` live AI CS.

---

## 2026-09-12 00:10 — Fix Ultra-HD Texture Loupe optical coordinate calculation

### Fixed
- `frontend/src/components/portfolio/TextureLoupe.tsx` — eliminated coordinate offset where zoomed area did not match the lens circle. Replaced hardcoded dimensions with dynamic container measurement (`ResizeObserver` + `getBoundingClientRect`), auto-detected natural aspect ratio of the image to remove letterbox drift, and scaled `backgroundSize` to `containerDimensions * zoom`. Center of the loupe ring now projects with 1:1 optical accuracy to the exact cursor coordinate.

---

## 2026-09-11 23:45 — Fix remote image delivery with direct CDN rendering & seed live showcase portfolio

### Fixed
- `frontend/next.config.ts` — configured `images.unoptimized: true` and wildcard remotePatterns to eliminate Next.js Vercel 400 Bad Request (`INVALID_IMAGE_OPTIMIZE_REQUEST`) on external Unsplash / Supabase image URLs.
- `frontend/src/components/portfolio/BeforeAfterSlider2.tsx` — added `unoptimized` flag to before and dual-lighting after `<Image>` tags.
- `frontend/src/components/portfolio/LookbookMatrix.tsx` — added `unoptimized` flag to grid and modal preview `<Image>` tags.
- `frontend/src/components/portfolio/TextureLoupe.tsx` — added `unoptimized` flag to base texture inspection `<Image>` tag.

### Added
- Seeded prime showcase portfolio record `#1`: **"Royal Sundanese Siger Glam"** (Bride: Aurelia & Jonathan) with verified high-res Before, After Studio, After Natural Light, and Ultra-HD Texture loupe images, synchronized live with landing page `/` and `/admin/portfolio`.

---

## 2026-09-11 23:15 — Dynamic CMS Portfolio & Main Page Visual Proof Synchronization

### Added
- Database migration on Supabase `portfolio_items` adding columns: `category`, `bride_name`, `description`, `venue_lighting`, `before_image_path`, `after_natural_image_path`, `texture_image_path`, `is_featured_before_after`, and `is_featured_texture`.
- `frontend/src/app/api/portfolio/route.ts` — extended GET, POST, and PATCH to support full portfolio attributes, multi-image upload / URL handling, and quick featured toggling.
- `frontend/src/app/admin/portfolio/page.tsx` — upgraded CMS interface with multi-image inputs (Main After Studio, Before, After Natural Light, Ultra-HD Texture), category & lighting select, and 1-click toggles for "Main B/A Slider" and "Main Texture".
- `frontend/src/components/portfolio/LookbookMatrix.tsx` — added `initialItems` prop to render dynamic Supabase portfolio records with graceful static fallback.
- `frontend/src/app/page.tsx` — integrated live Supabase fetching with ISR (`revalidate = 60`), binding the featured Before/After transformation slider and Ultra-HD texture inspection loupe dynamically to active database records.
- `docs/ROADMAP.md` — added and marked dynamic portfolio CMS synchronization task as completed in Phase 7.

---

## 2026-09-11 22:30 — Fix admin redirect bug caused by viewport prefetching of logout link

### Fixed
- `frontend/src/app/admin/layout.tsx` — replaced `<Link href="/api/logout">` with explicit interactive `<button onClick={handleLogout}>` using POST, disabled aggressive prefetch (`prefetch={false}`) on navigation links. Next.js automatic viewport prefetch on the logout `<Link>` had been wiping the `admin_token` cookie silently in background.
- `frontend/src/app/api/logout/route.ts` — guarded GET against prefetch headers (`purpose: prefetch`, `x-purpose: prefetch`, `next-router-prefetch: 1`) so cookie is only removed upon explicit POST or intentional user logout.
- `frontend/src/middleware.ts` — decoded JWT base64url with fallback and 30s clock skew tolerance to prevent edge decode failure.
- `frontend/src/app/login/page.tsx` — enforced hard page redirect `window.location.href = "/admin"` to bust client router prefetch cache.

---

## 2026-09-11 22:00 — Complete Supabase serverless integration for admin panel & API routes

### Added
- `frontend/src/app/api/admin/stats/route.ts` — live aggregation stats from Supabase
- `frontend/src/app/api/bookings/route.ts` — bookings query joined with client details
- `frontend/src/app/api/inquiries/route.ts` — inquiries CRUD via Supabase
- `frontend/src/app/api/contracts/route.ts` — digital SPK contract archive queries
- `frontend/src/app/api/payments/route.ts` — payment reconciliation queries
- `frontend/src/app/api/schedules/route.ts` — schedule calendar slot queries
- `frontend/src/app/api/portfolio/route.ts` & `[id]/route.ts` — portfolio CMS management and deletion
- `frontend/src/app/api/ai-leads/route.ts` — AI chatbot leads archive queries

### Changed
- `frontend/src/middleware.ts` — local Supabase JWT verification eliminates prefetch rate limits and unexpected redirect to /login
- `frontend/src/app/admin/*` — removed all references to `BACKEND_URL` / `localhost:8000` across all 8 admin pages
- `frontend/src/app/api/generate-token/route.ts` — migrated from Laravel to Supabase `gated_tokens`
- `frontend/src/app/api/leads/route.ts` — directly persists inquiries and AI leads to Supabase

---

## 2026-09-11 21:30 — Update architecture & governance documentation for serverless stack

### Changed
- `README.md` — updated architecture diagram, tech stack, and setup guides to Next.js + Supabase
- `CORE.md` — updated workspace, remote, and runtime specs to reflect Supabase serverless
- `docs/ARCHITECTURE.md` — full rewrite of database DDL tables, Supabase Auth flow, and Next.js route handlers
- `docs/ROADMAP.md` — updated tech stack specs and milestone items for Supabase PostgreSQL
- `docs/WORKFLOW.md` — updated audit gate, Vercel rootDirectory, and deploy protocol
- `docs/SESSION_STATUS.md` — added complete handoff notes, active credentials, and next-agent guidelines

---

## 2026-09-11 21:00 — Migrate auth & database architecture to Supabase serverless

### Added
- `supabase_schema.sql` — PostgreSQL DDL schema with RLS for Supabase project
- `frontend/src/lib/supabase.ts` — lightweight Supabase client initialization helper

### Changed
- `frontend/src/app/api/login/route.ts` — switched from local Laravel proxy to direct Supabase Auth
- `frontend/src/middleware.ts` — verified session token via Supabase Auth API
- `frontend/package.json` — installed `@supabase/supabase-js` and `@supabase/ssr`

---

## 2026-09-11 20:30 — Fix bootstrap providers and configure Sanctum API guard

### Fixed
- `backend/bootstrap/providers.php` — restored `AppServiceProvider::class` registration
- `backend/config/auth.php` — configured default API guard with `sanctum` driver

---

## 2026-09-05 21:30 — Docker deploy, portfolio upload, PHP fixes, cron completion

### Added
- Dockerfile + docker-compose.yml + Nginx/Supervisor config — PHP 8.3 FPM + MySQL 8.0 container stack
- `.env.production` template for deployment
- Portfolio upload API: `POST /api/portfolio` (multipart image), `DELETE /api/portfolio/{id}`, `POST /api/portfolio/reorder`
- Admin portfolio page — upload form with file input + image preview, delete button
- `config/services.php` — Google Calendar + WhatsApp API config keys
- `.env` — Google Calendar, WhatsApp config placeholder keys
- `GET /api/schedule/check-expired-holds` endpoint (trigger Artisan command from cron-less env)

### Changed
- `app/Console/Commands/CheckExpiredHolds.php` — completed handle() logic (was stub), status check uses `BookingStateMachine::APPROVED` constant
- `app/Http/Controllers/PortfolioController.php` — fixed `$p` variable reference (syntax error)
- `app/Http/Controllers/ScheduleController.php` — fixed `$s` variable reference (syntax error)
- `app/Http/Controllers/ContractController.php` — fixed `$c` variable reference (syntax error)
- `app/Http/Controllers/PaymentController.php` — fixed `$p` variable reference (syntax error)
- `app/Http/Controllers/AiLeadController.php` — fixed `$l` variable reference (syntax error)
- `app/Http/Controllers/BookingController.php` — removed duplicate `index()` method (was 3 copies)
- `app/Http/Controllers/GatedRouteController.php` — fixed broken class syntax
- `app/Http/Controllers/PortfolioUploadController.php` — fixed `$i` variable reference
- `app/Console/Kernel.php` — fixed escaped `$this` syntax
- `app/Models/Booking.php` — fixed escaped `$` signs
- All 38 PHP files verified syntax-clean
- Frontend Next.js build: verified clean (exit 0)



## 2026-09-05

### 09:00 — Setup workspace & toolchain
- Patched `_winjob.py` + `bash.py` — CREATE_NO_WINDOW flag (0x08000000) untuk suppress console flash
- Installed PHP 8.3.33 di `C:\tools\php83`, Composer 2.10.3
- PATH updated via HKCU\Environment
- Installed `openai` Python package

### 09:15 — Sub-agent setup
- LM Studio endpoint verified: `http://localhost:1234/v1`
- Dispatch function created: `dispatch()` — tulis task spec ke `.subagent/tasks/`, POST ke LM Studio, simpan output ke `.subagent/outputs/`
- Continual harness memori: dispatch pattern + config saved

### 10:30 — Model switch & optimasi
- Switch `huihui-qwen3.8-27b-abliterated` -> `qwen2.5-coder-14b-instruct` (14B Q5_K_M)
- Reasoning OFF, ctx 16384, evalBatchSize 1024, temperature 0.1
- Performance: ~7 tok/s, cukup untuk 1 file per task
- GPU: RTX 3060 Ti 8GB, offload 31/48 layers, VRAM ~85% used

### 11:00 — GitHub & Vercel integration
- GitHub remote updated with full-access PAT
- Remote: `https://github.com/Albertensen/Jenni-Khoe-Web.git`
- Vercel project `jenni-khoe-mua` created under team REBAHAN
- Frontend deployed (production): `https://jenni-khoe-ggkh66nc8-rebahan.vercel.app`
- Vercel token configured

### 11:15 — Backend scaffold (via sub-agent qwen2.5-coder-14b)
- `backend/composer.json` — Laravel 11 + Socialite + Dompdf
- `backend/.env.example` — DB, Google OAuth, Xendit, WhatsApp config

### 11:30 — Governance docs updated
- Created `CORE.md` — master entry point (workspace, remote, rules)
- Created `CHANGELOG.md` — progress log (wajib update setiap perubahan)
- Removed `PROJECT_STATE.md` dan `TASK_LOG.md` (digantikan CORE.md + CHANGELOG.md)


## 2026-09-05 19:41 — Phase 8 bug fixes (audit-driven)

### Critical Fixes
- `backend/bootstrap/app.php`: Added `api:` route loading — sebelumnya hanya web.php, seluruh backend API tidak berfungsi (@Prime_Agent)
- `backend/app/Services/GatedRouteService.php`: Ganti `Str::random(64)` ke `bin2hex(random_bytes(32))` — token sebelumnya pakai 62-char alphabet (a-z, A-Z, 0-9) tapi controller validasi regex `/^[a-f0-9]{64}$/`, akibatnya **setiap token ditolak** (@Prime_Agent)
- `frontend/src/app/api/leads/route.ts`: Tambah `checkRateLimit()` — sebelumnya import utility tapi tidak pernah dipanggil, endpoint publik tanpa proteksi (@Prime_Agent)
---

## Format
**Task:** [nama task]
**Sub-agent:** [sub-agent yang dipakai]
**Files:** [file yang dihasilkan]
**Status:** Done / WIP / Failed
**Notes:** [catatan penting]

### 2026-09-05 10:40 — Git sync GitHub
- README.md: updated with WAJIB BACA redirect to CORE.md
- CORE.md: created (master entry point)
- CHANGELOG.md: created (progress log)
- frontend/.gitignore: added .vercel
- frontend/vercel.json: created
- backend/composer.json: Laravel 11 scaffold
- backend/.env.example: env config
- Commit 17f50ad pushed to origin/main
- Status: ✅ local = remote (clean)
### 2026-09-05 10:55 — Master roadmap replacement from Gemini spec
- docs/ROADMAP.md: replaced with 8-phase master roadmap (luxury portfolio + autonomous booking engine)
- Tech stack: Next.js 15, React 19, Tailwind v4, Laravel 11, MySQL 8, Xendit, Google Calendar, WhatsApp
- 35 items, 5 done, 30 pending
- Source: gemini-code-1788580456790.md
- Commit pushed to origin/main
### 2026-09-05 10:57 — Embedded Push+Deploy rule (mandatory per task completion)
- CORE.md sect5: new rule — setiap selesai task wajib push + deploy
- Continual harness: memory + policy updated with same rule
- This commit is proof the rule works
### 2026-09-05 11:01 — Push+Deploy rule proven + Vercel deploy
- CORE.md sect5: embedded mandatory push+deploy per task
- Continual harness: memory + policy updated
- Vercel: removed vercel.json (auto-detect Next.js works fine)
- Latest deploy: https://jenni-khoe-bjg3w2tym-rebahan.vercel.app (Ready)
- This entry = proof of rule working
### 2026-09-05 11:39 — Phase 1 Laravel scaffold complete
- 10 migrations: users, clients, bookings, quotations, contracts, payments, schedules, logs, social_accounts, inquiries
- 10 Eloquent models with relationships & casts
- 3 API controllers: CRUD clients/bookings, inquiry intake, date availability
- API routes: apiResource + custom endpoints
- composer install: 85 deps (Laravel 11, Socialite, Dompdf)
- Commit pushed to origin/main
### 2026-09-05 11:40 — Vercel deploy after Laravel scaffold
- Frontend deployed: https://jenni-khoe-3rnybozb8-rebahan.vercel.app (200 OK)
- Backend scaffold + composer install pushed to GitHub
### 2026-09-05 11:43 — Phase 1 complete (all items)
- docs/GIT_POLICY.md: branching (main/dev/feature), conventional commits
- backend/pint.json: PHP Pint Laravel preset
- frontend/.eslintrc.json: strict TS rules
- frontend/.prettierrc: with tailwindcss plugin
- frontend/tsconfig.json: strict mode
- git branch `dev` created on remote
- All Phase 1 items checked off in ROADMAP.md
### 2026-09-05 11:56 — Phase 2 complete: Brand Identity & UI System
- Typography: Cormorant Garamond (serif) + Plus Jakarta Sans (sans) + Cinzel (display)
- Lenis smooth scroll integration (SmoothScrollProvider)
- UI atomic components: Button (glassmorphism), FloatingLabelInput, Dialog, Toast (context)
- Framer Motion page transitions (PageTransition)
- Tailwind v4 theme: luxury palette already set
- All Phase 2 items checked off
### 2026-09-05 12:12 — Phase 3 complete: Interactive Portfolio & Visual Proof
- Ultra-HD Texture Loupe: magnifier with 3.5x zoom for skin texture inspection
- Multidimensional Lookbook Matrix: filterable gallery by skin undertone + venue lighting
- Before/After Slider 2.0: dual lighting toggle (Studio Flash vs Natural Sunlight)
- Social Proof & Bride Stories: testimonial carousel with rating, quote, location
- All Phase 3 items checked off ROADMAP
### 2026-09-05 12:18 — Phase 3 final: mobile audit + WebP/AVIF optimization
- TextureLoupe: touch support for mobile
- BeforeAfterSlider2: touch-action manipulation
- globals.css: responsive font size, touch-friendly range thumb
- next.config.ts: WebP/AVIF image formats, device sizes
- layout.tsx: viewport metadata (width, initialScale, themeColor)
- ROADMAP Phase 3: 7/7 checked [x]
### 2026-09-05 12:27 — Phase 4: Autonomous AI CS Chat Widget
- ChatBubble: floating luxury glassmorphism bubble + chat panel (React, Framer Motion, Tailwind)
- API /api/chat: Vercel AI SDK edge function with Groq Cloud (llama3-8b-8192)
- API /api/leads: lead capture endpoint with validation
- FAQ knowledge base (9 items) + Intent Detector (7 intents)
- Context Memory + System Prompt with Guardrails
- Fallback to static FAQ when API key missing
- GROQ_API_KEY + GROQ_MODEL added to Vercel environment
### 2026-09-05 12:34 — Phase 4 complete: Calendar, WhatsApp Dispatcher & Inquiry API
- DateCalendar: visual availability calendar (available/booked/hold) with navigation
- WhatsAppDispatcher: structured booking form -> WhatsApp pre-filled message
- InquiryController (Laravel): POST /api/inquiries with throttle:5,1 + validation
- Inquiry model + migration (inquiries table)
- All 5 Phase 4 items checked
### 2026-09-05 12:40 — Phase 5: Database Architecture, State Machine & Gated Route
- BookingStateMachine service: full state transition validation (8 states, 16 transitions)
- GatedRouteService: cryptographic 64-char token generator with 48h TTL, one-time use
- GatedToken model + migration: booking_id, token (UNIQUE), expires_at, used_at
- GatedRouteController: GET /g/{token} consumes one-time token, returns booking with relations
- Booking model: added gatedTokens() + client() relations
- DATABASE_AUDIT.md: schema audit, FK validation, transition matrix, sanitization policy
- ROADMAP Phase 5: 4/4 complete
### 2026-09-05 12:48 — Phase 6: Closing Portal, E-Signature, PDF Engine & Payment Gateway
- UrgencyCountdownBanner: countdown timer (hold_expires_at) with expiry callback
- AddonCustomizer: 8 add-on items with real-time subtotal + DP 50% calculator
- SignatureCanvas: touch + mouse signature pad with clear/reset
- PdfEngineService: Dompdf-based invoice + contract generation with watermark
- PDF views: invoice.blade.php (itemized) + contract.blade.php (legal terms + signature)
- PaymentGatewayService: QRIS + VA charge creation, HMAC-SHA256 webhook verification
- PaymentController + WebhookController: REST endpoints for payment + callback
- Payment migration: added payment_channel, external_id, qr_code_url, va_number, bank fields
- API routes: POST /payments/qris, POST /payments/va, POST /webhooks/payment
- ROADMAP Phase 6: 5/5 complete
## [Phase 7] — 2026-02-25

### Added
- WebhookController: idempotency protection via Cache lock (300s + 24h final TTL)
- Console command CheckExpiredHolds: auto-expire booking holds via cron
- GoogleCalendarService: FreeBusy check + createEvent for confirmed bookings
- WhatsAppNotificationService: deep link generator, booking confirmation, payment reminder, gated link
- Admin portal (9 pages): Dashboard with MetricCard, Inquiries kanban, Bookings with gated link generator, Interactive Schedule Calendar, SPK Contracts Archive, Payment Reconciliation, Portfolio CMS, AI Leads Center
- SANDBOX_AUDIT.md: end-to-end flow simulation documentation

### Changed
- Kernel.php: registered CheckExpiredHolds schedule (everyMinute)

## [Phase 8] — 2026-02-26

### Security
- SignatureCanvas: XSS sanitization — data URL prefix validation on save
- API rate limiting: checkRateLimit() utility, 10 req/60s per IP on /api/chat and /api/leads
- GatedRouteController: token format validation (64-char hex regex prevents injection)

### Performance
- next.config.ts: compiler.removeConsole in production (dead code elimination)
- Fonts: latin subset via next/font (Plus Jakarta Sans, Cinzel, Cormorant Garamond)

### SEO
- JSON-LD Schema.org LocalBusiness + OfferCatalog (4 service types) in root layout
- Metadata: Open Graph tags, keywords, robots index/follow, title template
