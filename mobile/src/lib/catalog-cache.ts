import type { Batik, Catalog } from "./types";
import { assertNotAborted } from "./abort";

/** One cache per adapter instance; data never crosses a server or demo scope. */
export function withCatalogCache(source: Catalog, seed: Batik[] = []): Catalog {
  const items = new Map(seed.map((item) => [item.slug, item]));
  return {
    peek: (slug) => items.get(slug),
    async list(query, page, signal) {
      const result = await source.list(query, page, signal);
      assertNotAborted(signal);
      for (const item of result.items) items.set(item.slug, item);
      return result;
    },
    async detail(slug, signal) {
      const item = await source.detail(slug, signal);
      assertNotAborted(signal);
      items.set(slug, item);
      return item;
    },
  };
}
