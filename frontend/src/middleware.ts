import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function isValidAdminToken(token?: string): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;

  try {
    const payloadPart = parts[1];
    if (!payloadPart) return false;

    let jsonStr = "";
    if (typeof Buffer !== "undefined") {
      jsonStr = Buffer.from(payloadPart, "base64").toString("utf-8");
    } else {
      const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
      const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, "=");
      jsonStr = atob(padded);
    }

    const payload = JSON.parse(jsonStr);

    // Check expiration timestamp (allow 30s clock skew)
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now - 30) {
      return false;
    }

    // Role or email check
    const isAuth = payload.role === "authenticated" || payload.aud === "authenticated";
    const isAdmin =
      payload.email === "admin@jennikhoe.com" ||
      payload.app_metadata?.role === "admin" ||
      payload.user_metadata?.role === "admin";

    if (!isAuth && !isAdmin) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get("admin_token")?.value;
  const { pathname } = request.nextUrl;

  // 1. Allow public APIs and static assets
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/icons") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // 2. Redirect authenticated users away from /login
  if (pathname === "/login") {
    if (isValidAdminToken(token)) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.next();
  }

  // 3. Protect /admin routes
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (!isValidAdminToken(token)) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/login"],
};
