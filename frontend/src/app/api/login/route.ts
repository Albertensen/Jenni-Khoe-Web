import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    // Forward to Laravel Sanctum
    const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";
    const resp = await fetch(`${BACKEND_URL}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await resp.json();

    if (!resp.ok) {
      return NextResponse.json({ message: data.message || "Login gagal" }, { status: 401 });
    }

    const res = NextResponse.json({ success: true, message: "Login berhasil", token: data.token });
    // Set token cookie
    res.cookies.set("admin_token", data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });
    return res;
  } catch (err) {
    console.error("login error:", err);
    return NextResponse.json({ message: "Internal error" }, { status: 500 });
  }
}
