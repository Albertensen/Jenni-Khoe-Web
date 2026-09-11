"use client";

import { useState, useId, useEffect } from "react";

export default function CheckAvailabilityForm() {
  const formId = useId();
  const [formData, setFormData] = useState({
    name: "",
    whatsapp: "",
    eventDate: "",
    eventType: "wedding",
    city: "Jakarta",
  });
  const [status, setStatus] = useState<"idle" | "checking" | "available" | "booked">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // Restore client from localStorage if available
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
    } catch {
      // ignore
    }
  }, []);

  const saveLeadToCRM = async (closingStage: string) => {
    let cleanPhone = formData.whatsapp.trim().replace(/[^0-9+]/g, "");
    if (cleanPhone.startsWith("08")) {
      cleanPhone = "628" + cleanPhone.slice(2);
    } else if (cleanPhone.startsWith("+62")) {
      cleanPhone = cleanPhone.slice(1);
    }

    const sessionId = "avail_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6);

    // Save to localStorage so other widgets (Chat CS, Booking) auto-fill
    try {
      localStorage.setItem(
        "mua_chat_client",
        JSON.stringify({ name: formData.name.trim(), phone: cleanPhone, sessionId })
      );
    } catch {}

    try {
      await fetch("/api/ai-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          name: formData.name.trim(),
          phone: cleanPhone,
          interest: `Cek Tanggal: ${formData.eventType.toUpperCase()}`,
          closing_stage: closingStage,
          schedule_date: formData.eventDate,
          schedule_venue: formData.city,
          last_message: `Cek ketersediaan tanggal ${formData.eventDate} di ${formData.city} untuk kategori ${formData.eventType}.`,
          source: "cek_jadwal",
        }),
      });
    } catch (err) {
      console.error("Save lead error:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      setErrorMsg("Mohon masukkan nama calon pengantin.");
      return;
    }

    if (!formData.whatsapp.trim() || formData.whatsapp.trim().length < 8) {
      setErrorMsg("Mohon masukkan nomor WhatsApp yang aktif.");
      return;
    }

    if (!formData.eventDate) {
      setErrorMsg("Mohon pilih tanggal acara.");
      return;
    }

    setStatus("checking");

    // Automatically record inquiry to Prospek CS CRM
    await saveLeadToCRM("Tanya Jawab Jadwal & Lokasi");

    setTimeout(() => {
      setStatus("available");
    }, 500);
  };

  const handleWhatsappRedirect = async () => {
    // Elevate closing stage in CRM to Hot Lead
    await saveLeadToCRM("Siap Booking / Menuju WhatsApp");

    const phone = "6281234567890"; // Jenni Khoe Official Hotline
    const msg = `Halo Kak Jenni Khoe, saya ${formData.name} (${formData.whatsapp}) ingin konfirmasi dan lock jadwal slot riasan untuk acara ${formData.eventType.toUpperCase()} pada tanggal ${formData.eventDate} di ${formData.city}.`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <div className="w-full max-w-lg mx-auto rounded-3xl bg-white/85 backdrop-blur-md border border-luxury-champagne/40 p-6 md:p-8 shadow-2xl shadow-luxury-rose-gold/10">
      <div className="text-center mb-6">
        <h3 className="font-serif text-2xl md:text-3xl text-luxury-deep-slate font-medium">
          Cek Ketersediaan Tanggal
        </h3>
        <p className="text-xs md:text-sm text-luxury-deep-slate/70 mt-1 font-light">
          Slot privat eksklusif 1 pengantin per hari. Amankan tanggal spesial Anda.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor={`${formId}-name`} className="block text-xs uppercase tracking-wider text-luxury-deep-slate/80 font-medium mb-1">
            Nama Calon Pengantin <span className="text-red-500">*</span>
          </label>
          <input
            id={`${formId}-name`}
            type="text"
            required
            placeholder="cth. Aurelia Chandra"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full min-h-[48px] rounded-xl border border-luxury-champagne bg-luxury-pearl/50 px-4 text-sm text-luxury-deep-slate focus:outline-none focus:ring-2 focus:ring-luxury-rose-gold/50"
          />
        </div>

        <div>
          <label htmlFor={`${formId}-wa`} className="block text-xs uppercase tracking-wider text-luxury-deep-slate/80 font-medium mb-1">
            Nomor WhatsApp Aktif <span className="text-red-500">*</span>
          </label>
          <input
            id={`${formId}-wa`}
            type="tel"
            required
            placeholder="cth. 081234567890"
            value={formData.whatsapp}
            onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
            className="w-full min-h-[48px] rounded-xl border border-luxury-champagne bg-luxury-pearl/50 px-4 text-sm text-luxury-deep-slate focus:outline-none focus:ring-2 focus:ring-luxury-rose-gold/50"
          />
        </div>

        <div>
          <label htmlFor={`${formId}-date`} className="block text-xs uppercase tracking-wider text-luxury-deep-slate/80 font-medium mb-1">
            Tanggal Acara <span className="text-red-500">*</span>
          </label>
          <input
            id={`${formId}-date`}
            type="date"
            required
            value={formData.eventDate}
            onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
            className="w-full min-h-[48px] rounded-xl border border-luxury-champagne bg-luxury-pearl/50 px-4 text-sm text-luxury-deep-slate focus:outline-none focus:ring-2 focus:ring-luxury-rose-gold/50"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor={`${formId}-event`} className="block text-xs uppercase tracking-wider text-luxury-deep-slate/80 font-medium mb-1">
              Kategori Acara
            </label>
            <select
              id={`${formId}-event`}
              value={formData.eventType}
              onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
              className="w-full min-h-[48px] rounded-xl border border-luxury-champagne bg-luxury-pearl/50 px-3 text-sm text-luxury-deep-slate focus:outline-none focus:ring-2 focus:ring-luxury-rose-gold/50"
            >
              <option value="wedding">Wedding (Bridal)</option>
              <option value="prewedding">Prewedding</option>
              <option value="engagement">Engagement / Lamaran</option>
              <option value="party">Party / Wisuda</option>
            </select>
          </div>
          <div>
            <label htmlFor={`${formId}-city`} className="block text-xs uppercase tracking-wider text-luxury-deep-slate/80 font-medium mb-1">
              Kota / Lokasi Venue
            </label>
            <input
              id={`${formId}-city`}
              type="text"
              required
              placeholder="cth. Jakarta / Bali"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="w-full min-h-[48px] rounded-xl border border-luxury-champagne bg-luxury-pearl/50 px-4 text-sm text-luxury-deep-slate focus:outline-none focus:ring-2 focus:ring-luxury-rose-gold/50"
            />
          </div>
        </div>

        {errorMsg && (
          <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">
            ⚠️ {errorMsg}
          </p>
        )}

        <button
          type="submit"
          disabled={status === "checking"}
          className="w-full min-h-[48px] rounded-full bg-luxury-rose-gold hover:bg-luxury-rose-gold-dark text-white text-xs font-medium tracking-widest uppercase transition-all duration-300 shadow-md hover:shadow-luxury-rose-gold/25 cursor-pointer mt-2"
        >
          {status === "checking" ? "Mengecek Slot & Mencatat..." : "Periksa Tanggal Sekarang ✨"}
        </button>
      </form>

      {status === "available" && (
        <div className="mt-5 p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center animate-fade-in">
          <p className="text-xs font-semibold text-emerald-800">
            Slot Tanggal {formData.eventDate} di {formData.city} MASIH TERSEDIA! ✨
          </p>
          <p className="text-[11px] text-emerald-700 mt-1">
            Data konsultasi Kak {formData.name} sudah tersimpan di sistem reservasi privat Jenni Khoe MUA.
          </p>
          <button
            type="button"
            onClick={handleWhatsappRedirect}
            className="mt-3.5 inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold tracking-wider transition-all shadow-md hover:shadow-lg cursor-pointer hover:scale-[1.01]"
          >
            <span>💬</span> Lock Tanggal via WhatsApp Resmi
          </button>
        </div>
      )}
    </div>
  );
}
