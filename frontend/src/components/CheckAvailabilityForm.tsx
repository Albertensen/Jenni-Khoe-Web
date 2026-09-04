"use client";

import { useState, useId } from "react";

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("checking");

    setTimeout(() => {
      // Mock availability logic (ponytail: hook real Laravel API /api/public/calendar/blocked-dates later)
      setStatus("available");
    }, 600);
  };

  const handleWhatsappRedirect = () => {
    const phone = "6281234567890"; // Jenni Khoe Official Contact
    const msg = `Halo Kak Jenni Khoe, saya ${formData.name} ingin konfirmasi availability untuk acara ${formData.eventType.toUpperCase()} pada tanggal ${formData.eventDate} di ${formData.city}.`;
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
          <label htmlFor={`${formId}-date`} className="block text-xs uppercase tracking-wider text-luxury-deep-slate/80 font-medium mb-1">
            Tanggal Acara
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
              Kategori
            </label>
            <select
              id={`${formId}-event`}
              value={formData.eventType}
              onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
              className="w-full min-h-[48px] rounded-xl border border-luxury-champagne bg-luxury-pearl/50 px-3 text-sm text-luxury-deep-slate focus:outline-none focus:ring-2 focus:ring-luxury-rose-gold/50"
            >
              <option value="wedding">Wedding</option>
              <option value="prewedding">Prewedding</option>
              <option value="engagement">Engagement</option>
              <option value="party">Party / Glamour</option>
            </select>
          </div>
          <div>
            <label htmlFor={`${formId}-city`} className="block text-xs uppercase tracking-wider text-luxury-deep-slate/80 font-medium mb-1">
              Kota / Venue
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

        <div>
          <label htmlFor={`${formId}-name`} className="block text-xs uppercase tracking-wider text-luxury-deep-slate/80 font-medium mb-1">
            Nama Calon Pengantin
          </label>
          <input
            id={`${formId}-name`}
            type="text"
            required
            placeholder="Nama Anda"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full min-h-[48px] rounded-xl border border-luxury-champagne bg-luxury-pearl/50 px-4 text-sm text-luxury-deep-slate focus:outline-none focus:ring-2 focus:ring-luxury-rose-gold/50"
          />
        </div>

        <div>
          <label htmlFor={`${formId}-wa`} className="block text-xs uppercase tracking-wider text-luxury-deep-slate/80 font-medium mb-1">
            Nomor WhatsApp
          </label>
          <input
            id={`${formId}-wa`}
            type="tel"
            required
            placeholder="08xxxxxxxxxx"
            value={formData.whatsapp}
            onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
            className="w-full min-h-[48px] rounded-xl border border-luxury-champagne bg-luxury-pearl/50 px-4 text-sm text-luxury-deep-slate focus:outline-none focus:ring-2 focus:ring-luxury-rose-gold/50"
          />
        </div>

        <button
          type="submit"
          disabled={status === "checking"}
          className="w-full min-h-[48px] rounded-full bg-luxury-rose-gold hover:bg-luxury-rose-gold-dark text-white text-xs font-medium tracking-widest uppercase transition-all duration-300 shadow-md hover:shadow-luxury-rose-gold/25 cursor-pointer mt-2"
        >
          {status === "checking" ? "Mengecek Slot..." : "Periksa Tanggal Sekarang"}
        </button>
      </form>

      {status === "available" && (
        <div className="mt-5 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center animate-fade-in">
          <p className="text-xs font-medium text-emerald-800">
            Tanggal {formData.eventDate} saat ini MASIH TERSEDIA!
          </p>
          <button
            type="button"
            onClick={handleWhatsappRedirect}
            className="mt-3 inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold tracking-wider transition-colors cursor-pointer"
          >
            Lock Tanggal via WhatsApp Resmi
          </button>
        </div>
      )}
    </div>
  );
}
