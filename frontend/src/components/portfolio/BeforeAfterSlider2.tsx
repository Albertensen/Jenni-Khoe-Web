'use client';

import { useState } from 'react';
import Image from 'next/image';

type LightMode = 'studio' | 'natural';

interface BeforeAfterSlider2Props {
  beforeImg: string;
  afterImgs: {
    studio: string;
    natural: string;
  };
  beforeAlt?: string;
  afterAlt?: string;
  labelBefore?: string;
  labelAfter?: string;
}

export default function BeforeAfterSlider2({
  beforeImg,
  afterImgs,
  beforeAlt = 'Before Makeup',
  afterAlt = 'After Makeup',
  labelBefore = 'BEFORE',
  labelAfter = 'AFTER',
}: BeforeAfterSlider2Props) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [lightMode, setLightMode] = useState<LightMode>('studio');

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Lighting Toggle */}
      <div className="flex items-center justify-center gap-3 mb-4">
        <span className="text-xs uppercase tracking-wider text-luxury-deep-slate/60 font-medium">
          Lighting:
        </span>
        <div className="flex rounded-full border border-luxury-champagne/40 bg-luxury-pearl/60 p-0.5">
          {(['studio', 'natural'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setLightMode(mode)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium tracking-wider transition-all cursor-pointer ${
                lightMode === mode
                  ? 'bg-luxury-rose-gold text-white shadow-sm'
                  : 'text-luxury-deep-slate/60 hover:text-luxury-deep-slate'
              }`}
            >
              {mode === 'studio' ? 'Studio Flash' : 'Natural Sunlight'}
            </button>
          ))}
        </div>
      </div>

      {/* Slider */}
      <div className="relative w-full aspect-[4/5] md:aspect-[1/1] overflow-hidden rounded-2xl border border-luxury-champagne/40 shadow-xl shadow-luxury-rose-gold/5 select-none bg-luxury-champagne-light">
        <Image
          src={beforeImg}
          alt={beforeAlt}
          fill
          className="object-cover pointer-events-none"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />

        <span className="absolute top-4 left-4 z-10 rounded-full bg-luxury-charcoal/70 px-3 py-1 text-[10px] font-medium tracking-widest text-luxury-pearl backdrop-blur-sm">
          {labelBefore}
        </span>

        <div
          className="absolute inset-0 overflow-hidden pointer-events-none"
          style={{
            clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)`,
          }}
        >
          <Image
            src={lightMode === 'studio' ? afterImgs.studio : afterImgs.natural}
            alt={afterAlt}
            fill
            className="object-cover pointer-events-none"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
          <span className="absolute top-4 right-4 z-10 rounded-full bg-luxury-rose-gold/85 px-3 py-1 text-[10px] font-medium tracking-widest text-white backdrop-blur-sm">
            {labelAfter}
          </span>
        </div>

        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_10px_rgba(0,0,0,0.4)] pointer-events-none z-20"
          style={{ left: `${sliderPosition}%` }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white text-luxury-rose-gold border border-luxury-champagne flex items-center justify-center shadow-lg">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
              <polyline points="9 18 3 12 9 6" />
            </svg>
          </div>
        </div>

        <input
          type="range"
          min="0"
          max="100"
          value={sliderPosition}
          onChange={(e) => setSliderPosition(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30"
          aria-label="Before and after transformation slider"
        />
      </div>
    </div>
  );
}