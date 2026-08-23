/**
 * Prevents cache stampedes: if several requests arrive concurrently for the
 * same uncached key, only the first actually calls `fn`; the rest await the
 * same in-flight promise. Works independently of which Cache backend is in
 * use, since it sits in front of the upstream fetch, not the cache itself.
 */
export class InFlightRequests {
  private readonly pending = new Map<string, Promise<unknown>>();

  async dedupe<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const existing = this.pending.get(key);
    if (existing) {
      return existing as Promise<T>;
    }

    const promise = fn().finally(() => {
      this.pending.delete(key);
    });

    this.pending.set(key, promise);
    return promise;
  }
}
