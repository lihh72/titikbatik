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

    expect(screen.getByRole("heading", { name: "Motif lama. Bahasa baru." })).toBeInTheDocument();

    const process = screen.getByRole("region", { name: "Proses batik" });
    expect(within(process).getByAltText(/perajin.*canting/i)).toBeInTheDocument();
    expect(within(process).getByAltText(/^malam batik dipanaskan.*canting/i)).toBeInTheDocument();
    expect(within(process).getByText("Visual konseptual AI")).toBeInTheDocument();

    expect(screen.getByRole("heading", { name: /etika visual/i })).toBeInTheDocument();

    const latest = screen.getByRole("region", { name: "Koleksi terbaru" });
    expect(await within(latest).findAllByRole("link", { name: /Motif (Satu|Dua|Tiga)/i })).toHaveLength(3);
  });
});
