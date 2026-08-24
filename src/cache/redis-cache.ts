import { Redis } from "ioredis";
import type { Cache } from "./cache";

const CONNECT_TIMEOUT_MS = 3000;

export interface RedisCacheOptions {
  url: string;
  onError?: (error: unknown) => void;
}

/**
 * Redis-backed cache. Every operation is wrapped so that a Redis failure
 * (dropped connection, timeout, etc.) degrades to "cache miss" / "no-op"
 * instead of throwing - callers fall back to the upstream source, and the
 * API keeps serving requests.
 */
export class RedisCache implements Cache {
  private readonly client: Redis;
  private ready = false;

  constructor(private readonly options: RedisCacheOptions) {
    this.client = new Redis(options.url, {
      lazyConnect: true,
      connectTimeout: CONNECT_TIMEOUT_MS,
      maxRetriesPerRequest: 1,
      retryStrategy: (attempt) => Math.min(attempt * 200, 2000),
      reconnectOnError: () => true,
    });

    this.client.on("ready", () => {
      this.ready = true;
    });
    this.client.on("end", () => {
      this.ready = false;
    });
    this.client.on("error", (error) => {
      this.ready = false;
      this.options.onError?.(error);
    });
  }

  /** Attempts the initial connection. Rejects if Redis can't be reached. */
  async connect(): Promise<void> {
    await this.client.connect();
    this.ready = true;
  }

  isReady(): boolean {
    return this.ready;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await this.client.get(key);
      if (raw === null) return null;
      // Redis contents are untrusted external data: guard the parse instead
      // of assuming a stored string is well-formed JSON matching T.
      return JSON.parse(raw) as T;
    } catch (error) {
      console.error(`[redis-cache] GET failed or data corrupted for key "${key}":`, error);
      void this.delete(key).catch(() => {});
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      await this.client.set(key, serialized, "EX", ttlSeconds);
    } catch (error) {
      console.error(`[redis-cache] SET failed for key "${key}":`, error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      console.error(`[redis-cache] DEL failed for key "${key}":`, error);
    }
  }

  async close(): Promise<void> {
    try {
      await this.client.quit();
    } catch {
      this.client.disconnect();
    }
  }
}
