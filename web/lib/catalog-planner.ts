export type CatalogIntent = "none" | "search" | "recommend" | "detail";
export type CatalogStatisticsScope = "none" | "global" | "filtered";

export type CatalogSearchPlan = {
  catalog: boolean;
  intent: CatalogIntent;
  queries: string[];
  needsImage: boolean;
  needsCostume: boolean;
  resolved?: boolean;
  statisticsScope?: CatalogStatisticsScope;
};

type PlannerArgs = {
  apiKey: string;
  baseUrl: string;
  model: string;
  message: string;
  fetchFn?: typeof fetch;
};

type PlannerResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

const EMPTY_PLAN: CatalogSearchPlan = {
  catalog: false,
  intent: "none",
  queries: [],
  needsImage: false,
  needsCostume: false,
  resolved: false,
  statisticsScope: "none",
};

const PLANNER_PROMPT = [
  "Kamu adalah planner pencarian katalog TitikBatik AI.",
  "Tentukan apakah pesan user membutuhkan pencarian katalog batik publik.",
  "Jika ya, ubah bahasa natural menjadi 1 sampai 3 kata kunci backend berbahasa Inggris yang spesifik, maksimal 24 karakter per kata kunci.",
  "Untuk pertanyaan statistik, set catalog=true hanya jika user memberi filter seperti motif, warna, atau style. Pertanyaan jumlah/tanggal tanpa filter harus catalog=false.",
  "Set statisticsScope=filtered untuk statistik dengan filter, global untuk statistik tanpa filter, dan none jika bukan pertanyaan statistik.",
  "Urutkan queries dari yang paling spesifik; query pertama adalah filter utama untuk statistik dan harus mewakili maksud user seakurat mungkin.",
  "Contoh: batik warna-warni dengan burung dapat menjadi peacock, bird, blue, red.",
  "Jangan menjawab user dan jangan mengarang karya. Keluarkan JSON saja tanpa markdown.",
  'Schema: {"catalog":boolean,"intent":"none|search|recommend|detail","queries":[string],"needsImage":boolean,"needsCostume":boolean,"statisticsScope":"none|global|filtered"}.',
].join("\n");

function normalizePlan(value: unknown): CatalogSearchPlan {
  if (!value || typeof value !== "object") return EMPTY_PLAN;
  const candidate = value as Partial<CatalogSearchPlan>;
  if (
    typeof candidate.catalog !== "boolean" ||
    !Array.isArray(candidate.queries) ||
    (candidate.intent !== "none" && candidate.intent !== "search" && candidate.intent !== "recommend" && candidate.intent !== "detail") ||
    (candidate.statisticsScope !== "none" && candidate.statisticsScope !== "global" && candidate.statisticsScope !== "filtered")
  ) {
    return EMPTY_PLAN;
  }
  const intent = candidate.intent === "search" || candidate.intent === "recommend" || candidate.intent === "detail"
    ? candidate.intent
    : "none";
  const queries = Array.isArray(candidate.queries)
    ? [...new Set(candidate.queries
      .filter((query): query is string => typeof query === "string")
      .map((query) => query.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim())
      .filter((query) => query.length >= 2 && query.length <= 48))].slice(0, 5)
    : [];
  if (
    (candidate.catalog === true && (intent === "none" || queries.length === 0)) ||
    (candidate.catalog === false && (intent !== "none" || queries.length > 0)) ||
    (candidate.statisticsScope === "filtered" && candidate.catalog !== true) ||
    (candidate.statisticsScope === "global" && candidate.catalog !== false)
  ) {
    return EMPTY_PLAN;
  }
  const catalog = candidate.catalog === true && intent !== "none" && queries.length > 0;

  return {
    catalog,
    intent: catalog ? intent : "none",
    queries: catalog ? queries : [],
    needsImage: catalog && candidate.needsImage === true,
    needsCostume: catalog && candidate.needsCostume === true,
    resolved: true,
    statisticsScope: candidate.statisticsScope,
  };
}

export async function planCatalogSearch({ apiKey, baseUrl, model, message, fetchFn = fetch }: PlannerArgs): Promise<CatalogSearchPlan> {
  try {
    const response = await fetchFn(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: PLANNER_PROMPT },
          { role: "user", content: message.slice(0, 2000) },
        ],
        temperature: 0.1,
        max_tokens: 512,
        reasoning_effort: "minimal",
        stream: false,
      }),
      cache: "no-store",
    });
    if (!response.ok) return EMPTY_PLAN;

    const payload = await response.json() as PlannerResponse;
    const content = payload.choices?.[0]?.message?.content?.trim();
    if (!content) return EMPTY_PLAN;
    return normalizePlan(JSON.parse(content));
  } catch {
    return EMPTY_PLAN;
  }
}
