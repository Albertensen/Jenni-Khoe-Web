import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getServiceSupabase();

    // Fetch invoice by ID or invoice_number
    let query = supabase.from("invoices").select(`
      *,
      bookings (
        id,
        booking_token,
        service_package,
        event_date,
        venue,
        spk_number,
        clients (
          name,
          phone,
          email
        )
      ),
      payments (
        id,
        payment_method,
        transaction_id,
        payment_channel,
        amount,
        status,
        paid_at
      )
    `);

    if (id.startsWith("INV-")) {
      query = query.eq("invoice_number", id);
    } else {
      query = query.eq("id", id);
    }

    const { data: invoice, error } = await query.maybeSingle();

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    if (!invoice) {
      return NextResponse.json({ success: false, message: "Invoice tidak ditemukan" }, { status: 404 });
    }

    // Fetch active invoice settings
    const { data: settings } = await supabase
      .from("invoice_settings")
      .select("*")
      .order("id", { ascending: true })
      .limit(1)
      .maybeSingle();

    return NextResponse.json({
      success: true,
      data: {
        ...invoice,
        settings: settings || null,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
