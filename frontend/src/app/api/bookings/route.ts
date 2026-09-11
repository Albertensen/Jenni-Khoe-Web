import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from("bookings")
      .select("id, deal_id, service_package, event_date, venue, status, total_amount, dp_amount, spk_number, payment_method, payment_status, booking_token, client_signature, signed_at, created_at, clients(name, phone, email)")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    const formatted = (data || []).map((b: any) => ({
      id: b.id,
      deal_id: b.deal_id || null,
      name: b.clients?.name || "Klien",
      phone: b.clients?.phone || "-",
      email: b.clients?.email || "-",
      event_date: b.event_date || "-",
      service_package: b.service_package || "-",
      total_amount: Number(b.total_amount) || 0,
      dp_amount: Number(b.dp_amount) || 0,
      status: b.status || "down_payment",
      spk_number: b.spk_number || null,
      payment_method: b.payment_method || "belum_bayar",
      payment_status: b.payment_status || "belum_bayar",
      booking_token: b.booking_token || null,
      client_signature: b.client_signature || null,
      signed_at: b.signed_at || null,
      venue: b.venue || "-",
      created_at: b.created_at,
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
        service_package: service_package || "Bridal Makeup Exclusive",
        event_date: event_date || new Date().toISOString().slice(0, 10),
        venue: venue || "Venue Sesuai Kesepakatan",
        status: "negotiation",
        total_amount: Number(total_amount) || 0,
        dp_amount: Number(dp_amount) || 0,
        notes: notes || null,
        payment_method: "belum_bayar",
        payment_status: "belum_bayar",
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
    const { id, status, payment_status, payment_method, notes } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: "ID is required" }, { status: 400 });
    }

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (status !== undefined) updates.status = status;
    if (payment_status !== undefined) updates.payment_status = payment_status;
    if (payment_method !== undefined) updates.payment_method = payment_method;
    if (notes !== undefined) updates.notes = notes;

    // If payment_status is 'confirmed', also ensure status is 'confirmed'
    if (payment_status === "confirmed" && !status) {
      updates.status = "confirmed";
    }

    const { data, error } = await supabase
      .from("bookings")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    // Bidirectional sync to deal_customers if linked
    if (data?.deal_id) {
      const dealUpdates: Record<string, any> = { updated_at: new Date().toISOString() };
      if (payment_status !== undefined) dealUpdates.payment_status = payment_status;
      if (payment_method !== undefined) dealUpdates.payment_method = payment_method;
      if (payment_status === "confirmed") dealUpdates.status = "dp_paid";

      await supabase
        .from("deal_customers")
        .update(dealUpdates)
        .eq("id", data.deal_id);
    }

    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
