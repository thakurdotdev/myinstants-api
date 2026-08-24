/**
 * Elysia's schema builder (`t`) is TypeBox under the hood: each schema is
 * both a runtime validator and a source for a static TypeScript type via
 * `.static`. Defining schemas here and deriving types from them avoids
 * keeping a parallel set of hand-written interfaces in sync by hand.
 */
import { t } from "elysia";

export const SoundSchema = t.Object({
  id: t.String(),
  name: t.String(),
  url: t.String(),
});
export type Sound = typeof SoundSchema.static;

export const FeedResponseSchema = t.Object({
  page: t.Integer(),
  data: t.Array(SoundSchema),
});
export type FeedResponse = typeof FeedResponseSchema.static;

export const SearchResponseSchema = t.Object({
  page: t.Integer(),
  data: t.Array(SoundSchema),
});
export type SearchResponse = typeof SearchResponseSchema.static;

export const ErrorResponseSchema = t.Object({
  error: t.Object({
    message: t.String(),
  }),
});
export type ErrorResponse = typeof ErrorResponseSchema.static;

export const CacheKindSchema = t.Union([t.Literal("redis"), t.Literal("memory")]);
export type CacheKind = typeof CacheKindSchema.static;

export const HealthResponseSchema = t.Object({
  status: t.Literal("ok"),
  cache: t.Optional(CacheKindSchema),
});
export type HealthResponse = typeof HealthResponseSchema.static;

export function isSound(value: unknown): value is Sound {
  if (typeof value !== "object" || value === null) return false;
  const s = value as Record<string, unknown>;
  return (
    typeof s.id === "string" &&
    typeof s.name === "string" &&
    typeof s.url === "string"
  );
}

export function isSoundArray(value: unknown): value is Sound[] {
  return Array.isArray(value) && value.every(isSound);
}

