import { MAX_REQUEST_DELAY_MS, MIN_REQUEST_DELAY_MS } from './config';

export type Sleep = (milliseconds: number, signal?: AbortSignal) => Promise<void>;

export const sleep: Sleep = (milliseconds, signal) => new Promise((resolve, reject) => {
  if (signal?.aborted) return reject(signal.reason ?? new Error('aborted'));
  const timer = setTimeout(resolve, milliseconds);
  signal?.addEventListener('abort', () => {
    clearTimeout(timer);
    reject(signal.reason ?? new Error('aborted'));
  }, { once: true });
});

export class SerialRateLimiter {
  private tail: Promise<void> = Promise.resolve();
  private lastRequestAt = 0;

  constructor(
    private readonly sleepFn: Sleep = sleep,
    private readonly now: () => number = Date.now,
    private readonly random: () => number = Math.random,
  ) {}

  async schedule<T>(task: () => Promise<T>, crawlDelayMs = 0, signal?: AbortSignal): Promise<T> {
    const previous = this.tail;
    let release!: () => void;
    this.tail = new Promise<void>((resolve) => { release = resolve; });
    await previous;
    try {
      const jittered = MIN_REQUEST_DELAY_MS + Math.floor(this.random() * (MAX_REQUEST_DELAY_MS - MIN_REQUEST_DELAY_MS + 1));
      const requiredDelay = Math.max(jittered, crawlDelayMs);
      const wait = Math.max(0, this.lastRequestAt + requiredDelay - this.now());
      if (this.lastRequestAt > 0 && wait > 0) await this.sleepFn(wait, signal);
      this.lastRequestAt = this.now();
      return await task();
    } finally {
      release();
    }
  }
}
