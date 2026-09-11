import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const res = NextResponse.json({ success: true, message: "Logged out" });
  res.cookies.set("admin_token", "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });
  return res;
}

export async function GET(req: NextRequest) {
  // If prefetch request from browser/Next.js, NEVER clear cookie
  const isPrefetch =
    req.headers.get("purpose") === "prefetch" ||
    req.headers.get("x-purpose") === "prefetch" ||
    req.headers.get("sec-purpose") === "prefetch" ||
    req.headers.get("next-router-prefetch") === "1";

  if (isPrefetch) {
    return new NextResponse(null, { status: 204 });
  }

  const host = req.headers.get("host") || "jenni-khoe-mua.vercel.app";
  const protocol = host.includes("localhost") ? "http" : "https";
  const res = NextResponse.redirect(`${protocol}://${host}/login`);
  res.cookies.set("admin_token", "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });
  return res;
}
