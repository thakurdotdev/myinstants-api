import { parseSounds } from "../lib/parser";
import type { Sound } from "../types/sound";

const ORIGIN = "https://www.myinstants.com";
const FEED_PATH = "/en/index/in/";
const SEARCH_PATH = "/en/search/";
const USER_AGENT =
  "Mozilla/5.0 (compatible; MyInstantsIndiaAPI/1.0; +https://www.myinstants.com/en/index/in/)";

/** Thrown for any failure talking to MyInstants. Carries an HTTP status
 * suitable for relaying to our own API's caller (never the raw upstream
 * error message or body). */
export class UpstreamError extends Error {
  readonly status: number;

  constructor(message: string, status = 502, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "UpstreamError";
    this.status = status;
  }
}

export class UpstreamTimeoutError extends UpstreamError {
  constructor() {
    super("Request to MyInstants timed out.", 504);
    this.name = "UpstreamTimeoutError";
  }
}

export interface MyInstantsServiceOptions {
  requestTimeoutMs: number;
}

export class MyInstantsService {
  constructor(private readonly options: MyInstantsServiceOptions) {}

  async fetchFeed(): Promise<Sound[]> {
    const html = await this.fetchHtml(new URL(FEED_PATH, ORIGIN));
    return parseSounds(html, ORIGIN);
  }

  async search(normalizedQuery: string): Promise<Sound[]> {
    const url = new URL(SEARCH_PATH, ORIGIN);
    url.searchParams.set("name", normalizedQuery);
    const html = await this.fetchHtml(url);
    return parseSounds(html, ORIGIN);
  }

  private async fetchHtml(url: URL): Promise<string> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.options.requestTimeoutMs);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "text/html,application/xhtml+xml",
        },
      });

      if (!response.ok) {
        throw new UpstreamError(
          `MyInstants responded with HTTP ${response.status}.`,
          502,
        );
      }

      return await response.text();
    } catch (error) {
      if (error instanceof UpstreamError) throw error;

      if (error instanceof Error && error.name === "AbortError") {
        throw new UpstreamTimeoutError();
      }

      throw new UpstreamError("Failed to reach MyInstants.", 502, { cause: error });
    } finally {
      clearTimeout(timer);
    }
  }
}
