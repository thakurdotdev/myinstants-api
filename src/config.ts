/**
 * Loads and validates environment variables into a typed, immutable config
 * object. Fails fast (throws) at startup on invalid input rather than
 * letting bad configuration surface later as confusing runtime errors.
 */

export interface AppConfig {
  readonly port: number;
  /** null means "no Redis configured" -> use the in-memory cache */
  readonly redisUrl: string | null;
  readonly feedCacheTtlSeconds: number;
  readonly searchCacheTtlSeconds: number;
  readonly requestTimeoutMs: number;
}

const DEFAULTS = {
  PORT: 3000,
  FEED_CACHE_TTL: 300,
  SEARCH_CACHE_TTL: 300,
  REQUEST_TIMEOUT: 5000,
} as const;

class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

function parsePort(raw: string | undefined): number {
  if (raw === undefined || raw.trim() === "") return DEFAULTS.PORT;

  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1 || value > 65535) {
    throw new ConfigError(
      `Invalid PORT: "${raw}". Expected an integer between 1 and 65535.`,
    );
  }
  return value;
}

function parsePositiveInt(
  raw: string | undefined,
  fallback: number,
  name: string,
): number {
  if (raw === undefined || raw.trim() === "") return fallback;

  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) {
    throw new ConfigError(
      `Invalid ${name}: "${raw}". Expected a positive integer.`,
    );
  }
  return value;
}

function parseRedisUrl(raw: string | undefined): string | null {
  if (raw === undefined) return null;

  const trimmed = raw.trim();
  if (trimmed === "") return null;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new ConfigError(`Invalid REDIS_URL: "${raw}" is not a valid URL.`);
  }

  if (parsed.protocol !== "redis:" && parsed.protocol !== "rediss:") {
    throw new ConfigError(
      `Invalid REDIS_URL: "${raw}" must use the redis:// or rediss:// scheme.`,
    );
  }

  return trimmed;
}

export function loadConfig(
  env: Record<string, string | undefined> = process.env,
): AppConfig {
  return {
    port: parsePort(env.PORT),
    redisUrl: parseRedisUrl(env.REDIS_URL),
    feedCacheTtlSeconds: parsePositiveInt(
      env.FEED_CACHE_TTL,
      DEFAULTS.FEED_CACHE_TTL,
      "FEED_CACHE_TTL",
    ),
    searchCacheTtlSeconds: parsePositiveInt(
      env.SEARCH_CACHE_TTL,
      DEFAULTS.SEARCH_CACHE_TTL,
      "SEARCH_CACHE_TTL",
    ),
    requestTimeoutMs: parsePositiveInt(
      env.REQUEST_TIMEOUT,
      DEFAULTS.REQUEST_TIMEOUT,
      "REQUEST_TIMEOUT",
    ),
  };
}
