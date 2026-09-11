import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = getServiceSupabase();

    // 1. Auto-reconciliation: heal missing contract records from bookings without overwriting existing terms
    try {
      // Get existing SPK numbers already in contracts
      const { data: existingContracts } = await supabase
        .from("contracts")
        .select("spk_number");

      const existingSpkSet = new Set((existingContracts || []).map((c) => c.spk_number));

      const { data: unsyncedBookings } = await supabase
        .from("bookings")
        .select("id, deal_id, spk_number, client_signature, signed_at, service_package, event_date, venue, clients(name, phone)")
        .not("spk_number", "is", null);

      if (unsyncedBookings && unsyncedBookings.length > 0) {
        // Fetch active T&C template as fallback for new entries
        let fallbackTerms = "Surat Perjanjian Kerja (SPK) Layanan Tata Rias Pengantin Jenni Khoe MUA.";
        try {
          const { data: activeTnc } = await supabase
            .from("spk_tnc_settings")
            .select("content")
            .eq("is_active", true)
            .order("id", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (activeTnc?.content) {
            fallbackTerms = activeTnc.content;
          }
        } catch {
          // ignore
        }

        for (const b of unsyncedBookings) {
          if (!b.spk_number || existingSpkSet.has(b.spk_number)) {
            // Already preserved in contracts - do NOT overwrite!
            continue;
          }

          await supabase
            .from("contracts")
            .insert({
              booking_id: b.id,
              deal_id: b.deal_id || null,
              spk_number: b.spk_number,
              client_name: (b.clients as any)?.name || "Klien",
              client_phone: (b.clients as any)?.phone || "-",
              service_package: b.service_package || "Bridal Makeup Exclusive",
              event_date: b.event_date || "-",
              venue: b.venue || "Venue Sesuai Kesepakatan",
              client_signature_data: b.client_signature || null,
              signed_at: b.signed_at || new Date().toISOString(),
              signed_ip: "127.0.0.1",
              terms_content: fallbackTerms,
              updated_at: new Date().toISOString(),
            });
        }
      }
    } catch (healErr) {
      console.error("Auto-heal contracts archive error:", healErr);
    }

    // 2. Query all contracts from contracts table
    const { data, error } = await supabase
      .from("contracts")
      .select("id, booking_id, deal_id, spk_number, client_name, client_phone, service_package, event_date, venue, signed_at, signed_ip, client_signature_data, terms_content, pdf_path, created_at, bookings(clients(name, phone))")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    const formatted = (data || []).map((c: any) => {
      const clientName = c.client_name || c.bookings?.clients?.name || "Klien";
      const clientPhone = c.client_phone || c.bookings?.clients?.phone || "-";
      return {
        id: c.id,
        booking_id: c.booking_id,
        deal_id: c.deal_id,
        client_name: clientName,
        client_phone: clientPhone,
        service_package: c.service_package || "Bridal Makeup Exclusive",
        event_date: c.event_date || "-",
        venue: c.venue || "Venue Sesuai Kesepakatan",
        spk_number: c.spk_number,
        signed_at: c.signed_at,
        signed_ip: c.signed_ip || "-",
        status: c.signed_at ? "signed" : "pending",
        client_signature_data: c.client_signature_data || null,
        terms_content: c.terms_content,
        pdf_path: c.pdf_path || null,
        created_at: c.created_at,
      };
    });

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
    const {
      booking_id,
      deal_id,
      spk_number,
      client_name,
      client_phone,
      service_package,
      event_date,
      venue,
      client_signature_data,
      signed_at,
      terms_content,
    } = body;

    if (!spk_number) {
      return NextResponse.json({ success: false, message: "Nomor SPK wajib diisi" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    const { data, error } = await supabase
      .from("contracts")
      .upsert(
        {
          booking_id: booking_id || null,
          deal_id: deal_id || null,
          spk_number,
          client_name: client_name || "Klien",
          client_phone: client_phone || "-",
          service_package: service_package || "Bridal Makeup Exclusive",
          event_date: event_date || "-",
          venue: venue || "Venue Sesuai Kesepakatan",
          client_signature_data: client_signature_data || null,
          signed_at: signed_at || now,
          signed_ip: clientIp,
          terms_content: terms_content || "Surat Perjanjian Kerja (SPK) Layanan Tata Rias Pengantin Jenni Khoe MUA.",
          updated_at: now,
        },
        { onConflict: "spk_number" }
      )
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const spk_number = searchParams.get("spk_number");

    const supabase = getServiceSupabase();
    let query = supabase.from("contracts").delete();

    if (id) {
      query = query.eq("id", id);
    } else if (spk_number) {
      query = query.eq("spk_number", spk_number);
    } else {
      return NextResponse.json({ success: false, message: "Parameter id atau spk_number diperlukan" }, { status: 400 });
    }

    const { error } = await query;
    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Arsip SPK berhasil dihapus" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
