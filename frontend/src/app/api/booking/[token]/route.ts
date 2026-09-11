import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;
    if (!token) {
      return NextResponse.json({ success: false, message: "Token tidak valid" }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from("deal_customers")
      .select("id, name, phone, email, deal_date, deal_time, venue, service_package, status, spk_number, terms_accepted, client_signature, signed_at, payment_method, payment_status")
      .eq("booking_token", token)
      .single();

    if (error || !data) {
      return NextResponse.json({ success: false, message: "Data reservasi tidak ditemukan atau tautan kedaluwarsa" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;
    const body = await req.json();
    const { name, phone, venue, email } = body;

    if (!token) {
      return NextResponse.json({ success: false, message: "Token tidak valid" }, { status: 400 });
    }

    if (!venue || !venue.trim()) {
      return NextResponse.json({ success: false, message: "Lokasi acara wajib diisi" }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    const updates: Record<string, any> = {
      venue: venue.trim(),
      updated_at: new Date().toISOString(),
      status: "form_submitted",
    };

    if (name) updates.name = name.trim();
    if (phone) updates.phone = phone.trim();
    if (email) updates.email = email.trim();

    const { data, error } = await supabase
      .from("deal_customers")
      .update(updates)
      .eq("booking_token", token)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
