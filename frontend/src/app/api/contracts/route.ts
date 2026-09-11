import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from("contracts")
      .select("id, booking_id, spk_number, signed_at, signed_ip, pdf_path, bookings(clients(name))")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    const formatted = (data || []).map((c: any) => ({
      id: c.id,
      booking_id: c.booking_id,
      client_name: c.bookings?.clients?.name || "Klien",
      spk_number: c.spk_number,
      signed_at: c.signed_at,
      signed_ip: c.signed_ip,
      status: c.signed_at ? "signed" : "pending",
      pdf_path: c.pdf_path,
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
