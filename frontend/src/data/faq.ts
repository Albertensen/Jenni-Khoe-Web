// FAQ knowledge base — Jenni Khoe MUA
export interface FAQ {
  question: string;
  answer: string;
  keywords: string[];
}

export const faqs: FAQ[] = [
  {
    question: "Berapa harga paket riasan pengantin?",
    answer: "Paket riasan pengantin mulai dari Rp 3.500.000 (bridal basic) hingga Rp 8.500.000 (bridal premium + trial). Detail harga lengkap bisa dicek di halaman Portfolio atau langsung chat Kak Jenni.",
    keywords: ["harga", "price", "cost", "paket", "bridal", "mahal", "murah", "biaya"],
  },
  {
    question: "Apakah ada trial makeup?",
    answer: "Ya! Setiap paket bridal premium sudah termasuk 1x trial makeup. Trial bisa dilakukan H-7 hari sebelum hari H di studio Kak Jenni. Hasil trial akan didokumentasikan agar look di hari-H presisi.",
    keywords: ["trial", "coba", "rehearsal", "preview", "test"],
  },
  {
    question: "Berapa lama proses makeup?",
    answer: "Makeup pengantin reguler 60-90 menit. Makeup premium + hair do 90-120 menit. Untuk rombongan (pengiring), estimasi 30-45 menit per orang.",
    keywords: ["lama", "duration", "waktu", "cepat", "jam", "proses", "estimasi"],
  },
  {
    question: "Apakah Kak Jenni bisa makeup di luar kota?",
    answer: "Ya! Kak Jenni melayani makeup on-location untuk area Jabodetabek. Untuk luar kota ada biaya transportasi + akomodasi. Silakan chat WhatsApp untuk detail lebih lanjut.",
    keywords: ["luar kota", "out of town", "location", "on location", "coming", "datang", "venue", "luar daerah"],
  },
  {
    question: "Produk makeup apa yang digunakan?",
    answer: "Kak Jenni menggunakan produk profesional premium seperti Make Up For Ever, NARS, Charlotte Tilbury, Hourglass, dan Huda Beauty. Semua tools dibersihkan dan disterilkan setelah setiap pemakaian.",
    keywords: ["produk", "product", "brand", "merk", "kosmetik", "makeup", "brand", "merek"],
  },
  {
    question: "Apakah ada paket untuk wisuda / pesta?",
    answer: "Ada! Paket Graduation & Party Makeup mulai Rp 750.000 (makeup only) hingga Rp 1.500.000 (makeup + hair do). Termasuk lashes dan touch-up kit mini.",
    keywords: ["wisuda", "graduation", "party", "pesta", "event", "non bridal", "sweet seventeen", "birthday"],
  },
  {
    question: "Bagaimana cara booking?",
    answer: "Cek dulu ketersediaan tanggal via form 'Cek Jadwal' di website, lalu konfirmasi via WhatsApp Kak Jenni. DP 50% untuk lock date. Sisa pelunasan H-7 sebelum hari-H.",
    keywords: ["booking", "reservasi", "pesan", "daftar", "dp", "down payment", "lock date", "bayar"],
  },
  {
    question: "Apakah Kak Jenni bisa makeup untuk ibu dan pengiring?",
    answer: "Tentu! Kak Jenni menyediakan paket makeup untuk ibu, mertua, dan pengiring (bridesmaid). Diskon khusus untuk rombongan 5+ orang. Cek halaman Portofolio untuk detail.",
    keywords: ["ibu", "mother", "mertua", "pengiring", "bridesmaid", "rombongan", "family", "keluarga"],
  },
  {
    question: "Apakah tersedia sesi foto sebelum acara?",
    answer: "Ya, Kak Jenni bisa koordinasi dengan fotografer langganan untuk sesi foto getting-ready. Momen pre-wedding natural dengan riasan fresh sangat recommended agar hasil maksimal.",
    keywords: ["foto", "photo", "sesi", "getting ready", "pre wedding", "dokumentasi"],
  },
];

export function searchFAQ(query: string): FAQ[] {
  const q = query.toLowerCase();
  return faqs
    .filter((f) => f.keywords.some((kw) => q.includes(kw)))
    .slice(0, 3);
}

export function getFallbackResponse(): string {
  return "Maaf, Kak Jenni belum bisa menjawab pertanyaan itu secara otomatis. Silakan tinggalkan pesan via WhatsApp agar direspon langsung oleh Kak Jenni ya..";
}
