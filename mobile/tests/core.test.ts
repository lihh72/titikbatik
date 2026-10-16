/// <reference types="node" />
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import {
  absoluteUrl,
  backendCatalog,
  cardSlug,
  normalizeBatik,
  normalizeChatCard,
  validateBaseUrl,
  type RawBatik,
} from "../src/lib/api";
import { searchDemo } from "../src/lib/search";
import { consumeChatStream, createSseParser } from "../src/lib/sse";
import {
  emptyPreferences,
  parsePreferences,
  preferenceKey,
} from "../src/lib/storage";
import type { Batik } from "../src/lib/types";

const base = "http://192.168.1.10:3000";
const raw: RawBatik = {
  id: 9,
  slug: "daun-tropis",
  keyword: "Daun Tropis",
  warna: "Hijau",
  style: "Botanikal",
  seed: 123,
  created_at: "2026-07-01",
  positive_prompt: "batik",
  file_preview: "motif 9.webp",
  preview_url: "/old",
  costume_files: [
    {
      id: 7,
      filename: "model.webp",
      file_video: "model.mp4",
      template: { name: "Kemeja" },
    },
  ],
};
const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
});

test("server URL validates and media resolves to reachable Next.js origin", () => {
  assert.equal(validateBaseUrl(` ${base}/ `), base);
  for (const url of [
    "file:///a",
    "https://user:pass@example.com",
    `${base}/api`,
    `${base}?key=secret`,
    "localhost:3000",
  ])
    assert.throws(() => validateBaseUrl(url));
  assert.equal(
    absoluteUrl(base, "/api/automation/public/images/preview/a.webp"),
    `${base}/api/automation/public/images/preview/a.webp`,
  );
  assert.equal(
    absoluteUrl(base, "http://localhost:8000/api/v1/images/preview/a.webp"),
    `${base}/api/automation/public/images/preview/a.webp`,
  );
  assert.equal(
    absoluteUrl(base, "https://cdn.example.com/a.webp"),
    "https://cdn.example.com/a.webp",
  );
  assert.throws(() => absoluteUrl(base, "javascript:alert(1)"));
});
test("normalizes motif, costume, video, metadata and missing optional media", () => {
  const item = normalizeBatik(base, raw);
  assert.equal(item.id, "9");
  assert.equal(item.media.length, 3);
  assert.equal(
    item.media[0].source,
    `${base}/api/automation/public/images/preview/motif%209.webp`,
  );
  assert.equal(item.media[2].kind, "video");
  assert.equal(item.media[2].label, "Video Kemeja");
  assert.equal(
    normalizeBatik(base, {
      ...raw,
      file_preview: null,
      preview_url: null,
      costume_files: [],
      costume_urls: [],
    }).media.length,
    0,
  );
});
test("catalog follows public envelope, encoded search, pagination, and detail contracts", async () => {
  const urls: string[] = [];
  globalThis.fetch = async (input) => {
    urls.push(String(input));
    return Response.json({
      success: true,
      data: String(input).includes("?")
        ? { items: [raw], pagination: { page: 2, total: 13, total_pages: 2 } }
        : raw,
    });
  };
  const catalog = backendCatalog(base);
  const result = await catalog.list("daun & hijau", 2);
  assert.equal(result.totalPages, 2);
  assert.equal(result.items[0].slug, raw.slug);
  assert.match(
    urls[0],
    /batiks\/search\?page=2&per_page=12&q=daun\+%26\+hijau/,
  );
  assert.equal((await catalog.detail("daun/tropis")).id, "9");
  assert.match(urls[1], /daun%2Ftropis$/);
});
test("catalog surfaces backend failures, invalid JSON, network errors and abort", async () => {
  globalThis.fetch = async () =>
    Response.json(
      { success: false, message: "Tidak tersedia" },
      { status: 503 },
    );
  await assert.rejects(backendCatalog(base).list("", 1), /Tidak tersedia/);
  globalThis.fetch = async () => new Response("<html>", { status: 502 });
  await assert.rejects(backendCatalog(base).detail("x"), /bukan JSON/);
  globalThis.fetch = async () => {
    throw new TypeError("Network request failed");
  };
  await assert.rejects(
    backendCatalog(base).list("", 1),
    /Network request failed/,
  );
  globalThis.fetch = async (_input, init) => {
    init?.signal?.throwIfAborted();
    return Response.json({ success: true });
  };
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(backendCatalog(base).list("", 1, controller.signal), {
    name: "AbortError",
  });
});
test("chat cards use absolute media URLs and internal detail slugs", () => {
  const card = normalizeChatCard(base, {
    id: "9",
    title: "Motif",
    previewUrl: "/api/automation/public/images/preview/x.webp",
    detailUrl: "/gallery/daun%20tropis",
    downloadUrl: "/api/automation/public/images/preview/x.webp",
  });
  assert.equal(cardSlug(card.detailUrl), "daun tropis");
  assert.ok(card.previewUrl.startsWith(base));
  assert.throws(() => cardSlug("/admin"));
});
test("demo searches title, palette and style, paginates and handles no match", () => {
  const items: Batik[] = Array.from({ length: 7 }, (_, i) => ({
    id: String(i),
    slug: String(i),
    title: `Kawung ${i}`,
    color: "Hijau",
    style: "Geometris",
    media: [],
    prompt: null,
    seed: null,
    createdAt: "",
  }));
  const first = searchDemo(items, "  HIJAU geometris ", 1);
  assert.equal(first.total, 7);
  assert.equal(first.items.length, 4);
  assert.equal(first.totalPages, 2);
  assert.equal(searchDemo(items, "", 2).items.length, 3);
  assert.equal(searchDemo(items, "ungu", 1).total, 0);
});
test("saved data and chat are isolated by mode and backend address", () => {
  const demo = preferenceKey({ mode: "demo", baseUrl: base });
  assert.equal(demo, preferenceKey({ mode: "demo", baseUrl: "" }));
  const backend = preferenceKey({ mode: "backend", baseUrl: base });
  assert.notEqual(demo, backend);
  assert.notEqual(
    backend,
    preferenceKey({ mode: "backend", baseUrl: "https://titikbatik.example" }),
  );
  assert.deepEqual(parsePreferences("{broken"), emptyPreferences());
  assert.deepEqual(
    parsePreferences(
      JSON.stringify({
        liked: ["9", 3],
        saved: [{ invalid: true }],
        messages: [{ role: "x" }],
      }),
    ),
    { liked: ["9"], saved: [], messages: [] },
  );
});
test("SSE parser handles every possible split, CRLF and trailing event", () => {
  const text =
    'event: token\r\ndata: {"content":"batik 🌿"}\r\n\r\nevent: done\r\ndata: {}\r\n\r\n';
  for (let i = 0; i <= text.length; i++) {
    const events: unknown[] = [];
    const parser = createSseParser((event) => events.push(event));
    parser.feed(text.slice(0, i));
    parser.feed(text.slice(i), true);
    assert.deepEqual(events, [
      { event: "token", data: { content: "batik 🌿" } },
      { event: "done", data: {} },
    ]);
  }
  const events: unknown[] = [];
  createSseParser((event) => events.push(event)).feed(
    ": ping\n\nevent: done\ndata: {}",
    true,
  );
  assert.equal(events.length, 1);
});
test("stream decoding survives single-byte UTF-8 chunks", async () => {
  const data = new TextEncoder().encode(
    'event: token\ndata: {"content":"motif 🌿"}\n\nevent: done\ndata: {}\n\n',
  );
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const byte of data) controller.enqueue(new Uint8Array([byte]));
      controller.close();
    },
  });
  const events: unknown[] = [];
  await consumeChatStream(stream, new AbortController().signal, (event) =>
    events.push(event),
  );
  assert.equal(
    (events[0] as { data: { content: string } }).data.content,
    "motif 🌿",
  );
});
test("stream abort releases reader and surfaces callback/server errors", async () => {
  let canceled = false;
  const pending = new ReadableStream<Uint8Array>({
    cancel() {
      canceled = true;
    },
  });
  const controller = new AbortController();
  const result = consumeChatStream(pending, controller.signal, () => {});
  controller.abort();
  await assert.rejects(result, { name: "AbortError" });
  assert.ok(canceled);
  assert.equal(pending.locked, false);
  const failure = new ReadableStream<Uint8Array>({
    start(c) {
      c.enqueue(
        new TextEncoder().encode(
          'event: error\ndata: {"message":"Provider mati"}\n\n',
        ),
      );
      c.close();
    },
  });
  await assert.rejects(
    consumeChatStream(failure, new AbortController().signal, (event) => {
      throw new Error(String(event.data.message));
    }),
    /Provider mati/,
  );
  assert.throws(
    () => createSseParser(() => {}).feed("event: token\ndata: nope\n\n"),
    /tidak valid/,
  );
});
