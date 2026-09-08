import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Lightweight middleware — only check for session cookie.
// Full auth validation happens in each Server Component via auth().
// This avoids importing bcryptjs/prisma into the Edge Runtime (>1MB).

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public paths — always allow
  const isPublic =
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon");

  if (isPublic) return NextResponse.next();

  // Check for NextAuth session cookie (works with both JWT and DB strategies)
  const sessionToken =
    request.cookies.get("authjs.session-token")?.value ||
    request.cookies.get("next-auth.session-token")?.value ||
    request.cookies.get("__Secure-authjs.session-token")?.value ||
    request.cookies.get("__Secure-next-auth.session-token")?.value;

  if (!sessionToken) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
        "/((?!api/auth|api/debug-auth|_next/static|_next/image|favicon\\.ico).*)",
  ],
};
