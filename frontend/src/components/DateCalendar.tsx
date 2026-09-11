"use client";

import { useState, useMemo, useEffect } from "react";

interface CalendarDay {
  date: number;
  status: "available" | "booked" | "hold" | "past" | "none";
}

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];
const DAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

const MOCK_BOOKED: Record<string, number[]> = {};
const MOCK_HOLD: Record<string, number[]> = {};
const PHONE = "6281234567890";

function getMonthDays(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDay(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

export default function DateCalendar() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  // Modal lock date state
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [venue, setVenue] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Restore client info from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("mua_chat_client");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.name || parsed?.phone) {
          setClientName((prev) => parsed.name || prev);
          setClientPhone((prev) => parsed.phone || prev);
        }
      }
    } catch {}
  }, []);

  const days = useMemo<CalendarDay[]>(() => {
    const total = getMonthDays(year, month);
    const firstDay = getFirstDay(year, month);
    const key = `${year}-${month}`;
    const booked = MOCK_BOOKED[key] || [];
    const hold = MOCK_HOLD[key] || [];
    const result: CalendarDay[] = [];

    for (let i = 0; i < firstDay; i++) {
      result.push({ date: 0, status: "none" });
    }

    for (let d = 1; d <= total; d++) {
      const date = new Date(year, month, d);
      const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
      let status: CalendarDay["status"] = isPast ? "past" : "available";
      if (booked.includes(d)) status = "booked";
      else if (hold.includes(d)) status = "hold";
      result.push({ date: d, status });
    }
    return result;
  }, [year, month]);

  const prev = () => {
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else setMonth((m) => m - 1);
  };

  const next = () => {
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else setMonth((m) => m + 1);
  };

  const handleDayClick = (day: CalendarDay) => {
    if (day.status !== "available" || day.date === 0) return;
    const formatted = `${day.date} ${MONTHS[month]} ${year}`;
    setSelectedDate(formatted);
    setErrorMsg("");
  };

  const handleConfirmLockDate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const trimmedName = clientName.trim();
    let trimmedPhone = clientPhone.trim().replace(/[^0-9+]/g, "");

    if (trimmedName.length < 2) {
      setErrorMsg("Mohon masukkan nama calon pengantin.");
      return;
    }

    if (trimmedPhone.length < 8) {
      setErrorMsg("Mohon masukkan nomor WhatsApp yang aktif.");
      return;
    }

    if (trimmedPhone.startsWith("08")) {
      trimmedPhone = "628" + trimmedPhone.slice(2);
    } else if (trimmedPhone.startsWith("+62")) {
      trimmedPhone = trimmedPhone.slice(1);
    }

    setSubmitting(true);
    const sessionId = "cal_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6);

    try {
      localStorage.setItem(
        "mua_chat_client",
        JSON.stringify({ name: trimmedName, phone: trimmedPhone, sessionId })
      );
    } catch {}

    const leadSummary = `Kunci Tanggal Kalender: ${selectedDate}${venue ? ` di ${venue}` : ""}`;

    try {
      await fetch("/api/ai-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          name: trimmedName,
          phone: trimmedPhone,
          interest: "Kalender Ketersediaan",
          closing_stage: "Siap Booking / Menuju WhatsApp",
          schedule_date: selectedDate,
          schedule_venue: venue || null,
          last_message: leadSummary,
          source: "kalender_tanggal",
        }),
      });
    } catch (err) {
      console.error("Calendar lead save err:", err);
    }

    const waMsg = `Halo Kak Jenni Khoe, saya ${trimmedName} (${trimmedPhone}) ingin mengunci tanggal ${selectedDate}${venue ? ` untuk acara di ${venue}` : ""}. Mohon info prosedur lock slot privat dan DP.`;
    window.open(`https://wa.me/${PHONE}?text=${encodeURIComponent(waMsg)}`, "_blank");

    setSubmitting(false);
    setSelectedDate(null);
  };

  const statusColors: Record<CalendarDay["status"], string> = {
    available:
      "bg-luxury-champagne-light/70 text-luxury-charcoal hover:bg-luxury-rose-gold/20 hover:text-luxury-rose-gold-dark hover:scale-105 cursor-pointer font-medium shadow-2xs",
    booked: "bg-luxury-deep-slate/10 text-luxury-deep-slate/40 line-through cursor-not-allowed",
    hold: "bg-amber-100/60 text-amber-700 cursor-not-allowed",
    past: "text-luxury-deep-slate/20 cursor-not-allowed",
    none: "",
  };

  return (
    <section id="availability-calendar" className="w-full px-6 py-16">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <span className="text-xs uppercase tracking-widest text-luxury-rose-gold font-medium">
            Jadwal Realtime
          </span>
          <h3 className="font-serif text-3xl md:text-4xl text-luxury-charcoal font-medium mt-1">
            Kalender Ketersediaan Slot
          </h3>
          <p className="text-xs md:text-sm text-luxury-deep-slate/70 mt-2 font-light">
            Klik pada tanggal yang bertanda hijau untuk langsung mengamankan slot privat Kakak.
          </p>
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-4 mb-6 text-xs text-luxury-deep-slate/60">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-luxury-champagne-light/70 border border-luxury-champagne/40 inline-block" /> Tersedia
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-luxury-deep-slate/10 inline-block" /> Terbooking
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-amber-100/60 inline-block" /> Ditahan (Hold)
          </span>
        </div>

        {/* Calendar Box */}
        <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-luxury-champagne/40 p-6 shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={prev}
              className="p-2 hover:bg-luxury-champagne-light/60 rounded-xl transition-colors cursor-pointer"
              aria-label="Bulan sebelumnya"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <h4 className="font-serif text-xl text-luxury-charcoal font-medium">
              {MONTHS[month]} {year}
            </h4>
            <button
              onClick={next}
              className="p-2 hover:bg-luxury-champagne-light/60 rounded-xl transition-colors cursor-pointer"
              aria-label="Bulan berikutnya"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1.5 mb-2">
            {DAYS.map((d) => (
              <div key={d} className="text-center text-[11px] font-semibold text-luxury-deep-slate/50 py-1 uppercase">
                {d}
              </div>
            ))}
          </div>

          {/* Day Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {days.map((day, i) => (
              <div
                key={i}
                onClick={() => handleDayClick(day)}
                className={`aspect-square rounded-xl flex items-center justify-center text-sm transition-all ${statusColors[day.status]}`}
              >
                {day.date > 0 ? day.date : ""}
              </div>
            ))}
          </div>
        </div>

        {/* Modal: Lock Date Gatekeeper */}
        {selectedDate && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-luxury-champagne/50 animate-scale-in">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📅</span>
                  <h4 className="font-serif text-lg text-luxury-charcoal font-semibold">
                    Lock Tanggal: {selectedDate}
                  </h4>
                </div>
                <button
                  onClick={() => setSelectedDate(null)}
                  className="p-1 text-gray-400 hover:text-gray-700 rounded-full cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                Tanggal ini masih tersedia! Isi nama & nomor WhatsApp Kakak untuk mengunci slot sebelum dialihkan ke WhatsApp resmi Kak Jenni.
              </p>

              <form onSubmit={handleConfirmLockDate} className="mt-4 space-y-3">
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 uppercase tracking-wider mb-1">
                    Nama Calon Klien <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="cth. Aurelia Chandra"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs border border-luxury-champagne/60 rounded-xl focus:outline-none focus:border-luxury-rose-gold shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-gray-700 uppercase tracking-wider mb-1">
                    Nomor WhatsApp Aktif <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="cth. 081234567890"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs border border-luxury-champagne/60 rounded-xl focus:outline-none focus:border-luxury-rose-gold shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-gray-700 uppercase tracking-wider mb-1">
                    Kota / Lokasi Venue (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="cth. Jakarta / Bandung / Bali"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs border border-luxury-champagne/60 rounded-xl focus:outline-none focus:border-luxury-rose-gold shadow-2xs"
                  />
                </div>

                {errorMsg && (
                  <p className="text-[11px] text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">
                    ⚠️ {errorMsg}
                  </p>
                )}

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedDate(null)}
                    className="w-1/3 py-2.5 text-xs font-medium text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-2/3 py-2.5 text-xs font-medium bg-gradient-to-r from-luxury-rose-gold to-luxury-champagne text-white rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>💬</span>
                    {submitting ? "Mencatat..." : "Lock via WhatsApp ✨"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
