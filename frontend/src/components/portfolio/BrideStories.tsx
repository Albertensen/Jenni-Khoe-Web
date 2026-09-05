'use client';

import { useState } from 'react';
import Image from 'next/image';
import { brideStories } from '@/data/portfolio';

export default function BrideStories() {
  const [active, setActive] = useState(0);

  const prev = () => setActive((a) => (a === 0 ? brideStories.length - 1 : a - 1));
  const next = () => setActive((a) => (a === brideStories.length - 1 ? 0 : a + 1));

  if (brideStories.length === 0) return null;

  const story = brideStories[active]!;

  return (
    <section className="w-full px-6 py-20 bg-gradient-to-b from-luxury-champagne-light/30 to-luxury-pearl">
      <div className="mx-auto max-w-4xl text-center">
        <span className="text-xs uppercase tracking-widest text-luxury-rose-gold font-medium">
          Social Proof
        </span>
        <h3 className="font-serif text-3xl md:text-4xl text-luxury-charcoal font-medium mt-1">
          Kisah Pengantin Kami
        </h3>
        <p className="text-sm text-luxury-deep-slate/70 mt-2 font-light max-w-xl mx-auto">
          Testimoni nyata dari bride yang telah merasakan pengalaman riasan premium Jenni Khoe.
        </p>

        {/* Carousel */}
        <div className="mt-12 relative">
          <div className="mx-auto max-w-xl rounded-3xl bg-white/70 backdrop-blur-md border border-luxury-champagne/40 p-8 md:p-10 shadow-xl">
            {/* Stars */}
            <div className="flex justify-center gap-1 mb-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className={`text-lg ${i < story.rating ? 'text-amber-400' : 'text-luxury-champagne'}`}>
                  &#9733;
                </span>
              ))}
            </div>

            {/* Quote */}
            <blockquote className="font-serif text-lg md:text-xl text-luxury-deep-slate leading-relaxed italic">
              &ldquo;{story.quote}&rdquo;
            </blockquote>

            {/* Author */}
            <div className="mt-6 flex items-center justify-center gap-3">
              <div className="relative w-10 h-10 rounded-full overflow-hidden">
                <Image src={story.photo} alt={story.name} fill className="object-cover" sizes="40px" />
              </div>
              <div className="text-left">
                <p className="font-sans text-sm font-semibold text-luxury-deep-slate">{story.name}</p>
                <p className="text-xs text-luxury-deep-slate/60">{story.location} &middot; {story.date}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-center gap-4 mt-6">
            <button
              onClick={prev}
              className="w-10 h-10 rounded-full border border-luxury-champagne/40 bg-white/60 flex items-center justify-center text-luxury-deep-slate hover:bg-luxury-rose-gold/10 transition-all cursor-pointer"
              aria-label="Previous story"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              {brideStories.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                    i === active ? 'bg-luxury-rose-gold w-4' : 'bg-luxury-champagne/40'
                  }`}
                  aria-label={`Go to story ${i + 1}`}
                />
              ))}
            </div>
            <button
              onClick={next}
              className="w-10 h-10 rounded-full border border-luxury-champagne/40 bg-white/60 flex items-center justify-center text-luxury-deep-slate hover:bg-luxury-rose-gold/10 transition-all cursor-pointer"
              aria-label="Next story"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}