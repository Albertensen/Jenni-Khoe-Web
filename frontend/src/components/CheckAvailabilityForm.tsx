"use client";

import { useState, useId, useEffect, useMemo } from "react";

interface CalendarDay {
  date: number;
  dateStr: string; // YYYY-MM-DD
  status: "available" | "booked" | "hold" | "past" | "none";
}

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];
const DAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

// Mock booked/held dates for demo (ponytail: hook real database table when calendar API ready)
const MOCK_BOOKED: Record<string, number[]> = {};
const MOCK_HOLD: Record<string, number[]> = {};
const PHONE = "6281234567890"; // Jenni Khoe WhatsApp

function getMonthDays(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDay(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

export default function CheckAvailabilityForm() {
  const formId = useId();
  const today = new Date();

  // Calendar view state
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    whatsapp: "",
    eventDate: "",
    eventType: "wedding",
    city: "Jakarta",
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Restore client from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("mua_chat_client");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.name || parsed?.phone) {
          setFormData((prev) => ({
            ...prev,
            name: parsed.name || prev.name,
            whatsapp: parsed.phone || prev.whatsapp,
          }));
        }
      }
    } catch {}
  }, []);

  // Sync calendar month when manual date is chosen
  const handleDateChange = (dateVal: string) => {
    setFormData((prev) => ({ ...prev, eventDate: dateVal }));
    setErrorMsg("");
    if (dateVal) {
      const [y, m] = dateVal.split("-").map(Number);
      if (y && m) {
        setViewYear(y);
        setViewMonth(m - 1);
      }
    }
  };

  // Calendar Days calculation
  const calendarDays = useMemo<CalendarDay[]>(() => {
    const totalDays = getMonthDays(viewYear, viewMonth);
    const firstDay = getFirstDay(viewYear, viewMonth);
    const key = `${viewYear}-${viewMonth}`;
    const booked = MOCK_BOOKED[key] || [];
    const hold = MOCK_HOLD[key] || [];
    const result: CalendarDay[] = [];

    // Empty lead cells
    for (let i = 0; i < firstDay; i++) {
      result.push({ date: 0, dateStr: "", status: "none" });
    }

    const todayClean = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    for (let d = 1; d <= totalDays; d++) {
      const cellDate = new Date(viewYear, viewMonth, d);
      const isPast = cellDate < todayClean;
      const dStr = `${viewYear}-${pad2(viewMonth + 1)}-${pad2(d)}`;

      let status: CalendarDay["status"] = "available";
      if (isPast) status = "past";
      else if (booked.includes(d)) status = "booked";
      else if (hold.includes(d)) status = "hold";

      result.push({ date: d, dateStr: dStr, status });
    }
    return result;
  }, [viewYear, viewMonth]);

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelectDay = (day: CalendarDay) => {
    if (day.status !== "available" || day.date === 0) return;
    handleDateChange(day.dateStr);
    setSuccessMsg(`Tanggal ${day.date} ${MONTHS[viewMonth]} ${viewYear} terpilih & tersedia.`);
  };

  const saveLeadAndProceed = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const trimmedName = formData.name.trim();
    let trimmedPhone = formData.whatsapp.trim().replace(/[^0-9+]/g, "");

    if (!trimmedName || trimmedName.length < 2) {
      setErrorMsg("Mohon masukkan nama calon pengantin.");
      return;
    }

    if (!trimmedPhone || trimmedPhone.length < 8) {
      setErrorMsg("Mohon masukkan nomor WhatsApp yang aktif.");
      return;
    }

    if (!formData.eventDate) {
      setErrorMsg("Mohon pilih tanggal acara pada kalender atau input tanggal.");
      return;
    }

    if (trimmedPhone.startsWith("08")) {
      trimmedPhone = "628" + trimmedPhone.slice(2);
    } else if (trimmedPhone.startsWith("+62")) {
      trimmedPhone = trimmedPhone.slice(1);
    }

    setSubmitting(true);
    const sessionId = "avail_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6);

    // Save identity locally for chat & booking forms
    try {
      localStorage.setItem(
        "mua_chat_client",
        JSON.stringify({ name: trimmedName, phone: trimmedPhone, sessionId })
      );
    } catch {}

    const leadNote = `Kunci Kalender Slot: ${formData.eventDate} (${formData.eventType.toUpperCase()}) di ${formData.city}`;

    // Record lead directly into Prospek CS CRM
    try {
      await fetch("/api/ai-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          name: trimmedName,
          phone: trimmedPhone,
          interest: `Kalender Slot: ${formData.eventType.toUpperCase()}`,
          closing_stage: "Siap Booking / Menuju WhatsApp",
          schedule_date: formData.eventDate,
          schedule_venue: formData.city,
          last_message: leadNote,
          source: "kalender_tanggal",
        }),
      });
    } catch (err) {
      console.error("Save lead error:", err);
    }

    // Redirect to official WhatsApp
    const waMsg = `Halo Kak Jenni Khoe, saya ${trimmedName} (${trimmedPhone}) ingin konfirmasi dan lock ketersediaan slot riasan untuk acara ${formData.eventType.toUpperCase()} pada tanggal ${formData.eventDate} di ${formData.city}. Mohon info prosedur lock slot privat dan pricelist resminya ya Kak.`;
    window.open(`https://wa.me/${PHONE}?text=${encodeURIComponent(waMsg)}`, "_blank");

    setSubmitting(false);
  };

  // Formatted date string for display
  const readableSelectedDate = useMemo(() => {
    if (!formData.eventDate) return null;
    const [y, m, d] = formData.eventDate.split("-").map(Number);
    if (!y || !m || !d) return null;
    return `${d} ${MONTHS[m - 1]} ${y}`;
  }, [formData.eventDate]);

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Title Header */}
      <div className="text-center mb-10">
        <span className="text-xs uppercase tracking-widest text-luxury-rose-gold font-semibold">
          Jadwal Realtime & Reservasi Privat
        </span>
        <h3 className="font-serif text-3xl sm:text-4xl text-luxury-charcoal font-medium mt-1">
          Kalender Slot & Kunci Tanggal Acara
        </h3>
        <p className="text-xs sm:text-sm text-luxury-deep-slate/70 mt-2 font-light max-w-xl mx-auto">
          Slot privat eksklusif 1 pengantin per hari. Klik tanggal pada kalender interaktif untuk memilih slot atau lengkapi data acara Anda.
        </p>
      </div>

      {/* Unified Card Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start bg-white/90 backdrop-blur-md rounded-3xl border border-luxury-champagne/40 p-6 sm:p-8 lg:p-10 shadow-2xl shadow-luxury-rose-gold/10">
        
        {/* Left Column: Interactive Realtime Calendar (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-serif text-xl sm:text-2xl text-luxury-charcoal font-medium">
                  {MONTHS[viewMonth]} {viewYear}
                </h4>
                <p className="text-[11px] text-luxury-deep-slate/60 mt-0.5">
                  Klik pada tanggal hijau yang tersedia untuk memilih slot
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="p-2 hover:bg-luxury-champagne-light/70 rounded-xl transition-colors cursor-pointer text-luxury-charcoal"
                  aria-label="Bulan sebelumnya"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
                </button>
                <button
                  type="button"
                  onClick={nextMonth}
                  className="p-2 hover:bg-luxury-champagne-light/70 rounded-xl transition-colors cursor-pointer text-luxury-charcoal"
                  aria-label="Bulan berikutnya"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                </button>
              </div>
            </div>

            {/* Calendar Legend */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-4 text-[11px] text-luxury-deep-slate/60 pb-3 border-b border-gray-100">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Tersedia
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-gray-300 inline-block" /> Terbooking
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" /> Hold / Menunggu DP
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-luxury-rose-gold inline-block" /> Pilihan Anda
              </span>
            </div>

            {/* Day Header Row */}
            <div className="grid grid-cols-7 gap-1.5 mb-2">
              {DAYS.map((d) => (
                <div key={d} className="text-center text-[11px] font-semibold text-luxury-deep-slate/50 py-1 uppercase">
                  {d}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1.5">
              {calendarDays.map((day, idx) => {
                if (day.date === 0) {
                  return <div key={`empty-${idx}`} className="aspect-square" />;
                }

                const isSelected = formData.eventDate === day.dateStr;

                let cellClass = "cursor-pointer font-medium ";
                if (isSelected) {
                  cellClass += "bg-luxury-rose-gold text-white shadow-md scale-105 ring-2 ring-luxury-rose-gold/60 font-semibold";
                } else if (day.status === "available") {
                  cellClass += "bg-luxury-champagne-light/50 text-luxury-charcoal hover:bg-luxury-champagne/70 hover:scale-105 transition-all";
                } else if (day.status === "booked") {
                  cellClass = "bg-gray-100 text-gray-400 line-through cursor-not-allowed";
                } else if (day.status === "hold") {
                  cellClass = "bg-amber-100 text-amber-800 cursor-not-allowed";
                } else if (day.status === "past") {
                  cellClass = "text-gray-300 cursor-not-allowed";
                }

                return (
                  <button
                    key={`day-${day.dateStr}`}
                    type="button"
                    disabled={day.status !== "available"}
                    onClick={() => handleSelectDay(day)}
                    className={`aspect-square rounded-xl flex items-center justify-center text-xs sm:text-sm transition-all ${cellClass}`}
                    title={
                      isSelected
                        ? `Tanggal Terpilih: ${day.dateStr}`
                        : day.status === "available"
                        ? `Klik untuk pilih tanggal ${day.date}`
                        : undefined
                    }
                  >
                    {day.date}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6 p-3 rounded-2xl bg-luxury-champagne-light/30 border border-luxury-champagne/30 text-[11px] text-luxury-deep-slate/70 flex items-center gap-2">
            <span>💡</span>
            <span>
              {readableSelectedDate ? (
                <>Anda memilih tanggal <strong>{readableSelectedDate}</strong>. Lengkapi form di samping untuk mengamankan slot privat.</>
              ) : (
                <>Klik tanggal di kalender atau masukkan tanggal secara langsung pada formulir reservasi.</>
              )}
            </span>
          </div>
        </div>

        {/* Right Column: Reservation & WhatsApp Gatekeeper Form (5 Cols) */}
        <div className="lg:col-span-5 bg-luxury-pearl/50 border border-luxury-champagne/40 rounded-2xl p-5 sm:p-6 shadow-inner">
          <div className="mb-4">
            <h4 className="font-serif text-lg sm:text-xl text-luxury-charcoal font-semibold">
              Detail Reservasi Tanggal
            </h4>
            <p className="text-[11px] text-luxury-deep-slate/60 mt-0.5">
              Data dicatat ke sistem reservasi sebelum konfirmasi via WhatsApp.
            </p>
          </div>

          {/* Active Date Badge */}
          {readableSelectedDate ? (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between text-xs animate-fade-in">
              <span className="flex items-center gap-1.5 font-medium">
                <span>✨</span> Tanggal: <strong>{readableSelectedDate}</strong>
              </span>
              <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full font-semibold uppercase">
                Tersedia
              </span>
            </div>
          ) : (
            <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
              ⚠️ Belum ada tanggal yang dipilih. Klik tanggal di kalender atau pilih di bawah.
            </div>
          )}

          <form onSubmit={saveLeadAndProceed} className="space-y-3.5">
            <div>
              <label htmlFor={`${formId}-date`} className="block text-[11px] uppercase tracking-wider text-luxury-deep-slate font-medium mb-1">
                Tanggal Acara <span className="text-red-500">*</span>
              </label>
              <input
                id={`${formId}-date`}
                type="date"
                required
                value={formData.eventDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-luxury-champagne bg-white px-3.5 text-xs text-luxury-deep-slate focus:outline-none focus:ring-2 focus:ring-luxury-rose-gold/50"
              />
            </div>

            <div>
              <label htmlFor={`${formId}-name`} className="block text-[11px] uppercase tracking-wider text-luxury-deep-slate font-medium mb-1">
                Nama Calon Klien <span className="text-red-500">*</span>
              </label>
              <input
                id={`${formId}-name`}
                type="text"
                required
                placeholder="cth. Aurelia Chandra"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full min-h-[44px] rounded-xl border border-luxury-champagne bg-white px-3.5 text-xs text-luxury-deep-slate focus:outline-none focus:ring-2 focus:ring-luxury-rose-gold/50"
              />
            </div>

            <div>
              <label htmlFor={`${formId}-wa`} className="block text-[11px] uppercase tracking-wider text-luxury-deep-slate font-medium mb-1">
                Nomor WhatsApp Aktif <span className="text-red-500">*</span>
              </label>
              <input
                id={`${formId}-wa`}
                type="tel"
                required
                placeholder="cth. 081234567890"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                className="w-full min-h-[44px] rounded-xl border border-luxury-champagne bg-white px-3.5 text-xs text-luxury-deep-slate focus:outline-none focus:ring-2 focus:ring-luxury-rose-gold/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label htmlFor={`${formId}-event`} className="block text-[11px] uppercase tracking-wider text-luxury-deep-slate font-medium mb-1">
                  Kategori Acara
                </label>
                <select
                  id={`${formId}-event`}
                  value={formData.eventType}
                  onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                  className="w-full min-h-[44px] rounded-xl border border-luxury-champagne bg-white px-2.5 text-xs text-luxury-deep-slate focus:outline-none focus:ring-2 focus:ring-luxury-rose-gold/50 cursor-pointer"
                >
                  <option value="wedding">Wedding Bridal</option>
                  <option value="prewedding">Prewedding</option>
                  <option value="engagement">Engagement / Lamaran</option>
                  <option value="party">Party / Wisuda</option>
                </select>
              </div>

              <div>
                <label htmlFor={`${formId}-city`} className="block text-[11px] uppercase tracking-wider text-luxury-deep-slate font-medium mb-1">
                  Kota / Venue
                </label>
                <input
                  id={`${formId}-city`}
                  type="text"
                  required
                  placeholder="cth. Jakarta"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full min-h-[44px] rounded-xl border border-luxury-champagne bg-white px-3 text-xs text-luxury-deep-slate focus:outline-none focus:ring-2 focus:ring-luxury-rose-gold/50"
                />
              </div>
            </div>

            {errorMsg && (
              <p className="text-[11px] text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">
                ⚠️ {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full min-h-[48px] rounded-full bg-gradient-to-r from-luxury-rose-gold to-luxury-champagne hover:opacity-95 text-white text-xs font-semibold tracking-widest uppercase transition-all duration-300 shadow-md hover:shadow-luxury-rose-gold/25 cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              <span>💬</span>
              <span>{submitting ? "Mencatat & Menghubungkan..." : "Lock Tanggal via WhatsApp Resmi ✨"}</span>
            </button>

            <p className="text-[10px] text-luxury-deep-slate/50 text-center leading-relaxed">
              🔒 Data Anda langsung tercatat di CRM Jenni Khoe MUA sebelum beralih ke WhatsApp. Pricelist resmi & penawaran paket dikirimkan langsung via WhatsApp.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
