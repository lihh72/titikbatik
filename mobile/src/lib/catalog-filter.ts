import { assertNotAborted } from "./abort";
import type { Batik, Catalog } from "./types";

/** The existing server accepts one search term; intersect category locally. */
export function categoryCatalog(source: Catalog, category: string): Catalog {
  let cached: { query: string; items: Batik[] } | undefined;
  return {
    detail: source.detail,
    async list(query, page, signal) {
      assertNotAborted(signal);
      if (!category || !query.trim())
        return source.list(query.trim() || category, page, signal);

      if (cached?.query !== query) {
        const matches = new Map<string, Batik>();
        let next = 1;
        let last = 1;
        do {
          const result = await source.list(query, next, signal);
          assertNotAborted(signal);
          for (const item of result.items) {
            if (
              item.style.toLocaleLowerCase("id") ===
              category.toLocaleLowerCase("id")
            )
              matches.set(item.id, item);
          }
          last = result.totalPages;
          next += 1;
        } while (next <= last);
        cached = { query, items: [...matches.values()] };
      }
      const size = 12;
      return {
        items: cached.items.slice((page - 1) * size, page * size),
        page,
        total: cached.items.length,
        totalPages: Math.ceil(cached.items.length / size),
      };
    },
  };
}
