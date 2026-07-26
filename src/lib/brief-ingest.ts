// Daily Brief ingest pipeline (LLM-autonomous version).
//
// Flow:
//   1. Peek at Supabase to learn which source URLs / recent titles are
//      already covered (so we can tell the model to avoid them).
//   2. Call generateDailyBriefs() — one OpenAI Responses API call that
//      uses web_search_preview to discover today's AI news and returns
//      structured EN/ZH/JA JSON.
//   3. Upsert each brief into `briefs` + `brief_translations`, applying
//      a slug-collision guard and final URL-based dedupe.
//
// Used by /api/cron/ingest (Vercel Cron) and callable manually for smoke
// tests via `curl -H "Authorization: Bearer $CRON_SECRET" …/api/cron/ingest`.

import { discoverNews, editBriefs, type StructuredBrief, type DiscoveredItem } from './openai-brief';
import { runQualityGate, verifySourceUrl, isPlausibleSourceUrl } from './brief-quality';
import { discoverFromRss } from './rss-discover';
import { supabaseAdmin } from './supabase';
import { findNewsSourceByUrl } from '../config/news-sources';
import { load } from 'cheerio';

export interface IngestReport {
  requested: number;
  generated: number;
  rejected: number;   // failed the quality gate (vague content, dead URL, dupe title)
  skipped: number;    // returned by the model but already in Supabase (URL match)
  inserted: number;   // newly written
  failed: number;
  errors: Array<{ slug?: string; sourceUrl?: string; message: string }>;
  rejections: Array<{ title?: string; sourceUrl?: string; reasons: string[] }>;
  discovery?: { llm: number; llmVerified: number; rss: number };
}

/**
 * Run one autonomous ingest pass.
 *
 * @param opts.max  Maximum number of briefs (1..12). Default 3.
 */
export async function runIngest(opts: { max?: number } = {}): Promise<IngestReport> {
  const target = Math.min(Math.max(opts.max ?? 3, 1), 12);
  const report: IngestReport = {
    requested: target,
    generated: 0,
    rejected: 0,
    skipped: 0,
    inserted: 0,
    failed: 0,
    errors: [],
    rejections: [],
  };

  const db = supabaseAdmin();

  // Gather recent URLs/titles so the LLM can avoid covering the same stories.
  // Two simple queries (avoids PostgREST embedded-resource filter quirks).
  const { data: recentBriefs, error: briefErr } = await db
    .from('briefs')
    .select('id, source_url')
    .order('published_at', { ascending: false })
    .limit(40);
  if (briefErr) throw new Error(`recent briefs lookup failed: ${briefErr.message}`);

  const excludeUrls = (recentBriefs || [])
    .map((r: any) => r.source_url)
    .filter(Boolean) as string[];

  let excludeTitles: string[] = [];
  const briefIds = (recentBriefs || []).map((r: any) => r.id).filter(Boolean);
  if (briefIds.length > 0) {
    const { data: trRows, error: trErr } = await db
      .from('brief_translations')
      .select('title')
      .eq('lang', 'en')
      .in('brief_id', briefIds);
    if (trErr) {
      // Non-fatal: we can still run ingest without title hints.
      console.warn('[ingest] recent titles lookup failed (continuing):', trErr.message);
    } else {
      excludeTitles = (trRows || [])
        .map((t: any) => t?.title)
        .filter(Boolean) as string[];
    }
  }

  // ── Discovery: LLM search first, RSS as deterministic backstop ──
  //
  // The search-preview model can silently fail its web search and fabricate
  // stories with fake URLs. Verify every LLM-discovered URL is alive BEFORE
  // it can occupy an editor slot; fill whatever is missing with real items
  // from RSS feeds. Both paths still pass through the editor + quality gate.
  let llmItems: DiscoveredItem[] = [];
  try {
    llmItems = await discoverNews({ max: target, excludeUrls, excludeTitles });
  } catch (err) {
    console.warn('[ingest] LLM discovery failed, falling back to RSS only:', err);
  }

  const verifiedItems: DiscoveredItem[] = [];
  for (const item of llmItems) {
    if (!isPlausibleSourceUrl(item.url)) continue;
    const policy = findNewsSourceByUrl(item.url);
    if (
      !policy ||
      !policy.allowDiscovery ||
      policy.reliability === 'blocked' ||
      policy.reliability === 'C' ||
      policy.kind === 'vendor_marketing'
    ) {
      console.warn('[ingest] dropping discovery item from unapproved source:', item.url);
      continue;
    }
    const live = await verifySourceUrl(item.url);
    if (live.ok) {
      verifiedItems.push(item);
    } else {
      console.warn('[ingest] dropping LLM discovery item with dead URL:', item.url);
    }
    if (verifiedItems.length >= target) break;
  }

  let feed = verifiedItems;
  if (feed.length < target) {
    const rssItems = await discoverFromRss({
      excludeUrls: [...excludeUrls, ...verifiedItems.map((i) => i.url)],
      maxItems: target - feed.length,
      maxAgeHours: 48,
    });
    feed = [...verifiedItems, ...rssItems];
  }
  report.discovery = {
    llm: llmItems.length,
    llmVerified: verifiedItems.length,
    rss: feed.length - verifiedItems.length,
  };

  const generatedBriefs = feed.length > 0 ? await editBriefs(feed.slice(0, target)) : [];
  const structurallyValid = generatedBriefs.filter(isAcceptableBrief);
  report.generated = structurallyValid.length;

  // Quality gate: verifiable entities, live source URLs, cross-day title
  // dedupe. Publishing fewer briefs beats publishing hollow ones — anything
  // that fails is dropped and logged, never "fixed up".
  const gated = await runQualityGate(structurallyValid, excludeTitles);
  const briefs: StructuredBrief[] = [];
  for (const g of gated) {
    if (g.ok) {
      briefs.push(g.brief);
    } else {
      report.rejected++;
      report.rejections.push({
        title: g.brief.en?.title,
        sourceUrl: g.brief.source_url,
        reasons: g.reasons,
      });
      console.warn('[ingest] quality gate rejected', g.brief.en?.title, g.reasons);
    }
  }
  if (briefs.length === 0) return report;

  // Secondary dedupe by source_url (model can still overlap with our list).
  const incomingUrls = briefs.map((b) => b.source_url).filter(Boolean);
  const { data: dupeRows } = await db
    .from('briefs')
    .select('source_url')
    .in('source_url', incomingUrls);
  const alreadySeen = new Set((dupeRows || []).map((r: any) => r.source_url));

  for (const brief of briefs) {
    if (alreadySeen.has(brief.source_url)) {
      report.skipped++;
      continue;
    }
    try {
      await publishBrief(brief);
      report.inserted++;
      alreadySeen.add(brief.source_url);
    } catch (err: any) {
      report.failed++;
      report.errors.push({
        slug: brief.slug,
        sourceUrl: brief.source_url,
        message: err?.message || String(err),
      });
      console.error('[ingest] failed brief', brief.slug, err);
    }
  }

  return report;
}

function isAcceptableBrief(brief: StructuredBrief): boolean {
  const title = `${brief.en?.title || ''} ${brief.zh?.title || ''} ${brief.ja?.title || ''}`;
  if (/\b(XYZ|ABC|DEF|MNO|JKL)\b/i.test(title)) return false;
  if (!brief.source_url || !brief.source_name || brief.source_name === 'Unknown') return false;

  const published = new Date(brief.published_at);
  if (Number.isNaN(published.getTime())) return false;

  const ageHours = (Date.now() - published.getTime()) / (1000 * 60 * 60);
  if (ageHours > 72 || ageHours < -6) return false;

  return true;
}

function sanitizeBriefHtml(raw: string): string {
  const $ = load(`<div data-brief-root>${raw || ''}</div>`, null, false);
  const root = $('[data-brief-root]');
  root.find('script, style, iframe, object, embed, form, input, button, img, svg').remove();
  const allowed = new Set([
    'h2', 'h3', 'p', 'ul', 'ol', 'li', 'strong', 'em', 'code', 'blockquote', 'br',
  ]);
  root.find('*').each((_, element) => {
    const tag = String((element as any).tagName || '').toLowerCase();
    if (!allowed.has(tag)) {
      $(element).replaceWith($(element).contents());
      return;
    }
    for (const attribute of Object.keys((element as any).attribs || {})) {
      $(element).removeAttr(attribute);
    }
  });
  return root.html() || '';
}

export async function publishBrief(s: StructuredBrief): Promise<void> {
  const db = supabaseAdmin();
  const sourcePolicy = findNewsSourceByUrl(s.source_url);
  if (!sourcePolicy) throw new Error(`cannot publish unapproved source: ${s.source_url}`);

  // Slug collision guard — if another brief already uses this slug, append a
  // short deterministic suffix derived from the URL.
  let slug = s.slug;
  const { data: slugHit } = await db
    .from('briefs')
    .select('id, source_url')
    .eq('slug', slug)
    .maybeSingle();
  if (slugHit && slugHit.source_url !== s.source_url) {
    const suffix = urlSuffix(s.source_url);
    slug = `${slug}-${suffix}`.slice(0, 80);
  }

  const briefRow = {
    slug,
    source_url: s.source_url,
    source_name: s.source_name || null,
    // source_item_id retained for schema compatibility; use URL as stable id.
    source_item_id: s.source_url,
    category: s.category,
    impact: s.impact,
    status: 'published' as const,
    featured: false,
    published_at: new Date().toISOString(),
    candidate_id: s.candidate_id || null,
    content_kind: s.content_kind || 'signal',
    editorial_status: 'published',
    source_kind: s.source_kind || sourcePolicy.kind,
    source_reliability: s.source_reliability || sourcePolicy.reliability,
    source_independent: s.source_independent ?? sourcePolicy.independent,
    source_published_at: s.published_at,
    verified_at: new Date().toISOString(),
    verification_status: s.verification_status || 'source_verified',
    confidence: s.confidence ||
      (sourcePolicy.kind === 'official_release' ? 'official_source' : 'reported'),
    quality_score: s.quality_score ?? null,
    editorial_flags: {
      ...(s.event_type ? { event_type: s.event_type } : {}),
      ...(s.event_priority ? { event_priority: s.event_priority } : {}),
      ...(sourcePolicy.kind === 'official_release' ? { vendor_claims_possible: true } : {}),
    },
  };

  const { data: inserted, error } = await db
    .from('briefs')
    .upsert(briefRow, { onConflict: 'source_item_id' })
    .select('id')
    .single();
  if (error) throw new Error(`briefs upsert: ${error.message}`);

  const translations = (['en', 'zh', 'ja'] as const).map((lang) => ({
    brief_id: inserted.id,
    lang,
    title: s[lang].title,
    snippet: s[lang].snippet,
    commentary: s[lang].commentary,
    why_it_matters: s[lang].why_it_matters,
    body_html: sanitizeBriefHtml(s[lang].body_html),
    what_happened: s[lang].snippet || null,
    key_facts: [],
    action_now: s[lang].why_it_matters || null,
    watch_next: null,
    caveat: sourcePolicy.kind === 'official_release'
      ? (lang === 'zh'
          ? '发布事实来自官方；性能与基准结论仍属于厂商口径，等待独立测试。'
          : lang === 'ja'
            ? 'リリース自体は公式情報で確認済みですが、性能やベンチマークはベンダー側の主張であり、独立検証が必要です。'
            : 'The release is confirmed by the official source; performance and benchmark claims still require independent testing.')
      : null,
    source_note: sourcePolicy.kind === 'official_release'
      ? (lang === 'zh'
          ? `官方来源：${s.source_name}`
          : lang === 'ja'
            ? `公式情報源：${s.source_name}`
            : `Official source: ${s.source_name}`)
      : null,
    translation_status: 'generated',
    translation_quality_flags: [],
  })).filter((t) => t.title);

  if (translations.length === 0) throw new Error('model returned no translations');

  const { error: trErr } = await db
    .from('brief_translations')
    .upsert(translations, { onConflict: 'brief_id,lang' });
  if (trErr) throw new Error(`brief_translations upsert: ${trErr.message}`);
}

function urlSuffix(url: string): string {
  // Deterministic 6-char hex from URL — stable across retries.
  let h = 0;
  for (let i = 0; i < url.length; i++) {
    h = (h * 31 + url.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(16).padStart(6, '0').slice(-6);
}
