'use client';

import { useState } from 'react';

const PACKAGES = [
  { id: 'bridal-basic', label: 'Bridal Basic — Rp 3.500.000' },
  { id: 'bridal-premium', label: 'Bridal Premium + Trial — Rp 8.500.000' },
  { id: 'graduation', label: 'Graduation & Party — Rp 750.000' },
  { id: 'bridesmaid', label: 'Bridesmaid / Pengiring — Rp 500.000' },
  { id: 'family', label: 'Ibu & Mertua — Rp 600.000' },
];

const PHONE = '6281234567890'; // Jenni Khoe WhatsApp

export default function WhatsAppDispatcher() {
  const [name, setName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [venue, setVenue] = useState('');
  const [selectedPkg, setSelectedPkg] = useState('');
  const [guestCount, setGuestCount] = useState('');

  const generateMessage = (): string => {
    const parts = ['Halo Kak Jenni! Saya ingin booking makeup.'];
    if (name) parts.push(`Nama: ${name}`);
    if (eventDate) parts.push(`Tanggal acara: ${eventDate}`);
    if (venue) parts.push(`Lokasi/venue: ${venue}`);
    if (selectedPkg) {
      const pkg = PACKAGES.find((p) => p.id === selectedPkg);
      if (pkg) parts.push(`Paket: ${pkg.label}`);
    }
    if (guestCount) parts.push(`Jumlah orang: ${guestCount}`);
    parts.push('Mohon info ketersediaan dan DP.');
    return parts.join('%0A');
  };

  const waUrl = `https://wa.me/${PHONE}?text=${generateMessage()}`;

  return (
    <section id="whatsapp-dispatcher" className="w-full px-6 py-16 bg-luxury-champagne-light/20">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <span className="text-xs uppercase tracking-widest text-luxury-rose-gold font-medium">
            Booking Cepat
          </span>
          <h3 className="font-serif text-3xl md:text-4xl text-luxury-charcoal font-medium mt-1">
            Kirim Pesan ke Kak Jenni
          </h3>
          <p className="text-xs md:text-sm text-luxury-deep-slate/70 mt-2 font-light">
            Isi detail acara, pesan terstruktur akan terkirim otomatis via WhatsApp.
          </p>
        </div>

        <div className="space-y-4">
          <input
            type="text" placeholder="Nama Kak*" value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 text-sm border border-luxury-champagne/40 rounded-xl bg-white/60 focus:outline-none focus:border-luxury-rose-gold transition-colors"
          />
          <input
            type="date" placeholder="Tanggal acara" value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            className="w-full px-4 py-3 text-sm border border-luxury-champagne/40 rounded-xl bg-white/60 focus:outline-none focus:border-luxury-rose-gold transition-colors"
          />
          <input
            type="text" placeholder="Lokasi / venue" value={venue}
            onChange={(e) => setVenue(e.target.value)}
            className="w-full px-4 py-3 text-sm border border-luxury-champagne/40 rounded-xl bg-white/60 focus:outline-none focus:border-luxury-rose-gold transition-colors"
          />
          <select
            value={selectedPkg}
            onChange={(e) => setSelectedPkg(e.target.value)}
            className="w-full px-4 py-3 text-sm border border-luxury-champagne/40 rounded-xl bg-white/60 focus:outline-none focus:border-luxury-rose-gold transition-colors appearance-none"
          >
            <option value="">-- Pilih paket --</option>
            {PACKAGES.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
          <input
            type="number" min="1" placeholder="Jumlah orang (optional)" value={guestCount}
            onChange={(e) => setGuestCount(e.target.value)}
            className="w-full px-4 py-3 text-sm border border-luxury-champagne/40 rounded-xl bg-white/60 focus:outline-none focus:border-luxury-rose-gold transition-colors"
          />

          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`block w-full py-3 text-center text-sm font-medium rounded-xl transition-all ${
              name
                ? 'bg-gradient-to-r from-luxury-rose-gold to-luxury-champagne text-white hover:shadow-md'
                : 'bg-gray-200 text-gray-400 pointer-events-none'
            }`}
          >
            Kirim via WhatsApp
          </a>

          <p className="text-xs text-luxury-deep-slate/40 text-center">
            Kak Jenni akan merespon dalam 1x24 jam. Pastikan nomor WA aktif.
          </p>
        </div>
      </div>
    </section>
  );
}
