"use client";

import { Bot, CornerDownLeft, Download, ImagePlus, Loader2, MessageCircle, RotateCcw, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type ChatRole = "user" | "assistant";

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  batik?: BatikCard;
  batiks?: BatikCard[];
  attachment?: ChatImage;
};

type ChatImage = {
  dataUrl: string;
  mimeType: string;
  name: string;
};

type BatikCard = {
  id: string;
  title: string;
  previewUrl: string;
  detailUrl: string;
  downloadUrl: string;
};

const STORAGE_KEY = "titikbatik-chat:v1";
const suggestions = [
  "Jelaskan Batik #9",
  "Apa yang bisa dilihat di galeri AI?",
  "Bagaimana membaca preview costume?",
];

function createMessage(role: ChatRole, content: string): ChatMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    role,
    content,
  };
}

function parseSseEvent(block: string) {
  const event = block
    .split("\n")
    .find((line) => line.startsWith("event:"))
    ?.slice(6)
    .trim();
  const data = block
    .split("\n")
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trimStart())
    .join("\n");

  if (!event || !data) return null;

  try {
    return { event, data: JSON.parse(data) as Record<string, unknown> };
  } catch {
    return null;
  }
}

function readBatikCard(value: Record<string, unknown>): BatikCard | null {
  if (!["id", "title", "previewUrl", "detailUrl", "downloadUrl"].every((key) => typeof value[key] === "string")) {
    return null;
  }

  return {
    id: value.id as string,
    title: value.title as string,
    previewUrl: value.previewUrl as string,
    detailUrl: value.detailUrl as string,
    downloadUrl: value.downloadUrl as string,
  };
}

function readImageDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Gambar tidak dapat dibaca."));
    reader.onerror = () => reject(new Error("Gambar tidak dapat dibaca."));
    reader.readAsDataURL(file);
  });
}

async function readImage(file: File): Promise<Pick<ChatImage, "dataUrl" | "mimeType">> {
  const dataUrl = await readImageDataUrl(file);
  if (file.type !== "image/jpeg" || typeof Image === "undefined") {
    return { dataUrl, mimeType: file.type };
  }

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image();
    element.onload = () => resolve(element);
    element.onerror = () => reject(new Error("Gambar tidak dapat dibaca."));
    element.src = dataUrl;
  });
  const largestSide = Math.max(image.naturalWidth, image.naturalHeight);
  if (largestSide <= 1600) return { dataUrl, mimeType: file.type };

  const scale = 1600 / largestSide;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(image.naturalWidth * scale);
  canvas.height = Math.round(image.naturalHeight * scale);
  const context = canvas.getContext("2d");
  if (!context) return { dataUrl, mimeType: file.type };

  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return { dataUrl: canvas.toDataURL("image/jpeg", 0.82), mimeType: "image/jpeg" };
}

function readStoredMessages(): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    if (typeof window.localStorage?.getItem !== "function") return [];
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]") as ChatMessage[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((message) =>
      (message.role === "user" || message.role === "assistant") &&
      typeof message.content === "string" &&
      typeof message.id === "string",
    );
  } catch {
    return [];
  }
}

function writeStoredMessages(messages: ChatMessage[]) {
  try {
    if (messages.length && typeof window.localStorage?.setItem === "function") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.map(({ attachment: _attachment, ...message }) => message)));
    } else if (!messages.length && typeof window.localStorage?.removeItem === "function") {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Browser storage can be unavailable in private modes or embedded contexts.
  }
}

function clearStoredMessages() {
  try {
    if (typeof window.localStorage?.removeItem === "function") {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Reset still clears in-memory chat even when browser storage is unavailable.
  }
}

export function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [attachment, setAttachment] = useState<ChatImage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hydrated = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasMessages = messages.length > 0;

  useEffect(() => {
    setMessages(readStoredMessages());
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    writeStoredMessages(messages);
  }, [messages]);

  useEffect(() => {
    if (!open) return;
    if (typeof scrollRef.current?.scrollTo === "function") {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages, open, loading]);

  const intro = useMemo(
    () => "Saya bisa bantu membaca output TitikBatik AI, mencari Batik # tertentu, dan menjelaskan motif, warna, costume preview, video, atau metadata.",
    [],
  );

  async function sendMessage(content: string) {
    const text = content.trim();
    if (!text || loading) return;

    const requestImage = attachment;
    const userMessage = { ...createMessage("user", text), attachment: requestImage ?? undefined };
    const nextMessages = [...messages, userMessage];
    const assistantMessage = createMessage("assistant", "");
    setMessages(nextMessages);
    setInput("");
    setAttachment(null);
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages, image: requestImage }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(payload?.error ?? "Chatbot gagal menjawab.");
      }
      if (!response.body) throw new Error("Chatbot tidak mengirim stream jawaban.");

      setMessages((current) => [...current, assistantMessage]);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let receivedContent = false;

      while (true) {
        const { done, value } = await reader.read();
        buffer += decoder.decode(value, { stream: !done });
        const events = buffer.split(/\r?\n\r?\n/);
        buffer = events.pop() ?? "";

        for (const eventBlock of events) {
          const event = parseSseEvent(eventBlock);
          if (!event) continue;
          if (event.event === "error") throw new Error(
            typeof event.data.message === "string" ? event.data.message : "Stream jawaban terputus.",
          );
          const batikCard = event.event === "batik" ? readBatikCard(event.data) : null;
          if (batikCard) {
            setMessages((current) => current.map((message) => (
              message.id === assistantMessage.id
                ? {
                    ...message,
                    batiks: [...(message.batiks ?? (message.batik ? [message.batik] : [])), batikCard].slice(0, 3),
                  }
                : message
            )));
          }
          if (event.event === "token" && typeof event.data.content === "string") {
            receivedContent = true;
            setMessages((current) => current.map((message) => (
              message.id === assistantMessage.id
                ? { ...message, content: message.content + event.data.content }
                : message
            )));
          }
        }

        if (done) break;
      }

      if (!receivedContent) {
        setMessages((current) => current.filter((message) => message.id !== assistantMessage.id));
        throw new Error("Chatbot tidak mengembalikan jawaban.");
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Chatbot gagal menjawab.");
    } finally {
      setLoading(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(input);
  }

  function resetConversation() {
    setMessages([]);
    setAttachment(null);
    setError(null);
    clearStoredMessages();
  }

  async function selectImage(file: File | undefined) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      setError("Gunakan gambar JPEG, PNG, WebP, atau GIF.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Ukuran gambar maksimal 5 MB.");
      return;
    }

    try {
      const image = await readImage(file);
      setAttachment({ ...image, name: file.name });
      setError(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Gambar tidak dapat dibaca.");
    }
  }

  return (
    <div className="fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-[90] flex max-h-[calc(100dvh-1rem-env(safe-area-inset-bottom))] flex-col items-end gap-3 sm:right-6">
      {open && (
        <section
          aria-label="Chatbot TitikBatik AI"
          aria-modal="false"
          role="dialog"
          className="flex max-h-[calc(100dvh-6rem-env(safe-area-inset-bottom))] w-[min(calc(100vw-2rem),25.5rem)] flex-col overflow-hidden rounded-[22px] border border-[color-mix(in_srgb,var(--line)_80%,transparent)] bg-[color:var(--paper-raised)] shadow-[0_26px_90px_rgba(49,37,25,0.22)]"
        >
          <header className="flex shrink-0 items-start justify-between gap-4 border-b border-[color:var(--line)] px-4 py-4">
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[color:var(--terracotta-dark)] text-[color:var(--paper-raised)]">
                <Bot size={19} aria-hidden="true" />
              </span>
              <div>
                <p className="text-[0.72rem] font-extrabold uppercase tracking-[0.12em] text-[color:var(--terracotta-dark)]">TitikBatik AI</p>
                <h2 className="mt-1 text-lg font-extrabold tracking-[-0.035em] text-[color:var(--ink)]">Tanya TitikBatik AI</h2>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Hapus percakapan"
                onClick={resetConversation}
                className="grid size-9 place-items-center rounded-full text-[color:var(--ink-soft)] transition hover:bg-[color-mix(in_srgb,var(--terracotta)_9%,var(--paper))] hover:text-[color:var(--terracotta-dark)]"
              >
                <RotateCcw size={16} aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label="Tutup chatbot TitikBatik AI"
                onClick={() => setOpen(false)}
                className="grid size-9 place-items-center rounded-full text-[color:var(--ink-soft)] transition hover:bg-[color-mix(in_srgb,var(--terracotta)_9%,var(--paper))] hover:text-[color:var(--terracotta-dark)]"
              >
                <X size={17} aria-hidden="true" />
              </button>
            </div>
          </header>

          <div ref={scrollRef} className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-4 py-4">
            {!hasMessages && (
              <div className="rounded-[18px] border border-[color:var(--line)] bg-[color:var(--paper)] p-4 text-sm leading-6 text-[color:var(--ink-soft)]">
                {intro}
                <div className="mt-4 flex flex-wrap gap-2">
                  {suggestions.map((suggestion) => (
                    <button
                      type="button"
                      className="rounded-full border border-[color:var(--line)] px-3 py-2 text-xs font-bold text-[color:var(--ink)] transition hover:border-[color:var(--terracotta-dark)] hover:text-[color:var(--terracotta-dark)]"
                      key={suggestion}
                      onClick={() => void sendMessage(suggestion)}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid gap-3">
              {messages.map((message) => {
                const batikCards = message.batiks ?? (message.batik ? [message.batik] : []);

                return (
                <article
                  className={`max-w-[88%] min-w-0 break-words rounded-[18px] px-4 py-3 text-sm leading-6 ${
                    message.role === "user"
                      ? "ml-auto bg-[color:var(--terracotta-dark)] text-[color:var(--paper-raised)]"
                      : "mr-auto border border-[color:var(--line)] bg-[color:var(--paper)] text-[color:var(--ink)]"
                  }`}
                  key={message.id}
                >
                  {message.attachment && <img alt={`Gambar yang dikirim: ${message.attachment.name}`} className="mb-2 max-h-40 w-full rounded-[12px] object-cover" src={message.attachment.dataUrl} />}
                  {batikCards.map((batikCard) => (
                    <div className="mb-2 flex min-w-0 items-center gap-3 rounded-[14px] border border-[color:var(--line)] bg-[color:var(--paper-raised)] p-2" key={`${message.id}-${batikCard.id}`}>
                      <img alt={batikCard.title} className="size-20 shrink-0 rounded-[10px] object-cover" src={batikCard.previewUrl} />
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        <a className="line-clamp-2 min-w-0 flex-1 text-xs font-extrabold leading-5 text-[color:var(--ink)] underline decoration-[color:var(--terracotta-dark)_45%] underline-offset-4" href={batikCard.detailUrl}>
                          {batikCard.title}
                        </a>
                        <a aria-label="Unduh motif" className="grid size-8 shrink-0 place-items-center rounded-full text-[color:var(--terracotta-dark)] transition hover:bg-[color-mix(in_srgb,var(--terracotta)_10%,var(--paper))]" download href={batikCard.downloadUrl}>
                          <Download size={15} aria-hidden="true" />
                        </a>
                      </div>
                    </div>
                  ))}
                  {message.role === "assistant" ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        a: ({ children, node: _node, ...props }) => (
                        <a {...props} className="break-words font-bold text-[color:var(--terracotta-dark)] underline decoration-[color-mix(in_srgb,var(--terracotta-dark)_45%,transparent)] underline-offset-4" rel="noreferrer" target="_blank">
                            {children}
                          </a>
                        ),
                        code: ({ children }) => (
                          <code className="whitespace-pre-wrap break-all rounded bg-[color-mix(in_srgb,var(--ink)_7%,transparent)] px-1.5 py-0.5 font-mono text-[0.82em]">
                            {children}
                          </code>
                        ),
                        ol: ({ children }) => <ol className="my-2 list-decimal space-y-1 pl-5">{children}</ol>,
                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                        ul: ({ children }) => <ul className="my-2 list-disc space-y-1 pl-5">{children}</ul>,
                      }}
                    >
                      {message.content || ""}
                    </ReactMarkdown>
                  ) : message.content}
                </article>
                );
              })}
              {loading && (
                <div className="mr-auto inline-flex items-center gap-2 rounded-full border border-[color:var(--line)] bg-[color:var(--paper)] px-4 py-2 text-sm text-[color:var(--ink-soft)]">
                  <Loader2 size={15} className="animate-spin" aria-hidden="true" />
                  Menyusun jawaban
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="mx-4 mb-3 shrink-0 break-words rounded-[var(--radius-sm)] border border-[color-mix(in_srgb,var(--terracotta-dark)_35%,var(--line))] bg-[color-mix(in_srgb,var(--terracotta)_9%,var(--paper))] px-3 py-2 text-sm text-[color:var(--terracotta-dark)]" role="alert">
              <span className="font-bold">Tidak dapat menjawab.</span> {error}
            </div>
          )}

          {attachment && (
            <div className="mx-3 mb-1 flex items-center gap-3 rounded-[14px] border border-[color:var(--line)] bg-[color:var(--paper)] p-2">
              <img alt="Preview gambar yang akan dianalisis" className="size-11 rounded-[10px] object-cover" src={attachment.dataUrl} />
              <p className="min-w-0 flex-1 truncate text-xs font-bold text-[color:var(--ink-soft)]">{attachment.name}</p>
              <button aria-label="Hapus gambar" className="grid size-8 place-items-center rounded-full text-[color:var(--ink-soft)] transition hover:bg-[color-mix(in_srgb,var(--terracotta)_9%,var(--paper))] hover:text-[color:var(--terracotta-dark)]" onClick={() => setAttachment(null)} type="button">
                <X size={15} aria-hidden="true" />
              </button>
            </div>
          )}

          <form className="flex shrink-0 items-end gap-2 border-t border-[color:var(--line)] bg-[color:var(--paper)] p-3" onSubmit={submit}>
            <label className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-full border border-[color:var(--line)] text-[color:var(--ink-soft)] transition hover:border-[color:var(--terracotta-dark)] hover:text-[color:var(--terracotta-dark)]" title="Lampirkan gambar batik">
              <ImagePlus size={18} aria-hidden="true" />
              <input
                accept="image/jpeg,image/png,image/webp,image/gif"
                aria-label="Lampirkan gambar batik"
                className="sr-only"
                disabled={loading}
                onChange={(event) => void selectImage(event.target.files?.[0])}
                type="file"
              />
            </label>
            <label className="sr-only" htmlFor="titikbatik-chat-input">Pesan untuk TitikBatik AI</label>
            <input
              className="h-11 min-w-0 flex-1 rounded-[16px] border border-[color:var(--line)] bg-[color:var(--paper-raised)] px-3.5 text-[0.8125rem] leading-5 text-[color:var(--ink)] outline-none transition placeholder:text-[0.8125rem] placeholder:text-[color:var(--ink-soft)] focus:border-[color:var(--terracotta-dark)]"
              disabled={loading}
              id="titikbatik-chat-input"
              onChange={(event) => setInput(event.target.value)}
              placeholder="Tanya motif, warna, atau Batik #9"
              type="text"
              value={input}
            />
            <button
              type="submit"
              aria-label="Kirim pesan"
              disabled={loading || !input.trim()}
              className="grid size-11 shrink-0 place-items-center rounded-full bg-[color:var(--ink)] text-[color:var(--paper-raised)] transition hover:bg-[color:var(--terracotta-dark)] disabled:cursor-not-allowed disabled:opacity-45"
            >
              <CornerDownLeft size={17} aria-hidden="true" />
            </button>
          </form>
          <div className="shrink-0 space-y-1 px-4 pb-3 text-[0.68rem] leading-4 text-[color:var(--ink-soft)]">
            <p>AI dapat membuat kesalahan. Periksa kembali informasi penting.</p>
            <p className="font-semibold text-[color:var(--ink-soft)]">Model: Muse Spark 1.1 oleh Meta AI</p>
          </div>
        </section>
      )}

      <button
        type="button"
        aria-label="Buka chatbot TitikBatik AI"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex min-h-14 items-center gap-3 rounded-full bg-[color:var(--terracotta-dark)] px-5 font-extrabold text-[color:var(--paper-raised)] shadow-[0_18px_50px_rgba(177,55,38,0.28)] transition hover:-translate-y-0.5 hover:bg-[color:var(--ink)]"
      >
        <MessageCircle size={20} aria-hidden="true" />
        <span className="hidden sm:inline">Tanya AI</span>
      </button>
    </div>
  );
}
