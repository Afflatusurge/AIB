import type { APIRoute } from 'astro';
import { syncContent, type ContentSyncTrigger } from '../../../lib/content-sync';
import type { CmsSection, Lang } from '../../../lib/notion';
import { supabaseAdmin } from '../../../lib/supabase';

export const prerender = false;

const SECTIONS = new Set<CmsSection>(['tools', 'cases', 'playbooks']);
const LANGS = new Set<Lang>(['en', 'zh', 'ja']);

function getCronSecret(): string | undefined {
  return (globalThis as any)?.process?.env?.CRON_SECRET
    ?? (import.meta as any)?.env?.CRON_SECRET;
}

function providedBearer(request: Request): string {
  const header = request.headers.get('authorization') || '';
  return header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : '';
}

async function providedSupabaseCronSecretIsValid(request: Request): Promise<boolean> {
  const candidate = request.headers.get('x-aiandbusiness-content-secret')?.trim();
  if (!candidate) return false;
  const { data, error } = await supabaseAdmin().rpc(
    'verify_content_sync_cron_secret',
    { candidate },
  );
  if (error) {
    console.error('[cron/content-sync] Supabase Cron authentication failed:', error.message);
    return false;
  }
  return data === true;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'private, no-store, max-age=0',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

async function readScope(request: Request, url: URL) {
  let body: any = {};
  if (request.method === 'POST') {
    try {
      body = await request.json();
    } catch {
      body = {};
    }
  }
  const sectionRaw = String(body?.section || url.searchParams.get('section') || '').trim();
  const langRaw = String(body?.lang || url.searchParams.get('lang') || '').trim();
  return {
    section: SECTIONS.has(sectionRaw as CmsSection) ? sectionRaw as CmsSection : undefined,
    lang: LANGS.has(langRaw as Lang) ? langRaw as Lang : undefined,
  };
}

const handler: APIRoute = async ({ request, url }) => {
  const expected = getCronSecret();
  const vercelAuthorized = !!expected && providedBearer(request) === expected;
  const supabaseAuthorized = vercelAuthorized
    ? false
    : await providedSupabaseCronSecretIsValid(request);

  if (!vercelAuthorized && !supabaseAuthorized) {
    return json({ ok: false, error: 'missing or invalid cron secret' }, 401);
  }

  try {
    const scope = await readScope(request, url);
    const trigger: ContentSyncTrigger = 'cron';
    const reports = await syncContent(trigger, scope);
    return json({ ok: true, reports });
  } catch (error: any) {
    console.error('[cron/content-sync] fatal:', error?.message || error);
    return json({ ok: false, error: error?.message || String(error) }, 500);
  }
};

export const GET = handler;
export const POST = handler;
