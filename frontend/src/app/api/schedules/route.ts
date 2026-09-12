import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// Auto-reconcile bookings to schedules strictly based on payment status:
// ONLY lock date if DP / payment status is confirmed / settled.
// If customer has NOT paid DP, DO NOT lock date (remove schedule if exists).
async function reconcileBookingsToSchedules(supabase: any) {
  try {
    const { data: bookings } = await supabase
      .from("bookings")
      .select("id, client_id, service_package, event_date, venue, status, payment_status, spk_number, total_amount, dp_amount, clients(name, phone), payments(id, status)")
      .order("event_date", { ascending: true });

    if (!bookings || !Array.isArray(bookings)) return;

    const { data: existingSchedules } = await supabase
      .from("schedules")
      .select("id, booking_id, google_event_id");

    const existingMap = new Map<number, any>();
    (existingSchedules || []).forEach((s: any) => {
      if (s.booking_id) existingMap.set(Number(s.booking_id), s);
    });

    for (const b of bookings) {
      if (!b.event_date) continue;

      // Check if DP / payment is confirmed / settled
      const isBookingConfirmed =
        b.payment_status === "confirmed" ||
        b.payment_status === "success" ||
        b.status === "confirmed";

      const isPaymentSettled =
        Array.isArray(b.payments) &&
        b.payments.some((p: any) => p.status === "settled");

      const isDpLunas = isBookingConfirmed || isPaymentSettled;

      const existingSched = existingMap.get(Number(b.id));

      if (isDpLunas) {
        // LOCK DATE: ensure schedule exists
        const dateStr = b.event_date.slice(0, 10);
        const startIso = `${dateStr}T05:00:00+07:00`;
        const endIso = `${dateStr}T11:00:00+07:00`;
        const cName = b.clients?.name || "Klien";
        const pkg = b.service_package || "Bridal Makeup";

        if (!existingSched) {
          await supabase.from("schedules").insert({
            booking_id: b.id,
            title: `${cName} (${pkg})`,
            description: `SPK: ${b.spk_number || '-'} | Klien: ${cName} (${b.clients?.phone || '-'}) | Lokasi: ${b.venue || '-'}`,
            location: b.venue || "Venue Sesuai Kesepakatan",
            source: "booking",
            start_datetime: startIso,
            end_datetime: endIso,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }
      } else {
        // UNLOCK DATE: if schedule was created prematurely for unpaid booking, delete it!
        if (existingSched) {
          await supabase
            .from("schedules")
            .delete()
            .eq("id", existingSched.id);
        }
      }
    }
  } catch (err) {
    console.error("Warning: Reconcile schedules error:", err);
  }
}

export async function GET() {
  try {
    const supabase = getServiceSupabase();

    // Reconcile bookings based on DP payment status
    await reconcileBookingsToSchedules(supabase);

    // 1. Fetch locked schedules
    const { data: lockedSchedules, error } = await supabase
      .from("schedules")
      .select(`
        id,
        booking_id,
        title,
        description,
        location,
        source,
        start_datetime,
        end_datetime,
        google_event_id,
        google_event_link,
        synced_at,
        bookings (
          id,
          service_package,
          event_date,
          venue,
          spk_number,
          status,
          payment_status,
          total_amount,
          dp_amount,
          clients (
            name,
            phone,
            email
          )
        )
      `)
      .order("start_datetime", { ascending: true });

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    const formatted = (lockedSchedules || []).map((s: any) => {
      const b = s.bookings || {};
      const c = b.clients || {};
      const isBooking = Boolean(s.booking_id);

      return {
        id: s.id,
        booking_id: s.booking_id || null,
        title: s.title || (isBooking ? `${c.name || 'Klien'} (${b.service_package || 'Bridal Makeup'})` : "Agenda / Makeup"),
        description: s.description || null,
        location: s.location || b.venue || "-",
        source: s.source || (isBooking ? "booking" : "manual"),
        start_datetime: s.start_datetime,
        end_datetime: s.end_datetime,
        google_event_id: s.google_event_id || null,
        google_event_link: s.google_event_link || null,
        synced_at: s.synced_at || null,
        status: b.status || "confirmed",
        payment_status: b.payment_status || "confirmed",
        is_locked: true,
        client_name: c.name || null,
        client_phone: c.phone || null,
        service_package: b.service_package || null,
        spk_number: b.spk_number || null,
        total_amount: Number(b.total_amount) || 0,
      };
    });

    // 2. Fetch pending bookings (NOT locked yet) for admin awareness
    const { data: pendingBookings } = await supabase
      .from("bookings")
      .select(`
        id,
        service_package,
        event_date,
        venue,
        spk_number,
        status,
        payment_status,
        payment_method,
        total_amount,
        dp_amount,
        clients (
          name,
          phone,
          email
        )
      `)
      .neq("payment_status", "confirmed")
      .neq("payment_status", "success")
      .neq("status", "confirmed")
      .order("event_date", { ascending: true });

    const formattedPending = (pendingBookings || []).map((b: any) => ({
      id: b.id,
      client_name: b.clients?.name || "Klien",
      client_phone: b.clients?.phone || "-",
      service_package: b.service_package || "Makeup Session",
      event_date: b.event_date || "-",
      venue: b.venue || "-",
      spk_number: b.spk_number || null,
      status: b.status || "negotiation",
      payment_status: b.payment_status || "belum_bayar",
      payment_method: b.payment_method || "transfer",
      dp_amount: Number(b.dp_amount) || 0,
      total_amount: Number(b.total_amount) || 0,
      is_locked: false,
    }));

    return NextResponse.json({
      success: true,
      data: formatted,
      pending_bookings: formattedPending,
      locked_dates: Array.from(new Set(formatted.map((f: any) => f.start_datetime ? f.start_datetime.slice(0, 10) : null).filter(Boolean))),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getServiceSupabase();
    const body = await req.json();

    const { booking_id, title, description, location, start_datetime, end_datetime, source } = body;

    if (!start_datetime || !end_datetime) {
      return NextResponse.json({ success: false, message: "Waktu mulai dan selesai wajib diisi" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("schedules")
      .insert({
        booking_id: booking_id || null,
        title: title || "Agenda Makeup Studio",
        description: description || null,
        location: location || null,
        source: source || "manual",
        start_datetime,
        end_datetime,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data, message: "Jadwal berhasil ditambahkan" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = getServiceSupabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, message: "ID schedule wajib diisi" }, { status: 400 });
    }

    const { error } = await supabase.from("schedules").delete().eq("id", id);
    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Jadwal berhasil dihapus" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
