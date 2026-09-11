import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { booking_id } = await req.json();
    if (!booking_id) {
      return NextResponse.json({ success: false, message: "booking_id required" }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Verify booking exists
    const { data: booking, error: bookingErr } = await supabase
      .from("bookings")
      .select("id")
      .eq("id", booking_id)
      .single();

    if (bookingErr || !booking) {
      return NextResponse.json({ success: false, message: "Booking tidak ditemukan" }, { status: 404 });
    }

    // Generate unique token
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { error: insertErr } = await supabase
      .from("gated_tokens")
      .insert({
        booking_id,
        token,
        expires_at: expiresAt,
      });

    if (insertErr) {
      return NextResponse.json({ success: false, message: insertErr.message }, { status: 500 });
    }

    const host = req.headers.get("host") || "jenni-khoe-mua.vercel.app";
    const protocol = host.includes("localhost") ? "http" : "https";
    const domain = `${protocol}://${host}`;
    const url = `${domain}/g/${token}`;

    return NextResponse.json({ success: true, url, token });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
