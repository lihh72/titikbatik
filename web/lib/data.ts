import type { Motif } from "./types";

export const motifs: Motif[] = [
  {
    id: "2435",
    title: "Ceplok Arunika",
    variant: "ceplok",
    category: "Modern",
    prompt:
      "batik ceplok modern, geometric rosette pattern with clean bold outline, fresh fabric design",
    colors: ["#153f42", "#ead7b9", "#d7a85f"],
    palette: "Dark Teal · Champagne",
    likes: 128,
    price: 85000,
    license: "Komersial",
    format: ["PNG", "SVG", "JPG"],
    description:
      "Motif ceplok geometris dengan roset tegas yang memadukan ritme tradisional dan penyederhanaan visual modern.",
    origin: "Inspirasi Jawa",
  },
  {
    id: "4653",
    title: "Mega Mendung Senja",
    variant: "mega-mendung",
    category: "Pesisir",
    prompt:
      "batik pattern, single large mega mendung cloud, one dominant cloud on wide open sky",
    colors: ["#202b59", "#f0dfbf", "#b16a4e"],
    palette: "Deep Indigo · Warm Ivory",
    likes: 246,
    price: 95000,
    license: "Komersial",
    format: ["PNG", "SVG", "TIFF"],
    description:
      "Interpretasi Mega Mendung dengan satu bentuk awan dominan, ruang negatif lapang, dan nuansa indigo hangat.",
    origin: "Inspirasi Cirebon",
  },
  {
    id: "7557",
    title: "Buketan Magnolia",
    variant: "buketan",
    category: "Pesisir",
    prompt:
      "batik buketan pattern, tiny magnolia and small jasmine flower bouquet, elegant white floral buketan",
    colors: ["#d9c8e3", "#c8a978", "#fff7e8"],
    palette: "Pale Lilac · Warm Sand",
    likes: 193,
    price: 105000,
    license: "Eksklusif",
    format: ["PNG", "SVG", "PSD"],
    description:
      "Rangkaian magnolia dan melati berukuran kecil yang membentuk buket lembut dengan karakter elegan.",
    origin: "Inspirasi Pekalongan",
  },
  {
    id: "1827",
    title: "Kawung Niskala",
    variant: "kawung",
    category: "Keraton",
    prompt:
      "traditional kawung batik, symmetrical palm fruit geometry, refined royal composition",
    colors: ["#291d1a", "#d8b47a", "#8c3f2f"],
    palette: "Soga · Royal Gold",
    likes: 318,
    price: 125000,
    license: "Eksklusif",
    format: ["PNG", "SVG", "TIFF"],
    description:
      "Susunan kawung simetris dengan dominasi soga, garis halus, dan karakter formal yang terinspirasi tradisi keraton.",
    origin: "Inspirasi Yogyakarta",
  },
  {
    id: "3164",
    title: "Parang Samudra",
    variant: "parang",
    category: "Klasik",
    prompt:
      "classic parang batik, flowing diagonal blade rhythm, deep ocean blue and warm cream",
    colors: ["#15334b", "#ead8b9", "#9b5b39"],
    palette: "Ocean Blue · Soga Cream",
    likes: 277,
    price: 115000,
    license: "Komersial",
    format: ["PNG", "SVG", "JPG"],
    description:
      "Irama diagonal parang yang kuat dengan lengkung berulang untuk menghadirkan kesan dinamis namun tetap tertata.",
    origin: "Inspirasi Jawa Tengah",
  },
  {
    id: "6092",
    title: "Sekar Jagad Lestari",
    variant: "sekar-jagad",
    category: "Modern",
    prompt:
      "sekar jagad inspired batik, patchwork islands, botanical ornaments, contemporary balanced palette",
    colors: ["#355f55", "#d9b986", "#8a4d5e"],
    palette: "Forest · Sand · Rosewood",
    likes: 221,
    price: 99000,
    license: "Eksplorasi",
    format: ["PNG", "SVG", "JPG"],
    description:
      "Komposisi pulau-pulau ornamen yang terhubung, memadukan bentuk botani dan bidang warna kontemporer.",
    origin: "Inspirasi Nusantara",
  },
];

export const motifOptions = [
  { value: "ceplok", label: "Ceplok" },
  { value: "mega-mendung", label: "Mega Mendung" },
  { value: "buketan", label: "Buketan" },
  { value: "kawung", label: "Kawung" },
  { value: "parang", label: "Parang" },
  { value: "sekar-jagad", label: "Sekar Jagad" },
] as const;

export const moduleItems = [
  { id: "motif", code: "FR-01", label: "Generate Motif", description: "Membuat motif batik dari parameter pilihan." },
  { id: "garment", code: "FR-02", label: "Batik Baju", description: "Menerapkan motif pada template pakaian." },
  { id: "human", code: "FR-03", label: "Orang Pakai Batik", description: "Visualisasi model manusia memakai batik." },
  { id: "video", code: "FR-04", label: "Video Visualisasi", description: "Membuat preview bergerak desain busana." },
  { id: "auto-generate", code: "FR-05", label: "Auto Generate", description: "Menghasilkan beberapa variasi secara otomatis." },
  { id: "seamless", code: "FR-06", label: "Seamless Pattern", description: "Membuat pola berulang tanpa sambungan terlihat." },
  { id: "upscale", code: "FR-07", label: "AI Upscaling", description: "Meningkatkan resolusi hasil motif." },
] as const;

export function generationToMotif(item: import("./types").GenerationResult): Motif {
  return {
    id: item.id,
    title: item.title,
    variant: item.variant,
    category: "Modern",
    prompt: item.prompt,
    colors: item.colors,
    palette: "Palet hasil eksplorasi AI",
    likes: 0,
    price: 0,
    license: "Eksplorasi",
    format: item.stage === "video" ? ["MP4"] : ["PNG", "JPG"],
    description: `Koleksi ${item.title} telah melalui proses kurasi internal sebelum ditampilkan pada galeri publik.`,
    origin: "Koleksi TitikBatik AI",
  };
}
