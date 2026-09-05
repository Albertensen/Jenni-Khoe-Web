'use client';

import { useState, useEffect } from 'react';

interface UrgencyBannerProps {
  expiresAt: string; // ISO date string
  onExpired?: () => void;
}

export default function UrgencyCountdownBanner({ expiresAt, onExpired }: UrgencyBannerProps) {
  const [remaining, setRemaining] = useState('');
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const target = new Date(expiresAt).getTime();

    const tick = () => {
      const now = Date.now();
      const diff = target - now;
      if (diff <= 0) {
        setRemaining('Slot telah dilepas');
        setExpired(true);
        onExpired?.();
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt, onExpired]);

  if (expired) {
    return (
      <div className="w-full bg-red-600/90 text-white text-center py-3 px-4 text-sm font-medium">
        Slot tanggal telah dilepas. Silakan hubungi Kak Jenni untuk ketersediaan baru.
      </div>
    );
  }

  return (
    <div className="w-full bg-gradient-to-r from-luxury-rose-gold/90 to-amber-600/90 text-white text-center py-3 px-4">
      <span className="text-xs uppercase tracking-widest opacity-80">Slot ditahan untuk Anda</span>
      <div className="font-mono text-2xl font-bold tracking-wider mt-1">{remaining}</div>
      <span className="text-xs opacity-70">Segera selesaikan pemesanan sebelum slot dilepas</span>
    </div>
  );
}
