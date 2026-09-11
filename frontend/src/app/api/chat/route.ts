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
  rules: '1. Selalu sapa calon pengantin dengan sebutan "Kak" yang ramah.\n2. Jika klien menanyakan ketersediaan jadwal, tanyakan tanggal acara, lokasi/venue, dan konsep riasan.\n3. Berikan saran skin preparation jika klien bertanya tentang ketahanan riasan.\n4. Jelaskan paket dengan elegan dan transparan.\n5. Jika klien siap booking atau ingin lock tanggal, arahkan untuk mengirimkan nama & nomor WhatsApp atau klik tombol WhatsApp.',
  greeting_message: 'Halo Kak! Selamat datang di Jenni Khoe MUA. Saya asisten virtual Jenni Khoe, siap membantu konsultasi jadwal, rekomendasi riasan, paket bridal, dan booking privat untuk hari bahagia Kakak.',
  whatsapp_number: '6281234567890',
  whatsapp_text_template: 'Halo Kak Jenni Khoe, saya ingin konsultasi booking jadwal makeup.',
  packages_info: 'Paket Utama Jenni Khoe MUA:\n1. Luxury Royal Bridal: Rp 12.000.000 (Makeup & Hairdo Pengantin Akad + Resepsi, Retouch stand by, Free Mother of the Bride, Flawless complexion 18 jam, Premium false lashes & skin prep luxury).\n2. Intimate / Holy Matrimony: Rp 7.500.000 (Makeup & Hairdo Pengantin 1 sesi, Natural radiant finish, Free touch-up kit).\n3. Engagement / Prewedding: Rp 4.500.000 (Makeup & Hairdo 1 look glam / natural, Touch-up kit).\n4. Family / Bridesmaid: Rp 1.500.000 / pax.\nCakupan: Jabodetabek, Bandung, Bali, dan Destination Wedding seluruh Indonesia.',
  auto_capture_leads: true,
};

// Intelligent offline fallback generator
function generateFallbackResponse(intent: string, lastMsg: string, preset: typeof DEFAULT_PRESET): string {
  if (intent === 'availability_check') {
    return `Halo Kak! Untuk mengecek ketersediaan tanggal dan slot riasan privat bersama Kak Jenni Khoe, boleh infokan tanggal acara, lokasi venue, dan jam mulainya ya Kak? Tim kami juga siap membantu via WhatsApp resmi di https://wa.me/${preset.whatsapp_number}.`;
  }
  if (intent === 'faq_price' || intent === 'faq_package') {
    return `Halo Kak! Berikut ringkasan paket layanan Jenni Khoe MUA:\n\n• Luxury Royal Bridal (Rp 12.000.000): Riasan Akad + Resepsi, Retouch standby, Free Mother of the Bride, Complexion tahan 18 jam.\n• Intimate / Holy Matrimony (Rp 7.500.000): 1 sesi riasan pengantin radiant natural glam.\n• Engagement / Prewedding (Rp 4.500.000): 1 look glam/natural + touch-up kit.\n\nUntuk konsultasi privat dan lock tanggal, silakan tinggalkan kontak Kakak atau hubungi WhatsApp resmi kami.`;
  }
  if (intent === 'booking_intent') {
    return `Terima kasih atas kepercayaannya Kak! Untuk proses booking dan mengamankan slot tanggal (Lock Date), silakan cantumkan nama lengkap, nomor WhatsApp, serta tanggal & venue acara Kakak di form ini, atau langsung hubungi kami via WhatsApp resmi di https://wa.me/${preset.whatsapp_number}.`;
  }
  if (intent === 'complaint') {
    return `Mohon maaf yang sebesar-besarnya atas ketidaknyamanan Kakak. Kepuasan klien adalah prioritas utama Jenni Khoe MUA. Mohon hubungi kami langsung via WhatsApp https://wa.me/${preset.whatsapp_number} agar segera kami tindaklanjuti secara personal.`;
  }
  return `Halo Kak! Selamat datang di Jenni Khoe MUA. Ada yang bisa kami bantu seputar konsultasi konsep riasan, cek ketersediaan jadwal tanggal spesial, atau paket bridal untuk hari bahagia Kakak?`;
}

// Auto lead extraction
async function maybeAutoCaptureLead(supabase: any, text: string, intent: string) {
  try {
    const phoneMatch = text.match(/(?:\+?62|08)[0-9\s-]{8,15}/);
    if (phoneMatch) {
      const cleanPhone = phoneMatch[0].replace(/[\s-]/g, '');
      // Name heuristic (e.g. "nama saya Aurelia" or "saya Aurelia")
      const nameMatch = text.match(/(?:nama saya|nama|atas nama|panggil saya|saya)\s+([a-zA-Z\s]{2,25})/i);
      const name = (nameMatch && nameMatch[1]) ? nameMatch[1].trim() : 'Website Lead (Chat CS)';

      await supabase.from('ai_leads').insert({
        name,
        whatsapp: cleanPhone,
        intent: intent || 'booking_intent',
        lead_score: 85,
        status: 'hot',
        summary: `Lead dari AI Chat CS: "${text.slice(0, 150)}"`,
      });
    }
  } catch (err) {
    console.error('Lead capture err:', err);
  }
}

export async function POST(req: NextRequest) {
  try {
    // Rate limit: 20 req/60s per IP
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anonymous';
    const rl = checkRateLimit('chat:' + ip, 20, 60);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(rl.reset) } }
      );
    }

    const body = await req.json();
    const msgs: Array<{ role: string; content: string }> = body?.messages ?? [];

    if (!Array.isArray(msgs) || msgs.length === 0) {
      return NextResponse.json({ error: 'messages required' }, { status: 400 });
    }

    const lastMsg = msgs[msgs.length - 1]?.content || '';
    const intent = detectIntent(lastMsg);

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

    // Attempt auto lead capture if phone number present
    if (preset.auto_capture_leads) {
      maybeAutoCaptureLead(supabase, lastMsg, intent).catch(() => {});
    }

    // Build system prompt from preset
    const combinedSystemPrompt = `${preset.system_prompt}

[TUGAS & ATURAN WAJIB]:
${preset.rules}

[INFORMASI PAKET & LAYANAN JENNI KHOE MUA]:
${preset.packages_info}

[KONTAK RESMI CS]:
Nomor WhatsApp: ${preset.whatsapp_number}
Format Template Chat: ${preset.whatsapp_text_template}`;

    // Prepare OpenAI-compatible API payload for COMBO-UTAMA
    const modelEndpoint = `${(preset.api_base_url || 'http://localhost:20128/v1').replace(/\/+$/, '')}/chat/completions`;

    const chatPayload = {
      model: preset.model_name || 'COMBO-UTAMA',
      messages: [
        { role: 'system', content: combinedSystemPrompt },
        ...msgs.slice(-6).map((m) => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content,
        })),
      ],
      temperature: Number(preset.temperature) || 0.7,
      max_tokens: Number(preset.max_tokens) || 350,
      stream: false,
    };

    // Try calling model provider with 7.5s abort timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7500);

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
          });
        }
      }
    } catch (apiErr: any) {
      clearTimeout(timeoutId);
      console.warn('AI Model provider unreachable, falling back to knowledge base:', apiErr.message);
    }

    // Graceful fallback to knowledge base if model offline or timed out
    const fallbackReply = generateFallbackResponse(intent, lastMsg, preset);
    return NextResponse.json({
      messages: [...msgs, { role: 'assistant', content: fallbackReply }],
      source: 'knowledge-preset',
      model: preset.model_name,
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
