import assert from "node:assert/strict";
import { test } from "node:test";
import { createFeedback, type FeedbackKind } from "../src/lib/feedback-policy";

test("feedback coalesces nested handlers and allows separate user actions", () => {
  let time = 0;
  const events: FeedbackKind[] = [];
  const feedback = createFeedback({
    enabled: () => true,
    now: () => time,
    emit: async (kind) => {
      events.push(kind);
    },
  });
  feedback();
  feedback("light");
  time = 100;
  feedback("success");
  time = 200;
  feedback("error");
  assert.deepEqual(events, ["selection", "success", "error"]);
});

test("feedback skips unavailable/background environments without consuming the next action", () => {
  let enabled = false;
  let calls = 0;
  const feedback = createFeedback({
    enabled: () => enabled,
    emit: async () => {
      calls++;
    },
  });
  feedback();
  enabled = true;
  feedback();
  assert.equal(calls, 1);
});

test("native haptic failures never throw or reject into the app", async () => {
  const syncFailure = createFeedback({
    enabled: () => true,
    emit: () => {
      throw new Error("unavailable");
    },
  });
  const asyncFailure = createFeedback({
    enabled: () => true,
    emit: async () => {
      throw new Error("unavailable");
    },
  });
  assert.doesNotThrow(() => syncFailure());
  assert.doesNotThrow(() => asyncFailure());
  await Promise.resolve();
});
