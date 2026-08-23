import { Elysia } from "elysia";
import { HealthResponseSchema, type CacheKind } from "../types/sound";

export function healthRoutes(cacheKind: CacheKind) {
  return new Elysia().get(
    "/health",
    () => ({ status: "ok" as const, cache: cacheKind }),
    { response: HealthResponseSchema },
  );
}
