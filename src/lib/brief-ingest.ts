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

import { generateDailyBriefs, type StructuredBrief } from './openai-brief';
import { supabaseAdmin } from './supabase';

export interface IngestReport {
  requested: number;
  generated: number;
  skipped: number;    // returned by the model but already in Supabase (URL match)
  inserted: number;   // newly written
  failed: number;
  errors: Array<{ slug?: string; sourceUrl?: string; message: string }>;
}

/**
 * Run one autonomous ingest pass.
 *
 * @param opts.max  Target number of briefs (1..12). Default 6.
 */
export async function runIngest(opts: { max?: number } = {}): Promise<IngestReport> {
  const target = Math.min(Math.max(opts.max ?? 6, 1), 12);
  const report: IngestReport = {
    requested: target,
    generated: 0,
    skipped: 0,
    inserted: 0,
    failed: 0,
    errors: [],
  };

  const db = supabaseAdmin();

  // Gather recent URLs/titles so the LLM can avoid covering the same stories.
  const { data: recentRows, error: recentErr } = await db
    .from('briefs')
    .select('source_url, brief_translations!inner(title, lang)')
    .eq('brief_translations.lang', 'en')
    .order('published_at', { ascending: false })
    .limit(40);
  if (recentErr) throw new Error(`recent lookup failed: ${recentErr.message}`);

  const excludeUrls = (recentRows || [])
    .map((r: any) => r.source_url)
    .filter(Boolean) as string[];
  const excludeTitles = (recentRows || [])
    .flatMap((r: any) => (Array.isArray(r.brief_translations) ? r.brief_translations : []))
    .map((t: any) => t?.title)
    .filter(Boolean) as string[];

  // Call the LLM (one shot: search + summarize + translate).
  const briefs = await generateDailyBriefs({
    max: target,
    excludeUrls,
    excludeTitles,
  });
  report.generated = briefs.length;
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
      await upsertBrief(brief);
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

async function upsertBrief(s: StructuredBrief): Promise<void> {
  const db = supabaseAdmin();

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
    published_at: s.published_at,
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
    body_html: s[lang].body_html,
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
