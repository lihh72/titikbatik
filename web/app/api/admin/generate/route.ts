import { hasAdminSession } from "@/lib/server-auth";
import { adminBackendHeaders, backendUrl } from "@/lib/server-backend";
import { NextResponse } from "next/server";

function localFallback(body: Record<string, unknown>) {
  const count = [1, 2, 4].includes(Number(body.count)) ? Number(body.count) : 1;
  const stage = typeof body.stage === "string" ? body.stage : "motif";
  const motif = typeof body.motif === "string" ? body.motif : "ceplok";
  const label = motif.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
  const now = new Date().toISOString();
  const colors = [body.primaryColor ?? "#153f42", body.secondaryColor ?? "#ead7b9", body.accentColor ?? "#d7a85f"];
  const prompt = [
    `batik ${motif.replaceAll("-", " ")}`,
    `${String(body.style ?? "Modern").toLowerCase()} style`,
    `${String(body.composition ?? "Simetris").toLowerCase()} composition`,
    `${String(body.density ?? "Seimbang").toLowerCase()} ornament density`,
    "Indonesian textile pattern, clean repeatable fabric design",
  ].join(", ");

  return {
    results: Array.from({ length: count }, (_, index) => ({
      id: `${stage}-${crypto.randomUUID().slice(0, 12)}`,
      title: `${label} ${String(index + 1).padStart(2, "0")}`,
      variant: motif,
      stage,
      prompt,
      colors,
      createdAt: now,
      resolution: stage === "upscale" ? "4096 × 4096" : "1024 × 1024",
      style: body.style ?? "Modern",
      composition: body.composition ?? "Simetris",
      density: body.density ?? "Seimbang",
      status: "draft",
      isPublic: false,
    })),
  };
}

export async function POST(request: Request) {
  if (!(await hasAdminSession())) return NextResponse.json({ detail: "Admin session required." }, { status: 401 });
  const body = (await request.json()) as Record<string, unknown>;

  try {
    const response = await fetch(backendUrl("/api/admin/generate"), {
      method: "POST",
      headers: adminBackendHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const payload = await response.json().catch(() => ({ detail: "Backend returned an invalid response." }));
    return NextResponse.json(payload, { status: response.status });
  } catch {
    if ((process.env.ALLOW_LOCAL_DEMO ?? "true") !== "true") {
      return NextResponse.json({ detail: "FastAPI tidak dapat dihubungi." }, { status: 503 });
    }
    return NextResponse.json(localFallback(body));
  }
}
