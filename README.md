# MyInstants India API

A small, fast API around the MyInstants India soundboard
(`https://www.myinstants.com/en/index/in/`). Built with Bun and Elysia,
fully typed in strict TypeScript, with an optional Redis cache that falls
back to an in-memory cache automatically.

**Base URL**: `https://myinstants.thakur.dev`

No database. No authentication. No browser automation — just plain HTTP
requests and HTML parsing.

## 1. Local setup (Bun only)

You only need [Bun](https://bun.sh) installed. No Redis, no database, no
other services required.

```bash
bun install
cp .env.example .env
bun run dev
```

The API starts on `http://localhost:3000` (or whatever `PORT` you set). By
default (no `REDIS_URL`), it uses the in-memory cache — you're already done.

Other scripts:

```bash
bun run start      # run once (no file-watching)
bun run test       # run test suite
bun run typecheck  # tsc --noEmit, strict mode
```

## 2. Running without Redis

This is the default. Leave `REDIS_URL` empty (or unset) in your `.env`, and
the API uses an in-memory `Map`-based cache with TTL support. Nothing else
to configure — just `bun run dev`.

Check `GET /health` — it reports `"cache": "memory"`.

## 3. Running with Redis

Set `REDIS_URL` in `.env`, e.g.:

```env
REDIS_URL=redis://localhost:6379
```

TLS Redis (e.g. managed providers) also works via `rediss://`.

If you don't already have Redis running locally, the quickest way is Docker:

```bash
docker run --rm -p 6379:6379 redis:7-alpine
```

Then `bun run dev`. `GET /health` should now report `"cache": "redis"`.

**What happens if Redis is unreachable:** at startup, the API tries to
connect (bounded by a short internal timeout). If it can't connect, it logs
the failure and falls back to the in-memory cache instead of refusing to
start. If Redis drops mid-flight after a successful start, cache reads/writes
fail silently (logged server-side) and the API transparently falls back to
fetching from MyInstants directly — a cache outage never becomes an API
outage.

## 4. Environment variables

| Variable            | Default | Notes                                                              |
| -------------------- | ------- | -------------------------------------------------------------------|
| `PORT`               | `3000`  | Must be an integer in `1–65535`.                                   |
| `REDIS_URL`          | *(empty)* | If unset/empty, the in-memory cache is used. Must be `redis://` or `rediss://` if set. |
| `FEED_CACHE_TTL`     | `300`   | Seconds. Must be a positive integer.                                |
| `SEARCH_CACHE_TTL`   | `300`   | Seconds. Must be a positive integer.                                 |
| `REQUEST_TIMEOUT`    | `5000`  | Milliseconds. Timeout for upstream requests to MyInstants.          |

All of these are validated at startup — invalid values (negative TTLs,
out-of-range ports, malformed Redis URLs, etc.) cause the process to exit
immediately with a clear error message rather than failing confusingly later.

## 5. API endpoints

Base URL: `https://myinstants.thakur.dev`

### `GET /health`

**Example:** `https://myinstants.thakur.dev/health`

```json
{ "status": "ok", "cache": "redis" }
```

`cache` is `"redis"` or `"memory"` depending on which backend is active.
Never exposes Redis credentials or connection details.

### `GET /api/feed?page=<page>&refresh=<boolean>`

Fetches and parses the MyInstants India trending feed with pagination support.

**Example:** `https://myinstants.thakur.dev/api/feed?page=1`

- `page` *(optional, integer >= 1, default `1`)*: Page number to retrieve.
- `refresh` *(optional, boolean)*: Set to `true` (or send header `Cache-Control: no-cache`) to bypass cache and fetch fresh data from upstream.

```json
{
  "page": 1,
  "data": [
    { "id": "fart", "name": "Fart", "url": "https://www.myinstants.com/media/sounds/fart-2.mp3" }
  ]
}
```

Ordering from the source page is preserved. Invalid `page` (e.g. `<= 0`, non-integer) returns `400`.

### `GET /api/search?q=<query>&page=<page>&refresh=<boolean>`

Searches MyInstants sounds by query with pagination support.

**Example:** `https://myinstants.thakur.dev/api/search?q=meme&page=1`

- `q` *(required, non-empty string)*: Search keyword. Missing or blank `q` → `400`:
  ```json
  { "error": { "message": "Search query is required." } }
  ```
- `page` *(optional, integer >= 1, default `1`)*: Page number to retrieve. Invalid `page` → `400`.
- `refresh` *(optional, boolean)*: Set to `true` (or send header `Cache-Control: no-cache`) to bypass cache and fetch fresh data.

```json
{
  "page": 1,
  "data": [
    { "id": "vine-boom-sound-70972", "name": "VINE BOOM SOUND", "url": "https://www.myinstants.com/media/sounds/vine-boom.mp3" }
  ]
}
```

- No matches or page out of bounds → `200` with `{"page": <page>, "data": []}`.
- The query is trimmed and case/whitespace-normalized before it's used as a
  cache key, so `"fart"`, `"  Fart  "`, and `"FART"` all hit the same cache
  entry.

### Errors

All errors use one consistent shape:

```json
{ "error": { "message": "..." } }
```

Upstream failures (MyInstants timeout, non-2xx response, unreachable host)
surface as `502`/`504` with a generic message — never a stack trace, raw
HTML, or internal implementation detail.

## 6. Cache behavior

- **Backend selection (startup only):** `REDIS_URL` set and reachable →
  Redis; otherwise → in-memory `Map` with TTL.
- **Versioned Keys:**
  - `myinstants:v1:feed:in:page:<page>`
  - `myinstants:v1:search:<normalized-query>:page:<page>`
- **Smart Validation & Corruption Prevention:**
  - Cached payloads are validated on retrieval. If malformed or corrupted data is detected, the key is automatically evicted and fresh data is fetched.
  - In-memory cache uses deep cloning (`structuredClone`) to prevent reference mutations across requests.
- **Dynamic TTL for Empty Results:**
  - Normal results are cached according to `FEED_CACHE_TTL` / `SEARCH_CACHE_TTL` (default 300s).
  - Empty results (`data: []`) use a short 30-second TTL to avoid caching transient upstream empty states and allow newly added sounds to show up quickly.
- **Stampede prevention:** if multiple requests arrive concurrently for the
  same uncached key, only one upstream fetch happens — the rest await the
  same in-flight promise. This works the same whether the cache is Redis or
  memory, since it sits in front of both.
- **Cache failures are never API failures:** a failed Redis `GET`/`SET`/`DEL`
  is logged and treated as a miss/no-op; the request still gets served
  (either from MyInstants directly, or from the in-memory fallback).

## 7. Project structure

```
src/
├── index.ts              # startup: config, cache selection, routes, graceful shutdown
├── config.ts              # env validation → typed AppConfig
├── types/
│   └── sound.ts            # TypeBox schemas (single source of truth for types + validation)
├── routes/
│   ├── docs.ts               # GET / — interactive HTML documentation page
│   ├── feed.ts              # GET /api/feed — thin: cache → service → response
│   ├── search.ts             # GET /api/search — validation, cache, service
│   └── health.ts             # GET /health
├── services/
│   └── myinstants.ts         # upstream fetch: URL building, timeout, User-Agent, error mapping
├── cache/
│   ├── cache.ts               # Cache interface, key builders, query normalization, backend selection
│   ├── memory-cache.ts         # Map-based cache with TTL
│   └── redis-cache.ts          # ioredis-based cache, fails soft on every operation
└── lib/
    ├── parser.ts               # tolerant HTML → Sound[] extraction (cheerio)
    └── inflight.ts              # typed in-flight request map (stampede prevention)
```

Routes never touch scraping or cache internals directly — they depend only
on the `Cache` interface and `MyInstantsService`, so swapping either
implementation never requires touching route code.

## 8. Author & Credits

- Built by **[Pankaj Thakur](https://thakur.dev)**
- Soundboard data sourced from **[MyInstants](https://www.myinstants.com)**

