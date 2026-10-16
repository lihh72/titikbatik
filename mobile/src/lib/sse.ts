import { assertNotAborted } from "./abort";

export type ChatEvent = { event: string; data: Record<string, unknown> };
export function createSseParser(onEvent: (event: ChatEvent) => void) {
  let buffer = "";
  return {
    feed(chunk: string, flush = false) {
      buffer += chunk;
      const blocks = buffer.split(/\r?\n\r?\n/);
      buffer = blocks.pop() ?? "";
      if (flush && buffer.trim()) {
        blocks.push(buffer);
        buffer = "";
      }
      for (const block of blocks) {
        const lines = block.split(/\r?\n/);
        const event = lines
          .find((line) => line.startsWith("event:"))
          ?.slice(6)
          .trim();
        const data = lines
          .filter((line) => line.startsWith("data:"))
          .map((line) => line.slice(5).trimStart())
          .join("\n");
        if (!event || !data) continue;
        let parsed: Record<string, unknown>;
        try {
          parsed = JSON.parse(data);
        } catch {
          throw new Error("Format stream chatbot tidak valid.");
        }
        onEvent({ event, data: parsed });
      }
    },
  };
}
export async function consumeChatStream(
  body: ReadableStream<Uint8Array>,
  signal: AbortSignal,
  onEvent: (event: ChatEvent) => void,
) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  const parser = createSseParser(onEvent);
  const cancel = () => {
    void reader.cancel().catch(() => {});
  };
  signal.addEventListener("abort", cancel, { once: true });
  try {
    assertNotAborted(signal);
    while (true) {
      const { done, value } = await reader.read();
      assertNotAborted(signal);
      parser.feed(decoder.decode(value, { stream: !done }), done);
      if (done) break;
    }
  } finally {
    signal.removeEventListener("abort", cancel);
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}
