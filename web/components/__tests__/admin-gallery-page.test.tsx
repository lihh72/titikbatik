import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AdminGalleryPage } from "@/components/admin-gallery-page";
import type { Batik } from "@/lib/automation-types";

const mocks = vi.hoisted(() => ({
  deleteBatik: vi.fn(),
  listAdminBatiks: vi.fn(),
  publishBatik: vi.fn(),
  regenerateCostume: vi.fn(),
  regenerateVideo: vi.fn(),
  unpublishBatik: vi.fn(),
  updateBatik: vi.fn(),
}));

vi.mock("@/lib/automation-api", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/automation-api")>(),
  deleteBatik: mocks.deleteBatik,
  listAdminBatiks: mocks.listAdminBatiks,
  publishBatik: mocks.publishBatik,
  regenerateCostume: mocks.regenerateCostume,
  regenerateVideo: mocks.regenerateVideo,
  unpublishBatik: mocks.unpublishBatik,
  updateBatik: mocks.updateBatik,
}));

vi.mock("@/components/batik-media", () => ({
  BatikMedia: ({ batik }: { batik: Batik }) => <div data-testid="batik-media">Media {batik.keyword}</div>,
}));

const batiks: Batik[] = [{
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
  prompt_hash: "hash-one",
  is_published: true,
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
}, {
  id: 13,
  slug: "ceplok-arunika",
  keyword: "Ceplok Arunika",
  warna: "soga",
  style: "klasik",
  seed: 45,
  positive_prompt: "ceplok batik",
  negative_prompt: null,
  file_preview: "ceplok.webp",
  file_video: null,
  prompt_hash: "hash-two",
  is_published: false,
  created_at: "2026-07-04T00:00:00Z",
  updated_at: "2026-07-04T00:00:00Z",
  preview_url: "http://127.0.0.1:8000/api/v1/images/preview/ceplok.webp",
  costume_urls: [],
  costume_files: [],
}];

describe("AdminGalleryPage", () => {
  beforeEach(() => {
    mocks.listAdminBatiks.mockResolvedValue(batiks);
  });

  it("renders a curated admin gallery with summary metrics and clean metadata", async () => {
    render(<AdminGalleryPage />);

    expect(await screen.findByRole("heading", { name: "Kurasi visual dan publikasi" })).toBeInTheDocument();
    expect(screen.getByText("2 hasil")).toBeInTheDocument();
    expect(screen.getByText("1 publik")).toBeInTheDocument();
    expect(screen.getByText("1 draft")).toBeInTheDocument();
    expect(screen.getByText("2 media")).toBeInTheDocument();

    const selectedItem = screen.getByRole("button", { name: /Kawung Indigo/i });
    expect(selectedItem).toHaveAttribute("aria-pressed", "true");
    expect(within(selectedItem).getByText("modern / indigo")).toBeInTheDocument();
    expect(within(selectedItem).queryByText(/Â/)).not.toBeInTheDocument();

    expect(screen.getByTestId("batik-media")).toHaveTextContent("Media Kawung Indigo");
    expect(screen.getByRole("button", { name: "Tampilkan sebagai draft" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Buat ulang kostum" })).toBeInTheDocument();
  });
});
