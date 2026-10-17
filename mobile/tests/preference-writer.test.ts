import assert from "node:assert/strict";
import { test } from "node:test";
import { PreferenceWriter } from "../src/lib/preference-writer";

function scheduler() {
  const tasks = new Map<number, () => void>();
  const delays: number[] = [];
  let next = 0;
  return {
    tasks,
    delays,
    schedule(callback: () => void, delay: number) {
      delays.push(delay);
      tasks.set(++next, callback);
      return next;
    },
    cancel(handle: unknown) {
      tasks.delete(handle as number);
    },
  };
}
const fail = (error: unknown) => {
  throw error;
};

test("250 streaming snapshots serialize/write once and retain the complete last message", async () => {
  const clock = scheduler();
  const writes: string[] = [];
  let serialized = 0;
  const writer = new PreferenceWriter(async (_, value) => {
    writes.push(value);
  }, clock);
  for (let token = 1; token <= 250; token++) {
    const content = "batik ".repeat(token);
    writer.schedule(
      "demo",
      () => {
        serialized++;
        return JSON.stringify({ content });
      },
      fail,
    );
  }
  assert.equal(serialized, 0);
  assert.equal(clock.tasks.size, 1);
  assert.deepEqual(clock.delays, [250]);
  await writer.flush("demo");
  assert.equal(serialized, 1);
  assert.deepEqual(writes, [JSON.stringify({ content: "batik ".repeat(250) })]);
  assert.equal(clock.tasks.size, 0);
});

test("slow storage keeps one write in flight and persists the latest pending snapshot", async () => {
  let release!: () => void;
  const blocked = new Promise<void>((resolve) => {
    release = resolve;
  });
  const writes: string[] = [];
  let concurrent = 0;
  let maximum = 0;
  const writer = new PreferenceWriter(async (_, value) => {
    maximum = Math.max(maximum, ++concurrent);
    writes.push(value);
    if (writes.length === 1) await blocked;
    concurrent--;
  }, scheduler());
  writer.schedule("demo", () => "first", fail, true);
  await Promise.resolve();
  for (let value = 0; value < 100; value++)
    writer.schedule("demo", () => String(value), fail);
  const flushed = writer.flush("demo");
  release();
  await flushed;
  assert.deepEqual(writes, ["first", "99"]);
  assert.equal(maximum, 1);
});

test("background/scope flush drains only the requested mode/server", async () => {
  const clock = scheduler();
  const stored = new Map<string, string>();
  const writer = new PreferenceWriter(async (key, value) => {
    stored.set(key, value);
  }, clock);
  writer.schedule("demo", () => "local", fail);
  writer.schedule("backend:http://server", () => "remote", fail);
  await writer.flush("demo");
  assert.deepEqual([...stored], [["demo", "local"]]);
  assert.equal(clock.tasks.size, 1);
  await writer.flush("backend:http://server");
  assert.equal(stored.get("backend:http://server"), "remote");
});

test("bookmark/like writes bypass the chat delay and preserve the same snapshot", async () => {
  const clock = scheduler();
  const values: string[] = [];
  let oldSerialized = false;
  const writer = new PreferenceWriter(async (_, value) => {
    values.push(value);
  }, clock);
  writer.schedule(
    "demo",
    () => {
      oldSerialized = true;
      return "old chat";
    },
    fail,
  );
  writer.schedule("demo", () => "new chat + bookmark", fail, true);
  await writer.flush("demo");
  assert.equal(oldSerialized, false);
  assert.equal(clock.tasks.size, 0);
  assert.deepEqual(values, ["new chat + bookmark"]);
});

test("write failures are reported and do not block a newer pending snapshot", async () => {
  const values: string[] = [];
  const errors: unknown[] = [];
  const writer = new PreferenceWriter(async (_, value) => {
    if (value === "bad") throw new Error("Disk full");
    values.push(value);
  }, scheduler());
  writer.schedule(
    "demo",
    () => "bad",
    (error) => {
      errors.push(error);
      writer.schedule("demo", () => "recovered", fail);
    },
    true,
  );
  await writer.flush("demo");
  assert.equal(errors.length, 1);
  assert.deepEqual(values, ["recovered"]);
});

test("clearing chat replaces pending history, without a stale write restoring it", async () => {
  const values: string[] = [];
  const writer = new PreferenceWriter(async (_, value) => {
    values.push(value);
  }, scheduler());
  writer.schedule("demo", () => "old history", fail);
  writer.schedule("demo", () => "[]", fail);
  await writer.flush("demo");
  assert.deepEqual(values, ["[]"]);
  await writer.flush("demo");
  assert.equal(values.length, 1);
});
