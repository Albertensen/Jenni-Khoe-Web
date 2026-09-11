import { NextRequest, NextResponse } from "next/server";

// ponytail: direct fetch to Supabase Auth avoids bundling large SDK in edge route; upgrade to @supabase/ssr if cookie exchange needed
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ message: "Email dan password wajib diisi" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ message: "Supabase environment belum terkonfigurasi" }, { status: 500 });
    }

    const resp = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        "apikey": supabaseKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await resp.json();

    if (!resp.ok) {
      return NextResponse.json(
        { message: data.error_description || data.msg || "Login gagal. Periksa email dan password." },
        { status: 401 }
      );
    }

    const res = NextResponse.json({ success: true, message: "Login berhasil", token: data.access_token });
    res.cookies.set("admin_token", data.access_token, {
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
