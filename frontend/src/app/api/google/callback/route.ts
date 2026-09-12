import { NextRequest, NextResponse } from "next/server";
import { exchangeGoogleCode, syncGoogleCalendar } from "@/lib/google-calendar";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const origin =
    req.nextUrl.origin ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000";

  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    console.error("Google OAuth error from query:", error);
    return NextResponse.redirect(
      new URL(`/admin/schedules?error=${encodeURIComponent(error)}`, origin)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/admin/schedules?error=missing_code", origin)
    );
  }

  try {
    // Exchange auth code for tokens and save to DB
    await exchangeGoogleCode(code, origin);

    // Initial background sync
    try {
      await syncGoogleCalendar();
    } catch (syncErr) {
      console.warn("Initial sync after callback failed:", syncErr);
    }

    return NextResponse.redirect(
      new URL("/admin/schedules?google_status=success", origin)
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Exchange failed";
    console.error("Callback error:", msg);
    return NextResponse.redirect(
      new URL(`/admin/schedules?error=${encodeURIComponent(msg)}`, origin)
    );
  }
}
