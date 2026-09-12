import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// Helper: Synchronize payments ledger with bookings and deals
async function reconcilePayments(supabase: any) {
  try {
    const { data: payments } = await supabase.from("payments").select("*");
    const existingMap = new Map<number, any>();
    (payments || []).forEach((p: any) => {
      if (p.booking_id) existingMap.set(Number(p.booking_id), p);
    });

    const { data: bookings } = await supabase
      .from("bookings")
      .select("*, clients(name, phone, email)");

    if (!bookings || !Array.isArray(bookings)) return;

    for (const b of bookings) {
      const existing = existingMap.get(Number(b.id));
      const isBookingConfirmed =
        b.payment_status === "confirmed" ||
        b.payment_status === "success" ||
        b.status === "confirmed";

      if (existing) {
        // 1. If booking confirmed but payment is not settled -> update payment to settled
        if (isBookingConfirmed && existing.status !== "settled") {
          await supabase
            .from("payments")
            .update({
              status: "settled",
              paid_at: existing.paid_at || new Date().toISOString(),
              payment_method:
                b.payment_method && b.payment_method !== "belum_bayar"
                  ? b.payment_method
                  : existing.payment_method,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existing.id);
        }
        // 2. If payment is settled but booking is still belum_bayar -> reconcile booking
        else if (existing.status === "settled" && b.payment_status === "belum_bayar") {
          await supabase
            .from("bookings")
            .update({
              payment_status: "confirmed",
              payment_method: (existing.payment_method || "transfer").toLowerCase(),
              status: "confirmed",
              updated_at: new Date().toISOString(),
            })
            .eq("id", b.id);
        }
        // 3. If booking has a specific payment_method and payment has different
        else if (
          b.payment_method &&
          b.payment_method !== "belum_bayar" &&
          (!existing.payment_method ||
            existing.payment_method.toLowerCase() !== b.payment_method.toLowerCase())
        ) {
          await supabase
            .from("payments")
            .update({
              payment_method: b.payment_method,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existing.id);
        }
      } else {
        // Missing payment record: auto-create in payments ledger
        const pMethod =
          b.payment_method && b.payment_method !== "belum_bayar"
            ? b.payment_method
            : "transfer";
        const amount =
          Number(b.dp_amount) > 0
            ? Number(b.dp_amount)
            : Number(b.total_amount) > 0
            ? Number(b.total_amount)
            : 5000000;

        await supabase.from("payments").insert({
          booking_id: b.id,
          deal_id: b.deal_id || null,
          transaction_id: `TRX-${pMethod.toUpperCase()}-${b.id}-${Date.now().toString().slice(-4)}`,
          amount: amount,
          payment_method: pMethod,
          status: isBookingConfirmed ? "settled" : "pending",
          paid_at: isBookingConfirmed ? b.signed_at || new Date().toISOString() : null,
          payment_channel:
            pMethod === "transfer"
              ? "BCA Transfer"
              : pMethod === "qris"
              ? "QRIS Instant"
              : pMethod === "kartu_kredit"
              ? "Kartu Kredit"
              : "Virtual Account",
          created_at: b.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    }
  } catch (syncErr) {
    console.error("Warning: payments reconciliation error:", syncErr);
  }
}

export async function GET() {
  try {
    const supabase = getServiceSupabase();

    // Auto-reconcile first so returned data is always in sync
    await reconcilePayments(supabase);

    const { data, error } = await supabase
      .from("payments")
      .select(`
        id,
        booking_id,
        deal_id,
        payment_method,
        payment_channel,
        transaction_id,
        amount,
        fee,
        status,
        paid_at,
        created_at,
        updated_at,
        bookings (
          id,
          deal_id,
          service_package,
          event_date,
          venue,
          spk_number,
          total_amount,
          dp_amount,
          status,
          payment_status,
          payment_method,
          clients (
            name,
            phone,
            email
          )
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    const formatted = (data || []).map((p: any) => {
      const b = p.bookings || {};
      const c = b.clients || {};
      return {
        id: p.id,
        booking_id: p.booking_id,
        deal_id: p.deal_id || b.deal_id || null,
        client_name: c.name || "Klien",
        client_phone: c.phone || "-",
        client_email: c.email || "-",
        service_package: b.service_package || "Bridal Makeup Exclusive",
        event_date: b.event_date || "-",
        spk_number: b.spk_number || null,
        payment_method: p.payment_method || b.payment_method || "transfer",
        payment_channel: p.payment_channel || "BCA Transfer",
        amount: Number(p.amount) || 0,
        fee: Number(p.fee) || 0,
        status: p.status || "pending",
        paid_at: p.paid_at,
        transaction_id: p.transaction_id || `TRX-${p.id}`,
        created_at: p.created_at,
      };
    });

    return NextResponse.json({ success: true, data: formatted });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = getServiceSupabase();
    const body = await req.json();
    const { id, status, payment_method, amount, transaction_id } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: "ID payment wajib disertakan" }, { status: 400 });
    }

    // 1. Prepare payment updates
    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (status !== undefined) updates.status = status;
    if (payment_method !== undefined) updates.payment_method = payment_method;
    if (amount !== undefined) updates.amount = Number(amount) || 0;
    if (transaction_id !== undefined) updates.transaction_id = transaction_id;

    if (status === "settled") {
      updates.paid_at = new Date().toISOString();
    } else if (status === "pending" || status === "failed") {
      updates.paid_at = null;
    }

    const { data: updatedPayment, error: pErr } = await supabase
      .from("payments")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (pErr || !updatedPayment) {
      return NextResponse.json({ success: false, message: pErr?.message || "Payment tidak ditemukan" }, { status: 500 });
    }

    // 2. Bidirectional sync to bookings table
    if (updatedPayment.booking_id) {
      const bookingUpdates: Record<string, any> = { updated_at: new Date().toISOString() };

      if (payment_method !== undefined) {
        bookingUpdates.payment_method = payment_method.toLowerCase();
      }

      if (status === "settled") {
        bookingUpdates.payment_status = "confirmed";
        bookingUpdates.status = "confirmed";
      } else if (status === "pending") {
        bookingUpdates.payment_status = "menunggu_konfirmasi";
        bookingUpdates.status = "down_payment";
      } else if (status === "failed") {
        bookingUpdates.payment_status = "belum_bayar";
      } else if (status === "refund") {
        bookingUpdates.payment_status = "belum_bayar";
        bookingUpdates.status = "cancelled";
      }

      await supabase
        .from("bookings")
        .update(bookingUpdates)
        .eq("id", updatedPayment.booking_id);

      // Calendar Date Locking Logic:
      // Only lock date if payment is SETTLED. If pending/failed, unlock date.
      if (status === "settled") {
        try {
          const { data: bRow } = await supabase
            .from("bookings")
            .select("id, event_date, venue, service_package, spk_number, total_amount, clients(name, phone)")
            .eq("id", updatedPayment.booking_id)
            .maybeSingle();

          if (bRow && bRow.event_date) {
            const dateStr = bRow.event_date.slice(0, 10);
            const startIso = `${dateStr}T05:00:00+07:00`;
            const endIso = `${dateStr}T11:00:00+07:00`;
            const clientObj: any = Array.isArray(bRow.clients) ? bRow.clients[0] : bRow.clients;
            const cName = clientObj?.name || "Klien";
            const cPhone = clientObj?.phone || "-";
            const pkg = bRow.service_package || "Bridal Makeup";

            const { data: existingSched } = await supabase
              .from("schedules")
              .select("id")
              .eq("booking_id", updatedPayment.booking_id)
              .maybeSingle();

            if (!existingSched) {
              await supabase.from("schedules").insert({
                booking_id: updatedPayment.booking_id,
                title: `${cName} (${pkg})`,
                description: `SPK: ${bRow.spk_number || '-'} | Klien: ${cName} (${cPhone}) | Lokasi: ${bRow.venue || '-'}`,
                location: bRow.venue || "Venue Sesuai Kesepakatan",
                source: "booking",
                start_datetime: startIso,
                end_datetime: endIso,
              });
            }
          }
        } catch (schedLockErr) {
          console.error("Warning: schedule lock error:", schedLockErr);
        }
      } else if (status === "pending" || status === "failed" || status === "refund") {
        try {
          await supabase
            .from("schedules")
            .delete()
            .eq("booking_id", updatedPayment.booking_id);
        } catch (schedUnlockErr) {
          console.error("Warning: schedule unlock error:", schedUnlockErr);
        }
      }

      // 3. Bidirectional sync to deal_customers table
      const dealId = updatedPayment.deal_id;
      if (dealId) {
        const dealUpdates: Record<string, any> = { updated_at: new Date().toISOString() };
        if (payment_method !== undefined) dealUpdates.payment_method = payment_method.toLowerCase();
        if (status === "settled") {
          dealUpdates.payment_status = "confirmed";
          dealUpdates.status = "dp_paid";
        } else if (status === "pending") {
          dealUpdates.payment_status = "menunggu_konfirmasi";
        } else if (status === "failed") {
          dealUpdates.payment_status = "belum_bayar";
        }

        await supabase.from("deal_customers").update(dealUpdates).eq("id", dealId);
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedPayment,
      message: "Metode dan status pembayaran berhasil disinkronkan ke Payments, Bookings, dan Deals",
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

    if (body.action === "sync_all") {
      await reconcilePayments(supabase);
      return NextResponse.json({
        success: true,
        message: "Sinkronisasi seluruh data pembayaran, bookings, dan deals berhasil dijalankan",
      });
    }

    const { booking_id, deal_id, amount, payment_method, status, transaction_id } = body;
    if (!booking_id) {
      return NextResponse.json({ success: false, message: "booking_id wajib disertakan" }, { status: 400 });
    }

    const pMethod = payment_method || "transfer";
    const pStatus = status || "pending";
    const isSettled = pStatus === "settled";

    const { data: newPayment, error } = await supabase
      .from("payments")
      .insert({
        booking_id,
        deal_id: deal_id || null,
        transaction_id: transaction_id || `TRX-${pMethod.toUpperCase()}-${booking_id}-${Date.now().toString().slice(-4)}`,
        amount: Number(amount) || 0,
        payment_method: pMethod,
        status: pStatus,
        paid_at: isSettled ? new Date().toISOString() : null,
        payment_channel: pMethod === "transfer" ? "BCA Transfer" : pMethod.toUpperCase(),
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    // Sync to booking
    await supabase
      .from("bookings")
      .update({
        payment_method: pMethod.toLowerCase(),
        payment_status: isSettled ? "confirmed" : "menunggu_konfirmasi",
        status: isSettled ? "confirmed" : "down_payment",
        updated_at: new Date().toISOString(),
      })
      .eq("id", booking_id);

    return NextResponse.json({ success: true, data: newPayment, message: "Pembayaran baru berhasil dicatat dan disinkronkan" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
