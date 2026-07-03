import { backendUrl } from "@/lib/server-backend";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch(backendUrl("/api/public/gallery"), { cache: "no-store" });
    const payload = await response.json();
    return NextResponse.json(payload, { status: response.status });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
