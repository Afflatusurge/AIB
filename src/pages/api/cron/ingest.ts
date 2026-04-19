// Vercel Cron endpoint: one OpenAI Responses API call with web search
// discovers today's AI news, generates trilingual briefs, and upserts them
// into Supabase. No external RSS aggregator required.
//
// Authentication: Vercel Cron sets `Authorization: Bearer <CRON_SECRET>`
// automatically when the CRON_SECRET project env var is defined. Manual
// invocations can pass `?secret=<CRON_SECRET>` for convenience during dev.
//
// Query params:
//   max=<1..12>   target number of briefs (default 6)

import type { APIRoute } from 'astro';
import { runIngest } from '../../../lib/brief-ingest';

export const prerender = false;

function unauthorized(message: string) {
  return new Response(JSON.stringify({ ok: false, error: message }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}

function getCronSecret(): string | undefined {
  return (globalThis as any)?.process?.env?.CRON_SECRET
    ?? (import.meta as any)?.env?.CRON_SECRET;
}

function extractProvidedSecret(request: Request, url: URL): string | null {
  const header = request.headers.get('authorization') || '';
  const bearer = header.toLowerCase().startsWith('bearer ')
    ? header.slice(7).trim()
    : '';
  return bearer || url.searchParams.get('secret');
}

export const GET: APIRoute = async ({ request, url }) => {
  const expected = getCronSecret();
  if (expected) {
    const provided = extractProvidedSecret(request, url);
    if (!provided || provided !== expected) {
      return unauthorized('missing or invalid cron secret');
    }
  }

  const max = Number(url.searchParams.get('max') || '6');
  try {
    const report = await runIngest({ max: Number.isFinite(max) && max > 0 ? Math.min(max, 12) : 6 });
    return new Response(JSON.stringify({ ok: true, report }, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('[cron/ingest] fatal', err);
    return new Response(JSON.stringify({
      ok: false,
      error: err?.message || String(err),
    }, null, 2), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// Allow manual POST too (same behaviour), useful for first-run kick.
export const POST = GET;
