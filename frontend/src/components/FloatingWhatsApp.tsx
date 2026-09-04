"use client";

export default function FloatingWhatsApp() {
  const phone = "6281234567890";
  const defaultMsg = "Halo Tim Jenni Khoe MUA, saya ingin konsultasi mengenai jadwal dan paket wedding makeup.";

  const handleClick = () => {
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(defaultMsg)}`, "_blank");
  };

  return (
    <aside aria-label="Customer Support Contact" className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
      <button
        onClick={handleClick}
        className="group relative flex items-center gap-3 bg-white/95 backdrop-blur-md border border-luxury-champagne px-4 py-3 rounded-full shadow-2xl hover:shadow-luxury-rose-gold/25 transition-all duration-300 hover:scale-105 cursor-pointer"
        aria-label="Hubungi WhatsApp CS"
      >
        <div className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
        </div>
        <span className="text-xs font-medium tracking-wider text-luxury-deep-slate">
          Chat CS Jenni Khoe
        </span>
        <div className="w-8 h-8 rounded-full bg-[#25D366] text-white flex items-center justify-center text-sm shadow-sm">
          💬
        </div>
      </button>
    </aside>
  );
}
