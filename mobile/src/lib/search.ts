import type { Batik } from "./types";
export function searchDemo(
  items: Batik[],
  query: string,
  page: number,
  size = 4,
) {
  const words = query.toLocaleLowerCase("id").trim().split(/\s+/);
  const matches = items.filter((item) =>
    words.every((word) =>
      `${item.title} ${item.color} ${item.style}`
        .toLocaleLowerCase("id")
        .includes(word),
    ),
  );
  return {
    items: matches.slice((page - 1) * size, page * size),
    page,
    total: matches.length,
    totalPages: Math.ceil(matches.length / size),
  };
}
