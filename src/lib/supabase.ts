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
//   SUPABASE_SERVICE_ROLE_KEY       – eyJhbGciOi... (server-only, secret)
//
// `PUBLIC_*` mirrors are optional for client-side bundling.

function resolve(name: string): string {
  const metaEnv = (import.meta as any)?.env?.[name];
  if (metaEnv) return metaEnv as string;
  return (globalThis as any)?.process?.env?.[name] || '';
}

export function getSupabaseUrl(): string {
  return resolve('SUPABASE_URL') || resolve('PUBLIC_SUPABASE_URL');
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
  return resolve('SUPABASE_SERVICE_ROLE_KEY');
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
    throw new Error('Supabase admin not configured: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
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
  sourceUrl: string;
  sourceName: string;
  commentary: string;
  whyItMatters: string;
  bodyHtml: string;
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
    sourceUrl: brief.source_url || '',
    sourceName: brief.source_name || '',
    commentary: tr.commentary || '',
    whyItMatters: tr.why_it_matters || '',
    bodyHtml: tr.body_html || '',
    featured: !!brief.featured,
  };
}

/** List all published briefs for a language, newest first. */
export async function listPublishedBriefs(lang: Lang, limit = 60): Promise<BriefView[]> {
  const db = supabaseRead();
  const { data, error } = await db
    .from('briefs')
    .select(`
      id, slug, source_url, source_name, source_item_id, category, impact,
      status, featured, published_at, created_at, updated_at,
      brief_translations!inner ( lang, title, snippet, commentary, why_it_matters, body_html )
    `)
    .eq('status', 'published')
    .eq('brief_translations.lang', lang)
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[supabase] listPublishedBriefs:', error.message);
    return [];
  }
  const views: BriefView[] = [];
  for (const row of (data as any[]) || []) {
    const tr = row.brief_translations?.[0];
    const v = toView(row, tr);
    if (v) views.push(v);
  }
  return views;
}

export async function getBriefBySlug(slug: string, lang: Lang): Promise<BriefView | null> {
  const db = supabaseRead();
  const { data, error } = await db
    .from('briefs')
    .select(`
      id, slug, source_url, source_name, source_item_id, category, impact,
      status, featured, published_at, created_at, updated_at,
      brief_translations ( lang, title, snippet, commentary, why_it_matters, body_html )
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
  return toView(data as any, preferred);
}
