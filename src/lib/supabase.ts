import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// ── Env resolution ────────────────────────────────────────────
// Supabase is used in two roles:
//  1. Astro SSR pages read the Daily Brief with the *publishable* (anon) key,
//     relying on RLS `status = 'published'` policy.
//  2. The Vercel cron / migration scripts write with the *service_role* key,
//     which bypasses RLS.
//
// Env var names:
//   SUPABASE_URL                    – https://<project>.supabase.co
//   SUPABASE_PUBLISHABLE_KEY        – sb_publishable_... (public / safe)
//   SUPABASE_SECRET_KEY             – sb_secret_... (preferred server key)
//   SUPABASE_SERVICE_ROLE_KEY       – legacy JWT server key (fallback)
//
// `PUBLIC_*` mirrors are optional for client-side bundling.

function resolve(name: string): string {
  const metaEnv = (import.meta as any)?.env?.[name];
  if (metaEnv) return metaEnv as string;
  return (globalThis as any)?.process?.env?.[name] || '';
}

function normalizeUrl(raw: string): string {
  if (!raw) return '';
  const trimmed = raw.trim().replace(/\/+$/, '');
  // Guard: dashboard URL is a common copy-paste mistake — reject with a clear msg.
  if (/supabase\.com\/dashboard\//i.test(trimmed)) {
    throw new Error(
      'SUPABASE_URL is a Supabase dashboard link; it must be the API URL, e.g. https://<project-ref>.supabase.co'
    );
  }
  // Must be https://<something>.supabase.co (self-hosted Supabase uses different
  // domains, which we don't try to validate here).
  if (trimmed && !/^https?:\/\//i.test(trimmed)) {
    throw new Error(`SUPABASE_URL missing protocol (got: "${trimmed}")`);
  }
  return trimmed;
}

export function getSupabaseUrl(): string {
  return normalizeUrl(resolve('SUPABASE_URL') || resolve('PUBLIC_SUPABASE_URL'));
}

export function getPublishableKey(): string {
  return (
    resolve('SUPABASE_PUBLISHABLE_KEY') ||
    resolve('PUBLIC_SUPABASE_PUBLISHABLE_KEY') ||
    resolve('SUPABASE_ANON_KEY') ||
    resolve('PUBLIC_SUPABASE_ANON_KEY')
  );
}

export function getServiceRoleKey(): string {
  return resolve('SUPABASE_SECRET_KEY') || resolve('SUPABASE_SERVICE_ROLE_KEY');
}

let readClient: SupabaseClient | null = null;
let writeClient: SupabaseClient | null = null;

/** Read-only Supabase client (anon/publishable). Safe to use on server or browser. */
export function supabaseRead(): SupabaseClient {
  if (readClient) return readClient;
  const url = getSupabaseUrl();
  const key = getPublishableKey();
  if (!url || !key) {
    throw new Error('Supabase not configured: set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY');
  }
  readClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { 'X-Client-Info': 'aiandbusiness/daily-brief' } },
  });
  return readClient;
}

/** Admin Supabase client (service role). Never expose to the browser. */
export function supabaseAdmin(): SupabaseClient {
  if (writeClient) return writeClient;
  const url = getSupabaseUrl();
  const key = getServiceRoleKey();
  if (!url || !key) {
    throw new Error(
      'Supabase admin not configured: set SUPABASE_URL and SUPABASE_SECRET_KEY (or legacy SUPABASE_SERVICE_ROLE_KEY)'
    );
  }
  writeClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return writeClient;
}

// ── Domain types mirroring the schema ────────────────────────
export type Lang = 'en' | 'zh' | 'ja';

export interface BriefRecord {
  id: string;
  slug: string;
  source_url: string | null;
  source_name: string | null;
  source_item_id: string | null;
  category: string | null;
  impact: 'major' | 'notable' | 'routine' | null;
  status: 'draft' | 'published';
  featured: boolean;
  published_at: string;
  candidate_id: string | null;
  content_kind: string | null;
  editorial_status: string | null;
  source_kind: string | null;
  source_reliability: string | null;
  source_independent: boolean | null;
  source_published_at: string | null;
  source_updated_at: string | null;
  verified_at: string | null;
  verification_status: string | null;
  confidence: string | null;
  quality_score: number | null;
  editorial_flags: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface BriefTranslationRecord {
  id: string;
  brief_id: string;
  lang: Lang;
  title: string;
  snippet: string | null;
  commentary: string | null;
  why_it_matters: string | null;
  body_html: string | null;
  what_happened: string | null;
  key_facts: unknown[] | null;
  action_now: string | null;
  watch_next: string | null;
  caveat: string | null;
  source_note: string | null;
}

/** What SignalFeed / article pages actually render. */
export interface BriefView {
  id: string;
  slug: string;
  title: string;
  snippet: string;
  category: string;
  impact: string;
  date: string;
  sourcePublishedDate: string;
  sourceUpdatedDate: string;
  sourceUrl: string;
  sourceName: string;
  sourceKind: string;
  sourceReliability: string;
  sourceIndependent: boolean | null;
  verificationStatus: string;
  confidence: string;
  contentKind: string;
  eventType: string;
  eventPriority: string;
  commentary: string;
  whyItMatters: string;
  bodyHtml: string;
  whatHappened: string;
  keyFacts: unknown[];
  actionNow: string;
  watchNext: string;
  caveat: string;
  sourceNote: string;
  featured: boolean;
}

function cap(s: string | null): string {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function toView(brief: BriefRecord, tr: BriefTranslationRecord | undefined): BriefView | null {
  if (!tr) return null;
  return {
    id: brief.id,
    slug: brief.slug,
    title: tr.title,
    snippet: tr.snippet || '',
    category: brief.category || 'AI',
    impact: cap(brief.impact) || 'Notable',
    date: brief.published_at.slice(0, 10),
    sourcePublishedDate: brief.source_published_at?.slice(0, 10) || '',
    sourceUpdatedDate: brief.source_updated_at?.slice(0, 10) || '',
    sourceUrl: brief.source_url || '',
    sourceName: brief.source_name || '',
    sourceKind: brief.source_kind || '',
    sourceReliability: brief.source_reliability || '',
    sourceIndependent: brief.source_independent,
    verificationStatus: brief.verification_status || '',
    confidence: brief.confidence || '',
    contentKind: brief.content_kind || 'signal',
    eventType: String(brief.editorial_flags?.event_type || ''),
    eventPriority: String(brief.editorial_flags?.event_priority || ''),
    commentary: tr.commentary || '',
    whyItMatters: tr.why_it_matters || '',
    bodyHtml: tr.body_html || '',
    whatHappened: tr.what_happened || '',
    keyFacts: Array.isArray(tr.key_facts) ? tr.key_facts : [],
    actionNow: tr.action_now || '',
    watchNext: tr.watch_next || '',
    caveat: tr.caveat || '',
    sourceNote: tr.source_note || '',
    featured: !!brief.featured,
  };
}

function isRenderableBrief(view: BriefView): boolean {
  const text = `${view.title} ${view.snippet} ${view.commentary} ${view.whyItMatters}`.toLowerCase();

  // Filter out obvious placeholder / fabricated-company outputs that slipped
  // through earlier ingest runs.
  if (/\b(xyz|abc|def|mno|jkl)\b/i.test(view.title)) return false;

  // Require a real source and some editorial substance.
  if (!view.sourceUrl || !view.sourceName || view.sourceName === 'Unknown') return false;
  if (!view.title.trim()) return false;
  if (!view.snippet.trim() && !view.commentary.trim() && !view.whyItMatters.trim()) return false;

  // Another lightweight guard against template-like filler.
  if (text.includes('placeholder') || text.includes('lorem ipsum')) return false;

  return true;
}

/** List all published briefs for a language, newest first. */
export async function listPublishedBriefs(lang: Lang, limit = 60): Promise<BriefView[]> {
  const db = supabaseRead();
  const { data, error } = await db
    .from('briefs')
    .select(`
      id, slug, source_url, source_name, source_item_id, category, impact,
      status, featured, published_at, candidate_id, content_kind, editorial_status,
      source_kind, source_reliability, source_independent, source_published_at,
      source_updated_at, verified_at, verification_status, confidence, quality_score,
      editorial_flags, created_at, updated_at,
      brief_translations!inner (
        lang, title, snippet, commentary, why_it_matters, body_html,
        what_happened, key_facts, action_now, watch_next, caveat, source_note
      )
    `)
    .eq('status', 'published')
    .eq('brief_translations.lang', lang)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[supabase] listPublishedBriefs:', error.message);
    return [];
  }
  const views: BriefView[] = [];
  for (const row of (data as any[]) || []) {
    const tr = row.brief_translations?.[0];
    const v = toView(row, tr);
    if (v && isRenderableBrief(v)) views.push(v);
  }
  return views;
}

export async function getBriefBySlug(slug: string, lang: Lang): Promise<BriefView | null> {
  const db = supabaseRead();
  const { data, error } = await db
    .from('briefs')
    .select(`
      id, slug, source_url, source_name, source_item_id, category, impact,
      status, featured, published_at, candidate_id, content_kind, editorial_status,
      source_kind, source_reliability, source_independent, source_published_at,
      source_updated_at, verified_at, verification_status, confidence, quality_score,
      editorial_flags, created_at, updated_at,
      brief_translations (
        lang, title, snippet, commentary, why_it_matters, body_html,
        what_happened, key_facts, action_now, watch_next, caveat, source_note
      )
    `)
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();

  if (error) {
    console.error('[supabase] getBriefBySlug:', error.message);
    return null;
  }
  if (!data) return null;
  const translations = (data as any).brief_translations || [];
  const preferred =
    translations.find((t: any) => t.lang === lang) ||
    translations.find((t: any) => t.lang === 'en') ||
    translations[0];
  const view = toView(data as any, preferred);
  return view && isRenderableBrief(view) ? view : null;
}
