import type { APIRoute } from 'astro';
import { authenticateEditor } from '../../../lib/editor-auth';
import {
  listEditorialCandidates,
  reviewEditorialCandidate,
  type EditorialAction,
} from '../../../lib/news/editorial-review';

export const prerender = false;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ALLOWED_STATUSES = new Set([
  'all',
  'discovered',
  'researched',
  'drafted',
  'needs_review',
  'approved',
  'published',
  'rejected',
  'failed',
]);

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'private, no-store, max-age=0',
      'X-Content-Type-Options': 'nosniff',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}

async function authorize(request: Request) {
  try {
    return await authenticateEditor(request);
  } catch (error: any) {
    console.error('[api/editorial] authentication unavailable:', error?.message || error);
    return null;
  }
}

export const GET: APIRoute = async ({ request, url }) => {
  const editor = await authorize(request);
  if (!editor) return json({ ok: false, error: 'unauthorized' }, 401);

  const requestedStatus = (url.searchParams.get('status') || 'all').toLowerCase();
  const status = ALLOWED_STATUSES.has(requestedStatus) ? requestedStatus : 'all';
  const limit = Number(url.searchParams.get('limit') || '60');

  try {
    const candidates = await listEditorialCandidates({ status, limit });
    return json({
      ok: true,
      editor: editor.name,
      status,
      candidates,
    });
  } catch (error: any) {
    console.error('[api/editorial] list failed:', error?.message || error);
    return json({ ok: false, error: error?.message || String(error) }, 500);
  }
};

export const POST: APIRoute = async ({ request }) => {
  const editor = await authorize(request);
  if (!editor) return json({ ok: false, error: 'unauthorized' }, 401);

  let payload: any;
  try {
    payload = await request.json();
  } catch {
    return json({ ok: false, error: 'invalid JSON body' }, 400);
  }

  const candidateId = String(payload?.candidateId || '').trim();
  const action = String(payload?.action || '').trim().toLowerCase() as EditorialAction;
  const note = String(payload?.note || '').trim();
  if (!UUID_PATTERN.test(candidateId)) {
    return json({ ok: false, error: 'invalid candidateId' }, 400);
  }
  if (action !== 'approve' && action !== 'reject') {
    return json({ ok: false, error: 'action must be approve or reject' }, 400);
  }
  if (action === 'reject' && !note) {
    return json({ ok: false, error: 'a rejection reason is required' }, 400);
  }

  try {
    const result = await reviewEditorialCandidate({
      candidateId,
      action,
      actor: editor.name,
      note,
    });
    return json({ ok: true, result });
  } catch (error: any) {
    console.error('[api/editorial] review failed:', {
      candidateId,
      action,
      message: error?.message || String(error),
    });
    return json({ ok: false, error: error?.message || String(error) }, 500);
  }
};
