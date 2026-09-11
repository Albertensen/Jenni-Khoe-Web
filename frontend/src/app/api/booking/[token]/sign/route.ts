import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;
    const body = await req.json();
    const { signature_data, terms_accepted } = body;

    if (!token) {
      return NextResponse.json({ success: false, message: "Token tidak valid" }, { status: 400 });
    }

    if (!signature_data) {
      return NextResponse.json({ success: false, message: "Tanda tangan digital wajib digoreskan" }, { status: 400 });
    }

    if (!terms_accepted) {
      return NextResponse.json({ success: false, message: "Anda harus menyetujui Syarat & Ketentuan SPK" }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Check deal record
    const { data: deal, error: fetchErr } = await supabase
      .from("deal_customers")
      .select("id, spk_number")
      .eq("booking_token", token)
      .single();

    if (fetchErr || !deal) {
      return NextResponse.json({ success: false, message: "Deal tidak ditemukan" }, { status: 404 });
    }

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
    const spkNumber = deal.spk_number || `SPK-JKM-${dateStr}-${String(deal.id).padStart(4, "0")}`;

    const { data, error } = await supabase
      .from("deal_customers")
      .update({
        client_signature: signature_data,
        terms_accepted: true,
        spk_number: spkNumber,
        signed_at: now.toISOString(),
        status: "spk_signed",
        updated_at: now.toISOString(),
      })
      .eq("booking_token", token)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "SPK berhasil ditandatangani secara digital",
      data,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
