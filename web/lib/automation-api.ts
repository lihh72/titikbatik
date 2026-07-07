import {
  type AppSettings,
  type AutomationResponse,
  type Batik,
  type CostumeTemplate,
  type DashboardData,
  type GenerationBatch,
  type GenerationBatchCreate,
  type GenerationBatchQueued,
  type GenerationJob,
  type PublicBatikList,
  type WordlistCategory,
  type WordlistItem,
  unwrapAutomationResponse,
} from "@/lib/automation-types";

const ADMIN_BASE = "/api/automation/admin";
const PUBLIC_BASE = "/api/automation/public";

type CacheEntry<T> = {
  value: T;
};

const memoryCache = new Map<string, CacheEntry<unknown>>();
const pendingRequests = new Map<string, Promise<unknown>>();

function getRequestMethod(init?: RequestInit) {
  return (init?.method ?? "GET").toUpperCase();
}

function shouldUseClientCache(path: string, init?: RequestInit) {
  return getRequestMethod(init) === "GET" && path.startsWith(PUBLIC_BASE);
}

function getCachedValue<T>(key: string): T | null {
  const item = memoryCache.get(key);
  if (!item) return null;

  return item.value as T;
}

function setCachedValue<T>(key: string, value: T) {
  memoryCache.set(key, {
    value,
  });
}

function publicBatikPath(slug: string) {
  return `${PUBLIC_BASE}/batiks/${encodeURIComponent(slug)}`;
}

function publicBatikListPath(options: { page?: number; perPage?: number; query?: string } = {}) {
  const path = options.query ? "batiks/search" : "batiks";
  return `${PUBLIC_BASE}/${path}${queryString({
    q: options.query,
    page: options.page,
    per_page: options.perPage,
  })}`;
}

async function automationRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const useCache = shouldUseClientCache(path, init);

  if (useCache) {
    const cached = getCachedValue<T>(path);
    if (cached) return cached;

    const pending = pendingRequests.get(path);
    if (pending) return pending as Promise<T>;
  }

  const requestPromise = fetch(path, { cache: useCache ? "force-cache" : "no-store", ...init })
    .then(async (response) => {
      let payload: AutomationResponse<T> & { detail?: string };
      try {
        payload = await response.json() as AutomationResponse<T> & { detail?: string };
      } catch {
        if (response.status === 404) throw new Error("Endpoint web tidak ditemukan (404).");
        throw new Error(`Server mengembalikan respons non-JSON (${response.status}).`);
      }
      if (!response.ok) {
        throw new Error(payload.message ?? payload.detail ?? `Server mengembalikan status ${response.status}`);
      }

      const result = unwrapAutomationResponse(payload);
      if (useCache) setCachedValue(path, result);
      return result;
    })
    .finally(() => {
      if (useCache) pendingRequests.delete(path);
    });

  if (useCache) {
    pendingRequests.set(path, requestPromise);
  }

  return requestPromise;
}

function jsonRequest(method: string, body?: unknown): RequestInit {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  };
}

function queryString(values: Record<string, string | number | boolean | null | undefined>) {
  const query = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") query.set(key, String(value));
  });
  const encoded = query.toString();
  return encoded ? `?${encoded}` : "";
}

function mediaUrl(category: "preview" | "costume" | "video", filename: string | null | undefined) {
  return filename ? `${PUBLIC_BASE}/images/${category}/${encodeURIComponent(filename)}` : null;
}

export function normalizeBatikMedia(batik: Batik): Batik {
  const costumeFiles = batik.costume_files.map((costume) => ({
    ...costume,
    video_url: mediaUrl("video", costume.file_video),
  }));
  return {
    ...batik,
    preview_url: mediaUrl("preview", batik.file_preview),
    costume_urls: costumeFiles.length
      ? costumeFiles.map((costume) => mediaUrl("costume", costume.filename) as string)
      : batik.costume_urls,
    costume_files: costumeFiles,
  };
}

export function clearPublicAutomationCache() {
  memoryCache.clear();
  pendingRequests.clear();
}

export function putPublicBatikCache(batik: Batik) {
  const normalized = normalizeBatikMedia(batik);
  setCachedValue(publicBatikPath(normalized.slug), normalized);
}

export function readPublicBatikCache(slug: string) {
  if (!slug.trim()) return null;
  return getCachedValue<Batik>(publicBatikPath(slug));
}

export function readPublicBatiksCache(options: { page?: number; perPage?: number; query?: string } = {}) {
  return getCachedValue<PublicBatikList>(publicBatikListPath(options));
}

export const getDashboard = () => automationRequest<DashboardData>(`${ADMIN_BASE}/dashboard`);

export const createGenerationBatch = (request: GenerationBatchCreate) =>
  automationRequest<GenerationBatchQueued>(`${ADMIN_BASE}/generation-batches`, jsonRequest("POST", request));

export const listBatches = (options: { limit?: number; offset?: number } = {}) =>
  automationRequest<GenerationBatch[]>(
    `${ADMIN_BASE}/generation-batches${queryString({ limit: options.limit, offset: options.offset })}`,
  );

export const getBatch = (batchId: string) =>
  automationRequest<GenerationBatch>(`${ADMIN_BASE}/generation-batches/${encodeURIComponent(batchId)}`);

export const cancelBatch = (batchId: string) =>
  automationRequest<GenerationBatch>(`${ADMIN_BASE}/generation-batches/${encodeURIComponent(batchId)}/cancel`, jsonRequest("POST"));

export const retryFailedBatch = (batchId: string) =>
  automationRequest<GenerationBatch>(`${ADMIN_BASE}/generation-batches/${encodeURIComponent(batchId)}/retry-failed`, jsonRequest("POST"));

export const listBatchJobs = (batchId: string) =>
  automationRequest<GenerationJob[]>(`${ADMIN_BASE}/generation-batches/${encodeURIComponent(batchId)}/jobs`);

export const getGenerationJob = (jobId: string) =>
  automationRequest<GenerationJob>(`${ADMIN_BASE}/generation-jobs/${encodeURIComponent(jobId)}`);

export const listAdminBatiks = async (options: { limit?: number; offset?: number } = {}) =>
  (await automationRequest<Batik[]>(`${ADMIN_BASE}/batiks${queryString({ limit: options.limit, offset: options.offset })}`))
    .map(normalizeBatikMedia);

export const getAdminBatik = async (id: number) => normalizeBatikMedia(await automationRequest<Batik>(`${ADMIN_BASE}/batiks/${id}`));

export const updateBatik = async (id: number, values: Partial<Pick<Batik, "keyword" | "warna" | "style" | "is_published">>) =>
  normalizeBatikMedia(await automationRequest<Batik>(`${ADMIN_BASE}/batiks/${id}`, jsonRequest("PATCH", values)));

export const deleteBatik = (id: number) => automationRequest<unknown>(`${ADMIN_BASE}/batiks/${id}`, { method: "DELETE" });
export const publishBatik = (id: number) => automationRequest<unknown>(`${ADMIN_BASE}/batiks/${id}/publish`, jsonRequest("POST"));
export const unpublishBatik = (id: number) => automationRequest<unknown>(`${ADMIN_BASE}/batiks/${id}/unpublish`, jsonRequest("POST"));
export const regenerateCostume = (id: number) => automationRequest<{ queued_count: number }>(`${ADMIN_BASE}/batiks/${id}/regenerate-costume`, jsonRequest("POST"));
export const regenerateVideo = (id: number) => automationRequest<{ queued_count: number; job_id: string }>(`${ADMIN_BASE}/batiks/${id}/regenerate-video`, jsonRequest("POST"));

export const listWordlistCategories = () => automationRequest<WordlistCategory[]>(`${ADMIN_BASE}/wordlist-categories`);
export const createWordlistCategory = (values: Omit<WordlistCategory, "id">) =>
  automationRequest<WordlistCategory>(`${ADMIN_BASE}/wordlist-categories`, jsonRequest("POST", values));
export const updateWordlistCategory = (id: number, values: Partial<Omit<WordlistCategory, "id" | "code">>) =>
  automationRequest<WordlistCategory>(`${ADMIN_BASE}/wordlist-categories/${id}`, jsonRequest("PATCH", values));
export const deleteWordlistCategory = (id: number) => automationRequest<unknown>(`${ADMIN_BASE}/wordlist-categories/${id}`, { method: "DELETE" });

export const listWordlistItems = (categoryId?: number) =>
  automationRequest<WordlistItem[]>(`${ADMIN_BASE}/wordlist-items${queryString({ category_id: categoryId })}`);
export const createWordlistItem = (values: Omit<WordlistItem, "id">) =>
  automationRequest<WordlistItem>(`${ADMIN_BASE}/wordlist-items`, jsonRequest("POST", values));
export const updateWordlistItem = (id: number, values: Partial<Omit<WordlistItem, "id">>) =>
  automationRequest<WordlistItem>(`${ADMIN_BASE}/wordlist-items/${id}`, jsonRequest("PATCH", values));
export const deleteWordlistItem = (id: number) => automationRequest<unknown>(`${ADMIN_BASE}/wordlist-items/${id}`, { method: "DELETE" });
export const importWordlistItems = (values: { category_code: string; items: string[]; replace: boolean }) =>
  automationRequest<{ count: number }>(`${ADMIN_BASE}/wordlist-items/import`, jsonRequest("POST", values));

export const listCostumeTemplates = () => automationRequest<CostumeTemplate[]>(`${ADMIN_BASE}/costume-templates`);
export const uploadCostumeTemplate = (form: FormData) =>
  automationRequest<CostumeTemplate>(`${ADMIN_BASE}/costume-templates/upload`, { method: "POST", body: form });
export const updateCostumeTemplate = (id: number, values: Partial<Omit<CostumeTemplate, "id" | "created_at" | "updated_at">>) =>
  automationRequest<CostumeTemplate>(`${ADMIN_BASE}/costume-templates/${id}`, jsonRequest("PATCH", values));
export const deleteCostumeTemplate = (id: number) => automationRequest<unknown>(`${ADMIN_BASE}/costume-templates/${id}`, { method: "DELETE" });

export const listSettings = () => automationRequest<AppSettings>(`${ADMIN_BASE}/settings`);
export const putSetting = (key: string, value: Record<string, unknown>) =>
  automationRequest<{ key: string; value: Record<string, unknown> }>(`${ADMIN_BASE}/settings/${encodeURIComponent(key)}`, jsonRequest("PUT", value));

export const listPublicBatiks = (options: { page?: number; perPage?: number; query?: string } = {}) => {
  const cachePath = publicBatikListPath(options);
  return automationRequest<PublicBatikList>(cachePath).then((result) => {
    const items = result.items.map(normalizeBatikMedia);
    const normalized = { ...result, items };
    setCachedValue(cachePath, normalized);
    items.forEach(putPublicBatikCache);
    return normalized;
  });
};

export const getPublicBatik = async (slug: string) => {
  const cached = readPublicBatikCache(slug);
  if (cached) return cached;

  const normalized = normalizeBatikMedia(await automationRequest<Batik>(publicBatikPath(slug)));
  putPublicBatikCache(normalized);
  return normalized;
};

export const prefetchPublicBatik = (slug: string) => {
  if (!slug.trim()) return;

  void getPublicBatik(slug).catch(() => {
    // Prefetch bersifat opsional. Error tetap ditangani saat halaman detail dibuka.
  });
};
