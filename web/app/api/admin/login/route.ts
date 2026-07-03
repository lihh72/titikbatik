import { NextResponse } from "next/server";

const COOKIE_NAME = "titikbatik_admin_session";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { email?: string; password?: string } | null;
  const expectedEmail = process.env.ADMIN_EMAIL ?? "admin@titikbatik.local";
  const expectedPassword = process.env.ADMIN_PASSWORD ?? "admin123";
  const sessionToken = process.env.ADMIN_SESSION_TOKEN ?? "dev-titikbatik-admin-session-change-me";

  if (!body || body.email !== expectedEmail || body.password !== expectedPassword) {
    return NextResponse.json({ detail: "Email atau password admin tidak valid." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return response;
}
