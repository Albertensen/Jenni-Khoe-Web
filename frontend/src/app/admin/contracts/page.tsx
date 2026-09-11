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

export default function AdminContracts() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "signed" | "pending">("all");
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [refreshing, setRefreshing] = useState(false);

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

  useEffect(() => {
    fetchContracts();
  }, []);

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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-400 gap-3">
        <div className="w-8 h-8 border-2 border-luxury-rose-gold border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium">Memuat arsip SPK & kontrak digital...</p>
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">📄</span>
            <h1 className="text-2xl font-serif font-bold text-luxury-charcoal tracking-tight">
              SPK & Contract Archive
            </h1>
          </div>
          <p className="text-xs text-gray-500 mt-1 max-w-2xl">
            Arsip resmi Surat Perjanjian Kerja (SPK) digital yang sah dan mengikat hukum. Tersimpan otomatis saat klien menandatangani di booking form maupun melalui konfirmasi reservasi Bookings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchContracts}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:text-luxury-charcoal transition-all shadow-2xs cursor-pointer disabled:opacity-50"
          >
            <span className={refreshing ? "animate-spin" : ""}>🔄</span>
            <span>{refreshing ? "Memperbarui..." : "Refresh"}</span>
          </button>
        </div>
      </div>

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

        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto">
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
                            })} WIB
                          </div>
                          <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                            IP: {c.signed_ip}
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
                        <span>Lihat SPK & Tanda Tangan</span>
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

      {/* MODAL VIEW DIGITAL SPK & TANDA TANGAN */}
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

              {/* Klausul Resmi SPK */}
              <div className="border border-gray-200 rounded-2xl p-5 bg-white space-y-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-luxury-charcoal pb-1 border-b border-gray-100">
                  Klausul Perjanjian & Ketentuan Pelaksanaan Layanan:
                </div>
                <ol className="list-decimal pl-4 space-y-2 text-gray-600 text-[11px] leading-relaxed">
                  <li>
                    <strong>Penguncian Slot Tanggal & Uang Muka (DP 50%):</strong> Jadwal riasan dinyatakan sah terdaftar dalam kalender kerja Jenni Khoe MUA setelah penandatanganan SPK ini serta konfirmasi pelunasan uang muka (DP).
                  </li>
                  <li>
                    <strong>Waktu Pengerjaan & Ketepatan Jadwal:</strong> Klien wajib bersiap di lokasi minimal 15 menit sebelum waktu pengerjaan yang disepakati untuk menjamin kesempurnaan detail riasan bridal.
                  </li>
                  <li>
                    <strong>Pelunasan Pembayaran:</strong> Pelunasan sisa biaya rias wajib diselesaikan selambat-lambatnya pada H-7 sebelum tanggal pelaksanaan acara melalui metode pembayaran resmi studio.
                  </li>
                  <li>
                    <strong>Force Majeure & Pembatalan:</strong> Pembatalan sepihak oleh klien mengakibatkan uang muka (DP) tidak dapat dikembalikan (non-refundable) karena slot jadwal eksklusif telah dialokasikan khusus.
                  </li>
                </ol>
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
