import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

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
  it("uses accessible thumbnails to switch the main image and silent video", () => {
    const { container } = render(<BatikMedia batik={batik} />);
    expect(screen.getByRole("region", { name: "Media batik kawung" })).toBeInTheDocument();

    const thumbnails = screen.getAllByRole("button", { name: /Tampilkan/i });

    expect(thumbnails).toHaveLength(3);
    thumbnails.forEach((thumbnail) => {
      expect(thumbnail).toHaveClass("aspect-[4/5]");
      expect(thumbnail).toHaveClass("w-20");
    });
    expect(thumbnails[0]).toHaveAttribute("aria-pressed", "true");
    expect(thumbnails[0]).toHaveAttribute("data-selected", "true");
    expect(screen.getByTestId("main-image")).toHaveAttribute("src", batik.preview_url);

    fireEvent.click(screen.getByRole("button", { name: "Tampilkan Costume Model" }));
    expect(screen.getByTestId("main-image")).toHaveAttribute("src", batik.costume_urls[0]);
    expect(screen.getByRole("button", { name: "Tampilkan Costume Model" })).toHaveAttribute("data-selected", "true");

    fireEvent.click(screen.getByRole("button", { name: "Tampilkan Video Model" }));
    const video = container.querySelector("[data-testid='main-video']");
    expect(video).toHaveAttribute("src", batik.costume_files[0].video_url);
    expect(video).not.toHaveAttribute("autoplay");
    expect(video).toHaveProperty("muted", true);
  });

  it("omits missing media and renders a clear status empty state", () => {
    const emptyBatik: Batik = {
      ...batik,
      preview_url: null,
      costume_urls: [],
      costume_files: batik.costume_files.map((costume) => ({ ...costume, video_url: null })),
    };

    render(<BatikMedia batik={emptyBatik} />);

    expect(screen.queryAllByRole("button", { name: /Tampilkan/i })).toHaveLength(0);
    expect(screen.getByRole("status")).toHaveTextContent("Media belum tersedia");
  });

  it("shows thumbnail overflow controls only when the strip actually overflows", async () => {
    const scrollSpy = vi.fn();
    let calls = 0;
    vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockImplementation(() => 520);
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockImplementation(() => {
      calls += 1;
      return calls === 1 ? 520 : 180;
    });
    Object.defineProperty(HTMLElement.prototype, "scrollBy", {
      configurable: true,
      value: scrollSpy,
    });

    const { rerender } = render(<BatikMedia batik={batik} />);

    expect(screen.queryByRole("button", { name: "Thumbnail berikutnya" })).not.toBeInTheDocument();

    rerender(<BatikMedia batik={{ ...batik, id: 13 }} />);
    fireEvent(window, new Event("resize"));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Thumbnail berikutnya" })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Thumbnail berikutnya" }));
    expect(scrollSpy).toHaveBeenCalledWith({ left: 240, behavior: "smooth" });
  });
});
