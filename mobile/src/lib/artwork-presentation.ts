import type { Media } from "./types";

// These represent the catalog's named colors, not colors extracted from the artwork.
const namedColors: Record<string, string> = {
  navy: "#202b43",
  indigo: "#3b3d64",
  ivory: "#eee8d7",
  krem: "#e6dac2",
  cream: "#e6dac2",
  persik: "#d5a1a3",
  peach: "#d5a1a3",
  "abu-abu": "#a4a09a",
  gray: "#a4a09a",
  grey: "#a4a09a",
  biru: "#385c9b",
  "biru muda": "#91b3c7",
  emas: "#caa34f",
  gold: "#caa34f",
  hitam: "#242421",
  black: "#242421",
  putih: "#f3f0e8",
  white: "#f3f0e8",
  merah: "#ad4f43",
  red: "#ad4f43",
  cokelat: "#806047",
  brown: "#806047",
  hijau: "#59664a",
  green: "#59664a",
};

export function catalogPalette(value: string) {
  return value
    .split(/[,/;&]|\s+dan\s+/i)
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name) => ({
      name,
      color: namedColors[name.toLocaleLowerCase("id-ID")] ?? null,
    }));
}

export function mediaName(media: Pick<Media, "id" | "label" | "kind">) {
  if (media.kind === "video") return "Video";
  if (/^costume(?:-|$)/i.test(media.id) || /^costume\b/i.test(media.label)) {
    const number = media.label.match(/\d+/)?.[0];
    return number && number !== "1" ? `Busana ${number}` : "Busana";
  }
  return media.label || "Motif";
}

export function artworkDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Belum tercatat"
    : date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
}
