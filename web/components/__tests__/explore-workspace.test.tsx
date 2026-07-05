import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ExploreWorkspace } from "@/components/explore-workspace";
import type { CostumeTemplate, GenerationBatchCreate, WordlistCategory, WordlistItem } from "@/lib/automation-types";

const mocks = vi.hoisted(() => ({
  createGenerationBatch: vi.fn(),
  listCostumeTemplates: vi.fn(),
  listWordlistCategories: vi.fn(),
  listWordlistItems: vi.fn(),
}));

vi.mock("@/lib/automation-api", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/automation-api")>(),
  createGenerationBatch: mocks.createGenerationBatch,
  listCostumeTemplates: mocks.listCostumeTemplates,
  listWordlistCategories: mocks.listWordlistCategories,
  listWordlistItems: mocks.listWordlistItems,
}));

const templates: CostumeTemplate[] = [
  {
    id: 9,
    name: "Kain model studio",
    filename: "studio.webp",
    description: null,
    is_active: true,
    sort_order: 1,
    created_at: "2026-07-05T09:00:00Z",
    updated_at: "2026-07-05T09:00:00Z",
  },
];

const categories: WordlistCategory[] = [
  {
    id: 1,
    code: "warna",
    name: "Warna",
    description: null,
    is_required: true,
    selection_min: 1,
    selection_max: 1,
    sort_order: 1,
    is_active: true,
  },
  {
    id: 2,
    code: "ragam",
    name: "Ragam hias",
    description: null,
    is_required: false,
    selection_min: 0,
    selection_max: 1,
    sort_order: 2,
    is_active: true,
  },
];

const items: WordlistItem[] = [
  {
    id: 11,
    category_id: 1,
    value: "sogan",
    label: "Sogan",
    weight: 1,
    is_active: true,
    metadata_json: null,
  },
  {
    id: 12,
    category_id: 2,
    value: "parang",
    label: "Parang",
    weight: 1,
    is_active: true,
    metadata_json: null,
  },
];

const expectedPayload: GenerationBatchCreate = {
  amount: 1,
  mode: "random",
  combine_enabled: true,
  video_enabled: false,
  costume_template_mode: "random_one",
  costume_template_ids: [],
  random_seed: null,
  allow_duplicate_prompts: false,
  fixed_wordlist_items: {},
  requested_by: "web-admin",
};

describe("ExploreWorkspace", () => {
  beforeEach(() => {
    mocks.createGenerationBatch.mockReset();
    mocks.listCostumeTemplates.mockReset();
    mocks.listWordlistCategories.mockReset();
    mocks.listWordlistItems.mockReset();
    mocks.listCostumeTemplates.mockResolvedValue(templates);
    mocks.listWordlistCategories.mockResolvedValue(categories);
    mocks.listWordlistItems.mockResolvedValue(items);
    mocks.createGenerationBatch.mockResolvedValue({
      batch_id: "batch-001",
      requested_count: 1,
      status: "queued",
      status_url: "/admin/history?batch=batch-001",
    });
  });

  it("guides batch production through four stages and submits the generated payload", async () => {
    const user = userEvent.setup();
    render(<ExploreWorkspace />);

    expect(await screen.findByRole("heading", { name: "Konfigurasi batch" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Konfigurasi batch" })).toHaveAttribute("aria-selected", "true");

    await user.click(screen.getByRole("button", { name: "Lanjut ke prompt" }));
    expect(screen.getByRole("heading", { name: "Aturan prompt" })).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Mode"), "fixed");
    await user.click(screen.getByRole("button", { name: "Lanjut ke media" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Mode fixed membutuhkan pilihan pada seluruh kategori wajib.");
    expect(screen.getByRole("heading", { name: "Aturan prompt" })).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Warna wajib"), "11");
    await user.click(screen.getByRole("button", { name: "Lanjut ke media" }));
    expect(screen.getByRole("heading", { name: "Media output" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Kembali" }));
    expect(screen.getByLabelText("Warna wajib")).toHaveValue("11");

    await user.selectOptions(screen.getByLabelText("Mode"), "random");
    await user.click(screen.getByRole("button", { name: "Lanjut ke media" }));
    await user.click(screen.getByRole("button", { name: "Review batch" }));

    expect(screen.getByRole("heading", { name: "Review payload" })).toBeInTheDocument();
    const review = screen.getByRole("region", { name: "Ringkasan payload" });
    expect(within(review).getByText("Jumlah")).toBeInTheDocument();
    expect(within(review).getByText("1 motif")).toBeInTheDocument();
    expect(within(review).getByText("Mode")).toBeInTheDocument();
    expect(within(review).getByText("random")).toBeInTheDocument();
    expect(within(review).getByText("Template costume")).toBeInTheDocument();
    expect(within(review).getByText("Pilih satu secara acak")).toBeInTheDocument();
    expect(within(review).getByText("Izinkan duplikat")).toBeInTheDocument();
    expect(within(review).getByText("Tidak")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Jalankan batch" }));

    expect(mocks.createGenerationBatch).toHaveBeenCalledWith(expectedPayload);
    expect(await screen.findByText("Batch batch-001 sudah masuk antrean.")).toBeInTheDocument();
  });
});
