import { Elysia, t } from "elysia";
import { FeedResponseSchema, isSoundArray } from "../types/sound";
import type { Cache } from "../cache/cache";
import { feedCacheKey, EMPTY_RESULT_CACHE_TTL_SECONDS } from "../cache/cache";
import type { MyInstantsService } from "../services/myinstants";
import type { InFlightRequests } from "../lib/inflight";

export interface FeedRoutesDeps {
  cache: Cache;
  myInstants: MyInstantsService;
  inflight: InFlightRequests;
  feedCacheTtlSeconds: number;
}

/**
 * Routes stay thin: validate (via schema), ask the service/cache for data,
 * return it. Scraping and caching logic live in their own modules.
 */
export function feedRoutes(deps: FeedRoutesDeps) {
  return new Elysia().get(
    "/api/feed",
    async ({ query, headers }) => {
      const page = query.page ?? 1;
      const shouldBypassCache =
        query.refresh === true ||
        query.refresh === "true" ||
        headers["cache-control"]?.includes("no-cache") ||
        headers["cache-control"]?.includes("max-age=0");

      const key = feedCacheKey(page);

      if (!shouldBypassCache) {
        const cached = await deps.cache.get<unknown>(key);
        if (cached !== null) {
          if (isSoundArray(cached)) {
            return { page, data: cached };
          }
          // If cached data shape is corrupted or invalid, evict it immediately.
          await deps.cache.delete(key);
        }
      }

      const data = await deps.inflight.dedupe(key, () => deps.myInstants.fetchFeed(page));
      const ttl = data.length === 0 ? EMPTY_RESULT_CACHE_TTL_SECONDS : deps.feedCacheTtlSeconds;
      await deps.cache.set(key, data, ttl);

      return { page, data };
    },
    {
      query: t.Object({
        page: t.Optional(t.Numeric({ minimum: 1, multipleOf: 1 })),
        refresh: t.Optional(t.Union([t.Boolean(), t.String()])),
      }),
      response: { 200: FeedResponseSchema },
    },
  );
}

