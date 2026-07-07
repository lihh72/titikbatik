import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LandingPage } from "@/components/landing-page";
import type { Batik } from "@/lib/automation-types";

const mocks = vi.hoisted(() => ({ listPublicBatiks: vi.fn() }));

vi.mock("@/lib/automation-api", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/automation-api")>(),
  listPublicBatiks: mocks.listPublicBatiks,
}));

vi.mock("@/components/app-provider", () => ({
  useApp: () => ({
    likedIds: [],
    bookmarkedIds: [],
    toggleLike: vi.fn(),
    toggleBookmark: vi.fn(),
  }),
}));

function batik(id: number, name: string): Batik {
  return {
    id,
    slug: `motif-${id}`,
    keyword: name,
    warna: "soga dan nila",
    style: "Kontemporer",
    seed: id,
    positive_prompt: name,
    negative_prompt: null,
    file_preview: `motif-${id}.webp`,
    file_video: null,
    prompt_hash: `hash-${id}`,
    is_published: true,
    created_at: "2026-07-03T00:00:00Z",
    updated_at: "2026-07-03T00:00:00Z",
    preview_url: `http://127.0.0.1:8000/api/v1/images/preview/motif-${id}.webp`,
    costume_urls: [],
    costume_files: [],
  };
}

describe("landing page", () => {
  beforeEach(() => {
    mocks.listPublicBatiks.mockResolvedValue({
      items: [batik(1, "Motif Satu"), batik(2, "Motif Dua"), batik(3, "Motif Tiga")],
      pagination: { page: 1, per_page: 3, total: 3, total_pages: 1 },
    });
  });

  it("presents the documentary process before the latest collection", async () => {
    render(<LandingPage />);

    expect(screen.getByRole("heading", { name: "Motif batik dari generative AI." })).toBeInTheDocument();
    const hero = screen.getByRole("region", { name: "Pengantar AI generatif" });
    expect(within(hero).getByAltText(/perajin batik menggambar malam/i)).toBeInTheDocument();

    const process = screen.getByRole("region", { name: "Proses batik" });
    expect(within(process).getByAltText(/perajin.*canting/i)).toBeInTheDocument();
    expect(within(process).getByAltText(/^malam batik dipanaskan.*canting/i)).toBeInTheDocument();
    expect(within(process).getByRole("heading", { name: "Scroll story ini mengikuti perubahan keputusan, bukan dekorasi." })).toBeInTheDocument();
    expect(process.querySelector("[data-motion='image-from-left']")).toBeInTheDocument();
    expect(process.querySelector("[data-motion='text-from-right']")).toBeInTheDocument();
    expect(process.querySelector("[data-motion='text-from-left']")).toBeInTheDocument();
    expect(process.querySelector("[data-motion='image-from-right']")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Pipeline generative AI" })).toBeInTheDocument();
    expect(within(process).getByText("Input visual")).toBeInTheDocument();
    expect(within(process).getByText("Model membuat kandidat")).toBeInTheDocument();
    expect(within(process).getByText("Kurasi ke galeri")).toBeInTheDocument();
    expect(process.querySelectorAll("[data-motion='generative-stage']")).toHaveLength(3);

    expect(screen.getByRole("heading", { name: "AI generatif memperluas eksplorasi, kurasi manusia menjaga arah." })).toBeInTheDocument();

    const latest = screen.getByRole("region", { name: "Koleksi AI terbaru" });
    expect(await within(latest).findAllByRole("link", { name: /Motif (Satu|Dua|Tiga)/i })).toHaveLength(3);
  });

  it("renders latest motif cards as readable light surfaces", async () => {
    render(<LandingPage />);

    const latest = screen.getByRole("region", { name: "Koleksi AI terbaru" });
    const cards = await within(latest).findAllByRole("article");

    expect(cards).toHaveLength(3);
    cards.forEach((card) => expect(card).toHaveAttribute("data-surface", "light"));
    expect(within(cards[0]).getByText("soga dan nila")).toHaveClass("motif-card-meta");
    expect(within(cards[0]).getByRole("button", { name: "Sukai" })).toHaveClass("motif-card-icon-button");
    expect(within(cards[0]).getByRole("button", { name: "Simpan" })).toHaveClass("motif-card-icon-button");
  });
});
