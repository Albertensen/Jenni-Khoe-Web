import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import crypto from "crypto";

export const dynamic = "force-dynamic";

function normalizePhone(rawPhone: string | null | undefined): string {
  if (!rawPhone) return "-";
  let clean = String(rawPhone).trim().replace(/[^0-9+]/g, "");
  if (clean.startsWith("08")) {
    clean = "628" + clean.slice(2);
  } else if (clean.startsWith("+62")) {
    clean = clean.slice(1);
  }
  return clean;
}

function generateBookingToken(): string {
  return "deal_" + crypto.randomBytes(8).toString("hex");
}

export async function GET() {
  try {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from("deal_customers")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getServiceSupabase();
    const body = await req.json();

    const { lead_id, name, phone, deal_date, deal_time, venue, service_package } = body;

    if (!name || !phone) {
      return NextResponse.json(
        { success: false, message: "Nama dan Nomor HP wajib diisi" },
        { status: 400 }
      );
    }

    const cleanPhone = normalizePhone(phone);

    // Check if an active deal already exists for this phone number
    const { data: existingDeals } = await supabase
      .from("deal_customers")
      .select("*")
      .eq("phone", cleanPhone)
      .order("created_at", { ascending: false })
      .limit(1);

    if (existingDeals && existingDeals.length > 0) {
      const existing = existingDeals[0];
      // Update with any new date/time if provided
      const updates: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };
      if (deal_date && !existing.deal_date) updates.deal_date = deal_date;
      if (deal_time && !existing.deal_time) updates.deal_time = deal_time;
      if (venue && !existing.venue) updates.venue = venue;

      if (Object.keys(updates).length > 1) {
        await supabase
          .from("deal_customers")
          .update(updates)
          .eq("id", existing.id);
      }

      // Also mark lead status in ai_leads as closed if lead_id provided
      if (lead_id) {
        await supabase
          .from("ai_leads")
          .update({
            status: "closed",
            closing_stage: "Siap Booking / Menuju WhatsApp",
            updated_at: new Date().toISOString(),
          })
          .eq("id", lead_id);
      }

      return NextResponse.json({
        success: true,
        data: existing,
        message: "Deal customer sudah ada dan dimuat kembali",
        isExisting: true,
      });
    }

    // Generate unique token
    const token = generateBookingToken();

    const insertPayload = {
      lead_id: lead_id || null,
      name: name.trim(),
      phone: cleanPhone,
      deal_date: deal_date || null,
      deal_time: deal_time || "06:00 WIB",
      venue: venue || null,
      service_package: service_package || "Bridal Makeup Exclusive",
      booking_token: token,
      status: "draft",
    };

    const { data, error } = await supabase
      .from("deal_customers")
      .insert(insertPayload)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    // Mark lead status as closed in ai_leads
    if (lead_id) {
      await supabase
        .from("ai_leads")
        .update({
          status: "closed",
          closing_stage: "Siap Booking / Menuju WhatsApp",
          updated_at: new Date().toISOString(),
        })
        .eq("id", lead_id);
    }

    return NextResponse.json({
      success: true,
      data,
      message: "Berhasil menambahkan ke Deal Customer",
      isExisting: false,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = getServiceSupabase();
    const body = await req.json();

    const { id, deal_date, deal_time, venue, status, service_package, admin_notes, payment_status, payment_method } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: "ID Deal wajib disertakan" }, { status: 400 });
    }

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (deal_date !== undefined) updates.deal_date = deal_date;
    if (deal_time !== undefined) updates.deal_time = deal_time;
    if (venue !== undefined) updates.venue = venue;
    if (status !== undefined) updates.status = status;
    if (service_package !== undefined) updates.service_package = service_package;
    if (admin_notes !== undefined) updates.admin_notes = admin_notes;
    if (payment_status !== undefined) updates.payment_status = payment_status;
    if (payment_method !== undefined) updates.payment_method = payment_method;

    if (payment_status === "confirmed") {
      updates.status = "dp_paid";
    }

    const { data, error } = await supabase
      .from("deal_customers")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    // Bidirectional sync to bookings table
    try {
      const bookingUpdates: Record<string, any> = { updated_at: new Date().toISOString() };
      if (payment_status !== undefined) bookingUpdates.payment_status = payment_status;
      if (payment_method !== undefined) bookingUpdates.payment_method = payment_method;
      if (payment_status === "confirmed") bookingUpdates.status = "confirmed";
      if (deal_date !== undefined) bookingUpdates.event_date = deal_date;
      if (venue !== undefined) bookingUpdates.venue = venue;

      await supabase
        .from("bookings")
        .update(bookingUpdates)
        .eq("deal_id", id);
    } catch (bookingErr) {
      console.error("Sync error to bookings from deals PATCH:", bookingErr);
    }

    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
