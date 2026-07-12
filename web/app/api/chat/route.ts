import { backendUrl } from "@/lib/server-backend";

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
  costume_files?: Array<{ filename: string }>;
};

type PublicBatikListEnvelope = {
  success: boolean;
  data?: {
    items?: PublicBatik[];
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

function sanitizeMessages(value: unknown): ChatMessage[] | null {
  if (!Array.isArray(value)) return null;
  const messages = value.filter(isChatMessage).slice(-MAX_HISTORY_MESSAGES).map((message) => ({
    role: message.role,
    content: message.content.trim().slice(0, MAX_MESSAGE_LENGTH),
  }));
  return messages.length ? messages : null;
}

function extractBatikReference(content: string) {
  const idMatch = content.match(/\bbatik\s*#?\s*(\d+)\b/i) ?? content.match(/#\s*(\d+)\b/);
  if (idMatch) return { id: Number(idMatch[1]), query: null };
  if (/\b(?:berapa|jumlah)\s+batik\b/i.test(content)) return { id: null, query: null };

  const nameMatch = content.match(/\b(?:nama|motif|batik)\s+([a-z0-9][a-z0-9\s,-]{2,})/i);
  return { id: null, query: nameMatch?.[1]?.trim().toLowerCase() ?? null };
}

function wantsBatikVisual(content: string) {
  return /\b(?:unduh|download|kirim|tampilkan|lihat|gambar|foto|visual)\b/i.test(content) &&
    (extractBatikReference(content).id !== null || extractBatikReference(content).query !== null);
}

function wantsCostume(content: string) {
  return /\b(?:costume|kostum|pakaian|dipakai)\b/i.test(content);
}
function wantsRecommendations(content: string) {
  return /\b(?:rekomendasi|rekomendasikan|saran|cocok)\b/i.test(content) ||
    /\b(?:lihat|tampilkan|cari)\b/i.test(content) &&
      /\b(?:warna(?:nya)?|palet|style|gaya|motif|corak|pattern|prompt|seed)\b/i.test(content);
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
  const filename = batik.costume_files?.[0]?.filename;
  if (filename) return `/api/automation/public/images/costume/${encodeURIComponent(filename)}`;
  return batik.costume_urls?.[0] ?? null;
}

type BatikReference = ReturnType<typeof extractBatikReference>;

const CATALOG_ALIASES: Record<string, string[]> = {
  "kupu-kupu": ["kupu kupu", "butterfly"],
  butterfly: ["butterfly", "kupu kupu"],
  lotus: ["lotus", "padma"],
  padma: ["padma", "lotus"],
  tradisional: ["traditional", "wax resist", "klasik"],
  modern: ["modern", "contemporary", "geometric"],
  formal: ["elegant", "formal", "navy", "cream"],
};

function normalizeCatalogText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function catalogTerms(content: string, reference = extractBatikReference(content)) {
  const normalizedContent = normalizeCatalogText(content);
  const rawTerms = [reference.query ?? ""];
  const metadataMatches = normalizedContent.matchAll(
    /\b(?:warna(?:nya)?|palet|style|gaya|motif|corak|pattern|prompt)\s+([a-z0-9]+(?:\s+[a-z0-9]+){0,5})/g,
  );
  for (const match of metadataMatches) rawTerms.push(match[1]);
  const seedMatch = normalizedContent.match(/\bseed\s+(\d+)\b/);
  if (seedMatch) rawTerms.push(seedMatch[1]);

  for (const [needle, aliases] of Object.entries(CATALOG_ALIASES)) {
    if (normalizedContent.includes(normalizeCatalogText(needle))) rawTerms.push(...aliases);
  }

  return [...new Set(rawTerms.map(normalizeCatalogText).filter((term) => term.length >= 3))];
}

type DateStatistic = {
  date: string;
  count: number;
};

function extractGeneratedDate(content: string) {
  const months: Record<string, string> = {
    januari: "01", februari: "02", maret: "03", april: "04", mei: "05", juni: "06",
    juli: "07", agustus: "08", september: "09", oktober: "10", november: "11", desember: "12",
  };
  const match = content.toLowerCase().match(/\b(?:tanggal\s+)?(\d{1,2})\s+(januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember)\s+(20\d{2})\b/);
  if (!match) return null;
  return `${match[3]}-${months[match[2]]}-${match[1].padStart(2, "0")}`;
}

async function loadDateStatistic(date: string | null): Promise<DateStatistic | null> {
  if (!date) return null;

  try {
    const response = await fetch(
      backendUrl(`/api/v1/batiks?per_page=${PUBLIC_BATIK_CONTEXT_LIMIT}`),
      { cache: "no-store" },
    );
    if (!response.ok) return null;
    const payload = (await response.json()) as PublicBatikListEnvelope;
    const count = (payload.data?.items ?? []).filter((item) => item.created_at.startsWith(date)).length;
    return { date, count };
  } catch {
    return null;
  }
}

function catalogScore(item: PublicBatik, terms: string[]) {
  const searchable = normalizeCatalogText(
    `${item.slug} ${item.keyword} ${item.style ?? ""} ${item.warna ?? ""} ${item.positive_prompt ?? ""} ${item.seed ?? ""}`,
  );
  return terms.reduce((total, term) => total + (searchable.includes(term) ? 1 : 0), 0);
}

function matchBatik(items: PublicBatik[], reference: BatikReference, terms: string[]) {
  if (reference.id !== null) return items.find((item) => item.id === reference.id) ?? null;
  if (!terms.length) return null;

  const ranked = items
    .map((item, index) => ({ item, index, score: catalogScore(item, terms) }))
    .sort((left, right) => right.score - left.score || left.index - right.index);
  return ranked[0]?.score ? ranked[0].item : null;
}

async function loadPublicBatikContext(userMessage: string) {
  const reference = extractBatikReference(userMessage);
  const terms = catalogTerms(userMessage, reference);
  if (reference.id === null && !terms.length) return null;

  try {
    const response = await fetch(
      backendUrl(`/api/v1/batiks?per_page=${PUBLIC_BATIK_CONTEXT_LIMIT}`),
      { cache: "no-store" },
    );
    if (!response.ok) return null;
    const payload = (await response.json()) as PublicBatikListEnvelope;
    const items = payload.data?.items ?? [];
    return matchBatik(items, reference, terms);
  } catch {
    return null;
  }
}
async function loadRecommendations(userMessage: string) {
  const reference = extractBatikReference(userMessage);
  const terms = catalogTerms(userMessage, reference);

  try {
    const response = await fetch(backendUrl("/api/v1/batiks?per_page=9"), { cache: "no-store" });
    const payload = await response.json() as PublicBatikListEnvelope;
    const items = payload.data?.items ?? [];
    if (!response.ok) return [];

    return items
      .map((item, index) => {
        const score = catalogScore(item, terms);
        return { item, index, score };
      })
      .sort((left, right) => right.score - left.score || left.index - right.index)
      .slice(0, 3)
      .map(({ item }) => item);
  } catch {
    return [];
  }
}

function buildSystemPrompt(
  batik: PublicBatik | null,
  origin: string,
  recommendations: PublicBatik[] = [],
  dateStatistic: DateStatistic | null = null,
) {
  const base = [
    "Kamu adalah asisten TitikBatik AI.",
    "Jawab dalam bahasa Indonesia yang natural, lengkap, dan maksimal 80 kata kecuali user meminta detail.",
    "Jika user meminta URL atau ingin melihat Batik tertentu, berikan satu tautan Markdown langsung tanpa langkah pencarian atau pengantar panjang. Gunakan nama atau keyword motif sebagai teks tautan, bukan label internal seperti 'Batik #6', kecuali user secara eksplisit meminta nomor tersebut. Jangan pernah membuat domain atau pola URL sendiri.",
    "TitikBatik AI adalah galeri output generative AI untuk motif batik, preview costume, video, dan metadata kurasi.",
    "Fokus pada kualitas visual, palet, motif, prompt, seed, costume preview, video, dan cara menjelajahi galeri.",
    "Jika tidak tahu, katakan dengan jelas dan sarankan membuka galeri atau detail batik terkait.",
    "Jangan mengarang data batik yang tidak tersedia di konteks.",
  ];

  if (dateStatistic) {
    base.push(
      `Statistik katalog terverifikasi untuk ${dateStatistic.date}: ${dateStatistic.count} batik dibuat pada tanggal tersebut.`,
      "Jika user menanyakan jumlah pada tanggal ini, jawab angka tersebut secara langsung dan jangan menyarankan filter galeri.",
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
    `Jumlah costume preview: ${batik.costume_urls?.length ?? batik.costume_files?.length ?? 0}`,
  ] : base;

  if (!recommendations.length) return batikContext.join("\n");

  return [
    ...batikContext,
    "",
    "Kandidat rekomendasi terverifikasi. Pilih berdasarkan preferensi user, sebutkan paling banyak tiga, dan gunakan URL persis di bawah ini bila diperlukan:",
    ...recommendations.map((candidate) => [
      `ID internal: ${candidate.id}`,
      `Judul tautan: ${candidate.keyword}`,
      `URL detail: ${origin}/gallery/${candidate.slug}`,
      `Nama/keyword: ${candidate.keyword}`,
      `Style: ${candidate.style ?? "tidak tersedia"}`,
      `Warna: ${candidate.warna ?? "tidak tersedia"}`,
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
    throw new Error(`Meta Model API mengembalikan status ${response.status}.`);
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
        for (const candidate of recommendations) { const imageUrl = publicPreviewUrl(candidate); if (imageUrl) controller.enqueue(sseEvent("batik", { id: String(candidate.id), title: `Rekomendasi Batik #${candidate.id}`, previewUrl: imageUrl, detailUrl: `/gallery/${candidate.slug}`, downloadUrl: imageUrl })); }
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

  const messages = sanitizeMessages(body.messages);
  if (!messages) return jsonError("Minimal satu pesan diperlukan.", 400);

  const lastMessage = messages[messages.length - 1];
  if (lastMessage.role !== "user") return jsonError("Pesan terakhir harus berasal dari user.", 400);

  let image: ChatImage | null;
  try {
    image = sanitizeImage(body.image);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Gambar tidak valid.", 400);
  }

  try {
    const recommend = wantsRecommendations(lastMessage.content);
    const [batik, recommendations, dateStatistic] = await Promise.all([
      loadPublicBatikContext(lastMessage.content),
      recommend ? loadRecommendations(lastMessage.content) : Promise.resolve([]),
      loadDateStatistic(extractGeneratedDate(lastMessage.content)),
    ]);
    const origin = new URL(request.url).origin;
    const providerStream = await callMetaChat(
      buildProviderMessages(messages, image),
      buildSystemPrompt(batik, origin, recommendations, dateStatistic),
    );
    const includeCostume = wantsCostume(lastMessage.content);
    return new Response(createChatStream(providerStream, batik, wantsBatikVisual(lastMessage.content) || includeCostume, includeCostume, recommendations), {
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
