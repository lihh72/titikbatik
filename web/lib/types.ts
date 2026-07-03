export type MotifVariant = "ceplok" | "mega-mendung" | "buketan" | "kawung" | "parang" | "sekar-jagad";

export type GenerationStage =
  | "motif"
  | "auto-generate"
  | "seamless"
  | "garment"
  | "human"
  | "video"
  | "upscale";

export type Motif = {
  id: string;
  title: string;
  variant: MotifVariant;
  category: "Klasik" | "Modern" | "Keraton" | "Pesisir";
  prompt: string;
  colors: [string, string, string?];
  palette: string;
  likes: number;
  price: number;
  license: "Eksplorasi" | "Komersial" | "Eksklusif";
  format: string[];
  description: string;
  origin: string;
};

export type GenerationConfig = {
  motif: MotifVariant;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  style: "Tradisional" | "Modern" | "Minimalis" | "Eksperimental";
  composition: "Simetris" | "Diagonal" | "Berulang" | "Organik";
  density: "Renggang" | "Seimbang" | "Padat";
  count: 1 | 2 | 4;
};

export type GenerationResult = {
  id: string;
  title: string;
  variant: MotifVariant;
  stage: GenerationStage;
  prompt: string;
  colors: [string, string, string];
  createdAt: string;
  resolution: string;
  style: GenerationConfig["style"];
  composition: GenerationConfig["composition"];
  density: GenerationConfig["density"];
  sourceId?: string;
  status?: "draft" | "published";
  isPublic?: boolean;
  publishedAt?: string | null;
  imageUrl?: string;
  videoUrl?: string;
};

export type UserProfile = {
  name: string;
  email: string;
};
