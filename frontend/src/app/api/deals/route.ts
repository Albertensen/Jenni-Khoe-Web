import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import crypto from "crypto";

export const dynamic = "force-dynamic";

function normalizePhone(rawPhone: string | null | undefined): string {
  if (!rawPhone) return "-";
  let clean = String(rawPhone).trim().replace(/[^0-9+]/g, "");
  if (clean.startsWith("08")) {
    clean = "628" + clean.slice(2);
  } else if (clean.startsWith("+62")) {
    clean = clean.slice(1);
  }
  return clean;
}

function generateBookingToken(): string {
  return "deal_" + crypto.randomBytes(8).toString("hex");
}

export async function GET(req: NextRequest) {
  try {
    const supabase = getServiceSupabase();
    const url = new URL(req.url);
    const includeAll = url.searchParams.get("all") === "true";

    let query = supabase
      .from("deal_customers")
      .select("*")
      .order("updated_at", { ascending: false });

    // Ponytail: exclude deals with completed/success payments so they only appear in Bookings
    if (!includeAll) {
      query = query
        .neq("status", "dp_paid")
        .neq("payment_status", "confirmed")
        .neq("payment_status", "success");
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data || [] });
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
      lead_id,
      name,
      phone,
      deal_date,
      deal_time,
      venue,
      service_package,
      source,
      admin_notes,
    } = body;

    if (!name || !phone) {
      return NextResponse.json(
        { success: false, message: "Nama dan Nomor HP wajib diisi" },
        { status: 400 }
      );
    }

    const cleanPhone = normalizePhone(phone);
    const dealSource = source || (lead_id ? "crm" : "manual");

    // Check if an active (non-dp_paid) deal already exists for this phone number
    const { data: existingDeals } = await supabase
      .from("deal_customers")
      .select("*")
      .eq("phone", cleanPhone)
      .neq("status", "dp_paid")
      .neq("payment_status", "confirmed")
      .neq("payment_status", "success")
      .order("created_at", { ascending: false })
      .limit(1);

    if (existingDeals && existingDeals.length > 0) {
      const existing = existingDeals[0];
      const updates: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };
      if (deal_date) updates.deal_date = deal_date;
      if (deal_time) updates.deal_time = deal_time;
      if (venue) updates.venue = venue;
      if (service_package) updates.service_package = service_package;
      if (admin_notes) updates.admin_notes = admin_notes;

      if (Object.keys(updates).length > 1) {
        await supabase
          .from("deal_customers")
          .update(updates)
          .eq("id", existing.id);
      }

      if (lead_id) {
        await supabase
          .from("ai_leads")
          .update({
            status: "closed",
            closing_stage: "Siap Booking / Menuju WhatsApp",
            updated_at: new Date().toISOString(),
          })
          .eq("id", lead_id);
      }

      return NextResponse.json({
        success: true,
        data: { ...existing, ...updates },
        message: "Data deal customer diperbarui",
        isExisting: true,
      });
    }

    // Generate unique booking token
    const token = generateBookingToken();

    const insertPayload = {
      lead_id: lead_id || null,
      name: name.trim(),
      phone: cleanPhone,
      deal_date: deal_date || null,
      deal_time: deal_time || "06:00 WIB",
      venue: venue || null,
      service_package: service_package || "Bridal Makeup Exclusive",
      booking_token: token,
      status: "draft",
      source: dealSource,
      admin_notes: admin_notes || null,
      payment_method: "belum_bayar",
      payment_status: "belum_bayar",
    };

    const { data, error } = await supabase
      .from("deal_customers")
      .insert(insertPayload)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    // Mark lead status as closed in ai_leads if originating from CRM
    if (lead_id) {
      await supabase
        .from("ai_leads")
        .update({
          status: "closed",
          closing_stage: "Siap Booking / Menuju WhatsApp",
          updated_at: new Date().toISOString(),
        })
        .eq("id", lead_id);
    }

    return NextResponse.json({
      success: true,
      data,
      message:
        dealSource === "manual"
          ? "Deal manual oleh admin berhasil ditambahkan"
          : "Prospek CRM berhasil dipindahkan ke Deal Customer",
      isExisting: false,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = getServiceSupabase();
    const body = await req.json();

    const {
      id,
      name,
      phone,
      deal_date,
      deal_time,
      venue,
      status,
      service_package,
      admin_notes,
      payment_status,
      payment_method,
    } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: "ID Deal wajib disertakan" }, { status: 400 });
    }

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updates.name = name.trim();
    if (phone !== undefined) updates.phone = normalizePhone(phone);
    if (deal_date !== undefined) updates.deal_date = deal_date;
    if (deal_time !== undefined) updates.deal_time = deal_time;
    if (venue !== undefined) updates.venue = venue;
    if (status !== undefined) updates.status = status;
    if (service_package !== undefined) updates.service_package = service_package;
    if (admin_notes !== undefined) updates.admin_notes = admin_notes;
    if (payment_status !== undefined) updates.payment_status = payment_status;
    if (payment_method !== undefined) updates.payment_method = payment_method;

    if (payment_status === "confirmed" || payment_status === "success") {
      updates.status = "dp_paid";
    }

    const { data, error } = await supabase
      .from("deal_customers")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    // Bidirectional sync to bookings and payments table if already linked
    try {
      const bookingUpdates: Record<string, any> = { updated_at: new Date().toISOString() };
      if (payment_status !== undefined) bookingUpdates.payment_status = payment_status;
      if (payment_method !== undefined) bookingUpdates.payment_method = payment_method;
      if (payment_status === "confirmed" || payment_status === "success") {
        bookingUpdates.status = "confirmed";
      }
      if (deal_date !== undefined) bookingUpdates.event_date = deal_date;
      if (venue !== undefined) bookingUpdates.venue = venue;
      if (service_package !== undefined) bookingUpdates.service_package = service_package;

      const { data: updatedBooking } = await supabase
        .from("bookings")
        .update(bookingUpdates)
        .eq("deal_id", id)
        .select("id, dp_amount, total_amount, payment_method, payment_status, event_date")
        .maybeSingle();

      if (updatedBooking?.id) {
        const isSuccess = payment_status === "confirmed" || payment_status === "success";
        const pMethod = payment_method || updatedBooking.payment_method || "transfer";

        const { data: existingPayment } = await supabase
          .from("payments")
          .select("id, paid_at")
          .eq("booking_id", updatedBooking.id)
          .maybeSingle();

        if (existingPayment) {
          const payUpdates: Record<string, any> = { updated_at: new Date().toISOString() };
          if (payment_method !== undefined) payUpdates.payment_method = payment_method;
          if (payment_status !== undefined) {
            payUpdates.status = isSuccess ? "settled" : "pending";
            payUpdates.paid_at = isSuccess ? existingPayment.paid_at || new Date().toISOString() : null;
          }
          await supabase.from("payments").update(payUpdates).eq("id", existingPayment.id);
        } else {
          const amount =
            Number(updatedBooking.dp_amount) > 0
              ? Number(updatedBooking.dp_amount)
              : Number(updatedBooking.total_amount) > 0
              ? Number(updatedBooking.total_amount)
              : 5000000;

          await supabase.from("payments").insert({
            booking_id: updatedBooking.id,
            deal_id: id,
            transaction_id: `TRX-${pMethod.toUpperCase()}-${updatedBooking.id}-${Date.now().toString().slice(-4)}`,
            amount,
            payment_method: pMethod,
            status: isSuccess ? "settled" : "pending",
            paid_at: isSuccess ? new Date().toISOString() : null,
            payment_channel:
              pMethod === "transfer"
                ? "BCA Transfer"
                : pMethod === "qris"
                ? "QRIS Instant"
                : pMethod.toUpperCase(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }

        // Calendar Date Locking:
        // Only lock date if DP / payment is confirmed. Unlock date if unpaid.
        try {
          if (isSuccess && (deal_date || updatedBooking.event_date)) {
            const dDate = (deal_date || updatedBooking.event_date).slice(0, 10);
            const startIso = `${dDate}T05:00:00+07:00`;
            const endIso = `${dDate}T11:00:00+07:00`;
            const { data: existingSched } = await supabase
              .from("schedules")
              .select("id")
              .eq("booking_id", updatedBooking.id)
              .maybeSingle();

            if (!existingSched) {
              await supabase.from("schedules").insert({
                booking_id: updatedBooking.id,
                title: `${name || 'Klien'} (${service_package || 'Bridal Makeup'})`,
                description: `Deal #${id} | Lokasi: ${venue || '-'}`,
                location: venue || "Venue Sesuai Kesepakatan",
                source: "booking",
                start_datetime: startIso,
                end_datetime: endIso,
              });
            }
          } else if (payment_status === "belum_bayar" || payment_status === "menunggu_konfirmasi") {
            await supabase
              .from("schedules")
              .delete()
              .eq("booking_id", updatedBooking.id);
          }
        } catch (schedSyncErr) {
          console.error("Warning: schedule date lock sync error from deals:", schedSyncErr);
        }
      }
    } catch (bookingErr) {
      console.error("Sync error to bookings/payments from deals PATCH:", bookingErr);
    }

    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
