import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AdminGalleryPage } from "@/components/admin-gallery-page";
import { CostumeTemplateAdmin } from "@/components/costume-template-admin";
import { HistoryPage } from "@/components/history-page";
import { SettingsAdmin } from "@/components/settings-admin";
import { WordlistAdmin } from "@/components/wordlist-admin";
import type { Batik, CostumeTemplate, GenerationBatch, GenerationJob, WordlistCategory, WordlistItem } from "@/lib/automation-types";

const mocks = vi.hoisted(() => ({
  cancelBatch: vi.fn(),
  createWordlistCategory: vi.fn(),
  createWordlistItem: vi.fn(),
  deleteBatik: vi.fn(),
  deleteCostumeTemplate: vi.fn(),
  deleteWordlistCategory: vi.fn(),
  deleteWordlistItem: vi.fn(),
  getBatch: vi.fn(),
  importWordlistItems: vi.fn(),
  listAdminBatiks: vi.fn(),
  listBatchJobs: vi.fn(),
  listBatches: vi.fn(),
  listCostumeTemplates: vi.fn(),
  listSettings: vi.fn(),
  listWordlistCategories: vi.fn(),
  listWordlistItems: vi.fn(),
  publishBatik: vi.fn(),
  putSetting: vi.fn(),
  regenerateCostume: vi.fn(),
  regenerateVideo: vi.fn(),
  retryFailedBatch: vi.fn(),
  unpublishBatik: vi.fn(),
  updateBatik: vi.fn(),
  updateCostumeTemplate: vi.fn(),
  updateWordlistCategory: vi.fn(),
  updateWordlistItem: vi.fn(),
  uploadCostumeTemplate: vi.fn(),
}));

vi.mock("@/lib/automation-api", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/automation-api")>(),
  ...mocks,
}));

vi.mock("@/components/batik-media", () => ({
  BatikMedia: ({ batik }: { batik: Batik }) => <div data-testid="batik-media">Media {batik.keyword}</div>,
}));

const batch: GenerationBatch = {
  id: "batch-001",
  requested_count: 2,
  generate_count: 2,
  combine_enabled: true,
  video_enabled: false,
  costume_template_mode: "random_one",
  status: "running",
  queued_count: 1,
  running_count: 1,
  completed_count: 0,
  failed_count: 1,
  cancelled_count: 0,
  requested_by: "web-admin",
  settings_json: {},
  created_at: "2026-07-05T09:00:00Z",
  started_at: null,
  completed_at: null,
  progress_percent: 35,
};

const job: GenerationJob = {
  id: "job-001",
  batch_id: "batch-001",
  sequence_number: 1,
  job_type: "generate",
  status: "failed",
  attempt_count: 2,
  max_attempts: 3,
  positive_prompt: null,
  negative_prompt: null,
  prompt_hash: null,
  seed: 7,
  workflow_name: "motif",
  comfyui_prompt_id: "comfy-001",
  source_batik_id: null,
  costume_template_id: null,
  source_costume_file_id: null,
  input_preview_filename: null,
  output_filename: "motif.webp",
  error_message: "ComfyUI timeout",
  available_at: "2026-07-05T09:00:00Z",
  started_at: null,
  completed_at: null,
  created_at: "2026-07-05T09:00:00Z",
  updated_at: "2026-07-05T09:00:00Z",
  settings_json: null,
};

const batik: Batik = {
  id: 12,
  slug: "kawung-indigo",
  keyword: "Kawung Indigo",
  warna: "indigo",
  style: "modern",
  seed: 44,
  positive_prompt: "kawung",
  negative_prompt: null,
  file_preview: "preview.webp",
  file_video: null,
  prompt_hash: "hash-one",
  is_published: false,
  created_at: "2026-07-03T00:00:00Z",
  updated_at: "2026-07-03T00:00:00Z",
  preview_url: "/preview.webp",
  costume_urls: [],
  costume_files: [],
};

const category: WordlistCategory = {
  id: 1,
  code: "warna",
  name: "Warna",
  description: null,
  is_required: true,
  selection_min: 1,
  selection_max: 1,
  sort_order: 1,
  is_active: true,
};

const wordItem: WordlistItem = {
  id: 11,
  category_id: 1,
  value: "sogan",
  label: "Sogan",
  weight: 1,
  is_active: true,
  metadata_json: null,
};

const template: CostumeTemplate = {
  id: 9,
  name: "Model studio",
  filename: "model.webp",
  description: "Kemeja polos",
  is_active: true,
  sort_order: 1,
  created_at: "2026-07-05T09:00:00Z",
  updated_at: "2026-07-05T09:00:00Z",
};

beforeEach(() => {
  for (const mock of Object.values(mocks)) mock.mockReset();
  mocks.listBatches.mockResolvedValue([batch]);
  mocks.getBatch.mockResolvedValue(batch);
  mocks.listBatchJobs.mockResolvedValue([job]);
  mocks.cancelBatch.mockResolvedValue(batch);
  mocks.retryFailedBatch.mockResolvedValue(batch);
  mocks.listAdminBatiks.mockResolvedValue([batik]);
  mocks.publishBatik.mockResolvedValue({});
  mocks.unpublishBatik.mockResolvedValue({});
  mocks.deleteBatik.mockResolvedValue({});
  mocks.regenerateCostume.mockResolvedValue({ queued_count: 1 });
  mocks.regenerateVideo.mockResolvedValue({ queued_count: 1, job_id: "job-video" });
  mocks.updateBatik.mockResolvedValue(batik);
  mocks.listWordlistCategories.mockResolvedValue([category]);
  mocks.listWordlistItems.mockResolvedValue([wordItem]);
  mocks.createWordlistCategory.mockResolvedValue(category);
  mocks.createWordlistItem.mockResolvedValue(wordItem);
  mocks.importWordlistItems.mockResolvedValue({ count: 2 });
  mocks.updateWordlistCategory.mockResolvedValue(category);
  mocks.updateWordlistItem.mockResolvedValue(wordItem);
  mocks.deleteWordlistCategory.mockResolvedValue({});
  mocks.deleteWordlistItem.mockResolvedValue({});
  mocks.listCostumeTemplates.mockResolvedValue([template]);
  mocks.uploadCostumeTemplate.mockResolvedValue(template);
  mocks.updateCostumeTemplate.mockResolvedValue(template);
  mocks.deleteCostumeTemplate.mockResolvedValue({});
  mocks.listSettings.mockResolvedValue({ generation: { enabled: true } });
  mocks.putSetting.mockResolvedValue({ key: "generation", value: { enabled: false } });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("admin resource workflows", () => {
  it("keeps history batch detail actions and visible job state", async () => {
    const user = userEvent.setup();
    render(<HistoryPage />);

    expect(await screen.findByRole("heading", { name: "Batch dan job" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /batch-001/i })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("ComfyUI timeout")).toBeInTheDocument();
    expect(screen.getByText("failed")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Batalkan batch" }));
    await user.click(screen.getByRole("button", { name: "Retry gagal" }));

    expect(mocks.cancelBatch).toHaveBeenCalledWith("batch-001");
    expect(mocks.retryFailedBatch).toHaveBeenCalledWith("batch-001");
  });

  it("keeps admin gallery curation actions and square preview tiles", async () => {
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<AdminGalleryPage />);

    expect(await screen.findByRole("heading", { name: "Kurasi koleksi batik" })).toBeInTheDocument();
    expect(screen.getByTestId("admin-gallery-tile-12")).toHaveClass("admin-square-preview");

    await user.click(screen.getByRole("button", { name: "Publikasikan" }));
    await user.click(screen.getByRole("button", { name: "Buat ulang kostum" }));
    await user.click(screen.getByRole("button", { name: "Buat ulang video" }));
    await user.click(screen.getByRole("button", { name: "Hapus hasil" }));

    expect(mocks.publishBatik).toHaveBeenCalledWith(12);
    expect(mocks.regenerateCostume).toHaveBeenCalledWith(12);
    expect(mocks.regenerateVideo).toHaveBeenCalledWith(12);
    expect(confirm).toHaveBeenCalled();
    expect(mocks.deleteBatik).toHaveBeenCalledWith(12);
  });

  it("keeps wordlist create, import, toggle, and delete actions", async () => {
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<WordlistAdmin />);

    expect(await screen.findByRole("heading", { name: "Sumber Wordlist" })).toBeInTheDocument();
    await user.type(screen.getByLabelText("Value item"), "mega");
    await user.type(screen.getByLabelText("Label item"), "Mega");
    await user.click(screen.getByRole("button", { name: "Tambah item" }));
    await user.type(screen.getByLabelText("Import per baris"), "kawung\nparang");
    await user.click(screen.getByRole("button", { name: "Import item" }));
    await user.click(screen.getByRole("button", { name: "Nonaktifkan kategori" }));
    await user.click(within(screen.getByRole("row", { name: /sogan/i })).getByRole("button", { name: "Nonaktifkan item" }));
    await user.click(within(screen.getByRole("row", { name: /sogan/i })).getByRole("button", { name: "Hapus item" }));
    await user.click(screen.getByRole("button", { name: "Hapus kategori" }));

    await waitFor(() => expect(mocks.createWordlistItem).toHaveBeenCalled());
    expect(mocks.importWordlistItems).toHaveBeenCalledWith({ category_code: "warna", items: ["kawung", "parang"], replace: false });
    expect(mocks.updateWordlistCategory).toHaveBeenCalledWith(1, { is_active: false });
    expect(mocks.updateWordlistItem).toHaveBeenCalledWith(11, { is_active: false });
    expect(mocks.deleteWordlistItem).toHaveBeenCalledWith(11);
    expect(mocks.deleteWordlistCategory).toHaveBeenCalledWith(1);
    expect(confirm).toHaveBeenCalled();
  });

  it("keeps template 3:4 previews and upload update delete behavior", async () => {
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<CostumeTemplateAdmin />);

    expect(await screen.findByRole("heading", { name: "Template Costume" })).toBeInTheDocument();
    expect(screen.getByTestId("template-preview-9")).toHaveClass("admin-portrait-preview");

    await user.upload(screen.getByLabelText("File template"), new File(["image"], "model.png", { type: "image/png" }));
    await user.type(screen.getByLabelText("Nama template"), "Model baru");
    await user.click(screen.getByRole("button", { name: "Upload template" }));
    await user.click(screen.getByRole("button", { name: "Nonaktifkan template" }));
    await user.click(screen.getByRole("button", { name: "Hapus template" }));

    await waitFor(() => expect(mocks.uploadCostumeTemplate).toHaveBeenCalled());
    expect(mocks.updateCostumeTemplate).toHaveBeenCalledWith(9, { is_active: false });
    expect(confirm).toHaveBeenCalled();
    expect(mocks.deleteCostumeTemplate).toHaveBeenCalledWith(9);
  });

  it("rejects non-object settings JSON and saves valid JSON objects", async () => {
    const user = userEvent.setup();
    render(<SettingsAdmin />);

    expect(await screen.findByRole("heading", { name: "Pengaturan Sistem" })).toBeInTheDocument();
    const editor = screen.getByLabelText("JSON settings");
    await user.clear(editor);
    fireEvent.change(editor, { target: { value: "[1,2]" } });
    await user.click(screen.getByRole("button", { name: "Simpan settings" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Settings harus berupa object JSON.");

    await user.clear(editor);
    fireEvent.change(editor, { target: { value: '{"enabled":false}' } });
    await user.click(screen.getByRole("button", { name: "Simpan settings" }));
    expect(mocks.putSetting).toHaveBeenCalledWith("generation", { enabled: false });
  });
});
