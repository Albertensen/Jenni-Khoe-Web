import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from("bookings")
      .select("id, service_package, event_date, venue, status, total_amount, clients(name)")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    const formatted = (data || []).map((b: any) => ({
      id: b.id,
      name: b.clients?.name || "Klien",
      event_date: b.event_date || "-",
      service_package: b.service_package || "-",
      total_amount: Number(b.total_amount) || 0,
      status: b.status || "inquiry",
      venue: b.venue || "-",
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getServiceSupabase();
    const body = await req.json();

    const { client_name, client_phone, client_email, service_package, event_date, venue, total_amount, dp_amount, notes } = body;

    // 1. Find or create client
    let clientId = body.client_id;
    if (!clientId && client_name) {
      const { data: clientData, error: clientErr } = await supabase
        .from("clients")
        .insert({
          name: client_name,
          phone: client_phone || "-",
          email: client_email || `${Date.now()}@client.local`,
          venue: venue || null,
        })
        .select("id")
        .single();

      if (clientErr) {
        return NextResponse.json({ success: false, message: clientErr.message }, { status: 500 });
      }
      clientId = clientData.id;
    }

    // 2. Insert booking
    const { data: bookingData, error: bookingErr } = await supabase
      .from("bookings")
      .insert({
        client_id: clientId,
        service_package: service_package || "Custom Package",
        event_date: event_date || new Date().toISOString().slice(0, 10),
        venue: venue || "Venue",
        status: "negotiation",
        total_amount: Number(total_amount) || 0,
        dp_amount: Number(dp_amount) || 0,
        notes: notes || null,
      })
      .select("*")
      .single();

    if (bookingErr) {
      return NextResponse.json({ success: false, message: bookingErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: bookingData });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = getServiceSupabase();
    const body = await req.json();
    const { id, status, notes } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: "ID is required" }, { status: 400 });
    }

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (status) updates.status = status;
    if (notes !== undefined) updates.notes = notes;

    const { data, error } = await supabase
      .from("bookings")
      .update(updates)
      .eq("id", id)
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
