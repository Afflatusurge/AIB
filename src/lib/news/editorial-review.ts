import { supabaseAdmin } from '../supabase';
import {
  publishReleaseCandidate,
  type PublishedReleaseCandidate,
} from './release-monitor';

export type EditorialAction = 'approve' | 'reject';

export interface EditorialCandidateView {
  id: string;
  title: string;
  summary: string;
  sourceUrl: string;
  sourceName: string;
  sourceSlug: string;
  sourcePublishedAt: string;
  eventType: string;
  priority: string;
  status: string;
  totalScore: number | null;
  factSheet: Record<string, unknown>;
  flags: unknown[];
  rejectionReasons: unknown[];
  createdAt: string;
  updatedAt: string;
  publishedSlug: string;
  publishedTitle: string;
  lastReview: {
    action: string;
    actor: string;
    note: string;
    createdAt: string;
  } | null;
}

interface ReviewOptions {
  status?: string;
  limit?: number;
}

function safeLimit(value: number | undefined): number {
  if (!Number.isFinite(value)) return 60;
  return Math.min(Math.max(Math.floor(value || 60), 1), 100);
}

export async function listEditorialCandidates(
  options: ReviewOptions = {}
): Promise<EditorialCandidateView[]> {
  const db = supabaseAdmin();
  let query = db
    .from('news_candidates')
    .select(`
      id, source_entry_id, event_type, priority, editorial_status,
      total_score, fact_sheet, flags, rejection_reasons, created_at, updated_at
    `)
    .order('created_at', { ascending: false })
    .limit(safeLimit(options.limit));
  if (options.status && options.status !== 'all') {
    query = query.eq('editorial_status', options.status);
  }

  const { data: candidates, error } = await query;
  if (error) throw new Error(`candidate list failed: ${error.message}`);
  if (!candidates?.length) return [];

  const candidateIds = candidates.map((row: any) => row.id);
  const entryIds = candidates.map((row: any) => row.source_entry_id);
  const { data: entries, error: entryError } = await db
    .from('source_entries')
    .select(`
      id, source_id, canonical_url, title, summary, source_published_at
    `)
    .in('id', entryIds);
  if (entryError) throw new Error(`source entry list failed: ${entryError.message}`);

  const sourceIds = [...new Set((entries || []).map((row: any) => row.source_id))];
  const { data: sources, error: sourceError } = sourceIds.length
    ? await db
        .from('news_sources')
        .select('id, slug, name')
        .in('id', sourceIds)
    : { data: [], error: null };
  if (sourceError) throw new Error(`source list failed: ${sourceError.message}`);

  const { data: briefs, error: briefError } = await db
    .from('briefs')
    .select('candidate_id, slug, brief_translations(lang, title)')
    .in('candidate_id', candidateIds);
  if (briefError) throw new Error(`published brief list failed: ${briefError.message}`);

  const { data: reviewEvents, error: reviewError } = await db
    .from('editorial_review_events')
    .select('candidate_id, action, actor, note, created_at')
    .in('candidate_id', candidateIds)
    .order('created_at', { ascending: false });
  if (reviewError) throw new Error(`review event list failed: ${reviewError.message}`);

  const entryById = new Map((entries || []).map((row: any) => [row.id, row]));
  const sourceById = new Map((sources || []).map((row: any) => [row.id, row]));
  const briefByCandidate = new Map((briefs || []).map((row: any) => [row.candidate_id, row]));
  const latestReviewByCandidate = new Map<string, any>();
  for (const event of reviewEvents || []) {
    if (!latestReviewByCandidate.has((event as any).candidate_id)) {
      latestReviewByCandidate.set((event as any).candidate_id, event);
    }
  }

  return candidates.map((candidate: any) => {
    const entry: any = entryById.get(candidate.source_entry_id);
    const source: any = entry ? sourceById.get(entry.source_id) : null;
    const brief: any = briefByCandidate.get(candidate.id);
    const englishTitle =
      brief?.brief_translations?.find((row: any) => row.lang === 'en')?.title ||
      brief?.brief_translations?.[0]?.title ||
      '';
    const review = latestReviewByCandidate.get(candidate.id);
    return {
      id: candidate.id,
      title: entry?.title || 'Untitled candidate',
      summary: entry?.summary || '',
      sourceUrl: entry?.canonical_url || '',
      sourceName: source?.name || 'Unknown',
      sourceSlug: source?.slug || '',
      sourcePublishedAt: entry?.source_published_at || '',
      eventType: candidate.event_type,
      priority: candidate.priority,
      status: candidate.editorial_status,
      totalScore: candidate.total_score,
      factSheet:
        candidate.fact_sheet && typeof candidate.fact_sheet === 'object'
          ? candidate.fact_sheet
          : {},
      flags: Array.isArray(candidate.flags) ? candidate.flags : [],
      rejectionReasons: Array.isArray(candidate.rejection_reasons)
        ? candidate.rejection_reasons
        : [],
      createdAt: candidate.created_at,
      updatedAt: candidate.updated_at,
      publishedSlug: brief?.slug || '',
      publishedTitle: englishTitle,
      lastReview: review
        ? {
            action: review.action,
            actor: review.actor,
            note: review.note || '',
            createdAt: review.created_at,
          }
        : null,
    };
  });
}

async function recordReviewEvent(args: {
  candidateId: string;
  action: 'approve' | 'reject' | 'approve_failed';
  actor: string;
  previousStatus: string;
  nextStatus: string;
  note?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const db = supabaseAdmin();
  const { error } = await db.from('editorial_review_events').insert({
    candidate_id: args.candidateId,
    action: args.action,
    actor: args.actor,
    previous_status: args.previousStatus,
    next_status: args.nextStatus,
    note: args.note || null,
    metadata: args.metadata || {},
  });
  if (error) throw new Error(`review audit insert failed: ${error.message}`);
}

async function rejectCandidate(args: {
  candidateId: string;
  sourceEntryId: string;
  previousStatus: string;
  actor: string;
  note: string;
}): Promise<{ candidateId: string; status: 'rejected' }> {
  if (args.previousStatus === 'published') {
    throw new Error('published candidates cannot be rejected from this console');
  }

  const db = supabaseAdmin();
  const now = new Date().toISOString();
  const { error: candidateError } = await db
    .from('news_candidates')
    .update({
      editorial_status: 'rejected',
      rejection_reasons: [args.note || 'Rejected by editor'],
      updated_at: now,
    })
    .eq('id', args.candidateId);
  if (candidateError) throw new Error(`candidate rejection failed: ${candidateError.message}`);

  const { error: entryError } = await db
    .from('source_entries')
    .update({ status: 'rejected', updated_at: now })
    .eq('id', args.sourceEntryId);
  if (entryError) throw new Error(`source entry rejection failed: ${entryError.message}`);

  await recordReviewEvent({
    candidateId: args.candidateId,
    action: 'reject',
    actor: args.actor,
    previousStatus: args.previousStatus,
    nextStatus: 'rejected',
    note: args.note,
  });
  return { candidateId: args.candidateId, status: 'rejected' };
}

export async function reviewEditorialCandidate(args: {
  candidateId: string;
  action: EditorialAction;
  actor: string;
  note?: string;
}): Promise<
  | { candidateId: string; status: 'rejected' }
  | ({ status: 'published' } & PublishedReleaseCandidate)
> {
  const db = supabaseAdmin();
  const note = (args.note || '').trim().slice(0, 500);
  const { data: candidate, error } = await db
    .from('news_candidates')
    .select('id, source_entry_id, editorial_status')
    .eq('id', args.candidateId)
    .single();
  if (error || !candidate) {
    throw new Error(`candidate lookup failed: ${error?.message || 'not found'}`);
  }

  if (args.action === 'reject') {
    return rejectCandidate({
      candidateId: candidate.id,
      sourceEntryId: candidate.source_entry_id,
      previousStatus: candidate.editorial_status,
      actor: args.actor,
      note,
    });
  }

  try {
    const published = await publishReleaseCandidate(args.candidateId);
    await recordReviewEvent({
      candidateId: candidate.id,
      action: 'approve',
      actor: args.actor,
      previousStatus: candidate.editorial_status,
      nextStatus: 'published',
      note,
      metadata: {
        brief_id: published.briefId,
        slug: published.slug,
      },
    });
    return { ...published, status: 'published' };
  } catch (error: any) {
    await recordReviewEvent({
      candidateId: candidate.id,
      action: 'approve_failed',
      actor: args.actor,
      previousStatus: candidate.editorial_status,
      nextStatus: 'failed',
      note: error?.message || String(error),
    });
    throw error;
  }
}
