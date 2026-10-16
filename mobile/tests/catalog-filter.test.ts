import assert from "node:assert/strict";
import { test } from "node:test";
import { categoryCatalog } from "../src/lib/catalog-filter";
import type { Batik, Catalog } from "../src/lib/types";

function batik(id: number, style = "Tradisional"): Batik {
  return {
    id: String(id),
    slug: String(id),
    title: "Teratai",
    color: "Biru",
    style,
    seed: null,
    prompt: null,
    createdAt: "2026-07-01",
    media: [],
  };
}

test("search and category intersect across source pages, with cached pagination", async () => {
  const calls: [string, number][] = [];
  const source: Catalog = {
    async list(query, page) {
      calls.push([query, page]);
      return {
        items:
          page === 1
            ? [
                ...Array.from({ length: 12 }, (_, i) => batik(i)),
                batik(99, "Geometris"),
              ]
            : [batik(12)],
        page,
        total: 14,
        totalPages: 2,
      };
    },
    async detail() {
      return batik(0);
    },
  };
  const filtered = categoryCatalog(source, "Tradisional");
  const first = await filtered.list("Teratai", 1);
  assert.equal(first.total, 13);
  assert.equal(first.totalPages, 2);
  assert.equal(first.items.length, 12);
  const second = await filtered.list("Teratai", 2);
  assert.deepEqual(
    second.items.map((item) => item.id),
    ["12"],
  );
  assert.deepEqual(calls, [
    ["Teratai", 1],
    ["Teratai", 2],
  ]);
  assert.equal(
    (await categoryCatalog(source, "Tidak ada").list("Teratai", 1)).total,
    0,
  );
});

test("removing the category preserves search; category alone uses existing server search", async () => {
  const calls: [string, number][] = [];
  const source: Catalog = {
    async list(query, page) {
      calls.push([query, page]);
      return { items: [], page, total: 0, totalPages: 0 };
    },
    async detail() {
      return batik(0);
    },
  };
  await categoryCatalog(source, "").list("Teratai", 2);
  await categoryCatalog(source, "Tradisional").list("", 1);
  assert.deepEqual(calls, [
    ["Teratai", 2],
    ["Tradisional", 1],
  ]);
});

test("aborting category intersection stops further requests and does not cache partial results", async () => {
  const controller = new AbortController();
  let calls = 0;
  const source: Catalog = {
    async list(query, page) {
      calls += 1;
      if (calls === 1) controller.abort();
      return { items: [batik(page)], page, total: 2, totalPages: 2 };
    },
    async detail() {
      return batik(0);
    },
  };
  const filtered = categoryCatalog(source, "Tradisional");
  await assert.rejects(filtered.list("Teratai", 1, controller.signal), {
    name: "AbortError",
  });
  assert.equal(calls, 1);
  assert.equal((await filtered.list("Teratai", 1)).total, 2);
  assert.equal(calls, 3);
});
