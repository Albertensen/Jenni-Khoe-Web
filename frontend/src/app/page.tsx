import Image from "next/image";
import BeforeAfterSlider from "@/components/BeforeAfterSlider";
import CheckAvailabilityForm from "@/components/CheckAvailabilityForm";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import PageTransition from "@/components/PageTransition";

export default function Home() {
  return (
    <PageTransition>
    <main className="min-h-screen bg-luxury-pearl text-luxury-deep-slate flex flex-col items-center">
      {/* Navigation Header */}
      <header className="w-full sticky top-0 z-40 bg-luxury-pearl/80 backdrop-blur-md border-b border-luxury-champagne/40 py-4 px-6 md:px-12 flex justify-between items-center">
        <h1 className="font-serif text-xl md:text-2xl font-semibold tracking-wider text-luxury-charcoal">
          JENNI KHOE
        </h1>
        <nav className="flex items-center gap-6 text-xs uppercase tracking-widest text-luxury-deep-slate/80">
          <a href="#transformation" className="hover:text-luxury-rose-gold transition-colors">Portofolio</a>
          <a href="#availability" className="hover:text-luxury-rose-gold transition-colors">Cek Jadwal</a>
          <a
            href="#availability"
            className="hidden sm:inline-block border border-luxury-rose-gold text-luxury-rose-gold hover:bg-luxury-rose-gold hover:text-white px-4 py-2 rounded-full transition-all"
          >
            Booking Privat
          </a>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="w-full max-w-5xl px-6 py-16 md:py-24 text-center flex flex-col items-center">
        <span className="text-xs uppercase tracking-widest text-luxury-rose-gold font-medium mb-3">
          Haute Couture & Luxury Bridal Specialist
        </span>
        <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl text-luxury-charcoal font-normal leading-tight max-w-3xl">
          Elegansi Abadi Untuk Hari Paling Istimewa Anda
        </h2>
        <p className="mt-4 text-sm md:text-base text-luxury-deep-slate/70 max-w-xl font-light">
          Sentuhan makeup prestisius dengan fokus pada flawless skin texture, ketahanan sepanjang hari, dan keanggunan personal.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <a
            href="#availability"
            className="bg-luxury-rose-gold hover:bg-luxury-rose-gold-dark text-white text-xs font-medium tracking-widest uppercase py-3.5 px-8 rounded-full transition-all shadow-md hover:shadow-luxury-rose-gold/25"
          >
            Cek Ketersediaan Tanggal
          </a>
          <a
            href="#transformation"
            className="bg-white/80 hover:bg-white text-luxury-deep-slate border border-luxury-champagne text-xs font-medium tracking-widest uppercase py-3.5 px-8 rounded-full transition-all"
          >
            Lihat Transformasi
          </a>
        </div>
      </section>

      {/* Interactive Transformation Section */}
      <section id="transformation" className="w-full max-w-4xl px-6 py-12 flex flex-col items-center">
        <div className="text-center mb-8">
          <span className="text-xs uppercase tracking-widest text-luxury-rose-gold font-medium">
            Real Bride Makeover
          </span>
          <h3 className="font-serif text-3xl md:text-4xl text-luxury-charcoal font-medium mt-1">
            Before & After Transformation
          </h3>
          <p className="text-xs md:text-sm text-luxury-deep-slate/70 mt-2 font-light">
            Geser slider untuk melihat keajaiban detail complexion dan pulasan warna.
          </p>
        </div>

        <div className="w-full max-w-md md:max-w-lg">
          <BeforeAfterSlider
            beforeImg="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1000&auto=format&fit=crop"
            afterImg="https://images.unsplash.com/photo-1512496015851-a90fb38ba796?q=80&w=1000&auto=format&fit=crop"
            labelBefore="BEFORE"
            labelAfter="AFTER GLAM"
          />
        </div>
      </section>

      {/* Check Availability Section */}
      <section id="availability" className="w-full px-6 py-16 bg-luxury-champagne-light/40 border-t border-luxury-champagne/30 flex flex-col items-center">
        <CheckAvailabilityForm />
      </section>

      {/* Floating CS */}
      <FloatingWhatsApp />

      {/* Minimal Footer */}
      <footer className="w-full border-t border-luxury-champagne/40 py-8 px-6 text-center text-xs text-luxury-deep-slate/60">
        <p>Â© {new Date().getFullYear()} Jenni Khoe Makeup Artist. All rights reserved.</p>
      </footer>
    </main>
    </PageTransition>
  );
}
