import { backendUrl } from "@/lib/server-backend";
import { NextResponse } from "next/server";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const response = await fetch(backendUrl(`/api/public/gallery/${encodeURIComponent(id)}`), { cache: "no-store" });
    const payload = await response.json();
    return NextResponse.json(payload, { status: response.status });
  } catch {
    return NextResponse.json({ detail: "Galeri backend tidak dapat dihubungi." }, { status: 503 });
  }
}
