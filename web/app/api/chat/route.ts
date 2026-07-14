import { backendUrl } from "@/lib/server-backend";
import { planCatalogSearch, type CatalogSearchPlan } from "@/lib/catalog-planner";

type ChatRole = "user" | "assistant" | "system";

type ChatMessage = {
  id?: string;
  role: ChatRole;
  content: string;
};

type ChatImage = {
  dataUrl: string;
  mimeType: "image/jpeg" | "image/png" | "image/webp" | "image/gif";
  name: string;
};

type ProviderMessage = {
  role: ChatRole;
  content: string | Array<
    | { type: "text"; text: string }
    | { type: "image_url"; image_url: { url: string } }
  >;
};

type PublicBatik = {
  id: number;
  slug: string;
  keyword: string;
  warna: string | null;
  style: string | null;
  seed: number | null;
  positive_prompt: string | null;
  created_at: string;
  file_preview?: string | null;
  preview_url?: string | null;
  costume_urls?: string[];
  costume_files?: Array<{ filename: string }> | { filename: string };
};

type PublicBatikListEnvelope = {
  success: boolean;
  data?: {
    items?: PublicBatik[];
    pagination?: {
      page: number;
      per_page: number;
      total: number;
      total_pages: number;
    };
  };
};

type PublicBatikStatisticsEnvelope = {
  success: boolean;
  data?: {
    count: number;
    latest_date: string | null;
    query: string | null;
    date: string | null;
  };
};

type MetaChatChunk = {
  choices?: Array<{
    delta?: {
      content?: string;
    };
  }>;
};

const MAX_HISTORY_MESSAGES = 10;
const MAX_MESSAGE_LENGTH = 2000;
const PUBLIC_BATIK_CONTEXT_LIMIT = 100;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const encoder = new TextEncoder();

function jsonError(error: string, status: number) {
  return Response.json({ error }, { status });
}

function sseEvent(event: "batik" | "token" | "error" | "done", data: Record<string, string> = {}) {
  return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

function sanitizeImage(value: unknown): ChatImage | null {
  if (value === undefined || value === null) return null;
  if (!value || typeof value !== "object") throw new Error("Format gambar tidak valid.");

  const candidate = value as Partial<ChatImage>;
  if (typeof candidate.dataUrl !== "string" || typeof candidate.mimeType !== "string" || typeof candidate.name !== "string") {
    throw new Error("Format gambar tidak valid.");
  }

  const match = candidate.dataUrl.match(/^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/]+={0,2})$/);
  if (!match || match[1] !== candidate.mimeType) throw new Error("Gunakan gambar JPEG, PNG, WebP, atau GIF.");
  const bytes = Math.floor((match[2].length * 3) / 4) - (match[2].endsWith("==") ? 2 : match[2].endsWith("=") ? 1 : 0);
  if (bytes > MAX_IMAGE_BYTES) throw new Error("Ukuran gambar maksimal 5 MB.");

  return {
    dataUrl: candidate.dataUrl,
    mimeType: match[1] as ChatImage["mimeType"],
    name: candidate.name.slice(0, 120),
  };
}

function isChatMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<ChatMessage>;
  return (
    (candidate.role === "user" || candidate.role === "assistant" || candidate.role === "system") &&
    typeof candidate.content === "string" &&
    candidate.content.trim().length > 0
  );
}

function sanitizeConversation(value: unknown): { messages: ChatMessage[]; responseLanguage: ResponseLanguage } | null {
  if (!Array.isArray(value)) return null;
  const validMessages = value.filter(isChatMessage).map((message) => ({
    role: message.role,
    content: message.content.trim().slice(0, MAX_MESSAGE_LENGTH),
  }));
  if (!validMessages.length) return null;
  return {
    messages: validMessages.slice(-MAX_HISTORY_MESSAGES),
    responseLanguage: detectResponseLanguage(validMessages),
  };
}

function extractBatikReference(content: string) {
  const idMatch = content.match(/\bbatik\s*#?\s*(\d+)\b/i) ?? content.match(/#\s*(\d+)\b/);
  if (idMatch) return { id: Number(idMatch[1]), query: null };
  return { id: null, query: null };
}

function wantsBatikVisual(content: string) {
  return wantsVisualAction(content) &&
    (extractBatikReference(content).id !== null || extractBatikReference(content).query !== null);
}

function wantsVisualAction(content: string) {
  return /\b(?:unduh|download|kirim|tampilkan|lihat|gambar|foto|visual|show|view|see|image|picture)\b/i.test(content);
}

function wantsCostume(content: string) {
  return /\b(?:costume|kostum)\w*\b|\b(?:pakaian|dipakai)\b/i.test(content);
}

function findReferencedBatikMessage(messages: ChatMessage[]) {
  return [...messages]
    .reverse()
    .find((message) => message.role === "user" && (() => {
      const reference = extractBatikReference(message.content);
      return reference.id !== null || reference.query !== null;
    })());
}

function shouldReusePreviousBatikReference(content: string) {
  const words = content.trim().split(/\s+/);
  if (words.length > 8) return false;
  if (/\b(?:latest|newest|terbaru|paling baru|how many|berapa|jumlah|recommend|rekomendasikan|find|cari)\b/i.test(content)) return false;
  return /\b(?:itu|tersebut|it|its|that|same|gambarnya|costumenya|kostumnya|promptnya|detailnya|videonya|warnanya|stylenya|seednya)\b|\b(?:costume|kostum|gambar)\s+(?:juga|too|itu|tersebut)\b|\b(?:the|its)\s+(?:image|picture)\b/i.test(content);
}

function publicPreviewUrl(batik: PublicBatik) {
  if (batik.file_preview) {
    return `/api/automation/public/images/preview/${encodeURIComponent(batik.file_preview)}`;
  }

  const legacyFilename = batik.preview_url?.match(/^\/api\/image\/([^/?#]+)$/)?.[1];
  return legacyFilename
    ? `/api/automation/public/images/preview/${encodeURIComponent(legacyFilename)}`
    : batik.preview_url ?? null;
}

function publicCostumeUrl(batik: PublicBatik) {
  const filename = Array.isArray(batik.costume_files)
    ? batik.costume_files[0]?.filename
    : batik.costume_files?.filename;
  if (filename) return `/api/automation/public/images/costume/${encodeURIComponent(filename)}`;
  const legacyFilename = batik.costume_urls?.[0]?.match(/^\/api\/image\/([^/?#]+)$/)?.[1];
  return legacyFilename
    ? `/api/automation/public/images/costume/${encodeURIComponent(legacyFilename)}`
    : batik.costume_urls?.[0] ?? null;
}

function costumeCount(batik: PublicBatik) {
  if (Array.isArray(batik.costume_files)) return batik.costume_files.length;
  if (batik.costume_files) return 1;
  return batik.costume_urls?.length ?? 0;
}

type ResponseLanguage = "Indonesian" | "English";

type CatalogStatistics = {
  requestedDate: {
    date: string;
    count: number;
  } | null;
  latestDate: string | null;
  query: string | null;
  count: number;
  latestRequested: boolean;
};

function detectResponseLanguage(messages: ChatMessage[]): ResponseLanguage {
  let explicitPreference: ResponseLanguage | null = null;

  const detectLanguageDirective = (content: string): ResponseLanguage | null => {
    const languageToken = "(?:english|bahasa\\s+inggris|indonesian|bahasa\\s+indonesia)";
    const action = "(?:speak|answer|respond|reply|continue|use|switch|change|pakai|gunakan|jawab|balas|lanjutkan|ganti|ubah)";
    const preference = "(?:i(?:\\s+would|'d)?\\s+prefer|my\\s+preference\\s+is|saya\\s+(?:lebih\\s+suka|memilih|mau)|aku\\s+(?:lebih\\s+suka|pilih|mau))";
    const toLanguage = (token: string): ResponseLanguage => /english|inggris/.test(token) ? "English" : "Indonesian";
    const oppositeLanguage = (token: string): ResponseLanguage => /english|inggris/.test(token) ? "Indonesian" : "English";
    const normalized = content.toLowerCase().trim();

    if (/^(?:why|kenapa|mengapa|did|do|does)\b[^?]*\b(?:reply|answer|respond|jawab|balas)\b[^?]*\b(?:english|bahasa\s+inggris|indonesian|bahasa\s+indonesia)\b/.test(normalized)) {
      return null;
    }

    const negatedDirective = normalized.match(new RegExp(`^(?:please\\s+)?(?:don't|do\\s+not|jangan)\\s+${action}\\b[^;,.!?]{0,32}\\b(${languageToken})\\b`));
    if (negatedDirective) return oppositeLanguage(negatedDirective[1]);

    const transition = normalized.match(new RegExp(`\\b(?:switch|change|ganti|ubah)\\b[^.!?]{0,24}\\bfrom\\s+(${languageToken})\\s+to\\s+(${languageToken})\\b`));
    if (transition) return toLanguage(transition[2]);

    const affirmativeNot = normalized.match(new RegExp(`\\b${action}\\b[^.!?]{0,24}\\b(${languageToken})\\b[^.!?]{0,16}\\b(?:not|bukan)\\b[^.!?]{0,16}\\b(${languageToken})\\b`));
    if (affirmativeNot) return toLanguage(affirmativeNot[1]);

    const preferenceMatch = normalized.match(new RegExp(`\\b${preference}\\b[^.!?]{0,48}\\b(${languageToken})\\b`));
    if (preferenceMatch) return toLanguage(preferenceMatch[1]);

    const continuity = normalized.match(new RegExp(`\\b(${languageToken})\\b[^.!?]{0,24}\\b(?:from\\s+now\\s+on|for\\s+this\\s+conversation|mulai\\s+sekarang|untuk\\s+percakapan\\s+ini)\\b`));
    if (continuity) return toLanguage(continuity[1]);

    let directive: ResponseLanguage | null = null;
    for (const clause of normalized.split(/[;,.!?]+/)) {
      if (/^\s*(?:please\s+)?(?:don't|do not|jangan)\b/.test(clause)) continue;
      const actionMatch = new RegExp(`\\b${action}\\b`).exec(clause);
      if (!actionMatch || actionMatch.index === undefined) continue;
      const targets = [...clause.matchAll(new RegExp(`\\b(${languageToken})\\b`, "g"))]
        .filter((match) => (match.index ?? -1) > actionMatch.index);
      if (targets.length) directive = toLanguage(targets.at(-1)?.[1] ?? "indonesian");
    }
    if (directive) return directive;

    const concise = normalized.match(new RegExp(`^(?:(?:please|in|dalam)\\s+)?(${languageToken})(?:\\s*,?\\s*(?:please|ya|dong))?[.!?]*$`));
    return concise ? toLanguage(concise[1]) : null;
  };

  for (const message of messages) {
    if (message.role !== "user") continue;
    explicitPreference = detectLanguageDirective(message.content) ?? explicitPreference;
  }

  if (explicitPreference) return explicitPreference;

  const latestUserMessage = [...messages].reverse().find((message) => message.role === "user")?.content.toLowerCase() ?? "";
  const englishSignals = latestUserMessage.match(/\b(?:what|when|where|which|who|why|how|can|could|would|should|please|tell|show|explain|describe|find|recommend|give|help|want|latest|generated|about|this|that|the|is|are|was|were|do|does|did|you|your|me|my)\b/g)?.length ?? 0;
  const indonesianSignals = latestUserMessage.match(/\b(?:apa|kapan|di mana|yang mana|siapa|kenapa|bagaimana|bisa|boleh|tolong|jelaskan|lihat|rekomendasikan|terbaru|tanggal|tentang|ini|itu|yang|adalah|ada)\b/g)?.length ?? 0;

  return englishSignals >= 1 && englishSignals > indonesianSignals ? "English" : "Indonesian";
}

function extractGeneratedDate(content: string) {
  const months: Record<string, string> = {
    januari: "01", februari: "02", maret: "03", april: "04", mei: "05", juni: "06",
    juli: "07", agustus: "08", september: "09", oktober: "10", november: "11", desember: "12",
    january: "01", february: "02", march: "03", may: "05", june: "06",
    july: "07", august: "08", october: "10", december: "12",
  };
  const monthNames = Object.keys(months).join("|");
  const normalized = content.toLowerCase();
  const isoMatch = normalized.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/);
  const dayFirstMatch = normalized.match(new RegExp(`\\b(?:tanggal\\s+)?(\\d{1,2})\\s+(${monthNames})(?:\\s+(20\\d{2}))?\\b`));
  const monthFirstMatch = normalized.match(new RegExp(`\\b(${monthNames})\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:(?:,\\s*|\\s+)(20\\d{2}))?\\b`));

  const year = isoMatch?.[1] ?? dayFirstMatch?.[3] ?? monthFirstMatch?.[3] ?? String(new Date().getFullYear());
  const month = isoMatch?.[2] ?? (dayFirstMatch ? months[dayFirstMatch[2]] : monthFirstMatch ? months[monthFirstMatch[1]] : null);
  const day = (isoMatch?.[3] ?? dayFirstMatch?.[1] ?? monthFirstMatch?.[2])?.padStart(2, "0") ?? null;
  if (!month || !day) return null;
  const candidate = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (
    candidate.getUTCFullYear() !== Number(year) ||
    candidate.getUTCMonth() !== Number(month) - 1 ||
    candidate.getUTCDate() !== Number(day)
  ) {
    return null;
  }
  return `${year}-${month}-${day}`;
}

function asksLatestGenerationDate(content: string) {
  const normalized = content.toLowerCase();
  const asksLatest = /\b(?:terbaru|paling baru|terakhir|latest|newest|most recent|last)\b/.test(normalized);
  const asksAboutGeneration = /\b(?:motif|batik|karya|output|generasi|generation|generate|generated|dibuat|created)\b/.test(normalized);
  const asksForDateOrDiscovery = /\b(?:tanggal|date|kapan|when|what|which|apa|mana|show|tampilkan|tunjukkan|lihat|recommend|rekomendasikan)\b/.test(normalized);
  return asksLatest && asksAboutGeneration && asksForDateOrDiscovery;
}

function wantsCatalogDiscovery(content: string) {
  return /\b(?:show|tampilkan|tunjukkan|lihat|cari|find|recommend|rekomendasikan|what|which|apa|mana|image|gambar|foto|visual|download|unduh|kirim)\b/i.test(content);
}

async function loadCatalogStatistics(
  date: string | null,
  includeLatestDate: boolean,
  query: string | null = null,
): Promise<CatalogStatistics | null> {
  if (!date && !includeLatestDate) return null;

  try {
    const params = new URLSearchParams();
    if (date) params.set("date", date);
    if (query) params.set("q", query);
    const response = await fetch(
      backendUrl(`/api/v1/catalog/batiks/statistics?${params.toString()}`),
      { cache: "no-store" },
    );
    if (!response.ok) return null;
    const payload = (await response.json()) as PublicBatikStatisticsEnvelope;
    if (!payload.data || !Number.isInteger(payload.data.count) || payload.data.count < 0) return null;
    const requestedDate = date
      ? { date, count: payload.data.count }
      : null;
    const latestDate = includeLatestDate
      ? payload.data.latest_date
      : null;
    return {
      requestedDate,
      latestDate,
      query: payload.data.query ?? query,
      count: payload.data.count,
      latestRequested: includeLatestDate,
    };
  } catch {
    return null;
  }
}

async function loadPublicBatikById(id: number) {
  try {
    const response = await fetch(
      backendUrl(`/api/v1/batiks?per_page=${PUBLIC_BATIK_CONTEXT_LIMIT}`),
      { cache: "no-store" },
    );
    if (!response.ok) return null;
    const payload = (await response.json()) as PublicBatikListEnvelope;
    return payload.data?.items?.find((item) => item.id === id) ?? null;
  } catch {
    return null;
  }
}

async function searchPublicBatiks(queries: string[], date: string | null = null) {
  try {
    if (!queries.length) {
      if (!date) return [];
      const params = new URLSearchParams({ page: "1", per_page: "9", date });
      const response = await fetch(backendUrl(`/api/v1/batiks?${params.toString()}`), { cache: "no-store" });
      if (!response.ok) return [];
      const payload = (await response.json()) as PublicBatikListEnvelope;
      return (payload.data?.items ?? []).slice(0, 3);
    }
    const responses = await Promise.all(queries.map((query) => {
      const params = new URLSearchParams({ q: query, per_page: "9" });
      if (date) params.set("date", date);
      return fetch(backendUrl(`/api/v1/batiks/search?${params.toString()}`), { cache: "no-store" });
    }));
    const payloads = await Promise.all(responses.map(async (response) =>
      response.ok ? (await response.json()) as PublicBatikListEnvelope : null,
    ));
    const seen = new Set<number>();
    const items: PublicBatik[] = [];

    for (const payload of payloads) {
      for (const item of payload?.data?.items ?? []) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          items.push(item);
        }
      }
    }

    return items.slice(0, 3);
  } catch {
    return [];
  }
}

function buildSystemPrompt(
  batik: PublicBatik | null,
  origin: string,
  recommendations: PublicBatik[] = [],
  catalogStatistics: CatalogStatistics | null = null,
  responseLanguage: ResponseLanguage = "Indonesian",
) {
  const languageInstruction = responseLanguage === "English"
    ? "Gunakan bahasa Inggris yang natural, lengkap, dan maksimal 80 kata kecuali user meminta detail. Pertahankan bahasa Inggris sampai user secara eksplisit meminta bahasa lain."
    : "Gunakan bahasa Indonesia yang natural, lengkap, dan maksimal 80 kata kecuali user meminta detail.";
  const base = [
    "Kamu adalah asisten TitikBatik AI.",
    languageInstruction,
    "Jika user meminta URL atau ingin melihat Batik tertentu, berikan satu tautan Markdown langsung tanpa langkah pencarian atau pengantar panjang. Gunakan nama atau keyword motif sebagai teks tautan, bukan label internal seperti 'Batik #6', kecuali user secara eksplisit meminta nomor tersebut. Jangan pernah membuat domain atau pola URL sendiri.",
    "TitikBatik AI adalah galeri output generative AI untuk motif batik, preview costume, video, dan metadata kurasi.",
    "Fokus pada kualitas visual, palet, motif, prompt, seed, costume preview, video, dan cara menjelajahi galeri.",
    "Jika user meminta bantuan yang di luar cakupan TitikBatik AI, termasuk coding umum atau topik yang tidak terkait batik, galeri, visual AI, atau gambar yang mereka unggah, tolak dengan singkat dan arahkan kembali ke TitikBatik AI.",
    "Jika tidak tahu, katakan dengan jelas dan sarankan membuka galeri atau detail batik terkait.",
    "Jangan mengarang data batik yang tidak tersedia di konteks.",
  ];

  if (catalogStatistics?.requestedDate) {
    const filterSuffix = catalogStatistics.query ? ` Filter katalog: ${catalogStatistics.query}.` : "";
    base.push(
      `Statistik katalog terverifikasi untuk ${catalogStatistics.requestedDate.date}: ${catalogStatistics.requestedDate.count} batik dibuat pada tanggal tersebut.${filterSuffix}`,
      "Jika user menanyakan jumlah pada tanggal ini, jawab angka tersebut secara langsung dan jangan menyarankan filter galeri.",
    );
  }

  if (catalogStatistics?.latestRequested && catalogStatistics.count === 0) {
    const filterText = catalogStatistics.query ? ` dengan filter ${catalogStatistics.query}` : "";
    base.push(
      `Statistik katalog terverifikasi tidak menemukan batik${filterText}.`,
      "Jawab dengan jelas bahwa belum ada karya yang cocok dan jangan mengarang rekomendasi.",
    );
  } else if (catalogStatistics?.latestDate) {
    const filterSuffix = catalogStatistics.query ? ` Filter katalog: ${catalogStatistics.query}.` : "";
    base.push(
      `Tanggal generasi terbaru terverifikasi: ${catalogStatistics.latestDate}.${filterSuffix}`,
      "Jika user menanyakan tanggal motif terbaru, jawab tanggal tersebut secara langsung dan jangan menyarankan filter galeri.",
    );
  }

  const batikContext = batik ? [
    ...base,
    "",
    "Konteks batik yang relevan:",
    `Batik #${batik.id}`,
    `Slug: ${batik.slug}`,
    `URL detail yang benar: ${origin}/gallery/${batik.slug}`,
    `Nama/keyword: ${batik.keyword}`,
    `Style: ${batik.style ?? "tidak tersedia"}`,
    `Warna: ${batik.warna ?? "tidak tersedia"}`,
    `Seed: ${batik.seed ?? "tidak tersedia"}`,
    `Prompt: ${batik.positive_prompt ?? "tidak tersedia"}`,
    `Tanggal dibuat: ${batik.created_at}`,
    `Jumlah costume preview: ${costumeCount(batik)}`,
  ] : base;

  if (!recommendations.length) return batikContext.join("\n");

  return [
    ...batikContext,
    "",
    "Kandidat rekomendasi terverifikasi. Kartu gambar kandidat sudah tampil otomatis di UI, jadi jangan mengulangi daftar tautan atau judul panjang. Berikan ringkasan singkat yang merujuk ke kartu tersebut.",
    ...recommendations.map((candidate) => [
      `ID internal: ${candidate.id}`,
      `Judul tautan: ${candidate.keyword}`,
      `URL detail: ${origin}/gallery/${candidate.slug}`,
      `Nama/keyword: ${candidate.keyword}`,
      `Style: ${candidate.style ?? "tidak tersedia"}`,
      `Warna: ${candidate.warna ?? "tidak tersedia"}`,
      `Tanggal dibuat: ${candidate.created_at}`,
    ].join(" | ")),
  ].join("\n");
}

function buildProviderMessages(messages: ChatMessage[], image: ChatImage | null): ProviderMessage[] {
  return messages.map((message, index) => {
    if (image && index === messages.length - 1 && message.role === "user") {
      return {
        role: message.role,
        content: [
          { type: "text", text: message.content },
          { type: "image_url", image_url: { url: image.dataUrl } },
        ],
      };
    }
    return message;
  });
}

async function callMetaChat(messages: ProviderMessage[], systemPrompt: string) {
  const apiKey = process.env.MODEL_API_KEY;
  if (!apiKey) throw new Error("MODEL_API_KEY belum dikonfigurasi pada server web.");

  const baseUrl = (process.env.MODEL_API_BASE_URL ?? "https://api.meta.ai/v1").replace(/\/$/, "");
  const model = process.env.MODEL_API_MODEL ?? "muse-spark-1.1";
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      temperature: 0.45,
      max_tokens: 800,
      reasoning_effort: "minimal",
      stream: true,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    if (response.status === 400 || response.status === 415) {
      throw new Error("Model AI menolak request atau gambar. Coba gunakan gambar yang lebih kecil atau format JPEG, PNG, WebP, maupun GIF.");
    }
    if (response.status === 413) {
      throw new Error("Gambar terlalu besar untuk diproses model AI. Pilih gambar yang lebih kecil lalu coba lagi.");
    }
    if (response.status === 429) {
      throw new Error("Model AI sedang sibuk atau terkena batas permintaan. Coba lagi sebentar.");
    }
    throw new Error(`Model AI sementara gagal merespons (HTTP ${response.status}). Coba lagi.`);
  }

  if (!response.body) throw new Error("Meta Model API tidak mengirim stream jawaban.");
  return response.body;
}

function readProviderEvent(block: string) {
  const data = block
    .split("\n")
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trimStart())
    .join("\n");

  if (!data || data === "[DONE]") return null;

  try {
    const payload = JSON.parse(data) as MetaChatChunk;
    return payload.choices?.[0]?.delta?.content ?? null;
  } catch {
    return null;
  }
}

function createChatStream(providerStream: ReadableStream<Uint8Array>, batik: PublicBatik | null, includeBatikVisual: boolean, includeCostume: boolean, recommendations: PublicBatik[]) {
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = providerStream.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      try {
        for (const candidate of recommendations) { const imageUrl = publicPreviewUrl(candidate); if (imageUrl) controller.enqueue(sseEvent("batik", { id: String(candidate.id), title: candidate.keyword, previewUrl: imageUrl, detailUrl: `/gallery/${candidate.slug}`, downloadUrl: imageUrl })); }
        const costume = batik && includeCostume ? publicCostumeUrl(batik) : null;
        const previewUrl = costume ?? (batik ? publicPreviewUrl(batik) : null);
        if (!recommendations.length && batik && previewUrl && includeBatikVisual) {
          controller.enqueue(sseEvent("batik", {
            id: String(batik.id),
            title: costume ? `Costume preview Batik #${batik.id}` : `Batik #${batik.id}`,
            previewUrl,
            detailUrl: `/gallery/${batik.slug}`,
            downloadUrl: previewUrl,
          }));
        }

        while (true) {
          const { done, value } = await reader.read();
          buffer += decoder.decode(value, { stream: !done });
          const events = buffer.split(/\r?\n\r?\n/);
          buffer = events.pop() ?? "";

          for (const event of events) {
            const content = readProviderEvent(event);
            if (content) controller.enqueue(sseEvent("token", { content }));
          }

          if (done) break;
        }

        const trailingContent = readProviderEvent(buffer);
        if (trailingContent) controller.enqueue(sseEvent("token", { content: trailingContent }));
        controller.enqueue(sseEvent("done"));
      } catch (error) {
        controller.enqueue(sseEvent("error", {
          message: error instanceof Error ? error.message : "Stream jawaban terputus.",
        }));
      } finally {
        reader.releaseLock();
        controller.close();
      }
    },
  });
}

export async function POST(request: Request) {
  if (!process.env.MODEL_API_KEY) {
    return jsonError("MODEL_API_KEY belum dikonfigurasi pada server web.", 500);
  }

  let body: { messages?: unknown; image?: unknown };
  try {
    body = await request.json() as { messages?: unknown };
  } catch {
    return jsonError("Body request harus berupa JSON.", 400);
  }

  const conversation = sanitizeConversation(body.messages);
  if (!conversation) return jsonError("Minimal satu pesan diperlukan.", 400);
  const { messages, responseLanguage } = conversation;

  const lastMessage = messages[messages.length - 1];
  if (lastMessage.role !== "user") return jsonError("Pesan terakhir harus berasal dari user.", 400);

  let image: ChatImage | null;
  try {
    image = sanitizeImage(body.image);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Gambar tidak valid.", 400);
  }

  try {
    const explicitReference = extractBatikReference(lastMessage.content).id;
    const referencedMessage = explicitReference === null && shouldReusePreviousBatikReference(lastMessage.content)
      ? findReferencedBatikMessage(messages.slice(0, -1))
      : null;
    const referencedId = explicitReference ?? (referencedMessage ? extractBatikReference(referencedMessage.content).id : null);
    const requestedDate = extractGeneratedDate(lastMessage.content);
    const wantsLatestDate = asksLatestGenerationDate(lastMessage.content);
    const plan: CatalogSearchPlan = referencedId === null
      ? await planCatalogSearch({
          apiKey: process.env.MODEL_API_KEY,
          baseUrl: (process.env.MODEL_API_BASE_URL ?? "https://api.meta.ai/v1").replace(/\/$/, ""),
          model: process.env.MODEL_API_MODEL ?? "muse-spark-1.1",
          message: lastMessage.content,
        })
      : { catalog: false, intent: "none", queries: [], needsImage: false, needsCostume: false, resolved: true, statisticsScope: "none" };
    const statisticsQuery = plan.catalog ? plan.queries[0] ?? null : null;
    const catalogQueries = (requestedDate || wantsLatestDate) && statisticsQuery
      ? [statisticsQuery]
      : plan.queries;
    const statisticsScope = plan.statisticsScope ?? (plan.catalog ? "filtered" : "global");
    const statisticsRequested = requestedDate !== null || wantsLatestDate;
    const planningSupportsStatistics = plan.resolved !== false && (
      !statisticsRequested ||
      (plan.catalog ? statisticsScope === "filtered" : statisticsScope === "global")
    );
    const catalogStatistics = !planningSupportsStatistics
      ? null
      : await loadCatalogStatistics(requestedDate, wantsLatestDate, statisticsQuery);
    const searchDate = requestedDate ?? (wantsLatestDate ? catalogStatistics?.latestDate ?? null : null);
    const wantsUnfilteredCards = planningSupportsStatistics && !plan.catalog && Boolean(searchDate) && wantsCatalogDiscovery(lastMessage.content);
    const shouldLoadCatalogItems = plan.catalog || wantsUnfilteredCards;
    const [referencedBatik, searchedBatiks] = await Promise.all([
      referencedId === null ? Promise.resolve(null) : loadPublicBatikById(referencedId),
      shouldLoadCatalogItems ? searchPublicBatiks(catalogQueries, searchDate) : Promise.resolve([]),
    ]);
    const scopedBatiks = requestedDate
      ? searchedBatiks.filter((candidate) => candidate.created_at.startsWith(requestedDate))
      : wantsLatestDate
        ? catalogStatistics?.latestDate
          ? searchedBatiks.filter((candidate) => candidate.created_at.startsWith(catalogStatistics.latestDate ?? ""))
          : []
        : searchedBatiks;
    const batik = referencedBatik ?? (plan.intent === "detail" ? scopedBatiks[0] ?? null : null);
    const recommendations = (wantsUnfilteredCards || (plan.catalog && (plan.intent === "recommend" || plan.intent === "search" || plan.needsImage)))
      ? scopedBatiks
      : [];
    const origin = new URL(request.url).origin;
    const providerStream = await callMetaChat(
      buildProviderMessages(messages, image),
      buildSystemPrompt(batik, origin, recommendations, catalogStatistics, responseLanguage),
    );
    const includeCostume = wantsCostume(lastMessage.content);
    const lastReference = extractBatikReference(lastMessage.content);
    const includeBatikVisual = wantsBatikVisual(lastMessage.content) ||
      Boolean(batik && (
        wantsVisualAction(lastMessage.content) ||
        lastReference.id !== null ||
        plan.catalog
      ));
    return new Response(createChatStream(providerStream, batik, includeBatikVisual || includeCostume, includeCostume, recommendations), {
      headers: {
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "Content-Type": "text/event-stream; charset=utf-8",
      },
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Chatbot gagal menjawab.", 500);
  }
}
