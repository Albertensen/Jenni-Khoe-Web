import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const { booking_id } = await req.json();
    if (!booking_id) {
      return NextResponse.json({ success: false, message: "booking_id required" }, { status: 400 });
    }

    // Forward to Laravel backend (when deployed)
    const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";
    const resp = await fetch(`${BACKEND_URL}/api/generate-gated-link`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ booking_id }),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      return NextResponse.json({ success: false, message: err.message || "Backend error" }, { status: 502 });
    }

    const data = await resp.json();
    const domain = process.env.NEXT_PUBLIC_APP_URL || req.headers.get("origin") || "https://jenni-khoe-mua.vercel.app";
    const url = `${domain}/g/${data.token}`;

    return NextResponse.json({ success: true, url, token: data.token });
  } catch (err) {
    console.error("generate-token error:", err);
    return NextResponse.json({ success: false, message: "Internal error" }, { status: 500 });
  }
}
