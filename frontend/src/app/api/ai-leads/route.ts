import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export interface ActivityLogEntry {
  timestamp: string;
  source: string;
  action: string;
  client_name?: string; // Specific name used at this touchpoint
  note?: string;
  schedule_date?: string | null;
  schedule_venue?: string | null;
  stage?: string;
}

export interface ClientNameHistory {
  name: string;
  source: string;
  timestamp: string;
}

const STAGE_WEIGHTS: Record<string, number> = {
  "Form Terisi (Lead Masuk)": 1,
  "Tanya Jawab Jadwal & Lokasi": 2,
  "Mendapat Rekomendasi Paket & Pricelist": 3,
  "Konsultasi Konsep Riasan": 4,
  "Siap Booking / Menuju WhatsApp": 5,
};

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

export function normalizeSource(rawSource: string | null | undefined): string {
  if (!rawSource) return "kalender_tanggal";
  const s = rawSource.trim().toLowerCase();
  if (s === "cek_jadwal" || s === "kalender_tanggal") return "kalender_tanggal";
  if (s === "booking_cepat") return "booking_cepat";
  if (s === "chatbot" || s === "chat_widget") return "chat_widget";
  return s;
}

function getActionLabel(source: string, interest?: string, schedule_date?: string, last_message?: string): string {
  const norm = normalizeSource(source);
  if (norm === "booking_cepat") {
    return interest ? `Booking Cepat: ${interest}` : "Reservasi Cepat via WhatsApp";
  }
  if (norm === "kalender_tanggal") {
    return schedule_date ? `Pilih Slot Kalender: ${schedule_date}` : "Kunci Slot Tanggal Kalender";
  }
  if (norm === "chat_widget") {
    return interest ? `Chat CS: ${interest}` : "Konsultasi Tanya Jawab AI CS";
  }
  return last_message || "Interaksi Website";
}

export async function GET(req: NextRequest) {
  try {
    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from("ai_leads")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    const rawLeads = data || [];

    // Deduplicate and aggregate leads by normalized phone (primary key)
    const clientMap = new Map<string, any>();

    for (const lead of rawLeads) {
      const cleanPhone = normalizePhone(lead.phone);
      const groupKey = cleanPhone && cleanPhone !== "-" && cleanPhone.length >= 8 
        ? `phone_${cleanPhone}` 
        : `session_${lead.session_id || lead.id}`;

      // Extract and sanitize activity log
      let currentLogs: ActivityLogEntry[] = Array.isArray(lead.activity_log) ? [...lead.activity_log] : [];

      if (currentLogs.length === 0) {
        currentLogs.push({
          timestamp: lead.created_at || new Date().toISOString(),
          source: normalizeSource(lead.source || "kalender_tanggal"),
          action: getActionLabel(lead.source, lead.interest, lead.schedule_date, lead.last_message),
          client_name: lead.name || "Anonim",
          note: lead.last_message || undefined,
          schedule_date: lead.schedule_date,
          schedule_venue: lead.schedule_venue,
          stage: lead.closing_stage,
        });
      } else {
        // Ensure each log has client_name if missing
        currentLogs = currentLogs.map((log) => ({
          ...log,
          source: normalizeSource(log.source),
          client_name: log.client_name || lead.name || "Anonim",
        }));
      }

      if (!clientMap.has(groupKey)) {
        clientMap.set(groupKey, {
          id: lead.id,
          session_id: lead.session_id,
          name: lead.name || "Anonim",
          phone: cleanPhone,
          email: lead.email || null,
          interest: lead.interest || "Konsultasi Umum",
          messages: Number(lead.messages) || 0,
          closing_stage: lead.closing_stage || "Form Terisi (Lead Masuk)",
          schedule_date: lead.schedule_date || null,
          schedule_venue: lead.schedule_venue || null,
          schedule_time: lead.schedule_time || null,
          last_message: lead.last_message || null,
          status: lead.status || "new",
          source: normalizeSource(lead.source || "kalender_tanggal"),
          sources: [normalizeSource(lead.source || "kalender_tanggal")],
          activity_log: currentLogs,
          created_at: lead.created_at || new Date().toISOString(),
          updated_at: lead.updated_at || lead.created_at || new Date().toISOString(),
        });
      } else {
        const existing = clientMap.get(groupKey);

        // Keep latest updated name or non-anonymous name
        if (lead.name && lead.name !== "Anonim") {
          if (existing.name === "Anonim" || new Date(lead.updated_at).getTime() > new Date(existing.updated_at).getTime()) {
            existing.name = lead.name;
          }
        }

        // Compare stage priority: keep highest
        const existWeight = STAGE_WEIGHTS[existing.closing_stage] || 0;
        const currentWeight = STAGE_WEIGHTS[lead.closing_stage] || 0;
        if (currentWeight > existWeight) {
          existing.closing_stage = lead.closing_stage;
        }

        // Keep non-empty schedule details
        if (!existing.schedule_date && lead.schedule_date) existing.schedule_date = lead.schedule_date;
        if (!existing.schedule_venue && lead.schedule_venue) existing.schedule_venue = lead.schedule_venue;
        if (!existing.schedule_time && lead.schedule_time) existing.schedule_time = lead.schedule_time;

        // Collect all distinct sources
        const normLeadSrc = normalizeSource(lead.source);
        if (normLeadSrc && !existing.sources.includes(normLeadSrc)) {
          existing.sources.push(normLeadSrc);
        }

        // Merge activity logs
        for (const log of currentLogs) {
          const isDup = existing.activity_log.some(
            (el: ActivityLogEntry) =>
              el.source === log.source &&
              Math.abs(new Date(el.timestamp).getTime() - new Date(log.timestamp).getTime()) < 8000
          );
          if (!isDup) {
            existing.activity_log.push(log);
          }
        }

        // Timestamps
        if (new Date(lead.created_at).getTime() < new Date(existing.created_at).getTime()) {
          existing.created_at = lead.created_at;
        }
        if (new Date(lead.updated_at).getTime() > new Date(existing.updated_at).getTime()) {
          existing.updated_at = lead.updated_at;
          existing.source = normalizeSource(lead.source);
          if (lead.last_message) existing.last_message = lead.last_message;
        }

        existing.messages = Math.max(existing.messages, Number(lead.messages) || 0);
      }
    }

    // Process and enrich each client record
    const result = Array.from(clientMap.values()).map((client) => {
      // Sort activity log chronologically descending (newest first)
      client.activity_log.sort(
        (a: ActivityLogEntry, b: ActivityLogEntry) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      // Aggregate distinct sources across all logs
      const logSources = new Set<string>();
      if (client.source) logSources.add(client.source);
      for (const log of client.activity_log) {
        if (log.source) logSources.add(log.source);
      }
      client.sources = Array.from(logSources);

      // Extract all distinct names used by this client across touchpoints
      const namesHistoryMap = new Map<string, ClientNameHistory>();
      for (const log of client.activity_log) {
        if (log.client_name && log.client_name !== "Anonim") {
          const trimmed = log.client_name.trim();
          if (!namesHistoryMap.has(trimmed.toLowerCase())) {
            namesHistoryMap.set(trimmed.toLowerCase(), {
              name: trimmed,
              source: log.source,
              timestamp: log.timestamp,
            });
          }
        }
      }

      const namesHistory = Array.from(namesHistoryMap.values());
      client.names_history = namesHistory;

      // Aliases: any other name distinct from the primary name
      const primaryLower = (client.name || "").toLowerCase().trim();
      client.aliases = namesHistory
        .filter((n) => n.name.toLowerCase().trim() !== primaryLower)
        .map((n) => ({ name: n.name, source: n.source }));

      return client;
    });

    // Sort clients by most recently active
    result.sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );

    return NextResponse.json({ success: true, data: result });
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

    const cleanPhone = normalizePhone(phone);
    const nowIso = new Date().toISOString();
    const resolvedSource = normalizeSource(source || "kalender_tanggal");
    const currentInputName = name.trim();

    const newActivity: ActivityLogEntry = {
      timestamp: nowIso,
      source: resolvedSource,
      action: getActionLabel(resolvedSource, interest, schedule_date, last_message),
      client_name: currentInputName,
      note: last_message || undefined,
      schedule_date: schedule_date || null,
      schedule_venue: schedule_venue || null,
      stage: closing_stage || "Form Terisi (Lead Masuk)",
    };

    // Search for existing lead by phone (primary unique identifier)
    let query = supabase.from("ai_leads").select("*");
    if (cleanPhone && cleanPhone !== "-" && cleanPhone.length >= 8) {
      query = query.eq("phone", cleanPhone);
    } else {
      query = query.eq("session_id", session_id);
    }

    const { data: existingLeads } = await query
      .order("updated_at", { ascending: false })
      .limit(1);

    const existing = existingLeads?.[0];

    if (existing) {
      // Advance closing stage if new stage is equal or higher
      const currentWeight = STAGE_WEIGHTS[existing.closing_stage] || 0;
      const newWeight = STAGE_WEIGHTS[closing_stage] || 0;
      const targetStage = newWeight >= currentWeight ? (closing_stage || existing.closing_stage) : existing.closing_stage;

      // Merge activity log
      const existingLogs: ActivityLogEntry[] = Array.isArray(existing.activity_log) ? [...existing.activity_log] : [];

      if (existingLogs.length === 0) {
        existingLogs.push({
          timestamp: existing.created_at || nowIso,
          source: existing.source || "chat_widget",
          action: getActionLabel(existing.source, existing.interest, existing.schedule_date, existing.last_message),
          client_name: existing.name || currentInputName,
          note: existing.last_message || undefined,
          schedule_date: existing.schedule_date,
          schedule_venue: existing.schedule_venue,
          stage: existing.closing_stage,
        });
      }

      // Check if duplicate submission within 10s from same source
      const isDuplicate = existingLogs.some(
        (log) =>
          log.source === resolvedSource &&
          Math.abs(new Date(nowIso).getTime() - new Date(log.timestamp).getTime()) < 10000
      );

      if (!isDuplicate) {
        existingLogs.push(newActivity);
      }

      // Keep latest input name as primary, but history tracks every name
      const updateData: Record<string, any> = {
        name: currentInputName || existing.name,
        closing_stage: targetStage,
        source: resolvedSource,
        updated_at: nowIso,
        activity_log: existingLogs,
      };

      if (email) updateData.email = email;
      if (schedule_date) updateData.schedule_date = schedule_date;
      if (schedule_venue) updateData.schedule_venue = schedule_venue;
      if (schedule_time) updateData.schedule_time = schedule_time;
      if (last_message) updateData.last_message = last_message;
      if (interest) updateData.interest = interest;
      if (messages !== undefined) updateData.messages = Number(messages);

      const { data, error } = await supabase
        .from("ai_leads")
        .update(updateData)
        .eq("id", existing.id)
        .select("*")
        .single();

      if (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, data });
    }

    // If no existing lead found, insert new lead record with client_name in activity_log
    const { data, error } = await supabase
      .from("ai_leads")
      .insert({
        session_id,
        name: currentInputName,
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
        source: resolvedSource,
        activity_log: [newActivity],
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
