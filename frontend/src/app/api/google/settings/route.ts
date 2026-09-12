import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { getGoogleSettings } from "@/lib/google-calendar";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const origin =
      req.nextUrl.origin ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";
    const redirectUri = `${origin}/api/google/callback`;

    const settings = await getGoogleSettings();

    return NextResponse.json({
      success: true,
      data: {
        is_connected: settings.is_connected,
        google_email: settings.google_email,
        calendar_id: settings.calendar_id,
        auto_sync: settings.auto_sync,
        last_synced_at: settings.last_synced_at,
        client_id_configured: Boolean(settings.client_id),
        client_secret_configured: Boolean(settings.client_secret),
        client_id: settings.client_id ? `${settings.client_id.slice(0, 12)}...` : null,
        redirect_uri: redirectUri,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getServiceSupabase();
    const body = await req.json();
    const { client_id, client_secret, calendar_id, auto_sync } = body;

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (client_id !== undefined) updates.client_id = client_id.trim();
    if (client_secret !== undefined) updates.client_secret = client_secret.trim();
    if (calendar_id !== undefined) updates.calendar_id = calendar_id.trim();
    if (auto_sync !== undefined) updates.auto_sync = Boolean(auto_sync);

    const { data, error } = await supabase
      .from("google_calendar_settings")
      .update(updates)
      .eq("id", 1)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Pengaturan Google Calendar berhasil disimpan.",
      data: {
        client_id_configured: Boolean(data.client_id),
        client_secret_configured: Boolean(data.client_secret),
        calendar_id: data.calendar_id,
        auto_sync: data.auto_sync,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const supabase = getServiceSupabase();

    const { error } = await supabase
      .from("google_calendar_settings")
      .update({
        access_token: null,
        refresh_token: null,
        token_expiry: null,
        google_email: null,
        is_connected: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Koneksi akun Google Calendar berhasil diputuskan.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
