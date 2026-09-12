import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { dispatchInvoiceAndSpk } from "@/lib/invoice-dispatch";

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

    const { client_name, client_phone, client_email, service_package, event_date, venue, total_amount, dp_amount, notes, payment_method, payment_status } = body;

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
        payment_method: payment_method || "belum_bayar",
        payment_status: payment_status || "belum_bayar",
      })
      .select("*")
      .single();

    if (bookingErr) {
      return NextResponse.json({ success: false, message: bookingErr.message }, { status: 500 });
    }

    // 3. Sync to contracts table (SPK Archive) if spk_number is present
    if (body.spk_number) {
      try {
        await supabase
          .from("contracts")
          .upsert(
            {
              booking_id: bookingData.id,
              spk_number: body.spk_number,
              client_name: client_name || "Klien",
              client_phone: client_phone || "-",
              service_package: service_package || "Bridal Makeup Exclusive",
              event_date: event_date || new Date().toISOString().slice(0, 10),
              venue: venue || "Venue Sesuai Kesepakatan",
              signed_at: body.signed_at || new Date().toISOString(),
              signed_ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1",
              client_signature_data: body.client_signature || null,
              terms_content: "Surat Perjanjian Kerja (SPK) Layanan Tata Rias Pengantin Jenni Khoe MUA.",
              updated_at: new Date().toISOString(),
            },
            { onConflict: "spk_number" }
          );
      } catch (cErr) {
        console.error("Warning: sync contract from booking post error:", cErr);
      }
    }

    // 4. Sync to payments table
    try {
      const isConfirmed = bookingData.payment_status === "confirmed" || bookingData.payment_status === "success" || bookingData.status === "confirmed";
      const pMethod = bookingData.payment_method && bookingData.payment_method !== "belum_bayar" ? bookingData.payment_method : "transfer";
      const amount =
        Number(bookingData.dp_amount) > 0
          ? Number(bookingData.dp_amount)
          : Number(bookingData.total_amount) > 0
          ? Number(bookingData.total_amount)
          : 5000000;

      await supabase.from("payments").insert({
        booking_id: bookingData.id,
        deal_id: bookingData.deal_id || null,
        transaction_id: `TRX-${pMethod.toUpperCase()}-${bookingData.id}-${Date.now().toString().slice(-4)}`,
        amount: amount,
        payment_method: pMethod,
        status: isConfirmed ? "settled" : "pending",
        paid_at: isConfirmed ? new Date().toISOString() : null,
        payment_channel:
          pMethod === "transfer"
            ? "BCA Transfer"
            : pMethod === "qris"
            ? "QRIS Instant"
            : pMethod === "kartu_kredit"
            ? "Kartu Kredit"
            : "Virtual Account",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    } catch (pErr) {
      console.error("Warning: sync payment from booking post error:", pErr);
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

    const isSuccess = payment_status === "confirmed" || payment_status === "success";

    if (isSuccess && !status) {
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

    // 1. Bidirectional sync to deal_customers if linked
    if (data?.deal_id) {
      const dealUpdates: Record<string, any> = { updated_at: new Date().toISOString() };
      if (payment_status !== undefined) dealUpdates.payment_status = payment_status;
      if (payment_method !== undefined) dealUpdates.payment_method = payment_method;
      if (isSuccess) dealUpdates.status = "dp_paid";

      await supabase
        .from("deal_customers")
        .update(dealUpdates)
        .eq("id", data.deal_id);
    }

    // 2. Sync to contracts table (SPK Archive) if linked
    if (data?.spk_number) {
      try {
        await supabase
          .from("contracts")
          .update({
            booking_id: data.id,
            service_package: data.service_package || undefined,
            event_date: data.event_date || undefined,
            venue: data.venue || undefined,
            updated_at: new Date().toISOString(),
          })
          .eq("spk_number", data.spk_number);
      } catch (cErr) {
        console.error("Warning: sync contract from booking patch error:", cErr);
      }
    }

    // 3. Bidirectional sync to payments table
    try {
      const { data: existingPayment } = await supabase
        .from("payments")
        .select("id, status, paid_at, payment_method")
        .eq("booking_id", id)
        .maybeSingle();

      const payMethod = payment_method || data.payment_method || "transfer";
      const payStatus = isSuccess ? "settled" : (payment_status === "belum_bayar" ? "pending" : (payment_status ? "pending" : undefined));

      if (existingPayment) {
        const payUpdates: Record<string, any> = { updated_at: new Date().toISOString() };
        if (payStatus !== undefined) {
          payUpdates.status = payStatus;
          if (payStatus === "settled") {
            payUpdates.paid_at = existingPayment.paid_at || new Date().toISOString();
          } else if (payStatus === "pending") {
            payUpdates.paid_at = null;
          }
        }
        if (payment_method !== undefined && payment_method !== "belum_bayar") {
          payUpdates.payment_method = payment_method;
        }
        await supabase
          .from("payments")
          .update(payUpdates)
          .eq("id", existingPayment.id);
      } else {
        const amount =
          Number(data.dp_amount) > 0
            ? Number(data.dp_amount)
            : Number(data.total_amount) > 0
            ? Number(data.total_amount)
            : 5000000;

        await supabase.from("payments").insert({
          booking_id: id,
          deal_id: data.deal_id || null,
          transaction_id: `TRX-${payMethod.toUpperCase()}-${id}-${Date.now().toString().slice(-4)}`,
          amount: amount,
          payment_method: payMethod,
          status: isSuccess ? "settled" : "pending",
          paid_at: isSuccess ? new Date().toISOString() : null,
          payment_channel:
            payMethod === "transfer"
              ? "BCA Transfer"
              : payMethod === "qris"
              ? "QRIS Instant"
              : payMethod === "kartu_kredit"
              ? "Kartu Kredit"
              : "Virtual Account",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    } catch (paySyncErr) {
      console.error("Warning: sync payments from booking patch error:", paySyncErr);
    }

    // 4. Calendar Date Locking Logic:
    // Only lock date if DP / payment is confirmed/success. Unlock if unpaid.
    try {
      if (isSuccess && data?.event_date) {
        const dateStr = data.event_date.slice(0, 10);
        const startIso = `${dateStr}T05:00:00+07:00`;
        const endIso = `${dateStr}T11:00:00+07:00`;
        const pkg = data.service_package || "Bridal Makeup";

        const { data: existingSched } = await supabase
          .from("schedules")
          .select("id")
          .eq("booking_id", id)
          .maybeSingle();

        if (!existingSched) {
          await supabase.from("schedules").insert({
            booking_id: id,
            title: `Klien (${pkg})`,
            description: `SPK: ${data.spk_number || '-'} | Lokasi: ${data.venue || '-'}`,
            location: data.venue || "Venue Sesuai Kesepakatan",
            source: "booking",
            start_datetime: startIso,
            end_datetime: endIso,
          });
        }
      } else if (payment_status === "belum_bayar" || payment_status === "menunggu_konfirmasi") {
        await supabase
          .from("schedules")
          .delete()
          .eq("booking_id", id);
      }
    } catch (schedSyncErr) {
      console.error("Warning: schedule date lock sync error:", schedSyncErr);
    }

    // Auto-generate invoice and dispatch PDF links via WA/Email if payment is confirmed
    if (isSuccess) {
      try {
        await dispatchInvoiceAndSpk({ bookingId: id });
      } catch (invErr) {
        console.warn("Invoice auto-dispatch warning in bookings route:", invErr);
      }
    }

    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
