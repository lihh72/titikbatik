type Job = { serialize: () => string; onError: (error: unknown) => void };
type Entry = { pending?: Job; timer?: unknown; running?: Promise<void> };
type Scheduler = {
  schedule: (callback: () => void, delay: number) => unknown;
  cancel: (timer: unknown) => void;
};

/** Buffer chat snapshots, serialize only the latest, and keep writes ordered per scope. */
export class PreferenceWriter {
  private entries = new Map<string, Entry>();
  constructor(
    private write: (key: string, value: string) => Promise<void>,
    private scheduler: Scheduler = {
      schedule: (callback, delay) => setTimeout(callback, delay),
      cancel: (timer) => clearTimeout(timer as ReturnType<typeof setTimeout>),
    },
  ) {}
  schedule(
    key: string,
    serialize: () => string,
    onError: Job["onError"],
    immediate = false,
  ) {
    let entry = this.entries.get(key);
    if (!entry) {
      entry = {};
      this.entries.set(key, entry);
    }
    entry.pending = { serialize, onError };
    if (immediate) {
      void this.flush(key);
      return;
    }
    if (entry.timer === undefined && !entry.running) {
      entry.timer = this.scheduler.schedule(() => {
        void this.flush(key);
      }, 250);
    }
  }
  flush(key: string): Promise<void> {
    const entry = this.entries.get(key);
    if (!entry) return Promise.resolve();
    if (entry.timer !== undefined) {
      this.scheduler.cancel(entry.timer);
      entry.timer = undefined;
    }
    if (entry.running) return entry.running;
    entry.running = Promise.resolve().then(async () => {
      try {
        while (entry.pending) {
          const job = entry.pending;
          entry.pending = undefined;
          try {
            await this.write(key, job.serialize());
          } catch (error) {
            job.onError(error);
          }
        }
      } finally {
        entry.running = undefined;
        this.entries.delete(key);
      }
    });
    return entry.running;
  }
}
