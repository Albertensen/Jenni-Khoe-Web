import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { detectIntent } from '@/lib/chat/intent-detect';
import { checkRateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

const DEFAULT_PRESET = {
  model_provider: 'combo-utama',
  model_name: 'COMBO-UTAMA',
  api_base_url: 'http://localhost:20128/v1',
  api_key: 'sk-f6d23bb7bbd0260e-v9p3lm-e4eadc94',
  temperature: 0.7,
  max_tokens: 350,
  system_prompt: 'Anda adalah Customer Service & Virtual Assistant resmi untuk Jenni Khoe Makeup Artist (MUA Haute Couture & Luxury Bridal Specialist). Kepribadian: Sopan, hangat, profesional, bernuansa luxury (panggil klien dengan "Kak"). Tugas utama: Membantu calon pengantin konsultasi riasan, cek ketersediaan tanggal, jelaskan paket, dan arahkan booking privat.',
  rules: '1. Selalu sapa calon pengantin dengan sebutan "Kak" yang ramah.\n2. Jika klien menanyakan jadwal, catat tanggal acara, lokasi/venue, dan jam acara.\n3. JANGAN PERNAH menanyakan ulang tanggal/lokasi/jam yang SUDAH dijawab klien di riwayat chat sebelumnya.\n4. Jika tanggal, lokasi, dan jam sudah diketahui, LANGSUNG konfirmasi ketersediaan slot (slot tersedia) dan tanyakan jenis acara / jumlah orang atau arahkan lock tanggal ke WhatsApp.\n5. Jika klien siap booking atau ingin lock tanggal, minta nama & nomor WhatsApp atau arahkan ke WhatsApp resmi.',
  greeting_message: 'Halo Kak! Selamat datang di Jenni Khoe MUA. Saya asisten virtual Jenni Khoe, siap membantu konsultasi jadwal, rekomendasi riasan, paket bridal, dan booking privat untuk hari bahagia Kakak.',
  whatsapp_number: '6281234567890',
  whatsapp_text_template: 'Halo Kak Jenni Khoe, saya ingin konsultasi booking jadwal makeup.',
  packages_info: 'Paket Utama Jenni Khoe MUA:\n1. Luxury Royal Bridal: Rp 12.000.000 (Makeup & Hairdo Pengantin Akad + Resepsi, Retouch stand by, Free Mother of the Bride, Flawless complexion 18 jam, Premium false lashes & skin prep luxury).\n2. Intimate / Holy Matrimony: Rp 7.500.000 (Makeup & Hairdo Pengantin 1 sesi, Natural radiant finish, Free touch-up kit).\n3. Engagement / Prewedding: Rp 4.500.000 (Makeup & Hairdo 1 look glam / natural, Touch-up kit).\n4. Family / Bridesmaid: Rp 1.500.000 / pax.\nCakupan: Jabodetabek, Bandung, Bali, dan Destination Wedding seluruh Indonesia.',
  auto_capture_leads: true,
};

interface Entities {
  tanggal: string | null;
  venue: string | null;
  jam: string | null;
  eventType: string | null;
  people: string | null;
}

function extractEntities(messages: Array<{ role: string; content: string }>): Entities {
  const text = messages
    .filter((m) => m.role === 'user')
    .map((m) => m.content)
    .join('\n')
    .toLowerCase();

  const entities: Entities = { tanggal: null, venue: null, jam: null, eventType: null, people: null };

  // 1. Tanggal
  const plainDate = text.match(/\b\d{1,2}\s+(?:januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember)(?:\s+\d{4})?\b/i) ||
                    text.match(/\b(?:januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember)\s+\d{1,2}(?:\s+\d{4})?\b/i) ||
                    text.match(/\b\d{1,2}[-/]\d{1,2}(?:[-/]\d{2,4})?\b/i);
  if (plainDate) entities.tanggal = plainDate[0].trim();

  // 2. Jam
  const jamExplicit = text.match(/\b(?:jam|pukul|waktu|mulai)\s*(\d{1,2}(?:[.:]\d{2})?(?:\s*(?:pagi|siang|sore|malam|wib))?)\b/i) ||
                      text.match(/\b(\d{1,2}(?:[.:]\d{2})?\s*(?:pagi|siang|sore|malam|wib))\b/i) ||
                      text.match(/\b(\d{1,2}[.:]\d{2})\b/i);
  if (jamExplicit) {
    entities.jam = (jamExplicit[1] || jamExplicit[0]).trim();
  }

  // 3. Venue
  const venueMatch = text.match(/(?:venue|lokasi|tempat|di)\s+(?:hotel\s+|gedung\s+|venue\s+)?([a-z0-9&'.\s]+?)(?=\s*\b(?:jam|pukul|tanggal|untuk|buat|pagi|siang|sore|malam|wib|acara|akad|resepsi|$)\b)/i);
  if (venueMatch) {
    const candidate = venueMatch[1]?.trim();
    if (candidate && candidate.length > 1 && !/^(apa|mana|kapan|dimana|berapa|yang|apakah|bisa|masih|ada|saja|saya|kak)$/i.test(candidate)) {
      entities.venue = candidate;
    }
  }

  // 4. Event type
  const EVENT_TYPES = [
    { key: 'Akad Nikah', rx: /(?:akad|ijab|nikah|menikah)/i },
    { key: 'Resepsi', rx: /(?:resepsi|reception|pesta pernikahan)/i },
    { key: 'Prewedding / Engagement', rx: /(?:pre\s*wedding|prewed|engagement|lamaran|tunangan)/i },
    { key: 'Wisuda / Graduation', rx: /(?:wisuda|graduation|kelulusan)/i },
    { key: 'Event Party', rx: /(?:party|ulang tahun|birthday|event|acara khusus)/i },
  ];
  for (const ev of EVENT_TYPES) {
    if (ev.rx.test(text)) {
      entities.eventType = ev.key;
      break;
    }
  }

  // 5. People count
  const people = text.match(/(\d+)\s*(?:orang|pax|tamu|undangan)/i);
  if (people) entities.people = people[0].trim();

  return entities;
}

// Determines the funnel closing stage based on multi-turn dialogue
function calculateClosingStage(
  text: string,
  intent: string,
  entities: Entities,
  messageCount: number
): string {
  const lower = text.toLowerCase();

  // 1. Ready to book / Lock Date / Direct WhatsApp
  if (
    /(?:lock|kunci|booking|book|amankan|dp|transfer|rekening|spk|deal|fix|hubungi wa|menuju wa)/i.test(lower) ||
    (entities.tanggal && entities.venue && entities.jam && entities.eventType)
  ) {
    return 'Siap Booking / Menuju WhatsApp';
  }

  // 2. Received pricelist / packages recommendation
  if (
    intent === 'faq_price' ||
    intent === 'faq_package' ||
    /(?:harga|biaya|paket|pricelist|price|promo|tarif|diskon)/i.test(lower) ||
    entities.eventType
  ) {
    return 'Mendapat Rekomendasi Paket & Pricelist';
  }

  // 3. Questioning schedule & location
  if (
    entities.tanggal ||
    entities.venue ||
    entities.jam ||
    intent === 'availability_check' ||
    /(?:jadwal|tanggal|kapan|lokasi|venue|tempat|jam|pukul|tersedia|kosong)/i.test(lower)
  ) {
    return 'Tanya Jawab Jadwal & Lokasi';
  }

  // 4. Consultation on makeup concept / general questions
  if (messageCount > 2) {
    return 'Konsultasi Konsep Riasan';
  }

  return 'Form Terisi (Lead Masuk)';
}

function buildSmartFallback(
  intent: string,
  preset: typeof DEFAULT_PRESET,
  entities: Entities,
  clientName?: string
): string {
  const waUrl = `https://wa.me/${preset.whatsapp_number}`;
  const sapaan = clientName ? `Kak ${clientName}` : 'Kak';

  const missing: string[] = [];
  if (!entities.tanggal) missing.push('tanggal acara');
  if (!entities.venue) missing.push('lokasi/venue');
  if (!entities.jam) missing.push('jam acara');

  const knownBullets: string[] = [];
  if (entities.tanggal) knownBullets.push(`• Tanggal: ${entities.tanggal}`);
  if (entities.venue) knownBullets.push(`• Lokasi: ${entities.venue}`);
  if (entities.jam) knownBullets.push(`• Waktu: ${entities.jam}`);
  if (entities.eventType) knownBullets.push(`• Acara: ${entities.eventType}`);
  if (entities.people) knownBullets.push(`• Jumlah orang: ${entities.people}`);

  const knownSection = knownBullets.length > 0 ? `Data jadwal yang tercatat:\n${knownBullets.join('\n')}\n\n` : '';

  // 1. If all 3 core schedule fields (tanggal, venue, jam) or eventType are provided
  if (missing.length === 0 || entities.eventType) {
    let pkgRecommendation = '';
    if (entities.eventType === 'Akad Nikah') {
      pkgRecommendation = 'Untuk acara Akad Nikah, paket favorit kami adalah Intimate / Holy Matrimony (Rp 7.500.000) atau Luxury Royal Bridal (Rp 12.000.000) dengan ketahanan complexion 18 jam.\n\n';
    } else if (entities.eventType === 'Resepsi') {
      pkgRecommendation = 'Untuk Resepsi, paket Luxury Royal Bridal (Rp 12.000.000) sudah mencakup makeup akad + resepsi, standby retouch, dan free riasan Ibu Pengantin.\n\n';
    } else if (entities.eventType === 'Prewedding / Engagement') {
      pkgRecommendation = 'Untuk Prewedding / Lamaran, paket Engagement (Rp 4.500.000) mencakup 1 look glam/natural dan touch-up kit.\n\n';
    }

    const eventConceptPrompt = (!entities.eventType && missing.length === 0)
      ? `Untuk konsep riasannya, apakah untuk acara Akad Nikah, Resepsi, atau Prewedding ${sapaan}?\n\n`
      : '';

    return (
      `Kabar baik ${sapaan}! ${knownSection}` +
      pkgRecommendation +
      eventConceptPrompt +
      `Slot riasan privat bersama Kak Jenni Khoe saat ini MASIH TERSEDIA ✨\n\n` +
      `Untuk mengamankan slot (Lock Date) atau konsultasi privat via WhatsApp resmi Jenni Khoe, ${sapaan} bisa langsung hubungi:\n${waUrl}`
    );
  }

  // 2. If partial schedule details exist, ask ONLY for the missing fields
  if (entities.tanggal || entities.venue || entities.jam || intent === 'availability_check' || intent === 'booking_intent') {
    const missingPrompt = missing.length > 0 ? missing.join(' dan ') : 'detail jadwal acara Kakak';
    return (
      `Terima kasih ${sapaan}! ${knownSection}` +
      `Agar kami bisa memastikan ketersediaan slot dan kesiapan tim, boleh dibantu info ${missingPrompt} yang direncanakan ya ${sapaan}?\n\n` +
      `Atau ${sapaan} bisa langsung terhubung ke WhatsApp resmi kami: ${waUrl}`
    );
  }

  if (intent === 'faq_price' || intent === 'faq_package') {
    return (
      `Halo ${sapaan}! Berikut paket utama Jenni Khoe MUA:\n\n` +
      `• Luxury Royal Bridal (Rp 12.000.000): Riasan Akad + Resepsi, Retouch standby, Free Mother of the Bride, Complexion tahan 18 jam.\n` +
      `• Intimate / Holy Matrimony (Rp 7.500.000): 1 sesi riasan pengantin radiant natural glam.\n` +
      `• Engagement / Prewedding (Rp 4.500.000): 1 look glam/natural + touch-up kit.\n` +
      `• Family / Bridesmaid: Rp 1.500.000 / pax.\n\n` +
      `${knownSection}` +
      `Untuk konsultasi privat dan lock tanggal, silakan hubungi WhatsApp resmi kami di ${waUrl}.`
    );
  }

  if (intent === 'complaint') {
    return `Mohon maaf yang sebesar-besarnya atas ketidaknyamanan ${sapaan}. Kepuasan klien adalah prioritas utama Jenni Khoe MUA. Mohon hubungi kami langsung via WhatsApp ${waUrl} agar segera kami tindaklanjuti secara personal.`;
  }

  return (
    `Halo ${sapaan}! ${knownSection}` +
    `Ada yang bisa kami bantu seputar konsultasi konsep riasan, cek ketersediaan jadwal, atau paket bridal untuk hari bahagia ${sapaan}?`
  );
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anonymous';
    const rl = checkRateLimit('chat:' + ip, 25, 60);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(rl.reset) } }
      );
    }

    const body = await req.json();
    const msgs: Array<{ role: string; content: string }> = body?.messages ?? [];
    const sessionId = body?.sessionId || body?.session_id || null;
    const clientName = body?.clientName || body?.name || null;
    const clientPhone = body?.clientPhone || body?.phone || null;

    if (!Array.isArray(msgs) || msgs.length === 0) {
      return NextResponse.json({ error: 'messages required' }, { status: 400 });
    }

    const lastMsg = msgs[msgs.length - 1]?.content || '';
    const intent = detectIntent(lastMsg);
    const entities = extractEntities(msgs);
    const closingStage = calculateClosingStage(lastMsg, intent, entities, msgs.length);

    // Fetch active preset from Supabase
    let preset = DEFAULT_PRESET;
    const supabase = getServiceSupabase();
    try {
      const { data } = await supabase
        .from('ai_chat_presets')
        .select('*')
        .eq('is_active', true)
        .order('id', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (data) {
        preset = { ...DEFAULT_PRESET, ...data };
      }
    } catch {
      // use default
    }

    // Update lead record with current progress stage in Supabase
    if (sessionId) {
      try {
        const updatePayload: Record<string, any> = {
          messages: msgs.length,
          closing_stage: closingStage,
          last_message: lastMsg.slice(0, 300),
          interest: entities.eventType || intent || 'Konsultasi Jadwal',
          updated_at: new Date().toISOString(),
        };
        if (clientName) updatePayload.name = clientName;
        if (clientPhone) updatePayload.phone = clientPhone;
        if (entities.tanggal) updatePayload.schedule_date = entities.tanggal;
        if (entities.venue) updatePayload.schedule_venue = entities.venue;
        if (entities.jam) updatePayload.schedule_time = entities.jam;

        await supabase
          .from('ai_leads')
          .update(updatePayload)
          .eq('session_id', sessionId);
      } catch (leadErr) {
        console.error('Lead tracking error:', leadErr);
      }
    }

    // Context summary to inject into LLM
    const contextSummary = [
      clientName ? `- Nama calon klien: Kak ${clientName}` : null,
      clientPhone ? `- Nomor WhatsApp klien: ${clientPhone}` : null,
      entities.tanggal ? `- Tanggal acara (sudah diberikan klien): ${entities.tanggal}` : null,
      entities.venue ? `- Lokasi/venue (sudah diberikan klien): ${entities.venue}` : null,
      entities.jam ? `- Jam acara (sudah diberikan klien): ${entities.jam}` : null,
      entities.eventType ? `- Jenis acara (sudah diberikan klien): ${entities.eventType}` : null,
      entities.people ? `- Jumlah orang (sudah diberikan klien): ${entities.people}` : null,
      `- Tahap Closing Saat Ini: ${closingStage}`,
    ].filter(Boolean).join('\n');

    const combinedSystemPrompt = `${preset.system_prompt}

[TUGAS & ATURAN WAJIB]:
${preset.rules}

[INFORMASI PAKET & LAYANAN JENNI KHOE MUA]:
${preset.packages_info}

[KONTAK RESMI CS]:
Nomor WhatsApp: ${preset.whatsapp_number}
Format Template Chat: ${preset.whatsapp_text_template}

[DATA KLIEN YANG SUDAH DITERIMA]:
${contextSummary || '(belum ada data detail acara dari klien)'}

[ATURAN ANTI-PENGULANGAN (CRITICAL)]:
- JANGAN PERNAH menanyakan ulang nama, nomor telepon, tanggal, lokasi, jam, atau jenis acara yang SUDAH TERCATAT di [DATA KLIEN YANG SUDAH DITERIMA].
- Jika tanggal, lokasi, dan jam sudah tercatat, LANGSUNG konfirmasi bahwa jadwal tersebut TERSEDIA dan tanyakan konsep riasan / arahkan lock tanggal ke WhatsApp.
- Jika hanya sebagian data yang ada, tanyakan HANYA data yang masih kurang.`;

    const modelEndpoint = `${(preset.api_base_url || 'http://localhost:20128/v1').replace(/\/+$/, '')}/chat/completions`;

    const chatPayload = {
      model: preset.model_name || 'COMBO-UTAMA',
      messages: [
        { role: 'system', content: combinedSystemPrompt },
        ...msgs.slice(-8).map((m) => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content,
        })),
      ],
      temperature: Number(preset.temperature) || 0.7,
      max_tokens: Number(preset.max_tokens) || 350,
      stream: false,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    try {
      const apiRes = await fetch(modelEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${preset.api_key || 'sk-f6d23bb7bbd0260e-v9p3lm-e4eadc94'}`,
        },
        body: JSON.stringify(chatPayload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (apiRes.ok) {
        const json = await apiRes.json();
        const reply = json.choices?.[0]?.message?.content;
        if (reply && reply.trim().length > 0) {
          return NextResponse.json({
            messages: [...msgs, { role: 'assistant', content: reply.trim() }],
            source: 'model',
            model: preset.model_name,
            entities,
            closing_stage: closingStage,
          });
        }
      }
    } catch (apiErr: any) {
      clearTimeout(timeoutId);
      console.warn('AI Model provider unreachable, using conversational fallback:', apiErr.message);
    }

    // Fallback response with anti-repeat entity intelligence
    const fallbackReply = buildSmartFallback(intent, preset, entities, clientName || undefined);
    return NextResponse.json({
      messages: [...msgs, { role: 'assistant', content: fallbackReply }],
      source: 'knowledge-preset',
      model: preset.model_name,
      entities,
      closing_stage: closingStage,
    });
  } catch (err: any) {
    console.error('Chat error:', err);
    return NextResponse.json({
      messages: [
        {
          role: 'assistant',
          content: 'Halo Kak! Layanan chat sedang menerima banyak permintaan. Silakan hubungi langsung via WhatsApp resmi Jenni Khoe MUA di 6281234567890 ya Kak.',
        },
      ],
    });
  }
}
