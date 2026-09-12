"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";

interface InvoiceData {
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
  notes: string | null;
  settings?: {
    business_name?: string;
    tagline?: string;
    logo_url?: string;
    company_address?: string;
    company_phone?: string;
    company_email?: string;
    company_instagram?: string;
    bank_name?: string;
    bank_account_number?: string;
    bank_account_name?: string;
    footer_notes?: string;
    authorized_signer?: string;
    signature_url?: string;
  };
  payments?: {
    payment_method?: string;
    transaction_id?: string;
    payment_channel?: string;
    paid_at?: string;
  };
}

export default function InvoicePrintablePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/invoices/${id}`)
      .then((res) => res.json())
      .then((res) => {
        if (res.success && res.data) {
          setInvoice(res.data);
        } else {
          setErrorMsg(res.message || "Invoice tidak ditemukan");
        }
      })
      .catch((err) => {
        console.error("Error loading invoice:", err);
        setErrorMsg("Gagal memuat dokumen invoice.");
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-luxury-rose-gold border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-serif text-xs text-luxury-charcoal">Memuat Dokumen Invoice Resmi...</p>
        </div>
      </div>
    );
  }

  if (errorMsg || !invoice) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 text-center shadow-lg border border-gray-100 space-y-3">
          <span className="text-3xl">⚠️</span>
          <h2 className="font-serif text-lg font-bold text-gray-800">Invoice Tidak Ditemukan</h2>
          <p className="text-xs text-gray-500">{errorMsg}</p>
          <Link
            href="/"
            className="inline-block px-4 py-2 bg-luxury-charcoal text-white rounded-xl text-xs font-semibold"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  const s = invoice.settings || {};
  const bizName = s.business_name || "Jenni Khoe Makeup Artist";
  const tagline = s.tagline || "Luxury Bridal & Commercial Makeup Studio";
  const address = s.company_address || "Jakarta Barat, DKI Jakarta, Indonesia";
  const phone = s.company_phone || "+62 812-8077-5443";
  const email = s.company_email || "jennikhoe.mua@gmail.com";
  const instagram = s.company_instagram || "@jennikhoe.mua";
  const bankName = s.bank_name || "Bank Central Asia (BCA)";
  const bankAccNum = s.bank_account_number || "5271890231";
  const bankAccName = s.bank_account_name || "JENNI KHOE";
  const signer = s.authorized_signer || "Jenni Khoe";

  const formattedEventDate = invoice.event_date
    ? new Date(invoice.event_date).toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "-";

  const formattedInvoiceDate = invoice.invoice_date
    ? new Date(invoice.invoice_date).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "-";

  const formattedPaidAt = invoice.paid_at
    ? new Date(invoice.paid_at).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }) + " WIB"
    : "-";

  const isPaid = invoice.status === "paid" || invoice.paid_amount > 0;

  return (
    <div className="min-h-screen bg-[#F5F2EC] py-8 px-4 sm:px-6 print:p-0 print:bg-white text-gray-800 font-sans">
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 15mm 15mm 15mm 15mm;
          }
          body {
            background-color: #ffffff !important;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
          .print-shadow-none {
            box-shadow: none !important;
            border: 1px solid #e5e7eb !important;
          }
        }
      `}</style>

      {/* Floating Action Bar (Hidden when Printing) */}
      <div className="max-w-3xl mx-auto mb-5 flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="px-3 py-2 bg-white rounded-xl text-xs font-medium text-gray-700 border border-gray-200 hover:bg-gray-50 shadow-2xs transition"
          >
            ← Beranda
          </Link>
          <span className="text-xs text-gray-500 font-mono font-semibold">
            {invoice.invoice_number}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {invoice.spk_number && (
            <Link
              href={`/spk/${invoice.booking_id || invoice.deal_id || 1}`}
              className="px-3 py-2 rounded-xl text-xs font-medium text-luxury-rose-gold bg-white border border-luxury-rose-gold/40 hover:bg-luxury-cream/30 transition shadow-2xs flex items-center gap-1.5"
            >
              <span>📜</span>
              <span>Lihat Dokumen SPK</span>
            </Link>
          )}

          <a
            href={`https://wa.me/${phone.replace(/[^0-9]/g, "").replace(/^0/, "62")}?text=${encodeURIComponent(
              `Halo Kak Jenni Khoe, saya ingin mengonfirmasi terkait dokumen invoice #${invoice.invoice_number} a/n ${invoice.client_name}.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 rounded-xl text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition shadow-2xs flex items-center gap-1.5"
          >
            <span>💬</span>
            <span>WhatsApp MUA</span>
          </a>

          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-luxury-charcoal hover:bg-black transition shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <span>🖨️</span>
            <span>Cetak / Simpan PDF</span>
          </button>
        </div>
      </div>

      {/* Main Printable Document Card (A4 Aspect Ratio) */}
      <div className="max-w-3xl mx-auto bg-white rounded-3xl p-8 sm:p-12 shadow-xl border border-[#EBE6DD] print-shadow-none print:p-0 print:border-none space-y-8">
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-gray-200 pb-6">
          <div className="space-y-1.5">
            {s.logo_url ? (
              <img
                src={s.logo_url}
                alt={bizName}
                className="h-14 max-w-[200px] object-contain mb-2"
              />
            ) : (
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-luxury-charcoal text-luxury-gold flex items-center justify-center font-serif text-lg font-bold">
                  JK
                </div>
                <div>
                  <h1 className="font-serif text-xl font-bold text-luxury-charcoal tracking-wide">
                    {bizName}
                  </h1>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-luxury-rose-gold font-semibold">
                    {tagline}
                  </p>
                </div>
              </div>
            )}
            <div className="text-[11px] text-gray-500 leading-relaxed max-w-xs">
              <p>{address}</p>
              <p>WA: <span className="font-mono">{phone}</span> • IG: <span className="text-gray-700">{instagram}</span></p>
              <p>Email: {email}</p>
            </div>
          </div>

          <div className="sm:text-right space-y-1">
            <div className="inline-block">
              <span
                className={`text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-full border ${
                  isPaid
                    ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                    : "bg-amber-50 text-amber-800 border-amber-300"
                }`}
              >
                {isPaid ? "✓ LUNAS (PAID)" : "MENUNGGU PEMBAYARAN"}
              </span>
            </div>
            <h2 className="font-serif text-2xl font-bold text-luxury-charcoal pt-1">
              OFFICIAL INVOICE
            </h2>
            <p className="text-xs font-mono font-bold text-luxury-rose-gold">
              {invoice.invoice_number}
            </p>
            <p className="text-[11px] text-gray-400">
              Tanggal Terbit: <strong className="text-gray-700">{formattedInvoiceDate}</strong>
            </p>
            {invoice.spk_number && (
              <p className="text-[11px] text-gray-400">
                Ref. SPK: <span className="font-mono text-gray-700 font-semibold">{invoice.spk_number}</span>
              </p>
            )}
          </div>
        </div>

        {/* Client & Event Info Block */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-[#FCFAF7] p-5 rounded-2xl border border-[#EFECE6] text-xs">
          <div className="space-y-1">
            <p className="font-bold text-gray-400 uppercase tracking-wider text-[10px]">
              DITAGIHKAN KEPADA (CLIENT):
            </p>
            <p className="font-bold text-sm text-gray-900">{invoice.client_name}</p>
            <p className="text-gray-600 font-mono">WA: {invoice.client_phone || "-"}</p>
            {invoice.client_email && (
              <p className="text-gray-600">Email: {invoice.client_email}</p>
            )}
          </div>

          <div className="space-y-1 sm:border-l sm:border-gray-200 sm:pl-6">
            <p className="font-bold text-gray-400 uppercase tracking-wider text-[10px]">
              RINCIAN ACARA TATA RIAS:
            </p>
            <p className="text-gray-700">
              Tanggal Acara: <strong className="text-gray-900">{formattedEventDate}</strong>
            </p>
            <p className="text-gray-700">
              Lokasi / Venue: <strong className="text-gray-900">{invoice.venue || "Venue Sesuai Kesepakatan"}</strong>
            </p>
            <p className="text-gray-700">
              Paket: <strong className="text-luxury-rose-gold">{invoice.service_package}</strong>
            </p>
          </div>
        </div>

        {/* Itemized Table */}
        <div>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-200 text-gray-400 uppercase tracking-wider text-[10px]">
                <th className="py-2.5">Deskripsi Layanan</th>
                <th className="py-2.5 text-center">Qty</th>
                <th className="py-2.5 text-right">Tarif</th>
                <th className="py-2.5 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              <tr>
                <td className="py-3.5 pr-4">
                  <p className="font-bold text-gray-900">{invoice.service_package}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Layanan riasan profesional eksklusif (1 pengantin per hari), sterilisasi medis alat rias, kosmetik luxury internasional, serta pendampingan tim MUA resmi Jenni Khoe.
                  </p>
                </td>
                <td className="py-3.5 text-center font-mono">1 Paket</td>
                <td className="py-3.5 text-right font-mono">
                  Rp {invoice.total_amount.toLocaleString("id-ID")}
                </td>
                <td className="py-3.5 text-right font-mono font-bold text-gray-900">
                  Rp {invoice.total_amount.toLocaleString("id-ID")}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Totals Summary Breakdown */}
          <div className="border-t-2 border-gray-200 pt-4 flex flex-col items-end text-xs space-y-1.5">
            <div className="flex justify-between w-64 text-gray-600">
              <span>Total Biaya Paket:</span>
              <span className="font-mono font-semibold">Rp {invoice.total_amount.toLocaleString("id-ID")}</span>
            </div>

            <div className="flex justify-between w-64 text-emerald-700 font-bold bg-emerald-50 px-2 py-1 rounded">
              <span>DP Diterima (Lunas):</span>
              <span className="font-mono">Rp {invoice.paid_amount.toLocaleString("id-ID")}</span>
            </div>

            <div className="flex justify-between w-64 text-gray-800 font-bold border-t border-gray-200 pt-1.5">
              <span>Sisa Tagihan (H-7):</span>
              <span className="font-mono text-luxury-charcoal">
                Rp {invoice.remaining_balance.toLocaleString("id-ID")}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Confirmation & Bank Verification Block */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border border-gray-200 rounded-2xl p-4 bg-gray-50/50 text-xs">
          <div>
            <p className="font-bold text-gray-700 uppercase tracking-wider text-[10px] mb-1">
              METODE & BUKTI VERIFIKASI PEMBAYARAN:
            </p>
            <p className="text-gray-600">
              Bank Tujuan: <strong>{bankName}</strong>
            </p>
            <p className="text-gray-600">
              Nomor Rekening: <strong className="font-mono">{bankAccNum}</strong> (a/n {bankAccName})
            </p>
            <p className="text-gray-600 mt-1">
              Waktu Verifikasi: <span className="font-mono">{formattedPaidAt}</span>
            </p>
          </div>

          <div className="sm:border-l sm:border-gray-200 sm:pl-4">
            <p className="font-bold text-gray-700 uppercase tracking-wider text-[10px] mb-1">
              STATUS PENGUNCIAN JADWAL:
            </p>
            <p className="text-emerald-800 font-medium">
              🔒 Tanggal <strong>{formattedEventDate}</strong> telah TERKUNCI RESMI di kalender Jenni Khoe MUA.
            </p>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Slot tanggal riasan Anda dijamin 100% aman dan tidak dapat diambil pihak lain.
            </p>
          </div>
        </div>

        {/* Terms & Conditions / Footer Notes */}
        <div className="space-y-1.5 text-[11px] text-gray-500 leading-relaxed border-t border-gray-100 pt-4">
          <p className="font-bold uppercase tracking-wider text-gray-600 text-[10px]">
            SYARAT & KETENTUAN TRANSAKSI:
          </p>
          <p className="whitespace-pre-line">
            {s.footer_notes || `1. Pembayaran DP sebesar 50% bersifat non-refundable karena slot tanggal telah diblokir secara eksklusif.
2. Pelunasan sisa tagihan wajib diselesaikan selambat-lambatnya H-7 sebelum hari acara pernikahan.
3. Dokumen invoice ini sah diterbitkan oleh sistem resmi Jenni Khoe MUA.`}
          </p>
        </div>

        {/* Official Signatures & Stamp */}
        <div className="pt-6 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-end gap-6 text-xs">
          <div className="text-[10px] text-gray-400 font-mono space-y-0.5">
            <p>Generated by: Jenni Khoe MUA Secure Booking Engine</p>
            <p>Verification Code: {invoice.invoice_number}-VERIFIED</p>
          </div>

          <div className="text-center sm:text-right space-y-1">
            <p className="text-gray-500 text-[11px]">Hormat kami,</p>
            <p className="font-serif font-bold text-sm text-luxury-charcoal">
              {bizName}
            </p>
            <div className="h-14 flex items-center justify-center sm:justify-end">
              {s.signature_url ? (
                <img src={s.signature_url} alt="Signature" className="h-12 object-contain" />
              ) : (
                <div className="border border-emerald-300 bg-emerald-50 text-emerald-800 font-serif italic text-xs px-3 py-1 rounded-lg">
                  [ Verified Digital Signature: {signer} ]
                </div>
              )}
            </div>
            <p className="font-semibold text-gray-800 text-xs border-t border-gray-200 pt-1">
              {signer}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
