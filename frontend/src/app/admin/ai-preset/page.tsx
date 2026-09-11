'use client';

import { useState, useEffect } from 'react';

interface PresetData {
  id?: number;
  name: string;
  is_active: boolean;
  model_provider: string;
  model_name: string;
  api_base_url: string;
  api_key: string;
  temperature: number;
  max_tokens: number;
  system_prompt: string;
  rules: string;
  greeting_message: string;
  whatsapp_number: string;
  whatsapp_text_template: string;
  packages_info: string;
  auto_capture_leads: boolean;
}

const DEFAULT_STATE: PresetData = {
  name: 'Default Jenni Khoe AI CS',
  is_active: true,
  model_provider: 'combo-utama',
  model_name: 'COMBO-UTAMA',
  api_base_url: 'http://localhost:20128/v1',
  api_key: 'sk-f6d23bb7bbd0260e-v9p3lm-e4eadc94',
  temperature: 0.7,
  max_tokens: 350,
  system_prompt: 'Anda adalah Customer Service & Virtual Assistant resmi untuk Jenni Khoe Makeup Artist (MUA Haute Couture & Luxury Bridal Specialist). Kepribadian: Sopan, hangat, profesional, bernuansa luxury (panggil klien dengan "Kak"). Tugas utama: Membantu calon pengantin konsultasi riasan, cek ketersediaan tanggal, jelaskan paket, dan arahkan booking privat.',
  rules: `1. Selalu sapa calon pengantin dengan sebutan 'Kak' yang ramah dan bernuansa luxury.
2. Jika klien menanyakan ketersediaan jadwal, selalu tanyakan: tanggal acara, lokasi/venue, dan konsep riasan yang diinginkan.
3. Berikan saran skin preparation jika klien bertanya tentang ketahanan riasan atau kulit sensitif.
4. Jelaskan cakupan layanan dan keistimewaan fasilitas paket tanpa menyebutkan angka harga/rupiah (Rp).
5. KEBIJAKAN PRICELIST: Seluruh katalog harga & pricelist resmi lengkap hanya dikirimkan via WhatsApp resmi Kak Jenni.
6. Jika klien siap booking atau meminta pricelist, arahkan untuk klik tombol WhatsApp resmi.`,
  greeting_message: 'Halo Kak! Selamat datang di Jenni Khoe MUA. Saya asisten virtual Jenni Khoe, siap membantu konsultasi jadwal, rekomendasi riasan, paket bridal, dan booking privat untuk hari bahagia Kakak.',
  whatsapp_number: '6281234567890',
  whatsapp_text_template: 'Halo Kak Jenni Khoe, saya ingin konsultasi booking jadwal makeup.',
  packages_info: `Paket Utama Layanan Jenni Khoe MUA:
1. Luxury Royal Bridal: Riasan Pengantin Akad + Resepsi, Retouch standby seharian, Free makeup Ibu Pengantin, Flawless complexion tahan 18 jam, Premium false lashes & skin prep luxury.
2. Intimate / Holy Matrimony: Riasan Pengantin 1 sesi sakral, Natural radiant finish, Free touch-up kit.
3. Engagement / Prewedding: Riasan 1 look glam/natural untuk photoshoot atau lamaran, Touch-up kit eksklusif.
4. Family & Bridesmaid: Layanan riasan keluarga inti & bridesmaid.
Cakupan layanan: Jabodetabek, Bandung, Bali, dan Destination Wedding seluruh Indonesia.
PENTING: Seluruh katalog harga & pricelist resmi lengkap hanya dikirimkan via WhatsApp resmi.`,
  auto_capture_leads: true,
};

export default function AiPresetAdminPage() {
  const [preset, setPreset] = useState<PresetData>(DEFAULT_STATE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testingModel, setTestingModel] = useState(false);

  useEffect(() => {
    fetchPreset();
  }, []);

  const fetchPreset = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/chat-preset');
      const data = await res.json();
      if (data.preset) {
        setPreset((prev) => ({ ...prev, ...data.preset }));
      }
    } catch (err: any) {
      console.error('Fetch preset error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setNotification(null);
    try {
      const res = await fetch('/api/admin/chat-preset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preset),
      });
      const data = await res.json();
      if (data.success) {
        setNotification({ type: 'success', message: 'Preset AI Chat CS berhasil disimpan & langsung aktif di website!' });
      } else {
        throw new Error(data.error || 'Gagal menyimpan preset');
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTestingModel(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Ping tes koneksi model AI CS Jenni Khoe' }],
        }),
      });
      const data = await res.json();
      const lastMsg = data.messages?.[data.messages.length - 1]?.content;
      const source = data.source === 'model' ? '⚡ Terhubung ke Model AI' : '🛡️ Fallback ke Knowledge Base';
      setTestResult(`${source}: "${lastMsg?.slice(0, 120)}..."`);
    } catch (err: any) {
      setTestResult(`Gagal uji koneksi: ${err.message}`);
    } finally {
      setTestingModel(false);
    }
  };

  const handleReset = () => {
    if (confirm('Kembalikan seluruh preset ke pengaturan bawaan COMBO-UTAMA?')) {
      setPreset(DEFAULT_STATE);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-luxury-rose-gold" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-serif font-semibold text-gray-900">AI Customer Service Preset</h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Active
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Sesuaikan tugas CS AI, provider model, aturan menjawab, cek jadwal, dan eskalasi booking klien.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            type="button"
            className="px-4 py-2 text-sm border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Reset Default
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            type="button"
            className="px-5 py-2 text-sm font-medium bg-gradient-to-r from-luxury-rose-gold to-luxury-champagne text-white rounded-xl hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? 'Menyimpan...' : 'Simpan Preset'}
          </button>
        </div>
      </div>

      {notification && (
        <div
          className={`p-4 rounded-xl text-sm font-medium flex items-center justify-between ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} className="text-sm underline cursor-pointer">
            Tutup
          </button>
        </div>
      )}

      {/* Grid Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Main Prompt & Rules */}
        <div className="lg:col-span-2 space-y-6">
          {/* Greeting message */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <span>💬</span> Pesan Sambutan Pembuka (Greeting)
            </h2>
            <p className="text-xs text-gray-500">
              Pesan pertama yang langsung muncul di balon chat ketika calon klien membuka widget.
            </p>
            <textarea
              rows={3}
              value={preset.greeting_message}
              onChange={(e) => setPreset({ ...preset, greeting_message: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-luxury-rose-gold/20 focus:border-luxury-rose-gold outline-none transition-all"
              placeholder="Tulis pesan salam pembuka..."
            />
          </div>

          {/* Persona & System Prompt */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <span>🎭</span> Karakter & Persona CS (System Prompt)
            </h2>
            <p className="text-xs text-gray-500">
              Instruksi dasar cara AI memperkenalkan diri, memposisikan diri sebagai tim Jenni Khoe, dan nada bicara luxury.
            </p>
            <textarea
              rows={5}
              value={preset.system_prompt}
              onChange={(e) => setPreset({ ...preset, system_prompt: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-luxury-rose-gold/20 focus:border-luxury-rose-gold outline-none font-mono text-xs leading-relaxed transition-all"
              placeholder="Tulis instruksi persona..."
            />
          </div>

          {/* Rules and Guardrails */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <span>🛡️</span> Tugas Khusus & Aturan Membalas (Rules & Guardrails)
            </h2>
            <p className="text-xs text-gray-500">
              Aturan wajib apa saja yang boleh/tidak boleh dilakukan (misal: cek tanggal, tanya venue, batasan diskon, arahkan ke WA).
            </p>
            <textarea
              rows={6}
              value={preset.rules}
              onChange={(e) => setPreset({ ...preset, rules: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-luxury-rose-gold/20 focus:border-luxury-rose-gold outline-none font-mono text-xs leading-relaxed transition-all"
              placeholder="1. Selalu sapa 'Kak'&#10;2. Tanyakan tanggal acara..."
            />
          </div>

          {/* Knowledge Base Packages */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <span>📦</span> Informasi Paket & Layanan (Knowledge Base)
            </h2>
            <p className="text-xs text-gray-500">
              Rincian paket makeup, harga resmi, inklusi layanan, serta cakupan lokasi yang digunakan AI untuk menjawab pertanyaan klien.
            </p>
            <textarea
              rows={6}
              value={preset.packages_info}
              onChange={(e) => setPreset({ ...preset, packages_info: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-luxury-rose-gold/20 focus:border-luxury-rose-gold outline-none font-mono text-xs leading-relaxed transition-all"
              placeholder="Tulis rincian paket dan harga..."
            />
          </div>
        </div>

        {/* Right 1 Col: Model Provider & Escalation */}
        <div className="space-y-6">
          {/* Provider settings */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <span>⚡</span> Model Provider (COMBO-UTAMA)
            </h2>
            <p className="text-xs text-gray-500">
              Koneksi engine LLM yang aktif memproses obrolan CS.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Model ID</label>
                <input
                  type="text"
                  value={preset.model_name}
                  onChange={(e) => setPreset({ ...preset, model_name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-luxury-rose-gold outline-none font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">API Base URL</label>
                <input
                  type="text"
                  value={preset.api_base_url}
                  onChange={(e) => setPreset({ ...preset, api_base_url: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-luxury-rose-gold outline-none font-mono text-xs"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-gray-700">API Key</label>
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="text-[10px] text-gray-500 hover:text-gray-800 cursor-pointer"
                  >
                    {showApiKey ? 'Sembunyikan' : 'Perlihatkan'}
                  </button>
                </div>
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={preset.api_key}
                  onChange={(e) => setPreset({ ...preset, api_key: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-luxury-rose-gold outline-none font-mono text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Temperature ({preset.temperature})</label>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    value={preset.temperature}
                    onChange={(e) => setPreset({ ...preset, temperature: parseFloat(e.target.value) })}
                    className="w-full accent-luxury-rose-gold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Max Tokens</label>
                  <input
                    type="number"
                    value={preset.max_tokens}
                    onChange={(e) => setPreset({ ...preset, max_tokens: parseInt(e.target.value) || 300 })}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:border-luxury-rose-gold outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testingModel}
                  className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {testingModel ? (
                    <>
                      <span className="w-3 h-3 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                      Menguji Model...
                    </>
                  ) : (
                    '🧪 Uji Respon Model Sekarang'
                  )}
                </button>
                {testResult && (
                  <p className="mt-2 p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-700 break-words">
                    {testResult}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* WhatsApp Escalation & Leads */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <span>📲</span> WhatsApp & Prospek Klien
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nomor WhatsApp Resmi</label>
                <input
                  type="text"
                  value={preset.whatsapp_number}
                  onChange={(e) => setPreset({ ...preset, whatsapp_number: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-luxury-rose-gold outline-none"
                  placeholder="6281234567890"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Template Chat WA</label>
                <input
                  type="text"
                  value={preset.whatsapp_text_template}
                  onChange={(e) => setPreset({ ...preset, whatsapp_text_template: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-luxury-rose-gold outline-none text-xs"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preset.auto_capture_leads}
                    onChange={(e) => setPreset({ ...preset, auto_capture_leads: e.target.checked })}
                    className="mt-0.5 w-4 h-4 rounded text-luxury-rose-gold accent-luxury-rose-gold"
                  />
                  <div>
                    <span className="text-xs font-medium text-gray-800">Auto-Capture AI Leads</span>
                    <p className="text-[11px] text-gray-500">
                      Otomatis simpan nomor telepon / nama calon klien dari obrolan ke tab AI Leads di database.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
