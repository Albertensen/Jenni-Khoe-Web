"use client";

import { useState, useEffect, useMemo } from "react";

interface DealCustomer {
  id: number;
  lead_id: number | null;
  name: string;
  phone: string;
  email: string | null;
  deal_date: string | null;
  deal_time: string | null;
  venue: string | null;
  service_package: string;
  booking_token: string;
  status: string;
  spk_number: string | null;
  terms_accepted: boolean;
  client_signature: string | null;
  signed_at: string | null;
  payment_method: string | null;
  payment_status: string;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; badgeClass: string; icon: string }> = {
  draft: {
    label: "Draft (Belum Kirim)",
    badgeClass: "bg-gray-100 text-gray-700 border-gray-200",
    icon: "📝",
  },
  form_sent: {
    label: "Form Terkirim via WA",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
    icon: "📤",
  },
  form_submitted: {
    label: "Biodata Terisi",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
    icon: "📋",
  },
  spk_signed: {
    label: "SPK Ditandatangani",
    badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold",
    icon: "✍️",
  },
  dp_paid: {
    label: "DP Lunas (Deal Closed)",
    badgeClass: "bg-teal-50 text-teal-800 border-teal-200 font-bold",
    icon: "💰",
  },
};

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
    label: "QRIS",
    badgeClass: "bg-purple-50 text-purple-800 border-purple-200 font-semibold",
    icon: "📱",
  },
  kartu_kredit: {
    label: "Kartu Kredit",
    badgeClass: "bg-indigo-50 text-indigo-800 border-indigo-200 font-semibold",
    icon: "💳",
  },
};

export default function AdminDealsPage() {
  const [deals, setDeals] = useState<DealCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [savingId, setSavingId] = useState<number | null>(null);
  const [savedSuccessId, setSavedSuccessId] = useState<number | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [selectedSpkDeal, setSelectedSpkDeal] = useState<DealCustomer | null>(null);
  const [confirmingPaymentId, setConfirmingPaymentId] = useState<number | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Local state for inline date/time editing
  const [editForms, setEditForms] = useState<Record<number, { date: string; time: string }>>({});

  const fetchDeals = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/deals");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setDeals(json.data);
        // Initialize editable inputs
        const initialEdits: Record<number, { date: string; time: string }> = {};
        json.data.forEach((d: DealCustomer) => {
          initialEdits[d.id] = {
            date: d.deal_date ? d.deal_date.slice(0, 10) : "",
            time: d.deal_time || "06:00 WIB",
          };
        });
        setEditForms(initialEdits);
      }
    } catch (err) {
      console.error("Gagal mengambil data deal:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeals();
  }, []);

  const handleFieldChange = (id: number, field: "date" | "time", value: string) => {
    setEditForms((prev) => {
      const current = prev[id] || { date: "", time: "" };
      return {
        ...prev,
        [id]: {
          date: field === "date" ? value : current.date,
          time: field === "time" ? value : current.time,
        },
      };
    });
  };

  const handleSaveSchedule = async (deal: DealCustomer) => {
    const edit = editForms[deal.id];
    if (!edit) return;

    try {
      setSavingId(deal.id);
      const res = await fetch("/api/deals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: deal.id,
          deal_date: edit.date || null,
          deal_time: edit.time || null,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setDeals((prev) =>
          prev.map((d) =>
            d.id === deal.id
              ? { ...d, deal_date: edit.date || null, deal_time: edit.time || null }
              : d
          )
        );
        setSavedSuccessId(deal.id);
        setTimeout(() => setSavedSuccessId(null), 2500);
      } else {
        alert(json.message || "Gagal menyimpan jadwal deal");
      }
    } catch (err) {
      console.error("Error saving deal schedule:", err);
    } finally {
      setSavingId(null);
    }
  };

  const handleConfirmDealPayment = async (
    deal: DealCustomer,
    newStatus: "confirmed" | "belum_bayar"
  ) => {
    try {
      setConfirmingPaymentId(deal.id);
      const res = await fetch("/api/deals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: deal.id,
          payment_status: newStatus,
          status: newStatus === "confirmed" ? "dp_paid" : "spk_signed",
        }),
      });
      const json = await res.json();
      if (json.success) {
        setDeals((prev) =>
          prev.map((d) =>
            d.id === deal.id
              ? {
                  ...d,
                  payment_status: newStatus,
                  status: newStatus === "confirmed" ? "dp_paid" : "spk_signed",
                }
              : d
          )
        );
        const msg =
          newStatus === "confirmed"
            ? `Dana DP klien ${deal.name} terkonfirmasi lunas!`
            : `Status pembayaran klien ${deal.name} dikembalikan ke belum bayar.`;
        setToastMsg(msg);
        setTimeout(() => setToastMsg(null), 3500);
      } else {
        alert(json.message || "Gagal mengubah status pembayaran");
      }
    } catch (err) {
      console.error("Error confirming deal payment:", err);
    } finally {
      setConfirmingPaymentId(null);
    }
  };

  const copyBookingLink = (token: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://jenni-khoe-mua.vercel.app";
    const fullUrl = `${origin}/booking/${token}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleSendFormViaWhatsApp = async (deal: DealCustomer) => {
    const cleanPhone = deal.phone.replace(/[^0-9]/g, "");
    const origin = typeof window !== "undefined" ? window.location.origin : "https://jenni-khoe-mua.vercel.app";
    const formUrl = `${origin}/booking/${deal.booking_token}`;

    const dateDisplay = deal.deal_date
      ? new Date(deal.deal_date).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "Sesuai kesepakatan";
    const timeDisplay = deal.deal_time || "Sesuai kesepakatan";

    const message = `Halo Kak ${deal.name}, terima kasih atas kepercayaannya pada Jenni Khoe MUA! ✨\n\nJadwal riasan hari bahagia Kakak telah kami kunci di sistem:\n📅 Tanggal Acara: ${dateDisplay}\n⏰ Jam Mulai Rias: ${timeDisplay}\n\nMohon lengkapi formulir detail reservasi dan tandatangani Surat Perjanjian Kerja (SPK) digital resmi melalui tautan aman di bawah ini:\n👉 ${formUrl}\n\nSetelah SPK ditandatangani, Kakak dapat langsung menyelesaikan pembayaran DP untuk validasi slot eksklusif. Terima kasih! 🙏`;

    const waLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

    // Update status to 'form_sent' if currently 'draft'
    if (deal.status === "draft") {
      try {
        await fetch("/api/deals", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: deal.id, status: "form_sent" }),
        });
        setDeals((prev) =>
          prev.map((d) => (d.id === deal.id ? { ...d, status: "form_sent" } : d))
        );
      } catch (e) {
        console.error("Status update error:", e);
      }
    }

    window.open(waLink, "_blank");
  };

  const getFollowUpPaymentLink = (deal: DealCustomer) => {
    const cleanPhone = deal.phone.replace(/[^0-9]/g, "");
    const dateDisplay = deal.deal_date
      ? new Date(deal.deal_date).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "-";
    const spkNo = deal.spk_number || "SPK";
    const origin = typeof window !== "undefined" ? window.location.origin : "https://jenni-khoe-mua.vercel.app";
    const portalLink = `${origin}/booking/${deal.booking_token}`;

    const message = `Halo Kak ${deal.name}, terima kasih telah menandatangani SPK resmi (No: ${spkNo}) untuk tanggal ${dateDisplay}.\n\nKami menginfokan bahwa Kakak belum menyelesaikan pemilihan metode pembayaran uang muka (DP). Mohon buka kembali portal reservasi Kakak di:\n👉 ${portalLink}\n\nLalu pilih metode pembayaran (Transfer BCA, QRIS, atau Kartu Kredit) untuk mengunci slot tanggal riasan Kakak. Terima kasih! 🙏`;

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  const stats = useMemo(() => {
    const total = deals.length;
    const draft = deals.filter((d) => d.status === "draft").length;
    const sent = deals.filter((d) => d.status === "form_sent").length;
    const signed = deals.filter((d) => d.status === "spk_signed").length;
    const paid = deals.filter((d) => d.status === "dp_paid" || d.payment_status === "confirmed").length;
    return { total, draft, sent, signed, paid };
  }, [deals]);

  const filteredDeals = useMemo(() => {
    return deals.filter((deal) => {
      const matchSearch =
        search === "" ||
        deal.name.toLowerCase().includes(search.toLowerCase()) ||
        deal.phone.includes(search) ||
        (deal.venue && deal.venue.toLowerCase().includes(search.toLowerCase())) ||
        (deal.spk_number && deal.spk_number.toLowerCase().includes(search.toLowerCase()));

      const matchStatus = statusFilter === "all" || deal.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [deals, search, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-luxury-charcoal flex items-center gap-2">
            <span>🤝</span> Deal Customer & Penerbitan SPK
          </h2>
          <p className="text-xs text-luxury-deep-slate/70 mt-1">
            Kelola klien deal dari Prospek CS CRM. Kunci tanggal & jam deal, kirimkan tautan formulir reservasi resmi via WhatsApp, dan pantau tanda tangan SPK serta konfirmasi pembayaran DP.
          </p>
        </div>
        <button
          onClick={fetchDeals}
          disabled={loading}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-luxury-pearl border border-luxury-champagne/60 rounded-xl hover:bg-white text-luxury-charcoal transition-all shadow-2xs cursor-pointer"
        >
          <span>🔄</span>
          <span>{loading ? "Memperbarui..." : "Refresh Data"}</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
          <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Total Klien Deal</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-800">{stats.total}</span>
            <span className="text-[10px] text-gray-400">klien</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-100 bg-amber-50/20 shadow-xs">
          <p className="text-[11px] font-medium text-amber-800 uppercase tracking-wider">📝 Draft (Belum Kirim)</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-900">{stats.draft}</span>
            <span className="text-[10px] text-amber-700">perlu input jadwal</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-blue-100 bg-blue-50/20 shadow-xs">
          <p className="text-[11px] font-medium text-blue-800 uppercase tracking-wider">📤 Form Terkirim</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-blue-900">{stats.sent}</span>
            <span className="text-[10px] text-blue-700">menunggu respon</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-100 bg-emerald-50/20 shadow-xs">
          <p className="text-[11px] font-medium text-emerald-800 uppercase tracking-wider">✍️ SPK Ditandatangani</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-900">{stats.signed}</span>
            <span className="text-[10px] text-emerald-700">siap bayar DP</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-teal-100 bg-teal-50/20 shadow-xs col-span-2 sm:col-span-1">
          <p className="text-[11px] font-medium text-teal-800 uppercase tracking-wider">💰 DP Lunas</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-teal-900">{stats.paid}</span>
            <span className="text-[10px] text-teal-700">booking sah 🔥</span>
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
            placeholder="Cari nama klien, WhatsApp, venue, atau no. SPK..."
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
            <option value="all">Semua Status Deal</option>
            <option value="draft">📝 Draft (Belum Kirim)</option>
            <option value="form_sent">📤 Form Terkirim via WA</option>
            <option value="form_submitted">📋 Biodata Terisi</option>
            <option value="spk_signed">✍️ SPK Ditandatangani</option>
            <option value="dp_paid">💰 DP Lunas</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100 text-gray-500 font-medium">
                <th className="py-3.5 px-4">Calon Pengantin & WA</th>
                <th className="py-3.5 px-4">Tanggal & Jam Deal (Terkunci untuk Klien)</th>
                <th className="py-3.5 px-4">Lokasi / Venue Acara</th>
                <th className="py-3.5 px-4">Status, SPK & Pembayaran</th>
                <th className="py-3.5 px-4 text-center">Aksi Booking & Verifikasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredDeals.map((deal) => {
                const statusInfo = STATUS_CONFIG[deal.status] || {
                  label: deal.status,
                  badgeClass: "bg-gray-100 text-gray-700 border-gray-200",
                  icon: "⚪",
                };

                const edit = editForms[deal.id] || { date: "", time: "" };
                const isSaving = savingId === deal.id;
                const isSaved = savedSuccessId === deal.id;
                const isConfirming = confirmingPaymentId === deal.id;

                const isConfirmed = deal.payment_status === "confirmed" || deal.status === "dp_paid";
                const methodConfig =
                  PAYMENT_METHOD_CONFIG[deal.payment_method || "belum_bayar"] ||
                  PAYMENT_METHOD_CONFIG.belum_bayar || {
                    label: "Belum Bayar",
                    badgeClass: "bg-red-50 text-red-700 border-red-200 font-semibold",
                    icon: "❌",
                  };

                return (
                  <tr key={deal.id} className="hover:bg-gray-50/70 transition-colors">
                    {/* Calon Pengantin */}
                    <td className="py-3.5 px-4 align-top">
                      <p className="font-semibold text-luxury-charcoal text-sm">{deal.name}</p>
                      <p className="font-mono text-gray-600 font-medium mt-1">{deal.phone}</p>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 mt-1.5 rounded-md text-[10px] font-medium bg-luxury-champagne-light/50 text-luxury-charcoal border border-luxury-champagne/60">
                        {deal.service_package || "Bridal Exclusive"}
                      </span>
                    </td>

                    {/* Tanggal & Jam Deal (Admin Input yang Mengunci Form Customer) */}
                    <td className="py-3.5 px-4 align-top min-w-[260px]">
                      <div className="bg-gray-50/80 p-2.5 rounded-xl border border-gray-200 space-y-2">
                        <div>
                          <label className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider block mb-1">
                            📅 Tanggal Deal
                          </label>
                          <input
                            type="date"
                            value={edit.date}
                            onChange={(e) => handleFieldChange(deal.id, "date", e.target.value)}
                            className="w-full text-xs font-medium px-2 py-1.5 rounded-lg border border-gray-300 bg-white focus:outline-none focus:border-luxury-rose-gold text-gray-800"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider block mb-1">
                            ⏰ Jam Deal / Standby
                          </label>
                          <input
                            type="text"
                            placeholder="Contoh: 06:00 WIB"
                            value={edit.time}
                            onChange={(e) => handleFieldChange(deal.id, "time", e.target.value)}
                            className="w-full text-xs font-medium px-2 py-1.5 rounded-lg border border-gray-300 bg-white focus:outline-none focus:border-luxury-rose-gold text-gray-800"
                          />
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <button
                            type="button"
                            onClick={() => handleSaveSchedule(deal)}
                            disabled={isSaving}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-luxury-charcoal text-white hover:bg-black transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <span>💾</span>
                            <span>{isSaving ? "Menyimpan..." : "Kunci Jadwal"}</span>
                          </button>

                          {isSaved && (
                            <span className="text-[11px] font-semibold text-emerald-600 animate-pulse flex items-center gap-1">
                              <span>✓</span> Tersimpan!
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Lokasi / Venue Acara */}
                    <td className="py-3.5 px-4 align-top max-w-xs">
                      {deal.venue ? (
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-gray-800 flex items-center gap-1">
                            <span>📍</span> {deal.venue}
                          </p>
                          <p className="text-[10px] text-emerald-600 font-medium">✓ Terisi oleh klien</p>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs italic">
                          Menunggu pengisian form oleh klien...
                        </span>
                      )}
                    </td>

                    {/* Status & SPK & Pembayaran */}
                    <td className="py-3.5 px-4 align-top whitespace-nowrap">
                      <div className="space-y-2">
                        {/* Status Deal */}
                        <div>
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] border ${statusInfo.badgeClass}`}
                          >
                            <span>{statusInfo.icon}</span>
                            <span>{statusInfo.label}</span>
                          </span>
                        </div>

                        {/* SPK Info */}
                        {deal.spk_number && (
                          <div className="space-y-0.5">
                            <p className="text-[11px] font-mono text-luxury-charcoal font-semibold">
                              No: {deal.spk_number}
                            </p>
                            {deal.client_signature && (
                              <button
                                type="button"
                                onClick={() => setSelectedSpkDeal(deal)}
                                className="text-[11px] text-luxury-rose-gold font-medium hover:underline block cursor-pointer"
                              >
                                📄 Lihat Tanda Tangan SPK ↗
                              </button>
                            )}
                          </div>
                        )}

                        {/* Status Pembayaran */}
                        {deal.terms_accepted && (
                          <div className="pt-1">
                            {isConfirmed ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                                <span>✅</span> Dana Masuk (Lunas)
                              </span>
                            ) : deal.payment_method && deal.payment_method !== "belum_bayar" ? (
                              <div className="space-y-0.5">
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] border ${methodConfig.badgeClass}`}
                                >
                                  <span>{methodConfig.icon}</span>
                                  <span>{methodConfig.label}</span>
                                </span>
                                <p className="text-[9px] text-amber-700 font-medium">
                                  ⏳ Menunggu Verifikasi Admin
                                </p>
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] bg-red-50 text-red-700 border border-red-200 font-semibold">
                                <span>❌</span> Belum Bayar DP
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Aksi Booking & WA */}
                    <td className="py-3.5 px-4 align-top text-center whitespace-nowrap">
                      <div className="flex flex-col gap-1.5 items-stretch min-w-[155px]">
                        {/* Tombol Confirm Dana Masuk jika sudah SPK & belum confirmed */}
                        {deal.terms_accepted && !isConfirmed && (
                          <button
                            type="button"
                            onClick={() => handleConfirmDealPayment(deal, "confirmed")}
                            disabled={isConfirming}
                            className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-all shadow-xs hover:shadow-md cursor-pointer disabled:opacity-50"
                            title="Konfirmasi bahwa bukti pembayaran telah dicek dan dana benar telah masuk"
                          >
                            <span>✓</span>
                            <span>{isConfirming ? "Menyimpan..." : "Confirm Dana Masuk"}</span>
                          </button>
                        )}

                        {/* Jika belum bayar dan sudah SPK -> Tombol Follow Up WA */}
                        {deal.terms_accepted && !isConfirmed && (!deal.payment_method || deal.payment_method === "belum_bayar") && (
                          <a
                            href={getFollowUpPaymentLink(deal)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs transition-all shadow-2xs cursor-pointer"
                            title="Follow up customer via WhatsApp agar segera memilih metode bayar DP"
                          >
                            <span>📱</span>
                            <span>Follow Up WA (Belum Bayar)</span>
                          </a>
                        )}

                        {/* Kirim Form WA */}
                        <button
                          type="button"
                          onClick={() => handleSendFormViaWhatsApp(deal)}
                          className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs transition-all shadow-2xs hover:shadow-xs cursor-pointer"
                          title="Kirimkan link formulir reservasi resmi via WhatsApp ke customer"
                        >
                          <span>📱</span>
                          <span>Kirim Form via WA</span>
                        </button>

                        <div className="flex items-center gap-1">
                          <a
                            href={`/booking/${deal.booking_token}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-medium text-[11px] transition-colors"
                            title="Pratinjau formulir booking yang dilihat klien"
                          >
                            <span>🔗</span>
                            <span>Buka Form</span>
                          </a>

                          <button
                            type="button"
                            onClick={() => copyBookingLink(deal.booking_token)}
                            className="px-2 py-1 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 text-[11px] font-medium transition-colors cursor-pointer"
                            title="Salin tautan form booking"
                          >
                            {copiedToken === deal.booking_token ? "✓" : "📋"}
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredDeals.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400">
                    <p className="text-sm font-medium">Belum ada Deal Customer</p>
                    <p className="text-xs mt-1">
                      Klik tombol "Jadikan Deal" pada prospek di menu{" "}
                      <a href="/admin/ai-leads" className="text-luxury-rose-gold underline font-medium">
                        Prospek CS CRM
                      </a>{" "}
                      untuk memindahkan klien ke sini.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal View Digital SPK & Signature */}
      {selectedSpkDeal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 animate-fade-in space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-serif font-bold text-luxury-charcoal text-base">
                  Surat Perjanjian Kerja (SPK) Sah
                </h3>
                <p className="text-xs text-gray-500 font-mono">{selectedSpkDeal.spk_number || "SPK-JKM"}</p>
              </div>
              <button
                onClick={() => setSelectedSpkDeal(null)}
                className="text-gray-400 hover:text-gray-800 text-sm font-semibold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs text-gray-700 bg-gray-50 p-4 rounded-xl border border-gray-100">
              <p>
                <strong>Pihak Klien:</strong> {selectedSpkDeal.name} ({selectedSpkDeal.phone})
              </p>
              <p>
                <strong>Jadwal Acara:</strong> {selectedSpkDeal.deal_date || "-"} jam{" "}
                {selectedSpkDeal.deal_time || "-"}
              </p>
              <p>
                <strong>Lokasi Venue:</strong> {selectedSpkDeal.venue || "-"}
              </p>
              <p>
                <strong>Waktu Tanda Tangan:</strong>{" "}
                {selectedSpkDeal.signed_at
                  ? new Date(selectedSpkDeal.signed_at).toLocaleString("id-ID") + " WIB"
                  : "-"}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-700 mb-2">
                Tanda Tangan Digital Klien:
              </p>
              <div className="border border-gray-200 rounded-xl p-3 bg-white flex items-center justify-center min-h-[140px]">
                {selectedSpkDeal.client_signature ? (
                  <img
                    src={selectedSpkDeal.client_signature}
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
                onClick={() => setSelectedSpkDeal(null)}
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
