import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = getServiceSupabase();

    // 1. Total Inquiries
    const { count: totalInquiries } = await supabase
      .from("inquiries")
      .select("*", { count: "exact", head: true });

    // 2. All Bookings for metrics
    const { data: bookings } = await supabase
      .from("bookings")
      .select("status, total_amount, event_date");

    let totalBookings = 0;
    let pendingBookings = 0;
    let confirmedBookings = 0;
    let totalRevenue = 0;
    let upcomingBookings = 0;

    const todayStr = new Date().toISOString().slice(0, 10);

    if (bookings) {
      totalBookings = bookings.length;
      for (const b of bookings) {
        if (["inquiry", "negotiation", "approved"].includes(b.status)) {
          pendingBookings++;
        }
        if (["confirmed", "paid"].includes(b.status)) {
          confirmedBookings++;
        }
        if (["down_payment", "paid", "confirmed"].includes(b.status)) {
          totalRevenue += Number(b.total_amount) || 0;
        }
        if (b.event_date && b.event_date >= todayStr && b.status !== "cancelled") {
          upcomingBookings++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        total_inquiries: totalInquiries || 0,
        total_bookings: totalBookings,
        pending_bookings: pendingBookings,
        confirmed_bookings: confirmedBookings,
        total_revenue: totalRevenue,
        upcoming_bookings: upcomingBookings,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
