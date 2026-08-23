import * as cheerio from "cheerio";
import type { CheerioAPI } from "cheerio";
import { isTag, type Element } from "domhandler";
import type { Sound } from "../types/sound";

/**
 * MyInstants renders each sound as a container (observed as `.instant`)
 * holding:
 *  - a link to the sound's detail page, `/en/instant/<slug>/`, whose text
 *    is the sound's display name
 *  - a clickable element (a `<button>`, historically `button.small-button`)
 *    with an `onclick`/`onmousedown` handler like `play('/media/sounds/x.mp3', 'id')`
 *
 * We deliberately don't hardcode a single rigid selector chain: name lookup
 * and sound-URL lookup are independent, tolerant passes over each container,
 * so minor class-name or markup churn doesn't break extraction entirely.
 */

const PLAY_CALL_PATTERN = /play\(\s*'([^']+)'/;
const PLAY_HANDLER_ATTRS = ["onclick", "onmousedown"] as const;
const INSTANT_PATH_PATTERN = /\/instant\/([^/?#]+)\/?/;
const INSTANT_HREF_SELECTOR = 'a[href*="/instant/"]';

function resolveUrl(rawPath: string, baseUrl: string): string | null {
  try {
    return new URL(rawPath, baseUrl).toString();
  } catch {
    return null;
  }
}

/** Finds the `play('/media/sounds/...')` path within a sound container, if any. */
function findSoundPath($: CheerioAPI, container: Element): string | null {
  const candidates = $(container).find("*").addBack().toArray().filter(isTag);

  for (const el of candidates) {
    for (const attr of PLAY_HANDLER_ATTRS) {
      const value = el.attribs[attr];
      if (!value) continue;
      const match = PLAY_CALL_PATTERN.exec(value);
      if (match?.[1]) return match[1];
    }
  }

  return null;
}

/**
 * Finds the `/en/instant/<slug>/` detail link within a sound container, if
 * any. Checks the container itself as well as its descendants: `find()`
 * alone would miss the case (seen in the fallback path) where the container
 * *is* the anchor.
 */
function findDetailLink($: CheerioAPI, container: Element): Element | null {
  const matches = $(container)
    .find(INSTANT_HREF_SELECTOR)
    .addBack(INSTANT_HREF_SELECTOR)
    .toArray()
    .filter(isTag);
  return matches[0] ?? null;
}

function slugFromHref(href: string): string | null {
  const match = INSTANT_PATH_PATTERN.exec(href);
  return match?.[1] ?? null;
}

function findName($: CheerioAPI, container: Element, detailLink: Element | null): string | null {
  const linkClassText = $(container)
    .find(".instant-link")
    .addBack(".instant-link")
    .first()
    .text()
    .trim();
  if (linkClassText) return linkClassText;

  const detailLinkText = detailLink ? $(detailLink).text().trim() : "";
  return detailLinkText ? detailLinkText : null;
}

/** Fallback container discovery, used only if `.instant` matches nothing. */
const HANDLER_ATTR_SELECTOR = '[onclick*="play("], [onmousedown*="play("]' as const;

function findFallbackContainers($: CheerioAPI): Element[] {
  const seen = new Set<Element>();
  const result: Element[] = [];

  for (const el of $(HANDLER_ATTR_SELECTOR).toArray()) {
    const closest = $(el).closest("li, a, div").get(0);
    const container: Element = closest && isTag(closest) ? closest : el;
    if (!seen.has(container)) {
      seen.add(container);
      result.push(container);
    }
  }

  return result;
}

export function parseSounds(html: string, baseUrl: string): Sound[] {
  const $ = cheerio.load(html);

  const primary = $(".instant").toArray();
  const containers = primary.length > 0 ? primary : findFallbackContainers($);

  const sounds: Sound[] = [];
  const seenIds = new Set<string>();

  for (const container of containers) {
    const detailLink = findDetailLink($, container);
    const name = findName($, container, detailLink);
    const soundPath = findSoundPath($, container);
    if (!name || !soundPath) continue;

    const url = resolveUrl(soundPath, baseUrl);
    if (!url) continue;

    const href = detailLink ? $(detailLink).attr("href") : undefined;
    const slug = href ? slugFromHref(href) : null;
    const id = slug ?? url;

    if (seenIds.has(id)) continue;
    seenIds.add(id);

    sounds.push({ id, name, url });
  }

  return sounds;
}
