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
    const { payment_method } = body;

    if (!token) {
      return NextResponse.json({ success: false, message: "Token tidak valid" }, { status: 400 });
    }

    const validMethods = ["transfer", "qris", "kartu_kredit", "belum_bayar"];
    const method = validMethods.includes(payment_method) ? payment_method : "transfer";
    const paymentStatus = method === "belum_bayar" ? "belum_bayar" : "menunggu_konfirmasi";

    const supabase = getServiceSupabase();

    // Verify deal exists and is signed with terms accepted AND non-blank signature
    const { data: currentDeal, error: fetchErr } = await supabase
      .from("deal_customers")
      .select("id, status, terms_accepted, client_signature, signed_at")
      .eq("booking_token", token)
      .single();

    if (fetchErr || !currentDeal) {
      return NextResponse.json({ success: false, message: "Deal tidak ditemukan" }, { status: 404 });
    }

    if (!currentDeal.terms_accepted || !isSignatureValid(currentDeal.client_signature)) {
      return NextResponse.json(
        {
          success: false,
          message: "Anda wajib menyetujui Syarat & Ketentuan serta membubuhkan tanda tangan digital pada SPK terlebih dahulu sebelum memilih metode pembayaran.",
        },
        { status: 403 }
      );
    }

    // 1. Update deal_customers
    const { data: updatedDeal, error: dealErr } = await supabase
      .from("deal_customers")
      .update({
        payment_method: method,
        payment_status: paymentStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("booking_token", token)
      .select("*")
      .single();

    if (dealErr || !updatedDeal) {
      return NextResponse.json({ success: false, message: dealErr?.message || "Deal tidak ditemukan" }, { status: 500 });
    }

    // 2. Sync to bookings table
    try {
      const { data: updatedBookings } = await supabase
        .from("bookings")
        .update({
          payment_method: method,
          payment_status: paymentStatus,
          updated_at: new Date().toISOString(),
        })
        .or(`deal_id.eq.${updatedDeal.id},booking_token.eq.${token}`)
        .select("id, dp_amount, total_amount");

      // 3. Sync to payments table
      const bId = (updatedBookings && updatedBookings[0]?.id) || updatedDeal.booking_id;
      if (bId) {
        const { data: existingPay } = await supabase
          .from("payments")
          .select("id")
          .eq("booking_id", bId)
          .maybeSingle();

        const channel =
          method === "transfer"
            ? "BCA Transfer"
            : method === "qris"
            ? "QRIS Instant"
            : method === "kartu_kredit"
            ? "Kartu Kredit"
            : "Virtual Account";

        if (existingPay) {
          await supabase
            .from("payments")
            .update({
              payment_method: method,
              payment_channel: channel,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingPay.id);
        } else {
          const bRow = updatedBookings?.[0];
          const dpAmount = Number(bRow?.dp_amount || 0);
          const totalAmount = Number(bRow?.total_amount || 0);
          const amount = dpAmount > 0 ? dpAmount : totalAmount > 0 ? totalAmount : 5000000;

          await supabase.from("payments").insert({
            booking_id: bId,
            deal_id: updatedDeal.id,
            transaction_id: `TRX-${method.toUpperCase()}-${bId}-${Date.now().toString().slice(-4)}`,
            amount,
            payment_method: method,
            status: "pending",
            paid_at: null,
            payment_channel: channel,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }
      }
    } catch (bookingSyncErr) {
      console.error("Sync to bookings/payments error:", bookingSyncErr);
    }

    return NextResponse.json({
      success: true,
      message: `Metode pembayaran ${method} berhasil disimpan dan disinkronkan`,
      data: updatedDeal,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
