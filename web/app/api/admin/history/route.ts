import { hasAdminSession } from "@/lib/server-auth";
import { adminBackendHeaders, backendUrl } from "@/lib/server-backend";
import { NextResponse } from "next/server";

export async function GET() {
  if (!(await hasAdminSession())) return NextResponse.json({ detail: "Admin session required." }, { status: 401 });
  try {
    const response = await fetch(backendUrl("/api/admin/history"), { headers: adminBackendHeaders(), cache: "no-store" });
    const payload = await response.json();
    return NextResponse.json(payload, { status: response.status });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
