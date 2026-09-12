import { NextResponse } from "next/server";
import { syncGoogleCalendar } from "@/lib/google-calendar";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const result = await syncGoogleCalendar();
    return NextResponse.json({
      success: true,
      message: `Sinkronisasi selesai! ${result.synced_bookings} jadwal booking MUA dan ${result.synced_google_events} event Google berhasil diselaraskan.`,
      data: result,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal sinkronisasi Google Calendar";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
