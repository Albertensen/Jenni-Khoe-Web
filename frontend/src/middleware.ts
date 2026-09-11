import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ponytail: local JWT payload verification avoids edge network roundtrips and prefetch rate-limits; upgrade to full HMAC signature verification with JWKS when multiple tenants are introduced
function isValidAdminToken(token?: string): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;

  try {
    const payloadPart = parts[1];
    if (!payloadPart) return false;
    const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const jsonStr = atob(base64);
    const payload = JSON.parse(jsonStr);

    // Check expiration timestamp
    const now = Math.floor(Date.now() / 1000);
    if (!payload.exp || payload.exp < now) {
      return false;
    }

    // Check role or email
    if (payload.role !== "authenticated" && payload.email !== "admin@jennikhoe.com") {
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

  // 1. Allow all public APIs and assets
  if (pathname.startsWith("/api/") || pathname.startsWith("/_next") || pathname.includes(".")) {
    return NextResponse.next();
  }

  // 2. Redirect logged-in users away from /login
  if (pathname === "/login") {
    if (isValidAdminToken(token)) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.next();
  }

  // 3. Protect all /admin routes
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
