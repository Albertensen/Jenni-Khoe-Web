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
    const { payment_method, payment_notes } = body;

    if (!token) {
      return NextResponse.json({ success: false, message: "Token tidak valid" }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from("deal_customers")
      .update({
        payment_method: payment_method || "Transfer Bank BCA",
        payment_status: "dp_submitted",
        status: "dp_paid",
        updated_at: new Date().toISOString(),
      })
      .eq("booking_token", token)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Konfirmasi pembayaran DP berhasil diterima",
      data,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
