"use client";

import { useState, useEffect, useMemo } from "react";

interface Payment {
  id: number;
  booking_id: number;
  deal_id: number | null;
  client_name: string;
  client_phone: string;
  client_email: string;
  service_package: string;
  event_date: string;
  spk_number: string | null;
  payment_method: string;
  payment_channel: string;
  amount: number;
  fee: number;
  status: "settled" | "pending" | "failed" | "refund";
  paid_at: string | null;
  transaction_id: string;
  created_at: string;
}

const METHOD_OPTIONS = [
  { value: "transfer", label: "Transfer BCA", icon: "🏦", channel: "BCA Transfer" },
  { value: "qris", label: "QRIS / E-Wallet", icon: "📱", channel: "QRIS Instant" },
  { value: "kartu_kredit", label: "Kartu Kredit", icon: "💳", channel: "Kartu Kredit" },
  { value: "va", label: "Virtual Account", icon: "🏧", channel: "Mandiri/BCA VA" },
];

export default function AdminPayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [copiedTrx, setCopiedTrx] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/payments");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setPayments(json.data);
      }
    } catch (err) {
      console.error("Fetch payments error:", err);
      showToast("Gagal memuat data pembayaran");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleSyncAll = async () => {
    try {
      setSyncing(true);
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync_all" }),
      });
      const json = await res.json();
      if (json.success) {
        await fetchPayments();
        showToast("✅ Sinkronisasi seluruh metode & status pembayaran berhasil!");
      } else {
        showToast(json.message || "Gagal sinkronisasi");
      }
    } catch (err) {
      console.error("Sync error:", err);
      showToast("Terjadi kesalahan saat sinkronisasi");
    } finally {
      setSyncing(false);
    }
  };

  // Change payment status (settled <-> pending / failed)
  const handleUpdateStatus = async (
    payment: Payment,
    newStatus: "settled" | "pending" | "failed" | "refund"
  ) => {
    try {
      setUpdatingId(payment.id);
      const res = await fetch("/api/payments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: payment.id,
          status: newStatus,
          payment_method: payment.payment_method,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setPayments((prev) =>
          prev.map((p) =>
            p.id === payment.id
              ? {
                  ...p,
                  status: newStatus,
                  paid_at: newStatus === "settled" ? new Date().toISOString() : null,
                }
              : p
          )
        );
        showToast(
          newStatus === "settled"
            ? `✅ Pembayaran ${payment.client_name} diverifikasi LUNAS & disinkronkan ke Bookings!`
            : `Status pembayaran ${payment.client_name} diubah menjadi ${newStatus}.`
        );
      } else {
        alert(json.message || "Gagal mengubah status");
      }
    } catch (err) {
      console.error("Update payment status error:", err);
      showToast("Gagal mengupdate status pembayaran");
    } finally {
      setUpdatingId(null);
    }
  };

  // Change payment method
  const handleUpdateMethod = async (payment: Payment, newMethod: string) => {
    try {
      setUpdatingId(payment.id);
      const res = await fetch("/api/payments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: payment.id,
          payment_method: newMethod,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setPayments((prev) =>
          prev.map((p) =>
            p.id === payment.id ? { ...p, payment_method: newMethod } : p
          )
        );
        showToast(
          `Metode pembayaran ${payment.client_name} diubah ke ${newMethod.toUpperCase()} & disinkronkan ke Bookings.`
        );
      } else {
        alert(json.message || "Gagal mengubah metode pembayaran");
      }
    } catch (err) {
      console.error("Update method error:", err);
      showToast("Gagal mengupdate metode pembayaran");
    } finally {
      setUpdatingId(null);
    }
  };

  const copyTrxId = (trxId: string) => {
    navigator.clipboard.writeText(trxId);
    setCopiedTrx(trxId);
    setTimeout(() => setCopiedTrx(null), 2000);
  };

  // Statistics calculation
  const stats = useMemo(() => {
    let totalSettledAmount = 0;
    let settledCount = 0;
    let totalPendingAmount = 0;
    let pendingCount = 0;
    const methodCounts: Record<string, number> = {};

    payments.forEach((p) => {
      const amt = Number(p.amount) || 0;
      if (p.status === "settled") {
        totalSettledAmount += amt;
        settledCount++;
      } else if (p.status === "pending") {
        totalPendingAmount += amt;
        pendingCount++;
      }

      const m = (p.payment_method || "transfer").toLowerCase();
      methodCounts[m] = (methodCounts[m] || 0) + 1;
    });

    let topMethod = "-";
    let topCount = 0;
    Object.entries(methodCounts).forEach(([k, v]) => {
      if (v > topCount) {
        topCount = v;
        topMethod = k;
      }
    });

    return {
      totalCount: payments.length,
      totalSettledAmount,
      settledCount,
      totalPendingAmount,
      pendingCount,
      topMethod,
    };
  }, [payments]);

  // Filtered payments list
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        p.client_name.toLowerCase().includes(q) ||
        (p.spk_number && p.spk_number.toLowerCase().includes(q)) ||
        p.transaction_id.toLowerCase().includes(q) ||
        p.service_package.toLowerCase().includes(q) ||
        p.client_phone.includes(q);

      const matchStatus =
        statusFilter === "all" || p.status === statusFilter;

      const normMethod = (p.payment_method || "transfer").toLowerCase();
      const matchMethod =
        methodFilter === "all" || normMethod === methodFilter;

      return matchSearch && matchStatus && matchMethod;
    });
  }, [payments, search, statusFilter, methodFilter]);

  const getWhatsAppLink = (p: Payment) => {
    const phoneClean = (p.client_phone || "").replace(/[^0-9]/g, "");
    if (!phoneClean) return null;

    const spk = p.spk_number || `Booking #${p.booking_id}`;
    const amountStr = `Rp ${Number(p.amount).toLocaleString("id-ID")}`;
    const methodStr =
      p.payment_method === "transfer"
        ? "Transfer Bank BCA"
        : p.payment_method === "qris"
        ? "QRIS"
        : p.payment_method === "kartu_kredit"
        ? "Kartu Kredit"
        : p.payment_method.toUpperCase();

    let text = "";
    if (p.status === "settled") {
      text = `Halo Kak ${p.client_name}, terima kasih! Pembayaran uang muka riasan Jenni Khoe MUA (${spk}) sebesar ${amountStr} via ${methodStr} telah berhasil terverifikasi di sistem resmi kami. Jadwal tanggal ${p.event_date} telah terkunci aman.`;
    } else {
      text = `Halo Kak ${p.client_name}, kami dari tim Jenni Khoe MUA mengonfirmasi terkait pembayaran riasan (${spk}) sebesar ${amountStr} melalui ${methodStr}. Apabila ada kendala transfer, silakan kabari kami ya.`;
    }

    return `https://wa.me/${phoneClean.startsWith("0") ? "62" + phoneClean.slice(1) : phoneClean}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-gray-900 text-white text-xs px-4 py-3 rounded-xl shadow-2xl border border-gray-700 flex items-center gap-2 animate-fade-in">
          <span>✨</span>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif text-luxury-charcoal font-medium">
            Payment Reconciliation & Settlement
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Audit trail transaksi & sinkronisasi metode serta status pembayaran real-time dengan Bookings dan Deals.
          </p>
        </div>

        <button
          onClick={handleSyncAll}
          disabled={syncing}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium bg-luxury-gold/10 text-luxury-gold hover:bg-luxury-gold/20 border border-luxury-gold/30 transition disabled:opacity-50"
        >
          <span className={syncing ? "animate-spin" : ""}>🔄</span>
          <span>{syncing ? "Menyinkronkan..." : "Sinkronkan Data Booking"}</span>
        </button>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Settled */}
        <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-800 uppercase tracking-wider">
              ✅ Total Lunas (Settled)
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              {stats.settledCount} Transaksi
            </span>
          </div>
          <p className="text-2xl font-bold text-emerald-900 mt-2">
            Rp {stats.totalSettledAmount.toLocaleString("id-ID")}
          </p>
          <p className="text-[11px] text-emerald-600 mt-1">
            Dana masuk terverifikasi ke rekening/gateway
          </p>
        </div>

        {/* Pending */}
        <div className="bg-white rounded-2xl p-5 border border-amber-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-800 uppercase tracking-wider">
              ⏳ Menunggu Pembayaran
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              {stats.pendingCount} Transaksi
            </span>
          </div>
          <p className="text-2xl font-bold text-amber-900 mt-2">
            Rp {stats.totalPendingAmount.toLocaleString("id-ID")}
          </p>
          <p className="text-[11px] text-amber-600 mt-1">
            Menunggu transfer atau konfirmasi gateway
          </p>
        </div>

        {/* Total Transaksi */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              📊 Total Entri Pembayaran
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
              Ledger
            </span>
          </div>
          <p className="text-2xl font-bold text-luxury-charcoal mt-2">
            {stats.totalCount}
          </p>
          <p className="text-[11px] text-gray-400 mt-1">
            Tersinkronisasi otomatis dengan Bookings
          </p>
        </div>

        {/* Top Channel */}
        <div className="bg-white rounded-2xl p-5 border border-purple-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-purple-800 uppercase tracking-wider">
              🏦 Saluran Terpopuler
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
              Metode
            </span>
          </div>
          <p className="text-2xl font-bold text-purple-950 mt-2 capitalize">
            {stats.topMethod === "transfer"
              ? "BCA Transfer"
              : stats.topMethod === "qris"
              ? "QRIS Instant"
              : stats.topMethod === "kartu_kredit"
              ? "Kartu Kredit"
              : stats.topMethod}
          </p>
          <p className="text-[11px] text-purple-600 mt-1">
            Pilihan utama klien pada checkout
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="w-full md:w-80 relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama klien, SPK, TRX ID..."
            className="w-full text-xs pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-luxury-gold focus:ring-1 focus:ring-luxury-gold/30"
          />
          <span className="absolute left-3 top-3 text-gray-400 text-xs">🔍</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-luxury-gold"
          >
            <option value="all">Semua Status</option>
            <option value="settled">✅ Settled (Lunas)</option>
            <option value="pending">⏳ Pending (Menunggu)</option>
            <option value="failed">❌ Failed (Gagal)</option>
            <option value="refund">↩️ Refund</option>
          </select>

          {/* Method Filter */}
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-luxury-gold"
          >
            <option value="all">Semua Metode</option>
            <option value="transfer">🏦 Transfer BCA</option>
            <option value="qris">📱 QRIS / E-Wallet</option>
            <option value="kartu_kredit">💳 Kartu Kredit</option>
            <option value="va">🏧 Virtual Account</option>
          </select>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400 text-xs">
            <span className="animate-spin inline-block mr-2">🔄</span>
            Memuat audit trail pembayaran...
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-xs">
            <p className="text-gray-500 font-medium">Tidak ada data pembayaran yang cocok.</p>
            <button
              onClick={handleSyncAll}
              className="mt-3 text-luxury-gold underline hover:text-luxury-charcoal"
            >
              Klik untuk sinkronisasi dari database bookings
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70 text-gray-400 uppercase tracking-wider text-[10px]">
                  <th className="p-4">Klien & SPK</th>
                  <th className="p-4">Paket & Tanggal</th>
                  <th className="p-4">ID Transaksi</th>
                  <th className="p-4">Nominal</th>
                  <th className="p-4">Metode Pembayaran</th>
                  <th className="p-4">Status & Verifikasi</th>
                  <th className="p-4">Waktu Bayar</th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredPayments.map((p) => {
                  const isSettled = p.status === "settled";
                  const isUpdating = updatingId === p.id;
                  const waLink = getWhatsAppLink(p);
                  const normMethod = (p.payment_method || "transfer").toLowerCase();

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-gray-50/60 transition group text-gray-700"
                    >
                      {/* Klien & SPK */}
                      <td className="p-4">
                        <div className="font-semibold text-luxury-charcoal">
                          {p.client_name}
                        </div>
                        <div className="text-[11px] text-gray-400 mt-0.5">
                          {p.spk_number ? (
                            <span className="font-mono text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">
                              {p.spk_number}
                            </span>
                          ) : (
                            <span>Booking #{p.booking_id}</span>
                          )}
                        </div>
                        <div className="text-[10px] text-gray-400 mt-0.5">
                          {p.client_phone}
                        </div>
                      </td>

                      {/* Paket & Tanggal */}
                      <td className="p-4">
                        <div className="text-gray-800 font-medium line-clamp-1">
                          {p.service_package}
                        </div>
                        <div className="text-[11px] text-gray-400 mt-0.5">
                          📅 {p.event_date}
                        </div>
                      </td>

                      {/* ID Transaksi */}
                      <td className="p-4 font-mono">
                        <button
                          onClick={() => copyTrxId(p.transaction_id)}
                          title="Klik untuk menyalin TRX ID"
                          className="inline-flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded text-[11px] transition"
                        >
                          <span>{p.transaction_id}</span>
                          <span className="text-[10px] opacity-60">
                            {copiedTrx === p.transaction_id ? "✓" : "📋"}
                          </span>
                        </button>
                      </td>

                      {/* Nominal */}
                      <td className="p-4 font-semibold text-gray-900">
                        Rp {Number(p.amount).toLocaleString("id-ID")}
                      </td>

                      {/* Metode Pembayaran (Dropdown interaktif sync) */}
                      <td className="p-4">
                        <select
                          disabled={isUpdating}
                          value={normMethod}
                          onChange={(e) => handleUpdateMethod(p, e.target.value)}
                          className="text-xs py-1 px-2 rounded-lg border border-gray-200 bg-white font-medium text-gray-700 hover:border-luxury-gold focus:outline-none focus:border-luxury-gold transition cursor-pointer"
                        >
                          {METHOD_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.icon} {opt.label}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Status & Verifikasi */}
                      <td className="p-4">
                        <div className="flex flex-col gap-1.5 items-start">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                              isSettled
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : p.status === "pending"
                                ? "bg-amber-50 text-amber-800 border-amber-200"
                                : "bg-red-50 text-red-800 border-red-200"
                            }`}
                          >
                            {isSettled
                              ? "✅ Settled (Lunas)"
                              : p.status === "pending"
                              ? "⏳ Menunggu Bayar"
                              : "❌ Gagal"}
                          </span>

                          {/* Quick Toggle Status */}
                          <button
                            disabled={isUpdating}
                            onClick={() =>
                              handleUpdateStatus(
                                p,
                                isSettled ? "pending" : "settled"
                              )
                            }
                            className={`text-[10px] px-2 py-0.5 rounded border transition disabled:opacity-50 ${
                              isSettled
                                ? "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                                : "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 shadow-sm"
                            }`}
                          >
                            {isUpdating
                              ? "Menyinkronkan..."
                              : isSettled
                              ? "Batal Lunas"
                              : "✓ Tandai Lunas"}
                          </button>
                        </div>
                      </td>

                      {/* Waktu Pembayaran */}
                      <td className="p-4 text-[11px] text-gray-500">
                        {p.paid_at ? (
                          <div>
                            <div className="text-gray-800 font-medium">
                              {new Date(p.paid_at).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </div>
                            <div className="text-[10px] text-gray-400">
                              {new Date(p.paid_at).toLocaleTimeString("id-ID", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}{" "}
                              WIB
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>

                      {/* Aksi (WhatsApp) */}
                      <td className="p-4 text-right">
                        {waLink ? (
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 font-medium transition text-[11px]"
                            title="Kirim pesan konfirmasi WA"
                          >
                            <span>💬</span>
                            <span>WA</span>
                          </a>
                        ) : (
                          <span className="text-gray-300 text-[10px]">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
