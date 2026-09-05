'use client';

import { useState } from 'react';
import UrgencyCountdownBanner from '@/components/UrgencyCountdownBanner';
import AddonCustomizer from '@/components/AddonCustomizer';
import SignatureCanvas from '@/components/SignatureCanvas';

const MOCK_CLIENT = {
  name: 'Sarah Wijaya',
  phone: '6281234567890',
  event_date: '2026-04-15',
  venue: 'Hotel Mulia, Jakarta',
  package: 'Bridal Premium',
  package_price: 8500000,
  dp_percent: 50,
  expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
};

export default function GatedClosingPage() {
  const [signature, setSignature] = useState<string | null>(null);
  const [step, setStep] = useState<'addons' | 'sign' | 'payment' | 'done'>('addons');

  const dpAmount = Math.round(MOCK_CLIENT.package_price * (MOCK_CLIENT.dp_percent / 100));

  const handleSignatureSave = (dataUrl: string) => {
    setSignature(dataUrl);
  };

  const handleExpired = () => {
    alert('Tautan telah kedaluwarsa. Silakan hubungi admin.');
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-luxury-rose-gold/5 to-white">
      <header className="text-center pt-8 pb-6 px-4">
        <h1 className="text-3xl font-serif text-luxury-charcoal font-medium">
          Closing Portal
        </h1>
        <p className="text-sm text-gray-500 mt-2">
          Halo, {MOCK_CLIENT.name}! Selesaikan pemesanan Anda di bawah ini.
        </p>
      </header>

      <div className="max-w-2xl mx-auto px-4 pb-16 space-y-6">
        <UrgencyCountdownBanner expiresAt={MOCK_CLIENT.expires_at} onExpired={handleExpired} />

        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-serif text-lg text-luxury-charcoal font-medium mb-4">Ringkasan Pesanan</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Paket</span><span className="font-medium">{MOCK_CLIENT.package}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Harga</span><span className="font-medium">Rp {MOCK_CLIENT.package_price.toLocaleString('id-ID')}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Tanggal</span><span>{MOCK_CLIENT.event_date}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Lokasi</span><span>{MOCK_CLIENT.venue}</span></div>
          </div>
        </div>

        {step === 'addons' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-serif text-lg text-luxury-charcoal font-medium mb-4">Tambahan Rias</h2>
            <AddonCustomizer basePrice={MOCK_CLIENT.package_price} dpPercent={MOCK_CLIENT.dp_percent} />
            <button
              onClick={() => setStep('sign')}
              className="mt-6 w-full py-3 bg-luxury-rose-gold text-white rounded-xl font-medium hover:bg-luxury-rose-gold/90 transition-colors cursor-pointer"
            >
              Lanjut ke Tanda Tangan
            </button>
          </div>
        )}

        {step === 'sign' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-serif text-lg text-luxury-charcoal font-medium mb-4">Tanda Tangan SPK Digital</h2>
            <p className="text-xs text-gray-400 mb-4">
              Dengan menandatangani, Anda menyetujui syarat dan ketentuan layanan Jenni Khoe MUA.
            </p>
            <SignatureCanvas onSave={handleSignatureSave} />
            <button
              onClick={() => setStep('payment')}
              disabled={!signature}
              className="mt-6 w-full py-3 bg-luxury-rose-gold text-white rounded-xl font-medium hover:bg-luxury-rose-gold/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              {signature ? 'Lanjut ke Pembayaran' : 'Tanda tangan dulu ya'}
            </button>
          </div>
        )}

        {step === 'payment' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-serif text-lg text-luxury-charcoal font-medium mb-4">Pembayaran DP</h2>
            <div className="text-center py-4 mb-4">
              <p className="text-xs text-gray-400">DP 50% yang harus dibayar</p>
              <p className="text-3xl font-bold text-luxury-charcoal mt-1">
                Rp {dpAmount.toLocaleString('id-ID')}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button className="py-3 border-2 border-luxury-rose-gold text-luxury-rose-gold rounded-xl font-medium hover:bg-luxury-rose-gold/5 transition-colors cursor-pointer">
                QRIS
              </button>
              <button className="py-3 bg-luxury-rose-gold text-white rounded-xl font-medium hover:bg-luxury-rose-gold/90 transition-colors cursor-pointer">
                Virtual Account
              </button>
            </div>
            <button
              onClick={() => setStep('done')}
              className="mt-4 w-full py-2 text-xs text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            >
              Saya sudah bayar — Konfirmasi
            </button>
          </div>
        )}

        {step === 'done' && (
          <div className="bg-white rounded-2xl border border-green-100 p-8 text-center">
            <div className="text-4xl mb-3">✅</div>
            <h2 className="font-serif text-xl text-luxury-charcoal font-medium mb-2">Pemesanan Berhasil!</h2>
            <p className="text-sm text-gray-500">
              Terima kasih {MOCK_CLIENT.name}! Kami akan mengirimkan konfirmasi via WhatsApp.
            </p>
          </div>
        )}

        <div className="flex justify-center gap-2">
          {['addons', 'sign', 'payment'].map((s) => (
            <div key={s} className={`w-2.5 h-2.5 rounded-full ${
              step === s ? 'bg-luxury-rose-gold' : 'bg-gray-200'
            }`} />
          ))}
        </div>
      </div>
    </main>
  );
}
