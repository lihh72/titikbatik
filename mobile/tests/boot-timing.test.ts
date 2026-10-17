import assert from "node:assert/strict";
import test from "node:test";
import { remainingBootHold } from "../src/lib/boot-timing";

test("quick hydration preserves the entrance without restarting its countdown", () => {
  assert.equal(remainingBootHold(0, false), 520);
  assert.equal(remainingBootHold(200, false), 320);
  assert.equal(remainingBootHold(500, false), 20);
});

test("slow hydration reveals content immediately after it becomes ready", () => {
  assert.equal(remainingBootHold(520, false), 0);
  assert.equal(remainingBootHold(2500, false), 0);
});

test("Reduce Motion skips the hold and a clock adjustment cannot extend it", () => {
  assert.equal(remainingBootHold(0, true), 0);
  assert.equal(remainingBootHold(-200, false), 520);
});
