import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = [
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/reset-password",
  "/favicon.ico",
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow Next internals & static files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/icons") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/public")
  ) {
    return NextResponse.next();
  }

  // Public routes (auth pages, reset, etc.)
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Check Appwrite session cookie
  const session = req.cookies.get("appwrite-session")?.value;

  // Not logged in → redirect to sign-in
  if (!session) {
    const url = new URL("/sign-in", req.url);
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  // Logged in → allow access (no MFA checks anymore)
  return NextResponse.next();
}