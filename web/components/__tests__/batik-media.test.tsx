import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BatikMedia } from "@/components/batik-media";
import type { Batik } from "@/lib/automation-types";

const batik: Batik = {
  id: 12,
  slug: "kawung",
  keyword: "kawung",
  warna: "indigo",
  style: "modern",
  seed: 44,
  positive_prompt: "kawung batik",
  negative_prompt: "blur",
  file_preview: "preview.webp",
  file_video: null,
  prompt_hash: "hash",
  is_published: false,
  created_at: "2026-07-03T00:00:00Z",
  updated_at: "2026-07-03T00:00:00Z",
  preview_url: "http://127.0.0.1:8000/api/v1/images/preview/preview.webp",
  costume_urls: ["http://127.0.0.1:8000/api/v1/images/costume/costume.webp"],
  costume_files: [{
    id: 8,
    filename: "costume.webp",
    file_video: "costume.mp4",
    video_url: "http://127.0.0.1:8000/api/v1/images/video/costume.mp4",
    template_id: 3,
    template: { id: 3, name: "Model", filename: "model.webp" },
    sort_order: 0,
    created_at: "2026-07-03T00:00:00Z",
  }],
};

describe("BatikMedia", () => {
  it("renders actual preview, costume, and silent video URLs", () => {
    const { container } = render(<BatikMedia batik={batik} />);

    expect(screen.getByAltText("Preview kawung")).toHaveAttribute("src", batik.preview_url);
    expect(screen.getByAltText("Costume Model")).toHaveAttribute("src", batik.costume_urls[0]);
    expect(container.querySelector("video")).toHaveAttribute("src", batik.costume_files[0].video_url);
    expect(container.querySelector("video")).toHaveProperty("muted", true);
  });
});
