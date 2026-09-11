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

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  new: { label: "Baru", color: "bg-gray-100 text-gray-700" },
  follow_up: { label: "Prospek Ulang", color: "bg-blue-100 text-blue-700" },
  quoted: { label: "Ditawari", color: "bg-amber-100 text-amber-800" },
  closed: { label: "Deal (SPK)", color: "bg-emerald-100 text-emerald-800" },
  lost: { label: "Batal / Pasif", color: "bg-rose-100 text-rose-700" },
};

export default function AdminAiLeads() {
  const [leads, setLeads] = useState<AiLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  const fetchLeads = () => {
    setLoading(true);
    fetch("/api/ai-leads")
      .then((r) => (r.ok ? r.json() : Promise.resolve({ data: [] })))
      .then((d) => {
        setLeads(d.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch("/api/ai-leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        setLeads((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
        );
      }
    } catch (err) {
      console.error("Update status err:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPhone(text);
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  // Generate customized WhatsApp follow-up link based on closing stage
  const getWhatsAppFollowUpLink = (lead: AiLead) => {
    const cleanPhone = lead.phone.replace(/[^0-9]/g, "");
    let template = `Halo Kak ${lead.name}, saya Jenni Khoe MUA. Menyapa kembali terkait konsultasi riasan Kakak di website resmi kami.`;

    if (lead.closing_stage === "Tanya Jawab Jadwal & Lokasi") {
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

      return matchSearch && matchStage && matchStatus;
    });
  }, [leads, search, stageFilter, statusFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16 text-gray-400 gap-3">
        <div className="w-5 h-5 border-2 border-luxury-rose-gold border-t-transparent rounded-full animate-spin" />
        <span className="text-sm">Memuat database prospek calon klien...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif text-luxury-charcoal font-medium">
            AI Chat Lead Center & Prospek CRM
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Database nomor HP, nama calon klien, dan pelacakan tahap closing percakapan AI Assistant
          </p>
        </div>
        <button
          onClick={fetchLeads}
          className="self-start sm:self-auto px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-700 shadow-xs flex items-center gap-2 cursor-pointer transition-colors"
        >
          <span>🔄</span> Refresh Data
        </button>
      </div>

      {/* Funnel KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
          <p className="text-xs text-gray-400 font-medium">Total Calon Klien</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-serif font-semibold text-luxury-charcoal">{stats.total}</span>
            <span className="text-[11px] text-gray-400">kontak</span>
          </div>
        </div>

        <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100 shadow-xs">
          <p className="text-xs text-amber-800 font-medium">1. Form Terisi</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-serif font-semibold text-amber-900">{stats.initial}</span>
            <span className="text-[11px] text-amber-700">lead awal</span>
          </div>
        </div>

        <div className="bg-sky-50/50 p-4 rounded-2xl border border-sky-100 shadow-xs">
          <p className="text-xs text-sky-800 font-medium">2. Tanya Jadwal & Venue</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-serif font-semibold text-sky-900">{stats.schedule}</span>
            <span className="text-[11px] text-sky-700">cek tanggal</span>
          </div>
        </div>

        <div className="bg-purple-50/50 p-4 rounded-2xl border border-purple-100 shadow-xs">
          <p className="text-xs text-purple-800 font-medium">3. Dapat Pricelist</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-serif font-semibold text-purple-900">{stats.pricelist}</span>
            <span className="text-[11px] text-purple-700">tahu harga</span>
          </div>
        </div>

        <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 shadow-xs col-span-2 lg:col-span-1">
          <p className="text-xs text-emerald-800 font-medium">4. Siap Booking / Lock</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-serif font-semibold text-emerald-900">{stats.ready}</span>
            <span className="text-[11px] text-emerald-700">hot deal</span>
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
                <th className="py-3.5 px-4">Waktu Chat</th>
                <th className="py-3.5 px-4">Calon Klien & WA</th>
                <th className="py-3.5 px-4">Tahap Closing Saat Ini</th>
                <th className="py-3.5 px-4">Detail Jadwal Terdata</th>
                <th className="py-3.5 px-4">Pesan Terakhir</th>
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
                    {/* Waktu Chat */}
                    <td className="py-3.5 px-4 align-top whitespace-nowrap">
                      <p className="font-medium text-gray-800">{dateStr}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{timeStr} WIB</p>
                      <span className="inline-block mt-1 text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                        {lead.messages} pesan
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
                            <p className="text-gray-700">
                              <span className="text-gray-400">Tgl:</span>{" "}
                              <span className="font-medium">{lead.schedule_date}</span>
                            </p>
                          )}
                          {lead.schedule_venue && (
                            <p className="text-gray-700">
                              <span className="text-gray-400">Lokasi:</span>{" "}
                              <span className="font-medium">{lead.schedule_venue}</span>
                            </p>
                          )}
                          {lead.schedule_time && (
                            <p className="text-gray-700">
                              <span className="text-gray-400">Jam:</span>{" "}
                              <span className="font-medium">{lead.schedule_time}</span>
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-300 italic text-[11px]">Belum sebut jadwal</span>
                      )}
                    </td>

                    {/* Pesan Terakhir */}
                    <td className="py-3.5 px-4 align-top max-w-xs">
                      {lead.last_message ? (
                        <p className="text-gray-600 line-clamp-2 text-[11px] leading-relaxed bg-gray-50/80 p-2 rounded-lg border border-gray-100">
                          &ldquo;{lead.last_message}&rdquo;
                        </p>
                      ) : (
                        <span className="text-gray-300 italic text-[11px]">-</span>
                      )}
                    </td>

                    {/* Status Prospek Dropdown */}
                    <td className="py-3.5 px-4 align-top whitespace-nowrap">
                      <select
                        value={lead.status || "new"}
                        disabled={updatingId === lead.id}
                        onChange={(e) => handleUpdateStatus(lead.id, e.target.value)}
                        className={`text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 font-medium focus:outline-none cursor-pointer ${
                          STATUS_CONFIG[lead.status]?.color || "bg-gray-100 text-gray-700"
                        }`}
                      >
                        <option value="new">Baru (New)</option>
                        <option value="follow_up">Prospek Ulang (Follow Up)</option>
                        <option value="quoted">Sudah Ditawari (Quoted)</option>
                        <option value="closed">Deal (Closed SPK)</option>
                        <option value="lost">Batal / Pasif</option>
                      </select>
                    </td>

                    {/* Aksi Prospek WhatsApp */}
                    <td className="py-3.5 px-4 align-top text-center whitespace-nowrap">
                      <a
                        href={getWhatsAppFollowUpLink(lead)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl font-medium text-xs shadow-2xs hover:shadow-xs transition-all hover:scale-105 cursor-pointer"
                        title="Langsung chat prospek ke WhatsApp klien dengan draft pesan sesuai tahapan"
                      >
                        <span className="text-sm">💬</span>
                        <span>Chat WA</span>
                      </a>
                    </td>
                  </tr>
                );
              })}

              {filteredLeads.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    Tidak ada calon klien yang cocok dengan kriteria pencarian/filter.
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
