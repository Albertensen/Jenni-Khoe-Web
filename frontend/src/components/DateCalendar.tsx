'use client';

import { useState, useMemo } from 'react';

interface CalendarDay {
  date: number;
  status: 'available' | 'booked' | 'hold' | 'past' | 'none';
}

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];
const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

// Mock data — ganti dengan API call ke Laravel /api/available-dates
const MOCK_BOOKED: Record<string, number[]> = {};
const MOCK_HOLD: Record<string, number[]> = {};

function getMonthDays(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDay(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

export default function DateCalendar() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const days = useMemo<CalendarDay[]>(() => {
    const total = getMonthDays(year, month);
    const firstDay = getFirstDay(year, month);
    const key = `${year}-${month}`;
    const booked = MOCK_BOOKED[key] || [];
    const hold = MOCK_HOLD[key] || [];
    const result: CalendarDay[] = [];

    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
      result.push({ date: 0, status: 'none' });
    }

    for (let d = 1; d <= total; d++) {
      const date = new Date(year, month, d);
      const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
      let status: CalendarDay['status'] = isPast ? 'past' : 'available';
      if (booked.includes(d)) status = 'booked';
      else if (hold.includes(d)) status = 'hold';
      result.push({ date: d, status });
    }
    return result;
  }, [year, month]);

  const prev = () => { if (month === 0) { setYear((y) => y - 1); setMonth(11); } else setMonth((m) => m - 1); };
  const next = () => { if (month === 11) { setYear((y) => y + 1); setMonth(0); } else setMonth((m) => m + 1); };

  const statusColors: Record<CalendarDay['status'], string> = {
    available: 'bg-luxury-champagne-light/60 text-luxury-charcoal hover:bg-luxury-champagne/60 cursor-pointer',
    booked: 'bg-luxury-deep-slate/10 text-luxury-deep-slate/40 line-through cursor-not-allowed',
    hold: 'bg-amber-100/60 text-amber-700 cursor-not-allowed',
    past: 'text-luxury-deep-slate/20 cursor-not-allowed',
    none: '',
  };
  const statusLabels: Record<CalendarDay['status'], string> = {
    available: 'Tersedia',
    booked: 'Terbooking',
    hold: 'Ditahan',
    past: 'Terlewat',
    none: '',
  };

  return (
    <section id="availability-calendar" className="w-full px-6 py-16">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <span className="text-xs uppercase tracking-widest text-luxury-rose-gold font-medium">
            Cek Jadwal
          </span>
          <h3 className="font-serif text-3xl md:text-4xl text-luxury-charcoal font-medium mt-1">
            Kalender Ketersediaan
          </h3>
          <p className="text-xs md:text-sm text-luxury-deep-slate/70 mt-2 font-light">
            Hijau = tersedia. Abu = terbooking. Kuning = ditahan.
          </p>
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-4 mb-6 text-xs text-luxury-deep-slate/60">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-luxury-champagne-light/60 inline-block" /> Available</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-luxury-deep-slate/10 inline-block" /> Booked</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-100/60 inline-block" /> Hold</span>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={prev} className="p-2 hover:bg-luxury-champagne-light/60 rounded-xl transition-colors cursor-pointer" aria-label="Bulan sebelumnya">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <h4 className="font-serif text-xl text-luxury-charcoal font-medium">{MONTHS[month]} {year}</h4>
          <button onClick={next} className="p-2 hover:bg-luxury-champagne-light/60 rounded-xl transition-colors cursor-pointer" aria-label="Bulan berikutnya">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {DAYS.map((d) => (
            <div key={d} className="text-center text-xs font-medium text-luxury-deep-slate/50 py-1">{d}</div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, i) => (
            <div
              key={i}
              title={day.status !== 'none' ? `${day.date} ${MONTHS[month]} — ${statusLabels[day.status]}` : undefined}
              className={`aspect-square rounded-xl flex items-center justify-center text-sm transition-all ${statusColors[day.status]}`}
            >
              {day.date > 0 ? day.date : ''}
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-luxury-deep-slate/40 mt-6">
          *Jadwal real-time. Hubungi Kak Jenni via WhatsApp untuk konfirmasi booking.
        </p>
      </div>
    </section>
  );
}
