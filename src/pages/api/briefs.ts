// JSON endpoint used by the homepage SignalFeed island to hydrate the
// Daily Brief list with live Supabase content (no redeploy required).
//
// GET /api/briefs?lang=en&limit=6

import type { APIRoute } from 'astro';
import { listPublishedBriefs, type Lang } from '../../lib/supabase';

export const prerender = false;

const ALLOWED_LANGS: Lang[] = ['en', 'zh', 'ja'];

export const GET: APIRoute = async ({ url }) => {
  const langParam = (url.searchParams.get('lang') || 'en').toLowerCase() as Lang;
  const lang: Lang = ALLOWED_LANGS.includes(langParam) ? langParam : 'en';
  const limitRaw = Number(url.searchParams.get('limit') || '8');
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 30) : 8;

  try {
    const briefs = await listPublishedBriefs(lang, limit);
    const payload = briefs.map((b) => ({
      id: b.id,
      slug: b.slug,
      title: b.title,
      snippet: b.snippet,
      category: b.category,
      impact: b.impact,
      date: b.date,
      commentary: b.commentary,
      sourceName: b.sourceName,
    }));
    return new Response(JSON.stringify({ ok: true, lang, briefs: payload }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (err: any) {
    console.error('[api/briefs]', err);
    return new Response(JSON.stringify({ ok: false, error: err?.message || String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
