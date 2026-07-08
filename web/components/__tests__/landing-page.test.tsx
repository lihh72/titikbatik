import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LandingPage } from "@/components/landing-page";
import type { Batik } from "@/lib/automation-types";

const mocks = vi.hoisted(() => ({
  listPublicBatiks: vi.fn(),
  readPublicBatiksCache: vi.fn(),
}));

vi.mock("@/lib/automation-api", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/automation-api")>(),
  listPublicBatiks: mocks.listPublicBatiks,
  readPublicBatiksCache: mocks.readPublicBatiksCache,
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
    mocks.readPublicBatiksCache.mockReturnValue(null);
    mocks.listPublicBatiks.mockResolvedValue({
      items: [batik(1, "Motif Satu"), batik(2, "Motif Dua"), batik(3, "Motif Tiga")],
      pagination: { page: 1, per_page: 9, total: 3, total_pages: 1 },
    });
  });

  it("presents the AI output showcase before the latest collection", async () => {
    render(<LandingPage />);

    expect(screen.getByRole("heading", { name: "Galeri motif AI yang siap dipamerkan." })).toBeInTheDocument();
    const hero = screen.getByRole("region", { name: "Pengantar AI generatif" });
    expect(within(hero).getByAltText(/visual tekstil generatif/i)).toBeInTheDocument();

    const process = screen.getByRole("region", { name: "Showcase output AI" });
    expect(await within(process).findByAltText(/output AI Motif Satu/i)).toBeInTheDocument();
    expect(await within(process).findByAltText(/output AI Motif Dua/i)).toBeInTheDocument();
    expect(within(process).getByRole("heading", { name: "Setiap gerak mengarahkan mata ke kualitas output." })).toBeInTheDocument();
    expect(process.querySelector("[data-motion='image-from-left']")).toBeInTheDocument();
    expect(process.querySelector("[data-motion='text-from-right']")).toBeInTheDocument();
    expect(process.querySelector("[data-motion='text-from-left']")).toBeInTheDocument();
    expect(process.querySelector("[data-motion='image-from-right']")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Pipeline generative AI" })).toBeInTheDocument();
    expect(within(process).getAllByText("Motif utama")).toHaveLength(2);
    expect(within(process).getByText("Costume preview")).toBeInTheDocument();
    expect(within(process).getByText("Detail generasi")).toBeInTheDocument();
    expect(process.querySelectorAll("[data-motion='generative-stage']")).toHaveLength(3);

    expect(screen.getByRole("heading", { name: "AI membuka variasi visual yang tajam, cepat, dan mudah dibandingkan." })).toBeInTheDocument();
    expect(screen.getByLabelText("Bukti kualitas output AI")).toBeInTheDocument();

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

  it("uses the first gallery page cache before refreshing the homepage showcase", async () => {
    mocks.readPublicBatiksCache.mockReturnValue({
      items: [
        batik(1, "Motif Satu"),
        batik(2, "Motif Dua"),
        batik(3, "Motif Tiga"),
        batik(4, "Motif Empat"),
      ],
      pagination: { page: 1, per_page: 9, total: 4, total_pages: 1 },
    });

    render(<LandingPage />);

    const latest = screen.getByRole("region", { name: "Koleksi AI terbaru" });
    expect(await within(latest).findAllByRole("article")).toHaveLength(3);
    expect(mocks.readPublicBatiksCache).toHaveBeenCalledWith({ page: 1, perPage: 9, query: "" });
    expect(mocks.listPublicBatiks).toHaveBeenCalledWith({ page: 1, perPage: 9, query: "" });
  });
});
