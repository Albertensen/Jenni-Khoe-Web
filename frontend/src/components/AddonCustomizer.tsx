'use client';

import { useState, useMemo } from 'react';

interface Addon {
  id: string;
  label: string;
  price: number;
  category: string;
}

const ADDONS: Addon[] = [
  { id: 'ibu', label: 'Rias Ibu', price: 400000, category: 'keluarga' },
  { id: 'mertua', label: 'Rias Mertua', price: 400000, category: 'keluarga' },
  { id: 'bridesmaid-1', label: 'Bridesmaid (1 orang)', price: 350000, category: 'bridesmaid' },
  { id: 'bridesmaid-2', label: 'Bridesmaid (2 orang)', price: 600000, category: 'bridesmaid' },
  { id: 'bridesmaid-3', label: 'Bridesmaid (3+ orang)', price: 800000, category: 'bridesmaid' },
  { id: 'touchup-malam', label: 'Extra Touch-Up Malam', price: 500000, category: 'extra' },
  { id: 'transport-luar', label: 'Transport Luar Kota', price: 300000, category: 'transport' },
  { id: 'trial', label: 'Trial Rias (H-1)', price: 350000, category: 'trial' },
];

interface AddonCustomizerProps {
  basePrice?: number;
  dpPercent?: number;
  onTotalChange?: (total: number, dp: number) => void;
  readonly?: boolean;
  selectedAddons?: string[];
}

export default function AddonCustomizer({
  basePrice = 3500000,
  dpPercent = 50,
  onTotalChange,
  readonly = false,
  selectedAddons: initialSelected = [],
}: AddonCustomizerProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelected));

  const toggle = (id: string) => {
    if (readonly) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const totals = useMemo(() => {
    const addonsTotal = Array.from(selected).reduce((sum, id) => {
      const a = ADDONS.find((a) => a.id === id);
      return sum + (a?.price ?? 0);
    }, 0);
    const grandTotal = basePrice + addonsTotal;
    const dp = Math.round(grandTotal * dpPercent / 100);
    return { basePrice, addonsTotal, grandTotal, dp };
  }, [selected, basePrice, dpPercent]);

  // Notify parent
  const prev = useMemo(() => totals, [totals]);
  if (onTotalChange && (prev.grandTotal !== totals.grandTotal || prev.dp !== totals.dp)) {
    // Defer to next tick to avoid setState during render
    setTimeout(() => onTotalChange(totals.grandTotal, totals.dp), 0);
  }

  return (
    <div className="w-full space-y-6">
      <div>
        <h4 className="font-serif text-lg text-luxury-charcoal font-medium mb-3">Tambahan Rias</h4>
        <p className="text-xs text-luxury-deep-slate/60 mb-4">Centang layanan tambahan yang diinginkan</p>
      </div>

      <div className="space-y-3">
        {ADDONS.map((addon) => (
          <label
            key={addon.id}
            className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
              selected.has(addon.id)
                ? 'border-luxury-rose-gold bg-luxury-rose-gold/5'
                : 'border-luxury-champagne/40 bg-white/40 hover:border-luxury-champagne/60'
            }`}
          >
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={selected.has(addon.id)}
                onChange={() => toggle(addon.id)}
                disabled={readonly}
                className="w-4 h-4 accent-luxury-rose-gold rounded"
              />
              <span className="text-sm text-luxury-charcoal">{addon.label}</span>
            </div>
            <span className="text-sm font-medium text-luxury-rose-gold">
              Rp {addon.price.toLocaleString('id-ID')}
            </span>
          </label>
        ))}
      </div>

      <div className="border-t border-luxury-champagne/40 pt-4 space-y-2 text-sm">
        <div className="flex justify-between text-luxury-deep-slate/60">
          <span>Paket Dasar</span>
          <span>Rp {totals.basePrice.toLocaleString('id-ID')}</span>
        </div>
        <div className="flex justify-between text-luxury-deep-slate/60">
          <span>Tambahan ({selected.size} item)</span>
          <span>+ Rp {totals.addonsTotal.toLocaleString('id-ID')}</span>
        </div>
        <div className="flex justify-between text-lg font-bold text-luxury-charcoal border-t border-luxury-champagne/20 pt-2">
          <span>Total</span>
          <span>Rp {totals.grandTotal.toLocaleString('id-ID')}</span>
        </div>
        <div className="flex justify-between text-sm text-luxury-rose-gold font-medium">
          <span>DP {dpPercent}%</span>
          <span>Rp {totals.dp.toLocaleString('id-ID')}</span>
        </div>
      </div>
    </div>
  );
}
