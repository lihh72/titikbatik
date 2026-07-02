import { cookies } from "next/headers";

export const ADMIN_COOKIE_NAME = "titikbatik_admin_session";

export async function hasAdminSession() {
  const cookieStore = await cookies();
  const expected = process.env.ADMIN_SESSION_TOKEN ?? "dev-titikbatik-admin-session-change-me";
  return cookieStore.get(ADMIN_COOKIE_NAME)?.value === expected;
}
