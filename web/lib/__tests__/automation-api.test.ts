import { afterEach, describe, expect, it, vi } from "vitest";

import { createGenerationBatch, listBatches, listPublicBatiks, uploadCostumeTemplate } from "@/lib/automation-api";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("automation API client", () => {
  it("builds list query parameters and unwraps data", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, message: "ok", data: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await listBatches({ limit: 20, offset: 40 });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/automation/admin/generation-batches?limit=20&offset=40",
      expect.objectContaining({ cache: "no-store" }),
    );
  });

  it("submits generation as JSON", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ success: true, message: "queued", data: { batch_id: "batch-1", requested_count: 1, status: "queued", status_url: "/batch-1" } }),
        { status: 202, headers: { "Content-Type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    const request = {
      amount: 1,
      mode: "random" as const,
      combine_enabled: false,
      video_enabled: false,
      costume_template_mode: "none" as const,
      costume_template_ids: [],
      allow_duplicate_prompts: false,
    };

    await createGenerationBatch(request);
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];

    expect(init.method).toBe("POST");
    expect(new Headers(init.headers).get("Content-Type")).toBe("application/json");
    expect(JSON.parse(init.body as string)).toEqual(request);
  });

  it("keeps multipart content type under browser control", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, message: "uploaded", data: { id: 1 } }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const form = new FormData();
    form.set("name", "Model");

    await uploadCostumeTemplate(form);
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];

    expect(init.body).toBe(form);
    expect(new Headers(init.headers).has("Content-Type")).toBe(false);
  });

  it("throws the backend error message", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ success: false, message: "At least one active costume template is required", errors: {} }), {
          status: 409,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    await expect(listBatches()).rejects.toThrow("At least one active costume template is required");
  });

  it("maps relative backend media paths to the Next.js image proxy", async () => {
    const batik = {
      id: 1, keyword: "kawung", warna: "biru", style: "modern", seed: 4,
      positive_prompt: null, negative_prompt: null, file_preview: "preview.webp", file_video: null,
      prompt_hash: "hash", is_published: true, created_at: "2026-07-03T00:00:00Z", updated_at: "2026-07-03T00:00:00Z",
      preview_url: "/api/image/preview.webp", costume_urls: ["/api/image/costume.webp"],
      costume_files: [{ id: 2, filename: "costume.webp", file_video: "video.mp4", video_url: "/api/image/video.mp4", template_id: null, template: null, sort_order: 0, created_at: "2026-07-03T00:00:00Z" }],
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, message: "ok", data: { items: [batik], pagination: { page: 1, per_page: 32, total: 1, total_pages: 1 } } }), { status: 200, headers: { "Content-Type": "application/json" } })));

    const result = await listPublicBatiks();

    expect(result.items[0].preview_url).toBe("/api/automation/public/images/preview/preview.webp");
    expect(result.items[0].costume_urls[0]).toBe("/api/automation/public/images/costume/costume.webp");
    expect(result.items[0].costume_files[0].video_url).toBe("/api/automation/public/images/video/video.mp4");
  });
});
