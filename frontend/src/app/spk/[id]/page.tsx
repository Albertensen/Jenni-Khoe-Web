"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";

interface ContractData {
  id: number;
  spk_number: string;
  client_name: string;
  client_phone: string;
  service_package: string;
  event_date: string;
  venue: string;
  signed_at: string | null;
  signed_ip: string | null;
  client_signature_data: string | null;
  terms_content: string | null;
  booking_id?: number | null;
  deal_id?: number | null;
}

export default function SpkPrintablePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [contract, setContract] = useState<ContractData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/contracts?id=${id}`)
      .then((res) => res.json())
      .then((res) => {
        if (res.success && res.data) {
          const list = Array.isArray(res.data) ? res.data : [res.data];
          const found = list.find((c: any) =>
            String(c.id) === String(id) ||
            String(c.booking_id) === String(id) ||
            String(c.deal_id) === String(id) ||
            c.spk_number === id
          ) || list[0];

          if (found) {
            setContract(found);
          } else {
            setErrorMsg("Dokumen SPK tidak ditemukan");
          }
        } else {
          setErrorMsg("Gagal memuat dokumen SPK");
        }
      })
      .catch((err) => {
        console.error("Error loading contract:", err);
        setErrorMsg("Gagal terhubung ke server");
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
          <p className="font-serif text-xs text-luxury-charcoal">Memuat Dokumen SPK Digital Sah...</p>
        </div>
      </div>
    );
  }

  if (errorMsg || !contract) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 text-center shadow-lg border border-gray-100 space-y-3">
          <span className="text-3xl">⚠️</span>
          <h2 className="font-serif text-lg font-bold text-gray-800">SPK Tidak Ditemukan</h2>
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

  const formattedEventDate = contract.event_date
    ? new Date(contract.event_date).toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "-";

  const formattedSignedAt = contract.signed_at
    ? new Date(contract.signed_at).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }) + " WIB"
    : "-";

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

      {/* Floating Action Bar */}
      <div className="max-w-3xl mx-auto mb-5 flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="px-3 py-2 bg-white rounded-xl text-xs font-medium text-gray-700 border border-gray-200 hover:bg-gray-50 shadow-2xs transition"
          >
            ← Beranda
          </Link>
          <span className="text-xs text-gray-500 font-mono font-semibold">
            {contract.spk_number}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {contract.booking_id && (
            <Link
              href={`/invoice/${contract.booking_id}`}
              className="px-3 py-2 rounded-xl text-xs font-medium text-luxury-charcoal bg-white border border-gray-200 hover:bg-gray-50 transition shadow-2xs flex items-center gap-1.5"
            >
              <span>🧾</span>
              <span>Lihat Invoice</span>
            </Link>
          )}

          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-luxury-charcoal hover:bg-black transition shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <span>🖨️</span>
            <span>Cetak / Simpan PDF SPK</span>
          </button>
        </div>
      </div>

      {/* Main Printable Document Card */}
      <div className="max-w-3xl mx-auto bg-white rounded-3xl p-8 sm:p-12 shadow-xl border border-[#EBE6DD] print-shadow-none print:p-0 print:border-none space-y-6">
        {/* Header SPK */}
        <div className="border-b-2 border-luxury-charcoal/80 pb-4 text-center space-y-1">
          <h1 className="font-serif text-2xl font-bold text-luxury-charcoal tracking-wide">
            JENNI KHOE MAKEUP ARTIST
          </h1>
          <p className="text-[10px] uppercase tracking-[0.25em] text-luxury-rose-gold font-semibold">
            LUXURY BRIDAL & COMMERCIAL MAKEUP STUDIO
          </p>
          <p className="text-[11px] text-gray-500">
            Jakarta Barat, DKI Jakarta, Indonesia • WhatsApp: +62 812-8077-5443 • Instagram: @jennikhoe.mua
          </p>
          <div className="pt-2">
            <h2 className="font-serif text-lg font-bold text-luxury-charcoal uppercase tracking-wider inline-block border-b border-luxury-charcoal">
              SURAT PERJANJIAN KERJA (SPK) DIGITAL
            </h2>
            <p className="text-xs font-mono font-bold text-luxury-rose-gold mt-1">
              Nomor Dokumen: {contract.spk_number}
            </p>
          </div>
        </div>

        {/* Intro */}
        <p className="text-xs text-gray-700 leading-relaxed text-justify">
          Pada hari ini, telah dibuat dan disepakati perjanjian kerjasama layanan jasa tata rias pengantin eksklusif antara pihak-pihak sebagai berikut:
        </p>

        {/* Para Pihak */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-gray-50 p-4 rounded-2xl border border-gray-200">
          <div className="space-y-1">
            <p className="font-bold text-gray-900 uppercase tracking-wider text-[10px]">
              PIHAK PERTAMA (PENYEDIA JASA):
            </p>
            <p className="font-bold text-gray-900">Jenni Khoe Makeup Artist</p>
            <p className="text-gray-600">Profesi: Professional Makeup Artist</p>
            <p className="text-gray-600">Alamat: Jakarta Barat, DKI Jakarta</p>
            <p className="text-gray-600 font-mono">Kontak: +62 812-8077-5443</p>
          </div>

          <div className="space-y-1 sm:border-l sm:border-gray-200 sm:pl-4">
            <p className="font-bold text-gray-900 uppercase tracking-wider text-[10px]">
              PIHAK KEDUA (PENGANTIN / KLIEN):
            </p>
            <p className="font-bold text-gray-900">{contract.client_name}</p>
            <p className="text-gray-600 font-mono">WhatsApp: {contract.client_phone}</p>
            <p className="text-gray-600">Tanggal Acara: <strong>{formattedEventDate}</strong></p>
            <p className="text-gray-600">Lokasi Venue: <strong>{contract.venue || "-"}</strong></p>
            <p className="text-gray-600">Paket: <strong className="text-luxury-rose-gold">{contract.service_package}</strong></p>
          </div>
        </div>

        {/* Clauses / Terms */}
        <div className="space-y-3 text-xs text-gray-700 leading-relaxed">
          <h3 className="font-serif font-bold text-sm text-luxury-charcoal uppercase tracking-wider border-b border-gray-200 pb-1">
            SYARAT & KETENTUAN KESEPAKATAN (T&C)
          </h3>
          <div className="whitespace-pre-wrap text-[11px] leading-relaxed text-gray-600 bg-[#FCFAF7] p-4 rounded-xl border border-gray-100">
            {contract.terms_content || `1. Penguncian Slot Tanggal & Uang Muka (DP 50%):
Jadwal riasan hanya dinyatakan sah terblokir setelah PIHAK KEDUA membubuhkan tanda tangan SPK digital ini serta mentransfer uang muka (DP 50%). DP bersifat non-refundable karena slot tanggal telah diblokir secara eksklusif (1 pengantin per hari).

2. Pelunasan Pembayaran:
Sisa pelunasan (50%) wajib diselesaikan selambat-lambatnya H-7 sebelum hari acara pernikahan melalui metode transfer resmi studio Jenni Khoe MUA.

3. Ketepatan Waktu & Kesiapan Lokasi:
PIHAK PERTAMA akan hadir tepat waktu sesuai jam mulai rias yang telah dikunci. PIHAK KEDUA diharapkan telah menyiapkan ruangan steril dengan pencahayaan dan pendingin ruangan yang memadai, serta wajah bersih tanpa skincare berminyak tebal.

4. Kebijakan Reschedule:
Perubahan tanggal acara hanya dapat dilakukan apabila slot baru pada kalender PIHAK PERTAMA masih tersedia, dengan pemberitahuan konfirmasi tertulis minimal 30 hari kalender sebelum tanggal awal yang disepakati.

5. Jaminan Mutu & Higienitas:
Seluruh peralatan, spons, dan kuas rias telah melalui proses sterilisasi higienis medis dan menggunakan kosmetik luxury internasional original berkualitas tinggi.`}
          </div>
        </div>

        {/* Digital Signatures Block */}
        <div className="pt-4 border-t border-gray-200">
          <p className="text-[11px] text-gray-500 mb-4 text-center italic">
            Demikian Surat Perjanjian Kerja (SPK) ini disepakati secara digital dan memiliki kekuatan pembuktian hukum yang sah bagi kedua belah pihak.
          </p>

          <div className="grid grid-cols-2 gap-6 text-center text-xs">
            {/* Pihak Pertama */}
            <div className="space-y-2 flex flex-col items-center">
              <p className="font-semibold text-gray-600">PIHAK PERTAMA</p>
              <div className="h-24 w-full flex items-center justify-center border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                <div className="text-center font-serif text-emerald-800 italic">
                  <p className="font-bold">Jenni Khoe</p>
                  <p className="text-[10px] text-gray-400 font-sans not-italic">Official Signature</p>
                </div>
              </div>
              <p className="font-bold text-gray-900 border-t border-gray-200 pt-1 w-44">
                Jenni Khoe MUA
              </p>
            </div>

            {/* Pihak Kedua */}
            <div className="space-y-2 flex flex-col items-center">
              <p className="font-semibold text-gray-600">PIHAK KEDUA (PENGANTIN)</p>
              <div className="h-24 w-full flex items-center justify-center border border-dashed border-gray-200 rounded-xl bg-gray-50/50 p-1">
                {contract.client_signature_data ? (
                  <img
                    src={contract.client_signature_data}
                    alt="Tanda Tangan Digital Klien"
                    className="max-h-20 object-contain"
                  />
                ) : (
                  <span className="text-[11px] text-gray-400 italic">
                    [ Tanda Tangan Digital Tersimpan ]
                  </span>
                )}
              </div>
              <p className="font-bold text-gray-900 border-t border-gray-200 pt-1 w-44">
                {contract.client_name}
              </p>
              <p className="text-[10px] text-gray-400 font-mono">
                Ditandatangani: {formattedSignedAt}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
