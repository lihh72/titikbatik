import type { GenerationResult } from "./types";

export function downloadResultMetadata(result: GenerationResult) {
  const content = JSON.stringify(result, null, 2);
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${result.title.toLowerCase().replace(/\s+/g, "-")}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}
