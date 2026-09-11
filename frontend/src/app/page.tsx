import CheckAvailabilityForm from "@/components/CheckAvailabilityForm";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import PageTransition from "@/components/PageTransition";
import LookbookMatrix from "@/components/portfolio/LookbookMatrix";
import TextureLoupe from "@/components/portfolio/TextureLoupe";
import BeforeAfterSlider2 from "@/components/portfolio/BeforeAfterSlider2";
import BrideStories from "@/components/portfolio/BrideStories";
import DateCalendar from "@/components/DateCalendar";
import WhatsAppDispatcher from "@/components/WhatsAppDispatcher";
import { getServiceSupabase } from "@/lib/supabase";
import type { PortfolioItem } from "@/types/portfolio";

export const revalidate = 60;

async function getLivePortfolio(): Promise<(PortfolioItem & { is_featured_before_after?: boolean; is_featured_texture?: boolean; texture_image_path?: string | null })[]> {
  try {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from("portfolio_items")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error || !data || data.length === 0) return [];

    return data.map((i: any) => ({
      id: String(i.id),
      title: i.title,
      category: i.category || "bridal",
      beforeImg:
        i.before_image_path ||
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1000&auto=format&fit=crop",
      afterImgs: [
        {
          studio:
            i.image_path ||
            "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?q=80&w=1000&auto=format&fit=crop",
          natural:
            i.after_natural_image_path ||
            i.image_path ||
            "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?q=80&w=1000&auto=format&fit=crop",
        },
      ],
      skinUndertone: (i.undertone as any) || "warm",
      venueLighting: (i.venue_lighting as any) || "indoor-ballroom",
      description: i.description || "Soft glam luxury bridal look oleh Jenni Khoe MUA.",
      brideName: i.bride_name || "Jenni Khoe Bride",
      date: i.created_at?.slice(0, 10) || "2026",
      is_featured_before_after: Boolean(i.is_featured_before_after),
      is_featured_texture: Boolean(i.is_featured_texture),
      texture_image_path: i.texture_image_path,
    }));
  } catch {
    return [];
  }
}

export default async function Home() {
  const liveItems = await getLivePortfolio();

  const featuredBA =
    liveItems.find((i) => i.is_featured_before_after && i.beforeImg) ||
    liveItems.find((i) => i.beforeImg) || {
      beforeImg: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1000&auto=format&fit=crop",
      afterImgs: [
        {
          studio: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?q=80&w=1000&auto=format&fit=crop",
          natural: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?q=80&w=1000&auto=format&fit=crop",
        },
      ],
    };

  const featuredTexture =
    liveItems.find((i) => i.is_featured_texture && (i.texture_image_path || i.afterImgs?.[0]?.studio)) ||
    liveItems.find((i) => i.texture_image_path || i.afterImgs?.[0]?.studio);

  const textureSrc =
    featuredTexture?.texture_image_path ||
    featuredTexture?.afterImgs?.[0]?.studio ||
    "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?q=80&w=1000&auto=format&fit=crop";

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

        {/* Multidimensional Lookbook Matrix (Live from CMS) */}
        <LookbookMatrix initialItems={liveItems.length > 0 ? liveItems : undefined} />

        {/* Interactive Transformation - Ultra-HD Loupe + Before/After 2.0 (Live from CMS) */}
        <section id="transformation" className="w-full max-w-4xl px-6 py-12 flex flex-col items-center">
          <div className="text-center mb-8">
            <span className="text-xs uppercase tracking-widest text-luxury-rose-gold font-medium">
              Real Bride Makeover
            </span>
            <h3 className="font-serif text-3xl md:text-4xl text-luxury-charcoal font-medium mt-1">
              Before & After Transformation
            </h3>
            <p className="text-xs md:text-sm text-luxury-deep-slate/70 mt-2 font-light">
              Geser slider untuk melihat keajaiban complexion. Klik gambar untuk inspeksi tekstur kulit Ultra-HD.
            </p>
          </div>

          <div className="w-full max-w-md md:max-w-lg mb-8">
            <BeforeAfterSlider2
              beforeImg={featuredBA.beforeImg}
              afterImgs={{
                studio:
                  featuredBA.afterImgs?.[0]?.studio ||
                  "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?q=80&w=1000&auto=format&fit=crop",
                natural:
                  featuredBA.afterImgs?.[0]?.natural ||
                  featuredBA.afterImgs?.[0]?.studio ||
                  "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?q=80&w=1000&auto=format&fit=crop",
              }}
              labelBefore="BEFORE"
              labelAfter="AFTER GLAM"
            />
          </div>

          <div className="w-full max-w-md md:max-w-lg">
            <p className="text-center text-xs text-luxury-deep-slate/50 mb-3 uppercase tracking-wider font-medium">
              Ultra-HD Texture Inspection
            </p>
            <div className="relative rounded-2xl overflow-hidden border border-luxury-champagne/40 shadow-lg">
              <TextureLoupe
                src={textureSrc}
                alt="Flawless skin texture inspection"
                zoom={3.5}
                lensSize={160}
              />
            </div>
            <p className="text-center text-xs text-luxury-deep-slate/40 mt-2">
              Hover untuk memperbesar tekstur kulit — bukti flawless tanpa efek cakey.
            </p>
          </div>
        </section>

        {/* Bride Stories Carousel */}
        <BrideStories />

        {/* Check Availability Section */}
        <section id="availability" className="w-full px-6 py-16 bg-luxury-champagne-light/40 border-t border-luxury-champagne/30 flex flex-col items-center">
          <CheckAvailabilityForm />
          <DateCalendar />
          <WhatsAppDispatcher />
        </section>

        {/* Floating CS */}
        <FloatingWhatsApp />

        {/* Minimal Footer */}
        <footer className="w-full border-t border-luxury-champagne/40 py-8 px-6 text-center text-xs text-luxury-deep-slate/60">
          <p>© {new Date().getFullYear()} Jenni Khoe Makeup Artist. All rights reserved.</p>
        </footer>
      </main>
    </PageTransition>
  );
}
