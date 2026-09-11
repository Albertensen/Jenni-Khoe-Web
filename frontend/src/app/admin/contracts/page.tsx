"use client";

import { useState, useEffect, useMemo } from "react";

interface Contract {
  id: number;
  booking_id: number | null;
  deal_id: number | null;
  client_name: string;
  client_phone: string;
  service_package: string;
  event_date: string;
  venue: string;
  spk_number: string;
  signed_at: string | null;
  signed_ip: string | null;
  status: string;
  client_signature_data: string | null;
  terms_content: string | null;
  pdf_path: string | null;
  created_at?: string;
}

const DEFAULT_STANDARD_TNC = `1. Penguncian Slot Tanggal & Uang Muka (DP 50%):
Jadwal riasan hanya dinyatakan sah terblokir setelah PIHAK KEDUA membubuhkan tanda tangan SPK digital ini serta mentransfer uang muka (DP 50%). DP bersifat non-refundable karena slot tanggal telah diblokir secara eksklusif (1 pengantin per hari).

2. Pelunasan Pembayaran:
Sisa pelunasan (50%) wajib diselesaikan selambat-lambatnya H-7 sebelum hari acara pernikahan melalui metode transfer resmi studio Jenni Khoe MUA.

3. Ketepatan Waktu & Kesiapan Lokasi:
PIHAK PERTAMA akan hadir tepat waktu sesuai jam mulai rias yang telah dikunci. PIHAK KEDUA diharapkan telah menyiapkan ruangan steril dengan pencahayaan dan pendingin ruangan yang memadai, serta wajah bersih tanpa skincare berminyak tebal.

4. Kebijakan Reschedule:
Perubahan tanggal acara hanya dapat dilakukan apabila slot baru pada kalender PIHAK PERTAMA masih tersedia, dengan pemberitahuan konfirmasi tertulis minimal 30 hari kalender sebelum tanggal awal yang disepakati.

5. Jaminan Mutu & Higienitas:
Seluruh peralatan, spons, dan kuas rias telah melalui proses sterilisasi higienis medis dan menggunakan kosmetik luxury internasional original berkualitas tinggi.

6. Force Majeure & Regulasi:
Apabila terjadi keadaan kahar / memaksa (bencana alam, regulasi darurat pemerintah), kedua belah pihak sepakat untuk mencari jadwal pengganti sesuai ketersediaan kalender Jenni Khoe MUA tanpa hangusnya uang muka (DP) yang telah disetorkan.`;

export default function AdminContracts() {
  const [activeTab, setActiveTab] = useState<"archive" | "tnc">("archive");

  // SPK Archive States
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "signed" | "pending">("all");
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Default T&C Settings States
  const [tncTitle, setTncTitle] = useState("Syarat & Ketentuan Standar SPK Digital Jenni Khoe MUA");
  const [tncContent, setTncContent] = useState(DEFAULT_STANDARD_TNC);
  const [tncLoading, setTncLoading] = useState(false);
  const [tncSaving, setTncSaving] = useState(false);
  const [tncUpdatedAt, setTncUpdatedAt] = useState<string | null>(null);
  const [tncSuccessMsg, setTncSuccessMsg] = useState<string | null>(null);

  const fetchContracts = async () => {
    try {
      setRefreshing(true);
      const res = await fetch("/api/contracts");
      if (res.ok) {
        const json = await res.json();
        setContracts(json.data || []);
      }
    } catch (err) {
      console.error("Failed to load contracts:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchTnc = async () => {
    try {
      setTncLoading(true);
      const res = await fetch("/api/contracts/tnc");
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          if (json.data.title) setTncTitle(json.data.title);
          if (json.data.content) setTncContent(json.data.content);
          if (json.data.updated_at) setTncUpdatedAt(json.data.updated_at);
        }
      }
    } catch (err) {
      console.error("Failed to load default T&C:", err);
    } finally {
      setTncLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
    fetchTnc();
  }, []);

  const handleSaveTnc = async () => {
    try {
      setTncSaving(true);
      setTncSuccessMsg(null);
      const res = await fetch("/api/contracts/tnc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: tncTitle,
          content: tncContent,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setTncSuccessMsg("T&C default berhasil disimpan! Setiap klien baru akan otomatis menerima klausul ini.");
        if (json.data?.updated_at) setTncUpdatedAt(json.data.updated_at);
        setTimeout(() => setTncSuccessMsg(null), 5000);
      } else {
        alert(json.message || "Gagal menyimpan T&C");
      }
    } catch (err) {
      console.error("Save TNC error:", err);
      alert("Terjadi kesalahan saat menyimpan T&C");
    } finally {
      setTncSaving(false);
    }
  };

  const handleResetDefaultTnc = () => {
    if (confirm("Kembalikan isi T&C ke template standar resmi studio Jenni Khoe MUA?")) {
      setTncTitle("Syarat & Ketentuan Standar SPK Digital Jenni Khoe MUA");
      setTncContent(DEFAULT_STANDARD_TNC);
    }
  };

  const filteredContracts = useMemo(() => {
    return contracts.filter((c) => {
      const matchesSearch =
        c.client_name.toLowerCase().includes(search.toLowerCase()) ||
        c.client_phone.includes(search) ||
        c.spk_number.toLowerCase().includes(search.toLowerCase()) ||
        c.service_package.toLowerCase().includes(search.toLowerCase()) ||
        c.venue.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "signed" && c.signed_at) ||
        (filterStatus === "pending" && !c.signed_at);

      return matchesSearch && matchesStatus;
    });
  }, [contracts, search, filterStatus]);

  const stats = useMemo(() => {
    const total = contracts.length;
    const signed = contracts.filter((c) => c.signed_at).length;
    const pending = total - signed;
    return { total, signed, pending };
  }, [contracts]);

  const handlePrint = () => {
    window.print();
  };

  if (loading && contracts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-400 gap-3">
        <div className="w-8 h-8 border-2 border-luxury-rose-gold border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium">Memuat arsip SPK & template T&C...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-spk,
          #printable-spk * {
            visibility: visible;
          }
          #printable-spk {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            padding: 24px !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-gray-200/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">📄</span>
            <h1 className="text-2xl font-serif font-bold text-luxury-charcoal tracking-tight">
              SPK & Contract Management
            </h1>
          </div>
          <p className="text-xs text-gray-500 mt-1 max-w-2xl">
            Pusat arsip dokumen Surat Perjanjian Kerja (SPK) digital yang sah mengikat, serta pengaturan template klausul Syarat & Ketentuan (T&C) default yang otomatis dimuat ke formulir tanda tangan setiap klien.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-2xl border border-gray-200/80 shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab("archive")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "archive"
                ? "bg-white text-luxury-charcoal shadow-xs"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <span>📑</span>
            <span>Arsip Dokumen SPK</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-luxury-rose-gold/15 text-luxury-rose-gold-dark font-mono">
              {stats.total}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("tnc")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "tnc"
                ? "bg-white text-luxury-rose-gold-dark shadow-xs border border-luxury-rose-gold/30"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <span>⚙️</span>
            <span>Default T&C SPK Klien</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-700 font-semibold">
              Live
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: ARSIP DOKUMEN SPK DIGITAL                          */}
      {/* ========================================================= */}
      {activeTab === "archive" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-luxury-rose-gold/10 flex items-center justify-center text-luxury-rose-gold text-lg">
                📑
              </div>
              <div>
                <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">Total SPK Terarsip</div>
                <div className="text-xl font-serif font-bold text-luxury-charcoal mt-0.5">{stats.total} Dokumen</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-emerald-100/70 shadow-2xs flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 text-lg">
                ✅
              </div>
              <div>
                <div className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Sah Ditandatangani</div>
                <div className="text-xl font-serif font-bold text-emerald-800 mt-0.5">{stats.signed} SPK Valid</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-amber-100/70 shadow-2xs flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 text-lg">
                ⏳
              </div>
              <div>
                <div className="text-xs font-medium text-amber-600 uppercase tracking-wider">Menunggu Tanda Tangan</div>
                <div className="text-xl font-serif font-bold text-amber-800 mt-0.5">{stats.pending} SPK Draft</div>
              </div>
            </div>
          </div>

          {/* Filter and Search Bar */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-80">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 text-xs">
                🔍
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama klien, WhatsApp, nomor SPK, paket..."
                className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-luxury-rose-gold focus:border-luxury-rose-gold bg-gray-50/50"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto justify-between md:justify-end">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setFilterStatus("all")}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                    filterStatus === "all"
                      ? "bg-luxury-charcoal text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Semua ({stats.total})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterStatus("signed")}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                    filterStatus === "signed"
                      ? "bg-emerald-700 text-white"
                      : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/50"
                  }`}
                >
                  ✓ Sah Ditandatangani ({stats.signed})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterStatus("pending")}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                    filterStatus === "pending"
                      ? "bg-amber-700 text-white"
                      : "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/50"
                  }`}
                >
                  ⏳ Menunggu ({stats.pending})
                </button>
              </div>

              <button
                type="button"
                onClick={fetchContracts}
                disabled={refreshing}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                title="Refresh data"
              >
                <span className={refreshing ? "animate-spin" : ""}>🔄</span>
                <span className="hidden sm:inline">{refreshing ? "..." : "Refresh"}</span>
              </button>
            </div>
          </div>

          {/* Main Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-100 text-gray-500 uppercase tracking-wider font-semibold">
                    <th className="py-3.5 px-4">Nomor SPK</th>
                    <th className="py-3.5 px-4">Klien & Kontak</th>
                    <th className="py-3.5 px-4">Paket & Tanggal Acara</th>
                    <th className="py-3.5 px-4">Waktu Tanda Tangan & IP</th>
                    <th className="py-3.5 px-4">Status SPK</th>
                    <th className="py-3.5 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredContracts.map((c) => {
                    const isSigned = !!c.signed_at;
                    const cleanPhone = (c.client_phone || "").replace(/[^0-9]/g, "");
                    const waUrl = cleanPhone ? `https://wa.me/${cleanPhone}` : "#";

                    return (
                      <tr key={c.id} className="hover:bg-gray-50/60 transition-colors">
                        {/* Nomor SPK */}
                        <td className="py-3 px-4">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 border border-gray-200/80 font-mono text-[11px] font-semibold text-luxury-charcoal">
                            <span>📄</span>
                            <span>{c.spk_number}</span>
                          </div>
                        </td>

                        {/* Klien & Kontak */}
                        <td className="py-3 px-4">
                          <div className="font-serif font-bold text-luxury-charcoal text-sm">
                            {c.client_name}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1 font-medium"
                            >
                              <span>💬</span>
                              <span>+{cleanPhone || c.client_phone}</span>
                            </a>
                          </div>
                          <div className="text-[11px] text-gray-400 truncate max-w-[200px] mt-0.5">
                            📍 {c.venue}
                          </div>
                        </td>

                        {/* Paket & Tanggal Acara */}
                        <td className="py-3 px-4">
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-luxury-rose-gold/10 text-luxury-rose-gold-dark border border-luxury-rose-gold/30">
                            {c.service_package}
                          </span>
                          <div className="text-[11px] text-gray-600 font-medium mt-1 flex items-center gap-1">
                            <span>📅</span>
                            <span>{c.event_date}</span>
                          </div>
                        </td>

                        {/* Waktu Tanda Tangan & IP */}
                        <td className="py-3 px-4">
                          {isSigned ? (
                            <div>
                              <div className="font-medium text-gray-800 text-[11px]">
                                {new Date(c.signed_at!).toLocaleString("id-ID", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }) + " WIB"}
                              </div>
                              <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                                IP: {c.signed_ip || "127.0.0.1"}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400 italic text-[11px]">Belum ditandatangani</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4">
                          {isSigned ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span>✓</span>
                              <span>Sah Ditandatangani</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              <span>⏳</span>
                              <span>Menunggu TTD</span>
                            </span>
                          )}
                        </td>

                        {/* Aksi */}
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedContract(c)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-luxury-rose-gold-dark bg-luxury-rose-gold/10 hover:bg-luxury-rose-gold hover:text-white rounded-xl transition-all border border-luxury-rose-gold/30 cursor-pointer shadow-2xs"
                          >
                            <span>👁️</span>
                            <span>Lihat SPK Sah</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredContracts.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 px-4 text-center text-gray-400">
                        <div className="text-3xl mb-2">📂</div>
                        <div className="font-medium text-sm text-gray-600">Belum ada arsip SPK yang cocok</div>
                        <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                          Saat customer mengisi dan menandatangani SPK di portal booking atau admin menyetujui reservasi, dokumen akan langsung terarsip di sini secara otomatis.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: PENGATURAN DEFAULT T&C SPK (SYARAT & KETENTUAN)     */}
      {/* ========================================================= */}
      {activeTab === "tnc" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Notification Alert */}
          {tncSuccessMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl flex items-center gap-3 text-xs shadow-xs animate-in slide-in-from-top duration-200">
              <span className="text-base">✅</span>
              <div className="flex-1 font-medium">{tncSuccessMsg}</div>
              <button
                type="button"
                onClick={() => setTncSuccessMsg(null)}
                className="text-emerald-600 hover:text-emerald-900 text-sm font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {/* Info Card */}
          <div className="bg-gradient-to-r from-luxury-rose-gold/10 via-luxury-cream/30 to-white p-5 rounded-2xl border border-luxury-rose-gold/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-lg">⚖️</span>
                <h2 className="font-serif font-bold text-luxury-charcoal text-base">
                  Klausul Syarat & Ketentuan (T&C) Resmi Studio
                </h2>
              </div>
              <p className="text-xs text-gray-600 max-w-2xl leading-relaxed">
                Teks yang Anda edit dan simpan di sini akan otomatis menjadi <strong>klausul SPK digital resmi</strong> yang dimuat pada portal reservasi setiap klien (<code className="text-luxury-rose-gold-dark font-mono font-semibold">/booking/[token]</code>). Klien wajib membaca dan menyetujui pasal-pasal ini sebelum menandatangani SPK.
              </p>
            </div>

            {tncUpdatedAt && (
              <div className="text-left sm:text-right text-[11px] text-gray-500 font-mono shrink-0 bg-white/80 px-3 py-1.5 rounded-xl border border-gray-200/60">
                <span className="text-gray-400 block text-[9px] uppercase font-sans">Terakhir Disimpan:</span>
                <span className="font-semibold text-gray-700">
                  {new Date(tncUpdatedAt).toLocaleString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })} WIB
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Editor Area (Left 7 Columns) */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-base">✍️</span>
                  <h3 className="font-serif font-bold text-luxury-charcoal text-sm">
                    Editor Klausul T&C SPK
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleResetDefaultTnc}
                  className="text-[11px] font-semibold text-gray-500 hover:text-luxury-rose-gold-dark hover:underline flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span>↺</span>
                  <span>Reset ke Standar Studio</span>
                </button>
              </div>

              {/* Title Field */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Judul Dokumen Syarat & Ketentuan:
                </label>
                <input
                  type="text"
                  value={tncTitle}
                  onChange={(e) => setTncTitle(e.target.value)}
                  placeholder="Contoh: Syarat & Ketentuan Standar SPK Digital Jenni Khoe MUA"
                  className="w-full px-3.5 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-luxury-rose-gold focus:border-luxury-rose-gold bg-gray-50/50 font-medium text-luxury-charcoal"
                />
              </div>

              {/* Content Textarea */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-gray-700">
                    Isi Pasal & Klausul Perjanjian:
                  </label>
                  <span className="text-[10px] font-mono text-gray-400">
                    {tncContent.length} karakter • {tncContent.split("\n").length} baris
                  </span>
                </div>
                <textarea
                  rows={16}
                  value={tncContent}
                  onChange={(e) => setTncContent(e.target.value)}
                  placeholder="Tulis klausul dan syarat ketentuan SPK di sini..."
                  className="w-full p-4 text-xs font-mono leading-relaxed border border-gray-200 rounded-2xl focus:outline-none focus:ring-1 focus:ring-luxury-rose-gold focus:border-luxury-rose-gold bg-gray-50/40 text-gray-800 resize-y"
                ></textarea>
                <p className="text-[10px] text-gray-400 mt-1 italic">
                  Tip: Anda dapat menuliskan penomoran pasal (1, 2, 3...) atau paragraf sesuai standar hukum layanan studio Anda. Strict no-price policy tetap berlaku.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={fetchTnc}
                  disabled={tncLoading || tncSaving}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                >
                  Batal / Reload
                </button>

                <button
                  type="button"
                  onClick={handleSaveTnc}
                  disabled={tncSaving || !tncContent.trim()}
                  className="px-6 py-2 text-xs font-semibold text-white bg-gradient-to-r from-luxury-rose-gold to-luxury-charcoal hover:opacity-95 rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {tncSaving ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <span>💾</span>
                      <span>Simpan & Terapkan ke Klien</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Live Client Preview (Right 5 Columns) */}
            <div className="lg:col-span-5 bg-gradient-to-b from-luxury-cream/30 to-white rounded-3xl p-6 border border-gray-200/80 shadow-xs space-y-4 flex flex-col">
              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-base">📱</span>
                  <h3 className="font-serif font-bold text-luxury-charcoal text-sm">
                    Pratinjau Tampilan Klien (Live)
                  </h3>
                </div>
                <span className="text-[10px] font-semibold text-luxury-rose-gold-dark uppercase tracking-wider bg-luxury-rose-gold/10 px-2 py-0.5 rounded-full border border-luxury-rose-gold/30">
                  Realtime
                </span>
              </div>

              <div className="text-[11px] text-gray-500 leading-relaxed">
                Berikut adalah simulasi visual bagaimana klausul T&C ini tampil pada layar handphone/browser customer saat membuka link SPK:
              </div>

              {/* Simulated Client Box */}
              <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-2xs space-y-3 flex-1 flex flex-col justify-between overflow-hidden">
                <div>
                  <div className="text-center pb-2.5 mb-2.5 border-b border-gray-100">
                    <div className="text-[9px] font-mono uppercase tracking-widest text-luxury-rose-gold font-bold">
                      SURAT PERJANJIAN KERJA (SPK) DIGITAL
                    </div>
                    <div className="font-serif font-bold text-xs text-luxury-charcoal mt-0.5">
                      {tncTitle || "Syarat & Ketentuan SPK Jenni Khoe MUA"}
                    </div>
                  </div>

                  {/* Scrollable Clauses */}
                  <div className="max-h-64 overflow-y-auto p-3 bg-gray-50/70 rounded-xl border border-gray-100 text-[10px] text-gray-700 font-sans leading-relaxed whitespace-pre-line">
                    {tncContent || "(Belum ada klausul ditulis)"}
                  </div>
                </div>

                {/* Simulated Agreement Checkbox */}
                <div className="pt-3 border-t border-gray-100 space-y-2">
                  <div className="flex items-start gap-2 bg-luxury-cream/40 p-2.5 rounded-xl border border-luxury-rose-gold/20 text-[10px] text-gray-700">
                    <input
                      type="checkbox"
                      checked={true}
                      readOnly
                      className="mt-0.5 text-luxury-rose-gold rounded cursor-default"
                    />
                    <span className="leading-tight">
                      Saya telah membaca, memahami, dan menyetujui seluruh klausul SPK resmi Jenni Khoe MUA di atas secara sadar tanpa paksaan.
                    </span>
                  </div>

                  {/* Simulated Signature Canvas */}
                  <div className="h-14 border border-dashed border-gray-300 rounded-xl flex items-center justify-center text-[10px] text-gray-400 bg-white">
                    <span>✍️ Area Tanda Tangan Digital Klien</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL VIEW DIGITAL SPK & TANDA TANGAN                     */}
      {/* ========================================================= */}
      {selectedContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto no-print">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-luxury-cream/60 via-white to-luxury-cream/40 no-print">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">📜</span>
                <div>
                  <h3 className="font-serif font-bold text-luxury-charcoal text-base">
                    Dokumen Surat Perjanjian Kerja (SPK) Sah
                  </h3>
                  <p className="text-[11px] font-mono text-luxury-rose-gold font-semibold">
                    {selectedContract.spk_number}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-3 py-1.5 text-xs font-semibold text-luxury-charcoal bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  <span>🖨️</span>
                  <span>Cetak / Simpan PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedContract(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 text-sm transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Printable Document Body */}
            <div id="printable-spk" className="p-8 overflow-y-auto space-y-6 text-xs text-luxury-charcoal leading-relaxed bg-white">
              {/* Studio Letterhead */}
              <div className="text-center border-b-2 border-luxury-charcoal pb-4 mb-4">
                <h2 className="font-serif text-2xl font-bold tracking-widest text-luxury-charcoal uppercase">
                  Jenni Khoe Makeup Artist
                </h2>
                <p className="text-[11px] text-gray-500 font-sans tracking-wide mt-0.5">
                  Luxury Bridal & Special Occasion Makeup Studio • Jakarta, Indonesia
                </p>
                <div className="mt-3 inline-block px-4 py-1 rounded-full bg-luxury-rose-gold/10 text-luxury-rose-gold-dark font-serif font-semibold text-xs border border-luxury-rose-gold/30 uppercase tracking-widest">
                  Surat Perjanjian Kerja (SPK) Layanan Rias Pengantin
                </div>
              </div>

              {/* SPK Metadata Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 p-3.5 rounded-xl border border-gray-200/80 font-mono text-[11px]">
                <div>
                  <span className="text-gray-400 block text-[9px] uppercase tracking-wider font-sans">Nomor Dokumen</span>
                  <span className="font-bold text-luxury-charcoal">{selectedContract.spk_number}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[9px] uppercase tracking-wider font-sans">Status Dokumen</span>
                  <span className="font-bold text-emerald-700">
                    {selectedContract.signed_at ? "✓ SAH TERVERIFIKASI" : "DRAFT PENDING"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[9px] uppercase tracking-wider font-sans">Waktu Persetujuan</span>
                  <span className="font-bold text-gray-700">
                    {selectedContract.signed_at
                      ? new Date(selectedContract.signed_at).toLocaleString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }) + " WIB"
                      : "-"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[9px] uppercase tracking-wider font-sans">Audit Digital IP</span>
                  <span className="font-bold text-gray-700">{selectedContract.signed_ip || "127.0.0.1"}</span>
                </div>
              </div>

              {/* Rincian Pihak & Acara */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded-2xl p-4 bg-gray-50/40">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-luxury-rose-gold-dark mb-2">
                    Data Klien (Pihak Kedua)
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Nama Lengkap:</span>
                      <span className="font-bold text-gray-800">{selectedContract.client_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">WhatsApp:</span>
                      <span className="font-semibold text-gray-800">+{selectedContract.client_phone.replace(/[^0-9]/g, "")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Lokasi / Venue:</span>
                      <span className="font-medium text-gray-800">{selectedContract.venue}</span>
                    </div>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-2xl p-4 bg-gray-50/40">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-luxury-rose-gold-dark mb-2">
                    Rincian Layanan Studio (Pihak Pertama)
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Artist:</span>
                      <span className="font-bold text-gray-800">Jenni Khoe MUA Studio</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Paket Rias:</span>
                      <span className="font-bold text-luxury-rose-gold-dark">{selectedContract.service_package}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Tanggal Acara:</span>
                      <span className="font-semibold text-gray-800">{selectedContract.event_date}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Klausul Resmi SPK - Disimpan dari Default T&C saat tanda tangan */}
              <div className="border border-gray-200 rounded-2xl p-5 bg-white space-y-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-luxury-charcoal pb-1 border-b border-gray-100">
                  Klausul Perjanjian & Ketentuan Pelaksanaan Layanan (T&C):
                </div>
                <div className="text-gray-600 text-[11px] leading-relaxed whitespace-pre-line font-sans">
                  {selectedContract.terms_content || tncContent || DEFAULT_STANDARD_TNC}
                </div>
              </div>

              {/* Area Tanda Tangan Digital Resmi */}
              <div className="border border-luxury-rose-gold/30 rounded-2xl p-6 bg-gradient-to-b from-luxury-cream/20 to-white">
                <div className="text-center font-serif text-sm font-bold text-luxury-charcoal mb-4">
                  Tanda Tangan & Persetujuan Dokumen Sah Secara Hukum
                </div>
                <div className="grid grid-cols-2 gap-8 text-center">
                  {/* Pihak Pertama */}
                  <div className="flex flex-col items-center justify-between h-40 border-r border-gray-200 pr-4">
                    <div className="text-[11px] text-gray-500 uppercase font-semibold">
                      Pihak Pertama (Studio MUA)
                    </div>
                    <div className="font-serif italic text-luxury-rose-gold-dark text-lg font-bold py-2">
                      Jenni Khoe
                      <span className="block text-[9px] not-italic text-emerald-600 font-sans font-medium mt-0.5">
                        ✓ Certified Official Artist
                      </span>
                    </div>
                    <div>
                      <div className="font-bold text-luxury-charcoal text-xs">JENNI KHOE MUA</div>
                      <div className="text-[10px] text-gray-400">Founder & Lead Artist</div>
                    </div>
                  </div>

                  {/* Pihak Kedua */}
                  <div className="flex flex-col items-center justify-between h-40 pl-4">
                    <div className="text-[11px] text-gray-500 uppercase font-semibold">
                      Pihak Kedua (Klien Reservasi)
                    </div>
                    {selectedContract.client_signature_data ? (
                      <div className="py-1">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={selectedContract.client_signature_data}
                          alt="Tanda Tangan Klien"
                          className="h-16 max-w-full object-contain mx-auto mix-blend-multiply"
                        />
                        <span className="block text-[9px] text-emerald-600 font-medium">
                          ✓ Ditandatangani Digital Resmi
                        </span>
                      </div>
                    ) : (
                      <div className="h-16 flex items-center justify-center text-gray-400 italic text-[11px]">
                        (Belum menandatangani)
                      </div>
                    )}
                    <div>
                      <div className="font-bold text-luxury-charcoal text-xs">
                        {selectedContract.client_name}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        {selectedContract.signed_at
                          ? new Date(selectedContract.signed_at).toLocaleString("id-ID") + " WIB"
                          : "Menunggu TTD"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Watermark Footer */}
              <div className="text-center text-[10px] text-gray-400 pt-3 border-t border-gray-100">
                Dokumen ini merupakan arsip digital legal Jenni Khoe Makeup Artist dan terlindungi enkripsi sistem.
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-2 bg-gray-50 no-print">
              <button
                type="button"
                onClick={() => setSelectedContract(null)}
                className="px-5 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Tutup Dokumen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
