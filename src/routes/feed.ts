import { Elysia } from "elysia";
import { FeedResponseSchema, type Sound } from "../types/sound";
import type { Cache } from "../cache/cache";
import { feedCacheKey } from "../cache/cache";
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
    async () => {
      const key = feedCacheKey();

      const cached = await deps.cache.get<Sound[]>(key);
      if (cached) {
        return { data: cached };
      }

      const data = await deps.inflight.dedupe(key, () => deps.myInstants.fetchFeed());
      await deps.cache.set(key, data, deps.feedCacheTtlSeconds);

      return { data };
    },
    { response: { 200: FeedResponseSchema } },
  );
}
