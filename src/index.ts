import { Elysia } from "elysia";
import { loadConfig } from "./config";
import { createCache } from "./cache/cache";
import { MyInstantsService, UpstreamError } from "./services/myinstants";
import { InFlightRequests } from "./lib/inflight";
import { healthRoutes } from "./routes/health";
import { feedRoutes } from "./routes/feed";
import { searchRoutes } from "./routes/search";
import { docsRoutes } from "./routes/docs";

async function main(): Promise<void> {
  const config = loadConfig();

  const { cache, kind: cacheKind, redis } = await createCache(config.redisUrl);
  const myInstants = new MyInstantsService({ requestTimeoutMs: config.requestTimeoutMs });
  const inflight = new InFlightRequests();

  const app = new Elysia()
    .onError(({ code, error, set }) => {
      if (error instanceof UpstreamError) {
        set.status = error.status;
        return {
          error: { message: "Unable to reach MyInstants right now. Please try again shortly." },
        };
      }

      if (code === "VALIDATION") {
        set.status = 400;
        return { error: { message: "Invalid request." } };
      }

      console.error("[api] Unhandled error:", error);
      set.status = 500;
      return { error: { message: "Internal server error." } };
    })
    .use(docsRoutes())
    .use(healthRoutes(cacheKind))
    .use(
      feedRoutes({
        cache,
        myInstants,
        inflight,
        feedCacheTtlSeconds: config.feedCacheTtlSeconds,
      }),
    )
    .use(
      searchRoutes({
        cache,
        myInstants,
        inflight,
        searchCacheTtlSeconds: config.searchCacheTtlSeconds,
      }),
    );

  app.listen(config.port, () => {
    console.log(`[api] Listening on port ${config.port} (cache: ${cacheKind})`);
  });

  let shuttingDown = false;
  const shutdown = async (signal: string): Promise<void> => {
    if (shuttingDown) return;
    shuttingDown = true;

    console.log(`[api] Received ${signal}, shutting down...`);
    if (redis) {
      await redis.close();
    }
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch((error: unknown) => {
  console.error("[api] Fatal startup error:", error);
  process.exit(1);
});
