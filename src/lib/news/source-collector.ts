import { createHash } from 'node:crypto';
import { load } from 'cheerio';
import type { NewsSourceDefinition } from '../../config/news-sources';
import { discoverWatchedSource } from '../openai-brief';
import { fetchFeedUrl, type ParsedItem } from '../rss-discover';

export interface SourceHttpState {
  etag?: string;
  lastModified?: string;
}

export interface CollectedSourceEntry {
  title: string;
  url: string;
  summary: string;
  articleText: string;
  publishedAt: string;
  updatedAt?: string;
  contentHash: string;
}

export interface SourceCollectionResult {
  entries: CollectedSourceEntry[];
  notModified: boolean;
  etag?: string;
  lastModified?: string;
  error?: string;
}

interface PageFetchResult {
  status: number;
  html: string;
  notModified: boolean;
  etag?: string;
  lastModified?: string;
  error?: string;
}

function cleanText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

export function canonicalizeNewsUrl(raw: string): string {
  try {
    const url = new URL(raw);
    url.hash = '';
    for (const key of [...url.searchParams.keys()]) {
      if (/^(utm_|ref$|source$|campaign$|mc_)/i.test(key)) url.searchParams.delete(key);
    }
    url.hostname = url.hostname.toLowerCase().replace(/^www\./, '');
    return url.toString().replace(/\/$/, '');
  } catch {
    return raw.trim();
  }
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

async function fetchPage(
  url: string,
  timeoutMs: number,
  state: SourceHttpState = {}
): Promise<PageFetchResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AIandBusinessBot/1.0; +https://aiandbusiness.com)',
        Accept: 'text/html,application/xhtml+xml,*/*;q=0.8',
        ...(state.etag ? { 'If-None-Match': state.etag } : {}),
        ...(state.lastModified ? { 'If-Modified-Since': state.lastModified } : {}),
      },
    });
    if (resp.status === 304) {
      return {
        status: 304,
        html: '',
        notModified: true,
        etag: state.etag,
        lastModified: state.lastModified,
      };
    }
    if (!resp.ok) {
      return {
        status: resp.status,
        html: '',
        notModified: false,
        error: `HTTP ${resp.status}`,
      };
    }
    return {
      status: resp.status,
      html: await resp.text(),
      notModified: false,
      etag: resp.headers.get('etag') || undefined,
      lastModified: resp.headers.get('last-modified') || undefined,
    };
  } catch (err: any) {
    return {
      status: 0,
      html: '',
      notModified: false,
      error: String(err?.message || err),
    };
  } finally {
    clearTimeout(timer);
  }
}

function isoDate(value: unknown): string | null {
  if (!value) return null;
  const date = new Date(String(value).trim());
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function datesFromJsonLd(value: any, out: { published?: string; updated?: string }): void {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    for (const item of value) datesFromJsonLd(item, out);
    return;
  }
  if (!out.published) out.published = isoDate(value.datePublished) || undefined;
  if (!out.updated) out.updated = isoDate(value.dateModified) || undefined;
  for (const child of Object.values(value)) {
    if (child && typeof child === 'object') datesFromJsonLd(child, out);
  }
}

function extractDates(html: string): { published?: string; updated?: string } {
  const $ = load(html);
  const out: { published?: string; updated?: string } = {};
  const publishedMeta = [
    'meta[property="article:published_time"]',
    'meta[name="article:published_time"]',
    'meta[name="date"]',
    'meta[name="publish_date"]',
    'meta[itemprop="datePublished"]',
  ];
  const updatedMeta = [
    'meta[property="article:modified_time"]',
    'meta[name="last-modified"]',
    'meta[itemprop="dateModified"]',
  ];
  for (const selector of publishedMeta) {
    out.published = isoDate($(selector).attr('content')) || undefined;
    if (out.published) break;
  }
  for (const selector of updatedMeta) {
    out.updated = isoDate($(selector).attr('content')) || undefined;
    if (out.updated) break;
  }

  $('script[type="application/ld+json"]').each((_, script) => {
    try {
      datesFromJsonLd(JSON.parse($(script).text()), out);
    } catch {
      // Invalid JSON-LD is common; other date sources remain available.
    }
  });

  if (!out.published) {
    const datetime = $('time[datetime]').first().attr('datetime');
    out.published = isoDate(datetime) || undefined;
  }
  if (!out.published) {
    const text = cleanText($('main, article, body').first().text()).slice(0, 7000);
    const isoLike = text.match(
      /(?:Date|Published|发布日期|发布|日付)\s*:?\s*(20\d{2}[-/.]\d{1,2}[-/.]\d{1,2})/i
    );
    const monthLike = text.match(
      /(?:Date|Published)\s*:?\s*((?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},\s+20\d{2})/i
    );
    const bareMonth = text.match(
      /\b((?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},\s+20\d{2})\b/i
    );
    out.published = isoDate(isoLike?.[1] || monthLike?.[1] || bareMonth?.[1]) || undefined;
  }
  if (!out.published) {
    // Some React-rendered publisher pages place the visible publication date
    // after a large hydration payload, beyond the first text window above.
    // The raw HTML still contains the exact visible date.
    const rawMonth = html.match(
      /\b((?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},\s+20\d{2})\b/i
    );
    out.published = isoDate(rawMonth?.[1]) || undefined;
  }
  return out;
}

function extractArticleText(html: string): {
  title: string;
  summary: string;
  articleText: string;
} {
  const $ = load(html);
  $('script, style, noscript, nav, footer, header, form').remove();
  const title = cleanText(
    $('meta[property="og:title"]').attr('content') ||
    $('h1').first().text() ||
    $('title').first().text()
  );
  const summary = cleanText(
    $('meta[name="description"]').attr('content') ||
    $('meta[property="og:description"]').attr('content') ||
    ''
  );
  const articleText = cleanText(
    $('article').first().text() ||
    $('main').first().text() ||
    $('body').first().text()
  ).slice(0, 20000);
  return { title, summary, articleText };
}

export async function fetchArticleDetails(
  url: string,
  timeoutMs = 8000
): Promise<CollectedSourceEntry | null> {
  const page = await fetchPage(url, timeoutMs);
  if (!page.html) return null;
  const content = extractArticleText(page.html);
  const dates = extractDates(page.html);
  // DeepSeek's official news routes encode their publication date as
  // newsYYMMDD. The page itself does not expose a machine-readable date.
  const encoded = new URL(url).pathname.match(/\/news\/news(\d{2})(\d{2})(\d{2})\/?$/i);
  if (encoded) {
    dates.published = isoDate(`20${encoded[1]}-${encoded[2]}-${encoded[3]}`) || undefined;
  }
  if (!content.title || !dates.published) return null;
  const canonicalUrl = canonicalizeNewsUrl(url);
  return {
    title: content.title,
    url: canonicalUrl,
    summary: content.summary,
    articleText: content.articleText,
    publishedAt: dates.published,
    updatedAt: dates.updated,
    contentHash: sha256(`${canonicalUrl}\n${content.title}\n${content.articleText}`),
  };
}

function isAllowedArticleUrl(raw: string, source: NewsSourceDefinition): boolean {
  try {
    const url = new URL(raw, source.pageUrl);
    const host = url.hostname.toLowerCase().replace(/^www\./, '');
    const domainAllowed = source.domains.some(
      (domain) => host === domain || host.endsWith(`.${domain}`)
    );
    if (!domainAllowed) return false;
    if (!source.allowedPathPrefixes?.length) return true;
    return source.allowedPathPrefixes.some((prefix) => url.pathname.startsWith(prefix));
  } catch {
    return false;
  }
}

function isPotentialWatchLink(title: string, source: NewsSourceDefinition): boolean {
  const normalized = title.toLowerCase();
  if (source.excludeTerms?.some((term) => normalized.includes(term.toLowerCase()))) {
    return false;
  }
  const namedProduct = source.products?.some((product) =>
    normalized.includes(product.toLowerCase())
  );
  const included = source.includeTerms?.some((term) =>
    normalized.includes(term.toLowerCase())
  );
  const releaseLanguage =
    /\b(introduc(?:e|es|ed|ing)?|launch(?:es|ed|ing)?|release(?:s|d)?|unveil(?:s|ed|ing)?|available|availability|api|pricing|price|deprecat(?:e|ed|ion)|sunset|upgrade(?:s|d)?|version|open[- ]?source)\b/i.test(title)
    || /发布|上线|推出|价格|开源|リリース|提供開始/.test(title);
  const versionedProduct = namedProduct && /\b\d+(?:[._-]\d+)*\b/.test(title);
  return !!(included || releaseLanguage || versionedProduct);
}

async function collectHtmlLinks(
  source: NewsSourceDefinition,
  state: SourceHttpState,
  timeoutMs: number,
  maxLinks: number
): Promise<SourceCollectionResult> {
  if (!source.pageUrl) return { entries: [], notModified: false, error: 'pageUrl missing' };
  const page = await fetchPage(source.pageUrl, timeoutMs, state);
  if (page.notModified) {
    return {
      entries: [],
      notModified: true,
      etag: page.etag,
      lastModified: page.lastModified,
    };
  }
  if (!page.html) {
    return {
      entries: [],
      notModified: false,
      etag: page.etag,
      lastModified: page.lastModified,
      error: page.error || 'empty page',
    };
  }

  const $ = load(page.html);
  const urls: string[] = [];
  const seen = new Set<string>();
  $('a[href]').each((_, anchor) => {
    if (urls.length >= maxLinks) return;
    const href = $(anchor).attr('href');
    const title = cleanText($(anchor).text());
    if (!href || title.length < 8) return;
    if (!isPotentialWatchLink(title, source)) return;
    const absolute = canonicalizeNewsUrl(new URL(href, source.pageUrl).toString());
    if (!isAllowedArticleUrl(absolute, source) || seen.has(absolute)) return;
    seen.add(absolute);
    urls.push(absolute);
  });

  const settled = await Promise.allSettled(
    urls.map((url) => fetchArticleDetails(url, timeoutMs))
  );
  const entries = settled
    .filter((result): result is PromiseFulfilledResult<CollectedSourceEntry | null> =>
      result.status === 'fulfilled'
    )
    .map((result) => result.value)
    .filter((entry): entry is CollectedSourceEntry => !!entry);

  return {
    entries,
    notModified: false,
    etag: page.etag,
    lastModified: page.lastModified,
  };
}

async function collectSitemap(
  source: NewsSourceDefinition,
  state: SourceHttpState,
  timeoutMs: number,
  maxLinks: number
): Promise<SourceCollectionResult> {
  if (!source.pageUrl) return { entries: [], notModified: false, error: 'sitemap URL missing' };
  const page = await fetchPage(source.pageUrl, timeoutMs, state);
  if (page.notModified) {
    return {
      entries: [],
      notModified: true,
      etag: page.etag,
      lastModified: page.lastModified,
    };
  }
  if (!page.html) {
    return {
      entries: [],
      notModified: false,
      error: page.error || 'empty sitemap',
    };
  }

  const $ = load(page.html, { xmlMode: true });
  const candidates: Array<{ url: string; updated: number; order: number }> = [];
  $('url').each((order, node) => {
    const url = canonicalizeNewsUrl($(node).find('loc').first().text());
    if (!url || !isAllowedArticleUrl(url, source)) return;
    let watchKey = url;
    try {
      watchKey = decodeURIComponent(new URL(url).pathname.replace(/[-_/]+/g, ' '));
    } catch {
      // Keep the canonical URL as a fallback watch key.
    }
    if (!isPotentialWatchLink(watchKey, source)) return;
    const updated = new Date($(node).find('lastmod').first().text()).getTime();
    candidates.push({
      url,
      updated: Number.isFinite(updated) ? updated : 0,
      order,
    });
  });
  candidates.sort((a, b) => (b.updated - a.updated) || (b.order - a.order));

  const settled = await Promise.allSettled(
    candidates.slice(0, maxLinks).map(({ url }) => fetchArticleDetails(url, timeoutMs))
  );
  const entries = settled
    .filter((result): result is PromiseFulfilledResult<CollectedSourceEntry | null> =>
      result.status === 'fulfilled'
    )
    .map((result) => result.value)
    .filter((entry): entry is CollectedSourceEntry => !!entry);
  return {
    entries,
    notModified: false,
    etag: page.etag,
    lastModified: page.lastModified,
  };
}

async function collectViaWebSearch(
  source: NewsSourceDefinition,
  maxLinks: number
): Promise<SourceCollectionResult> {
  try {
    const discovered = await discoverWatchedSource({
      name: source.name,
      domains: source.domains,
      products: source.products,
      max: maxLinks,
      maxAgeHours: 72,
    });
    const entries = discovered
      .filter((item) => isAllowedArticleUrl(item.url, source))
      .map((item) => {
        const url = canonicalizeNewsUrl(item.url);
        return {
          title: item.title,
          url,
          summary: item.summary,
          articleText: '',
          publishedAt: item.published_at,
          contentHash: sha256(`${url}\n${item.title}\n${item.summary}`),
        };
      });
    return { entries, notModified: false };
  } catch (err: any) {
    return {
      entries: [],
      notModified: false,
      error: String(err?.message || err),
    };
  }
}

function fromParsedFeedItem(item: ParsedItem): CollectedSourceEntry | null {
  if (!item.publishedAt) return null;
  const url = canonicalizeNewsUrl(item.url);
  return {
    title: item.title,
    url,
    summary: item.summary,
    articleText: '',
    publishedAt: item.publishedAt.toISOString(),
    contentHash: sha256(`${url}\n${item.title}\n${item.summary}`),
  };
}

export async function collectWatchSource(
  source: NewsSourceDefinition,
  state: SourceHttpState = {},
  opts: { timeoutMs?: number; maxLinks?: number } = {}
): Promise<SourceCollectionResult> {
  const timeoutMs = opts.timeoutMs ?? 8000;
  const maxLinks = opts.maxLinks ?? 16;
  if (source.adapter === 'rss' && source.feedUrl) {
    const result = await fetchFeedUrl(source.feedUrl, timeoutMs, state);
    return {
      entries: result.items
        .map(fromParsedFeedItem)
        .filter((entry): entry is CollectedSourceEntry => !!entry),
      notModified: result.notModified,
      etag: result.etag,
      lastModified: result.lastModified,
      error: result.error,
    };
  }
  if (source.adapter === 'html_links') {
    return collectHtmlLinks(source, state, timeoutMs, maxLinks);
  }
  if (source.adapter === 'sitemap') {
    return collectSitemap(source, state, timeoutMs, maxLinks);
  }
  if (source.adapter === 'web_search') {
    return collectViaWebSearch(source, maxLinks);
  }
  return { entries: [], notModified: false, error: `unsupported adapter: ${source.adapter}` };
}
