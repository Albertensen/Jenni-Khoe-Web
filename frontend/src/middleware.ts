import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// ponytail: direct fetch to Supabase Auth endpoint avoids heavy SDK cold starts in middleware; upgrade to full @supabase/ssr session refresh when adding client refresh token rotation
export async function middleware(request: NextRequest) {
  const token = request.cookies.get("admin_token")?.value;
  const { pathname } = request.nextUrl;

  // Skip auth for login page and API
  if (pathname === "/login" || pathname.startsWith("/api/")) {
    // Redirect already logged-in users away from login page
    if (pathname === "/login" && token && SUPABASE_URL && SUPABASE_KEY) {
      try {
        const resp = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${token}`,
          },
        });
        if (resp.ok) {
          return NextResponse.redirect(new URL("/admin", request.url));
        }
      } catch {
        // Token invalid, continue to login
      }
    }
    return NextResponse.next();
  }

  // Protect /admin routes
  if (pathname.startsWith("/admin")) {
    if (!token || !SUPABASE_URL || !SUPABASE_KEY) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    try {
      const resp = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${token}`,
        },
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
