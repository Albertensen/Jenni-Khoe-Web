import { NextRequest, NextResponse } from "next/server";
import { dispatchInvoiceAndSpk } from "@/lib/invoice-dispatch";
import { getServiceSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { invoice_id, payment_id, booking_id, deal_id } = body;

    const supabase = getServiceSupabase();

    let targetPaymentId = payment_id;
    let targetBookingId = booking_id;
    let targetDealId = deal_id;

    if (invoice_id && (!targetPaymentId && !targetBookingId && !targetDealId)) {
      const { data: inv } = await supabase
        .from("invoices")
        .select("payment_id, booking_id, deal_id")
        .eq("id", invoice_id)
        .maybeSingle();

      if (inv) {
        targetPaymentId = inv.payment_id;
        targetBookingId = inv.booking_id;
        targetDealId = inv.deal_id;
      }
    }

    const result = await dispatchInvoiceAndSpk({
      paymentId: targetPaymentId,
      bookingId: targetBookingId,
      dealId: targetDealId,
      forceSend: true,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, message: result.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: "Notifikasi Invoice & SPK berhasil diproses dan dikirim.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
