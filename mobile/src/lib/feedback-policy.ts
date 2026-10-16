export type FeedbackKind = "selection" | "light" | "success" | "error";

export function createFeedback({
  enabled,
  emit,
  now = Date.now,
}: {
  enabled: () => boolean;
  emit: (kind: FeedbackKind) => Promise<void>;
  now?: () => number;
}) {
  let lastFeedback = -Infinity;
  return (kind: FeedbackKind = "selection") => {
    if (!enabled()) return;
    const time = now();
    if (time - lastFeedback < 90) return;
    lastFeedback = time;
    try {
      void emit(kind).catch(() => {});
    } catch {
      // Feedback must never prevent the user's action from completing.
    }
  };
}
