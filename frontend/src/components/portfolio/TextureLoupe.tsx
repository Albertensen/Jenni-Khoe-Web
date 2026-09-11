'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface TextureLoupeProps {
  src: string;
  alt: string;
  imgWidth?: number;
  imgHeight?: number;
  zoom?: number;
  lensSize?: number;
  className?: string;
}

export default function TextureLoupe({
  src,
  alt,
  imgWidth = 800,
  imgHeight = 1000,
  zoom = 3.5,
  lensSize = 160,
  className = '',
}: TextureLoupeProps) {
  const [showLoupe, setShowLoupe] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [naturalAspect, setNaturalAspect] = useState<number | null>(null);
  const imgRef = useRef<HTMLDivElement>(null);

  // Keep container dimensions updated dynamically
  useEffect(() => {
    if (!imgRef.current) return;
    const updateDims = () => {
      if (imgRef.current) {
        const rect = imgRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };
    updateDims();
    const ro = new ResizeObserver(updateDims);
    ro.observe(imgRef.current);
    return () => ro.disconnect();
  }, []);

  const updatePosition = useCallback((clientX: number, clientY: number) => {
    if (!imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(clientY - rect.top, rect.height));
    setPosition({ x, y });
    setDimensions({ width: rect.width, height: rect.height });
  }, []);

  const handleMouseEnter = useCallback((e: React.MouseEvent) => {
    setShowLoupe(true);
    updatePosition(e.clientX, e.clientY);
  }, [updatePosition]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    updatePosition(e.clientX, e.clientY);
  }, [updatePosition]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setShowLoupe(true);
    if (e.touches[0]) updatePosition(e.touches[0].clientX, e.touches[0].clientY);
  }, [updatePosition]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches[0]) updatePosition(e.touches[0].clientX, e.touches[0].clientY);
  }, [updatePosition]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.naturalWidth && img.naturalHeight) {
      setNaturalAspect(img.naturalWidth / img.naturalHeight);
    }
  };

  // Optical precision calculation:
  // Background image is scaled exactly to (container width * zoom, container height * zoom)
  // Center of lens (lensSize / 2, lensSize / 2) maps 1:1 to (position.x, position.y) on the container
  const bgW = (dimensions.width || imgWidth) * zoom;
  const bgH = (dimensions.height || imgHeight) * zoom;
  const bgPosX = -(position.x * zoom - lensSize / 2);
  const bgPosY = -(position.y * zoom - lensSize / 2);

  return (
    <div
      ref={imgRef}
      className={`relative overflow-hidden cursor-crosshair select-none ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setShowLoupe(false)}
      onMouseMove={handleMouseMove}
      onTouchStart={handleTouchStart}
      onTouchEnd={() => setShowLoupe(false)}
      onTouchMove={handleTouchMove}
      style={{
        width: '100%',
        aspectRatio: naturalAspect ? `${naturalAspect}` : `${imgWidth}/${imgHeight}`,
      }}
    >
      {/* Base Display Image */}
      <img
        src={src}
        alt={alt}
        onLoad={handleImageLoad}
        className="w-full h-full object-cover pointer-events-none select-none block"
      />

      {/* Magnifier Lens */}
      {showLoupe && dimensions.width > 0 && (
        <div
          className="pointer-events-none absolute z-30 rounded-full border-2 border-luxury-rose-gold shadow-[0_12px_40px_rgba(0,0,0,0.4)] ring-4 ring-white/70 backdrop-brightness-105"
          style={{
            width: lensSize,
            height: lensSize,
            left: position.x - lensSize / 2,
            top: position.y - lensSize / 2,
            backgroundImage: `url(${src})`,
            backgroundSize: `${bgW}px ${bgH}px`,
            backgroundPosition: `${bgPosX}px ${bgPosY}px`,
            backgroundRepeat: 'no-repeat',
          }}
        >
          {/* Subtle center crosshair dot to verify exact alignment */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-luxury-rose-gold/80 border border-white shadow-sm" />

          {/* Luxury Zoom Badge */}
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-luxury-charcoal/95 text-[10px] tracking-wider text-luxury-champagne font-medium rounded-full shadow-md whitespace-nowrap border border-luxury-champagne/30">
            {zoom}x ULTRA-HD LOUPE
          </div>
        </div>
      )}
    </div>
  );
}
