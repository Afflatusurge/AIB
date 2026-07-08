// RSS fallback discovery for the Daily Brief pipeline.
//
// The LLM search-preview discovery has a hard failure mode: when its web
// search returns nothing useful it can fabricate generic stories with fake
// URLs. The quality gate catches those — but then the day publishes nothing.
// RSS feeds are the deterministic backstop: every item has a real URL, a
// real timestamp, and a real publisher. Items discovered here flow through
// the same editor + quality gate as LLM-discovered ones.
//
// No external deps: a small tolerant parser handles both RSS 2.0 (<item>)
// and Atom (<entry>).

import type { DiscoveredItem } from './openai-brief';

interface Feed {
  url: string;
  source: string;
}

const FEEDS: Feed[] = [
  { url: 'https://techcrunch.com/category/artificial-intelligence/feed/', source: 'TechCrunch' },
  { url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml', source: 'The Verge' },
  { url: 'https://venturebeat.com/category/ai/feed/', source: 'VentureBeat' },
  { url: 'https://openai.com/blog/rss.xml', source: 'OpenAI' },
  { url: 'https://www.anthropic.com/rss.xml', source: 'Anthropic' },
  { url: 'https://blog.google/technology/ai/rss/', source: 'Google' },
];

export interface RssDiscoverOptions {
  excludeUrls?: string[];
  maxItems?: number;     // default 6
  maxAgeHours?: number;  // default 48
  timeoutMs?: number;    // per-feed, default 8000
}

// ── XML helpers (tolerant, dependency-free) ──────────────────

function decodeEntities(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)));
}

function stripHtml(s: string): string {
  return decodeEntities(s).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function firstTag(block: string, names: string[]): string {
  for (const name of names) {
    const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)<\\/${name}>`, 'i'));
    if (m?.[1]) return m[1].trim();
  }
  return '';
}

function extractLink(block: string): string {
  // Atom: <link href="..." rel="alternate"/> (rel may be absent)
  const atom = block.match(/<link[^>]*href="([^"]+)"[^>]*\/?>(?:<\/link>)?/i);
  const rssText = firstTag(block, ['link']);
  // RSS 2.0 puts the URL as text content; Atom as href attribute.
  const candidate = rssText && /^https?:\/\//i.test(decodeEntities(rssText).trim())
    ? decodeEntities(rssText).trim()
    : atom?.[1]
      ? decodeEntities(atom[1]).trim()
      : '';
  return candidate;
}

interface ParsedItem {
  title: string;
  url: string;
  publishedAt: Date | null;
  summary: string;
}

/** Parse RSS 2.0 or Atom into a flat item list. Exported for testing. */
export function parseFeed(xml: string): ParsedItem[] {
  const blocks =
    xml.match(/<item[\s>][\s\S]*?<\/item>/gi) ||
    xml.match(/<entry[\s>][\s\S]*?<\/entry>/gi) ||
    [];

  const items: ParsedItem[] = [];
  for (const block of blocks) {
    const title = stripHtml(firstTag(block, ['title']));
    const url = extractLink(block);
    const dateRaw = firstTag(block, ['pubDate', 'published', 'updated', 'dc:date']);
    const date = dateRaw ? new Date(decodeEntities(dateRaw)) : null;
    const summaryRaw = firstTag(block, ['description', 'summary', 'content:encoded', 'content']);
    if (!title || !url) continue;
    items.push({
      title,
      url,
      publishedAt: date && !Number.isNaN(date.getTime()) ? date : null,
      summary: stripHtml(summaryRaw).slice(0, 400),
    });
  }
  return items;
}

// ── Fetch + merge ────────────────────────────────────────────

async function fetchFeed(feed: Feed, timeoutMs: number): Promise<ParsedItem[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch(feed.url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AIandBusinessBot/1.0; +https://aiandbusiness.com)',
        Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
      },
      redirect: 'follow',
    });
    if (!resp.ok) return [];
    return parseFeed(await resp.text());
  } catch {
    return []; // a dead feed never blocks the run
  } finally {
    clearTimeout(timer);
  }
}

function normalizeUrl(u: string): string {
  try {
    const url = new URL(u);
    url.hash = '';
    url.search = ''; // strip utm_* etc. for dedupe
    return url.toString().replace(/\/$/, '').toLowerCase();
  } catch {
    return u.toLowerCase();
  }
}

/**
 * Fetch all feeds, keep fresh items, interleave across sources (so one
 * high-volume feed doesn't crowd out the rest), and return DiscoveredItems
 * compatible with the editor stage.
 */
export async function discoverFromRss(opts: RssDiscoverOptions = {}): Promise<DiscoveredItem[]> {
  const maxItems = opts.maxItems ?? 6;
  const maxAgeMs = (opts.maxAgeHours ?? 48) * 60 * 60 * 1000;
  const timeoutMs = opts.timeoutMs ?? 8000;
  if (maxItems <= 0) return [];

  const exclude = new Set((opts.excludeUrls || []).map(normalizeUrl));
  const now = Date.now();

  const results = await Promise.allSettled(FEEDS.map((f) => fetchFeed(f, timeoutMs)));

  // Per-feed: fresh, not already covered, newest first.
  const perFeed: DiscoveredItem[][] = results.map((r, i) => {
    if (r.status !== 'fulfilled') return [];
    return r.value
      .filter((item) => item.publishedAt && now - item.publishedAt.getTime() <= maxAgeMs)
      .filter((item) => !exclude.has(normalizeUrl(item.url)))
      .sort((a, b) => (b.publishedAt!.getTime() - a.publishedAt!.getTime()))
      .map((item) => ({
        url: item.url,
        title: item.title,
        source_name: FEEDS[i].source,
        published_at: item.publishedAt!.toISOString(),
        summary: item.summary || item.title,
      }));
  });

  // Round-robin interleave for source diversity.
  const merged: DiscoveredItem[] = [];
  const seen = new Set<string>();
  for (let round = 0; merged.length < maxItems; round++) {
    let took = false;
    for (const list of perFeed) {
      const item = list[round];
      if (!item) continue;
      const key = normalizeUrl(item.url);
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(item);
      took = true;
      if (merged.length >= maxItems) break;
    }
    if (!took) break; // all feeds exhausted
  }

  return merged;
}
