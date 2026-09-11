import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
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
      messages: Number(l.messages) || 1,
      phone: l.phone || null,
      name: l.name || "Lead Baru",
      interest: l.interest || "Inquiry Percakapan",
      created_at: l.created_at || new Date().toISOString(),
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

    const { session_id, name, phone, email, interest, messages, source } = body;

    if (!session_id) {
      return NextResponse.json({ success: false, message: "session_id required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("ai_leads")
      .insert({
        session_id,
        name: name || null,
        phone: phone || null,
        email: email || null,
        interest: interest || null,
        messages: Number(messages) || 1,
        source: source || "chatbot",
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
