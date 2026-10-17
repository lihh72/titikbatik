import assert from "node:assert/strict";
import { test } from "node:test";
import { withCatalogCache } from "../src/lib/catalog-cache";
import type { Batik, Catalog } from "../src/lib/types";

const item: Batik = {
  id: "1",
  slug: "1",
  title: "Teratai",
  style: "Tradisional",
  color: "Biru",
  seed: null,
  createdAt: "",
  prompt: null,
  media: [],
};
function source(detail: Catalog["detail"] = async () => item): Catalog {
  return {
    list: async () => ({ items: [item], page: 1, total: 1, totalPages: 1 }),
    detail,
  };
}

test("listed works are immediately available for opening detail, scoped to one adapter", async () => {
  const first = withCatalogCache(source());
  const otherServer = withCatalogCache(source());
  assert.equal(first.peek?.("1"), undefined);
  await first.list("", 1);
  assert.equal(first.peek?.("1"), item);
  assert.equal(otherServer.peek?.("1"), undefined);
  assert.equal(withCatalogCache(source(), [item]).peek?.("1"), item);
});

test("cached detail still revalidates and surfaces server errors without deleting visible data", async () => {
  let calls = 0;
  const fresh = { ...item, prompt: "Updated" };
  const adapter = withCatalogCache(
    source(async () => {
      if (++calls > 1) throw new Error("Offline");
      return fresh;
    }),
    [item],
  );
  assert.equal(await adapter.detail("1"), fresh);
  assert.equal(adapter.peek?.("1"), fresh);
  await assert.rejects(adapter.detail("1"), /Offline/);
  assert.equal(adapter.peek?.("1"), fresh);
});

test("aborted responses cannot overwrite the visible cached work", async () => {
  const controller = new AbortController();
  const adapter = withCatalogCache(
    source(async () => {
      controller.abort();
      return { ...item, title: "Stale" };
    }),
    [item],
  );
  await assert.rejects(adapter.detail("1", controller.signal), {
    name: "AbortError",
  });
  assert.equal(adapter.peek?.("1"), item);
});
