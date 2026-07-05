import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MotifCard } from "@/components/motif-card";
import type { Batik } from "@/lib/automation-types";

vi.mock("@/components/app-provider", () => ({
  useApp: () => ({
    likedIds: [],
    bookmarkedIds: [],
    toggleLike: vi.fn(),
    toggleBookmark: vi.fn(),
  }),
}));

const batik: Batik = {
  id: 12,
  slug: "kawung-indigo",
  keyword: "Kawung Indigo",
  warna: "indigo",
  style: "modern",
  seed: 44,
  positive_prompt: "kawung batik",
  negative_prompt: "blur",
  file_preview: "preview.webp",
  file_video: null,
  prompt_hash: "hash",
  is_published: true,
  created_at: "2026-07-03T00:00:00Z",
  updated_at: "2026-07-03T00:00:00Z",
  preview_url: "http://127.0.0.1:8000/api/v1/images/preview/preview.webp",
  costume_urls: ["http://127.0.0.1:8000/api/v1/images/costume/costume.webp"],
  costume_files: [{
    id: 8,
    filename: "costume.webp",
    file_video: null,
    video_url: null,
    template_id: 3,
    template: { id: 3, name: "Model", filename: "model.webp" },
    sort_order: 0,
    created_at: "2026-07-03T00:00:00Z",
  }],
};

describe("MotifCard", () => {
  it("keeps gallery media square and swaps from motif to costume only on hover", () => {
    const { container } = render(<MotifCard batik={batik} />);
    const primaryLink = screen.getByRole("link", { name: /Kawung Indigo/i });

    expect(container.querySelector(".motif-card-media")).toHaveAttribute("data-ratio", "1:1");
    expect(screen.getByAltText("Motif Kawung Indigo")).toHaveAttribute("src", expect.stringContaining("preview.webp"));

    fireEvent.mouseEnter(primaryLink);

    expect(screen.getByAltText("Kostum Kawung Indigo")).toHaveAttribute("src", expect.stringContaining("costume.webp"));

    fireEvent.mouseLeave(primaryLink);

    expect(screen.getByAltText("Motif Kawung Indigo")).toHaveAttribute("src", expect.stringContaining("preview.webp"));
  });

  it("shows the costume preview while the card link has keyboard focus", () => {
    render(<MotifCard batik={batik} />);
    const primaryLink = screen.getByRole("link", { name: /Kawung Indigo/i });

    fireEvent.focus(primaryLink);

    expect(screen.getByAltText("Kostum Kawung Indigo")).toHaveAttribute("src", expect.stringContaining("costume.webp"));

    fireEvent.blur(primaryLink);

    expect(screen.getByAltText("Motif Kawung Indigo")).toHaveAttribute("src", expect.stringContaining("preview.webp"));
  });
});
