import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GalleryPage } from "@/components/gallery-page";

const mocks = vi.hoisted(() => ({ listPublicBatiks: vi.fn() }));
vi.mock("@/lib/automation-api", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/automation-api")>(),
  listPublicBatiks: mocks.listPublicBatiks,
}));
vi.mock("@/components/app-provider", () => ({
  useApp: () => ({
    history: [],
    publishedIds: [],
    likedIds: [],
    bookmarkedIds: [],
    toggleLike: vi.fn(),
    toggleBookmark: vi.fn(),
  }),
}));

describe("public gallery", () => {
  beforeEach(() => {
    mocks.listPublicBatiks.mockResolvedValue({
      items: [{
        id: 12,
        keyword: "Kawung Indigo",
        warna: "indigo",
        style: "modern",
        seed: 4,
        positive_prompt: "kawung",
        negative_prompt: null,
        file_preview: "kawung.webp",
        file_video: null,
        prompt_hash: "hash",
        is_published: true,
        created_at: "2026-07-03T00:00:00Z",
        updated_at: "2026-07-03T00:00:00Z",
        preview_url: "http://127.0.0.1:8000/api/v1/images/preview/kawung.webp",
        costume_urls: [],
        costume_files: [],
      }],
      pagination: { page: 1, per_page: 32, total: 1, total_pages: 1 },
    });
  });

  it("renders only batiks returned by the public API", async () => {
    render(<GalleryPage />);

    expect(await screen.findByText("Kawung Indigo")).toBeInTheDocument();
    expect(screen.getByAltText("Kawung Indigo")).toHaveAttribute("src", expect.stringContaining("kawung.webp"));
    expect(screen.queryByText("Ceplok Arunika")).not.toBeInTheDocument();
  });
});
