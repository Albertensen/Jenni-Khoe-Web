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
    const { payment_method } = body;

    if (!token) {
      return NextResponse.json({ success: false, message: "Token tidak valid" }, { status: 400 });
    }

    const validMethods = ["transfer", "qris", "kartu_kredit", "belum_bayar"];
    const method = validMethods.includes(payment_method) ? payment_method : "transfer";
    const paymentStatus = method === "belum_bayar" ? "belum_bayar" : "menunggu_konfirmasi";

    const supabase = getServiceSupabase();

    // 1. Update deal_customers
    const { data: updatedDeal, error: dealErr } = await supabase
      .from("deal_customers")
      .update({
        payment_method: method,
        payment_status: paymentStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("booking_token", token)
      .select("*")
      .single();

    if (dealErr || !updatedDeal) {
      return NextResponse.json({ success: false, message: dealErr?.message || "Deal tidak ditemukan" }, { status: 500 });
    }

    // 2. Sync to bookings table
    try {
      await supabase
        .from("bookings")
        .update({
          payment_method: method,
          payment_status: paymentStatus,
          updated_at: new Date().toISOString(),
        })
        .or(`deal_id.eq.${updatedDeal.id},booking_token.eq.${token}`);
    } catch (bookingSyncErr) {
      console.error("Sync to bookings error:", bookingSyncErr);
    }

    return NextResponse.json({
      success: true,
      message: `Metode pembayaran ${method} berhasil disimpan`,
      data: updatedDeal,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
