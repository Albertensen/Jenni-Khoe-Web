'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import type { SkinUndertone, VenueLighting } from '@/types/portfolio';
import { portfolioItems } from '@/data/portfolio';

const undertones: { value: SkinUndertone | 'all'; label: string }[] = [
  { value: 'all', label: 'All Undertones' },
  { value: 'warm', label: 'Warm' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'cool', label: 'Cool' },
];

const lightings: { value: VenueLighting | 'all'; label: string }[] = [
  { value: 'all', label: 'All Lighting' },
  { value: 'indoor-ballroom', label: 'Ballroom Chandelier' },
  { value: 'outdoor-sunset', label: 'Outdoor Sunset' },
  { value: 'outdoor-garden', label: 'Garden' },
  { value: 'studio', label: 'Studio Flash' },
];

export default function LookbookMatrix() {
  const [undertone, setUndertone] = useState<SkinUndertone | 'all'>('all');
  const [lighting, setLighting] = useState<VenueLighting | 'all'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return portfolioItems.filter((item) => {
      if (undertone !== 'all' && item.skinUndertone !== undertone) return false;
      if (lighting !== 'all' && item.venueLighting !== lighting) return false;
      return true;
    });
  }, [undertone, lighting]);

  const selected = selectedId ? portfolioItems.find((i) => i.id === selectedId) : null;

  return (
    <section className="w-full px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 text-center">
          <span className="text-xs uppercase tracking-widest text-luxury-rose-gold font-medium">
            Multidimensional Lookbook
          </span>
          <h3 className="font-serif text-3xl text-luxury-charcoal font-medium mt-1">
            Cari Inspirasi Riasan Anda
          </h3>
          <p className="text-sm text-luxury-deep-slate/70 mt-2 font-light">
            Filter berdasarkan skin undertone dan venue lighting untuk melihat hasil riasan paling relevan.
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 flex flex-wrap justify-center gap-3">
          {undertones.map((u) => (
            <button
              key={u.value}
              onClick={() => setUndertone(u.value)}
              className={`px-4 py-2 rounded-full text-xs font-medium tracking-wider transition-all cursor-pointer ${
                undertone === u.value
                  ? 'bg-luxury-rose-gold text-white shadow-md'
                  : 'bg-white/60 border border-luxury-champagne/40 text-luxury-deep-slate/70 hover:bg-luxury-rose-gold/10'
              }`}
            >
              {u.label}
            </button>
          ))}
        </div>
        <div className="mb-10 flex flex-wrap justify-center gap-3">
          {lightings.map((l) => (
            <button
              key={l.value}
              onClick={() => setLighting(l.value)}
              className={`px-4 py-2 rounded-full text-xs font-medium tracking-wider transition-all cursor-pointer ${
                lighting === l.value
                  ? 'bg-luxury-rose-gold text-white shadow-md'
                  : 'bg-white/60 border border-luxury-champagne/40 text-luxury-deep-slate/70 hover:bg-luxury-rose-gold/10'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedId(item.id === selectedId ? null : item.id)}
              className="group relative aspect-[4/5] overflow-hidden rounded-2xl border border-luxury-champagne/30 shadow-lg transition-all duration-500 hover:shadow-2xl hover:scale-[1.02] cursor-pointer text-left"
            >
              <Image
                src={item.afterImgs[0]!.studio}
                alt={item.title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-luxury-charcoal/70 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <p className="font-serif text-lg text-luxury-pearl">{item.title}</p>
                <p className="text-xs text-luxury-champagne/80 mt-1">{item.brideName}</p>
              </div>
            </button>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="text-center text-luxury-deep-slate/50 mt-10">
            Tidak ada hasil untuk filter ini.
          </p>
        )}

        {/* Detail Modal */}
        {selected && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedId(null)}
          >
            <div
              className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-luxury-pearl border border-white/20 p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedId(null)}
                className="absolute right-4 top-4 text-luxury-deep-slate/40 hover:text-luxury-deep-slate text-xl cursor-pointer z-10"
                aria-label="Close"
              >
                &times;
              </button>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="relative aspect-[3/4] overflow-hidden rounded-xl">
                  <Image
                    src={selected.afterImgs[0]!.studio}
                    alt={selected.title}
                    fill
                    className="object-cover"
                    sizes="400px"
                  />
                </div>
                <div>
                  <span className="text-xs uppercase tracking-widest text-luxury-rose-gold font-medium">
                    {selected.skinUndertone} &middot; {selected.venueLighting}
                  </span>
                  <h4 className="font-serif text-2xl text-luxury-charcoal mt-2">{selected.title}</h4>
                  <p className="text-xs text-luxury-deep-slate/60 mt-1">{selected.brideName} &middot; {selected.date}</p>
                  <p className="text-sm text-luxury-deep-slate/80 mt-4 leading-relaxed">
                    {selected.description}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}