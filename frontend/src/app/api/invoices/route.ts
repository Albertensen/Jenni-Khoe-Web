import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// Auto-reconcile settled payments to ensure invoices exist
async function reconcileSettledPaymentsToInvoices(supabase: any) {
  try {
    const { data: settledPayments } = await supabase
      .from("payments")
      .select(`
        id,
        booking_id,
        deal_id,
        amount,
        status,
        paid_at,
        payment_method,
        bookings (
          id,
          service_package,
          event_date,
          venue,
          spk_number,
          total_amount,
          dp_amount,
          clients (
            name,
            phone,
            email
          )
        ),
        deal_customers (
          id,
          name,
          phone,
          email,
          service_package,
          deal_date,
          venue,
          spk_number,
          total_amount
        )
      `)
      .eq("status", "settled");

    if (!settledPayments || !Array.isArray(settledPayments)) return;

    const { data: existingInvoices } = await supabase
      .from("invoices")
      .select("id, payment_id, booking_id, deal_id");

    const existingPaymentIds = new Set((existingInvoices || []).map((i: any) => Number(i.payment_id)).filter(Boolean));
    const existingBookingIds = new Set((existingInvoices || []).map((i: any) => Number(i.booking_id)).filter(Boolean));

    for (const p of settledPayments) {
      if (existingPaymentIds.has(Number(p.id)) || (p.booking_id && existingBookingIds.has(Number(p.booking_id)))) {
        continue;
      }

      const b = p.bookings || {};
      const c = b.clients || {};
      const d = p.deal_customers || {};

      const clientName = c.name || d.name || "Klien";
      const clientPhone = c.phone || d.phone || "-";
      const clientEmail = (c.email && !c.email.includes("@client.local")) ? c.email : (d.email && !d.email.includes("@client.local") ? d.email : null);
      const servicePkg = b.service_package || d.service_package || "Bridal Makeup Exclusive";
      const eventDate = b.event_date || d.deal_date || null;
      const venue = b.venue || d.venue || "-";
      const spkNumber = b.spk_number || d.spk_number || "SPK-JKM";
      const totalAmount = Number(b.total_amount) || Number(d.total_amount) || 15000000;
      const dpAmount = Number(p.amount) || Number(b.dp_amount) || 5000000;
      const remainingBalance = Math.max(0, totalAmount - dpAmount);

      const dateStr = (p.paid_at || new Date().toISOString()).slice(0, 10);
      const dateCode = dateStr.replace(/-/g, "").slice(0, 6);
      const nextNum = String(Math.floor(1000 + Math.random() * 9000));
      const generatedInvNum = `INV-JKM-${dateCode}-${nextNum}`;

      await supabase.from("invoices").insert({
        invoice_number: generatedInvNum,
        booking_id: p.booking_id || null,
        deal_id: p.deal_id || null,
        payment_id: p.id,
        client_name: clientName,
        client_phone: clientPhone,
        client_email: clientEmail,
        service_package: servicePkg,
        event_date: eventDate,
        venue: venue,
        total_amount: totalAmount,
        dp_amount: dpAmount,
        paid_amount: dpAmount,
        remaining_balance: remainingBalance,
        status: "paid",
        invoice_date: dateStr,
        paid_at: p.paid_at || new Date().toISOString(),
        spk_number: spkNumber,
        notes: "Pembayaran DP lunas diverifikasi.",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.error("Warning: Invoice auto-reconciliation error:", err);
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = getServiceSupabase();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.toLowerCase();
    const status = searchParams.get("status");

    // Auto-reconcile settled payments to invoices
    await reconcileSettledPaymentsToInvoices(supabase);

    let query = supabase
      .from("invoices")
      .select(`
        *,
        bookings (
          id,
          booking_token,
          service_package,
          event_date,
          status,
          spk_number
        ),
        payments (
          id,
          payment_method,
          transaction_id,
          payment_channel,
          status
        )
      `)
      .order("created_at", { ascending: false });

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    const { data: invoices, error } = await query;

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    let filtered = invoices || [];
    if (search) {
      filtered = filtered.filter(
        (i: any) =>
          i.client_name?.toLowerCase().includes(search) ||
          i.invoice_number?.toLowerCase().includes(search) ||
          i.spk_number?.toLowerCase().includes(search) ||
          i.service_package?.toLowerCase().includes(search) ||
          i.client_phone?.includes(search)
      );
    }

    return NextResponse.json({
      success: true,
      data: filtered,
      total: filtered.length,
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

    const {
      client_name,
      client_phone,
      client_email,
      service_package,
      event_date,
      venue,
      total_amount,
      dp_amount,
      paid_amount,
      status,
      spk_number,
      notes,
    } = body;

    if (!client_name) {
      return NextResponse.json({ success: false, message: "Nama klien wajib diisi" }, { status: 400 });
    }

    const nowIso = new Date().toISOString();
    const dateCode = nowIso.slice(0, 10).replace(/-/g, "").slice(0, 6);
    const { count } = await supabase.from("invoices").select("id", { count: "exact", head: true });
    const nextNum = String((count || 0) + 1).padStart(4, "0");
    const invoice_number = `INV-JKM-${dateCode}-${nextNum}`;

    const tot = Number(total_amount) || 0;
    const dp = Number(dp_amount) || 0;
    const paid = Number(paid_amount) || dp;
    const remaining = Math.max(0, tot - paid);

    const { data, error } = await supabase
      .from("invoices")
      .insert({
        invoice_number,
        client_name,
        client_phone: client_phone || null,
        client_email: client_email || null,
        service_package: service_package || "Bridal Makeup",
        event_date: event_date || null,
        venue: venue || null,
        total_amount: tot,
        dp_amount: dp,
        paid_amount: paid,
        remaining_balance: remaining,
        status: status || "paid",
        invoice_date: nowIso.slice(0, 10),
        paid_at: (status === "paid" || paid > 0) ? nowIso : null,
        spk_number: spk_number || null,
        notes: notes || null,
        created_at: nowIso,
        updated_at: nowIso,
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data, message: "Invoice berhasil dibuat." });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
