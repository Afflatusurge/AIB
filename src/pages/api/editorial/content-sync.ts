import type { APIRoute } from 'astro';
import { authenticateEditor } from '../../../lib/editor-auth';
import { syncContent } from '../../../lib/content-sync';
import type { CmsSection, Lang } from '../../../lib/notion';

export const prerender = false;

const SECTIONS = new Set<CmsSection>(['tools', 'cases', 'playbooks']);
const LANGS = new Set<Lang>(['en', 'zh', 'ja']);

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

export const POST: APIRoute = async ({ request }) => {
  const editor = await authenticateEditor(request);
  if (!editor) return json({ ok: false, error: 'unauthorized' }, 401);

  let payload: any = {};
  try {
    payload = await request.json();
  } catch {
    payload = {};
  }

  const sectionRaw = String(payload?.section || '').trim();
  const langRaw = String(payload?.lang || '').trim();
  if (sectionRaw && !SECTIONS.has(sectionRaw as CmsSection)) {
    return json({ ok: false, error: 'invalid section' }, 400);
  }
  if (langRaw && !LANGS.has(langRaw as Lang)) {
    return json({ ok: false, error: 'invalid lang' }, 400);
  }

  try {
    const reports = await syncContent('manual', {
      section: sectionRaw ? sectionRaw as CmsSection : undefined,
      lang: langRaw ? langRaw as Lang : undefined,
    });
    return json({ ok: true, editor: editor.name, reports });
  } catch (error: any) {
    console.error('[api/editorial/content-sync] failed:', error?.message || error);
    return json({ ok: false, error: error?.message || String(error) }, 500);
  }
};
