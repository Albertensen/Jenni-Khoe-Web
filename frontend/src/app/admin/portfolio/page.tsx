"use client";

import { useState, useEffect, useRef } from "react";

interface PortfolioItem {
  id: number;
  title: string;
  category: string;
  bride_name: string;
  description: string;
  undertone: string;
  venue: string;
  venue_lighting: string;
  image_url: string | null;
  before_image_url: string | null;
  after_natural_image_url: string | null;
  texture_image_url: string | null;
  highlighted: boolean;
  is_featured_before_after: boolean;
  is_featured_texture: boolean;
  sort_order: number;
}

export default function AdminPortfolio() {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: "",
    bride_name: "",
    category: "bridal",
    undertone: "warm",
    venue: "",
    venue_lighting: "indoor-ballroom",
    description: "",
    image_url: "",
    before_image_url: "",
    after_natural_image_url: "",
    texture_image_url: "",
    highlighted: false,
    is_featured_before_after: false,
    is_featured_texture: false,
  });

  const mainFileRef = useRef<HTMLInputElement>(null);
  const beforeFileRef = useRef<HTMLInputElement>(null);
  const naturalFileRef = useRef<HTMLInputElement>(null);
  const textureFileRef = useRef<HTMLInputElement>(null);

  const fetchItems = () => {
    fetch("/api/portfolio")
      .then((r) => (r.ok ? r.json() : Promise.resolve({ data: [] })))
      .then((d) => {
        setItems(d.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(fetchItems, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const fd = new FormData();
    fd.append("title", form.title);
    fd.append("bride_name", form.bride_name);
    fd.append("category", form.category);
    fd.append("undertone", form.undertone);
    fd.append("venue", form.venue);
    fd.append("venue_lighting", form.venue_lighting);
    fd.append("description", form.description);
    fd.append("is_highlighted", String(form.highlighted));
    fd.append("is_featured_before_after", String(form.is_featured_before_after));
    fd.append("is_featured_texture", String(form.is_featured_texture));

    if (mainFileRef.current?.files?.[0]) {
      fd.append("image", mainFileRef.current.files[0]);
    } else if (form.image_url) {
      fd.append("image_url", form.image_url);
    }

    if (beforeFileRef.current?.files?.[0]) {
      fd.append("before_image", beforeFileRef.current.files[0]);
    } else if (form.before_image_url) {
      fd.append("before_image_url", form.before_image_url);
    }

    if (naturalFileRef.current?.files?.[0]) {
      fd.append("after_natural_image", naturalFileRef.current.files[0]);
    } else if (form.after_natural_image_url) {
      fd.append("after_natural_image_url", form.after_natural_image_url);
    }

    if (textureFileRef.current?.files?.[0]) {
      fd.append("texture_image", textureFileRef.current.files[0]);
    } else if (form.texture_image_url) {
      fd.append("texture_image_url", form.texture_image_url);
    }

    try {
      const res = await fetch("/api/portfolio", { method: "POST", body: fd });
      if (res.ok) {
        setForm({
          title: "",
          bride_name: "",
          category: "bridal",
          undertone: "warm",
          venue: "",
          venue_lighting: "indoor-ballroom",
          description: "",
          image_url: "",
          before_image_url: "",
          after_natural_image_url: "",
          texture_image_url: "",
          highlighted: false,
          is_featured_before_after: false,
          is_featured_texture: false,
        });
        if (mainFileRef.current) mainFileRef.current.value = "";
        if (beforeFileRef.current) beforeFileRef.current.value = "";
        if (naturalFileRef.current) naturalFileRef.current.value = "";
        if (textureFileRef.current) textureFileRef.current.value = "";
        setShowForm(false);
        fetchItems();
      }
    } catch {}
    setSaving(false);
  };

  const toggleFeaturedBA = async (item: PortfolioItem) => {
    try {
      await fetch("/api/portfolio", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, is_featured_before_after: !item.is_featured_before_after }),
      });
      fetchItems();
    } catch {}
  };

  const toggleFeaturedTexture = async (item: PortfolioItem) => {
    try {
      await fetch("/api/portfolio", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, is_featured_texture: !item.is_featured_texture }),
      });
      fetchItems();
    } catch {}
  };

  const toggleHighlight = async (item: PortfolioItem) => {
    try {
      await fetch("/api/portfolio", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, highlighted: !item.highlighted }),
      });
      fetchItems();
    } catch {}
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus karya portofolio ini?")) return;
    try {
      await fetch("/api/portfolio/" + id, { method: "DELETE" });
      fetchItems();
    } catch {}
  };

  if (loading) return <div className="p-8 text-gray-400">Memuat data CMS portofolio...</div>;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif text-luxury-charcoal font-medium">Portfolio & Lookbook CMS</h2>
          <p className="text-sm text-gray-500 mt-1">
            Kelola karya makeup, Before/After dual-lighting, dan Ultra-HD Texture Loupe yang tampil di halaman utama.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-5 py-2.5 bg-luxury-rose-gold text-white text-sm font-medium rounded-xl hover:bg-luxury-rose-gold/90 transition-all shadow-sm cursor-pointer"
        >
          {showForm ? "Tutup Form" : "+ Tambah Karya Baru"}
        </button>
      </div>

      {/* Synchronized Main Page Status Banner */}
      <div className="bg-amber-50/70 border border-amber-200/60 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs text-amber-900">
        <div className="flex items-center gap-2">
          <span className="text-base">✨</span>
          <span>
            <strong>Sinkronisasi Live Halaman Utama:</strong> Item bertanda <strong>⭐ Before/After</strong> otomatis menjadi slider perbandingan di halaman depan, dan bertanda <strong>🔬 Ultra-HD</strong> menjadi gambar uji ketahanan tekstur pori-pori.
          </span>
        </div>
      </div>

      {/* Add / Upload Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-gray-100 p-6 md:p-8 shadow-sm space-y-6">
          <h3 className="text-lg font-serif text-luxury-charcoal font-medium border-b border-gray-100 pb-3">
            Input Detail Karya Portofolio & Visual Proof
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Judul Look / Konsep *</label>
              <input
                type="text"
                placeholder="Contoh: Royal Velvet Glam"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-luxury-rose-gold/50"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Nama Klien / Pengantin</label>
              <input
                type="text"
                placeholder="Contoh: Michelle Wijaya"
                value={form.bride_name}
                onChange={(e) => setForm({ ...form, bride_name: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-luxury-rose-gold/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Kategori Acara</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-luxury-rose-gold/50 bg-white"
              >
                <option value="bridal">Bridal (Pernikahan)</option>
                <option value="engagement">Engagement (Lamaran)</option>
                <option value="editorial">High Fashion / Editorial</option>
                <option value="party">Evening Gala / Party</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Skin Undertone</label>
              <select
                value={form.undertone}
                onChange={(e) => setForm({ ...form, undertone: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-luxury-rose-gold/50 bg-white"
              >
                <option value="warm">Warm Undertone</option>
                <option value="neutral">Neutral Undertone</option>
                <option value="cool">Cool Undertone</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Venue Lighting</label>
              <select
                value={form.venue_lighting}
                onChange={(e) => setForm({ ...form, venue_lighting: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-luxury-rose-gold/50 bg-white"
              >
                <option value="indoor-ballroom">Indoor Ballroom Chandelier</option>
                <option value="outdoor-sunset">Outdoor Sunset Golden Hour</option>
                <option value="outdoor-garden">Outdoor Garden Soft Natural</option>
                <option value="studio">Studio Flash Light</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Venue / Lokasi</label>
              <input
                type="text"
                placeholder="Contoh: The Mulia Bali / Hotel Kempinski"
                value={form.venue}
                onChange={(e) => setForm({ ...form, venue: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-luxury-rose-gold/50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Deskripsi Makeup</label>
              <input
                type="text"
                placeholder="Contoh: Soft glam dengan warm golden radiance tahan 14 jam"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-luxury-rose-gold/50"
              />
            </div>
          </div>

          {/* Image Upload Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50/70 rounded-2xl border border-gray-100">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">1. Foto Utama (After Studio) *</label>
              <p className="text-[11px] text-gray-500 mb-2">Tampil di grid galeri lookbook</p>
              <input type="file" ref={mainFileRef} accept="image/*" className="block w-full text-xs text-gray-500 mb-2" />
              <input
                type="text"
                placeholder="Atau paste URL foto..."
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">2. Foto Before Makeup</label>
              <p className="text-[11px] text-gray-500 mb-2">Untuk slider Before/After</p>
              <input type="file" ref={beforeFileRef} accept="image/*" className="block w-full text-xs text-gray-500 mb-2" />
              <input
                type="text"
                placeholder="Atau paste URL foto..."
                value={form.before_image_url}
                onChange={(e) => setForm({ ...form, before_image_url: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">3. Foto After Natural Light</label>
              <p className="text-[11px] text-gray-500 mb-2">Untuk toggle dual-lighting 2.0</p>
              <input type="file" ref={naturalFileRef} accept="image/*" className="block w-full text-xs text-gray-500 mb-2" />
              <input
                type="text"
                placeholder="Atau paste URL foto..."
                value={form.after_natural_image_url}
                onChange={(e) => setForm({ ...form, after_natural_image_url: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">4. Foto Ultra-HD Texture</label>
              <p className="text-[11px] text-gray-500 mb-2">Resolusi tinggi untuk kaca pembesar (Loupe)</p>
              <input type="file" ref={textureFileRef} accept="image/*" className="block w-full text-xs text-gray-500 mb-2" />
              <input
                type="text"
                placeholder="Atau paste URL foto..."
                value={form.texture_image_url}
                onChange={(e) => setForm({ ...form, texture_image_url: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white"
              />
            </div>
          </div>

          {/* Options */}
          <div className="flex flex-wrap gap-6 pt-2">
            <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={form.highlighted}
                onChange={(e) => setForm({ ...form, highlighted: e.target.checked })}
                className="rounded text-luxury-rose-gold focus:ring-luxury-rose-gold"
              />
              Highlight di Galeri Utama
            </label>
            <label className="flex items-center gap-2 text-xs font-medium text-amber-800 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_featured_before_after}
                onChange={(e) => setForm({ ...form, is_featured_before_after: e.target.checked })}
                className="rounded text-amber-600 focus:ring-amber-500"
              />
              ⭐ Tampilkan di Slider Before & After Halaman Utama
            </label>
            <label className="flex items-center gap-2 text-xs font-medium text-indigo-800 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_featured_texture}
                onChange={(e) => setForm({ ...form, is_featured_texture: e.target.checked })}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              🔬 Tampilkan di Ultra-HD Texture Loupe Halaman Utama
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-luxury-rose-gold text-white text-sm font-medium rounded-xl hover:bg-luxury-rose-gold/90 transition-all cursor-pointer disabled:opacity-50"
            >
              {saving ? "Menyimpan..." : "Simpan Karya"}
            </button>
          </div>
        </form>
      )}

      {/* Portfolio Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((p) => (
          <div
            key={p.id}
            className={`bg-white rounded-3xl border transition-all duration-300 p-5 flex flex-col justify-between ${
              p.is_featured_before_after || p.is_featured_texture
                ? "border-luxury-rose-gold/40 shadow-md ring-1 ring-luxury-rose-gold/20"
                : "border-gray-100 hover:shadow-sm"
            }`}
          >
            <div>
              {/* Image Showcase */}
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100 mb-4 border border-gray-100">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                    Tidak Ada Foto Utama
                  </div>
                )}
                <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
                  {p.is_featured_before_after && (
                    <span className="px-2.5 py-1 bg-amber-500/90 backdrop-blur-md text-white font-medium text-[11px] rounded-lg shadow-sm">
                      ⭐ Featured B/A Slider
                    </span>
                  )}
                  {p.is_featured_texture && (
                    <span className="px-2.5 py-1 bg-indigo-600/90 backdrop-blur-md text-white font-medium text-[11px] rounded-lg shadow-sm">
                      🔬 Ultra-HD Loupe
                    </span>
                  )}
                </div>
              </div>

              {/* Sub-thumbnails (Before, Natural, Texture) */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="text-center">
                  <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200/60 mb-1">
                    {p.before_image_url ? (
                      <img src={p.before_image_url} alt="Before" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400">-</div>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-500">Before</span>
                </div>
                <div className="text-center">
                  <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200/60 mb-1">
                    {p.after_natural_image_url ? (
                      <img src={p.after_natural_image_url} alt="Natural" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400">-</div>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-500">Natural Light</span>
                </div>
                <div className="text-center">
                  <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200/60 mb-1">
                    {p.texture_image_url ? (
                      <img src={p.texture_image_url} alt="Texture" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400">-</div>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-500">Ultra-HD</span>
                </div>
              </div>

              {/* Meta information */}
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-serif text-lg text-luxury-charcoal font-medium leading-snug">{p.title}</h3>
                    {p.bride_name && <p className="text-xs text-luxury-rose-gold font-medium mt-0.5">{p.bride_name}</p>}
                  </div>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full uppercase tracking-wider bg-gray-100 text-gray-600">
                    {p.category}
                  </span>
                </div>

                {p.description && (
                  <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed">{p.description}</p>
                )}

                {/* Badges */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {p.undertone && (
                    <span className="px-2.5 py-0.5 bg-rose-50 text-rose-700 text-xs rounded-md border border-rose-100">
                      {p.undertone}
                    </span>
                  )}
                  {p.venue_lighting && (
                    <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-md border border-blue-100">
                      {p.venue_lighting}
                    </span>
                  )}
                  {p.venue && (
                    <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-xs rounded-md border border-emerald-100">
                      📍 {p.venue}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 mt-4 border-t border-gray-100 flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => toggleFeaturedBA(p)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer text-center flex-1 ${
                    p.is_featured_before_after
                      ? "bg-amber-100 text-amber-800 border border-amber-300"
                      : "bg-gray-50 hover:bg-amber-50 text-gray-600 hover:text-amber-800 border border-gray-200"
                  }`}
                  title="Jadikan slider utama Before & After di halaman landing"
                >
                  {p.is_featured_before_after ? "⭐ Main B/A Slider" : "Set B/A Slider"}
                </button>

                <button
                  type="button"
                  onClick={() => toggleFeaturedTexture(p)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer text-center flex-1 ${
                    p.is_featured_texture
                      ? "bg-indigo-100 text-indigo-800 border border-indigo-300"
                      : "bg-gray-50 hover:bg-indigo-50 text-gray-600 hover:text-indigo-800 border border-gray-200"
                  }`}
                  title="Jadikan target utama Ultra-HD Texture Loupe di halaman landing"
                >
                  {p.is_featured_texture ? "🔬 Main Texture" : "Set Texture"}
                </button>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => toggleHighlight(p)}
                  className={`text-xs px-2 py-1 rounded transition-colors cursor-pointer ${
                    p.highlighted ? "text-amber-600 font-medium" : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  {p.highlighted ? "★ Highlighted" : "☆ Highlight"}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(p.id)}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <p className="col-span-full text-center text-gray-400 py-12">
            Belum ada portofolio. Klik "+ Tambah Karya Baru" untuk mulai mengisi galeri.
          </p>
        )}
      </div>
    </div>
  );
}
