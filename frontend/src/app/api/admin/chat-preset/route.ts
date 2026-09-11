import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const DEFAULT_PRESET = {
  id: 1,
  name: 'Default Jenni Khoe AI CS',
  is_active: true,
  model_provider: 'combo-utama',
  model_name: 'COMBO-UTAMA',
  api_base_url: 'http://localhost:20128/v1',
  api_key: 'sk-f6d23bb7bbd0260e-v9p3lm-e4eadc94',
  temperature: 0.7,
  max_tokens: 350,
  system_prompt: 'Anda adalah Customer Service & Virtual Assistant resmi untuk Jenni Khoe Makeup Artist (MUA Haute Couture & Luxury Bridal Specialist). Kepribadian: Sopan, hangat, profesional, bernuansa luxury (panggil klien dengan \'Kak\'). Tugas utama: Membantu calon pengantin konsultasi riasan, cek ketersediaan tanggal, jelaskan paket, dan arahkan booking privat.',
  rules: '1. Selalu sapa calon pengantin dengan sebutan \'Kak\' yang ramah.\n2. Jika klien menanyakan ketersediaan jadwal, selalu tanyakan tanggal acara, lokasi/venue, dan konsep riasan.\n3. Berikan saran skin preparation jika klien bertanya tentang ketahanan riasan.\n4. Jelaskan paket dengan elegan dan transparan.\n5. Jika klien siap booking atau ingin lock tanggal, arahkan untuk mengirimkan nama & nomor WhatsApp atau klik tombol WhatsApp.',
  greeting_message: 'Halo Kak! Selamat datang di Jenni Khoe MUA. Saya asisten virtual Jenni Khoe, siap membantu konsultasi jadwal, rekomendasi riasan, paket bridal, dan booking privat untuk hari bahagia Kakak.',
  whatsapp_number: '6281234567890',
  whatsapp_text_template: 'Halo Kak Jenni Khoe, saya ingin konsultasi booking jadwal makeup.',
  packages_info: 'Paket Utama Jenni Khoe MUA:\n1. Luxury Royal Bridal: Rp 12.000.000 (Makeup & Hairdo Pengantin Akad + Resepsi, Retouch stand by, Free Mother of the Bride, Flawless complexion 18 jam, Premium false lashes & skin prep luxury).\n2. Intimate / Holy Matrimony: Rp 7.500.000 (Makeup & Hairdo Pengantin 1 sesi, Natural radiant finish, Free touch-up kit).\n3. Engagement / Prewedding: Rp 4.500.000 (Makeup & Hairdo 1 look glam / natural, Touch-up kit).\n4. Family / Bridesmaid: Rp 1.500.000 / pax.\nCakupan: Jabodetabek, Bandung, Bali, dan Destination Wedding seluruh Indonesia.',
  auto_capture_leads: true,
};

export async function GET() {
  try {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('ai_chat_presets')
      .select('*')
      .eq('is_active', true)
      .order('id', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ preset: DEFAULT_PRESET });
    }

    return NextResponse.json({ preset: data });
  } catch (err: any) {
    console.error('Error fetching chat preset:', err);
    return NextResponse.json({ preset: DEFAULT_PRESET, error: err.message });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      model_provider,
      model_name,
      api_base_url,
      api_key,
      temperature,
      max_tokens,
      system_prompt,
      rules,
      greeting_message,
      whatsapp_number,
      whatsapp_text_template,
      packages_info,
      auto_capture_leads,
    } = body;

    const supabase = getServiceSupabase();

    // Check if preset exists
    const { data: existing } = await supabase
      .from('ai_chat_presets')
      .select('id')
      .order('id', { ascending: true })
      .limit(1)
      .maybeSingle();

    const payload = {
      name: name || DEFAULT_PRESET.name,
      model_provider: model_provider || 'combo-utama',
      model_name: model_name || 'COMBO-UTAMA',
      api_base_url: api_base_url || 'http://localhost:20128/v1',
      api_key: api_key || 'sk-f6d23bb7bbd0260e-v9p3lm-e4eadc94',
      temperature: Number(temperature) || 0.7,
      max_tokens: Number(max_tokens) || 350,
      system_prompt: system_prompt || DEFAULT_PRESET.system_prompt,
      rules: rules || DEFAULT_PRESET.rules,
      greeting_message: greeting_message || DEFAULT_PRESET.greeting_message,
      whatsapp_number: whatsapp_number || DEFAULT_PRESET.whatsapp_number,
      whatsapp_text_template: whatsapp_text_template || DEFAULT_PRESET.whatsapp_text_template,
      packages_info: packages_info || DEFAULT_PRESET.packages_info,
      auto_capture_leads: auto_capture_leads ?? true,
      is_active: true,
      updated_at: new Date().toISOString(),
    };

    let result;
    if (existing?.id) {
      result = await supabase
        .from('ai_chat_presets')
        .update(payload)
        .eq('id', existing.id)
        .select()
        .single();
    } else {
      result = await supabase
        .from('ai_chat_presets')
        .insert(payload)
        .select()
        .single();
    }

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, preset: result.data });
  } catch (err: any) {
    console.error('Error saving chat preset:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
