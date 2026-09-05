import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    
    // Demo credentials — ganti dengan env vars di produksi
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@jennikhoe.com";
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      return NextResponse.json({ message: "Email atau password salah" }, { status: 401 });
    }

    // Set session cookie (simple approach — upgrade ke Sanctum/JWT nanti)
    const res = NextResponse.json({ success: true, message: "Login berhasil" });
    res.cookies.set("admin_token", "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8, // 8 jam
    });
    return res;
  } catch {
    return NextResponse.json({ message: "Internal error" }, { status: 500 });
  }
}
