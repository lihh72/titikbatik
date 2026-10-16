import type { Batik, Catalog, ChatCard, Media } from "./types";
import { assertNotAborted } from "./abort";

export function validateBaseUrl(value: string) {
  const trimmed = value.trim().replace(/\/+$/, "");
  const url = new URL(trimmed);
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== "/"
  ) {
    throw new Error(
      "Gunakan alamat dasar HTTP/HTTPS, misalnya http://192.168.1.10:3000.",
    );
  }
  return trimmed;
}
export function absoluteUrl(base: string, value: string) {
  const url = new URL(value, `${base}/`);
  if (!["http:", "https:"].includes(url.protocol))
    throw new Error("Alamat media tidak didukung.");
  // Backend may return a localhost URL; route public media through the reachable Next server.
  if (/^\/api\//.test(url.pathname))
    return new URL(
      `${url.pathname.replace(/^\/api\/v1\/images\//, "/api/automation/public/images/")}${url.search}`,
      `${base}/`,
    ).href;
  return url.href;
}
type RawCostume = {
  id: number;
  filename: string;
  file_video: string | null;
  template?: { name: string } | null;
};
export type RawBatik = {
  id: number;
  slug: string;
  keyword: string;
  warna: string | null;
  style: string | null;
  seed: number | null;
  created_at: string;
  positive_prompt: string | null;
  file_preview: string | null;
  preview_url: string | null;
  file_video?: string | null;
  costume_urls?: string[];
  costume_files?: RawCostume[];
};
export function normalizeBatik(base: string, item: RawBatik): Batik {
  const media: Media[] = [];
  const path = (category: string, file: string) =>
    absoluteUrl(
      base,
      `/api/automation/public/images/${category}/${encodeURIComponent(file)}`,
    );
  if (item.file_preview || item.preview_url)
    media.push({
      id: "motif",
      label: "Motif",
      kind: "image",
      source: item.file_preview
        ? path("preview", item.file_preview)
        : absoluteUrl(base, item.preview_url!),
    });
  for (const costume of item.costume_files ?? []) {
    const label =
      costume.template?.name ??
      `Costume ${media.filter((m) => m.id.startsWith("costume")).length + 1}`;
    media.push({
      id: `costume-${costume.id}`,
      kind: "image",
      label,
      source: path("costume", costume.filename),
    });
    if (costume.file_video)
      media.push({
        id: `video-${costume.id}`,
        kind: "video",
        label: `Video ${label}`,
        source: path("video", costume.file_video),
      });
  }
  if (!item.costume_files?.length)
    for (const [i, url] of (item.costume_urls ?? []).entries())
      media.push({
        id: `costume-${i}`,
        kind: "image",
        label: `Costume ${i + 1}`,
        source: absoluteUrl(base, url),
      });
  if (item.file_video && !media.some((m) => m.kind === "video"))
    media.push({
      id: "video",
      kind: "video",
      label: "Video",
      source: path("video", item.file_video),
    });
  return {
    id: String(item.id),
    slug: item.slug,
    title: item.keyword,
    color: item.warna ?? "Belum tercatat",
    style: item.style ?? "Batik digital",
    seed: item.seed,
    createdAt: item.created_at,
    prompt: item.positive_prompt,
    media,
  };
}
export async function requestJson<T>(
  base: string,
  path: string,
  signal?: AbortSignal,
): Promise<T> {
  const target = `${validateBaseUrl(base)}${path}`;
  const controller = new AbortController();
  const cancel = () => controller.abort(signal?.reason);
  if (signal?.aborted) cancel();
  signal?.addEventListener("abort", cancel, { once: true });
  const timer = setTimeout(
    () =>
      controller.abort(
        new Error(
          "Server tidak merespons dalam 20 detik. Periksa alamat dan koneksi.",
        ),
      ),
    20000,
  );
  try {
    assertNotAborted(controller.signal);
    const response = await fetch(target, { signal: controller.signal });
    const payload = await response.json().catch(() => {
      throw new Error(`Respons server bukan JSON (${response.status}).`);
    });
    if (!response.ok || !payload.success)
      throw new Error(
        payload.message ??
          payload.detail ??
          `Server mengembalikan status ${response.status}.`,
      );
    return payload.data as T;
  } catch (reason) {
    assertNotAborted(controller.signal);
    throw reason;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", cancel);
  }
}
export function backendCatalog(base: string): Catalog {
  return {
    async list(query, page, signal) {
      const search = new URLSearchParams({
        page: String(page),
        per_page: "12",
      });
      if (query.trim()) search.set("q", query.trim());
      const data = await requestJson<{
        items: RawBatik[];
        pagination: { page: number; total: number; total_pages: number };
      }>(
        base,
        `/api/automation/public/batiks${query.trim() ? "/search" : ""}?${search}`,
        signal,
      );
      return {
        items: data.items.map((item) => normalizeBatik(base, item)),
        page: data.pagination.page,
        total: data.pagination.total,
        totalPages: data.pagination.total_pages,
      };
    },
    async detail(slug, signal) {
      return normalizeBatik(
        base,
        await requestJson<RawBatik>(
          base,
          `/api/automation/public/batiks/${encodeURIComponent(slug)}`,
          signal,
        ),
      );
    },
  };
}
export function normalizeChatCard(base: string, card: ChatCard): ChatCard {
  return {
    ...card,
    previewUrl: absoluteUrl(base, card.previewUrl),
    detailUrl: absoluteUrl(base, card.detailUrl),
    downloadUrl: absoluteUrl(base, card.downloadUrl),
  };
}
export function cardSlug(url: string) {
  const match = new URL(url, "https://titikbatik.local").pathname.match(
    /^\/gallery\/([^/]+)\/?$/,
  );
  if (!match) throw new Error("Tautan detail batik tidak valid.");
  return decodeURIComponent(match[1]);
}
