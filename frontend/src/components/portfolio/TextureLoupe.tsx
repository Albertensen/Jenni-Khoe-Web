'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';

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
  zoom = 3,
  lensSize = 150,
  className = '',
}: TextureLoupeProps) {
  const [showLoupe, setShowLoupe] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const imgRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setPosition({ x, y });
  }, []);

  const bgPosX = -(position.x * zoom - lensSize / 2);
  const bgPosY = -(position.y * zoom - lensSize / 2);

  return (
    <div
      ref={imgRef}
      className={`relative overflow-hidden cursor-crosshair rounded-lg ${className}`}
      onMouseEnter={() => setShowLoupe(true)}
      onMouseLeave={() => setShowLoupe(false)}
      onMouseMove={handleMouseMove}
      style={{ width: '100%', aspectRatio: `${imgWidth}/${imgHeight}` }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, 50vw"
      />

      {showLoupe && (
        <div
          className="pointer-events-none absolute z-10 rounded-full border-2 border-white shadow-2xl shadow-black/30"
          style={{
            width: lensSize,
            height: lensSize,
            left: position.x - lensSize / 2,
            top: position.y - lensSize / 2,
            backgroundImage: `url(${src})`,
            backgroundSize: `${imgWidth * zoom}px ${imgHeight * zoom}px`,
            backgroundPosition: `${bgPosX}px ${bgPosY}px`,
            backgroundRepeat: 'no-repeat',
          }}
        />
      )}
    </div>
  );
}