import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const DEFAULT_TNC = `1. Penguncian Slot Tanggal & Uang Muka (DP 50%):
Jadwal riasan hanya dinyatakan sah terblokir setelah PIHAK KEDUA membubuhkan tanda tangan SPK digital ini serta mentransfer uang muka (DP 50%). DP bersifat non-refundable karena slot tanggal telah diblokir secara eksklusif (1 pengantin per hari).

2. Pelunasan Pembayaran:
Sisa pelunasan (50%) wajib diselesaikan selambat-lambatnya H-7 sebelum hari acara pernikahan melalui metode transfer resmi studio Jenni Khoe MUA.

3. Ketepatan Waktu & Kesiapan Lokasi:
PIHAK PERTAMA akan hadir tepat waktu sesuai jam mulai rias yang telah dikunci. PIHAK KEDUA diharapkan telah menyiapkan ruangan steril dengan pencahayaan dan pendingin ruangan yang memadai, serta wajah bersih tanpa skincare berminyak tebal.

4. Kebijakan Reschedule:
Perubahan tanggal acara hanya dapat dilakukan apabila slot baru pada kalender PIHAK PERTAMA masih tersedia, dengan pemberitahuan konfirmasi tertulis minimal 30 hari kalender sebelum tanggal awal yang disepakati.

5. Jaminan Mutu & Higienitas:
Seluruh peralatan, spons, dan kuas rias telah melalui proses sterilisasi higienis medis dan menggunakan kosmetik luxury internasional original berkualitas tinggi.

6. Force Majeure & Regulasi:
Apabila terjadi keadaan kahar / memaksa (bencana alam, regulasi darurat pemerintah), kedua belah pihak sepakat untuk mencari jadwal pengganti sesuai ketersediaan kalender Jenni Khoe MUA tanpa hangusnya uang muka (DP) yang telah disetorkan.`;

export async function GET() {
  try {
    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from("spk_tnc_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    if (!data) {
      // Return default template
      return NextResponse.json({
        success: true,
        data: {
          id: 1,
          title: "Syarat & Ketentuan Standar SPK Digital Jenni Khoe MUA",
          content: DEFAULT_TNC,
          updated_at: new Date().toISOString(),
        },
      });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ success: false, message: "Konten T&C tidak boleh kosong" }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("spk_tnc_settings")
      .upsert(
        {
          id: 1,
          title: title?.trim() || "Syarat & Ketentuan Standar SPK Digital Jenni Khoe MUA",
          content: content.trim(),
          is_active: true,
          updated_at: now,
        },
        { onConflict: "id" }
      )
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Syarat & Ketentuan (T&C) SPK default berhasil diperbarui dan disimpan.",
      data,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
