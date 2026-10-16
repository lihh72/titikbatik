import assert from "node:assert/strict";
import { test } from "node:test";
import { assertNotAborted } from "../src/lib/abort";
import { consumeChatStream } from "../src/lib/sse";

test("abort checks support native signals without throwIfAborted or reason", () => {
  assert.doesNotThrow(() => assertNotAborted());
  assert.doesNotThrow(() => assertNotAborted({ aborted: false }));
  assert.throws(() => assertNotAborted({ aborted: true }), {
    name: "AbortError",
  });
  const reason = new Error("timeout");
  assert.throws(
    () => assertNotAborted({ aborted: true, reason }),
    (error) => error === reason,
  );
});

test("SSE consumes and cancels with React Native's smaller AbortSignal API", async () => {
  const controller = new AbortController();
  const nativeSignal = {
    get aborted() {
      return controller.signal.aborted;
    },
    addEventListener: controller.signal.addEventListener.bind(
      controller.signal,
    ),
    removeEventListener: controller.signal.removeEventListener.bind(
      controller.signal,
    ),
  } as AbortSignal;
  const events: string[] = [];
  const stream = new ReadableStream<Uint8Array>({
    start(reader) {
      reader.enqueue(
        new TextEncoder().encode('event: token\ndata: {"text":"Batik"}\n\n'),
      );
      reader.close();
    },
  });
  await consumeChatStream(stream, nativeSignal, (event) =>
    events.push(event.event),
  );
  assert.deepEqual(events, ["token"]);
  controller.abort();
  await assert.rejects(
    consumeChatStream(new ReadableStream(), nativeSignal, () => {}),
    { name: "AbortError" },
  );
});
