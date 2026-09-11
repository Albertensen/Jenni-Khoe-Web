import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from("ai_leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    const formatted = (data || []).map((l: any) => ({
      id: l.id,
      session_id: l.session_id,
      name: l.name || "Anonim",
      phone: l.phone || "-",
      email: l.email || null,
      interest: l.interest || "Konsultasi Umum",
      messages: Number(l.messages) || 0,
      closing_stage: l.closing_stage || "Form Terisi (Lead Masuk)",
      schedule_date: l.schedule_date || null,
      schedule_venue: l.schedule_venue || null,
      schedule_time: l.schedule_time || null,
      last_message: l.last_message || null,
      status: l.status || "new",
      source: l.source || "chat_widget",
      created_at: l.created_at || new Date().toISOString(),
      updated_at: l.updated_at || l.created_at || new Date().toISOString(),
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

    const {
      session_id,
      name,
      phone,
      email,
      interest,
      messages,
      closing_stage,
      schedule_date,
      schedule_venue,
      schedule_time,
      last_message,
      status,
      source,
    } = body;

    if (!session_id || !name || !phone) {
      return NextResponse.json(
        { success: false, message: "session_id, name, and phone are required" },
        { status: 400 }
      );
    }

    // Clean phone number (convert 08xxx to 628xxx for consistency)
    let cleanPhone = String(phone).trim().replace(/[^0-9+]/g, '');
    if (cleanPhone.startsWith('08')) {
      cleanPhone = '628' + cleanPhone.slice(2);
    } else if (cleanPhone.startsWith('+62')) {
      cleanPhone = cleanPhone.slice(1);
    }

    // Check if session already exists
    const { data: existing } = await supabase
      .from("ai_leads")
      .select("id")
      .eq("session_id", session_id)
      .maybeSingle();

    if (existing) {
      const { data, error } = await supabase
        .from("ai_leads")
        .update({
          name: name.trim(),
          phone: cleanPhone,
          email: email || null,
          closing_stage: closing_stage || "Form Terisi (Lead Masuk)",
          messages: messages !== undefined ? Number(messages) : undefined,
          updated_at: new Date().toISOString(),
        })
        .eq("session_id", session_id)
        .select("*")
        .single();

      if (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, data });
    }

    // Insert new lead
    const { data, error } = await supabase
      .from("ai_leads")
      .insert({
        session_id,
        name: name.trim(),
        phone: cleanPhone,
        email: email || null,
        interest: interest || "Konsultasi Baru",
        messages: Number(messages) || 0,
        closing_stage: closing_stage || "Form Terisi (Lead Masuk)",
        schedule_date: schedule_date || null,
        schedule_venue: schedule_venue || null,
        schedule_time: schedule_time || null,
        last_message: last_message || null,
        status: status || "new",
        source: source || "chat_widget",
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
    const { id, status, closing_stage, notes } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: "Lead id required" }, { status: 400 });
    }

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (status) updates.status = status;
    if (closing_stage) updates.closing_stage = closing_stage;
    if (notes !== undefined) updates.last_message = notes;

    const { data, error } = await supabase
      .from("ai_leads")
      .update(updates)
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
