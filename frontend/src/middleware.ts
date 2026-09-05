import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("admin_token")?.value;
  const { pathname } = request.nextUrl;

  // Skip auth for login page and API
  if (pathname === "/login" || pathname.startsWith("/api/")) {
    // Redirect logged-in users away from login page
    if (pathname === "/login" && token) {
      try {
        const resp = await fetch(`${BACKEND_URL}/api/me?token=${token}`);
        if (resp.ok) {
          return NextResponse.redirect(new URL("/admin", request.url));
        }
      } catch { /* token invalid, continue to login */ }
    }
    return NextResponse.next();
  }

  // Protect /admin routes
  if (pathname.startsWith("/admin")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    try {
      const resp = await fetch(`${BACKEND_URL}/api/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) {
        return NextResponse.redirect(new URL("/login", request.url));
      }
    } catch {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/login"],
};
