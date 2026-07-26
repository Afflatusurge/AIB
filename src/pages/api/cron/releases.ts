// Watchlist release monitor.
//
// Runs four times daily and checks official model/product sources separately
// from the broader Daily Brief discovery job. P0 releases may publish
// automatically; incomplete or lower-priority events remain in needs_review.

import type { APIRoute } from 'astro';
import { runReleaseMonitor } from '../../../lib/news/release-monitor';
import { supabaseAdmin } from '../../../lib/supabase';

export const prerender = false;

function getCronSecret(): string | undefined {
  return (globalThis as any)?.process?.env?.CRON_SECRET
    ?? (import.meta as any)?.env?.CRON_SECRET;
}

function providedSecret(request: Request, url: URL): string | null {
  const header = request.headers.get('authorization') || '';
  const bearer = header.toLowerCase().startsWith('bearer ')
    ? header.slice(7).trim()
    : '';
  return bearer || url.searchParams.get('secret');
}

async function providedSupabaseCronSecretIsValid(request: Request): Promise<boolean> {
  const candidate = request.headers.get('x-aiandbusiness-release-secret')?.trim();
  if (!candidate) return false;

  const { data, error } = await supabaseAdmin().rpc(
    'verify_release_cron_secret',
    { candidate }
  );
  if (error) {
    console.error('[cron/releases] Supabase Cron authentication failed', error.message);
    return false;
  }
  return data === true;
}

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const GET: APIRoute = async ({ request, url }) => {
  const expected = getCronSecret();
  const vercelCronAuthorized = !!expected && providedSecret(request, url) === expected;
  const supabaseCronAuthorized = vercelCronAuthorized
    ? false
    : await providedSupabaseCronSecretIsValid(request);

  if (!expected && !request.headers.has('x-aiandbusiness-release-secret')) {
    return json({ ok: false, error: 'CRON_SECRET is not configured' }, 503);
  }
  if (!vercelCronAuthorized && !supabaseCronAuthorized) {
    return json({ ok: false, error: 'missing or invalid cron secret' }, 401);
  }

  const maxAgeRaw = Number(url.searchParams.get('maxAgeHours') || '72');
  const maxAgeHours = Number.isFinite(maxAgeRaw)
    ? Math.min(Math.max(maxAgeRaw, 6), 168)
    : 72;

  try {
    const report = await runReleaseMonitor({ maxAgeHours });
    console.log('[cron/releases] completed', report);
    return json({ ok: true, report });
  } catch (err: any) {
    console.error('[cron/releases] fatal', err);
    return json({ ok: false, error: err?.message || String(err) }, 500);
  }
};

export const POST = GET;
