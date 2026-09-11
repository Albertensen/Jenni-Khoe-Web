import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from("inquiries")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    const formatted = (data || []).map((i: any) => ({
      id: i.id,
      name: i.name || "Anonim",
      email: i.email || "-",
      phone: i.whatsapp || "-",
      wedding_date: i.event_date || "-",
      venue: i.venue || "-",
      service_package: i.package || "Custom",
      message: i.message || "",
      status: i.source === "converted" ? "converted" : (i.source === "negotiation" ? "negotiation" : "new"),
      created_at: i.created_at || new Date().toISOString(),
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

    const { name, whatsapp, email, event_date, venue, service_package, message, consent } = body;

    if (!name || !whatsapp) {
      return NextResponse.json({ success: false, message: "Nama dan WhatsApp wajib diisi" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("inquiries")
      .insert({
        name,
        whatsapp,
        email: email || null,
        event_date: event_date || null,
        venue: venue || null,
        package: service_package || null,
        message: message || null,
        consent: Boolean(consent),
        source: "website",
      })
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

export async function PATCH(req: NextRequest) {
  try {
    const supabase = getServiceSupabase();
    const body = await req.json();
    const { id, status } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: "ID is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("inquiries")
      .update({ source: status, updated_at: new Date().toISOString() })
      .eq("id", id)
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
