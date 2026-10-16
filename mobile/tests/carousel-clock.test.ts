import assert from "node:assert/strict";
import { test } from "node:test";
import { CarouselClock } from "../src/lib/carousel-clock";

function fixture() {
  let now = 0;
  let next = 0;
  const jobs = new Map<number, { at: number; callback: () => void }>();
  const clock = new CarouselClock({
    now: () => now,
    schedule: (callback, delay) => {
      const id = ++next;
      jobs.set(id, { at: now + delay, callback });
      return id;
    },
    cancel: (handle) => {
      jobs.delete(handle as number);
    },
  });
  return {
    clock,
    jobs,
    advance(ms: number) {
      const end = now + ms;
      while (true) {
        const job = [...jobs.entries()].sort((a, b) => a[1].at - b[1].at)[0];
        if (!job || job[1].at > end) break;
        now = job[1].at;
        jobs.delete(job[0]);
        job[1].callback();
      }
      now = end;
    },
  };
}

test("every automatic slide gets a full duration, including cleanup after completion", () => {
  const f = fixture();
  let slides = 0;
  const next = () => {
    slides++;
    f.clock.pause();
    f.clock.start(next);
  };
  f.clock.start(next);
  for (let expected = 1; expected <= 6; expected++) {
    f.advance(5499);
    assert.equal(slides, expected - 1);
    f.advance(1);
    assert.equal(slides, expected);
  }
  f.clock.pause();
});

test("pause preserves remaining time and resume advances only once", () => {
  const f = fixture();
  let slides = 0;
  f.clock.start(() => slides++);
  f.advance(2000);
  f.clock.pause();
  f.advance(20000);
  assert.equal(slides, 0);
  assert.equal(
    f.clock.start(() => slides++),
    3500,
  );
  f.advance(3499);
  assert.equal(slides, 0);
  f.advance(1);
  assert.equal(slides, 1);
  assert.equal(
    f.clock.start(() => slides++),
    5500,
  );
});

test("manual reset invalidates queued callbacks and gives the chosen slide full time", () => {
  const f = fixture();
  let slides = 0;
  f.clock.start(() => slides++);
  const stale = [...f.jobs.values()][0].callback;
  f.advance(5400);
  f.clock.reset();
  assert.equal(
    f.clock.start(() => slides++),
    5500,
  );
  stale();
  assert.equal(slides, 0);
  f.advance(5499);
  assert.equal(slides, 0);
  f.advance(1);
  assert.equal(slides, 1);
});
