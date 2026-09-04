"use client";

import { useState } from "react";
import Image from "next/image";

interface BeforeAfterSliderProps {
  beforeImg: string;
  afterImg: string;
  beforeAlt?: string;
  afterAlt?: string;
  labelBefore?: string;
  labelAfter?: string;
}

export default function BeforeAfterSlider({
  beforeImg,
  afterImg,
  beforeAlt = "Before Makeup",
  afterAlt = "After Makeup",
  labelBefore = "BEFORE",
  labelAfter = "AFTER",
}: BeforeAfterSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50);

  return (
    <div className="relative w-full aspect-[4/5] md:aspect-[1/1] overflow-hidden rounded-2xl border border-luxury-champagne/40 shadow-xl shadow-luxury-rose-gold/5 select-none bg-luxury-champagne-light">
      {/* Background (Before Image) */}
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

      {/* Foreground / Clipped Layer (After Image) */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        style={{
          clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)`,
        }}
      >
        <Image
          src={afterImg}
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

      {/* Handle Divider Line */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_10px_rgba(0,0,0,0.4)] pointer-events-none z-20"
        style={{ left: `${sliderPosition}%` }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white text-luxury-rose-gold border border-luxury-champagne flex items-center justify-center shadow-lg">
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
            <polyline points="9 18 3 12 9 6" />
          </svg>
        </div>
      </div>

      {/* Range Input Trigger */}
      <input
        type="range"
        min="0"
        max="100"
        value={sliderPosition}
        onChange={(e) => setSliderPosition(Number(e.target.value))}
        className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30 m-0"
        aria-label="Before and after transformation slider"
      />
    </div>
  );
}
