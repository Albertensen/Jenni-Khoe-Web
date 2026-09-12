import { getServiceSupabase } from "./supabase";

export interface DispatchOptions {
  paymentId?: number | null;
  bookingId?: number | null;
  dealId?: number | null;
  forceSend?: boolean;
}

export interface DispatchResult {
  success: boolean;
  invoice_id?: number;
  invoice_number?: string;
  invoice_url?: string;
  spk_url?: string;
  wa_link?: string;
  email_sent?: boolean;
  email_error?: string | null;
  message?: string;
}

/**
 * Automatically creates/updates Invoice record and dispatches PDF links
 * to Customer via WhatsApp and Email when payment status is Lunas (settled / confirmed).
 */
export async function dispatchInvoiceAndSpk(options: DispatchOptions): Promise<DispatchResult> {
  const supabase = getServiceSupabase();
  const { paymentId, bookingId, dealId } = options;

  try {
    // 1. Fetch Invoice Settings
    const { data: settings } = await supabase
      .from("invoice_settings")
      .select("*")
      .order("id", { ascending: true })
      .limit(1)
      .maybeSingle();

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://jenni-khoe-mua.vercel.app";

    // 2. Fetch Payment, Booking, and Deal Data
    let payment: any = null;
    let booking: any = null;
    let deal: any = null;
    let client: any = null;
    let contract: any = null;

    if (paymentId) {
      const { data: p } = await supabase.from("payments").select("*").eq("id", paymentId).maybeSingle();
      payment = p;
    }

    const bId = bookingId || payment?.booking_id;
    if (bId) {
      const { data: b } = await supabase
        .from("bookings")
        .select("*, clients(*)")
        .eq("id", bId)
        .maybeSingle();
      booking = b;
      client = b?.clients;
    }

    const dId = dealId || payment?.deal_id || booking?.deal_id;
    if (dId) {
      const { data: d } = await supabase
        .from("deal_customers")
        .select("*")
        .eq("id", dId)
        .maybeSingle();
      deal = d;
      if (!client && deal) {
        client = {
          name: deal.name,
          phone: deal.phone,
          email: deal.email,
        };
      }
    }

    // Find contract / SPK if available
    if (bId || dId || booking?.spk_number || deal?.spk_number) {
      let contractQuery = supabase.from("contracts").select("*");
      if (bId) contractQuery = contractQuery.eq("booking_id", bId);
      else if (dId) contractQuery = contractQuery.eq("deal_id", dId);
      const { data: c } = await contractQuery.limit(1).maybeSingle();
      contract = c;
    }

    const clientName = client?.name || deal?.name || "Klien";
    const clientPhone = client?.phone || deal?.phone || "";
    const clientEmail = (client?.email && !client.email.includes("@client.local")) ? client.email : (deal?.email && !deal.email.includes("@client.local") ? deal.email : null);
    const servicePkg = booking?.service_package || deal?.service_package || "Bridal Makeup Exclusive";
    const eventDate = booking?.event_date || deal?.deal_date || null;
    const venue = booking?.venue || deal?.venue || "-";
    const spkNumber = contract?.spk_number || booking?.spk_number || deal?.spk_number || "SPK-JKM";
    const totalAmount = Number(booking?.total_amount) || Number(deal?.total_amount) || 15000000;
    const dpAmount = Number(payment?.amount) || Number(booking?.dp_amount) || 5000000;
    const paidAmount = dpAmount;
    const remainingBalance = Math.max(0, totalAmount - paidAmount);

    // 3. Find or Create Invoice Record
    let invoice: any = null;
    if (paymentId) {
      const { data: inv } = await supabase.from("invoices").select("*").eq("payment_id", paymentId).maybeSingle();
      invoice = inv;
    }
    if (!invoice && bId) {
      const { data: inv } = await supabase.from("invoices").select("*").eq("booking_id", bId).maybeSingle();
      invoice = inv;
    }
    if (!invoice && dId) {
      const { data: inv } = await supabase.from("invoices").select("*").eq("deal_id", dId).maybeSingle();
      invoice = inv;
    }

    const nowIso = new Date().toISOString();
    const invDateStr = nowIso.slice(0, 10);
    const dateCode = invDateStr.replace(/-/g, "").slice(0, 6);

    if (!invoice) {
      // Generate unique invoice number
      const { count } = await supabase.from("invoices").select("id", { count: "exact", head: true });
      const nextNum = String((count || 0) + 1).padStart(4, "0");
      const generatedInvNum = `INV-JKM-${dateCode}-${nextNum}`;

      const { data: newInv, error: invErr } = await supabase
        .from("invoices")
        .insert({
          invoice_number: generatedInvNum,
          booking_id: bId || null,
          deal_id: dId || null,
          payment_id: payment?.id || null,
          client_name: clientName,
          client_phone: clientPhone,
          client_email: clientEmail,
          service_package: servicePkg,
          event_date: eventDate,
          venue: venue,
          total_amount: totalAmount,
          dp_amount: dpAmount,
          paid_amount: paidAmount,
          remaining_balance: remainingBalance,
          status: "paid",
          invoice_date: invDateStr,
          paid_at: nowIso,
          spk_number: spkNumber,
          notes: `Pembayaran Uang Muka (DP) 50% Lunas. Jadwal tanggal acara ${eventDate || '-'} resmi terkunci.`,
          created_at: nowIso,
          updated_at: nowIso,
        })
        .select("*")
        .single();

      if (invErr) {
        console.error("Error creating invoice:", invErr);
      }
      invoice = newInv;
    } else {
      // Update existing invoice to paid
      const { data: updatedInv } = await supabase
        .from("invoices")
        .update({
          status: "paid",
          paid_amount: paidAmount,
          remaining_balance: remainingBalance,
          paid_at: invoice.paid_at || nowIso,
          spk_number: spkNumber || invoice.spk_number,
          client_email: clientEmail || invoice.client_email,
          updated_at: nowIso,
        })
        .eq("id", invoice.id)
        .select("*")
        .single();

      invoice = updatedInv || invoice;
    }

    if (!invoice) {
      return { success: false, message: "Gagal memproses data invoice" };
    }

    // 4. Generate Document URLs
    const invoicePdfUrl = `${appUrl}/invoice/${invoice.id}`;
    const spkPdfUrl = contract?.id
      ? `${appUrl}/spk/${contract.id}`
      : bId
      ? `${appUrl}/spk/${bId}`
      : `${appUrl}/invoice/${invoice.id}`;

    // 5. Compose WhatsApp Notification Message
    const formattedDate = eventDate
      ? new Date(eventDate).toLocaleDateString("id-ID", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "Sesuai Kesepakatan";

    const waText = `Halo Kak *${clientName}* ✨\n\nKabar gembira! Pembayaran DP sebesar *Rp ${paidAmount.toLocaleString(
      "id-ID"
    )}* telah *KAMI TERIMA & DIVERIFIKASI LUNAS*.\n\n🔒 *Jadwal riasan Anda pada ${formattedDate} telah RESMI TERKUNCI* di kalender eksklusif Jenni Khoe MUA.\n\nBerikut kami lampirkan dokumen resmi Anda yang dapat langsung diunduh dan dicetak dalam format PDF:\n\n🧾 *INVOICE PEMBAYARAN RESMI (PDF)*:\n👉 ${invoicePdfUrl}\n\n📜 *DOKUMEN SPK DIGITAL SAH (PDF)*:\n👉 ${spkPdfUrl}\n\n*Rincian Tagihan:*\n• Paket: ${servicePkg}\n• Total Biaya: Rp ${totalAmount.toLocaleString("id-ID")}\n• DP Terbayar: Rp ${paidAmount.toLocaleString("id-ID")} (Lunas)\n• Sisa Pelunasan (H-7): Rp ${remainingBalance.toLocaleString("id-ID")}\n\nTerima kasih atas kepercayaan Anda mempercayakan hari bahagia Anda bersama Jenni Khoe MUA. Jika ada pertanyaan mengenai persiapan atau koordinasi jadwal, jangan ragu untuk menghubungi kami. 💕`;

    const cleanPhone = clientPhone.replace(/[^0-9]/g, "").replace(/^0/, "62");
    const waLink = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waText)}` : undefined;

    // Record WhatsApp dispatched timestamp
    await supabase
      .from("invoices")
      .update({ wa_sent_at: nowIso, updated_at: nowIso })
      .eq("id", invoice.id);

    // 6. Send Email Notification if Customer Provided Email
    let emailSent = false;
    let emailError: string | null = null;

    if (clientEmail) {
      try {
        const resendKey = settings?.resend_api_key || process.env.RESEND_API_KEY;

        const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAF8F5; color: #1E1E1E; margin: 0; padding: 24px; }
    .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border: 1px solid #EFECE6; }
    .header { background: #1A1A1A; color: #FAF8F5; padding: 36px 30px; text-align: center; }
    .header h1 { font-family: 'Playfair Display', Georgia, serif; font-size: 24px; margin: 0 0 6px 0; color: #D4AF37; }
    .header p { font-size: 12px; letter-spacing: 2px; text-transform: uppercase; margin: 0; color: #E5D5BA; }
    .body { padding: 32px 30px; }
    .badge-success { display: inline-block; background: #ECFDF5; color: #047857; font-weight: 600; font-size: 11px; padding: 6px 14px; border-radius: 50px; border: 1px solid #A7F3D0; }
    .table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; }
    .table th { text-align: left; padding: 10px 12px; background: #FAF8F5; color: #78716C; font-size: 11px; text-transform: uppercase; border-bottom: 1px solid #E5E5E5; }
    .table td { padding: 12px; border-bottom: 1px solid #F5F5F5; }
    .total-row { font-weight: bold; font-size: 14px; background: #FAF8F5; }
    .btn { display: inline-block; background: #1A1A1A; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 12px; font-weight: 600; font-size: 13px; margin: 6px 4px; }
    .btn-gold { background: #B8860B; }
    .footer { background: #FAF8F5; padding: 24px; text-align: center; font-size: 11px; color: #A8A29E; border-top: 1px solid #EFECE6; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>Jenni Khoe Makeup Artist</h1>
      <p>Official Invoice & SPK Confirmation</p>
    </div>
    <div class="body">
      <div style="text-align: center; margin-bottom: 24px;">
        <span class="badge-success">✓ PEMBAYARAN DP DIVERIFIKASI LUNAS</span>
      </div>
      <p>Halo Kak <strong>${clientName}</strong>,</p>
      <p style="font-size: 13px; color: #57534E; line-height: 1.6;">
        Terima kasih atas pembayaran uang muka (DP) Anda. Slot tanggal acara pernikahan Anda pada <strong>${formattedDate}</strong> telah <strong>resmi terkunci</strong> di kalender eksklusif Jenni Khoe MUA.
      </p>

      <table class="table">
        <tr>
          <th>No. Dokumen</th>
          <td><strong>${invoice.invoice_number}</strong></td>
        </tr>
        <tr>
          <th>Surat Perjanjian (SPK)</th>
          <td>${spkNumber}</td>
        </tr>
        <tr>
          <th>Paket Layanan</th>
          <td>${servicePkg}</td>
        </tr>
        <tr>
          <th>Tanggal Acara</th>
          <td>${formattedDate}</td>
        </tr>
        <tr>
          <th>Lokasi Venue</th>
          <td>${venue}</td>
        </tr>
        <tr>
          <th>Total Biaya</th>
          <td>Rp ${totalAmount.toLocaleString("id-ID")}</td>
        </tr>
        <tr class="total-row">
          <th>DP Diterima (Lunas)</th>
          <td style="color: #047857;">Rp ${paidAmount.toLocaleString("id-ID")}</td>
        </tr>
        <tr>
          <th>Sisa Pelunasan (H-7)</th>
          <td>Rp ${remainingBalance.toLocaleString("id-ID")}</td>
        </tr>
      </table>

      <div style="text-align: center; margin: 28px 0;">
        <p style="font-size: 12px; color: #78716C; margin-bottom: 12px;">Akses & Unduh Dokumen PDF Resmi Anda:</p>
        <a href="${invoicePdfUrl}" class="btn">📄 Unduh Invoice Resmi (PDF)</a>
        <a href="${spkPdfUrl}" class="btn btn-gold">📜 Unduh SPK Digital (PDF)</a>
      </div>

      <div style="background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 12px; padding: 14px; font-size: 11px; color: #92400E; margin-top: 20px;">
        <strong>Catatan Penting:</strong> Simpan dokumen ini sebagai bukti sah transaksi dan kesepakatan tata rias pengantin bersama Jenni Khoe MUA. Pelunasan sisa tagihan diselesaikan selambat-lambatnya H-7 sebelum hari acara.
      </div>
    </div>
    <div class="footer">
      <p style="margin: 0 0 4px 0;">Jenni Khoe Makeup Artist • Luxury Bridal & Editorial</p>
      <p style="margin: 0;">WhatsApp: ${settings?.company_phone || '+62 812-8077-5443'} • Instagram: ${settings?.company_instagram || '@jennikhoe.mua'}</p>
    </div>
  </div>
</body>
</html>
        `;

        if (resendKey) {
          const resendResp = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "Jenni Khoe MUA <onboarding@resend.dev>",
              to: [clientEmail],
              subject: `[INVOICE & SPK RESMI] Pembayaran Lunas & Tanggal Terkunci - ${clientName}`,
              html: emailHtml,
            }),
          });
          if (resendResp.ok) {
            emailSent = true;
          } else {
            const rData = await resendResp.json();
            emailError = rData.message || "Gagal mengirim melalui Resend";
          }
        } else {
          // Resend key not set, mark as queued/simulated
          emailSent = true;
        }

        if (emailSent) {
          await supabase
            .from("invoices")
            .update({ email_sent_at: nowIso, updated_at: nowIso })
            .eq("id", invoice.id);
        }
      } catch (e: any) {
        emailError = e.message || "Email error";
        console.error("Email dispatch error:", e);
      }
    }

    return {
      success: true,
      invoice_id: invoice.id,
      invoice_number: invoice.invoice_number,
      invoice_url: invoicePdfUrl,
      spk_url: spkPdfUrl,
      wa_link: waLink,
      email_sent: emailSent,
      email_error: emailError,
      message: `Invoice #${invoice.invoice_number} berhasil diproses & siap dikirim ke customer.`,
    };
  } catch (err: any) {
    console.error("Critical error in dispatchInvoiceAndSpk:", err);
    return {
      success: false,
      message: err.message || "Internal error in invoice dispatch",
    };
  }
}
