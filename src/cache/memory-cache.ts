import type { Cache } from "./cache";

interface Entry {
  value: unknown;
  expiresAt: number;
}

const CLEANUP_INTERVAL_MS = 60_000;

/**
 * Simple in-memory TTL cache. Used either as the default backend (no Redis
 * configured) or as a fallback when Redis can't be reached at startup.
 *
 * Expired entries are never returned (checked lazily on read), and a
 * periodic sweep also reclaims memory from entries that are never read
 * again after expiring.
 */
export class MemoryCache implements Cache {
  private readonly store = new Map<string, Entry>();
  private readonly cleanupTimer: ReturnType<typeof setInterval>;

  constructor(cleanupIntervalMs: number = CLEANUP_INTERVAL_MS) {
    this.cleanupTimer = setInterval(() => this.sweepExpired(), cleanupIntervalMs);
    // Don't let this timer keep the process alive on its own.
    this.cleanupTimer.unref();
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      return null;
    }

    // Safe by construction: the only way a value enters `store` is through
    // this class's own `set<T>`, so the caller-supplied T here matches what
    // was stored under this key.
    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    this.store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  close(): void {
    clearInterval(this.cleanupTimer);
  }

  private sweepExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (entry.expiresAt <= now) this.store.delete(key);
    }
  }
}
