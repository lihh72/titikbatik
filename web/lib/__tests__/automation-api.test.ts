import { afterEach, describe, expect, it, vi } from "vitest";

import { createGenerationBatch, listBatches, uploadCostumeTemplate } from "@/lib/automation-api";

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
});
