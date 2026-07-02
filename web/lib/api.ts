import type { GenerationConfig, GenerationResult } from "./types";

export function getApiMode() {
  return "API terlindungi";
}

export async function generateMotifs(config: GenerationConfig, stage: GenerationResult["stage"] = "motif") {
  const response = await fetch("/api/admin/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...config, stage }),
  });

  const payload = await response.json().catch(() => ({ detail: "Respons server tidak valid." })) as {
    results?: GenerationResult[];
    detail?: string;
  };
  if (!response.ok || !payload.results) throw new Error(payload.detail ?? `Server mengembalikan status ${response.status}`);
  return payload.results;
}
