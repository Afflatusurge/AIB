import {
  getNotionContentSnapshot,
  getPageContentForSync,
  type CmsSection,
  type Lang,
  type NotionContentSnapshotEntry,
} from './notion';
import { supabaseAdmin } from './supabase';

export type ContentSyncTrigger = 'manual' | 'cron' | 'deploy' | 'api';

export interface ContentSyncScope {
  section: CmsSection;
  lang: Lang;
}

export interface ContentSyncReport extends ContentSyncScope {
  runId: string;
  scanned: number;
  changed: number;
  unchanged: number;
  published: number;
  draft: number;
  archived: number;
  failed: number;
  durationMs: number;
  errors: Array<{ pageId: string; slug: string; message: string }>;
}

interface ExistingRow {
  notion_page_id: string;
  notion_last_edited_at: string;
  body_html: string;
}

const SECTIONS: CmsSection[] = ['tools', 'cases', 'playbooks'];
const LANGS: Lang[] = ['en', 'zh', 'ja'];
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function normalizeTimestamp(value: string): string {
  return new Date(value).toISOString();
}

async function mapWithConcurrency<T, R>(
  values: T[],
  limit: number,
  task: (value: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(values.length);
  let cursor = 0;

  async function worker() {
    while (cursor < values.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await task(values[index]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, Math.max(values.length, 1)) }, () => worker()),
  );
  return results;
}

async function createRun(trigger: ContentSyncTrigger, scope: ContentSyncScope): Promise<string> {
  const { data, error } = await supabaseAdmin()
    .from('cms_sync_runs')
    .insert({
      trigger,
      section: scope.section,
      lang: scope.lang,
      status: 'running',
    })
    .select('id')
    .single();
  if (error) throw new Error(`Could not create CMS sync run: ${error.message}`);
  return data.id;
}

async function finishRun(
  runId: string,
  status: 'completed' | 'failed',
  report: Partial<ContentSyncReport>,
  error?: string,
) {
  const { error: updateError } = await supabaseAdmin()
    .from('cms_sync_runs')
    .update({
      status,
      scanned_count: report.scanned || 0,
      changed_count: report.changed || 0,
      unchanged_count: report.unchanged || 0,
      published_count: report.published || 0,
      draft_count: report.draft || 0,
      archived_count: report.archived || 0,
      failed_count: report.failed || 0,
      details: { errors: report.errors || [], durationMs: report.durationMs || 0 },
      error: error || null,
      finished_at: new Date().toISOString(),
    })
    .eq('id', runId);

  if (updateError) {
    console.error('[content-sync] Could not finish run:', updateError.message);
  }
}

export async function syncContentScope(
  scope: ContentSyncScope,
  trigger: ContentSyncTrigger,
): Promise<ContentSyncReport> {
  const startedAt = Date.now();
  const runId = await createRun(trigger, scope);
  let partial: Partial<ContentSyncReport> = { runId, ...scope, errors: [] };

  try {
    const db = supabaseAdmin();
    const snapshot = await getNotionContentSnapshot(scope.section, scope.lang);
    const databaseId = snapshot[0]?.databaseId;

    const existingQuery = db
      .from('cms_content')
      .select('notion_page_id, notion_last_edited_at, body_html')
      .eq('section', scope.section)
      .eq('lang', scope.lang);
    const { data: existingData, error: existingError } = await existingQuery;
    if (existingError) throw new Error(`Could not read existing CMS content: ${existingError.message}`);

    const existing = new Map(
      ((existingData || []) as ExistingRow[]).map((row) => [row.notion_page_id, row]),
    );
    const changed = snapshot.filter((entry) => {
      const previous = existing.get(entry.pageId);
      return !previous ||
        normalizeTimestamp(previous.notion_last_edited_at) !== normalizeTimestamp(entry.lastEditedAt);
    });
    const errors: ContentSyncReport['errors'] = [];

    const prepared = await mapWithConcurrency(changed, 3, async (entry) => {
      if (!SLUG_PATTERN.test(entry.item.slug)) {
        errors.push({
          pageId: entry.pageId,
          slug: entry.item.slug,
          message: 'Slug must contain lowercase letters, numbers, and hyphens only',
        });
        return null;
      }

      try {
        const previous = existing.get(entry.pageId);
        const bodyHtml = entry.visible
          ? await getPageContentForSync(entry.pageId)
          : previous?.body_html || '';
        const now = new Date().toISOString();
        return {
          section: scope.section,
          lang: scope.lang,
          slug: entry.item.slug,
          status: entry.visible ? 'published' : 'draft',
          title: entry.item.title,
          snippet: entry.item.snippet || '',
          featured: !!entry.item.featured,
          published_at: entry.item.date || null,
          body_html: bodyHtml,
          payload: entry.item,
          notion_page_id: entry.pageId,
          notion_database_id: entry.databaseId,
          notion_last_edited_at: entry.lastEditedAt,
          source_synced_at: now,
          updated_at: now,
        };
      } catch (error: any) {
        errors.push({
          pageId: entry.pageId,
          slug: entry.item.slug,
          message: error?.message || String(error),
        });
        return null;
      }
    });

    const rows = prepared.filter((row): row is NonNullable<typeof row> => !!row);
    if (rows.length) {
      const { error } = await db
        .from('cms_content')
        .upsert(rows, { onConflict: 'notion_page_id' });
      if (error) throw new Error(`Could not upsert CMS content: ${error.message}`);
    }

    const currentIds = new Set(snapshot.map((entry) => entry.pageId));
    const archivedIds = Array.from(existing.keys()).filter((id) => !currentIds.has(id));
    if (archivedIds.length) {
      const { error } = await db
        .from('cms_content')
        .update({
          status: 'archived',
          source_synced_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .in('notion_page_id', archivedIds);
      if (error) throw new Error(`Could not archive removed CMS content: ${error.message}`);
    }

    // Empty databases still need a source id for the reconciliation above.
    if (!databaseId && snapshot.length === 0 && existing.size > 0) {
      console.warn(`[content-sync] Empty Notion scope ${scope.section}/${scope.lang}; existing rows archived`);
    }

    const successfulPageIds = new Set(rows.map((row) => row.notion_page_id));
    const published = snapshot.filter((entry) => entry.visible && (
      !changed.some((candidate) => candidate.pageId === entry.pageId) ||
      successfulPageIds.has(entry.pageId)
    )).length;
    const draft = snapshot.filter((entry) => !entry.visible && (
      !changed.some((candidate) => candidate.pageId === entry.pageId) ||
      successfulPageIds.has(entry.pageId)
    )).length;

    const report: ContentSyncReport = {
      runId,
      ...scope,
      scanned: snapshot.length,
      changed: changed.length,
      unchanged: snapshot.length - changed.length,
      published,
      draft,
      archived: archivedIds.length,
      failed: errors.length,
      durationMs: Date.now() - startedAt,
      errors,
    };
    partial = report;
    await finishRun(runId, errors.length ? 'failed' : 'completed', report);
    return report;
  } catch (error: any) {
    const message = error?.message || String(error);
    partial.durationMs = Date.now() - startedAt;
    await finishRun(runId, 'failed', partial, message);
    throw error;
  }
}

export async function syncContent(
  trigger: ContentSyncTrigger,
  requested?: Partial<ContentSyncScope>,
): Promise<ContentSyncReport[]> {
  const scopes: ContentSyncScope[] = [];
  for (const section of requested?.section ? [requested.section] : SECTIONS) {
    for (const lang of requested?.lang ? [requested.lang] : LANGS) {
      scopes.push({ section, lang });
    }
  }

  const reports: ContentSyncReport[] = [];
  for (const scope of scopes) {
    try {
      reports.push(await syncContentScope(scope, trigger));
    } catch (error: any) {
      const message = error?.message || String(error);
      console.error(`[content-sync] Scope failed (${scope.section}/${scope.lang}):`, message);
      reports.push({
        runId: '',
        ...scope,
        scanned: 0,
        changed: 0,
        unchanged: 0,
        published: 0,
        draft: 0,
        archived: 0,
        failed: 1,
        durationMs: 0,
        errors: [{ pageId: '', slug: '', message }],
      });
    }
  }
  return reports;
}
