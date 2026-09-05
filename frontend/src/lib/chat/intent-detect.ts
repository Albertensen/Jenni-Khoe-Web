export type Intent =
  | 'greeting'
  | 'faq_package'
  | 'faq_price'
  | 'availability_check'
  | 'booking_intent'
  | 'complaint'
  | 'spam'
  | 'general';

const patterns: Record<Intent, RegExp[]> = {
  greeting: [/\b(halo|hai|hi|hey|hello|pagi|siang|sore|malam|selamat|assalamualaikum)\b/i],
  faq_package: [/\b(paket|bridal|makeup|rias|pengantin|wisuda|graduation|party|trial)\b/i],
  faq_price: [/\b(harga|price|cost|biaya|mahal|murah|berapa|tarif)\b/i],
  availability_check: [/\b(cek|jadwal|tanggal|tersedia|available|ketersediaan|date|schedule|kosong|book\s*ed)\b/i],
  booking_intent: [/\b(booking|pesan|daftar|reservasi|dp|down\s*payment|lock|bayar|pendaftaran)\b/i],
  complaint: [/\b(kecewa|komplain|rusak|cancel|gagal|batal|refund|error|tidak\s*puas)\b/i],
  spam: [/\b(buy|follow|click|link|free|promo|discount|dapatkan|gratis|\+\d{10,})\b/i],
  general: [],
};

export function detectIntent(message: string): Intent {
  const msg = message.toLowerCase().trim();

  // Escalate: complaint and booking_intent take priority
  if (patterns.complaint.some((r) => r.test(msg))) return 'complaint';
  if (patterns.spam.some((r) => r.test(msg))) return 'spam';

  const greetings = patterns.greeting.some((r) => r.test(msg));
  const booking = patterns.booking_intent.some((r) => r.test(msg));
  const avail = patterns.availability_check.some((r) => r.test(msg));
  const price = patterns.faq_price.some((r) => r.test(msg));
  const pkg = patterns.faq_package.some((r) => r.test(msg));

  if (booking) return 'booking_intent';
  if (avail) return 'availability_check';
  if (price) return 'faq_price';
  if (pkg) return 'faq_package';
  if (greetings) return 'greeting';

  return 'general';
}
