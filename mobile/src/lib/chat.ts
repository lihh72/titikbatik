import { fetch as expoFetch } from "expo/fetch";
import { normalizeChatCard, validateBaseUrl } from "./api";
import { consumeChatStream } from "./sse";
import type { Attachment, ChatCard, Message } from "./types";

export async function streamChat(
  base: string,
  messages: Message[],
  image: Attachment | null,
  signal: AbortSignal,
  onToken: (token: string) => void,
  onCard: (card: ChatCard) => void,
) {
  const response = await expoFetch(`${validateBaseUrl(base)}/api/chat`, {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify({
      messages: messages
        .slice(-10)
        .map(({ role, content }) => ({ role, content })),
      image,
    }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(
      data?.error ?? `Chatbot gagal menjawab (${response.status}).`,
    );
  }
  if (!response.body) throw new Error("Server tidak mengirim stream jawaban.");
  let received = false;
  let finished = false;
  await consumeChatStream(response.body, signal, ({ event, data }) => {
    if (event === "error")
      throw new Error(
        typeof data.message === "string"
          ? data.message
          : "Stream jawaban terputus.",
      );
    if (event === "token" && typeof data.content === "string") {
      received = true;
      onToken(data.content);
    }
    if (
      event === "batik" &&
      ["id", "title", "previewUrl", "detailUrl", "downloadUrl"].every(
        (key) => typeof data[key] === "string",
      )
    )
      onCard(normalizeChatCard(base, data as ChatCard));
    if (event === "done") finished = true;
  });
  if (!received) throw new Error("Chatbot tidak mengembalikan jawaban.");
  if (!finished) throw new Error("Koneksi terputus sebelum jawaban selesai.");
}
