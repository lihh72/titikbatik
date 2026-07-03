import { hasAdminSession } from "@/lib/server-auth";
import { adminBackendHeaders, backendUrl } from "@/lib/server-backend";
import { NextResponse } from "next/server";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await hasAdminSession())) return NextResponse.json({ detail: "Admin session required." }, { status: 401 });
  const { id } = await params;
  const body = await request.text();
  try {
    const response = await fetch(backendUrl(`/api/admin/gallery/${encodeURIComponent(id)}`), {
      method: "PATCH",
      headers: adminBackendHeaders({ "Content-Type": "application/json" }),
      body,
      cache: "no-store",
    });
    const payload = await response.json().catch(() => ({ detail: "Backend returned an invalid response." }));
    return NextResponse.json(payload, { status: response.status });
  } catch {
    return NextResponse.json({ detail: "FastAPI tidak dapat dihubungi." }, { status: 503 });
  }
}
