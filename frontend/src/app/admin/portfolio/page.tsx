"use client";

import { useState, useEffect } from "react";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

interface PortfolioItem {
  id: number; title: string; undertone: string;
  venue: string; image_url: string | null;
  highlighted: boolean;
}

export default function AdminPortfolio() {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(BACKEND_URL + "/api/portfolio")
      .then((r) => r.ok ? r.json() : Promise.resolve({ data: [] }))
      .then((d) => { setItems(d.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-gray-400">Memuat data...</div>;

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
        {items.map((p) => (
          <div key={p.id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-sm transition-shadow">
            {p.image_url ? (
              <img src={p.image_url} alt={p.title} className="w-full h-40 object-cover rounded-xl mb-3" />
            ) : (
              <div className="w-full h-40 bg-gray-100 rounded-xl mb-3 flex items-center justify-center text-gray-400 text-sm">
                No Image
              </div>
            )}
            <h3 className="font-medium text-luxury-charcoal">{p.title}</h3>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="px-2 py-0.5 bg-luxury-rose-gold/10 text-luxury-rose-gold text-xs rounded-lg">{p.undertone}</span>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-lg">{p.venue}</span>
              {p.highlighted && <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-lg">Highlight</span>}
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="col-span-full text-center text-gray-400 py-8">Belum ada portfolio.</p>}
      </div>
    </div>
  );
}
