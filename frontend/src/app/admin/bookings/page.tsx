"use client";

import { useState, useEffect, useMemo } from "react";

interface Booking {
  id: number;
  deal_id: number | null;
  name: string;
  phone: string;
  email: string;
  event_date: string;
  service_package: string;
  total_amount: number;
  dp_amount: number;
  status: string;
  spk_number: string | null;
  payment_method: string;
  payment_status: string;
  booking_token: string | null;
  client_signature: string | null;
  signed_at: string | null;
  venue: string;
  created_at: string;
}

const PAYMENT_METHOD_CONFIG: Record<string, { label: string; badgeClass: string; icon: string }> = {
  belum_bayar: {
    label: "Belum Bayar",
    badgeClass: "bg-red-50 text-red-700 border-red-200 font-semibold",
    icon: "❌",
  },
  transfer: {
    label: "Transfer BCA",
    badgeClass: "bg-blue-50 text-blue-800 border-blue-200 font-semibold",
    icon: "🏦",
  },
  qris: {
    label: "QRIS / E-Wallet",
    badgeClass: "bg-purple-50 text-purple-800 border-purple-200 font-semibold",
    icon: "📱",
  },
  kartu_kredit: {
    label: "Kartu Kredit",
    badgeClass: "bg-indigo-50 text-indigo-800 border-indigo-200 font-semibold",
    icon: "💳",
  },
};

export default function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [selectedSpkBooking, setSelectedSpkBooking] = useState<Booking | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/bookings");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setBookings(json.data);
      }
    } catch (err) {
      console.error("Gagal mengambil data booking:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleConfirmTransfer = async (b: Booking, newPaymentStatus: "confirmed" | "belum_bayar") => {
    try {
      setConfirmingId(b.id);
      const res = await fetch("/api/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: b.id,
          payment_status: newPaymentStatus,
          status: newPaymentStatus === "confirmed" ? "confirmed" : "down_payment",
        }),
      });
      const json = await res.json();
      if (json.success) {
        setBookings((prev) =>
          prev.map((item) =>
            item.id === b.id
              ? {
                  ...item,
                  payment_status: newPaymentStatus,
                  status: newPaymentStatus === "confirmed" ? "confirmed" : "down_payment",
                }
              : item
          )
        );
        const msg =
          newPaymentStatus === "confirmed"
            ? `Pembayaran transfer ${b.name} berhasil diverifikasi! Status menjadi Success.`
            : `Status pembayaran klien ${b.name} dikembalikan.`;
        setToastMsg(msg);
        setTimeout(() => setToastMsg(null), 3500);
      } else {
        alert(json.message || "Gagal mengubah status pembayaran");
      }
    } catch (err) {
      console.error("Confirm payment error:", err);
      alert("Terjadi kesalahan jaringan saat memproses konfirmasi transfer.");
    } finally {
      setConfirmingId(null);
    }
  };

  const getWhatsAppFollowUpLink = (b: Booking) => {
    const cleanPhone = b.phone.replace(/[^0-9]/g, "");
    const dateFormatted = b.event_date || "-";
    const spkNo = b.spk_number || "SPK-JKM";

    let message = "";
    const isSuccess = b.payment_status === "confirmed" || b.payment_status === "success";

    if (isSuccess) {
      const origin = typeof window !== "undefined" ? window.location.origin : "https://jenni-khoe-mua.vercel.app";
      message = `Halo Kak ${b.name}, terima kasih! Pembayaran uang muka (DP) riasan Jenni Khoe MUA untuk tanggal ${dateFormatted} telah kami verifikasi (No. SPK: ${spkNo}). Jadwal riasan Kakak telah resmi terkunci sah.\n\nBerikut tautan dokumen resmi Anda (PDF):\n🧾 Invoice: ${origin}/invoice/${b.id}\n📜 SPK Digital: ${origin}/spk/${b.id}\n\nSampai jumpa di hari bahagia Kakak! ✨`;
    } else if (b.payment_method === "transfer") {
      message = `Halo Kak ${b.name}, terima kasih telah menandatangani SPK digital resmi Jenni Khoe MUA (No: ${spkNo}) untuk tanggal ${dateFormatted}.\n\nKami melihat Kakak telah memilih metode Transfer Bank BCA. Apakah bukti transfer sudah dapat dilampirkan agar jadwal dapat langsung kami validasi dana masuknya? Terima kasih! 🙏`;
    } else if (b.payment_method === "qris") {
      message = `Halo Kak ${b.name}, terima kasih telah menandatangani SPK digital resmi Jenni Khoe MUA (No: ${spkNo}) untuk tanggal ${dateFormatted}.\n\nApakah ada kendala saat melakukan scan pembayaran QRIS? Jika butuh bantuan kami siap membantu Kak. Terima kasih! 🙏`;
    } else if (b.payment_method === "kartu_kredit") {
      message = `Halo Kak ${b.name}, terima kasih telah menandatangani SPK digital resmi Jenni Khoe MUA (No: ${spkNo}) untuk tanggal ${dateFormatted}.\n\nBerikut kami siap bantu untuk proses pembayaran kartu kredit Kakak. Apakah ada kendala pada halaman pembayaran? Terima kasih! 🙏`;
    } else {
      const origin = typeof window !== "undefined" ? window.location.origin : "https://jenni-khoe-mua.vercel.app";
      const portalLink = b.booking_token ? `${origin}/booking/${b.booking_token}` : "";
      message = `Halo Kak ${b.name}, terima kasih telah menandatangani SPK digital resmi Jenni Khoe MUA (No: ${spkNo}) untuk tanggal ${dateFormatted}.\n\nKami menginfokan bahwa Kakak belum menyelesaikan pemilihan metode pembayaran uang muka (DP). Mohon buka kembali portal reservasi Kakak di:\n👉 ${portalLink}\n\nLalu pilih metode pembayaran (Transfer BCA, QRIS, atau Kartu Kredit) untuk mengunci slot tanggal riasan Kakak. Terima kasih! 🙏`;
    }

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  const stats = useMemo(() => {
    const total = bookings.length;
    const belumBayar = bookings.filter(
      (b) =>
        (b.payment_status === "belum_bayar" || !b.payment_status) &&
        (b.payment_method === "belum_bayar" || !b.payment_method)
    ).length;
    const menungguTransfer = bookings.filter(
      (b) =>
        b.payment_method === "transfer" &&
        b.payment_status !== "confirmed" &&
        b.payment_status !== "success"
    ).length;
    const gatewayPending = bookings.filter(
      (b) =>
        (b.payment_method === "qris" || b.payment_method === "kartu_kredit") &&
        b.payment_status !== "confirmed" &&
        b.payment_status !== "success"
    ).length;
    const successCount = bookings.filter(
      (b) => b.payment_status === "confirmed" || b.payment_status === "success"
    ).length;

    return { total, belumBayar, menungguTransfer, gatewayPending, successCount };
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const matchSearch =
        search === "" ||
        b.name.toLowerCase().includes(search.toLowerCase()) ||
        b.phone.includes(search) ||
        (b.venue && b.venue.toLowerCase().includes(search.toLowerCase())) ||
        (b.spk_number && b.spk_number.toLowerCase().includes(search.toLowerCase()));

      const isSuccess = b.payment_status === "confirmed" || b.payment_status === "success";

      let matchFilter = true;
      if (statusFilter === "belum_bayar") {
        matchFilter = !isSuccess && (b.payment_method === "belum_bayar" || !b.payment_method);
      } else if (statusFilter === "transfer_pending") {
        matchFilter = !isSuccess && b.payment_method === "transfer";
      } else if (statusFilter === "gateway_pending") {
        matchFilter = !isSuccess && (b.payment_method === "qris" || b.payment_method === "kartu_kredit");
      } else if (statusFilter === "success") {
        matchFilter = isSuccess;
      }

      return matchSearch && matchFilter;
    });
  }, [bookings, search, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-luxury-charcoal flex items-center gap-2">
            <span>📅</span> Bookings & Verifikasi Pembayaran DP
          </h2>
          <p className="text-xs text-luxury-deep-slate/70 mt-1">
            Data reservasi sah klien yang telah menyetujui SPK digital. Konfirmasi pembayaran manual khusus Transfer Bank BCA, sedangkan QRIS dan Kartu Kredit otomatis berstatus Success melalui integrasi payment gateway.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchBookings}
          disabled={loading}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-luxury-pearl border border-luxury-champagne/60 rounded-xl hover:bg-white text-luxury-charcoal transition-all shadow-2xs cursor-pointer"
        >
          <span>🔄</span>
          <span>{loading ? "Memperbarui..." : "Refresh Bookings"}</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
          <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Total Reservasi</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-800">{stats.total}</span>
            <span className="text-[10px] text-gray-400">booking</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-red-100 bg-red-50/20 shadow-xs">
          <p className="text-[11px] font-medium text-red-800 uppercase tracking-wider">❌ Belum Bayar</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-red-900">{stats.belumBayar}</span>
            <span className="text-[10px] text-red-700">perlu follow up</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-blue-100 bg-blue-50/20 shadow-xs">
          <p className="text-[11px] font-medium text-blue-800 uppercase tracking-wider">🏦 Menunggu Transfer</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-blue-900">{stats.menungguTransfer}</span>
            <span className="text-[10px] text-blue-700">perlu cek mutasi</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-100 bg-emerald-50/20 shadow-xs">
          <p className="text-[11px] font-medium text-emerald-800 uppercase tracking-wider">✅ Success (Lunas)</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-900">{stats.successCount}</span>
            <span className="text-[10px] text-emerald-700">booking sah 🔥</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama klien, WhatsApp, venue, atau nomor SPK..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:outline-none focus:border-luxury-rose-gold transition-colors"
          />
          <span className="absolute left-3 top-2.5 text-xs text-gray-400">🔍</span>
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-gray-200 rounded-xl bg-white text-gray-700 focus:outline-none focus:border-luxury-rose-gold cursor-pointer"
          >
            <option value="all">Semua Status Pembayaran</option>
            <option value="belum_bayar">❌ Belum Bayar (Perlu Follow Up)</option>
            <option value="transfer_pending">🏦 Transfer BCA (Perlu Konfirmasi Admin)</option>
            <option value="gateway_pending">📱 QRIS / CC (Gateway Otomatis)</option>
            <option value="success">✅ Success (Dana Terverifikasi)</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100 text-gray-500 font-medium">
                <th className="py-3.5 px-4">Calon Pengantin & Kontak</th>
                <th className="py-3.5 px-4">Jadwal & Lokasi Acara</th>
                <th className="py-3.5 px-4">SPK Digital</th>
                <th className="py-3.5 px-4">Metode & Status Pembayaran</th>
                <th className="py-3.5 px-4 text-center">Aksi Konfirmasi & WhatsApp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredBookings.map((b) => {
                const isSuccess = b.payment_status === "confirmed" || b.payment_status === "success";
                const isTransfer = b.payment_method === "transfer";
                const isBelumBayar =
                  !isSuccess && (b.payment_method === "belum_bayar" || !b.payment_method);
                const isGatewayMethod =
                  !isSuccess && (b.payment_method === "qris" || b.payment_method === "kartu_kredit");

                const methodConfig =
                  PAYMENT_METHOD_CONFIG[b.payment_method] ||
                  PAYMENT_METHOD_CONFIG.belum_bayar || {
                    label: "Belum Bayar",
                    badgeClass: "bg-red-50 text-red-700 border-red-200 font-semibold",
                    icon: "❌",
                  };

                const isConfirming = confirmingId === b.id;

                return (
                  <tr key={b.id} className="hover:bg-gray-50/70 transition-colors">
                    {/* Calon Pengantin */}
                    <td className="py-3.5 px-4 align-top">
                      <p className="font-semibold text-luxury-charcoal text-sm">{b.name}</p>
                      <p className="font-mono text-gray-600 font-medium mt-1">{b.phone}</p>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 mt-1.5 rounded-md text-[10px] font-medium bg-luxury-champagne-light/50 text-luxury-charcoal border border-luxury-champagne/60">
                        {b.service_package}
                      </span>
                    </td>

                    {/* Jadwal & Lokasi */}
                    <td className="py-3.5 px-4 align-top">
                      <p className="font-semibold text-gray-800 flex items-center gap-1">
                        <span>📅</span>
                        <span>{b.event_date}</span>
                      </p>
                      <p className="text-gray-600 mt-1 flex items-start gap-1">
                        <span>📍</span>
                        <span>{b.venue}</span>
                      </p>
                    </td>

                    {/* SPK Digital */}
                    <td className="py-3.5 px-4 align-top whitespace-nowrap">
                      {b.spk_number ? (
                        <div className="space-y-1">
                          <p className="font-mono text-luxury-charcoal font-semibold">
                            {b.spk_number}
                          </p>
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-medium">
                            ✓ SPK Ditandatangani
                          </span>
                          {b.client_signature && (
                            <button
                              type="button"
                              onClick={() => setSelectedSpkBooking(b)}
                              className="text-[11px] text-luxury-rose-gold font-medium hover:underline block cursor-pointer"
                            >
                              📄 Lihat Tanda Tangan ↗
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Belum ada SPK</span>
                      )}
                    </td>

                    {/* Status & Metode Pembayaran */}
                    <td className="py-3.5 px-4 align-top">
                      <div className="space-y-1.5">
                        {isSuccess ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                              <span>✅</span> Success
                            </span>
                            <p className="text-[10px] text-gray-600 font-medium">
                              {isTransfer
                                ? "Transfer BCA (Dikonfirmasi Admin)"
                                : b.payment_method === "qris"
                                ? "QRIS (Lunas via Gateway)"
                                : b.payment_method === "kartu_kredit"
                                ? "Kartu Kredit (Lunas via Gateway)"
                                : "Pembayaran Diterima"}
                            </p>
                          </div>
                        ) : isBelumBayar ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] bg-red-50 text-red-800 border border-red-200 font-bold">
                              <span>❌</span> Belum Bayar
                            </span>
                            <p className="text-[10px] text-red-600 font-medium">
                              Klien belum memilih metode
                            </p>
                          </div>
                        ) : isTransfer ? (
                          <div className="space-y-1">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] border ${methodConfig.badgeClass}`}
                            >
                              <span>{methodConfig.icon}</span>
                              <span>{methodConfig.label}</span>
                            </span>
                            <p className="text-[10px] text-amber-700 font-semibold flex items-center gap-1">
                              <span>⏳</span> Menunggu Cek Mutasi Bank Admin
                            </p>
                          </div>
                        ) : isGatewayMethod ? (
                          <div className="space-y-1">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] border ${methodConfig.badgeClass}`}
                            >
                              <span>{methodConfig.icon}</span>
                              <span>{methodConfig.label}</span>
                            </span>
                            <p className="text-[10px] text-purple-700 font-semibold flex items-center gap-1">
                              <span>⚡</span> Menunggu Webhook Gateway (Otomatis)
                            </p>
                          </div>
                        ) : null}
                      </div>
                    </td>

                    {/* Aksi Konfirmasi & WhatsApp */}
                    <td className="py-3.5 px-4 align-top text-center whitespace-nowrap">
                      <div className="flex flex-col gap-1.5 items-stretch min-w-[155px]">
                        {/* Ponytail: Tombol Konfirmasi HANYA MUNCUL JIKA TRANSFER dan BELUM SUCCESS */}
                        {!isSuccess && isTransfer && (
                          <button
                            type="button"
                            onClick={() => handleConfirmTransfer(b, "confirmed")}
                            disabled={isConfirming}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-all shadow-xs hover:shadow-md cursor-pointer disabled:opacity-50"
                            title="Klik jika admin sudah mengecek bukti transfer / mutasi bank dan dana benar-benar masuk"
                          >
                            <span>✓</span>
                            <span>{isConfirming ? "Menyimpan..." : "Confirm Dana Masuk"}</span>
                          </button>
                        )}

                        {/* Jika sudah Success via transfer -> Opsi Batal Verifikasi */}
                        {isSuccess && isTransfer && (
                          <div className="flex items-center justify-between gap-2 p-1.5 rounded-xl bg-emerald-50 border border-emerald-200">
                            <span className="text-[10px] text-emerald-800 font-semibold px-2">
                              ✓ Terverifikasi
                            </span>
                            <button
                              type="button"
                              onClick={() => handleConfirmTransfer(b, "belum_bayar")}
                              disabled={isConfirming}
                              className="text-[10px] text-gray-500 hover:text-red-600 underline cursor-pointer px-1"
                              title="Batalkan verifikasi jika terjadi salah klik"
                            >
                              Batal
                            </button>
                          </div>
                        )}

                        {/* Tombol Follow Up WhatsApp */}
                        <a
                          href={getWhatsAppFollowUpLink(b)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                            isBelumBayar
                              ? "bg-amber-600 hover:bg-amber-700 text-white shadow-2xs"
                              : "border border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
                          }`}
                          title="Kirim pesan WhatsApp ke klien"
                        >
                          <span>💬</span>
                          <span>
                            {isBelumBayar
                              ? "Follow Up WA (Belum Bayar)"
                              : isSuccess
                              ? "Kirim Bukti Sah WA"
                              : "Chat WA Klien"}
                          </span>
                        </a>

                        {/* Link Buka Portal Booking */}
                        {b.booking_token && (
                          <a
                            href={`/booking/${b.booking_token}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-1 text-[11px] text-luxury-rose-gold hover:underline pt-0.5"
                          >
                            <span>🔗</span>
                            <span>Buka Portal Klien ↗</span>
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredBookings.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400">
                    <p className="text-sm font-medium">Belum ada booking terdaftar</p>
                    <p className="text-xs mt-1">
                      Saat klien menandatangani SPK digital di portal reservasi, data akan langsung masuk ke sini secara otomatis.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal View Digital SPK & Signature */}
      {selectedSpkBooking && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 animate-fade-in space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-serif font-bold text-luxury-charcoal text-base">
                  Surat Perjanjian Kerja (SPK) Sah
                </h3>
                <p className="text-xs text-gray-500 font-mono">
                  {selectedSpkBooking.spk_number || "SPK-JKM"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSpkBooking(null)}
                className="text-gray-400 hover:text-gray-800 text-sm font-semibold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs text-gray-700 bg-gray-50 p-4 rounded-xl border border-gray-100">
              <p>
                <strong>Klien:</strong> {selectedSpkBooking.name} ({selectedSpkBooking.phone})
              </p>
              <p>
                <strong>Jadwal Acara:</strong> {selectedSpkBooking.event_date}
              </p>
              <p>
                <strong>Lokasi / Venue:</strong> {selectedSpkBooking.venue}
              </p>
              <p>
                <strong>Paket:</strong> {selectedSpkBooking.service_package}
              </p>
              <p>
                <strong>Waktu Tanda Tangan:</strong>{" "}
                {selectedSpkBooking.signed_at
                  ? new Date(selectedSpkBooking.signed_at).toLocaleString("id-ID") + " WIB"
                  : "-"}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-700 mb-2">
                Tanda Tangan Digital Klien:
              </p>
              <div className="border border-gray-200 rounded-xl p-3 bg-white flex items-center justify-center min-h-[140px]">
                {selectedSpkBooking.client_signature ? (
                  <img
                    src={selectedSpkBooking.client_signature}
                    alt="Tanda Tangan Digital Klien"
                    className="max-h-32 object-contain"
                  />
                ) : (
                  <p className="text-gray-400 italic text-xs">Belum ada tanda tangan</p>
                )}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedSpkBooking(null)}
                className="px-4 py-2 text-xs font-semibold bg-luxury-charcoal text-white rounded-xl hover:bg-black transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-luxury-charcoal text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 animate-fade-in border border-luxury-champagne/40">
          <span className="text-xl">🎉</span>
          <p className="text-xs font-semibold text-white">{toastMsg}</p>
          <button
            type="button"
            onClick={() => setToastMsg(null)}
            className="ml-3 text-gray-400 hover:text-white text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
