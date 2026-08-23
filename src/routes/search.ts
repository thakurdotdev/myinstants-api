import { Elysia, t } from "elysia";
import { SearchResponseSchema, ErrorResponseSchema, type Sound } from "../types/sound";
import type { Cache } from "../cache/cache";
import { searchCacheKey, normalizeSearchQuery } from "../cache/cache";
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
    async ({ query, set }) => {
      const rawQuery = query.q;

      if (!rawQuery || rawQuery.trim() === "") {
        set.status = 400;
        return { error: { message: "Search query is required." } };
      }

      const normalized = normalizeSearchQuery(rawQuery);
      const key = searchCacheKey(normalized);

      const cached = await deps.cache.get<Sound[]>(key);
      if (cached) {
        return { data: cached };
      }

      const data = await deps.inflight.dedupe(key, () =>
        deps.myInstants.search(normalized),
      );
      await deps.cache.set(key, data, deps.searchCacheTtlSeconds);

      return { data };
    },
    {
      query: t.Object({
        q: t.Optional(t.String()),
      }),
      response: {
        200: SearchResponseSchema,
        400: ErrorResponseSchema,
      },
    },
  );
}
