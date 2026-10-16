export type Mode = "demo" | "backend";
export type Media = {
  id: string;
  kind: "image" | "video";
  label: string;
  source: number | string;
};
export type Batik = {
  id: string;
  slug: string;
  title: string;
  color: string;
  style: string;
  seed: number | null;
  createdAt: string;
  prompt: string | null;
  media: Media[];
};
export type Page = {
  items: Batik[];
  page: number;
  total: number;
  totalPages: number;
};
export type Catalog = {
  list: (query: string, page: number, signal?: AbortSignal) => Promise<Page>;
  detail: (slug: string, signal?: AbortSignal) => Promise<Batik>;
};
export type ChatCard = {
  id: string;
  title: string;
  previewUrl: string;
  detailUrl: string;
  downloadUrl: string;
};
export type Attachment = {
  dataUrl: string;
  mimeType: "image/jpeg" | "image/png" | "image/webp" | "image/gif";
  name: string;
};
export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  cards?: ChatCard[];
  demoSlugs?: string[];
  interrupted?: boolean;
  attachmentName?: string;
};
export type Preferences = {
  liked: string[];
  saved: Batik[];
  messages: Message[];
};
export type Settings = { mode: Mode; baseUrl: string };
