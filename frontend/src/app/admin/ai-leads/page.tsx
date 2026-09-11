"use client";

import { useState, useEffect, useMemo } from "react";

interface AiLead {
  id: number;
  session_id: string;
  name: string;
  phone: string;
  email: string | null;
  interest: string;
  messages: number;
  closing_stage: string;
  schedule_date: string | null;
  schedule_venue: string | null;
  schedule_time: string | null;
  last_message: string | null;
  status: string;
  source: string;
  created_at: string;
  updated_at: string;
}

const STAGE_CONFIG: Record<string, { label: string; badgeClass: string; icon: string }> = {
  "Form Terisi (Lead Masuk)": {
    label: "Form Terisi (Lead Awal)",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
    icon: "🟡",
  },
  "Tanya Jawab Jadwal & Lokasi": {
    label: "Tanya Jadwal & Lokasi",
    badgeClass: "bg-sky-50 text-sky-700 border-sky-200",
    icon: "🔵",
  },
  "Mendapat Rekomendasi Paket & Pricelist": {
    label: "Dapat Pricelist & Paket",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
    icon: "🟣",
  },
  "Siap Booking / Menuju WhatsApp": {
    label: "Siap Booking / Hot Lead",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: "🟢",
  },
  "Konsultasi Konsep Riasan": {
    label: "Konsultasi Konsep",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
    icon: "💄",
  },
};

const SOURCE_CONFIG: Record<string, { label: string; badgeClass: string; icon: string }> = {
  chat_widget: {
    label: "Chat CS",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
    icon: "🤖",
  },
  cek_jadwal: {
    label: "Cek Tanggal",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: "🔍",
  },
  booking_cepat: {
    label: "Booking Cepat",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
    icon: "⚡",
  },
  kalender_tanggal: {
    label: "Kalender Slot",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
    icon: "📅",
  },
};

const STATUS_OPTIONS = [
  { value: "new", label: "Baru (New)", color: "text-blue-600 bg-blue-50 border-blue-200" },
  { value: "follow_up", label: "Prospek Ulang", color: "text-amber-600 bg-amber-50 border-amber-200" },
  { value: "quoted", label: "Sudah Ditawari", color: "text-purple-600 bg-purple-50 border-purple-200" },
  { value: "closed", label: "Deal (SPK Closed)", color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  { value: "lost", label: "Batal / Pasif", color: "text-gray-500 bg-gray-50 border-gray-200" },
];

export default function AiLeadsPage() {
  const [leads, setLeads] = useState<AiLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/ai-leads");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setLeads(json.data);
      }
    } catch (err) {
      console.error("Gagal mengambil data leads:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleUpdateStatus = async (leadId: number, newStatus: string) => {
    try {
      setUpdatingId(leadId);
      const res = await fetch("/api/ai-leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: leadId, status: newStatus }),
      });
      const json = await res.json();
      if (json.success) {
        setLeads((prev) =>
          prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
        );
      }
    } catch (err) {
      console.error("Gagal update status lead:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPhone(text);
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  const getWhatsAppFollowUpLink = (lead: AiLead) => {
    const cleanPhone = lead.phone.replace(/[^0-9]/g, "");
    let template = `Halo Kak ${lead.name}, saya Jenni Khoe MUA. Menyapa kembali terkait reservasi riasan Kakak di website resmi kami.`;

    if (lead.source === "booking_cepat") {
      template = `Halo Kak ${lead.name}, saya Jenni Khoe MUA. Terima kasih sudah mengisi formulir reservasi cepat di website kami${lead.interest ? ` (${lead.interest})` : ""}${lead.schedule_date ? ` untuk tanggal ${lead.schedule_date}` : ""}. Kami siap bantu cek ketersediaan slot privat dan siapkan draft invoice SPK-nya Kak.`;
    } else if (lead.source === "kalender_tanggal") {
      template = `Halo Kak ${lead.name}, saya Jenni Khoe MUA. Melanjutkan permintaan penguncian tanggal ${lead.schedule_date || "pilihan Kakak"} dari kalender website kami, slot saat ini masih aman. Apakah ingin langsung kami buatkan draft reservasi DP-nya Kak?`;
    } else if (lead.source === "cek_jadwal") {
      template = `Halo Kak ${lead.name}, saya Jenni Khoe MUA. Melanjutkan pengecekan ketersediaan tanggal ${lead.schedule_date || ""} di ${lead.schedule_venue || "lokasi acara Kakak"}, slot privat saat ini masih tersedia. Apakah jadwal tersebut ingin segera kita amankan Kak?`;
    } else if (lead.closing_stage === "Tanya Jawab Jadwal & Lokasi") {
      const details = [
        lead.schedule_date ? `tanggal ${lead.schedule_date}` : null,
        lead.schedule_venue ? `di ${lead.schedule_venue}` : null,
        lead.schedule_time ? `jam ${lead.schedule_time}` : null,
      ]
        .filter(Boolean)
        .join(" ");

      template = `Halo Kak ${lead.name}, saya Jenni Khoe MUA. Melanjutkan obrolan di website mengenai jadwal ${details || "acara Kakak"}, apakah jadwal tersebut ingin langsung kami hold dan konfirmasi slotnya Kak?`;
    } else if (lead.closing_stage === "Mendapat Rekomendasi Paket & Pricelist") {
      template = `Halo Kak ${lead.name}, saya Jenni Khoe MUA. Melanjutkan konsultasi paket riasan pengantin di website, apakah Kakak ingin kami buatkan penawaran invoice resmi atau ada konsep khusus yang ingin didiskusikan terlebih dahulu?`;
    } else if (lead.closing_stage === "Siap Booking / Menuju WhatsApp") {
      template = `Halo Kak ${lead.name}, saya Jenni Khoe MUA. Terima kasih atas ketertarikan Kakak! Kami siap membantu lock tanggal hari bahagia Kakak dan menyiapkan SPK resmi reservasi privat.`;
    } else if (lead.closing_stage === "Form Terisi (Lead Masuk)") {
      template = `Halo Kak ${lead.name}, saya Jenni Khoe MUA. Terima kasih telah menghubungi kami melalui website. Boleh tahu rencana tanggal dan lokasi acara pernikahan Kakak agar kami bantu cek jadwal kosongnya?`;
    }

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(template)}`;
  };

  // Funnel Counts
  const stats = useMemo(() => {
    const total = leads.length;
    const initial = leads.filter((l) => l.closing_stage === "Form Terisi (Lead Masuk)").length;
    const schedule = leads.filter((l) => l.closing_stage === "Tanya Jawab Jadwal & Lokasi").length;
    const pricelist = leads.filter((l) => l.closing_stage === "Mendapat Rekomendasi Paket & Pricelist").length;
    const ready = leads.filter((l) => l.closing_stage === "Siap Booking / Menuju WhatsApp").length;
    return { total, initial, schedule, pricelist, ready };
  }, [leads]);

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchSearch =
        search === "" ||
        lead.name.toLowerCase().includes(search.toLowerCase()) ||
        lead.phone.includes(search) ||
        (lead.schedule_venue && lead.schedule_venue.toLowerCase().includes(search.toLowerCase())) ||
        (lead.last_message && lead.last_message.toLowerCase().includes(search.toLowerCase()));

      const matchStage = stageFilter === "all" || lead.closing_stage === stageFilter;
      const matchStatus = statusFilter === "all" || lead.status === statusFilter;
      const matchSource = sourceFilter === "all" || lead.source === sourceFilter;

      return matchSearch && matchStage && matchStatus && matchSource;
    });
  }, [leads, search, stageFilter, statusFilter, sourceFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-luxury-charcoal">
            Prospek CS CRM & Pelacakan Closing
          </h2>
          <p className="text-xs text-luxury-deep-slate/70 mt-1">
            Pantau semua kontak klien dari Chat CS, Cek Tanggal, Booking Cepat, dan Kalender Slot untuk follow-up closing.
          </p>
        </div>
        <button
          onClick={fetchLeads}
          disabled={loading}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-luxury-pearl border border-luxury-champagne/60 rounded-xl hover:bg-white text-luxury-charcoal transition-all shadow-2xs cursor-pointer"
        >
          <span>🔄</span>
          <span>{loading ? "Memperbarui..." : "Refresh Data"}</span>
        </button>
      </div>

      {/* KPI Funnel Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
          <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Total Calon Klien</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-800">{stats.total}</span>
            <span className="text-[10px] text-gray-400">kontak</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-100 bg-amber-50/20 shadow-xs">
          <div className="flex items-center gap-1 text-[11px] font-medium text-amber-800 uppercase tracking-wider">
            <span>🟡</span> Form Terisi
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-900">{stats.initial}</span>
            <span className="text-[10px] text-amber-700">belum lanjut</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-sky-100 bg-sky-50/20 shadow-xs">
          <div className="flex items-center gap-1 text-[11px] font-medium text-sky-800 uppercase tracking-wider">
            <span>🔵</span> Tanya Jadwal
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-sky-900">{stats.schedule}</span>
            <span className="text-[10px] text-sky-700">cek tanggal</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-purple-100 bg-purple-50/20 shadow-xs">
          <div className="flex items-center gap-1 text-[11px] font-medium text-purple-800 uppercase tracking-wider">
            <span>🟣</span> Dapat Pricelist
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-purple-900">{stats.pricelist}</span>
            <span className="text-[10px] text-purple-700">tertarik paket</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-100 bg-emerald-50/20 shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-800 uppercase tracking-wider">
            <span>🟢</span> Siap Booking
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-900">{stats.ready}</span>
            <span className="text-[10px] text-emerald-700">hot leads 🔥</span>
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
            placeholder="Cari nama, WhatsApp, lokasi venue, atau isi chat..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:outline-none focus:border-luxury-rose-gold transition-colors"
          />
          <span className="absolute left-3 top-2.5 text-xs text-gray-400">🔍</span>
        </div>

        <div className="flex flex-wrap gap-2.5 items-center">
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-gray-200 rounded-xl bg-white text-gray-700 focus:outline-none focus:border-luxury-rose-gold cursor-pointer"
          >
            <option value="all">Semua Kanal Sumber</option>
            <option value="chat_widget">🤖 Chat CS</option>
            <option value="cek_jadwal">🔍 Cek Tanggal</option>
            <option value="booking_cepat">⚡ Booking Cepat</option>
            <option value="kalender_tanggal">📅 Kalender Slot</option>
          </select>

          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-gray-200 rounded-xl bg-white text-gray-700 focus:outline-none focus:border-luxury-rose-gold cursor-pointer"
          >
            <option value="all">Semua Tahap Closing</option>
            <option value="Form Terisi (Lead Masuk)">🟡 Form Terisi (Lead Awal)</option>
            <option value="Tanya Jawab Jadwal & Lokasi">🔵 Tanya Jadwal & Lokasi</option>
            <option value="Mendapat Rekomendasi Paket & Pricelist">🟣 Dapat Pricelist & Paket</option>
            <option value="Siap Booking / Menuju WhatsApp">🟢 Siap Booking / Hot Lead</option>
            <option value="Konsultasi Konsep Riasan">💄 Konsultasi Konsep</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-gray-200 rounded-xl bg-white text-gray-700 focus:outline-none focus:border-luxury-rose-gold cursor-pointer"
          >
            <option value="all">Semua Status Prospek</option>
            <option value="new">Baru (New)</option>
            <option value="follow_up">Prospek Ulang (Follow Up)</option>
            <option value="quoted">Sudah Ditawari (Quoted)</option>
            <option value="closed">Deal (SPK Closed)</option>
            <option value="lost">Batal / Pasif</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100 text-gray-500 font-medium">
                <th className="py-3.5 px-4">Waktu & Kanal</th>
                <th className="py-3.5 px-4">Calon Klien & WA</th>
                <th className="py-3.5 px-4">Tahap Closing Saat Ini</th>
                <th className="py-3.5 px-4">Detail Jadwal Terdata</th>
                <th className="py-3.5 px-4">Catatan / Pesan Terakhir</th>
                <th className="py-3.5 px-4">Status Prospek</th>
                <th className="py-3.5 px-4 text-center">Aksi Prospek</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredLeads.map((lead) => {
                const stageInfo = STAGE_CONFIG[lead.closing_stage] || {
                  label: lead.closing_stage,
                  badgeClass: "bg-gray-50 text-gray-700 border-gray-200",
                  icon: "⚪",
                };

                const sourceInfo = SOURCE_CONFIG[lead.source] || {
                  label: lead.source || "Web",
                  badgeClass: "bg-gray-100 text-gray-700 border-gray-200",
                  icon: "🌐",
                };

                const dateObj = new Date(lead.created_at);
                const dateStr = dateObj.toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                });
                const timeStr = dateObj.toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <tr key={lead.id} className="hover:bg-gray-50/70 transition-colors">
                    {/* Waktu & Kanal */}
                    <td className="py-3.5 px-4 align-top whitespace-nowrap">
                      <p className="font-medium text-gray-800">{dateStr}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{timeStr} WIB</p>
                      <span
                        className={`inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-md text-[10px] font-medium border ${sourceInfo.badgeClass}`}
                      >
                        <span>{sourceInfo.icon}</span>
                        <span>{sourceInfo.label}</span>
                      </span>
                    </td>

                    {/* Calon Klien & WA */}
                    <td className="py-3.5 px-4 align-top">
                      <p className="font-semibold text-luxury-charcoal text-sm">{lead.name}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="font-mono text-gray-600">{lead.phone}</span>
                        <button
                          onClick={() => copyToClipboard(lead.phone)}
                          title="Salin nomor WhatsApp"
                          className="text-gray-400 hover:text-gray-700 cursor-pointer p-0.5"
                        >
                          {copiedPhone === lead.phone ? "✓" : "📋"}
                        </button>
                      </div>
                    </td>

                    {/* Tahap Closing Saat Ini */}
                    <td className="py-3.5 px-4 align-top">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border ${stageInfo.badgeClass}`}
                      >
                        <span>{stageInfo.icon}</span>
                        <span>{stageInfo.label}</span>
                      </span>
                    </td>

                    {/* Detail Jadwal Terdata */}
                    <td className="py-3.5 px-4 align-top">
                      {lead.schedule_date || lead.schedule_venue || lead.schedule_time ? (
                        <div className="space-y-0.5 text-[11px]">
                          {lead.schedule_date && (
                            <p className="text-gray-800">
                              <span className="text-gray-400">Tgl:</span>{" "}
                              <span className="font-medium">{lead.schedule_date}</span>
                            </p>
                          )}
                          {lead.schedule_venue && (
                            <p className="text-gray-800">
                              <span className="text-gray-400">Lokasi:</span>{" "}
                              <span className="font-medium">{lead.schedule_venue}</span>
                            </p>
                          )}
                          {lead.schedule_time && (
                            <p className="text-gray-800">
                              <span className="text-gray-400">Jam:</span>{" "}
                              <span className="font-medium">{lead.schedule_time}</span>
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-300 text-[11px] italic">Belum terdata</span>
                      )}
                    </td>

                    {/* Pesan Terakhir */}
                    <td className="py-3.5 px-4 align-top max-w-xs">
                      {lead.last_message ? (
                        <p className="text-gray-600 text-[11px] line-clamp-2 leading-relaxed" title={lead.last_message}>
                          "{lead.last_message}"
                        </p>
                      ) : (
                        <span className="text-gray-300 text-[11px] italic">Belum ada pesan</span>
                      )}
                    </td>

                    {/* Status Prospek (Dropdown) */}
                    <td className="py-3.5 px-4 align-top">
                      <select
                        value={lead.status || "new"}
                        disabled={updatingId === lead.id}
                        onChange={(e) => handleUpdateStatus(lead.id, e.target.value)}
                        className="text-xs font-medium px-2 py-1 rounded-lg border border-gray-200 bg-white text-gray-700 focus:outline-none focus:border-luxury-rose-gold cursor-pointer"
                      >
                        {STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Aksi Prospek Follow Up */}
                    <td className="py-3.5 px-4 align-top text-center">
                      <a
                        href={getWhatsAppFollowUpLink(lead)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs transition-all shadow-xs hover:shadow-md cursor-pointer whitespace-nowrap"
                        title="Chat WA dengan draft pesan otomatis sesuai tahap closing"
                      >
                        <span>💬</span>
                        <span>Chat WA</span>
                      </a>
                    </td>
                  </tr>
                );
              })}

              {filteredLeads.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    <p className="text-sm font-medium">Tidak ada prospek ditemukan</p>
                    <p className="text-xs mt-1">Coba ubah kata kunci pencarian atau filter di atas.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
