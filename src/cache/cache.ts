import type { CacheKind } from "../types/sound";
import { MemoryCache } from "./memory-cache";
import { RedisCache } from "./redis-cache";

/**
 * The rest of the application depends on this interface, never on Redis or
 * Map directly. That's what lets feed/search routes stay agnostic to which
 * backend is actually in use.
 */
export interface Cache {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
  delete(key: string): Promise<void>;
}

export function feedCacheKey(): string {
  return "myinstants:feed:in";
}

export function searchCacheKey(normalizedQuery: string): string {
  return `myinstants:search:${normalizedQuery}`;
}

/**
 * Normalizes a raw search query into a stable cache-key fragment so that
 * "fart", " Fart ", and "FART" all resolve to the same cached entry.
 */
export function normalizeSearchQuery(rawQuery: string): string {
  return rawQuery.trim().toLowerCase().replace(/\s+/g, " ");
}

export interface CacheSelectionResult {
  cache: Cache;
  kind: CacheKind;
  /** Present only when the selected cache is backed by Redis; used for graceful shutdown. */
  redis: RedisCache | null;
}

/**
 * Selects a cache backend at startup:
 *   REDIS_URL set   -> try Redis, fall back to memory if it can't connect
 *   REDIS_URL unset -> memory
 */
export async function createCache(
  redisUrl: string | null,
): Promise<CacheSelectionResult> {
  if (redisUrl === null) {
    return { cache: new MemoryCache(), kind: "memory", redis: null };
  }

  const redisCache = new RedisCache({
    url: redisUrl,
    onError: (error) => {
      console.error(
        "[cache] Redis error:",
        error instanceof Error ? error.message : error,
      );
    },
  });

  try {
    await redisCache.connect();
    console.log("[cache] Connected to Redis.");
    return { cache: redisCache, kind: "redis", redis: redisCache };
  } catch (error) {
    console.error(
      "[cache] Could not connect to Redis, falling back to in-memory cache:",
      error instanceof Error ? error.message : error,
    );
    await redisCache.close();
    return { cache: new MemoryCache(), kind: "memory", redis: null };
  }
}
