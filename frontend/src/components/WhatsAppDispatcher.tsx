"use client";

import { useState, useEffect } from "react";

const PACKAGES = [
  { id: "bridal-royal", label: "Luxury Royal Bridal (Akad + Resepsi, Full Retouch & Standby)" },
  { id: "bridal-matrimony", label: "Intimate / Holy Matrimony (1 Sesi Riasan Sakral & Touch-up)" },
  { id: "engagement", label: "Engagement / Prewedding Photoshoot" },
  { id: "family", label: "Family, Bridesmaid & Pengiring Pengantin" },
];

const PHONE = "6281234567890"; // Jenni Khoe WhatsApp

export default function WhatsAppDispatcher() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [venue, setVenue] = useState("");
  const [selectedPkg, setSelectedPkg] = useState("");
  const [guestCount, setGuestCount] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Restore client from localStorage if available
  useEffect(() => {
    try {
      const saved = localStorage.getItem("mua_chat_client");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.name || parsed?.phone) {
          setName((prev) => parsed.name || prev);
          setPhone((prev) => parsed.phone || prev);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const generateMessage = (): string => {
    const parts = ["Halo Kak Jenni Khoe! Saya ingin booking riasan makeup privat."];
    if (name) parts.push(`Nama Klien: ${name}`);
    if (phone) parts.push(`No WA: ${phone}`);
    if (eventDate) parts.push(`Tanggal acara: ${eventDate}`);
    if (venue) parts.push(`Lokasi/venue: ${venue}`);
    if (selectedPkg) {
      const pkg = PACKAGES.find((p) => p.id === selectedPkg);
      if (pkg) parts.push(`Pilihan Paket: ${pkg.label}`);
    }
    if (guestCount) parts.push(`Jumlah orang yang dirias: ${guestCount} orang`);
    parts.push("Mohon info konfirmasi slot dan prosedur invoice SPK booking. Terima kasih!");
    return parts.join("\n");
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const trimmedName = name.trim();
    let trimmedPhone = phone.trim().replace(/[^0-9+]/g, "");

    if (trimmedName.length < 2) {
      setErrorMsg("Mohon masukkan nama lengkap Kakak.");
      return;
    }

    if (trimmedPhone.length < 8) {
      setErrorMsg("Mohon masukkan nomor WhatsApp yang valid.");
      return;
    }

    if (trimmedPhone.startsWith("08")) {
      trimmedPhone = "628" + trimmedPhone.slice(2);
    } else if (trimmedPhone.startsWith("+62")) {
      trimmedPhone = trimmedPhone.slice(1);
    }

    setSubmitting(true);
    const sessionId = "book_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6);

    // Save identity locally for cross-component sync
    try {
      localStorage.setItem(
        "mua_chat_client",
        JSON.stringify({ name: trimmedName, phone: trimmedPhone, sessionId })
      );
    } catch {}

    const fullMsg = generateMessage();

    // Persist lead directly into Prospek CS CRM
    try {
      await fetch("/api/ai-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          name: trimmedName,
          phone: trimmedPhone,
          interest: selectedPkg || "Booking Cepat",
          closing_stage: "Siap Booking / Menuju WhatsApp",
          schedule_date: eventDate || null,
          schedule_venue: venue || null,
          last_message: fullMsg.slice(0, 300),
          source: "booking_cepat",
        }),
      });
    } catch (err) {
      console.error("Booking lead error:", err);
    }

    // Direct to WhatsApp
    const waUrl = `https://wa.me/${PHONE}?text=${encodeURIComponent(fullMsg)}`;
    window.open(waUrl, "_blank");
    setSubmitting(false);
  };

  return (
    <section id="whatsapp-dispatcher" className="w-full px-6 py-16 bg-luxury-champagne-light/20">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <span className="text-xs uppercase tracking-widest text-luxury-rose-gold font-medium">
            Booking Cepat & Konsultasi
          </span>
          <h3 className="font-serif text-3xl md:text-4xl text-luxury-charcoal font-medium mt-1">
            Kirim Reservasi ke Kak Jenni
          </h3>
          <p className="text-xs md:text-sm text-luxury-deep-slate/70 mt-2 font-light">
            Lengkapi nama, WhatsApp, dan detail acara. Data Anda akan langsung dicatat di CRM dan diarahkan ke WhatsApp resmi.
          </p>
        </div>

        <form onSubmit={handleBookingSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-luxury-charcoal uppercase tracking-wider mb-1">
                Nama Calon Klien <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="cth. Aurelia Chandra"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 text-sm border border-luxury-champagne/40 rounded-xl bg-white/80 focus:outline-none focus:border-luxury-rose-gold transition-colors"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-luxury-charcoal uppercase tracking-wider mb-1">
                Nomor WhatsApp <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                required
                placeholder="cth. 081234567890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 text-sm border border-luxury-champagne/40 rounded-xl bg-white/80 focus:outline-none focus:border-luxury-rose-gold transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-luxury-charcoal uppercase tracking-wider mb-1">
                Tanggal Acara
              </label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full px-4 py-3 text-sm border border-luxury-champagne/40 rounded-xl bg-white/80 focus:outline-none focus:border-luxury-rose-gold transition-colors"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-luxury-charcoal uppercase tracking-wider mb-1">
                Lokasi / Venue
              </label>
              <input
                type="text"
                placeholder="cth. Hotel Mulia Senayan"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                className="w-full px-4 py-3 text-sm border border-luxury-champagne/40 rounded-xl bg-white/80 focus:outline-none focus:border-luxury-rose-gold transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-luxury-charcoal uppercase tracking-wider mb-1">
              Pilihan Paket Layanan
            </label>
            <select
              value={selectedPkg}
              onChange={(e) => setSelectedPkg(e.target.value)}
              className="w-full px-4 py-3 text-sm border border-luxury-champagne/40 rounded-xl bg-white/80 focus:outline-none focus:border-luxury-rose-gold transition-colors appearance-none"
            >
              <option value="">-- Pilih Paket Riasan --</option>
              {PACKAGES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-luxury-charcoal uppercase tracking-wider mb-1">
              Estimasi Jumlah Orang
            </label>
            <input
              type="number"
              min="1"
              placeholder="cth. 1 pengantin + 2 ibu"
              value={guestCount}
              onChange={(e) => setGuestCount(e.target.value)}
              className="w-full px-4 py-3 text-sm border border-luxury-champagne/40 rounded-xl bg-white/80 focus:outline-none focus:border-luxury-rose-gold transition-colors"
            />
          </div>

          {errorMsg && (
            <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">
              ⚠️ {errorMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 text-center text-xs uppercase tracking-widest font-semibold rounded-xl transition-all bg-gradient-to-r from-luxury-rose-gold to-luxury-champagne text-white hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
          >
            <span>💬</span>
            {submitting ? "Mencatat & Membuka WA..." : "Kirim Reservasi via WhatsApp Resmi ✨"}
          </button>

          <p className="text-xs text-luxury-deep-slate/60 text-center leading-relaxed">
            ✨ <span className="font-medium">Pricelist resmi & penawaran khusus</span> akan langsung dikirimkan oleh Kak Jenni melalui WhatsApp setelah formulir terkirim.
          </p>
        </form>
      </div>
    </section>
  );
}
