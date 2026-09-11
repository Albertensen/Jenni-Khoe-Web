import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { getServiceSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

interface LeadBody {
  name: string;
  whatsapp: string;
  eventDate?: string;
  venue?: string;
  message?: string;
  consent: boolean;
}

export async function POST(req: NextRequest) {
  try {
    // Rate limit: 10 req/60s per IP
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
    const rl = checkRateLimit("leads:" + ip, 10, 60);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: { "Retry-After": String(rl.reset) } }
      );
    }

    const body: LeadBody = await req.json();

    // Validation
    if (!body.name || body.name.trim().length < 2) {
      return NextResponse.json({ error: "Nama minimal 2 karakter" }, { status: 400 });
    }
    if (!body.whatsapp || !/^62\d{8,15}$/.test(body.whatsapp)) {
      return NextResponse.json({ error: "Format WhatsApp tidak valid (62xxxx)" }, { status: 400 });
    }
    if (!body.consent) {
      return NextResponse.json({ error: "Konsen diperlukan" }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Insert to inquiries table
    await supabase.from("inquiries").insert({
      name: body.name.trim(),
      whatsapp: body.whatsapp.trim(),
      event_date: body.eventDate || null,
      venue: body.venue || null,
      message: body.message?.slice(0, 500) || null,
      consent: true,
      source: "ai-chat-widget",
    });

    // Also record into ai_leads table
    await supabase.from("ai_leads").insert({
      session_id: `chat_${ip}_${Date.now()}`,
      name: body.name.trim(),
      phone: body.whatsapp.trim(),
      interest: body.message?.slice(0, 200) || "Inquiry Konsultasi",
      source: "chatbot",
    });

    return NextResponse.json({
      success: true,
      message: "Terima kasih Kak! Data Kak sudah tercatat. Kak Jenni akan menghubungi via WhatsApp dalam 1x24 jam.",
    });
  } catch (err) {
    console.error("Lead error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
