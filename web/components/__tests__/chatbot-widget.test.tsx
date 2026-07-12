import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ChatbotWidget } from "@/components/chatbot-widget";

function sseResponse(...events: Array<{ event: string; data: unknown }>) {
  const payload = events
    .map(({ event, data }) => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
    .join("");

  return new Response(payload, {
    status: 200,
    headers: { "Content-Type": "text/event-stream" },
  });
}

describe("chatbot widget", () => {
  let storage: Record<string, string>;

  beforeEach(() => {
    vi.unstubAllGlobals();
    storage = {};
    vi.stubGlobal("localStorage", {
      clear: vi.fn(() => {
        storage = {};
      }),
      getItem: vi.fn((key: string) => storage[key] ?? null),
      removeItem: vi.fn((key: string) => {
        delete storage[key];
      }),
      setItem: vi.fn((key: string, value: string) => {
        storage[key] = value;
      }),
    });
  });

  it("opens a bottom-right TitikBatik AI chat panel with suggestions", async () => {
    const user = userEvent.setup();
    render(<ChatbotWidget />);

    await user.click(screen.getByRole("button", { name: "Buka chatbot TitikBatik AI" }));
    const dialog = screen.getByRole("dialog", { name: "Chatbot TitikBatik AI" });

    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText("Tanya TitikBatik AI")).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Jelaskan Batik #9" })).toBeInTheDocument();
    expect(within(dialog).getByPlaceholderText("Tanya motif, warna, atau Batik #9")).toBeInTheDocument();
  });

  it("streams a Markdown answer from the server and persists the completed message", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue(
      sseResponse(
        { event: "token", data: { content: "**Visual Motif Batik**\n\n" } },
        { event: "token", data: { content: "[Buka galeri](/gallery)" } },
        { event: "done", data: {} },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<ChatbotWidget />);
    await user.click(screen.getByRole("button", { name: "Buka chatbot TitikBatik AI" }));
    await user.type(screen.getByPlaceholderText("Tanya motif, warna, atau Batik #9"), "Jelaskan Batik #9");
    await user.click(screen.getByRole("button", { name: "Kirim pesan" }));

    expect(await screen.findByText("Visual Motif Batik")).toHaveProperty("tagName", "STRONG");
    expect(screen.getByRole("link", { name: "Buka galeri" })).toHaveAttribute("href", "/gallery");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/chat",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }),
    );
    const requestBody = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(requestBody.messages.at(-1)).toMatchObject({ role: "user", content: "Jelaskan Batik #9" });
    expect(requestBody.supportsBatikCards).toBe(true);
    expect(localStorage.getItem("titikbatik-chat:v1")).toContain("Visual Motif Batik");
  });

  it("keeps an uploaded image only in the active chat and renders a returned motif card", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      sseResponse(
        { event: "batik", data: { id: "9", title: "Batik #9", previewUrl: "/preview/kawung.webp", detailUrl: "/gallery/kawung", downloadUrl: "/preview/kawung.webp" } },
        { event: "token", data: { content: "Ini motif yang diminta." } },
        { event: "done", data: {} },
      ),
    ));

    render(<ChatbotWidget />);
    await user.click(screen.getByRole("button", { name: "Buka chatbot TitikBatik AI" }));
    const file = new File(["image-data"], "motif.webp", { type: "image/webp" });
    await user.upload(screen.getByLabelText("Lampirkan gambar batik"), file);

    expect(await screen.findByAltText("Preview gambar yang akan dianalisis")).toBeInTheDocument();
    await user.type(screen.getByPlaceholderText("Tanya motif, warna, atau Batik #9"), "Tolong analisis gambar ini");
    await user.click(screen.getByRole("button", { name: "Kirim pesan" }));

    expect(await screen.findByAltText("Gambar yang dikirim: motif.webp")).toBeInTheDocument();
    const catalogPreview = await screen.findByRole("img", { name: "Batik #9" });
    expect(catalogPreview).toHaveAttribute("src", "/preview/kawung.webp");
    expect(catalogPreview).toHaveClass("size-20");
    expect(screen.getByRole("link", { name: "Unduh motif" })).toHaveAttribute("href", "/preview/kawung.webp");
    expect(localStorage.getItem("titikbatik-chat:v1")).not.toContain("image-data");
  });

  it("restores and resets the cached conversation", async () => {
    const user = userEvent.setup();
    localStorage.setItem(
      "titikbatik-chat:v1",
      JSON.stringify([
        { id: "user-old", role: "user", content: "Apa itu TitikBatik?" },
        { id: "assistant-old", role: "assistant", content: "TitikBatik adalah galeri output AI." },
      ]),
    );

    render(<ChatbotWidget />);
    await user.click(screen.getByRole("button", { name: "Buka chatbot TitikBatik AI" }));

    expect(screen.getByText("Apa itu TitikBatik?")).toBeInTheDocument();
    expect(screen.getByText("TitikBatik adalah galeri output AI.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Hapus percakapan" }));

    expect(screen.queryByText("Apa itu TitikBatik?")).not.toBeInTheDocument();
    expect(localStorage.getItem("titikbatik-chat:v1")).toBeNull();
  });

  it("renders an inline error when the chat endpoint fails", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: "MODEL_API_KEY belum dikonfigurasi pada server web." }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    render(<ChatbotWidget />);
    await user.click(screen.getByRole("button", { name: "Buka chatbot TitikBatik AI" }));
    await user.type(screen.getByPlaceholderText("Tanya motif, warna, atau Batik #9"), "Halo");
    await user.click(screen.getByRole("button", { name: "Kirim pesan" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("MODEL_API_KEY belum dikonfigurasi pada server web.");
    });
  });
});
