import { describe, it, expect, beforeEach } from "bun:test";
import { Elysia } from "elysia";
import { MemoryCache } from "./cache/memory-cache";
import {
  feedCacheKey,
  searchCacheKey,
  normalizeSearchQuery,
} from "./cache/cache";
import { isSound, isSoundArray, type Sound } from "./types/sound";
import { feedRoutes } from "./routes/feed";
import { searchRoutes } from "./routes/search";
import { InFlightRequests } from "./lib/inflight";
import { MyInstantsService } from "./services/myinstants";

import { docsRoutes } from "./routes/docs";
import { cors } from "@elysiajs/cors";

describe("Cache Utilities & Key Generation", () => {
  it("generates versioned cache keys with page numbers", () => {
    expect(feedCacheKey()).toBe("myinstants:v1:feed:in:page:1");
    expect(feedCacheKey(1)).toBe("myinstants:v1:feed:in:page:1");
    expect(feedCacheKey(3)).toBe("myinstants:v1:feed:in:page:3");

    expect(searchCacheKey("fart")).toBe("myinstants:v1:search:fart:page:1");
    expect(searchCacheKey("fart", 1)).toBe("myinstants:v1:search:fart:page:1");
    expect(searchCacheKey("fart", 2)).toBe("myinstants:v1:search:fart:page:2");
  });

  it("normalizes search queries consistently", () => {
    expect(normalizeSearchQuery("  FaRt  ")).toBe("fart");
    expect(normalizeSearchQuery("VINE    BOOM")).toBe("vine boom");
  });
});

describe("Sound Type Guards", () => {
  it("validates valid sound objects", () => {
    const valid: Sound = { id: "test", name: "Test Sound", url: "https://example.com/test.mp3" };
    expect(isSound(valid)).toBe(true);
    expect(isSoundArray([valid])).toBe(true);
    expect(isSoundArray([])).toBe(true);
  });

  it("rejects malformed or corrupted sound objects", () => {
    expect(isSound(null)).toBe(false);
    expect(isSound({})).toBe(false);
    expect(isSound({ id: "test", name: "Test" })).toBe(false); // missing url
    expect(isSound({ id: 123, name: "Test", url: "http://..." })).toBe(false); // id not string
    expect(isSoundArray([{ id: "ok", name: "Ok", url: "http://..." }, "bad item"])).toBe(false);
    expect(isSoundArray(null)).toBe(false);
  });
});

describe("MemoryCache Immutability & TTL", () => {
  let cache: MemoryCache;

  beforeEach(() => {
    cache = new MemoryCache();
  });

  it("stores and retrieves cloned data preventing external mutations", async () => {
    const key = "test:items";
    const original: Sound[] = [{ id: "1", name: "Original", url: "https://example.com/1.mp3" }];
    await cache.set(key, original, 60);

    const retrieved1 = await cache.get<Sound[]>(key);
    expect(retrieved1).toEqual(original);

    // Mutate retrieved array
    retrieved1!.push({ id: "2", name: "Mutated", url: "https://example.com/2.mp3" });

    // Ensure cache still returns untouched original data
    const retrieved2 = await cache.get<Sound[]>(key);
    expect(retrieved2).not.toBeNull();
    expect(retrieved2).toHaveLength(1);
    expect(retrieved2?.[0]?.name).toBe("Original");
  });

  it("returns null for expired entries and removes them", async () => {
    const key = "test:expiring";
    // Set 0 second TTL (expired immediately)
    await cache.set(key, [{ id: "1", name: "Exp", url: "http://..." }], 0);
    const retrieved = await cache.get(key);
    expect(retrieved).toBeNull();
  });
});

describe("API Routes Integration & Pagination", () => {
  function createTestApp(
    mockFetchFeed: (page: number) => Promise<Sound[]>,
    mockSearch: (q: string, page: number) => Promise<Sound[]>,
  ) {
    const cache = new MemoryCache();
    const inflight = new InFlightRequests();
    const mockService = {
      fetchFeed: mockFetchFeed,
      search: mockSearch,
    } as unknown as MyInstantsService;

    const app = new Elysia()
      .use(cors({ origin: "*" }))
      .onError(({ code, set }) => {
        if (code === "VALIDATION") {
          set.status = 400;
          return { error: { message: "Invalid request." } };
        }
      })
      .use(docsRoutes())
      .use(feedRoutes({ cache, myInstants: mockService, inflight, feedCacheTtlSeconds: 300 }))
      .use(searchRoutes({ cache, myInstants: mockService, inflight, searchCacheTtlSeconds: 300 }));

    return { app, cache };
  }

  it("sets CORS Access-Control-Allow-Origin header to * for cross-origin requests", async () => {
    const { app } = createTestApp(async () => [], async () => []);
    const response = await app.handle(new Request("http://localhost/api/feed", {
      headers: { Origin: "https://mywebsite.com" },
    }));
    expect(response.headers.get("access-control-allow-origin")).toBe("*");
  });

  it("GET / returns 200 HTML documentation page", async () => {
    const { app } = createTestApp(async () => [], async () => []);
    const response = await app.handle(new Request("http://localhost/"));
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
    const html = await response.text();
    expect(html).toContain("MyInstants API");
    expect(html).toContain("https://myinstants.thakur.dev");
  });

  it("GET /api/feed returns default page 1", async () => {
    let requestedPage: number | undefined;
    const { app } = createTestApp(async (p) => {
      requestedPage = p;
      return [{ id: "s1", name: "Sound 1", url: "https://example.com/1.mp3" }];
    }, async () => []);

    const response = await app.handle(new Request("http://localhost/api/feed"));
    expect(response.status).toBe(200);

    const body = (await response.json()) as { page: number; data: Sound[] };
    expect(requestedPage).toBe(1);
    expect(body).toEqual({
      page: 1,
      data: [{ id: "s1", name: "Sound 1", url: "https://example.com/1.mp3" }],
    });
  });

  it("GET /api/feed?page=2 returns requested page", async () => {
    let requestedPage: number | undefined;
    const { app } = createTestApp(async (p) => {
      requestedPage = p;
      return [{ id: "s2", name: "Sound 2", url: "https://example.com/2.mp3" }];
    }, async () => []);

    const response = await app.handle(new Request("http://localhost/api/feed?page=2"));
    expect(response.status).toBe(200);

    const body = (await response.json()) as { page: number; data: Sound[] };
    expect(requestedPage).toBe(2);
    expect(body).toEqual({
      page: 2,
      data: [{ id: "s2", name: "Sound 2", url: "https://example.com/2.mp3" }],
    });
  });

  it("rejects invalid page parameters for feed with 400", async () => {
    const { app } = createTestApp(async () => [], async () => []);

    const res0 = await app.handle(new Request("http://localhost/api/feed?page=0"));
    expect(res0.status).toBe(400);

    const resNeg = await app.handle(new Request("http://localhost/api/feed?page=-1"));
    expect(resNeg.status).toBe(400);

    const resDecimal = await app.handle(new Request("http://localhost/api/feed?page=1.5"));
    expect(resDecimal.status).toBe(400);

    const resAlpha = await app.handle(new Request("http://localhost/api/feed?page=abc"));
    expect(resAlpha.status).toBe(400);
  });

  it("GET /api/search validates query and returns paginated results", async () => {
    let searchParams: { q: string; page: number } | undefined;
    const { app } = createTestApp(async () => [], async (q, p) => {
      searchParams = { q, page: p };
      return [{ id: "search-1", name: "Search Result", url: "https://example.com/search.mp3" }];
    });

    const response = await app.handle(new Request("http://localhost/api/search?q=meme&page=3"));
    expect(response.status).toBe(200);

    const body = (await response.json()) as { page: number; data: Sound[] };
    expect(searchParams).toEqual({ q: "meme", page: 3 });
    expect(body).toEqual({
      page: 3,
      data: [{ id: "search-1", name: "Search Result", url: "https://example.com/search.mp3" }],
    });
  });

  it("rejects missing or empty query in search with 400", async () => {
    const { app } = createTestApp(async () => [], async () => []);

    const resMissing = await app.handle(new Request("http://localhost/api/search"));
    expect(resMissing.status).toBe(400);

    const resBlank = await app.handle(new Request("http://localhost/api/search?q=%20%20"));
    expect(resBlank.status).toBe(400);
  });

  it("serves subsequent requests from cache", async () => {
    let fetchCount = 0;
    const { app } = createTestApp(async () => {
      fetchCount++;
      return [{ id: "sound", name: "Sound", url: "https://example.com/sound.mp3" }];
    }, async () => []);

    const res1 = await app.handle(new Request("http://localhost/api/feed?page=1"));
    expect(res1.status).toBe(200);
    expect(fetchCount).toBe(1);

    const res2 = await app.handle(new Request("http://localhost/api/feed?page=1"));
    expect(res2.status).toBe(200);
    expect(fetchCount).toBe(1); // Cached!
  });

  it("bypasses cache when refresh=true is passed", async () => {
    let fetchCount = 0;
    const { app } = createTestApp(async () => {
      fetchCount++;
      return [{ id: `s-${fetchCount}`, name: `Sound ${fetchCount}`, url: "https://example.com/s.mp3" }];
    }, async () => []);

    const res1 = await app.handle(new Request("http://localhost/api/feed?page=1"));
    expect(fetchCount).toBe(1);

    const resRefresh = await app.handle(new Request("http://localhost/api/feed?page=1&refresh=true"));
    expect(fetchCount).toBe(2);

    const body = (await resRefresh.json()) as { page: number; data: Sound[] };
    expect(body.data[0]?.id).toBe("s-2");
  });

  it("auto-evicts corrupted cache entries and fetches fresh data", async () => {
    let fetchCount = 0;
    const { app, cache } = createTestApp(async () => {
      fetchCount++;
      return [{ id: "fresh", name: "Fresh Sound", url: "https://example.com/fresh.mp3" }];
    }, async () => []);

    // Inject corrupted data into cache key
    const key = feedCacheKey(1);
    await cache.set(key, { invalid: "weird cached version" }, 60);

    // Call endpoint
    const res = await app.handle(new Request("http://localhost/api/feed?page=1"));
    expect(res.status).toBe(200);
    expect(fetchCount).toBe(1); // Detected corruption, evicted key, fetched fresh data

    const body = (await res.json()) as { page: number; data: Sound[] };
    expect(body.data[0]?.id).toBe("fresh");
  });

  it("handles empty results / 404 upstream pages returning empty array with status 200", async () => {
    const { app } = createTestApp(async () => [], async () => []);

    const resFeed = await app.handle(new Request("http://localhost/api/feed?page=9999"));
    expect(resFeed.status).toBe(200);
    const feedBody = (await resFeed.json()) as { page: number; data: Sound[] };
    expect(feedBody).toEqual({ page: 9999, data: [] });

    const resSearch = await app.handle(new Request("http://localhost/api/search?q=notexistingsound12345&page=1"));
    expect(resSearch.status).toBe(200);
    const searchBody = (await resSearch.json()) as { page: number; data: Sound[] };
    expect(searchBody).toEqual({ page: 1, data: [] });
  });
});

