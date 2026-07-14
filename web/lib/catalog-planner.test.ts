import { describe, expect, it, vi } from "vitest";

import { planCatalogSearch } from "./catalog-planner";

describe("catalog planner", () => {
  it("asks the model for backend-ready queries instead of expanding local aliases", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      choices: [{ message: { content: JSON.stringify({
        catalog: true,
        intent: "recommend",
        queries: ["peacock", "blue", "red"],
        needsImage: true,
        needsCostume: false,
        statisticsScope: "none",
      }) } }],
    }), { status: 200 }));

    const plan = await planCatalogSearch({
      apiKey: "test-key",
      baseUrl: "https://api.meta.ai/v1",
      model: "muse-spark-1.1",
      message: "Saya ingin batik warna-warni dengan burung",
      fetchFn: fetchMock,
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string) as { max_tokens: number; stream: boolean; messages: Array<{ content: string }> };

    expect(plan).toEqual({
      catalog: true,
      intent: "recommend",
      queries: ["peacock", "blue", "red"],
      needsImage: true,
      needsCostume: false,
      resolved: true,
      statisticsScope: "none",
    });
    expect(body.max_tokens).toBe(512);
    expect(body.stream).toBe(false);
    expect(body.messages[0].content).toContain("JSON saja");
    expect(body.messages[0].content).toContain("pertanyaan statistik");
    expect(body.messages[0].content).toContain("query pertama");
  });

  it("returns a safe no-catalog plan when model output is malformed", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      choices: [{ message: { content: "bukan JSON" } }],
    }), { status: 200 }));

    await expect(planCatalogSearch({
      apiKey: "test-key",
      baseUrl: "https://api.meta.ai/v1",
      model: "muse-spark-1.1",
      message: "Saya suka motif burung",
      fetchFn: fetchMock,
    })).resolves.toEqual({
      catalog: false,
      intent: "none",
      queries: [],
      needsImage: false,
      needsCostume: false,
      resolved: false,
      statisticsScope: "none",
    });
  });

  it("marks a valid no-filter plan as resolved", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      choices: [{ message: { content: JSON.stringify({
        catalog: false,
        intent: "none",
        queries: [],
        needsImage: false,
        needsCostume: false,
        statisticsScope: "global",
      }) } }],
    }), { status: 200 }));

    await expect(planCatalogSearch({
      apiKey: "test-key",
      baseUrl: "https://api.meta.ai/v1",
      model: "muse-spark-1.1",
      message: "Tanggal generasi terbaru kapan?",
      fetchFn: fetchMock,
    })).resolves.toMatchObject({ catalog: false, resolved: true, statisticsScope: "global" });
  });

  it("marks an internally inconsistent plan as unresolved", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      choices: [{ message: { content: JSON.stringify({
        catalog: true,
        intent: "none",
        queries: [],
        needsImage: false,
        needsCostume: false,
        statisticsScope: "filtered",
      }) } }],
    }), { status: 200 }));

    await expect(planCatalogSearch({
      apiKey: "test-key",
      baseUrl: "https://api.meta.ai/v1",
      model: "muse-spark-1.1",
      message: "How many blue batiks?",
      fetchFn: fetchMock,
    })).resolves.toMatchObject({ catalog: false, resolved: false });
  });
});
