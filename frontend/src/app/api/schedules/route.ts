import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// Auto-populate schedules from bookings so calendar is always synchronized
async function reconcileBookingsToSchedules(supabase: any) {
  try {
    const { data: bookings } = await supabase
      .from("bookings")
      .select("id, client_id, service_package, event_date, venue, status, spk_number, total_amount, clients(name, phone)")
      .order("event_date", { ascending: true });

    if (!bookings || !Array.isArray(bookings)) return;

    const { data: existingSchedules } = await supabase
      .from("schedules")
      .select("id, booking_id");

    const existingMap = new Set<number>();
    (existingSchedules || []).forEach((s: any) => {
      if (s.booking_id) existingMap.add(Number(s.booking_id));
    });

    for (const b of bookings) {
      if (!b.event_date) continue;
      if (!existingMap.has(Number(b.id))) {
        const dateStr = b.event_date.slice(0, 10);
        const startIso = `${dateStr}T05:00:00+07:00`;
        const endIso = `${dateStr}T11:00:00+07:00`;
        const cName = b.clients?.name || "Klien";
        const pkg = b.service_package || "Bridal Makeup";

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
    }
  } catch (err) {
    console.error("Warning: Reconcile schedules error:", err);
  }
}

export async function GET() {
  try {
    const supabase = getServiceSupabase();

    // Auto-reconcile bookings into schedules
    await reconcileBookingsToSchedules(supabase);

    const { data, error } = await supabase
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

    const formatted = (data || []).map((s: any) => {
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
        client_name: c.name || null,
        client_phone: c.phone || null,
        service_package: b.service_package || null,
        spk_number: b.spk_number || null,
        total_amount: Number(b.total_amount) || 0,
      };
    });

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
