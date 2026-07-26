// Quality gate for Daily Briefs.
//
// Philosophy: "Signal, not noise" — a brief with no verifiable entity, a
// fabricated source URL, or a recycled headline hurts trust more than an
// empty day. When in doubt, DROP the brief. Publishing fewer briefs is
// always acceptable; publishing hollow ones is not.
//
// Three layers:
//   1. checkBriefContent()  — sync heuristics: vague/template headlines,
//      missing verifiable entities (proper nouns / numbers), bad URLs.
//   2. isNearDuplicateTitle() — cross-day dedupe against recently
//      published titles (token-overlap similarity, not exact match).
//   3. verifySourceUrl()    — async liveness probe of the source link.
//      Fabricated URLs (the classic failure mode of search-preview models)
//      almost always 404. We fail CLOSED on 404/410 and DNS errors, and
//      fail OPEN on timeouts / bot-blocking (403/429) so flaky networks
//      don't zero out a good run.

import type { StructuredBrief } from './openai-brief';
import { findNewsSourceByUrl } from '../config/news-sources';

export interface QualityVerdict {
  ok: boolean;
  reasons: string[];
}

// ── 1. Content heuristics ────────────────────────────────────

// Headlines that describe a *category of event* instead of an event.
// These are the template-fallback patterns observed in production
// ("Major AI Tool Providers Announce Pricing Changes…", "Recent AI
// Research Offers Practical Solutions…").
const VAGUE_TITLE_PATTERNS: RegExp[] = [
  /\b(major|several|various|multiple|leading|top|key)\s+(ai\s+)?(tool\s+)?(providers?|companies|firms|players|startups|vendors|labs)\b/i,
  /\brecent\s+(ai\s+)?(research|studies|developments?|advances?)\b/i,
  /\b(ai\s+)?(industry|market|sector)\s+(sees|continues|experiences|shows)\b/i,
  /\bpractical\s+solutions?\s+for\b/i,
  /\bnew\s+ai\s+tools?\s+(emerge|arrive|launch)\b/i,
  /\bai\s+(landscape|ecosystem)\b/i,
];

// Placeholder / unusable source hosts.
const BANNED_HOSTS = new Set([
  'example.com', 'example.org', 'example.net', 'localhost',
  'test.com', 'placeholder.com', 'source.com', 'news.com',
]);

// Words that look like proper nouns but aren't verifiable entities.
const ENTITY_STOPWORDS = new Set([
  'ai', 'the', 'a', 'an', 'new', 'major', 'recent', 'this', 'that',
  'for', 'and', 'with', 'from', 'into', 'how', 'why', 'what', 'when',
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
  'january', 'february', 'march', 'april', 'may', 'june', 'july',
  'august', 'september', 'october', 'november', 'december',
  'tool', 'tools', 'model', 'models', 'agent', 'agents', 'api', 'apis',
  'llm', 'llms', 'gpu', 'gpus', 'startup', 'startups', 'research',
  'pricing', 'update', 'updates', 'launch', 'launches', 'report',
  'developers', 'builders', 'solopreneurs', 'business', 'week', 'today',
]);

/**
 * Does the text contain at least one verifiable entity?
 * Accepts: a number ($20, 40%, 128k, v2.5, 2026) or a proper-noun-ish
 * token (Capitalized / CamelCase / ALL-CAPS ≥2 chars) outside the stopword list.
 */
export function hasVerifiableEntity(text: string): boolean {
  if (!text) return false;

  // Concrete numbers: prices, percentages, versions, quantities.
  if (/(\$|€|¥|£)\s?\d/.test(text)) return true;
  if (/\d+(\.\d+)?\s?(%|percent|million|billion|k\b|x\b)/i.test(text)) return true;
  if (/\bv?\d+(\.\d+)+\b/.test(text)) return true; // versions like 2.5 / v4.1

  // Proper-noun-ish tokens: CamelCase (OpenAI, DeepSeek), ALL CAPS (AWS),
  // or Capitalized words that survive the stopword filter.
  const tokens = text.split(/[^A-Za-z0-9$%.]+/).filter(Boolean);
  for (const tok of tokens) {
    const lower = tok.toLowerCase().replace(/[.,;:!?]+$/, '');
    if (ENTITY_STOPWORDS.has(lower)) continue;
    if (/^[A-Z][a-z]+[A-Z]/.test(tok)) return true;               // CamelCase
    if (/^[A-Z]{2,6}$/.test(tok) && lower !== 'ai') return true;  // acronym
    if (/^[A-Z][a-z]{2,}$/.test(tok)) return true;                // Capitalized
  }
  return false;
}

/** Structural sanity of the claimed source URL (no network). */
export function isPlausibleSourceUrl(url: string): boolean {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return false;
  }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return false;
  const host = u.hostname.toLowerCase().replace(/^www\./, '');
  if (!host.includes('.')) return false;
  if (BANNED_HOSTS.has(host)) return false;
  return true;
}

export function checkBriefContent(brief: StructuredBrief): QualityVerdict {
  const reasons: string[] = [];
  const title = brief.en?.title || '';
  const snippet = brief.en?.snippet || '';
  const bodyText = (brief.en?.body_html || '').replace(/<[^>]+>/g, ' ');

  for (const pattern of VAGUE_TITLE_PATTERNS) {
    if (pattern.test(title)) {
      reasons.push(`vague/template headline (matched ${pattern})`);
      break;
    }
  }

  // The headline OR the snippet must name something checkable; the body
  // must too (a specific headline with a hollow body is still hollow).
  if (!hasVerifiableEntity(`${title} ${snippet}`)) {
    reasons.push('no verifiable entity (company/product/number) in title+snippet');
  }
  if (bodyText.trim() && !hasVerifiableEntity(bodyText)) {
    reasons.push('no verifiable entity in body');
  }

  if (!isPlausibleSourceUrl(brief.source_url)) {
    reasons.push(`implausible source_url: ${brief.source_url}`);
  } else {
    const policy = findNewsSourceByUrl(brief.source_url);
    if (!policy) {
      reasons.push('unapproved source domain');
    } else if (!policy.allowDiscovery || policy.reliability === 'blocked') {
      reasons.push(`source blocked by policy: ${policy.slug}`);
    } else if (policy.reliability === 'C' || policy.kind === 'vendor_marketing') {
      reasons.push(`source requires rejection or manual approval: ${policy.slug}`);
    }
  }

  const publishedAt = new Date(brief.published_at);
  if (Number.isNaN(publishedAt.getTime())) {
    reasons.push('missing or invalid exact source publication date');
  } else if (publishedAt.getTime() > Date.now() + 6 * 60 * 60 * 1000) {
    reasons.push('source publication date is implausibly in the future');
  }

  return { ok: reasons.length === 0, reasons };
}

// ── 2. Cross-day title dedupe ────────────────────────────────

function titleTokens(title: string): Set<string> {
  return new Set(
    title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !ENTITY_STOPWORDS.has(w))
  );
}

/** Jaccard similarity of significant title tokens. */
export function titleSimilarity(a: string, b: string): number {
  const ta = titleTokens(a);
  const tb = titleTokens(b);
  if (ta.size === 0 || tb.size === 0) return 0;
  let inter = 0;
  for (const w of ta) if (tb.has(w)) inter++;
  return inter / (ta.size + tb.size - inter);
}

export function isNearDuplicateTitle(
  title: string,
  recentTitles: string[],
  threshold = 0.6
): string | null {
  for (const prev of recentTitles) {
    if (titleSimilarity(title, prev) >= threshold) return prev;
  }
  return null;
}

// ── 3. Source URL liveness ───────────────────────────────────

/**
 * Probe the source URL. Returns { ok, status } where ok=false means
 * "confidently dead" (404/410, unresolvable host). Bot walls (403/429),
 * method rejections (405) and timeouts count as ok — we only want to
 * catch fabricated links, not fight WAFs.
 */
export async function verifySourceUrl(
  url: string,
  timeoutMs = 6000
): Promise<{ ok: boolean; status?: number; error?: string }> {
  if (!isPlausibleSourceUrl(url)) return { ok: false, error: 'implausible url' };

  const probe = async (method: 'HEAD' | 'GET') => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, {
        method,
        redirect: 'follow',
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (compatible; AIandBusinessBot/1.0; +https://aiandbusiness.com)',
          Accept: 'text/html,application/xhtml+xml,*/*;q=0.8',
        },
      });
    } finally {
      clearTimeout(timer);
    }
  };

  try {
    let resp = await probe('HEAD');
    // Some servers reject HEAD outright — retry once with GET.
    if (resp.status === 405 || resp.status === 501) resp = await probe('GET');

    if (resp.status === 404 || resp.status === 410) {
      return { ok: false, status: resp.status };
    }
    return { ok: true, status: resp.status };
  } catch (err: any) {
    const msg = String(err?.message || err);
    // AbortError / generic network flake → fail open (don't punish slow sites).
    if (/abort/i.test(msg)) return { ok: true, error: 'timeout (fail-open)' };
    // DNS failure → the host doesn't exist → confidently dead.
    if (/ENOTFOUND|EAI_AGAIN|getaddrinfo/i.test(msg)) return { ok: false, error: msg };
    return { ok: true, error: `${msg} (fail-open)` };
  }
}

// ── Combined gate ────────────────────────────────────────────

export interface GateResult {
  brief: StructuredBrief;
  ok: boolean;
  reasons: string[];
}

export async function runQualityGate(
  briefs: StructuredBrief[],
  recentTitles: string[]
): Promise<GateResult[]> {
  const results: GateResult[] = [];
  const acceptedTitles: string[] = [];

  for (const brief of briefs) {
    const reasons: string[] = [];

    const content = checkBriefContent(brief);
    reasons.push(...content.reasons);

    const dupOf = isNearDuplicateTitle(
      brief.en?.title || '',
      [...recentTitles, ...acceptedTitles]
    );
    if (dupOf) reasons.push(`near-duplicate of recent title: "${dupOf}"`);

    // Only spend a network round-trip if the cheap checks passed.
    if (reasons.length === 0) {
      const live = await verifySourceUrl(brief.source_url);
      if (!live.ok) {
        reasons.push(
          `source_url dead (status=${live.status ?? 'n/a'}${live.error ? `, ${live.error}` : ''}): ${brief.source_url}`
        );
      }
    }

    const ok = reasons.length === 0;
    if (ok) acceptedTitles.push(brief.en?.title || '');
    results.push({ brief, ok, reasons });
  }

  return results;
}
