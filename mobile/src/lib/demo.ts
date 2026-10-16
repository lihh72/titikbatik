import type { Batik, Catalog } from "./types";
import { searchDemo } from "./search";
import { assertNotAborted } from "./abort";
export { searchDemo } from "./search";

// Real generated assets, with short catalogue titles. No synthetic placeholder motifs.
const entries = [
  {
    id: "10",
    title: "Kawung",
    color: "Persik, abu-abu",
    style: "Geometris",
    seed: 828584272167847,
    preview: require("../../assets/demo/Id6rzbEsUbVp_828584272167847_batik-pattern-kawung-circle-scattered-botanical-arrangement_preview.webp"),
    costumes: [
      require("../../assets/demo/2xS2VmpuVV06_457020829044974_batik-10_costume.webp"),
    ],
  },
  {
    id: "9",
    title: "Teratai lereng",
    color: "Navy, krem",
    style: "Tradisional",
    seed: 828584272167847,
    preview: require("../../assets/demo/jhoJQ89gIASH_828584272167847_batik-pattern-lotus-flower-diagonal-lereng-arrangement-balan_preview.webp"),
    costumes: [
      require("../../assets/demo/vUzf2gLiXIwX_457020829044974_batik-9_costume.webp"),
    ],
    video: require("../../assets/demo/batik-9.mp4"),
  },
  {
    id: "8",
    title: "Daun tropis",
    color: "Indigo, ivory",
    style: "Mega mendung",
    seed: 828584272167847,
    preview: require("../../assets/demo/l2uyXjKHiu53_828584272167847_batik-pattern-tropical-leaf-scattered-botanical-arrangement_preview.webp"),
    costumes: [
      require("../../assets/demo/4dZfZZ3RpTqA_457020829044974_batik-8_costume.webp"),
    ],
    video: require("../../assets/demo/batik-8.mp4"),
  },
  {
    id: "7",
    title: "Kupu-kupu",
    color: "Biru, emas",
    style: "Geometris",
    seed: 200954425244278,
    preview: require("../../assets/demo/GYVz8cZXPukD_200954425244278_batik-pattern-butterfly-scattered-botanical-arrangement-spar_preview.webp"),
    costumes: [],
  },
  {
    id: "6",
    title: "Parang",
    color: "Biru muda, ivory",
    style: "Sogan Solo",
    seed: 27312513493292,
    preview: require("../../assets/demo/nMI09GIW7oNP_27312513493292_batik-pattern-parang-wave-scattered-botanical-arrangement-sp_preview.webp"),
    costumes: [],
  },
  {
    id: "5",
    title: "Teratai",
    color: "Indigo, ivory",
    style: "Tradisional",
    seed: 134668639843748,
    preview: require("../../assets/demo/TaFYaVU5apq9_134668639843748_batik-pattern-lotus-flower-flowing-curved-lines-sparse-place_preview.webp"),
    costumes: [],
  },
  {
    id: "4",
    title: "Daun lereng",
    color: "Persik, abu-abu",
    style: "Tradisional",
    seed: 22773019039450,
    preview: require("../../assets/demo/nXxg2msGdtxq_22773019039450_batik-pattern-tropical-leaf-diagonal-lereng-arrangement-bala_preview.webp"),
    costumes: [],
  },
];
export const demoBatiks: Batik[] = entries.map((item) => ({
  id: `demo-${item.id}`,
  slug: item.id,
  title: item.title,
  color: item.color,
  style: item.style,
  seed: item.seed,
  createdAt: "2026-07-01T09:00:00+07:00",
  prompt:
    "Koleksi demo dari hasil generation TitikBatik. Judul dan label disingkat untuk katalog; tanggal bersifat ilustratif.",
  media: [
    { id: "motif", kind: "image", label: "Motif", source: item.preview },
    ...item.costumes.map((source, i) => ({
      id: `costume-${i}`,
      kind: "image" as const,
      label: `Costume ${i + 1}`,
      source,
    })),
    ...(item.video
      ? [
          {
            id: "video",
            kind: "video" as const,
            label: "Video",
            source: item.video,
          },
        ]
      : []),
  ],
}));
export const demoCatalog: Catalog = {
  async list(query, page, signal) {
    assertNotAborted(signal);
    return searchDemo(demoBatiks, query, page, 12);
  },
  async detail(slug, signal) {
    assertNotAborted(signal);
    const item = demoBatiks.find((item) => item.slug === slug);
    if (!item) throw new Error("Batik demo tidak ditemukan.");
    return item;
  },
};
