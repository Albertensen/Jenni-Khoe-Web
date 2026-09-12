import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { isSignatureValid } from "@/lib/signature-validator";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;
    const body = await req.json();
    const { signature_data, terms_accepted, terms_content: clientTermsContent } = body;

    if (!token) {
      return NextResponse.json({ success: false, message: "Token tidak valid" }, { status: 400 });
    }

    if (!terms_accepted) {
      return NextResponse.json({ success: false, message: "Anda wajib mencentang persetujuan Syarat & Ketentuan SPK" }, { status: 400 });
    }

    if (!isSignatureValid(signature_data)) {
      return NextResponse.json(
        { success: false, message: "Tanda tangan digital wajib digoreskan dengan jelas sebelum memproses SPK." },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // 1. Fetch deal record
    const { data: deal, error: fetchErr } = await supabase
      .from("deal_customers")
      .select("*")
      .eq("booking_token", token)
      .single();

    if (fetchErr || !deal) {
      return NextResponse.json({ success: false, message: "Deal tidak ditemukan" }, { status: 404 });
    }

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
    const spkNumber = deal.spk_number || `SPK-JKM-${dateStr}-${String(deal.id).padStart(4, "0")}`;

    // 2. Update deal_customers
    const { data: updatedDeal, error: dealUpdateErr } = await supabase
      .from("deal_customers")
      .update({
        client_signature: signature_data,
        terms_accepted: true,
        spk_number: spkNumber,
        signed_at: now.toISOString(),
        status: "spk_signed",
        payment_method: deal.payment_method || "belum_bayar",
        payment_status: deal.payment_status || "belum_bayar",
        updated_at: now.toISOString(),
      })
      .eq("booking_token", token)
      .select("*")
      .single();

    if (dealUpdateErr) {
      return NextResponse.json({ success: false, message: dealUpdateErr.message }, { status: 500 });
    }

    // 3. Immediately insert/sync to clients and bookings table
    try {
      // Find or create client
      let clientId: number | null = null;
      const cleanPhone = (deal.phone || "").replace(/[^0-9]/g, "");

      const { data: existingClient } = await supabase
        .from("clients")
        .select("id")
        .eq("phone", deal.phone)
        .maybeSingle();

      if (existingClient?.id) {
        clientId = existingClient.id;
      } else {
        const { data: newClient, error: clientErr } = await supabase
          .from("clients")
          .insert({
            name: deal.name,
            phone: deal.phone,
            email: deal.email || `${cleanPhone || Date.now()}@client.local`,
            venue: deal.venue || null,
          })
          .select("id")
          .single();

        if (!clientErr && newClient) {
          clientId = newClient.id;
        }
      }

      // Check if booking already exists for this deal
      const { data: existingBooking } = await supabase
        .from("bookings")
        .select("id")
        .eq("deal_id", deal.id)
        .maybeSingle();

      let bookingId = existingBooking?.id;

      if (existingBooking) {
        await supabase
          .from("bookings")
          .update({
            service_package: deal.service_package || "Bridal Makeup Exclusive",
            event_date: deal.deal_date || now.toISOString().slice(0, 10),
            venue: deal.venue || "Venue Sesuai Kesepakatan",
            status: "down_payment",
            spk_number: spkNumber,
            booking_token: token,
            client_signature: signature_data,
            signed_at: now.toISOString(),
            payment_method: deal.payment_method || "belum_bayar",
            payment_status: deal.payment_status || "belum_bayar",
            notes: `SPK ${spkNumber} disetujui & ditandatangani digital oleh klien.`,
            updated_at: now.toISOString(),
          })
          .eq("id", existingBooking.id);
      } else {
        const { data: newBooking, error: bookingErr } = await supabase
          .from("bookings")
          .insert({
            client_id: clientId,
            deal_id: deal.id,
            service_package: deal.service_package || "Bridal Makeup Exclusive",
            event_date: deal.deal_date || now.toISOString().slice(0, 10),
            venue: deal.venue || "Venue Sesuai Kesepakatan",
            status: "down_payment",
            spk_number: spkNumber,
            booking_token: token,
            client_signature: signature_data,
            signed_at: now.toISOString(),
            payment_method: "belum_bayar",
            payment_status: "belum_bayar",
            total_amount: 0,
            dp_amount: 0,
            notes: `SPK ${spkNumber} disetujui & ditandatangani digital oleh klien.`,
          })
          .select("id")
          .single();

        if (!bookingErr && newBooking) {
          bookingId = newBooking.id;
        }
      }

      // Link booking_id back to deal_customers & sync to payments table
      if (bookingId) {
        await supabase
          .from("deal_customers")
          .update({ booking_id: bookingId })
          .eq("id", deal.id);

        try {
          const { data: existingPay } = await supabase
            .from("payments")
            .select("id")
            .eq("booking_id", bookingId)
            .maybeSingle();

          const pMethod =
            deal.payment_method && deal.payment_method !== "belum_bayar"
              ? deal.payment_method
              : "transfer";
          const isConfirmed =
            deal.payment_status === "confirmed" || deal.payment_status === "success";

          if (existingPay) {
            await supabase
              .from("payments")
              .update({
                payment_method: pMethod,
                status: isConfirmed ? "settled" : "pending",
                updated_at: now.toISOString(),
              })
              .eq("id", existingPay.id);
          } else {
            await supabase.from("payments").insert({
              booking_id: bookingId,
              deal_id: deal.id,
              transaction_id: `TRX-${pMethod.toUpperCase()}-${bookingId}-${Date.now().toString().slice(-4)}`,
              amount: 5000000,
              payment_method: pMethod,
              status: isConfirmed ? "settled" : "pending",
              paid_at: isConfirmed ? now.toISOString() : null,
              payment_channel:
                pMethod === "transfer"
                  ? "BCA Transfer"
                  : pMethod === "qris"
                  ? "QRIS Instant"
                  : "Kartu Kredit",
              created_at: now.toISOString(),
              updated_at: now.toISOString(),
            });
          }
        } catch (pErr) {
          console.error("Warning: payments sync from sign route error:", pErr);
        }
      }
    } catch (syncErr) {
      console.error("Warning: Booking sync error:", syncErr);
    }

    // 4. Determine final T&C content
    let finalTermsContent = clientTermsContent?.trim() || "";
    if (!finalTermsContent) {
      try {
        const { data: tncSetting } = await supabase
          .from("spk_tnc_settings")
          .select("content")
          .eq("is_active", true)
          .order("id", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (tncSetting?.content) {
          finalTermsContent = tncSetting.content;
        }
      } catch {
        // ignore
      }
    }

    if (!finalTermsContent) {
      finalTermsContent = "Surat Perjanjian Kerja (SPK) Layanan Tata Rias Pengantin Jenni Khoe MUA.";
    }

    // 5. Immediately insert/sync to contracts table (SPK Archive)
    try {
      const clientIp =
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        req.headers.get("x-real-ip") ||
        "127.0.0.1";

      const finalBookingId = deal.booking_id || null;

      await supabase
        .from("contracts")
        .upsert(
          {
            booking_id: finalBookingId,
            deal_id: deal.id,
            spk_number: spkNumber,
            client_name: deal.name,
            client_phone: deal.phone,
            service_package: deal.service_package || "Bridal Makeup Exclusive",
            event_date: deal.deal_date || now.toISOString().slice(0, 10),
            venue: deal.venue || "Venue Sesuai Kesepakatan",
            client_signature_data: signature_data,
            signed_at: now.toISOString(),
            signed_ip: clientIp,
            terms_content: finalTermsContent,
            updated_at: now.toISOString(),
          },
          { onConflict: "spk_number" }
        );
    } catch (contractErr) {
      console.error("Warning: Contract archive sync error:", contractErr);
    }

    return NextResponse.json({
      success: true,
      message: "SPK berhasil ditandatangani secara digital dan masuk ke sistem booking",
      data: updatedDeal,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
