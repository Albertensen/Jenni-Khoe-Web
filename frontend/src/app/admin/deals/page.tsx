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
  source: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

const DEFAULT_PACKAGES = [
  "Bridal Makeup Exclusive",
  "Royal Wedding Experience",
  "Bridal Luxury Full Day",
  "Engagement Glow Session",
];

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
    label: "SPK Ditandatangani (Menuju Bayar)",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200 font-semibold",
    icon: "✍️",
  },
};

export default function AdminDealsPage() {
  const [deals, setDeals] = useState<DealCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Inline editing state for date, time, and service_package
  const [editForms, setEditForms] = useState<
    Record<number, { date: string; time: string; service_package: string; customPackage: string }>
  >({});
  const [savingId, setSavingId] = useState<number | null>(null);
  const [savedSuccessId, setSavedSuccessId] = useState<number | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Manual Add Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);
  const [manualForm, setManualForm] = useState({
    name: "",
    phone: "",
    deal_date: "",
    deal_time: "06:00 WIB",
    service_package: "Bridal Makeup Exclusive",
    custom_package: "",
    venue: "",
    admin_notes: "",
  });

  const fetchDeals = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/deals");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        // Ponytail: customer whose payment has succeeded is filtered out and only exists in Bookings
        const activeDeals = json.data.filter(
          (d: any) =>
            d.status !== "dp_paid" &&
            d.payment_status !== "confirmed" &&
            d.payment_status !== "success"
        );
        setDeals(activeDeals);

        const initialEdits: Record<
          number,
          { date: string; time: string; service_package: string; customPackage: string }
        > = {};
        activeDeals.forEach((d: DealCustomer) => {
          const isStandard = DEFAULT_PACKAGES.includes(d.service_package);
          initialEdits[d.id] = {
            date: d.deal_date ? d.deal_date.slice(0, 10) : "",
            time: d.deal_time || "06:00 WIB",
            service_package: isStandard ? d.service_package : "custom",
            customPackage: isStandard ? "" : d.service_package || "",
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

  const handleFieldChange = (
    id: number,
    field: "date" | "time" | "service_package" | "customPackage",
    value: string
  ) => {
    setEditForms((prev) => {
      const current = prev[id] || {
        date: "",
        time: "06:00 WIB",
        service_package: "Bridal Makeup Exclusive",
        customPackage: "",
      };
      return {
        ...prev,
        [id]: {
          ...current,
          [field]: value,
        },
      };
    });
  };

  const handleSaveScheduleAndPackage = async (deal: DealCustomer) => {
    const edit = editForms[deal.id];
    if (!edit) return;

    const resolvedPackage =
      edit.service_package === "custom"
        ? edit.customPackage.trim() || "Bridal Makeup Exclusive"
        : edit.service_package;

    try {
      setSavingId(deal.id);
      const res = await fetch("/api/deals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: deal.id,
          deal_date: edit.date || null,
          deal_time: edit.time || null,
          service_package: resolvedPackage,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setDeals((prev) =>
          prev.map((d) =>
            d.id === deal.id
              ? {
                  ...d,
                  deal_date: edit.date || null,
                  deal_time: edit.time || null,
                  service_package: resolvedPackage,
                }
              : d
          )
        );
        setSavedSuccessId(deal.id);
        setTimeout(() => setSavedSuccessId(null), 2500);
      } else {
        alert(json.message || "Gagal menyimpan jadwal dan paket deal");
      }
    } catch (err) {
      console.error("Error saving deal:", err);
    } finally {
      setSavingId(null);
    }
  };

  const handleCreateManualDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.name.trim() || !manualForm.phone.trim()) {
      alert("Nama dan Nomor WhatsApp wajib diisi");
      return;
    }

    const resolvedPackage =
      manualForm.service_package === "custom"
        ? manualForm.custom_package.trim() || "Bridal Makeup Exclusive"
        : manualForm.service_package;

    try {
      setIsSubmittingManual(true);
      const res = await fetch("/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: manualForm.name.trim(),
          phone: manualForm.phone.trim(),
          deal_date: manualForm.deal_date || null,
          deal_time: manualForm.deal_time || "06:00 WIB",
          service_package: resolvedPackage,
          venue: manualForm.venue.trim() || null,
          admin_notes: manualForm.admin_notes.trim() || null,
          source: "manual",
        }),
      });
      const json = await res.json();
      if (json.success) {
        setShowAddModal(false);
        setManualForm({
          name: "",
          phone: "",
          deal_date: "",
          deal_time: "06:00 WIB",
          service_package: "Bridal Makeup Exclusive",
          custom_package: "",
          venue: "",
          admin_notes: "",
        });
        setToastMsg(`Deal manual "${json.data.name}" berhasil dibuat!`);
        setTimeout(() => setToastMsg(null), 3500);
        fetchDeals();
      } else {
        alert(json.message || "Gagal menambahkan deal manual");
      }
    } catch (err) {
      console.error("Error creating manual deal:", err);
      alert("Terjadi kesalahan saat menambahkan deal manual");
    } finally {
      setIsSubmittingManual(false);
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
    const packageDisplay = deal.service_package || "Bridal Makeup Exclusive";

    const message = `Halo Kak ${deal.name}, terima kasih atas kepercayaannya pada Jenni Khoe MUA! ✨\n\nJadwal & paket riasan hari bahagia Kakak telah kami siapkan di sistem:\n📅 Tanggal Acara: ${dateDisplay}\n⏰ Jam Mulai Rias: ${timeDisplay}\n💄 Paket: ${packageDisplay}\n\nMohon lengkapi formulir detail reservasi dan tandatangani Surat Perjanjian Kerja (SPK) digital resmi melalui tautan aman di bawah ini:\n👉 ${formUrl}\n\nSetelah SPK ditandatangani, Kakak dapat langsung melanjutkan pembayaran DP untuk memvalidasi slot tanggal riasan Kakak. Terima kasih! 🙏`;

    const waLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

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

  const stats = useMemo(() => {
    const total = deals.length;
    const crmCount = deals.filter((d) => d.source === "crm" || d.lead_id !== null).length;
    const manualCount = deals.filter((d) => d.source === "manual" || !d.lead_id).length;
    const draft = deals.filter((d) => d.status === "draft").length;
    const sent = deals.filter((d) => d.status === "form_sent").length;
    return { total, crmCount, manualCount, draft, sent };
  }, [deals]);

  const filteredDeals = useMemo(() => {
    return deals.filter((deal) => {
      const matchSearch =
        search === "" ||
        deal.name.toLowerCase().includes(search.toLowerCase()) ||
        deal.phone.includes(search) ||
        (deal.venue && deal.venue.toLowerCase().includes(search.toLowerCase())) ||
        (deal.service_package && deal.service_package.toLowerCase().includes(search.toLowerCase()));

      let matchSource = true;
      if (sourceFilter === "crm") {
        matchSource = deal.source === "crm" || Boolean(deal.lead_id);
      } else if (sourceFilter === "manual") {
        matchSource = deal.source === "manual" || !deal.lead_id;
      }

      let matchStatus = true;
      if (statusFilter !== "all") {
        matchStatus = deal.status === statusFilter;
      }

      return matchSearch && matchSource && matchStatus;
    });
  }, [deals, search, sourceFilter, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-luxury-charcoal flex items-center gap-2">
            <span>🤝</span> Deal Customer Management
          </h2>
          <p className="text-xs text-luxury-deep-slate/70 mt-1">
            Kelola calon pengantin tahap deal (baik dari Prospek CS CRM maupun input manual WhatsApp admin). Kunci jadwal & sesuaikan paket makeup sebelum kirim formulir resmi. Setelah pembayaran klien sukses, customer otomatis berpindah ke Bookings.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold tracking-wide text-white rounded-xl bg-gradient-to-r from-luxury-rose-gold-dark to-luxury-rose-gold hover:from-[#8f4d57] hover:to-luxury-rose-gold-dark border border-luxury-rose-gold/40 shadow-xs hover:shadow-md active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span>Add Deal Manual</span>
          </button>

          <button
            type="button"
            onClick={fetchDeals}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-luxury-pearl border border-luxury-champagne/60 rounded-xl hover:bg-white text-luxury-charcoal transition-all shadow-2xs cursor-pointer"
          >
            <span>🔄</span>
            <span>{loading ? "Memperbarui..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
          <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Total Deal Aktif</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-800">{stats.total}</span>
            <span className="text-[10px] text-gray-400">klien dalam proses</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-purple-100 bg-purple-50/20 shadow-xs">
          <p className="text-[11px] font-medium text-purple-800 uppercase tracking-wider">🤖 Prospek CS CRM</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-purple-900">{stats.crmCount}</span>
            <span className="text-[10px] text-purple-700">dari website AI</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-100 bg-amber-50/20 shadow-xs">
          <p className="text-[11px] font-medium text-amber-800 uppercase tracking-wider">✍️ Manual by Admin</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-900">{stats.manualCount}</span>
            <span className="text-[10px] text-amber-700">klien WA luar web</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-blue-100 bg-blue-50/20 shadow-xs">
          <p className="text-[11px] font-medium text-blue-800 uppercase tracking-wider">📤 Form Terkirim</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-blue-900">{stats.sent}</span>
            <span className="text-[10px] text-blue-700">menunggu respon</span>
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
            placeholder="Cari nama klien, WhatsApp, venue, atau paket makeup..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:outline-none focus:border-luxury-rose-gold transition-colors"
          />
          <span className="absolute left-3 top-2.5 text-xs text-gray-400">🔍</span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Source Filter */}
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-gray-200 rounded-xl bg-white text-gray-700 focus:outline-none focus:border-luxury-rose-gold cursor-pointer"
          >
            <option value="all">Semua Sumber Klien</option>
            <option value="crm">🤖 Prospek CS CRM (Website)</option>
            <option value="manual">✍️ Manual by Admin (WA Luar)</option>
          </select>

          {/* Status Filter */}
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
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100 text-gray-500 font-medium">
                <th className="py-3.5 px-4">Calon Pengantin & Sumber</th>
                <th className="py-3.5 px-4 min-w-[320px]">
                  Jadwal & Paket Makeup (Dapat Diubah Admin)
                </th>
                <th className="py-3.5 px-4">Lokasi / Venue Acara</th>
                <th className="py-3.5 px-4 text-center">Aksi Formulir & WhatsApp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredDeals.map((deal) => {
                const isCrm = deal.source === "crm" || Boolean(deal.lead_id);
                const statusInfo = STATUS_CONFIG[deal.status] || {
                  label: deal.status,
                  badgeClass: "bg-gray-100 text-gray-700 border-gray-200",
                  icon: "⚪",
                };

                const edit = editForms[deal.id] || {
                  date: "",
                  time: "06:00 WIB",
                  service_package: "Bridal Makeup Exclusive",
                  customPackage: "",
                };
                const isSaving = savingId === deal.id;
                const isSaved = savedSuccessId === deal.id;

                return (
                  <tr key={deal.id} className="hover:bg-gray-50/70 transition-colors">
                    {/* Calon Pengantin & Sumber */}
                    <td className="py-3.5 px-4 align-top space-y-2">
                      <div>
                        <p className="font-semibold text-luxury-charcoal text-sm">{deal.name}</p>
                        <p className="font-mono text-gray-600 font-medium mt-0.5">{deal.phone}</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        {/* Source Badge */}
                        {isCrm ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-purple-50 text-purple-800 border border-purple-200">
                            <span>🤖</span>
                            <span>Prospek CS CRM</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                            <span>✍️</span>
                            <span>Manual by Admin</span>
                          </span>
                        )}

                        {/* Status Deal Badge */}
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] border ${statusInfo.badgeClass}`}
                        >
                          <span>{statusInfo.icon}</span>
                          <span>{statusInfo.label}</span>
                        </span>
                      </div>

                      {deal.admin_notes && (
                        <p className="text-[11px] text-gray-500 bg-gray-50 p-1.5 rounded-lg border border-gray-100">
                          💬 {deal.admin_notes}
                        </p>
                      )}
                    </td>

                    {/* Jadwal & Paket Makeup (Editable oleh Admin) */}
                    <td className="py-3.5 px-4 align-top">
                      <div className="bg-gray-50/80 p-3 rounded-xl border border-gray-200 space-y-2.5">
                        {/* Tanggal & Jam */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider block mb-1">
                              📅 Tanggal Acara
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
                              ⏰ Jam Standby
                            </label>
                            <input
                              type="text"
                              placeholder="06:00 WIB"
                              value={edit.time}
                              onChange={(e) => handleFieldChange(deal.id, "time", e.target.value)}
                              className="w-full text-xs font-medium px-2 py-1.5 rounded-lg border border-gray-300 bg-white focus:outline-none focus:border-luxury-rose-gold text-gray-800"
                            />
                          </div>
                        </div>

                        {/* Paket Makeup (Dropdown + Custom) */}
                        <div>
                          <label className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider block mb-1">
                            💄 Paket Makeup (Bisa Diubah Admin)
                          </label>
                          <select
                            value={edit.service_package}
                            onChange={(e) =>
                              handleFieldChange(deal.id, "service_package", e.target.value)
                            }
                            className="w-full text-xs font-medium px-2 py-1.5 rounded-lg border border-gray-300 bg-white focus:outline-none focus:border-luxury-rose-gold text-gray-800 cursor-pointer"
                          >
                            {DEFAULT_PACKAGES.map((pkg) => (
                              <option key={pkg} value={pkg}>
                                {pkg}
                              </option>
                            ))}
                            <option value="custom">-- Custom / Ketik Paket Khusus --</option>
                          </select>

                          {edit.service_package === "custom" && (
                            <input
                              type="text"
                              placeholder="Ketik nama paket riasan khusus..."
                              value={edit.customPackage}
                              onChange={(e) =>
                                handleFieldChange(deal.id, "customPackage", e.target.value)
                              }
                              className="mt-1.5 w-full text-xs px-2 py-1.5 rounded-lg border border-luxury-champagne bg-white text-gray-800 focus:outline-none focus:border-luxury-rose-gold"
                            />
                          )}
                        </div>

                        {/* Tombol Simpan */}
                        <div className="flex items-center justify-between pt-0.5">
                          <button
                            type="button"
                            onClick={() => handleSaveScheduleAndPackage(deal)}
                            disabled={isSaving}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-luxury-charcoal text-white hover:bg-black transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <span>💾</span>
                            <span>{isSaving ? "Menyimpan..." : "Kunci Jadwal & Paket"}</span>
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
                          <p className="text-[10px] text-emerald-600 font-medium">✓ Terdata</p>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs italic">
                          Menunggu pengisian form oleh klien...
                        </span>
                      )}
                    </td>

                    {/* Aksi Formulir & WhatsApp */}
                    <td className="py-3.5 px-4 align-top text-center whitespace-nowrap">
                      <div className="flex flex-col gap-1.5 items-stretch min-w-[155px]">
                        {/* Tombol Kirim Form WA */}
                        <button
                          type="button"
                          onClick={() => handleSendFormViaWhatsApp(deal)}
                          className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-all shadow-xs hover:shadow-md cursor-pointer"
                          title="Kirimkan link formulir reservasi resmi via WhatsApp ke calon pengantin"
                        >
                          <span>📱</span>
                          <span>Kirim Form via WA</span>
                        </button>

                        {/* Link Buka & Salin Form */}
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
                  <td colSpan={4} className="py-12 text-center text-gray-400">
                    <p className="text-sm font-medium">Tidak ada Deal Customer aktif</p>
                    <p className="text-xs mt-1">
                      Klik tombol <strong>"Add Deal Manual"</strong> di atas atau jadikan prospek dari menu{" "}
                      <a
                        href="/admin/ai-leads"
                        className="text-luxury-rose-gold underline font-medium"
                      >
                        Prospek CS CRM
                      </a>
                      . Klien yang telah lunas otomatis berpindah ke Bookings.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah Deal Manual oleh Admin */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 animate-fade-in space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-serif font-bold text-luxury-charcoal text-base flex items-center gap-1.5">
                  <span>✍️</span>
                  <span>Add Deal Manual</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Input customer yang datang langsung via WhatsApp pribadi / rekomendasi luar website.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-800 text-sm font-semibold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateManualDeal} className="space-y-3.5">
              {/* Nama & Nomor HP */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-gray-700 block mb-1">
                    Nama Calon Pengantin *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Jessica Melinda"
                    value={manualForm.name}
                    onChange={(e) => setManualForm({ ...manualForm, name: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-luxury-rose-gold"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-gray-700 block mb-1">
                    Nomor WhatsApp *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 081234567890"
                    value={manualForm.phone}
                    onChange={(e) => setManualForm({ ...manualForm, phone: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-luxury-rose-gold"
                  />
                </div>
              </div>

              {/* Tanggal & Jam Acara */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-gray-700 block mb-1">
                    Tanggal Acara
                  </label>
                  <input
                    type="date"
                    value={manualForm.deal_date}
                    onChange={(e) => setManualForm({ ...manualForm, deal_date: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-luxury-rose-gold"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-gray-700 block mb-1">
                    Jam Standby / Mulai Rias
                  </label>
                  <input
                    type="text"
                    placeholder="06:00 WIB"
                    value={manualForm.deal_time}
                    onChange={(e) => setManualForm({ ...manualForm, deal_time: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-luxury-rose-gold"
                  />
                </div>
              </div>

              {/* Paket Makeup */}
              <div>
                <label className="text-[11px] font-semibold text-gray-700 block mb-1">
                  Paket Makeup
                </label>
                <select
                  value={manualForm.service_package}
                  onChange={(e) =>
                    setManualForm({ ...manualForm, service_package: e.target.value })
                  }
                  className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-luxury-rose-gold cursor-pointer"
                >
                  {DEFAULT_PACKAGES.map((pkg) => (
                    <option key={pkg} value={pkg}>
                      {pkg}
                    </option>
                  ))}
                  <option value="custom">-- Custom / Paket Lainnya --</option>
                </select>

                {manualForm.service_package === "custom" && (
                  <input
                    type="text"
                    placeholder="Ketik nama paket khusus..."
                    value={manualForm.custom_package}
                    onChange={(e) =>
                      setManualForm({ ...manualForm, custom_package: e.target.value })
                    }
                    className="mt-2 w-full text-xs px-3 py-2 rounded-xl border border-luxury-champagne focus:outline-none focus:border-luxury-rose-gold"
                  />
                )}
              </div>

              {/* Lokasi / Venue */}
              <div>
                <label className="text-[11px] font-semibold text-gray-700 block mb-1">
                  Lokasi / Venue Acara (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Hotel Mulia Senayan, Jakarta"
                  value={manualForm.venue}
                  onChange={(e) => setManualForm({ ...manualForm, venue: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-luxury-rose-gold"
                />
              </div>

              {/* Catatan Admin */}
              <div>
                <label className="text-[11px] font-semibold text-gray-700 block mb-1">
                  Catatan Admin / Sumber Rekomendasi (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Klien direct WA via rekomendasi WO Jessica"
                  value={manualForm.admin_notes}
                  onChange={(e) => setManualForm({ ...manualForm, admin_notes: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-luxury-rose-gold"
                />
              </div>

              {/* Buttons */}
              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={isSubmittingManual}
                  className="px-6 py-2.5 text-xs font-semibold bg-gradient-to-r from-luxury-rose-gold-dark to-luxury-rose-gold hover:from-[#8f4d57] hover:to-luxury-rose-gold-dark text-white rounded-xl transition-all shadow-xs hover:shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingManual ? "Menyimpan..." : "Buat Deal Customer"}
                </button>
              </div>
            </form>
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
