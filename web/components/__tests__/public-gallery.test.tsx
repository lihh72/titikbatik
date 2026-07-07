import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GalleryDetailPage } from "@/components/gallery-detail-page";
import { GalleryPage } from "@/components/gallery-page";
import { clearPublicAutomationCache } from "@/lib/automation-api";
import type { Batik, PublicBatikList } from "@/lib/automation-types";

const mocks = vi.hoisted(() => ({
  getPublicBatik: vi.fn(),
  listPublicBatiks: vi.fn(),
}));

vi.mock("@/lib/automation-api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/automation-api")>()),
  getPublicBatik: mocks.getPublicBatik,
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

function batik(id: number, keyword: string, slug = keyword.toLowerCase().replaceAll(" ", "-")): Batik {
  return {
    id,
    slug,
    keyword,
    warna: "indigo",
    style: "modern",
    seed: id,
    positive_prompt: keyword,
    negative_prompt: null,
    file_preview: `${slug}.webp`,
    file_video: null,
    prompt_hash: `hash-${id}`,
    is_published: true,
    created_at: "2026-07-03T00:00:00Z",
    updated_at: "2026-07-03T00:00:00Z",
    preview_url: `http://127.0.0.1:8000/api/v1/images/preview/${slug}.webp`,
    costume_urls: [],
    costume_files: [],
  };
}

function response(items: Batik[], page = 1, totalPages = 1): PublicBatikList {
  return {
    items,
    pagination: {
      page,
      per_page: 9,
      total: items.length,
      total_pages: totalPages,
    },
  };
}

describe("public gallery", () => {
  const kawung = batik(12, "Kawung Indigo", "kawung-indigo");

  beforeEach(() => {
    clearPublicAutomationCache();
    mocks.getPublicBatik.mockReset();
    mocks.listPublicBatiks.mockReset();
    mocks.listPublicBatiks.mockResolvedValue(response([kawung]));
  });

  it("renders returned batiks as light square motif cards with slug detail links", async () => {
    render(<GalleryPage />);

    expect(screen.getByRole("heading", { name: "Galeri hasil generative AI" })).toBeInTheDocument();
    expect(screen.getByLabelText("Cari motif, warna, atau style")).toBeInTheDocument();
    expect(await screen.findByText("Kawung Indigo")).toBeInTheDocument();
    expect(screen.getByAltText("Motif Kawung Indigo")).toHaveAttribute(
      "src",
      expect.stringContaining("kawung-indigo.webp"),
    );
    expect(screen.queryByText("Ceplok Arunika")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Kawung Indigo/i })).toHaveAttribute(
      "href",
      "/gallery/kawung-indigo",
    );
    screen
      .getAllByTestId("motif-frame")
      .forEach((frame) => expect(frame).toHaveClass("aspect-square"));
  });

  it("submits the exact trimmed search query supported by the backend", async () => {
    const user = userEvent.setup();
    mocks.listPublicBatiks
      .mockResolvedValueOnce(response([kawung]))
      .mockResolvedValueOnce(response([batik(13, "Mega Mendung", "mega-mendung")]));

    render(<GalleryPage />);
    expect(await screen.findByText("Kawung Indigo")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Cari motif, warna, atau style"), "  mega mendung  ");
    await user.click(screen.getByRole("button", { name: "Cari" }));

    await waitFor(() => {
      expect(mocks.listPublicBatiks).toHaveBeenLastCalledWith({
        page: 1,
        perPage: 9,
        query: "mega mendung",
      });
    });
    expect(await screen.findByText("Mega Mendung")).toBeInTheDocument();
  });

  it("renders backend errors as an alert", async () => {
    mocks.listPublicBatiks.mockRejectedValueOnce(new Error("Galeri gagal dimuat."));

    render(<GalleryPage />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Galeri gagal dimuat.");
  });

  it("shows gallery skeletons while public results are loading", () => {
    mocks.listPublicBatiks.mockReturnValueOnce(new Promise(() => undefined));

    render(<GalleryPage />);

    expect(screen.getByRole("region", { name: "Memuat koleksi" })).toHaveAttribute("aria-busy", "true");
    expect(screen.getByText("Menata motif dan metadata koleksi.")).toHaveClass("sr-only");
  });

  it("renders a composed empty archive state", async () => {
    mocks.listPublicBatiks.mockResolvedValueOnce(response([]));

    render(<GalleryPage />);

    expect(await screen.findByText("Belum ada batik terpublikasi.")).toBeInTheDocument();
  });

  it("loads the next page through existing pagination", async () => {
    const user = userEvent.setup();
    const parang = batik(14, "Parang Sore", "parang-sore");
    mocks.listPublicBatiks
      .mockResolvedValueOnce(response([kawung], 1, 2))
      .mockResolvedValueOnce(response([parang], 2, 2));

    render(<GalleryPage />);
    expect(await screen.findByText("Kawung Indigo")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Berikutnya" }));

    await waitFor(() => {
      expect(mocks.listPublicBatiks).toHaveBeenLastCalledWith({
        page: 2,
        perPage: 9,
        query: "",
      });
    });
    expect(await screen.findByText("Parang Sore")).toBeInTheDocument();
  });

  it("loads a gallery detail by slug", async () => {
    mocks.getPublicBatik.mockResolvedValue(kawung);

    render(<GalleryDetailPage slug="kawung-indigo" />);

    expect(await screen.findByRole("heading", { name: "Kawung Indigo" })).toBeInTheDocument();
    expect(mocks.getPublicBatik).toHaveBeenCalledWith("kawung-indigo");
  });

  it("shows a detail skeleton while the selected batik is loading", () => {
    mocks.getPublicBatik.mockReturnValueOnce(new Promise(() => undefined));

    render(<GalleryDetailPage slug="kawung-indigo" />);

    expect(screen.getByText("Memuat detail batik.")).toHaveClass("sr-only");
  });
});
