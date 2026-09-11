import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from("payments")
      .select("id, booking_id, payment_method, amount, status, paid_at, transaction_id, bookings(clients(name))")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    const formatted = (data || []).map((p: any) => ({
      id: p.id,
      booking_id: p.booking_id,
      client_name: p.bookings?.clients?.name || "Klien",
      payment_method: p.payment_method || "QRIS",
      amount: Number(p.amount) || 0,
      status: p.status || "pending",
      paid_at: p.paid_at,
      transaction_id: p.transaction_id,
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
