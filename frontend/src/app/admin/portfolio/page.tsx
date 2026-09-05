"use client";

const MOCK_PORTFOLIO = [
  { id: 1, title: "Bridal Classic", undertone: "Warm", venue: "Indoor Ballroom", thumbnail: "📸", highlighted: true },
  { id: 2, title: "Garden Romance", undertone: "Neutral", venue: "Outdoor Garden", thumbnail: "📸", highlighted: true },
  { id: 3, title: "Sunset Glow", undertone: "Cool", venue: "Outdoor Sunset", thumbnail: "📸", highlighted: false },
  { id: 4, title: "Bridesmaid Squad", undertone: "Warm", venue: "Studio", thumbnail: "📸", highlighted: false },
];

export default function AdminPortfolio() {
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-serif text-luxury-charcoal font-medium">Portfolio & Lookbook CMS</h2>
        <p className="text-sm text-gray-500 mt-1">Kelola foto galeri, tagging, urutan highlight</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <button className="px-4 py-2 bg-luxury-rose-gold text-white text-sm rounded-xl hover:bg-luxury-rose-gold/90 transition-colors cursor-pointer">
          + Tambah Portofolio
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {MOCK_PORTFOLIO.map((p) => (
          <div key={p.id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-sm transition-shadow">
            <div className="text-4xl mb-3">{p.thumbnail}</div>
            <h3 className="font-medium text-luxury-charcoal">{p.title}</h3>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="px-2 py-0.5 bg-luxury-rose-gold/10 text-luxury-rose-gold text-xs rounded-lg">{p.undertone}</span>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-lg">{p.venue}</span>
              {p.highlighted && <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-lg">⭐ Highlight</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
