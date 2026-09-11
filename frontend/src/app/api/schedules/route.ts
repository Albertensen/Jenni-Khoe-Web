import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from("schedules")
      .select("id, start_datetime, end_datetime, bookings(service_package, clients(name))")
      .order("start_datetime", { ascending: true });

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    const formatted = (data || []).map((s: any) => {
      const clientName = s.bookings?.clients?.name || "Klien";
      const pkg = s.bookings?.service_package || "Makeup Session";
      return {
        id: s.id,
        title: `${clientName} (${pkg})`,
        start_datetime: s.start_datetime,
        end_datetime: s.end_datetime,
        status: "confirmed",
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

    const { booking_id, start_datetime, end_datetime } = body;

    if (!start_datetime || !end_datetime) {
      return NextResponse.json({ success: false, message: "Waktu mulai dan selesai wajib diisi" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("schedules")
      .insert({
        booking_id: booking_id || null,
        start_datetime,
        end_datetime,
      })
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
