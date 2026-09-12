import { NextRequest, NextResponse } from "next/server";
import { getGoogleAuthUrl, getGoogleSettings } from "@/lib/google-calendar";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const origin =
      req.nextUrl.origin ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

    const settings = await getGoogleSettings();
    if (!settings.client_id) {
      return NextResponse.redirect(
        new URL("/admin/schedules?error=missing_credentials", origin)
      );
    }

    const authUrl = await getGoogleAuthUrl(origin);
    if (!authUrl) {
      return NextResponse.redirect(
        new URL("/admin/schedules?error=auth_generation_failed", origin)
      );
    }

    return NextResponse.redirect(authUrl);
  } catch (err: unknown) {
    console.error("Google auth init error:", err);
    const origin =
      req.nextUrl.origin ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";
    return NextResponse.redirect(
      new URL("/admin/schedules?error=server_error", origin)
    );
  }
}
