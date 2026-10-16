// React Native's AbortSignal does not implement throwIfAborted in Expo Go.
export function assertNotAborted(signal?: {
  aborted: boolean;
  reason?: unknown;
}) {
  if (!signal?.aborted) return;
  if (signal.reason !== undefined) throw signal.reason;
  const error = new Error("Operasi dibatalkan.");
  error.name = "AbortError";
  throw error;
}
