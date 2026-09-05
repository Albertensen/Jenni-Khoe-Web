"use client";

import { useState, useEffect, useRef } from "react";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

interface PortfolioItem {
  id: number; title: string; undertone: string;
  venue: string; image_url: string | null;
  highlighted: boolean;
}

export default function AdminPortfolio() {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ title: "", undertone: "", venue: "", highlighted: false });
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchItems = () => {
    fetch(BACKEND_URL + "/api/portfolio")
      .then((r) => r.ok ? r.json() : Promise.resolve({ data: [] }))
      .then((d) => { setItems(d.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(fetchItems, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    const fd = new FormData();
    fd.append("title", form.title);
    fd.append("undertone", form.undertone);
    fd.append("venue", form.venue);
    fd.append("is_highlighted", String(form.highlighted));
    if (fileRef.current?.files?.[0]) fd.append("image", fileRef.current.files[0]);

    try {
      const res = await fetch(BACKEND_URL + "/api/portfolio", { method: "POST", body: fd });
      if (res.ok) {
        setForm({ title: "", undertone: "", venue: "", highlighted: false });
        setShowForm(false);
        fetchItems();
      }
    } catch {}
    setUploading(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus item ini?")) return;
    try {
      await fetch(BACKEND_URL + "/api/portfolio/" + id, { method: "DELETE" });
      fetchItems();
    } catch {}
  };

  if (loading) return <div className="p-8 text-gray-400">Memuat data...</div>;

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif text-luxury-charcoal font-medium">Portfolio & Lookbook CMS</h2>
          <p className="text-sm text-gray-500 mt-1">Upload foto galeri, tagging, urutan highlight</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-luxury-rose-gold text-white text-sm rounded-xl hover:bg-luxury-rose-gold/90 transition-colors cursor-pointer">
          {showForm ? "Batal" : "+ Tambah Portofolio"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleUpload} className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 space-y-4">
          <input type="text" placeholder="Judul" value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-luxury-rose-gold/50" required />
          <div className="grid grid-cols-2 gap-4">
            <input type="text" placeholder="Undertone (Warm/Cool/Neutral)" value={form.undertone}
              onChange={(e) => setForm({ ...form, undertone: e.target.value })}
              className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-luxury-rose-gold/50" />
            <input type="text" placeholder="Venue/Lokasi" value={form.venue}
              onChange={(e) => setForm({ ...form, venue: e.target.value })}
              className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-luxury-rose-gold/50" />
          </div>
          <input type="file" ref={fileRef} accept="image/jpeg,image/png,image/webp"
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:bg-luxury-rose-gold/10 file:text-luxury-rose-gold hover:file:bg-luxury-rose-gold/20" />
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" checked={form.highlighted}
              onChange={(e) => setForm({ ...form, highlighted: e.target.checked })} className="rounded" />
            Highlight
          </label>
          <button type="submit" disabled={uploading}
            className="px-4 py-2 bg-luxury-rose-gold text-white text-sm rounded-xl hover:bg-luxury-rose-gold/90 transition-colors cursor-pointer disabled:opacity-50">
            {uploading ? "Uploading..." : "Simpan"}
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((p) => (
          <div key={p.id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-sm transition-shadow">
            {p.image_url ? (
              <img src={p.image_url} alt={p.title} className="w-full h-40 object-cover rounded-xl mb-3" />
            ) : (
              <div className="w-full h-40 bg-gray-100 rounded-xl mb-3 flex items-center justify-center text-gray-400 text-sm">No Image</div>
            )}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium text-luxury-charcoal">{p.title}</h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  {p.undertone && <span className="px-2 py-0.5 bg-luxury-rose-gold/10 text-luxury-rose-gold text-xs rounded-lg">{p.undertone}</span>}
                  {p.venue && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-lg">{p.venue}</span>}
                  {p.highlighted && <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-lg">Highlight</span>}
                </div>
              </div>
              <button onClick={() => handleDelete(p.id)}
                className="text-gray-300 hover:text-red-500 transition-colors text-xs cursor-pointer">Hapus</button>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="col-span-full text-center text-gray-400 py-8">Belum ada portfolio. Klik "Tambah Portofolio" untuk upload.</p>}
      </div>
    </div>
  );
}
