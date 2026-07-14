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

function publicStatistics({
  count,
  latestDate,
  query = null,
  date = null,
}: {
  count: number;
  latestDate: string | null;
  query?: string | null;
  date?: string | null;
}) {
  return {
    success: true,
    message: "ok",
    data: {
      count,
      latest_date: latestDate,
      query,
      date,
    },
  };
}

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

  it("instructs the model to decline requests outside TitikBatik scope", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(providerStream(
      JSON.stringify({ choices: [{ delta: { content: "Maaf, saya fokus pada TitikBatik AI." } }] }),
    ));
    vi.stubGlobal("fetch", fetchMock);

    await POST(chatRequest({ messages: [{ role: "user", content: "Bantu saya coding" }] }));
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const requestBody = JSON.parse(init.body as string) as { messages: Array<{ role: string; content: string }> };
    const context = requestBody.messages.find((message) => message.role === "system")?.content ?? "";

    expect(context).toContain("di luar cakupan TitikBatik AI");
  });

  it("keeps an explicit English language preference across the conversation", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(providerStream(
      JSON.stringify({ choices: [{ delta: { content: "Yes, I can answer in English." } }] }),
    ));
    vi.stubGlobal("fetch", fetchMock);

    await POST(chatRequest({ messages: [
      { role: "user", content: "Can you speak English in this conversation?" },
      { role: "assistant", content: "Yes." },
      { role: "user", content: "Tell me about TitikBatik" },
    ] }));
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const requestBody = JSON.parse(init.body as string) as { messages: Array<{ role: string; content: string }> };
    const context = requestBody.messages.find((message) => message.role === "system")?.content ?? "";

    expect(context).toContain("Gunakan bahasa Inggris");
  });

  it("accepts a concise English language preference", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(providerStream(
      JSON.stringify({ choices: [{ delta: { content: "Sure." } }] }),
    ));
    vi.stubGlobal("fetch", fetchMock);

    await POST(chatRequest({ messages: [{ role: "user", content: "English, please." }] }));
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const requestBody = JSON.parse(init.body as string) as { messages: Array<{ role: string; content: string }> };
    const context = requestBody.messages.find((message) => message.role === "system")?.content ?? "";

    expect(context).toContain("Gunakan bahasa Inggris");
  });

  it("does not treat a question about a language as a switch command", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(providerStream(
      JSON.stringify({ choices: [{ delta: { content: "No, I am answering in English." } }] }),
    ));
    vi.stubGlobal("fetch", fetchMock);

    await POST(chatRequest({ messages: [
      { role: "user", content: "Please reply in English." },
      { role: "assistant", content: "Sure." },
      { role: "user", content: "Is this Indonesian?" },
    ] }));
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const requestBody = JSON.parse(init.body as string) as { messages: Array<{ role: string; content: string }> };
    const context = requestBody.messages.find((message) => message.role === "system")?.content ?? "";

    expect(context).toContain("Gunakan bahasa Inggris");
  });

  it("recognizes a first-person language preference", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(providerStream(
      JSON.stringify({ choices: [{ delta: { content: "Understood." } }] }),
    ));
    vi.stubGlobal("fetch", fetchMock);

    await POST(chatRequest({ messages: [{ role: "user", content: "I prefer English from now on." }] }));
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const requestBody = JSON.parse(init.body as string) as { messages: Array<{ role: string; content: string }> };
    const context = requestBody.messages.find((message) => message.role === "system")?.content ?? "";

    expect(context).toContain("Gunakan bahasa Inggris");
  });

  it("uses the last explicit language instruction", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(providerStream(
      JSON.stringify({ choices: [{ delta: { content: "Baik." } }] }),
    ));
    vi.stubGlobal("fetch", fetchMock);

    await POST(chatRequest({ messages: [
      { role: "user", content: "Please reply in English." },
      { role: "assistant", content: "Understood." },
      { role: "user", content: "Please reply in Indonesian." },
    ] }));
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const requestBody = JSON.parse(init.body as string) as { messages: Array<{ role: string; content: string }> };
    const context = requestBody.messages.find((message) => message.role === "system")?.content ?? "";

    expect(context).toContain("Gunakan bahasa Indonesia");
  });

  it.each([
    "Switch from Indonesian to English.",
    "Don't reply in Indonesian; use English.",
    "I'd prefer English from now on.",
    "Bahasa Inggris, ya.",
    "Jangan gunakan bahasa Indonesia, pakai bahasa Inggris.",
  ])("recognizes an English switch without being confused by other language mentions: %s", async (content) => {
    const fetchMock = vi.fn().mockResolvedValueOnce(providerStream(
      JSON.stringify({ choices: [{ delta: { content: "Understood." } }] }),
    ));
    vi.stubGlobal("fetch", fetchMock);

    await POST(chatRequest({ messages: [{ role: "user", content }] }));
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const requestBody = JSON.parse(init.body as string) as { messages: Array<{ role: string; content: string }> };
    const context = requestBody.messages.find((message) => message.role === "system")?.content ?? "";

    expect(context).toContain("Gunakan bahasa Inggris");
  });

  it("recognizes an Indonesian preference with a leading preposition", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(providerStream(
      JSON.stringify({ choices: [{ delta: { content: "Baik." } }] }),
    ));
    vi.stubGlobal("fetch", fetchMock);

    await POST(chatRequest({ messages: [{ role: "user", content: "In Indonesian, please." }] }));
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const requestBody = JSON.parse(init.body as string) as { messages: Array<{ role: string; content: string }> };
    const context = requestBody.messages.find((message) => message.role === "system")?.content ?? "";

    expect(context).toContain("Gunakan bahasa Indonesia");
  });

  it("does not persist a diagnostic question as a language switch", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(providerStream(
      JSON.stringify({ choices: [{ delta: { content: "I will continue in English." } }] }),
    ));
    vi.stubGlobal("fetch", fetchMock);

    await POST(chatRequest({ messages: [
      { role: "user", content: "Please reply in English." },
      { role: "assistant", content: "Understood." },
      { role: "user", content: "Why did you reply in Indonesian?" },
    ] }));
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const requestBody = JSON.parse(init.body as string) as { messages: Array<{ role: string; content: string }> };
    const context = requestBody.messages.find((message) => message.role === "system")?.content ?? "";

    expect(context).toContain("Gunakan bahasa Inggris");
  });

  it("treats an explicit language negation as the opposite supported preference", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(providerStream(
      JSON.stringify({ choices: [{ delta: { content: "Understood." } }] }),
    ));
    vi.stubGlobal("fetch", fetchMock);

    await POST(chatRequest({ messages: [{ role: "user", content: "Please don't reply in Indonesian." }] }));
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const requestBody = JSON.parse(init.body as string) as { messages: Array<{ role: string; content: string }> };
    const context = requestBody.messages.find((message) => message.role === "system")?.content ?? "";

    expect(context).toContain("Gunakan bahasa Inggris");
  });

  it("does not persist a yes-or-no question about the previous response language", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(providerStream(
      JSON.stringify({ choices: [{ delta: { content: "Yes." } }] }),
    ));
    vi.stubGlobal("fetch", fetchMock);

    await POST(chatRequest({ messages: [
      { role: "user", content: "Please reply in English." },
      { role: "assistant", content: "Understood." },
      { role: "user", content: "Did you reply in Indonesian?" },
    ] }));
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const requestBody = JSON.parse(init.body as string) as { messages: Array<{ role: string; content: string }> };
    const context = requestBody.messages.find((message) => message.role === "system")?.content ?? "";

    expect(context).toContain("Gunakan bahasa Inggris");
  });

  it("answers a short, clearly English request in English", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(publicBatikList), { status: 200 }))
      .mockResolvedValueOnce(providerStream(
        JSON.stringify({ choices: [{ delta: { content: "This motif uses a geometric composition." } }] }),
      ));
    vi.stubGlobal("fetch", fetchMock);

    await POST(chatRequest({ messages: [{ role: "user", content: "Explain Batik #9." }] }));
    const [, init] = fetchMock.mock.calls[1] as [string, RequestInit];
    const requestBody = JSON.parse(init.body as string) as { messages: Array<{ role: string; content: string }> };
    const context = requestBody.messages.find((message) => message.role === "system")?.content ?? "";

    expect(context).toContain("Gunakan bahasa Inggris");
  });

  it("retains a language preference beyond the provider history limit", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(providerStream(
      JSON.stringify({ choices: [{ delta: { content: "Here is TitikBatik." } }] }),
    ));
    vi.stubGlobal("fetch", fetchMock);

    await POST(chatRequest({ messages: [
      { role: "user", content: "Please reply in English." },
      ...Array.from({ length: 12 }, (_, index) => ({
        role: index % 2 === 0 ? "assistant" : "user",
        content: `Message ${index + 1}`,
      })),
      { role: "user", content: "Tell me about TitikBatik." },
    ] }));
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const requestBody = JSON.parse(init.body as string) as { messages: Array<{ role: string; content: string }> };
    const context = requestBody.messages.find((message) => message.role === "system")?.content ?? "";

    expect(context).toContain("Gunakan bahasa Inggris");
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

  it.each(["Show it.", "Can I see the image?"])("emits the active batik image for an English follow-up: %s", async (question) => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(publicBatikList), { status: 200 }))
      .mockResolvedValueOnce(providerStream(
        JSON.stringify({ choices: [{ delta: { content: "Here is the image." } }] }),
      ));
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(chatRequest({
      messages: [
        { role: "user", content: "Explain Batik #9" },
        { role: "assistant", content: "Batik #9 is a kawung motif." },
        { role: "user", content: question },
      ],
    }));
    const payload = await response.text();

    expect(payload).toContain("event: batik");
    expect(payload).toContain('"id":"9"');
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
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(publicStatistics({ count: 2, latestDate: "2026-07-01", date: "2026-07-01" })), { status: 200 }))
      .mockResolvedValueOnce(providerStream(JSON.stringify({ choices: [{ delta: { content: "Terdapat 2 batik." } }] })));
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(chatRequest({ messages: [{ role: "user", content: "Berapa batik yang di-generate pada tanggal 1 Juli 2026?" }] }));
    const [, init] = fetchMock.mock.calls[1] as [string, RequestInit];
    const requestBody = JSON.parse(init.body as string) as { messages: Array<{ role: string; content: string }> };
    const context = requestBody.messages.find((message) => message.role === "system")?.content ?? "";

    expect(response.status).toBe(200);
    expect(fetchMock.mock.calls[0][0]).toBe("http://127.0.0.1:8000/api/v1/catalog/batiks/statistics?date=2026-07-01");
    expect(context).toContain("2026-07-01");
    expect(context).toContain("2 batik");
  });

  it("infers the current year when an Indonesian date omits the year", async () => {
    const currentYear = new Date().getFullYear();
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(publicStatistics({ count: 2, latestDate: `${currentYear}-07-11`, date: `${currentYear}-07-11` })), { status: 200 }))
      .mockResolvedValueOnce(providerStream(JSON.stringify({ choices: [{ delta: { content: "Ada 2 batik." } }] })));
    vi.stubGlobal("fetch", fetchMock);

    await POST(chatRequest({ messages: [{ role: "user", content: "Tanggal 11 Juli ada berapa batik yang di-generate?" }] }));
    const [, init] = fetchMock.mock.calls[1] as [string, RequestInit];
    const requestBody = JSON.parse(init.body as string) as { messages: Array<{ role: string; content: string }> };
    const context = requestBody.messages.find((message) => message.role === "system")?.content ?? "";

    expect(context).toContain(`${currentYear}-07-11`);
    expect(context).toContain("2 batik");
  });

  it("answers an English catalog count question with an English date", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(publicStatistics({ count: 2, latestDate: "2026-07-11", date: "2026-07-11" })), { status: 200 }))
      .mockResolvedValueOnce(providerStream(JSON.stringify({ choices: [{ delta: { content: "Two batiks were generated." } }] })));
    vi.stubGlobal("fetch", fetchMock);

    await POST(chatRequest({ messages: [{ role: "user", content: "How many batiks were generated on July 11, 2026?" }] }));
    const [, init] = fetchMock.mock.calls[1] as [string, RequestInit];
    const requestBody = JSON.parse(init.body as string) as { messages: Array<{ role: string; content: string }> };
    const context = requestBody.messages.find((message) => message.role === "system")?.content ?? "";

    expect(context).toContain("Gunakan bahasa Inggris");
    expect(context).toContain("2026-07-11");
    expect(context).toContain("2 batik");
  });

  it("provides the latest verified generation date from the catalog", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(publicStatistics({ count: 10, latestDate: "2026-07-11" })), { status: 200 }))
      .mockResolvedValueOnce(providerStream(JSON.stringify({ choices: [{ delta: { content: "Motif terbaru dibuat 11 Juli 2026." } }] })));
    vi.stubGlobal("fetch", fetchMock);

    await POST(chatRequest({ messages: [{ role: "user", content: "Motif terbaru di-generate tanggal berapa?" }] }));
    const [, init] = fetchMock.mock.calls[1] as [string, RequestInit];
    const requestBody = JSON.parse(init.body as string) as { messages: Array<{ role: string; content: string }> };
    const context = requestBody.messages.find((message) => message.role === "system")?.content ?? "";

    expect(context).toContain("Tanggal generasi terbaru terverifikasi: 2026-07-11");
  });

  it.each([
    "Tanggal generasi terbaru kapan?",
    "When was the last batik generated?",
  ])("recognizes common latest-generation wording: %s", async (question) => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(publicStatistics({ count: 10, latestDate: "2026-07-11" })), { status: 200 }))
      .mockResolvedValueOnce(providerStream(JSON.stringify({ choices: [{ delta: { content: "11 July 2026." } }] })));
    vi.stubGlobal("fetch", fetchMock);

    await POST(chatRequest({ messages: [{ role: "user", content: question }] }));
    const [, init] = fetchMock.mock.calls[1] as [string, RequestInit];
    const requestBody = JSON.parse(init.body as string) as { messages: Array<{ role: string; content: string }> };
    const context = requestBody.messages.find((message) => message.role === "system")?.content ?? "";

    expect(context).toContain("Tanggal generasi terbaru terverifikasi: 2026-07-11");
    expect(plannerMock).toHaveBeenCalledOnce();
  });

  it("keeps catalog search and media cards for a latest-date discovery request", async () => {
    plannerMock.mockResolvedValue({ catalog: true, intent: "search", queries: ["blue"], needsImage: true, needsCostume: false });
    const blue = { ...publicBatikList.data.items[0], id: 4, slug: "blue-peacock", keyword: "blue peacock batik", file_preview: "blue.webp", created_at: "2026-07-07T08:00:00Z" };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(publicStatistics({ count: 1, latestDate: "2026-07-07", query: "blue" })), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ...publicBatikList, data: { ...publicBatikList.data, items: [blue] } }), { status: 200 }))
      .mockResolvedValueOnce(providerStream(JSON.stringify({ choices: [{ delta: { content: "Here is the latest blue batik." } }] })));
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(chatRequest({ messages: [{ role: "user", content: "Show me the latest blue batik and tell me its date." }] }));
    const payload = await response.text();
    const [, init] = fetchMock.mock.calls[2] as [string, RequestInit];
    const requestBody = JSON.parse(init.body as string) as { messages: Array<{ role: string; content: string }> };
    const context = requestBody.messages.find((message) => message.role === "system")?.content ?? "";

    expect(plannerMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0][0]).toBe("http://127.0.0.1:8000/api/v1/catalog/batiks/statistics?q=blue");
    expect(fetchMock.mock.calls[1][0]).toBe("http://127.0.0.1:8000/api/v1/batiks/search?q=blue&per_page=9&date=2026-07-07");
    expect(context).toContain("Tanggal generasi terbaru terverifikasi: 2026-07-07");
    expect(context).toContain("Tanggal dibuat: 2026-07-07T08:00:00Z");
    expect(payload).toContain('"id":"4"');
  });

  it("keeps catalog search for batiks generated on a requested date", async () => {
    plannerMock.mockResolvedValue({ catalog: true, intent: "search", queries: ["blue"], needsImage: true, needsCostume: false });
    const wrongDate = { ...publicBatikList.data.items[0], id: 3, slug: "old-blue", keyword: "old blue batik", file_preview: "old-blue.webp", created_at: "2026-07-10T08:00:00Z" };
    const blue = { ...publicBatikList.data.items[0], id: 4, slug: "blue-peacock", keyword: "blue peacock batik", file_preview: "blue.webp", created_at: "2026-07-11T08:00:00Z" };
    const catalog = { ...publicBatikList, data: { ...publicBatikList.data, items: [wrongDate, blue] } };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(publicStatistics({ count: 1, latestDate: "2026-07-11", query: "blue", date: "2026-07-11" })), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(catalog), { status: 200 }))
      .mockResolvedValueOnce(providerStream(JSON.stringify({ choices: [{ delta: { content: "Here is a blue batik from that date." } }] })));
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(chatRequest({ messages: [{ role: "user", content: "Show blue batiks generated July 11, 2026." }] }));
    const payload = await response.text();
    const [, init] = fetchMock.mock.calls[2] as [string, RequestInit];
    const requestBody = JSON.parse(init.body as string) as { messages: Array<{ role: string; content: string }> };
    const context = requestBody.messages.find((message) => message.role === "system")?.content ?? "";

    expect(plannerMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0][0]).toBe("http://127.0.0.1:8000/api/v1/catalog/batiks/statistics?date=2026-07-11&q=blue");
    expect(fetchMock.mock.calls[1][0]).toBe("http://127.0.0.1:8000/api/v1/batiks/search?q=blue&per_page=9&date=2026-07-11");
    expect(context).toContain("Statistik katalog terverifikasi untuk 2026-07-11: 1 batik");
    expect(payload).toContain('"id":"4"');
    expect(payload).not.toContain('"id":"3"');
  });

  it("uses a planner filter for a statistics-only catalog question", async () => {
    plannerMock.mockResolvedValue({ catalog: true, intent: "search", queries: ["blue"], needsImage: false, needsCostume: false });
    const blue = { ...publicBatikList.data.items[0], id: 4, slug: "blue-peacock", keyword: "blue peacock batik", file_preview: "blue.webp", created_at: "2026-07-11T08:00:00Z" };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(publicStatistics({ count: 1, latestDate: "2026-07-11", query: "blue", date: "2026-07-11" })), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ...publicBatikList, data: { ...publicBatikList.data, items: [blue] } }), { status: 200 }))
      .mockResolvedValueOnce(providerStream(JSON.stringify({ choices: [{ delta: { content: "One blue batik was generated." } }] })));
    vi.stubGlobal("fetch", fetchMock);

    await POST(chatRequest({ messages: [{ role: "user", content: "How many blue batiks were generated on July 11, 2026?" }] }));
    const [, init] = fetchMock.mock.calls[2] as [string, RequestInit];
    const requestBody = JSON.parse(init.body as string) as { messages: Array<{ role: string; content: string }> };
    const context = requestBody.messages.find((message) => message.role === "system")?.content ?? "";

    expect(plannerMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0][0]).toBe("http://127.0.0.1:8000/api/v1/catalog/batiks/statistics?date=2026-07-11&q=blue");
    expect(fetchMock.mock.calls[1][0]).toBe("http://127.0.0.1:8000/api/v1/batiks/search?q=blue&per_page=9&date=2026-07-11");
    expect(context).toContain("2026-07-11: 1 batik");
  });

  it("does not label a failed aggregate request as verified", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response("unavailable", { status: 503 }))
      .mockResolvedValueOnce(providerStream(JSON.stringify({ choices: [{ delta: { content: "Data belum dapat diverifikasi." } }] })));
    vi.stubGlobal("fetch", fetchMock);

    await POST(chatRequest({ messages: [{ role: "user", content: "Berapa batik yang dibuat tanggal 11 Juli 2026?" }] }));
    const [, init] = fetchMock.mock.calls[1] as [string, RequestInit];
    const requestBody = JSON.parse(init.body as string) as { messages: Array<{ role: string; content: string }> };
    const context = requestBody.messages.find((message) => message.role === "system")?.content ?? "";

    expect(context).not.toContain("Statistik katalog terverifikasi");
  });

  it("does not fall back to global statistics when planning fails", async () => {
    plannerMock.mockResolvedValue({
      catalog: false,
      intent: "none",
      queries: [],
      needsImage: false,
      needsCostume: false,
      resolved: false,
    });
    const fetchMock = vi.fn().mockResolvedValueOnce(providerStream(
      JSON.stringify({ choices: [{ delta: { content: "Data belum dapat diverifikasi." } }] }),
    ));
    vi.stubGlobal("fetch", fetchMock);

    await POST(chatRequest({ messages: [{ role: "user", content: "How many blue batiks were generated on July 11, 2026?" }] }));
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const requestBody = JSON.parse(init.body as string) as { messages: Array<{ role: string; content: string }> };
    const context = requestBody.messages.find((message) => message.role === "system")?.content ?? "";

    expect(url).toBe("https://api.meta.ai/v1/chat/completions");
    expect(context).not.toContain("Statistik katalog terverifikasi");
  });

  it("does not trust a semantically unfiltered plan for a message containing a catalog filter", async () => {
    plannerMock.mockResolvedValue({
      catalog: false,
      intent: "none",
      queries: [],
      needsImage: false,
      needsCostume: false,
      resolved: true,
      statisticsScope: "filtered",
    });
    const fetchMock = vi.fn().mockResolvedValueOnce(providerStream(
      JSON.stringify({ choices: [{ delta: { content: "Data filter belum dapat diverifikasi." } }] }),
    ));
    vi.stubGlobal("fetch", fetchMock);

    await POST(chatRequest({ messages: [{ role: "user", content: "How many blue batiks were generated on July 11, 2026?" }] }));
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const requestBody = JSON.parse(init.body as string) as { messages: Array<{ role: string; content: string }> };
    const context = requestBody.messages.find((message) => message.role === "system")?.content ?? "";

    expect(url).toBe("https://api.meta.ai/v1/chat/completions");
    expect(context).not.toContain("Statistik katalog terverifikasi");
  });

  it("does not broaden cards when planning a filtered discovery request fails", async () => {
    plannerMock.mockResolvedValue({
      catalog: false,
      intent: "none",
      queries: [],
      needsImage: false,
      needsCostume: false,
      resolved: false,
    });
    const fetchMock = vi.fn().mockResolvedValueOnce(providerStream(
      JSON.stringify({ choices: [{ delta: { content: "Katalog belum dapat dicari." } }] }),
    ));
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(chatRequest({ messages: [{ role: "user", content: "Show blue batiks generated July 11, 2026." }] }));
    const payload = await response.text();

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(payload).not.toContain("event: batik");
  });

  it("does not let an old Batik reference suppress a new filtered statistics plan", async () => {
    plannerMock.mockResolvedValue({ catalog: true, intent: "search", queries: ["blue"], needsImage: false, needsCostume: false });
    const blue = { ...publicBatikList.data.items[0], id: 4, slug: "blue-peacock", keyword: "blue peacock batik", file_preview: "blue.webp", created_at: "2026-07-11T08:00:00Z" };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(publicStatistics({ count: 1, latestDate: "2026-07-11", query: "blue", date: "2026-07-11" })), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ...publicBatikList, data: { ...publicBatikList.data, items: [blue] } }), { status: 200 }))
      .mockResolvedValueOnce(providerStream(JSON.stringify({ choices: [{ delta: { content: "One blue batik." } }] })));
    vi.stubGlobal("fetch", fetchMock);

    await POST(chatRequest({ messages: [
      { role: "user", content: "Jelaskan Batik #9" },
      { role: "assistant", content: "Batik #9 adalah motif lotus." },
      { role: "user", content: "How many blue batiks were generated on July 11, 2026?" },
    ] }));
    const [, init] = fetchMock.mock.calls[2] as [string, RequestInit];
    const requestBody = JSON.parse(init.body as string) as { messages: Array<{ role: string; content: string }> };
    const context = requestBody.messages.find((message) => message.role === "system")?.content ?? "";

    expect(plannerMock).toHaveBeenCalledOnce();
    expect(context).toContain("Filter katalog: blue");
    expect(context).not.toContain("Batik #9\n");
  });

  it("does not treat a pronoun inside a new filtered catalog request as a Batik follow-up", async () => {
    plannerMock.mockResolvedValue({ catalog: true, intent: "search", queries: ["blue"], needsImage: true, needsCostume: false });
    const blue = { ...publicBatikList.data.items[0], id: 4, slug: "blue-peacock", keyword: "blue peacock batik", file_preview: "blue.webp", created_at: "2026-07-11T08:00:00Z" };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(publicStatistics({ count: 1, latestDate: "2026-07-11", query: "blue" })), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ...publicBatikList, data: { ...publicBatikList.data, items: [blue] } }), { status: 200 }))
      .mockResolvedValueOnce(providerStream(JSON.stringify({ choices: [{ delta: { content: "The latest blue batik is here." } }] })));
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(chatRequest({ messages: [
      { role: "user", content: "Jelaskan Batik #9" },
      { role: "assistant", content: "Batik #9 adalah motif lotus." },
      { role: "user", content: "What is the latest blue batik and when was it generated?" },
    ] }));
    const payload = await response.text();
    const [, init] = fetchMock.mock.calls[2] as [string, RequestInit];
    const requestBody = JSON.parse(init.body as string) as { messages: Array<{ role: string; content: string }> };
    const context = requestBody.messages.find((message) => message.role === "system")?.content ?? "";

    expect(plannerMock).toHaveBeenCalledOnce();
    expect(context).not.toContain("Batik #9\n");
    expect(payload).toContain('"id":"4"');
  });

  it("keeps a verified zero-match result for the latest filtered batik", async () => {
    plannerMock.mockResolvedValue({ catalog: true, intent: "search", queries: ["magenta"], needsImage: false, needsCostume: false });
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(publicStatistics({ count: 0, latestDate: null, query: "magenta" })), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ...publicBatikList, data: { ...publicBatikList.data, items: [] } }), { status: 200 }))
      .mockResolvedValueOnce(providerStream(JSON.stringify({ choices: [{ delta: { content: "No matching batik exists." } }] })));
    vi.stubGlobal("fetch", fetchMock);

    await POST(chatRequest({ messages: [{ role: "user", content: "When was the latest magenta batik generated?" }] }));
    const [, init] = fetchMock.mock.calls[2] as [string, RequestInit];
    const requestBody = JSON.parse(init.body as string) as { messages: Array<{ role: string; content: string }> };
    const context = requestBody.messages.find((message) => message.role === "system")?.content ?? "";

    expect(context).toContain("tidak menemukan batik");
    expect(context).toContain("magenta");
  });

  it.each([
    { question: "Show batiks generated July 11, 2026.", date: "2026-07-11" },
    { question: "Show batiks that were generated July 11, 2026.", date: "2026-07-11" },
    { question: "Show the latest batik.", date: "2026-07-12" },
    { question: "What is the latest batik?", date: "2026-07-12" },
    { question: "Which batik is the latest?", date: "2026-07-12" },
  ])("loads unfiltered catalog cards for date-scoped discovery: $question", async ({ question, date }) => {
    plannerMock.mockResolvedValue({ catalog: false, intent: "none", queries: [], needsImage: false, needsCostume: false, resolved: true });
    const item = { ...publicBatikList.data.items[0], id: 12, slug: "latest-batik", keyword: "latest batik", file_preview: "latest.webp", created_at: `${date}T08:00:00Z` };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(publicStatistics({ count: 1, latestDate: date, date: question.includes("July") ? date : null })), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ...publicBatikList, data: { ...publicBatikList.data, items: [item] } }), { status: 200 }))
      .mockResolvedValueOnce(providerStream(JSON.stringify({ choices: [{ delta: { content: "Here is the requested batik." } }] })));
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(chatRequest({ messages: [{ role: "user", content: question }] }));
    const payload = await response.text();

    expect(fetchMock.mock.calls[1][0]).toBe(`http://127.0.0.1:8000/api/v1/batiks?page=1&per_page=9&date=${date}`);
    expect(payload).toContain('"id":"12"');
  });

  it.each([
    "How many batiks have been generated on July 11th, 2026?",
    "Berapa banyak batik yang sudah di-generate tanggal 11 Juli 2026?",
  ])("keeps verified global statistics for natural unfiltered wording: %s", async (question) => {
    plannerMock.mockResolvedValue({
      catalog: false,
      intent: "none",
      queries: [],
      needsImage: false,
      needsCostume: false,
      resolved: true,
      statisticsScope: "global",
    });
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(publicStatistics({ count: 2, latestDate: "2026-07-11", date: "2026-07-11" })), { status: 200 }))
      .mockResolvedValueOnce(providerStream(JSON.stringify({ choices: [{ delta: { content: "Two batiks." } }] })));
    vi.stubGlobal("fetch", fetchMock);

    await POST(chatRequest({ messages: [{ role: "user", content: question }] }));
    const [, init] = fetchMock.mock.calls[1] as [string, RequestInit];
    const requestBody = JSON.parse(init.body as string) as { messages: Array<{ role: string; content: string }> };
    const context = requestBody.messages.find((message) => message.role === "system")?.content ?? "";

    expect(context).toContain("2026-07-11: 2 batik");
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
