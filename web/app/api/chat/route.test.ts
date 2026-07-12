// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const plannerMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/catalog-planner", () => ({
  planCatalogSearch: plannerMock,
}));

import { POST } from "./route";

function chatRequest(body: unknown) {
  return new Request("http://localhost/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const publicBatikList = {
  success: true,
  message: "ok",
  data: {
    items: [
      {
        id: 9,
        slug: "batik-pattern-kawung-circle",
        keyword: "batik pattern, kawung circle, scattered botanical arrangement",
        warna: "soft peach and dove grey",
        style: "modern geometric batik",
        seed: 828584272167847,
        positive_prompt: "batik pattern, kawung circle, scattered botanical arrangement",
        negative_prompt: null,
        file_preview: "kawung.webp",
        file_video: null,
        prompt_hash: "hash-9",
        is_published: true,
        created_at: "2026-07-07T00:00:00Z",
        updated_at: "2026-07-07T00:00:00Z",
        preview_url: "/api/image/kawung.webp",
        costume_urls: ["/api/automation/public/images/costume/kawung-costume.webp"],
        costume_files: [{ filename: "kawung-costume.webp" }],
      },
    ],
    pagination: { page: 1, per_page: 50, total: 1, total_pages: 1 },
  },
};

function providerStream(...chunks: string[]) {
  return new Response(
    new ReadableStream({
      start(controller) {
        for (const chunk of chunks) {
          controller.enqueue(new TextEncoder().encode(`data: ${chunk}\n\n`));
        }
        controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
        controller.close();
      },
    }),
    { status: 200, headers: { "Content-Type": "text/event-stream" } },
  );
}

describe("chat API route", () => {
  beforeEach(() => {
    process.env.INTERNAL_API_URL = "http://127.0.0.1:8000";
    process.env.MODEL_API_KEY = "server-only-model-key";
    process.env.MODEL_API_BASE_URL = "https://api.meta.ai/v1";
    process.env.MODEL_API_MODEL = "muse-spark-1.1";
    plannerMock.mockImplementation(({ message }: { message: string }) => {
      const query = message.toLowerCase();
      if (query.includes("kawung")) return Promise.resolve({ catalog: true, intent: "detail", queries: ["kawung"], needsImage: false, needsCostume: false });
      if (query.includes("tradisional")) return Promise.resolve({ catalog: true, intent: "recommend", queries: ["traditional", "wax resist"], needsImage: true, needsCostume: false });
      if (query.includes("kupu-kupu")) return Promise.resolve({ catalog: true, intent: "search", queries: ["butterfly", "bird"], needsImage: true, needsCostume: false });
      if (query.includes("tropis")) return Promise.resolve({ catalog: true, intent: "search", queries: ["tropical", "leaf"], needsImage: true, needsCostume: false });
      if (query.includes("lotus")) return Promise.resolve({ catalog: true, intent: "recommend", queries: ["lotus", "padma"], needsImage: true, needsCostume: false });
      if (query.includes("dark navy")) return Promise.resolve({ catalog: true, intent: "search", queries: ["dark navy", "navy"], needsImage: true, needsCostume: false });
      if (query.includes("style")) return Promise.resolve({ catalog: true, intent: "search", queries: ["traditional wax resist", "batik"], needsImage: true, needsCostume: false });
      return Promise.resolve({ catalog: false, intent: "none", queries: [], needsImage: false, needsCostume: false });
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
    delete process.env.MODEL_API_KEY;
    delete process.env.MODEL_API_BASE_URL;
    delete process.env.MODEL_API_MODEL;
  });

  it("executes backend searches from the planner queries instead of local aliases", async () => {
    plannerMock.mockResolvedValue({
      catalog: true,
      intent: "recommend",
      queries: ["peacock", "blue"],
      needsImage: true,
      needsCostume: false,
    });
    const peacock = { ...publicBatikList.data.items[0], id: 4, slug: "peacock-feather", keyword: "peacock feather", file_preview: "peacock.webp" };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ ...publicBatikList, data: { ...publicBatikList.data, items: [peacock] } }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ...publicBatikList, data: { ...publicBatikList.data, items: [peacock] } }), { status: 200 }))
      .mockResolvedValueOnce(providerStream(JSON.stringify({ choices: [{ delta: { content: "Pilihan terverifikasi." } }] })));
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(chatRequest({ messages: [{ role: "user", content: "Saya ingin batik warna-warni dengan burung" }] }));
    const payload = await response.text();

    expect(plannerMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0][0]).toBe("http://127.0.0.1:8000/api/v1/batiks/search?q=peacock&per_page=9");
    expect(fetchMock.mock.calls[1][0]).toBe("http://127.0.0.1:8000/api/v1/batiks/search?q=blue&per_page=9");
    expect(payload).toContain('"id":"4"');
  });

  it("rejects chat requests when the model key is missing", async () => {
    delete process.env.MODEL_API_KEY;
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(chatRequest({ messages: [{ role: "user", content: "Halo" }] }));
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.error).toBe("MODEL_API_KEY belum dikonfigurasi pada server web.");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("streams Meta tokens while retaining TitikBatik and matching batik context", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(publicBatikList), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        providerStream(
          JSON.stringify({ choices: [{ delta: { content: "Batik #9 memakai " } }] }),
          JSON.stringify({ choices: [{ delta: { content: "kawung dengan palet peach lembut." } }] }),
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(
      chatRequest({
        messages: [
          { role: "user", content: "Tolong jelaskan Batik #9" },
        ],
      }),
    );
    const payload = await response.text();
    const [, init] = fetchMock.mock.calls[1] as [string, RequestInit];
    const requestBody = JSON.parse(init.body as string) as { model: string; messages: Array<{ role: string; content: string }> };
    const contextMessage = requestBody.messages.find((message) => message.role === "system")?.content ?? "";

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("text/event-stream");
    expect(payload).toContain('event: token');
    expect(payload).toContain('"content":"Batik #9 memakai "');
    expect(payload).toContain('"content":"kawung dengan palet peach lembut."');
    expect(payload).toContain('"previewUrl":"/api/automation/public/images/preview/kawung.webp"');
    expect(payload).toContain("event: done");
    expect(fetchMock.mock.calls[0][0]).toBe("http://127.0.0.1:8000/api/v1/batiks?per_page=100");
    expect(fetchMock.mock.calls[1][0]).toBe("https://api.meta.ai/v1/chat/completions");
    expect(new Headers(init.headers).get("Authorization")).toBe("Bearer server-only-model-key");
    expect(requestBody.model).toBe("muse-spark-1.1");
    expect(requestBody).toMatchObject({ stream: true });
    expect(requestBody).toMatchObject({ max_tokens: 800, reasoning_effort: "minimal" });
    expect(contextMessage).toContain("TitikBatik AI");
    expect(contextMessage).toContain("Batik #9");
    expect(contextMessage).toContain("modern geometric batik");
    expect(contextMessage).toContain("http://localhost/gallery/batik-pattern-kawung-circle");
    expect(payload).not.toContain("server-only-model-key");
  });

  it("searches public batik data when the user asks by motif name", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(publicBatikList), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        providerStream(
          JSON.stringify({ choices: [{ delta: { content: "Motif kawung ini cocok untuk preview halus." } }] }),
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(
      chatRequest({
        messages: [
          { role: "user", content: "Jelaskan motif kawung circle" },
        ],
      }),
    );
    const payload = await response.text();

    expect(response.status).toBe(200);
    expect(payload).toContain("Motif kawung ini cocok untuk preview halus.");
    expect(fetchMock.mock.calls[0][0]).toBe("http://127.0.0.1:8000/api/v1/batiks/search?q=kawung&per_page=9");
  });

  it("emits a public motif card when the user asks to download Batik #9", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(publicBatikList), { status: 200 }))
      .mockResolvedValueOnce(providerStream(
        JSON.stringify({ choices: [{ delta: { content: "Silakan unduh motifnya." } }] }),
      ));
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(chatRequest({
      messages: [{ role: "user", content: "Kirim gambar untuk download motif Batik #9" }],
    }));
    const payload = await response.text();

    expect(payload).toContain("event: batik");
    expect(payload).toContain('"id":"9"');
    expect(payload).toContain('"previewUrl":"/api/automation/public/images/preview/kawung.webp"');
  });

  it("keeps the most recent batik reference for a follow-up request to see its image", async () => {
    const batikFour = {
      ...publicBatikList.data.items[0],
      id: 4,
      slug: "batik-pattern-peacock-feather",
      keyword: "batik pattern, peacock feather",
      file_preview: "peacock.webp",
    };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ ...publicBatikList, data: { ...publicBatikList.data, items: [batikFour] } }), { status: 200 }))
      .mockResolvedValueOnce(providerStream(JSON.stringify({ choices: [{ delta: { content: "Ini gambar Batik #4." } }] })));
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(chatRequest({
      messages: [
        { role: "user", content: "Jelaskan Batik #4" },
        { role: "assistant", content: "Batik #4 adalah motif peacock feather." },
        { role: "user", content: "Saya mau lihat gambarnya" },
      ],
    }));
    const payload = await response.text();

    expect(payload).toContain('"id":"4"');
    expect(payload).toContain('"previewUrl":"/api/automation/public/images/preview/peacock.webp"');
  });

  it("emits a public costume card when the user asks for costume Batik #9", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(publicBatikList), { status: 200 }))
      .mockResolvedValueOnce(providerStream(JSON.stringify({ choices: [{ delta: { content: "Ini preview costume-nya." } }] })));
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(chatRequest({ messages: [{ role: "user", content: "Kostum Batik #9" }] }));
    const payload = await response.text();

    expect(payload).toContain('"title":"Costume preview Batik #9"');
    expect(payload).toContain('"previewUrl":"/api/automation/public/images/costume/kawung-costume.webp"');
  });

  it("recognizes Indonesian costume suffixes and normalizes legacy costume media URLs", async () => {
    const batikThree = {
      ...publicBatikList.data.items[0],
      id: 3,
      slug: "batik-tropical-leaf",
      costume_urls: ["/api/image/batik-3-costume.webp"],
      costume_files: { filename: "batik-3-costume.webp" },
    };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ ...publicBatikList, data: { ...publicBatikList.data, items: [batikThree] } }), { status: 200 }))
      .mockResolvedValueOnce(providerStream(JSON.stringify({ choices: [{ delta: { content: "Ini costume-nya." } }] })));
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(chatRequest({
      messages: [
        { role: "user", content: "Jelaskan Batik #3" },
        { role: "assistant", content: "Batik #3 tersedia." },
        { role: "user", content: "costumenya juga" },
      ],
    }));
    const payload = await response.text();

    expect(payload).toContain('"title":"Costume preview Batik #3"');
    expect(payload).toContain('"previewUrl":"/api/automation/public/images/costume/batik-3-costume.webp"');
  });

  it("emits up to three public cards for a recommendation request", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ ...publicBatikList, data: { ...publicBatikList.data, items: [{ ...publicBatikList.data.items[0], style: "traditional wax-resist batik" }, { ...publicBatikList.data.items[0], id: 10, slug: "batik-tradisional-2", style: "traditional wax-resist batik", file_preview: "tradisional-2.webp" }] } }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ...publicBatikList, data: { ...publicBatikList.data, items: [{ ...publicBatikList.data.items[0], style: "traditional wax-resist batik" }, { ...publicBatikList.data.items[0], id: 10, slug: "batik-tradisional-2", style: "traditional wax-resist batik", file_preview: "tradisional-2.webp" }] } }), { status: 200 }))
      .mockResolvedValueOnce(providerStream(JSON.stringify({ choices: [{ delta: { content: "Dua pilihan tradisional." } }] })));
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(chatRequest({ messages: [{ role: "user", content: "Rekomendasikan saya batik tradisional" }] }));
    const payload = await response.text();

    expect(payload.match(/event: batik/g)).toHaveLength(2);
    expect(payload).toContain('"previewUrl":"/api/automation/public/images/preview/tradisional-2.webp"');
  });

  it("matches Indonesian butterfly wording to a verified butterfly catalog item", async () => {
    const butterfly = {
      ...publicBatikList.data.items[0],
      id: 7,
      slug: "batik-pattern-butterfly-scattered-botanical-arrangement",
      keyword: "batik pattern, butterfly, scattered botanical arrangement",
      file_preview: "butterfly.webp",
    };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ ...publicBatikList, data: { ...publicBatikList.data, items: [publicBatikList.data.items[0], butterfly] } }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ...publicBatikList, data: { ...publicBatikList.data, items: [publicBatikList.data.items[0], butterfly] } }), { status: 200 }))
      .mockResolvedValueOnce(providerStream(JSON.stringify({ choices: [{ delta: { content: "Motif butterfly tersedia." } }] })));
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(chatRequest({ messages: [{ role: "user", content: "Saya cari motif kupu-kupu" }] }));
    const [, init] = fetchMock.mock.calls[2] as [string, RequestInit];
    const requestBody = JSON.parse(init.body as string) as { messages: Array<{ role: string; content: string }> };
    const context = requestBody.messages.find((message) => message.role === "system")?.content ?? "";

    expect(response.status).toBe(200);
    expect(context).toContain("ID internal: 7");
    expect(context).toContain("batik-pattern-butterfly-scattered-botanical-arrangement");
  });

  it("matches Indonesian tropis wording to tropical catalog cards instead of a generic gallery link", async () => {
    const tropical = {
      ...publicBatikList.data.items[0],
      id: 8,
      slug: "batik-pattern-tropical-leaf",
      keyword: "batik pattern, tropical leaf, scattered botanical arrangement",
      file_preview: "tropical.webp",
    };
    const catalog = { ...publicBatikList, data: { ...publicBatikList.data, items: [tropical] } };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(catalog), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(catalog), { status: 200 }))
      .mockResolvedValueOnce(providerStream(JSON.stringify({ choices: [{ delta: { content: "Pilihan tropis tersedia." } }] })));
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(chatRequest({ messages: [{ role: "user", content: "Saya mau lihat batik tropis" }] }));
    const payload = await response.text();

    expect(payload).toContain('"id":"8"');
    expect(payload).toContain('"previewUrl":"/api/automation/public/images/preview/tropical.webp"');
  });

  it("ranks the verified lotus catalog item ahead of unrelated recommendations", async () => {
    const lotus = {
      ...publicBatikList.data.items[0],
      id: 9,
      slug: "batik-pattern-lotus-flower-diagonal-lereng",
      keyword: "batik pattern, lotus flower, diagonal lereng arrangement",
      style: "traditional wax-resist Indonesian batik",
      file_preview: "lotus.webp",
    };
    const tropical = { ...publicBatikList.data.items[0], id: 8, slug: "batik-tropical-leaf", keyword: "tropical leaf" };
    const catalog = { ...publicBatikList, data: { ...publicBatikList.data, items: [lotus] } };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(catalog), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(catalog), { status: 200 }))
      .mockResolvedValueOnce(providerStream(JSON.stringify({ choices: [{ delta: { content: "Lotus cocok untuk Anda." } }] })));
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(chatRequest({ messages: [{ role: "user", content: "Batik apa yang cocok kalau saya suka bunga lotus?" }] }));
    const payload = await response.text();
    const [, init] = fetchMock.mock.calls[2] as [string, RequestInit];
    const requestBody = JSON.parse(init.body as string) as { messages: Array<{ role: string; content: string }> };
    const context = requestBody.messages.find((message) => message.role === "system")?.content ?? "";

    expect(context).toContain("ID internal: 9");
    expect(payload).toContain('"id":"9"');
  });

  it("finds and shows catalog cards for a requested dark navy palette", async () => {
    const navy = {
      ...publicBatikList.data.items[0],
      id: 9,
      slug: "batik-pattern-lotus-dark-navy",
      keyword: "batik pattern, lotus flower",
      warna: "dark navy and cream",
      file_preview: "lotus-navy.webp",
    };
    const catalog = { ...publicBatikList, data: { ...publicBatikList.data, items: [navy] } };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(catalog), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(catalog), { status: 200 }))
      .mockResolvedValueOnce(providerStream(JSON.stringify({ choices: [{ delta: { content: "Pilihan navy tersedia." } }] })));
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(chatRequest({ messages: [{ role: "user", content: "Saya mau lihat yang warnanya dark navy" }] }));
    const payload = await response.text();

    expect(payload).toContain('"id":"9"');
    expect(payload).toContain('"previewUrl":"/api/automation/public/images/preview/lotus-navy.webp"');
  });

  it("matches style metadata without requiring a hand-written synonym", async () => {
    const traditional = {
      ...publicBatikList.data.items[0],
      id: 9,
      slug: "batik-pattern-lotus-traditional-wax-resist",
      keyword: "batik pattern, lotus flower",
      style: "traditional wax-resist Indonesian batik",
      file_preview: "lotus-traditional.webp",
    };
    const catalog = { ...publicBatikList, data: { ...publicBatikList.data, items: [traditional] } };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(catalog), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(catalog), { status: 200 }))
      .mockResolvedValueOnce(providerStream(JSON.stringify({ choices: [{ delta: { content: "Pilihan traditional wax-resist tersedia." } }] })));
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(chatRequest({ messages: [{ role: "user", content: "Saya mau lihat style traditional wax-resist Indonesian batik" }] }));
    const payload = await response.text();

    expect(payload).toContain('"id":"9"');
    expect(payload).toContain('"previewUrl":"/api/automation/public/images/preview/lotus-traditional.webp"');
  });

  it("provides the verified generation count for an Indonesian calendar date", async () => {
    const onJulyFirst = { ...publicBatikList.data.items[0], id: 1, created_at: "2026-07-01T08:00:00Z" };
    const secondOnJulyFirst = { ...publicBatikList.data.items[0], id: 2, created_at: "2026-07-01T15:30:00Z" };
    const anotherDay = { ...publicBatikList.data.items[0], id: 3, created_at: "2026-07-02T08:00:00Z" };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ ...publicBatikList, data: { ...publicBatikList.data, items: [onJulyFirst, secondOnJulyFirst, anotherDay] } }), { status: 200 }))
      .mockResolvedValueOnce(providerStream(JSON.stringify({ choices: [{ delta: { content: "Terdapat 2 batik." } }] })));
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(chatRequest({ messages: [{ role: "user", content: "Berapa batik yang di-generate pada tanggal 1 Juli 2026?" }] }));
    const [, init] = fetchMock.mock.calls[1] as [string, RequestInit];
    const requestBody = JSON.parse(init.body as string) as { messages: Array<{ role: string; content: string }> };
    const context = requestBody.messages.find((message) => message.role === "system")?.content ?? "";

    expect(response.status).toBe(200);
    expect(context).toContain("2026-07-01");
    expect(context).toContain("2 batik");
  });

  it("forwards a validated temporary image as a vision content part without storing it", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(providerStream(
      JSON.stringify({ choices: [{ delta: { content: "Saya melihat motif geometris." } }] }),
    ));
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(chatRequest({
      messages: [{ role: "user", content: "Bisa jelaskan asal motif ini?" }],
      image: {
        name: "motif.webp",
        mimeType: "image/webp",
        dataUrl: "data:image/webp;base64,QUJDRA==",
      },
    }));
    await response.text();
    const [, init] = fetchMock.mock.calls.at(-1) as [string, RequestInit];
    const requestBody = JSON.parse(init.body as string) as {
      messages: Array<{ content: unknown }>;
    };

    expect(requestBody.messages.at(-1)?.content).toEqual([
      { type: "text", text: "Bisa jelaskan asal motif ini?" },
      { type: "image_url", image_url: { url: "data:image/webp;base64,QUJDRA==" } },
    ]);
  });

  it("validates that the last message comes from the user", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(chatRequest({ messages: [{ role: "assistant", content: "Halo" }] }));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toBe("Pesan terakhir harus berasal dari user.");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
