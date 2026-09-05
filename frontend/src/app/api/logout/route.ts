import { NextResponse } from "next/server";

export async function GET() {
  const res = NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
  res.cookies.set("admin_token", "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
