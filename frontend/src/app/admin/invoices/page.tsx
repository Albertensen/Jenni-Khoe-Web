"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";

interface InvoiceItem {
  id: number;
  invoice_number: string;
  booking_id: number | null;
  deal_id: number | null;
  payment_id: number | null;
  client_name: string;
  client_phone: string | null;
  client_email: string | null;
  service_package: string;
  event_date: string | null;
  venue: string | null;
  total_amount: number;
  dp_amount: number;
  paid_amount: number;
  remaining_balance: number;
  status: string;
  invoice_date: string;
  paid_at: string | null;
  spk_number: string | null;
  wa_sent_at: string | null;
  email_sent_at: string | null;
  notes: string | null;
}

interface InvoiceSettings {
  id: number;
  business_name: string;
  tagline: string;
  logo_url: string;
  company_address: string;
  company_phone: string;
  company_email: string;
  company_instagram: string;
  bank_name: string;
  bank_account_number: string;
  bank_account_name: string;
  footer_notes: string;
  authorized_signer: string;
  signature_url: string;
  auto_send_wa: boolean;
  auto_send_email: boolean;
  resend_api_key: string;
}

export default function AdminInvoicesPage() {
  const [activeTab, setActiveTab] = useState<"invoices" | "settings">("invoices");

  // Invoices list state
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "unpaid">("all");
  const [dispatchingId, setDispatchingId] = useState<number | null>(null);

  // Settings state
  const [settings, setSettings] = useState<InvoiceSettings | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Form states for settings
  const [formSettings, setFormSettings] = useState({
    business_name: "Jenni Khoe Makeup Artist",
    tagline: "Luxury Bridal & Commercial Makeup Studio",
    logo_url: "",
    company_address: "Jakarta Barat, DKI Jakarta, Indonesia",
    company_phone: "+62 812-8077-5443",
    company_email: "jennikhoe.mua@gmail.com",
    company_instagram: "@jennikhoe.mua",
    bank_name: "Bank Central Asia (BCA)",
    bank_account_number: "5271890231",
    bank_account_name: "JENNI KHOE",
    footer_notes: `1. Pembayaran DP sebesar 50% bersifat non-refundable karena slot tanggal telah diblokir eksklusif.
2. Pelunasan sisa tagihan (50%) wajib diselesaikan selambat-lambatnya H-7 sebelum hari acara.
3. Invoice ini merupakan bukti pembayaran resmi yang sah dari Jenni Khoe Makeup Artist.`,
    authorized_signer: "Jenni Khoe",
    signature_url: "",
    auto_send_wa: true,
    auto_send_email: true,
    resend_api_key: "",
  });

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const fetchInvoices = async () => {
    try {
      setLoadingInvoices(true);
      const res = await fetch("/api/invoices");
      const json = await res.json();
      if (json.success && json.data) {
        setInvoices(json.data);
      }
    } catch (err) {
      console.error("Error fetching invoices:", err);
      showToast("Gagal memuat daftar invoice.");
    } finally {
      setLoadingInvoices(false);
    }
  };

  const fetchSettings = async () => {
    try {
      setLoadingSettings(true);
      const res = await fetch("/api/invoice-settings");
      const json = await res.json();
      if (json.success && json.data) {
        setSettings(json.data);
        setFormSettings({
          business_name: json.data.business_name || "Jenni Khoe Makeup Artist",
          tagline: json.data.tagline || "Luxury Bridal & Commercial Makeup Studio",
          logo_url: json.data.logo_url || "",
          company_address: json.data.company_address || "Jakarta Barat, DKI Jakarta, Indonesia",
          company_phone: json.data.company_phone || "+62 812-8077-5443",
          company_email: json.data.company_email || "jennikhoe.mua@gmail.com",
          company_instagram: json.data.company_instagram || "@jennikhoe.mua",
          bank_name: json.data.bank_name || "Bank Central Asia (BCA)",
          bank_account_number: json.data.bank_account_number || "5271890231",
          bank_account_name: json.data.bank_account_name || "JENNI KHOE",
          footer_notes: json.data.footer_notes || "",
          authorized_signer: json.data.authorized_signer || "Jenni Khoe",
          signature_url: json.data.signature_url || "",
          auto_send_wa: json.data.auto_send_wa ?? true,
          auto_send_email: json.data.auto_send_email ?? true,
          resend_api_key: json.data.resend_api_key || "",
        });
      }
    } catch (err) {
      console.error("Error fetching invoice settings:", err);
    } finally {
      setLoadingSettings(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
    fetchSettings();
  }, []);

  // Save Settings Form
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingSettings(true);
      const res = await fetch("/api/invoice-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formSettings),
      });
      const json = await res.json();
      if (json.success) {
        setSettings(json.data);
        showToast("✓ Pengaturan default invoice berhasil disimpan.");
      } else {
        showToast(json.message || "Gagal menyimpan pengaturan");
      }
    } catch (err) {
      console.error("Save settings error:", err);
      showToast("Terjadi kesalahan jaringan");
    } finally {
      setSavingSettings(false);
    }
  };

  // Dispatch / Resend Invoice & SPK
  const handleDispatch = async (inv: InvoiceItem) => {
    try {
      setDispatchingId(inv.id);
      const res = await fetch("/api/invoices/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoice_id: inv.id }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`✓ Dokumen #${inv.invoice_number} berhasil diproses & dikirim!`);
        if (json.data?.wa_link) {
          window.open(json.data.wa_link, "_blank");
        }
        await fetchInvoices();
      } else {
        showToast(json.message || "Gagal mengirim notifikasi");
      }
    } catch (err) {
      console.error("Dispatch error:", err);
      showToast("Terjadi gangguan saat memproses pengiriman");
    } finally {
      setDispatchingId(null);
    }
  };

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((i) => {
      const matchSearch =
        search === "" ||
        i.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
        i.client_name.toLowerCase().includes(search.toLowerCase()) ||
        (i.client_phone && i.client_phone.includes(search)) ||
        (i.spk_number && i.spk_number.toLowerCase().includes(search.toLowerCase())) ||
        (i.service_package && i.service_package.toLowerCase().includes(search.toLowerCase()));

      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "paid" && (i.status === "paid" || i.paid_amount > 0)) ||
        (statusFilter === "unpaid" && i.status !== "paid" && i.paid_amount === 0);

      return matchSearch && matchStatus;
    });
  }, [invoices, search, statusFilter]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = invoices.length;
    const paidList = invoices.filter((i) => i.status === "paid" || i.paid_amount > 0);
    const totalPaidRevenue = paidList.reduce((acc, i) => acc + (Number(i.paid_amount) || 0), 0);
    const waSentCount = invoices.filter((i) => i.wa_sent_at).length;
    const emailSentCount = invoices.filter((i) => i.email_sent_at).length;

    return {
      total,
      paidCount: paidList.length,
      totalPaidRevenue,
      waSentCount,
      emailSentCount,
    };
  }, [invoices]);

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
            Manajemen Invoice & Dokumen PDF
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Penerbitan invoice otomatis saat pembayaran lunas, pengiriman PDF via WhatsApp & Email, serta kustomisasi template invoice.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-2xl border border-gray-200/80 w-fit">
          <button
            onClick={() => setActiveTab("invoices")}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "invoices"
                ? "bg-white text-luxury-charcoal shadow-xs font-semibold"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <span>🧾</span>
            <span>Daftar Invoice ({invoices.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "settings"
                ? "bg-white text-luxury-charcoal shadow-xs font-semibold"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <span>⚙️</span>
            <span>Pengaturan Default Invoice</span>
          </button>
        </div>
      </div>

      {/* TAB 1: DAFTAR INVOICE */}
      {activeTab === "invoices" && (
        <div className="space-y-6">
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg">
                🧾
              </div>
              <div>
                <p className="text-[11px] text-gray-500 font-medium">Total Dokumen Invoice</p>
                <p className="text-xl font-serif font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg">
                💰
              </div>
              <div>
                <p className="text-[11px] text-gray-500 font-medium">Total DP Lunas Diterima</p>
                <p className="text-xl font-serif font-bold text-emerald-700">
                  Rp {stats.totalPaidRevenue.toLocaleString("id-ID")}
                </p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-lg">
                💬
              </div>
              <div>
                <p className="text-[11px] text-gray-500 font-medium">Notifikasi WhatsApp</p>
                <p className="text-xl font-serif font-bold text-gray-900">
                  {stats.waSentCount} <span className="text-xs text-gray-400 font-normal">terkirim</span>
                </p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-lg">
                ✉️
              </div>
              <div>
                <p className="text-[11px] text-gray-500 font-medium">Notifikasi Email</p>
                <p className="text-xl font-serif font-bold text-gray-900">
                  {stats.emailSentCount} <span className="text-xs text-gray-400 font-normal">terkirim</span>
                </p>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nomor invoice, klien, SPK, atau no WhatsApp..."
                className="w-full text-xs pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-luxury-gold"
              />
              <span className="absolute left-3 top-2.5 text-gray-400 text-xs">🔍</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Status:</span>
              <select
                value={statusFilter}
                onChange={(e: any) => setStatusFilter(e.target.value)}
                className="text-xs px-3 py-2 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-luxury-gold"
              >
                <option value="all">Semua Status</option>
                <option value="paid">Lunas (Paid)</option>
                <option value="unpaid">Belum Lunas</option>
              </select>

              <button
                onClick={fetchInvoices}
                className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs transition cursor-pointer"
                title="Refresh Daftar Invoice"
              >
                🔄
              </button>
            </div>
          </div>

          {/* Invoices Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
            {loadingInvoices ? (
              <div className="py-16 text-center text-xs text-gray-400 space-y-2">
                <div className="w-8 h-8 border-2 border-luxury-rose-gold border-t-transparent rounded-full animate-spin mx-auto" />
                <p>Memuat daftar invoice...</p>
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div className="py-16 text-center text-xs text-gray-400 space-y-1">
                <span className="text-3xl">🧾</span>
                <p className="font-semibold text-gray-600">Tidak ada data invoice ditemukan.</p>
                <p className="text-[11px] text-gray-400">
                  Invoice diterbitkan otomatis saat pembayaran booking klien terverifikasi lunas.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50/70 border-b border-gray-100 text-gray-400 text-[10px] uppercase tracking-wider">
                      <th className="py-3.5 px-4">Invoice & SPK</th>
                      <th className="py-3.5 px-4">Klien & Kontak</th>
                      <th className="py-3.5 px-4">Paket & Acara</th>
                      <th className="py-3.5 px-4">Biaya & DP</th>
                      <th className="py-3.5 px-4">Status Bayar</th>
                      <th className="py-3.5 px-4">Pengiriman</th>
                      <th className="py-3.5 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {filteredInvoices.map((inv) => {
                      const isPaid = inv.status === "paid" || inv.paid_amount > 0;
                      const isDispatching = dispatchingId === inv.id;

                      return (
                        <tr key={inv.id} className="hover:bg-gray-50/60 transition">
                          {/* Invoice & SPK */}
                          <td className="py-3.5 px-4">
                            <div className="font-mono font-bold text-gray-900">
                              {inv.invoice_number}
                            </div>
                            <div className="text-[11px] text-gray-400 mt-0.5">
                              {inv.invoice_date || "-"}
                            </div>
                            {inv.spk_number && (
                              <span className="text-[10px] text-luxury-rose-gold font-mono bg-luxury-rose-gold/10 px-1.5 py-0.2 rounded mt-1 inline-block">
                                {inv.spk_number}
                              </span>
                            )}
                          </td>

                          {/* Klien & Kontak */}
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-gray-900">{inv.client_name}</div>
                            <div className="text-[11px] text-gray-500 font-mono">
                              {inv.client_phone || "-"}
                            </div>
                            {inv.client_email && (
                              <div className="text-[10px] text-gray-400 truncate max-w-[150px]">
                                {inv.client_email}
                              </div>
                            )}
                          </td>

                          {/* Paket & Acara */}
                          <td className="py-3.5 px-4">
                            <div className="font-medium text-gray-800 line-clamp-1">
                              {inv.service_package}
                            </div>
                            <div className="text-[11px] text-gray-500">
                              📅 {inv.event_date || "-"}
                            </div>
                            <div className="text-[10px] text-gray-400 line-clamp-1">
                              📍 {inv.venue || "-"}
                            </div>
                          </td>

                          {/* Biaya & DP */}
                          <td className="py-3.5 px-4">
                            <div className="text-[11px] text-gray-500">
                              Total: Rp {inv.total_amount.toLocaleString("id-ID")}
                            </div>
                            <div className="font-semibold text-emerald-700">
                              DP: Rp {inv.paid_amount.toLocaleString("id-ID")}
                            </div>
                            <div className="text-[10px] text-gray-400">
                              Sisa: Rp {inv.remaining_balance.toLocaleString("id-ID")}
                            </div>
                          </td>

                          {/* Status Bayar */}
                          <td className="py-3.5 px-4">
                            <span
                              className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                                isPaid
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                  : "bg-amber-50 text-amber-800 border-amber-200"
                              }`}
                            >
                              {isPaid ? "✓ Lunas" : "Belum Lunas"}
                            </span>
                            {inv.paid_at && (
                              <div className="text-[9px] text-gray-400 mt-1 font-mono">
                                {inv.paid_at.slice(0, 10)}
                              </div>
                            )}
                          </td>

                          {/* Pengiriman Status */}
                          <td className="py-3.5 px-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 text-[10px]">
                                <span>💬 WA:</span>
                                {inv.wa_sent_at ? (
                                  <span className="text-emerald-700 font-semibold">✓ Terkirim</span>
                                ) : (
                                  <span className="text-gray-400">Belum</span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 text-[10px]">
                                <span>✉️ Email:</span>
                                {inv.email_sent_at ? (
                                  <span className="text-purple-700 font-semibold">✓ Terkirim</span>
                                ) : inv.client_email ? (
                                  <span className="text-gray-400">Belum</span>
                                ) : (
                                  <span className="text-gray-300 italic">No email</span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Open Printable Invoice */}
                              <Link
                                href={`/invoice/${inv.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2.5 py-1 rounded-lg text-xs font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition shadow-2xs"
                                title="Buka / Cetak Invoice PDF"
                              >
                                📄 Invoice
                              </Link>

                              {/* Open SPK */}
                              {inv.spk_number && (
                                <Link
                                  href={`/spk/${inv.booking_id || inv.deal_id || 1}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2.5 py-1 rounded-lg text-xs font-medium text-luxury-rose-gold bg-luxury-rose-gold/10 hover:bg-luxury-rose-gold/20 transition shadow-2xs"
                                  title="Buka / Cetak SPK PDF"
                                >
                                  📜 SPK
                                </Link>
                              )}

                              {/* Dispatch / Resend */}
                              <button
                                onClick={() => handleDispatch(inv)}
                                disabled={isDispatching}
                                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-2xs disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                                title="Kirim Ulang Invoice & SPK ke WhatsApp / Email Klien"
                              >
                                {isDispatching ? (
                                  <span>...</span>
                                ) : (
                                  <>
                                    <span>🚀</span>
                                    <span>Kirim</span>
                                  </>
                                )}
                              </button>
                            </div>
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
      )}

      {/* TAB 2: PENGATURAN DEFAULT INVOICE */}
      {activeTab === "settings" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Settings Form (7 cols) */}
          <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-6">
            <div className="border-b border-gray-100 pb-4">
              <h2 className="text-base font-serif font-bold text-luxury-charcoal">
                Identitas Usaha & Format Default Invoice
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Konfigurasi logo, nama bisnis, kontak, dan rekening yang tercetak di setiap dokumen invoice PDF resmi.
              </p>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              {/* Logo URL */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Logo Usaha (URL Gambar / Transparan)
                </label>
                <input
                  type="url"
                  value={formSettings.logo_url}
                  onChange={(e) => setFormSettings({ ...formSettings, logo_url: e.target.value })}
                  placeholder="https://domain.com/logo-jenni-khoe.png (Kosongkan jika ingin monogram luxury default)"
                  className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-luxury-gold"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  * Format PNG transparan resolusi tinggi disarankan untuk hasil cetak PDF terbaik.
                </p>
              </div>

              {/* Nama Usaha & Tagline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Nama Usaha / Studio <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formSettings.business_name}
                    onChange={(e) => setFormSettings({ ...formSettings, business_name: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-luxury-gold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Tagline / Subtitle
                  </label>
                  <input
                    type="text"
                    value={formSettings.tagline}
                    onChange={(e) => setFormSettings({ ...formSettings, tagline: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-luxury-gold"
                  />
                </div>
              </div>

              {/* Alamat Studio */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Alamat Lengkap Studio / Kantor
                </label>
                <input
                  type="text"
                  value={formSettings.company_address}
                  onChange={(e) => setFormSettings({ ...formSettings, company_address: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-luxury-gold"
                />
              </div>

              {/* Kontak: Telepon, Email, Instagram */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    WhatsApp Resmi
                  </label>
                  <input
                    type="text"
                    value={formSettings.company_phone}
                    onChange={(e) => setFormSettings({ ...formSettings, company_phone: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-luxury-gold font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Email Resmi
                  </label>
                  <input
                    type="email"
                    value={formSettings.company_email}
                    onChange={(e) => setFormSettings({ ...formSettings, company_email: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-luxury-gold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Instagram Handle
                  </label>
                  <input
                    type="text"
                    value={formSettings.company_instagram}
                    onChange={(e) => setFormSettings({ ...formSettings, company_instagram: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-luxury-gold"
                  />
                </div>
              </div>

              {/* Informasi Rekening Bank */}
              <div className="p-4 bg-gray-50/80 rounded-2xl border border-gray-200/80 space-y-3">
                <p className="font-semibold text-gray-900 text-xs">
                  🏦 Rekening Bank Pembayaran Resmi
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-gray-600 mb-1">Nama Bank</label>
                    <input
                      type="text"
                      value={formSettings.bank_name}
                      onChange={(e) => setFormSettings({ ...formSettings, bank_name: e.target.value })}
                      className="w-full text-xs p-2 rounded-lg border border-gray-200 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-600 mb-1">Nomor Rekening</label>
                    <input
                      type="text"
                      value={formSettings.bank_account_number}
                      onChange={(e) => setFormSettings({ ...formSettings, bank_account_number: e.target.value })}
                      className="w-full text-xs p-2 rounded-lg border border-gray-200 bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-600 mb-1">Atas Nama Rekening</label>
                    <input
                      type="text"
                      value={formSettings.bank_account_name}
                      onChange={(e) => setFormSettings({ ...formSettings, bank_account_name: e.target.value })}
                      className="w-full text-xs p-2 rounded-lg border border-gray-200 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Authorized Signer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Nama Penandatangan Resmi (Authorized Signer)
                  </label>
                  <input
                    type="text"
                    value={formSettings.authorized_signer}
                    onChange={(e) => setFormSettings({ ...formSettings, authorized_signer: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-luxury-gold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Resend API Key (Opsional untuk Email)
                  </label>
                  <input
                    type="password"
                    value={formSettings.resend_api_key}
                    onChange={(e) => setFormSettings({ ...formSettings, resend_api_key: e.target.value })}
                    placeholder="re_xxxxxxxxxxxx"
                    className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-luxury-gold font-mono"
                  />
                </div>
              </div>

              {/* Syarat & Catatan Kaki */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Catatan Kaki & Syarat Transaksi (Footer Notes)
                </label>
                <textarea
                  rows={4}
                  value={formSettings.footer_notes}
                  onChange={(e) => setFormSettings({ ...formSettings, footer_notes: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-luxury-gold font-sans leading-relaxed"
                />
              </div>

              {/* Otomatisasi Toggles */}
              <div className="p-4 bg-luxury-cream/20 rounded-2xl border border-luxury-champagne/50 space-y-3">
                <p className="font-semibold text-gray-900 text-xs">
                  ⚡ Otomatisasi Pengiriman saat Pembayaran Lunas
                </p>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formSettings.auto_send_wa}
                      onChange={(e) => setFormSettings({ ...formSettings, auto_send_wa: e.target.checked })}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-gray-700">
                      Otomatis siapkan pesan konfirmasi & tautan PDF ke WhatsApp Customer
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formSettings.auto_send_email}
                      onChange={(e) => setFormSettings({ ...formSettings, auto_send_email: e.target.checked })}
                      className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-gray-700">
                      Otomatis kirim email Invoice & SPK ke Customer jika email diisi
                    </span>
                  </label>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="px-6 py-2.5 rounded-xl bg-luxury-charcoal hover:bg-black text-white text-xs font-semibold shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {savingSettings ? "Menyimpan..." : "Simpan Pengaturan Invoice"}
                </button>
              </div>
            </form>
          </div>

          {/* Live Invoice Preview (5 cols) */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Live Preview Template Invoice
              </h3>
              <span className="text-[10px] text-luxury-gold bg-luxury-gold/10 px-2 py-0.5 rounded-full font-medium">
                Tampilan PDF Otomatis
              </span>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-md space-y-4 text-gray-800 text-[11px]">
              {/* Header Preview */}
              <div className="border-b border-gray-100 pb-3 flex items-start justify-between">
                <div>
                  {formSettings.logo_url ? (
                    <img
                      src={formSettings.logo_url}
                      alt="Logo"
                      className="h-10 max-w-[140px] object-contain mb-1"
                    />
                  ) : (
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-8 h-8 rounded-lg bg-luxury-charcoal text-luxury-gold flex items-center justify-center font-serif text-xs font-bold">
                        JK
                      </div>
                      <span className="font-serif font-bold text-gray-900 text-xs">
                        {formSettings.business_name}
                      </span>
                    </div>
                  )}
                  <p className="text-[9px] text-gray-400 max-w-[200px] leading-tight">
                    {formSettings.company_address} • {formSettings.company_phone}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    ✓ LUNAS
                  </span>
                  <p className="font-mono text-[10px] font-bold text-gray-700 mt-1">
                    INV-JKM-202609-001
                  </p>
                </div>
              </div>

              {/* Client & Booking Sample */}
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-1 text-[10px]">
                <p className="text-gray-400 uppercase tracking-wider font-semibold">Ditagihkan Kepada:</p>
                <p className="font-bold text-gray-900">Clarissa Tan (Bridal Luxury)</p>
                <p className="text-gray-600">📅 Sabtu, 20 Juni 2026 • Hotel Indonesia Kempinski</p>
              </div>

              {/* Table Sample */}
              <div className="border-t border-b border-gray-100 py-2 space-y-1">
                <div className="flex justify-between text-gray-600">
                  <span>Royal Wedding Experience:</span>
                  <span className="font-mono">Rp 22.000.000</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-bold bg-emerald-50/70 p-1.5 rounded">
                  <span>DP Diterima (Lunas):</span>
                  <span className="font-mono">Rp 11.000.000</span>
                </div>
                <div className="flex justify-between text-gray-700 font-semibold pt-1">
                  <span>Sisa Pelunasan:</span>
                  <span className="font-mono">Rp 11.000.000</span>
                </div>
              </div>

              {/* Bank Details */}
              <div className="bg-blue-50/50 border border-blue-100 p-3 rounded-xl text-[10px] text-blue-950 space-y-0.5">
                <p className="font-bold">🏦 Rekening Tujuan:</p>
                <p>{formSettings.bank_name}: <strong className="font-mono">{formSettings.bank_account_number}</strong></p>
                <p>a/n <strong>{formSettings.bank_account_name}</strong></p>
              </div>

              {/* Footer notes */}
              <div className="text-[9px] text-gray-400 whitespace-pre-line leading-relaxed italic">
                {formSettings.footer_notes}
              </div>

              {/* Signer */}
              <div className="pt-2 border-t border-gray-100 flex justify-between items-end text-[10px]">
                <span className="text-gray-400 font-mono">Jenni Khoe MUA Secure System</span>
                <div className="text-right">
                  <p className="text-gray-400">Authorized Signature:</p>
                  <p className="font-serif font-bold text-gray-900">{formSettings.authorized_signer}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
