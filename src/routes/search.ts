import { Elysia, t } from "elysia";
import { SearchResponseSchema, ErrorResponseSchema, isSoundArray } from "../types/sound";
import type { Cache } from "../cache/cache";
import { searchCacheKey, normalizeSearchQuery, EMPTY_RESULT_CACHE_TTL_SECONDS } from "../cache/cache";
import type { MyInstantsService } from "../services/myinstants";
import type { InFlightRequests } from "../lib/inflight";

export interface SearchRoutesDeps {
  cache: Cache;
  myInstants: MyInstantsService;
  inflight: InFlightRequests;
  searchCacheTtlSeconds: number;
}

export function searchRoutes(deps: SearchRoutesDeps) {
  return new Elysia().get(
    "/api/search",
    async ({ query, headers, set }) => {
      const rawQuery = query.q;

      if (!rawQuery || rawQuery.trim() === "") {
        set.status = 400;
        return { error: { message: "Search query is required." } };
      }

      const page = query.page ?? 1;
      const shouldBypassCache =
        query.refresh === true ||
        query.refresh === "true" ||
        headers["cache-control"]?.includes("no-cache") ||
        headers["cache-control"]?.includes("max-age=0");

      const normalized = normalizeSearchQuery(rawQuery);
      const key = searchCacheKey(normalized, page);

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

      const data = await deps.inflight.dedupe(key, () =>
        deps.myInstants.search(normalized, page),
      );
      const ttl = data.length === 0 ? EMPTY_RESULT_CACHE_TTL_SECONDS : deps.searchCacheTtlSeconds;
      await deps.cache.set(key, data, ttl);

      return { page, data };
    },
    {
      query: t.Object({
        q: t.Optional(t.String()),
        page: t.Optional(t.Numeric({ minimum: 1, multipleOf: 1 })),
        refresh: t.Optional(t.Union([t.Boolean(), t.String()])),
      }),
      response: {
        200: SearchResponseSchema,
        400: ErrorResponseSchema,
      },
    },
  );
}

