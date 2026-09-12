"use client";

import { useState, useEffect, useRef, use } from "react";
import Link from "next/link";
import SignatureCanvas from "@/components/SignatureCanvas";

interface DealData {
  id: number;
  booking_id?: number | null;
  name: string;
  phone: string;
  email: string | null;
  deal_date: string | null;
  deal_time: string | null;
  venue: string | null;
  service_package: string;
  status: string;
  spk_number: string | null;
  terms_accepted: boolean;
  client_signature: string | null;
  signed_at: string | null;
  payment_method?: string | null;
  payment_status?: string | null;
  spk_tnc?: { title: string; content: string } | null;
}

export default function CustomerBookingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [deal, setDeal] = useState<DealData | null>(null);

  // Wizard Step: 1 = Form, 2 = T&C / SPK, 3 = Payment
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1 Form States
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [venue, setVenue] = useState("");
  const [email, setEmail] = useState("");
  const [savingStep1, setSavingStep1] = useState(false);

  // Step 2 SPK States
  const [spkTnc, setSpkTnc] = useState<{ title: string; content: string } | null>(null);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [signing, setSigning] = useState(false);
  const [spkError, setSpkError] = useState<string | null>(null);
  const tncScrollRef = useRef<HTMLDivElement>(null);

  const handleTncScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollTop + clientHeight >= scrollHeight - 35) {
      setHasScrolledToBottom(true);
    }
  };

  const scrollToBottomTnc = () => {
    if (tncScrollRef.current) {
      tncScrollRef.current.scrollTo({
        top: tncScrollRef.current.scrollHeight,
        behavior: "smooth",
      });
      setTimeout(() => {
        setHasScrolledToBottom(true);
      }, 350);
    }
  };

  // Auto-unlock if T&C content is short enough that no scrollbar is needed
  useEffect(() => {
    if (step === 2 && tncScrollRef.current) {
      const el = tncScrollRef.current;
      if (el.scrollHeight <= el.clientHeight + 25) {
        setHasScrolledToBottom(true);
      }
    }
  }, [step, spkTnc]);

  // Step 3 Payment States
  const [selectedMethod, setSelectedMethod] = useState<"belum_bayar" | "transfer" | "qris" | "kartu_kredit">("belum_bayar");
  const [updatingPayment, setUpdatingPayment] = useState(false);
  const [copiedBca, setCopiedBca] = useState(false);

  useEffect(() => {
    const fetchDeal = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/booking/${token}`);
        const json = await res.json();
        if (json.success && json.data) {
          setDeal(json.data);
          if (json.data.spk_tnc) {
            setSpkTnc(json.data.spk_tnc);
          }
          setName(json.data.name || "");
          setPhone(json.data.phone || "");
          setVenue(json.data.venue || "");
          setEmail(json.data.email || "");

          if (
            json.data.payment_method &&
            ["transfer", "qris", "kartu_kredit"].includes(json.data.payment_method)
          ) {
            setSelectedMethod(json.data.payment_method);
          } else {
            setSelectedMethod("belum_bayar");
          }

          // If already signed, jump directly to step 3 ONLY if both terms_accepted AND client_signature exist
          const hasValidSignature = Boolean(
            json.data.terms_accepted &&
            (json.data.client_signature || json.data.signed_at)
          );
          if (hasValidSignature || json.data.status === "dp_paid" || json.data.status === "confirmed") {
            setStep(3);
          } else if (json.data.status === "form_submitted" || json.data.status === "spk_signed") {
            setStep(2);
          } else {
            setStep(1);
          }
        } else {
          setErrorMsg(json.message || "Tautan reservasi tidak ditemukan atau telah kedaluwarsa.");
        }
      } catch (err) {
        console.error("Error fetching deal:", err);
        setErrorMsg("Terjadi kesalahan jaringan saat memuat formulir reservasi.");
      } finally {
        setLoading(false);
      }
    };

    fetchDeal();
  }, [token]);

  // Step 1 Submit
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!venue.trim()) {
      alert("Mohon isi lokasi atau nama venue acara Anda.");
      return;
    }

    try {
      setSavingStep1(true);
      const res = await fetch(`/api/booking/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          venue,
          email,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setDeal(json.data);
        setStep(2);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        alert(json.message || "Gagal menyimpan formulir");
      }
    } catch (err) {
      console.error("Step 1 submit error:", err);
      alert("Terjadi kesalahan sistem saat menyimpan formulir.");
    } finally {
      setSavingStep1(false);
    }
  };

  // Strict Guard: SPK is completed only when terms are checked AND signature exists
  const isSpkCompleted = Boolean(
    (deal?.terms_accepted && (deal?.client_signature || deal?.signed_at)) ||
    (termsAccepted && signatureData && signatureData.trim().length > 0)
  );

  // Automatically prevent viewing step 3 if SPK was not signed
  useEffect(() => {
    if (step === 3 && deal && !isSpkCompleted && deal.status !== "dp_paid" && deal.status !== "confirmed") {
      setStep(2);
    }
  }, [step, deal, isSpkCompleted]);

  // Step 2 Submit: Sign SPK
  const handleSignSpk = async () => {
    setSpkError(null);
    if (!hasScrolledToBottom) {
      setSpkError("Anda wajib membaca dan men-scroll klausul SPK sampai ke bagian paling bawah terlebih dahulu.");
      return;
    }
    if (!termsAccepted) {
      setSpkError("Anda wajib mencentang persetujuan Syarat & Ketentuan SPK.");
      return;
    }
    if (!signatureData || signatureData.trim().length === 0) {
      setSpkError("Silakan goreskan tanda tangan digital Anda pada area kanvas di bawah.");
      return;
    }

    try {
      setSigning(true);
      const res = await fetch(`/api/booking/${token}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signature_data: signatureData,
          terms_accepted: true,
          terms_content: spkTnc?.content || null,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setDeal(json.data);
        setStep(3);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setSpkError(json.message || "Gagal memproses tanda tangan SPK");
      }
    } catch (err) {
      console.error("Sign error:", err);
      setSpkError("Terjadi gangguan jaringan saat menyimpan tanda tangan SPK.");
    } finally {
      setSigning(false);
    }
  };

  // Trigger payment method selection
  const handleSelectPaymentMethod = async (method: "transfer" | "qris" | "kartu_kredit") => {
    if (!isSpkCompleted) {
      alert("Anda wajib menyetujui T&C dan membubuhkan tanda tangan digital pada SPK terlebih dahulu.");
      setStep(2);
      return;
    }
    try {
      setUpdatingPayment(true);
      const res = await fetch(`/api/booking/${token}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_method: method }),
      });
      const json = await res.json();
      if (json.success) {
        setSelectedMethod(method);
        if (json.data) {
          setDeal(json.data);
        }
      } else {
        alert(json.message || "Gagal memilih metode pembayaran");
      }
    } catch (err) {
      console.error("Payment method error:", err);
    } finally {
      setUpdatingPayment(false);
    }
  };

  const copyBcaAccount = () => {
    navigator.clipboard.writeText("5271890231");
    setCopiedBca(true);
    setTimeout(() => setCopiedBca(false), 2000);
  };

  const getWhatsAppPaymentLink = () => {
    const spkNo = deal?.spk_number || "SPK-JKM";
    const dateFormatted = deal?.deal_date
      ? new Date(deal.deal_date).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "-";

    const methodName =
      selectedMethod === "transfer"
        ? "Transfer Bank BCA"
        : selectedMethod === "qris"
        ? "QRIS / E-Wallet"
        : "Kartu Kredit";

    const msg = `Halo Kak Jenni Khoe, saya ${name} (${phone}) telah menandatangani SPK digital resmi (No. ${spkNo}) untuk jadwal acara ${dateFormatted} jam ${deal?.deal_time || "-"} di ${venue}.\n\nSaya telah memilih metode pembayaran DP: *${methodName}*. Berikut saya lampirkan bukti pembayarannya ya Kak. Mohon dikonfirmasi dan diverifikasi kuitansi resminya. Terima kasih! ✨`;

    return `https://wa.me/6281280775443?text=${encodeURIComponent(msg)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-luxury-pearl flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-3 border-luxury-rose-gold border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-serif text-sm text-luxury-charcoal">Memuat Formulir Reservasi Resmi...</p>
        </div>
      </div>
    );
  }

  if (errorMsg || !deal) {
    return (
      <div className="min-h-screen bg-luxury-pearl flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-gray-100 shadow-xl text-center space-y-4">
          <span className="text-4xl">⚠️</span>
          <h2 className="font-serif text-xl font-bold text-luxury-charcoal">Tautan Tidak Valid</h2>
          <p className="text-xs text-gray-500 leading-relaxed">{errorMsg}</p>
          <a
            href="/"
            className="inline-block px-5 py-2.5 bg-luxury-charcoal text-white text-xs font-semibold rounded-xl hover:bg-black transition-colors"
          >
            Kembali ke Beranda
          </a>
        </div>
      </div>
    );
  }

  const formattedDealDate = deal.deal_date
    ? new Date(deal.deal_date).toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Belum ditentukan admin";

  return (
    <div className="min-h-screen bg-[#FAF8F5] py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-1">
          <span className="text-xs tracking-[0.25em] font-medium text-luxury-rose-gold uppercase">
            Official Client Onboarding
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-luxury-charcoal">
            Jenni Khoe Makeup Artist
          </h1>
          <p className="text-xs text-luxury-deep-slate/70">
            Formulir Reservasi, Penguncian Jadwal, & Penerbitan SPK Digital
          </p>
        </div>

        {/* Stepper Indicator */}
        <div className="bg-white rounded-2xl p-4 border border-luxury-champagne/40 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                step >= 1
                  ? "bg-luxury-rose-gold text-white"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              1
            </span>
            <span
              className={`text-xs font-medium ${
                step === 1 ? "text-luxury-charcoal font-bold" : "text-gray-400"
              }`}
            >
              Formulir Acara
            </span>
          </div>

          <div className="h-0.5 flex-1 mx-3 bg-luxury-champagne/40" />

          <div className="flex items-center gap-2">
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                step >= 2
                  ? "bg-luxury-rose-gold text-white"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              2
            </span>
            <span
              className={`text-xs font-medium ${
                step === 2 ? "text-luxury-charcoal font-bold" : "text-gray-400"
              }`}
            >
              T&C & SPK Digital
            </span>
          </div>

          <div className="h-0.5 flex-1 mx-3 bg-luxury-champagne/40" />

          <div className="flex items-center gap-2">
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                step === 3
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              3
            </span>
            <span
              className={`text-xs font-medium ${
                step === 3 ? "text-luxury-charcoal font-bold" : "text-gray-400"
              }`}
            >
              Pembayaran DP
            </span>
          </div>
        </div>

        {/* STEP 1: FORMULIR DATA ACARA */}
        {step === 1 && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-luxury-champagne/50 shadow-md space-y-6">
            <div className="border-b border-gray-100 pb-4">
              <h2 className="font-serif text-lg sm:text-xl font-bold text-luxury-charcoal">
                Langkah 1: Konfirmasi Detail Acara
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Jadwal tanggal dan jam telah dikunci secara resmi oleh Jenni Khoe MUA sesuai kesepakatan.
              </p>
            </div>

            {/* Banner Jadwal Terkunci */}
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3">
              <span className="text-xl">🔒</span>
              <div className="text-xs space-y-0.5">
                <p className="font-semibold text-amber-900">
                  Jadwal Privat Eksklusif Telah Dikunci
                </p>
                <p className="text-amber-800/80 leading-relaxed">
                  Slot tanggal dan jam berikut telah diset langsung oleh tim Jenni Khoe MUA dan tidak dapat diubah agar menjamin ketersediaan jadwal riasan Anda.
                </p>
              </div>
            </div>

            <form onSubmit={handleStep1Submit} className="space-y-4 text-xs">
              {/* Tanggal Acara Terkunci */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1 flex items-center justify-between">
                  <span>Tanggal Acara Riasan</span>
                  <span className="text-[10px] text-amber-700 font-medium bg-amber-100/70 px-2 py-0.5 rounded">
                    🔒 Terkunci oleh Admin
                  </span>
                </label>
                <input
                  type="text"
                  value={formattedDealDate}
                  disabled
                  readOnly
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-100 font-semibold text-luxury-charcoal cursor-not-allowed select-none"
                />
              </div>

              {/* Jam Deal Terkunci */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1 flex items-center justify-between">
                  <span>Waktu / Jam Mulai Rias</span>
                  <span className="text-[10px] text-amber-700 font-medium bg-amber-100/70 px-2 py-0.5 rounded">
                    🔒 Terkunci oleh Admin
                  </span>
                </label>
                <input
                  type="text"
                  value={deal.deal_time || "06:00 WIB (Standby)"}
                  disabled
                  readOnly
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-100 font-semibold text-luxury-charcoal cursor-not-allowed select-none"
                />
              </div>

              {/* Paket Riasan */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Paket Layanan
                </label>
                <input
                  type="text"
                  value={deal.service_package || "Bridal Makeup Exclusive"}
                  disabled
                  readOnly
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 cursor-not-allowed"
                />
              </div>

              {/* Nama Lengkap */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Nama Lengkap Calon Pengantin / Klien <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama lengkap sesuai identitas"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-luxury-rose-gold text-gray-800"
                />
              </div>

              {/* Nomor WhatsApp */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Nomor WhatsApp Aktif <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0812xxxx"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-luxury-rose-gold text-gray-800 font-mono"
                />
              </div>

              {/* Lokasi / Venue Acara */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Lokasi / Venue Acara (Hotel, Gedung, atau Alamat Rumah) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  placeholder="Contoh: Hotel Mulia Senayan, Grand Ballroom Lt. 2, Jakarta"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-luxury-rose-gold text-gray-800"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  Harap sebutkan nama hotel, gedung, atau alamat lengkap tempat MUA merias.
                </p>
              </div>

              {/* Email (Opsional) */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Alamat Email (Opsional untuk Salinan SPK)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-luxury-rose-gold text-gray-800"
                />
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={savingStep1}
                  className="w-full py-3 px-6 rounded-xl bg-luxury-charcoal hover:bg-black text-white font-medium text-xs transition-all shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>{savingStep1 ? "Menyimpan Data..." : "Lanjut ke Syarat & Ketentuan SPK"}</span>
                  <span>👉</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 2: T&C DAN TANDA TANGAN SPK DIGITAL */}
        {step === 2 && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-luxury-champagne/50 shadow-md space-y-6">
            <div className="border-b border-gray-100 pb-4 flex items-center justify-between">
              <div>
                <h2 className="font-serif text-lg sm:text-xl font-bold text-luxury-charcoal">
                  Langkah 2: Surat Perjanjian Kerja (SPK)
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Mohon baca klausul perjanjian resmi dan bubuhkan tanda tangan digital Anda di bawah.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs text-gray-400 hover:text-luxury-charcoal transition-colors underline cursor-pointer"
              >
                ← Ubah Data Acara
              </button>
            </div>

            {/* Dokumen SPK Kontrak Resmi */}
            <div
              ref={tncScrollRef}
              onScroll={handleTncScroll}
              className="bg-[#FCFAF7] border border-luxury-champagne/60 rounded-2xl p-5 sm:p-6 text-xs text-gray-800 space-y-4 max-h-[380px] overflow-y-auto shadow-inner leading-relaxed scroll-smooth relative"
            >
              <div className="text-center border-b border-gray-200 pb-3 space-y-1">
                <h3 className="font-serif font-bold text-sm text-luxury-charcoal uppercase tracking-wider">
                  SURAT PERJANJIAN KERJA (SPK)
                </h3>
                <p className="text-[11px] text-gray-500 font-mono">
                  LAYANAN RIAS PENGANTIN EKSKLUSIF JENNI KHOE MUA
                </p>
              </div>

              {/* Rincian Pihak */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3.5 rounded-xl border border-gray-200 text-[11px]">
                <div>
                  <p className="font-semibold text-gray-500 uppercase tracking-wider">PIHAK PERTAMA (MUA)</p>
                  <p className="font-bold text-luxury-charcoal mt-1">Jenni Khoe MUA</p>
                  <p className="text-gray-500">Professional Makeup Artist</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-500 uppercase tracking-wider">PIHAK KEDUA (KLIEN)</p>
                  <p className="font-bold text-luxury-charcoal mt-1">{name}</p>
                  <p className="text-gray-500">{phone}</p>
                </div>
              </div>

              {/* Ringkasan Jadwal Terkunci */}
              <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200/70 text-[11px] space-y-1">
                <p>
                  <strong>📅 Tanggal Acara:</strong> {formattedDealDate}
                </p>
                <p>
                  <strong>⏰ Jam Mulai Rias:</strong> {deal.deal_time || "06:00 WIB"}
                </p>
                <p>
                  <strong>📍 Lokasi / Venue:</strong> {venue}
                </p>
                <p>
                  <strong>💄 Paket Layanan:</strong> {deal.service_package || "Bridal Exclusive"}
                </p>
              </div>

              {/* Klausul T&C - Render dari Default T&C Admin (spk_tnc_settings) */}
              <div className="space-y-2.5 text-[11px] text-gray-700">
                <h4 className="font-bold text-luxury-charcoal">
                  {spkTnc?.title || "Pasal Ketentuan Layanan (T&C):"}
                </h4>
                {spkTnc?.content ? (
                  <div className="whitespace-pre-wrap leading-relaxed text-gray-700 text-[11px]">
                    {spkTnc.content}
                  </div>
                ) : (
                  <ol className="list-decimal pl-4 space-y-2">
                    <li>
                      <strong>Penguncian Slot Tanggal & Uang Muka (DP 50%):</strong> Jadwal riasan hanya dinyatakan sah terblokir setelah PIHAK KEDUA membubuhkan tanda tangan SPK digital ini serta mentransfer uang muka (DP 50%). DP bersifat non-refundable karena slot tanggal telah diblokir secara eksklusif (1 pengantin per hari).
                    </li>
                    <li>
                      <strong>Pelunasan Pembayaran:</strong> Sisa pelunasan (50%) wajib diselesaikan selambat-lambatnya H-7 sebelum hari acara pernikahan.
                    </li>
                    <li>
                      <strong>Ketepatan Waktu & Lokasi:</strong> PIHAK PERTAMA akan hadir tepat waktu sesuai jam mulai rias yang telah dikunci. PIHAK KEDUA diharapkan telah menyiapkan wajah bersih tanpa skincare berminyak tebal.
                    </li>
                    <li>
                      <strong>Kebijakan Reschedule:</strong> Perubahan tanggal acara hanya dapat dilakukan apabila slot baru pada kalender PIHAK PERTAMA masih tersedia, dengan konfirmasi minimal 30 hari sebelumnya.
                    </li>
                    <li>
                      <strong>Jaminan Mutu & Higienitas:</strong> Seluruh peralatan, spons, dan brush rias telah melalui proses sterilisasi medis dan menggunakan kosmetik luxury internasional original.
                    </li>
                  </ol>
                )}
              </div>

              {/* Penanda Akhir Dokumen SPK */}
              <div className="pt-4 border-t border-dashed border-gray-300 text-center text-[11px] text-gray-400">
                — Akhir Klausul Surat Perjanjian Kerja (SPK) —
              </div>
            </div>

            {/* Checkbox Persetujuan & Tanda Tangan: Muncul setelah T&C di-scroll sampai bawah */}
            {!hasScrolledToBottom ? (
              <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-900 shadow-2xs">
                <div className="flex items-start gap-2.5">
                  <span className="text-2xl mt-0.5">📜</span>
                  <div>
                    <p className="font-bold text-sm text-amber-950">
                      Mohon Scroll & Baca Seluruh Klausul SPK
                    </p>
                    <p className="text-[11px] text-amber-800/85 mt-0.5 leading-relaxed">
                      Kotak centang persetujuan serta area tanda tangan digital akan otomatis muncul setelah Anda membaca seluruh syarat & ketentuan di atas hingga baris terakhir.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={scrollToBottomTnc}
                  className="px-4 py-2 bg-luxury-charcoal hover:bg-black text-white text-xs font-semibold rounded-xl transition shadow-xs whitespace-nowrap cursor-pointer flex items-center gap-1.5 self-end sm:self-center"
                >
                  <span>Scroll ke Bawah</span>
                  <span>↓</span>
                </button>
              </div>
            ) : (
              <div className="space-y-5 animate-fade-in">
                <div className="flex items-center gap-2 text-emerald-700 text-xs font-semibold bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200/70 w-fit">
                  <span>✓</span>
                  <span>Seluruh klausul SPK telah dibaca & diverifikasi</span>
                </div>

                {/* Checkbox Persetujuan T&C */}
                <label className="flex items-start gap-3 cursor-pointer select-none bg-emerald-50/40 hover:bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 transition-all shadow-2xs">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-1 w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                  />
                  <span className="text-xs text-gray-800 leading-relaxed font-medium">
                    Saya telah membaca, memahami, dan menyetujui seluruh klausul Surat Perjanjian Kerja (SPK) serta Syarat & Ketentuan resmi Jenni Khoe MUA di atas secara sadar tanpa paksaan.
                  </span>
                </label>

                {/* Area Tanda Tangan Digital */}
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <SignatureCanvas
                    label="Goreskan Tanda Tangan Digital Anda:"
                    onSave={(dataUrl) => setSignatureData(dataUrl || null)}
                    height={160}
                  />
                  <p className="text-[10px] text-gray-400">
                    * Gunakan jari (pada layar sentuh HP) atau kursor mouse untuk menandatangani. Tanda tangan ini memiliki kekuatan persetujuan hukum digital yang sah.
                  </p>
                </div>
              </div>
            )}

            {spkError && (
              <div className="p-3.5 bg-red-50 text-red-700 rounded-xl text-xs border border-red-200 font-medium">
                {spkError}
              </div>
            )}

            <button
              type="button"
              onClick={handleSignSpk}
              disabled={signing || !hasScrolledToBottom || !termsAccepted || !signatureData}
              className={`w-full py-3.5 px-6 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-md ${
                !hasScrolledToBottom
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-300 shadow-none"
                  : !termsAccepted
                  ? "bg-amber-100 text-amber-700 cursor-not-allowed border border-amber-300 shadow-none"
                  : !signatureData
                  ? "bg-amber-100 text-amber-700 cursor-not-allowed border border-amber-300 shadow-none"
                  : "bg-luxury-charcoal hover:bg-black text-white cursor-pointer hover:shadow-lg"
              }`}
            >
              {signing ? (
                <span>Menyimpan SPK & Memproses...</span>
              ) : !hasScrolledToBottom ? (
                <span>Scroll SPK sampai bawah untuk melanjutkan</span>
              ) : !termsAccepted ? (
                <span>Wajib centang persetujuan SPK di atas</span>
              ) : !signatureData ? (
                <span>Wajib bubuhkan tanda tangan digital di atas</span>
              ) : (
                <>
                  <span>✓ Setujui SPK & Lanjut ke Pembayaran DP</span>
                  <span>👉</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* STEP 3: PEMBAYARAN DP & TRIGGER METODE PEMBAYARAN */}
        {step === 3 && (
          !isSpkCompleted ? (
            <div className="bg-white rounded-3xl p-8 border border-amber-200 text-center space-y-4 shadow-md">
              <div className="text-3xl">⚠️</div>
              <h3 className="font-serif text-lg font-bold text-gray-800">
                Persetujuan SPK Belum Lengkap
              </h3>
              <p className="text-xs text-gray-600 max-w-md mx-auto leading-relaxed">
                Anda belum menyetujui klausul SPK atau belum membubuhkan tanda tangan digital. Mohon lengkapi terlebih dahulu sebelum memilih metode pembayaran.
              </p>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-5 py-2.5 bg-luxury-charcoal hover:bg-black text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs transition"
              >
                ← Kembali ke Langkah 2 (T&C & SPK)
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-luxury-champagne/50 shadow-md space-y-6 animate-fade-in">
            {/* Header Sukses */}
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-2xl mx-auto shadow-xs">
                ✓
              </div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-luxury-charcoal">
                SPK Resmi Sah & Tersimpan di Sistem
              </h2>
              {deal.spk_number && (
                <p className="text-xs font-mono font-bold text-luxury-rose-gold bg-luxury-rose-gold/10 inline-block px-3 py-1 rounded-full">
                  Nomor SPK: {deal.spk_number}
                </p>
              )}
              <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
                Terima kasih Kak <strong>{name}</strong>. Jadwal telah dicatat di sistem booking kami. Silakan tentukan metode pembayaran uang muka (DP 50%) untuk mengunci tanggal acara secara permanen.
              </p>
            </div>

            {/* Ringkasan Reservasi */}
            <div className="bg-[#FCFAF7] border border-luxury-champagne/60 rounded-2xl p-4 sm:p-5 text-xs text-gray-800 space-y-2">
              <p className="font-semibold text-gray-500 uppercase tracking-wider text-[10px]">
                RINGKASAN RESERVASI TERDAFTAR
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                <div>
                  <span className="text-gray-400">Pengantin:</span>{" "}
                  <strong>{name}</strong>
                </div>
                <div>
                  <span className="text-gray-400">WhatsApp:</span>{" "}
                  <strong className="font-mono">{phone}</strong>
                </div>
                <div>
                  <span className="text-gray-400">Tanggal Acara:</span>{" "}
                  <strong>{formattedDealDate}</strong>
                </div>
                <div>
                  <span className="text-gray-400">Jam Rias:</span>{" "}
                  <strong>{deal.deal_time || "06:00 WIB"}</strong>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-gray-400">Lokasi Venue:</span>{" "}
                  <strong>{venue}</strong>
                </div>
              </div>
            </div>

            {/* JIKA PEMBAYARAN TELAH LUNAS / DIKONFIRMASI */}
            {deal.payment_status === "confirmed" || deal.payment_status === "success" || deal.status === "dp_paid" || deal.status === "confirmed" ? (
              <div className="bg-emerald-50 border border-emerald-300 rounded-3xl p-6 sm:p-8 text-center space-y-4 animate-fade-in shadow-xs">
                <div className="w-14 h-14 bg-emerald-600 text-white rounded-full flex items-center justify-center text-2xl mx-auto shadow-sm">
                  ✓
                </div>
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold tracking-wider px-3 py-1 bg-emerald-600 text-white rounded-full uppercase">
                    Pembayaran DP Lunas & Terverifikasi
                  </span>
                  <h3 className="font-serif text-xl font-bold text-emerald-950 pt-2">
                    Jadwal Rias Anda Resmi Terkunci di Kalender
                  </h3>
                  <p className="text-xs text-emerald-800/90 max-w-md mx-auto leading-relaxed">
                    Terima kasih Kak <strong>{name}</strong>! Uang muka telah berhasil kami terima. Dokumen bukti pembayaran resmi (Invoice) dan Surat Perjanjian Kerja (SPK) siap Anda unduh di bawah ini.
                  </p>
                </div>

                {/* Document Action Buttons */}
                <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link
                    href={`/invoice/${deal.booking_id || deal.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto px-6 py-3 bg-luxury-charcoal hover:bg-black text-white text-xs font-semibold rounded-xl transition shadow-md flex items-center justify-center gap-2"
                  >
                    <span>🧾</span>
                    <span>Download / Cetak Invoice Resmi (PDF)</span>
                  </Link>

                  <Link
                    href={`/spk/${deal.booking_id || deal.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto px-6 py-3 bg-white border border-gray-300 text-gray-800 hover:bg-gray-50 text-xs font-semibold rounded-xl transition shadow-xs flex items-center justify-center gap-2"
                  >
                    <span>📜</span>
                    <span>Lihat Dokumen SPK Sah (PDF)</span>
                  </Link>
                </div>

                <div className="pt-2 border-t border-emerald-200/60">
                  <a
                    href={getWhatsAppPaymentLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 hover:underline"
                  >
                    <span>💬</span>
                    <span>Hubungi Tim Konsultasi Jenni Khoe MUA via WhatsApp</span>
                  </a>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
{/* Pilihan Metode Pembayaran (Triggered by Button — Rekening tidak langsung muncul) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif font-bold text-sm text-luxury-charcoal">
                    Pilih Metode Pembayaran DP
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Pilih metode di bawah untuk membuka rincian nomor rekening atau panduan pembayaran:
                  </p>
                </div>
                {selectedMethod !== "belum_bayar" && (
                  <button
                    type="button"
                    onClick={() => setSelectedMethod("belum_bayar")}
                    className="text-[11px] text-luxury-rose-gold hover:underline cursor-pointer"
                  >
                    Ganti Metode ↻
                  </button>
                )}
              </div>

              {/* 3 Tombol Opsi Pembayaran */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. Transfer Bank */}
                <button
                  type="button"
                  onClick={() => handleSelectPaymentMethod("transfer")}
                  disabled={updatingPayment}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                    selectedMethod === "transfer"
                      ? "border-blue-600 bg-blue-50/50 shadow-xs ring-1 ring-blue-500"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-2xl">🏦</span>
                    {selectedMethod === "transfer" && (
                      <span className="text-[10px] bg-blue-600 text-white font-bold px-2 py-0.5 rounded-full">
                        Terpilih
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-xs text-gray-900">Transfer Bank (BCA)</p>
                    <p className="text-[10px] text-gray-500 mt-0.5 leading-snug">
                      m-Banking, KlikBCA, atau ATM
                    </p>
                  </div>
                </button>

                {/* 2. QRIS */}
                <button
                  type="button"
                  onClick={() => handleSelectPaymentMethod("qris")}
                  disabled={updatingPayment}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                    selectedMethod === "qris"
                      ? "border-purple-600 bg-purple-50/50 shadow-xs ring-1 ring-purple-500"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-2xl">📱</span>
                    {selectedMethod === "qris" && (
                      <span className="text-[10px] bg-purple-600 text-white font-bold px-2 py-0.5 rounded-full">
                        Terpilih
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-xs text-gray-900">QRIS / E-Wallet</p>
                    <p className="text-[10px] text-gray-500 mt-0.5 leading-snug">
                      GoPay, OVO, Dana, ShopeePay
                    </p>
                  </div>
                </button>

                {/* 3. Kartu Kredit */}
                <button
                  type="button"
                  onClick={() => handleSelectPaymentMethod("kartu_kredit")}
                  disabled={updatingPayment}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                    selectedMethod === "kartu_kredit"
                      ? "border-indigo-600 bg-indigo-50/50 shadow-xs ring-1 ring-indigo-500"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-2xl">💳</span>
                    {selectedMethod === "kartu_kredit" && (
                      <span className="text-[10px] bg-indigo-600 text-white font-bold px-2 py-0.5 rounded-full">
                        Terpilih
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-xs text-gray-900">Kartu Kredit</p>
                    <p className="text-[10px] text-gray-500 mt-0.5 leading-snug">
                      Visa, Mastercard, Online
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* JIKA BELUM PILIH METODE (Status: Belum Bayar) */}
            {selectedMethod === "belum_bayar" && (
              <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 flex items-start gap-3">
                <span className="text-xl">⚠️</span>
                <div>
                  <p className="font-bold">Status Pembayaran: Belum Memilih Metode</p>
                  <p className="text-[11px] text-amber-800/80 mt-0.5">
                    Klik salah satu tombol opsi pembayaran di atas (Transfer Bank, QRIS, atau Kartu Kredit) untuk melihat instruksi dan nomor rekening pembayaran uang muka Anda.
                  </p>
                </div>
              </div>
            )}

            {/* JIKA MEMILIH TRANSFER BANK (BCA) -> REKENING BARU DITAMPILKAN */}
            {selectedMethod === "transfer" && (
              <div className="bg-blue-50/60 border border-blue-200/90 rounded-2xl p-5 space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold text-blue-900 uppercase tracking-wider">
                    🏦 REKENING RESMI PEMBAYARAN DP (BCA)
                  </p>
                  <span className="text-[10px] text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-md font-medium">
                    Metode: Transfer Bank
                  </span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-blue-100 flex items-center justify-between gap-4 shadow-2xs">
                  <div>
                    <p className="text-[11px] text-gray-400">Bank Central Asia (BCA)</p>
                    <p className="font-mono text-xl font-bold text-gray-900 tracking-wider">
                      5271 8902 31
                    </p>
                    <p className="text-xs font-medium text-gray-600 mt-0.5">
                      a/n <strong>JENNI KHOE</strong>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={copyBcaAccount}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer"
                  >
                    {copiedBca ? "✓ Tersalin!" : "📋 Salin Rekening"}
                  </button>
                </div>

                <p className="text-[11px] text-gray-600 leading-relaxed italic">
                  * Harap cantumkan berita transfer: <strong className="font-mono">DP {name.slice(0, 10)} {deal.deal_date ? deal.deal_date.slice(5) : ""}</strong>.
                </p>

                <a
                  href={getWhatsAppPaymentLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-all shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>💬</span>
                  <span>Kirim Bukti Transfer BCA ke WhatsApp Resmi Jenni Khoe ✨</span>
                </a>
              </div>
            )}

            {/* JIKA MEMILIH QRIS */}
            {selectedMethod === "qris" && (
              <div className="bg-purple-50/60 border border-purple-200/90 rounded-2xl p-5 space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold text-purple-900 uppercase tracking-wider">
                    📱 PEMBAYARAN VIA QRIS / E-WALLET
                  </p>
                  <span className="text-[10px] text-purple-700 bg-purple-100/70 px-2 py-0.5 rounded-md font-medium">
                    Metode: QRIS
                  </span>
                </div>

                <div className="bg-white p-5 rounded-xl border border-purple-100 text-center space-y-3 shadow-2xs">
                  <div className="w-40 h-40 bg-gray-100 border-2 border-dashed border-purple-300 rounded-xl mx-auto flex flex-col items-center justify-center p-3 text-purple-900">
                    <span className="text-3xl">🔲</span>
                    <span className="text-[10px] font-bold mt-1">QRIS JENNI KHOE</span>
                    <span className="text-[9px] text-gray-500">NMID: ID102030405060</span>
                  </div>
                  <p className="text-xs text-gray-700 font-medium">
                    Scan QRIS di atas menggunakan m-BCA, GoPay, OVO, Dana, ShopeePay, atau aplikasi QRIS lainnya.
                  </p>
                </div>

                <a
                  href={getWhatsAppPaymentLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-all shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>💬</span>
                  <span>Kirim Bukti Pembayaran QRIS ke WhatsApp Resmi Jenni Khoe ✨</span>
                </a>
              </div>
            )}

            {/* JIKA MEMILIH KARTU KREDIT */}
            {selectedMethod === "kartu_kredit" && (
              <div className="bg-indigo-50/60 border border-indigo-200/90 rounded-2xl p-5 space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider">
                    💳 PEMBAYARAN VIA KARTU KREDIT / DEBIT ONLINE
                  </p>
                  <span className="text-[10px] text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded-md font-medium">
                    Metode: Kartu Kredit
                  </span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-indigo-100 space-y-2 shadow-2xs text-xs text-gray-700">
                  <p className="font-semibold text-indigo-950">
                    Tautan Pembayaran Invoice Digital Aman (3D Secure)
                  </p>
                  <p className="text-[11px] text-gray-600 leading-relaxed">
                    Pembayaran kartu kredit diproses melalui invoice digital resmi Jenni Khoe MUA. Silakan klik tombol di bawah untuk meminta tautan pembayaran invoice melalui WhatsApp kami.
                  </p>
                </div>

                <a
                  href={getWhatsAppPaymentLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-all shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>💬</span>
                  <span>Minta Invoice Pembayaran Kartu Kredit via WhatsApp ✨</span>
                </a>
              </div>
            )}

              </div>
            )}
            </div>
          )
        )}
      </div>
    </div>
  );
}
