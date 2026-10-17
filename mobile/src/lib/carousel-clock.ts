type Scheduler = {
  now: () => number;
  schedule: (callback: () => void, delay: number) => unknown;
  cancel: (handle: unknown) => void;
};

/** Slide timing is independent of UI-thread animation values and callbacks. */
export class CarouselClock {
  readonly duration = 3000;
  private remaining = this.duration;
  private startedAt: number | null = null;
  private handle: unknown;
  private generation = 0;

  constructor(
    private scheduler: Scheduler = {
      now: () => Date.now(),
      schedule: (callback, delay) => setTimeout(callback, delay),
      cancel: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
    },
  ) {}

  start(onFinish: () => void) {
    this.pause();
    const generation = ++this.generation;
    this.startedAt = this.scheduler.now();
    const delay = this.remaining;
    this.handle = this.scheduler.schedule(() => {
      if (generation !== this.generation) return;
      this.startedAt = null;
      this.handle = undefined;
      this.remaining = this.duration;
      ++this.generation;
      onFinish();
    }, delay);
    return delay;
  }

  pause() {
    ++this.generation;
    if (this.startedAt !== null) {
      this.remaining = Math.max(
        0,
        this.remaining - (this.scheduler.now() - this.startedAt),
      );
      this.startedAt = null;
    }
    if (this.handle !== undefined) this.scheduler.cancel(this.handle);
    this.handle = undefined;
  }

  reset() {
    this.pause();
    this.remaining = this.duration;
  }
}
