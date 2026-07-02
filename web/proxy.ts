import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "titikbatik_admin_session";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionToken = process.env.ADMIN_SESSION_TOKEN ?? "dev-titikbatik-admin-session-change-me";
  const authenticated = request.cookies.get(COOKIE_NAME)?.value === sessionToken;

  if (pathname === "/admin/login") {
    if (authenticated) return NextResponse.redirect(new URL("/admin", request.url));
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin") && !authenticated) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
