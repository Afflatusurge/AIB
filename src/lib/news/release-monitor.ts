import { createHash, randomUUID } from 'node:crypto';
import {
  NEWS_SOURCES,
  listWatchedSources,
  type NewsSourceDefinition,
} from '../../config/news-sources';
import { editBriefs, type DiscoveredItem, type StructuredBrief } from '../openai-brief';
import { publishBrief } from '../brief-ingest';
import { runQualityGate } from '../brief-quality';
import { supabaseAdmin } from '../supabase';
import { classifyRelease } from './release-classifier';
import {
  collectWatchSource,
  fetchArticleDetails,
  type CollectedSourceEntry,
} from './source-collector';

export interface ReleaseMonitorReport {
  runId: string;
  checkedSources: number;
  unchangedSources: number;
  fetchedEntries: number;
  newEntries: number;
  ignoredEntries: number;
  candidates: number;
  needsReview: number;
  published: number;
  skipped: number;
  failed: number;
  errors: Array<{ source?: string; url?: string; message: string }>;
}

interface StoredSource {
  id: string;
  slug: string;
  etag: string | null;
  last_modified: string | null;
  enabled: boolean;
}

interface CandidateFactSheet {
  event: string;
  actors: string[];
  products: string[];
  sourcePublishedAt: string;
  claims: Array<{
    statement: string;
    sourceUrl: string;
    type: 'fact' | 'vendor_claim';
  }>;
  businessImpact: string;
  possibleActions: string[];
  caveats: string[];
  conflictsOfInterest: string[];
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function sourceRow(source: NewsSourceDefinition) {
  return {
    slug: source.slug,
    name: source.name,
    entity: source.entity || null,
    products: source.products || [],
    domains: source.domains,
    adapter: source.adapter,
    feed_url: source.feedUrl || null,
    page_url: source.pageUrl || null,
    source_kind: source.kind,
    reliability: source.reliability,
    independent: source.independent,
    allow_discovery: source.allowDiscovery,
    allow_auto_publish: source.allowAutoPublish,
    requires_corroboration: source.requiresCorroboration,
    must_watch: !!source.mustWatch,
    watch_priority: source.watchPriority || null,
    metadata: {
      allowed_path_prefixes: source.allowedPathPrefixes || [],
      include_terms: source.includeTerms || [],
      exclude_terms: source.excludeTerms || [],
    },
    updated_at: new Date().toISOString(),
  };
}

async function syncSourceRegistry(): Promise<Map<string, StoredSource>> {
  const db = supabaseAdmin();
  const rows = NEWS_SOURCES.map(sourceRow);
  const { data, error } = await db
    .from('news_sources')
    .upsert(rows, { onConflict: 'slug' })
    .select('id, slug, etag, last_modified, enabled');
  if (error) throw new Error(`news_sources sync failed: ${error.message}`);
  return new Map(((data as StoredSource[]) || []).map((row) => [row.slug, row]));
}

function scoreCandidate(
  source: NewsSourceDefinition,
  priority: 'P0' | 'P1' | 'P2',
  publishedAt: string
) {
  const ageHours = Math.max(0, (Date.now() - new Date(publishedAt).getTime()) / 3_600_000);
  const authority = source.reliability === 'A' ? 25 : source.reliability === 'B' ? 18 : 8;
  const freshness = ageHours <= 24 ? 15 : ageHours <= 48 ? 12 : 8;
  const relevance = priority === 'P0' ? 25 : priority === 'P1' ? 20 : 12;
  const actionability = priority === 'P0' ? 20 : 15;
  const novelty = 10;
  const corroboration = 0;
  const promotionPenalty = source.kind === 'vendor_marketing' ? -30 : 0;
  return {
    authority_score: authority,
    freshness_score: freshness,
    relevance_score: relevance,
    actionability_score: actionability,
    novelty_score: novelty,
    corroboration_score: corroboration,
    promotion_penalty: promotionPenalty,
    total_score:
      authority + freshness + relevance + actionability + novelty + corroboration + promotionPenalty,
  };
}

function buildFactSheet(
  source: NewsSourceDefinition,
  entry: CollectedSourceEntry,
  matchedProduct: string | undefined
): CandidateFactSheet {
  const summary = entry.summary || entry.articleText.slice(0, 700) || entry.title;
  return {
    event: entry.title,
    actors: [source.entity || source.name],
    products: matchedProduct ? [matchedProduct] : source.products || [],
    sourcePublishedAt: entry.publishedAt,
    claims: [
      {
        statement: summary,
        sourceUrl: entry.url,
        type: source.kind === 'official_release' ? 'vendor_claim' : 'fact',
      },
    ],
    businessImpact:
      'Assess whether access, pricing, capabilities, or workflow fit changes for independent builders.',
    possibleActions: [
      'Check availability, API access, pricing, and migration requirements before changing a production workflow.',
    ],
    caveats: source.kind === 'official_release'
      ? ['Release is confirmed by the vendor; performance claims still need independent testing.']
      : [],
    conflictsOfInterest: source.independent
      ? []
      : ['The source is published by the company responsible for the product.'],
  };
}

function candidateEventKey(source: NewsSourceDefinition, entry: CollectedSourceEntry): string {
  return `${source.slug}-${sha256(entry.url).slice(0, 20)}`;
}

async function recentEnglishTitles(): Promise<string[]> {
  const db = supabaseAdmin();
  const { data: recent } = await db
    .from('briefs')
    .select('id')
    .order('published_at', { ascending: false })
    .limit(40);
  const ids = (recent || []).map((row: any) => row.id).filter(Boolean);
  if (!ids.length) return [];
  const { data } = await db
    .from('brief_translations')
    .select('title')
    .eq('lang', 'en')
    .in('brief_id', ids);
  return (data || []).map((row: any) => row.title).filter(Boolean);
}

async function existingPublishedUrls(): Promise<Set<string>> {
  const db = supabaseAdmin();
  const { data } = await db
    .from('briefs')
    .select('source_url')
    .order('published_at', { ascending: false })
    .limit(120);
  return new Set((data || []).map((row: any) => row.source_url).filter(Boolean));
}

async function saveSourceState(
  sourceId: string,
  result: {
    etag?: string;
    lastModified?: string;
    error?: string;
    notModified: boolean;
  }
): Promise<void> {
  const now = new Date().toISOString();
  const db = supabaseAdmin();
  const stateUpdate: Record<string, string | null> = {
    last_checked_at: now,
    last_error: result.error || null,
    updated_at: now,
  };
  // Preserve the last known-good conditional request state on a failed fetch.
  // Otherwise a temporary outage would force the next run to download every
  // item again.
  if (!result.error) {
    stateUpdate.etag = result.etag || null;
    stateUpdate.last_modified = result.lastModified || null;
    stateUpdate.last_success_at = now;
  }
  const { error } = await db
    .from('news_sources')
    .update(stateUpdate)
    .eq('id', sourceId);
  if (error) throw new Error(`source state update failed: ${error.message}`);
}

async function hydrateFeedEntry(entry: CollectedSourceEntry): Promise<CollectedSourceEntry> {
  if (entry.articleText) return entry;
  const details = await fetchArticleDetails(entry.url);
  if (!details) return entry;
  return {
    ...entry,
    title: details.title || entry.title,
    summary: details.summary || entry.summary,
    articleText: details.articleText,
    publishedAt: details.publishedAt || entry.publishedAt,
    updatedAt: details.updatedAt || entry.updatedAt,
    contentHash: details.contentHash,
  };
}

async function saveEntry(
  sourceId: string,
  entry: CollectedSourceEntry,
  eventType: string,
  priority: 'P0' | 'P1' | 'P2',
  status: 'candidate' | 'ignored'
): Promise<{ id: string; existed: boolean }> {
  const db = supabaseAdmin();
  const { data: existing } = await db
    .from('source_entries')
    .select('id')
    .eq('canonical_url', entry.url)
    .maybeSingle();
  if (existing?.id) return { id: existing.id, existed: true };

  const { data, error } = await db
    .from('source_entries')
    .insert({
      source_id: sourceId,
      canonical_url: entry.url,
      title: entry.title,
      summary: entry.summary || null,
      article_text: entry.articleText || null,
      content_hash: entry.contentHash,
      source_published_at: entry.publishedAt,
      source_updated_at: entry.updatedAt || null,
      event_type: eventType,
      event_priority: priority,
      status,
      raw: {},
    })
    .select('id')
    .single();
  if (error) throw new Error(`source entry insert failed: ${error.message}`);
  return { id: data.id, existed: false };
}

async function saveCandidate(args: {
  source: NewsSourceDefinition;
  sourceEntryId: string;
  entry: CollectedSourceEntry;
  eventType: string;
  priority: 'P0' | 'P1' | 'P2';
  matchedProduct?: string;
}): Promise<{ id: string; editorialStatus: string; factSheet: CandidateFactSheet; score: number }> {
  const db = supabaseAdmin();
  const factSheet = buildFactSheet(args.source, args.entry, args.matchedProduct);
  const scores = scoreCandidate(args.source, args.priority, args.entry.publishedAt);
  const editorialStatus =
    args.priority === 'P0' && args.source.allowAutoPublish ? 'researched' : 'needs_review';
  const { data, error } = await db
    .from('news_candidates')
    .upsert({
      source_entry_id: args.sourceEntryId,
      event_key: candidateEventKey(args.source, args.entry),
      event_type: args.eventType,
      priority: args.priority,
      editorial_status: editorialStatus,
      ...scores,
      fact_sheet: factSheet,
      flags: args.source.kind === 'official_release' ? ['vendor_claims_possible'] : [],
      updated_at: new Date().toISOString(),
    }, { onConflict: 'source_entry_id' })
    .select('id, editorial_status')
    .single();
  if (error) throw new Error(`candidate upsert failed: ${error.message}`);
  return {
    id: data.id,
    editorialStatus: data.editorial_status,
    factSheet,
    score: scores.total_score,
  };
}

async function setCandidateStatus(
  candidateId: string,
  sourceEntryId: string,
  status: 'published' | 'needs_review' | 'failed',
  reasons: string[] = []
): Promise<void> {
  const db = supabaseAdmin();
  await db
    .from('news_candidates')
    .update({
      editorial_status: status,
      rejection_reasons: reasons,
      updated_at: new Date().toISOString(),
    })
    .eq('id', candidateId);
  await db
    .from('source_entries')
    .update({
      status: status === 'published' ? 'published' : status === 'failed' ? 'failed' : 'candidate',
      updated_at: new Date().toISOString(),
    })
    .eq('id', sourceEntryId);
}

async function writeReleaseBrief(args: {
  source: NewsSourceDefinition;
  entry: CollectedSourceEntry;
  candidateId: string;
  factSheet: CandidateFactSheet;
  eventType: string;
  priority: 'P0' | 'P1' | 'P2';
  qualityScore: number;
  recentTitles: string[];
}): Promise<StructuredBrief> {
  const discovered: DiscoveredItem = {
    url: args.entry.url,
    title: args.entry.title,
    source_name: args.source.name,
    published_at: args.entry.publishedAt,
    summary: args.entry.summary || args.factSheet.event,
    source_text: [
      JSON.stringify(args.factSheet),
      args.entry.articleText.slice(0, 12000),
    ].filter(Boolean).join('\n\n'),
    source_kind: args.source.kind,
    source_reliability: args.source.reliability,
    source_independent: args.source.independent,
    event_type: args.eventType,
    event_priority: args.priority,
  };
  const generated = await editBriefs([discovered]);
  const brief = generated[0];
  if (!brief) throw new Error('editor returned no release brief');
  Object.assign(brief, {
    candidate_id: args.candidateId,
    content_kind: 'release',
    source_kind: args.source.kind,
    source_reliability: args.source.reliability,
    source_independent: args.source.independent,
    verification_status: 'official_release_verified',
    confidence: 'official_source',
    quality_score: args.qualityScore,
    event_type: args.eventType,
    event_priority: args.priority,
  });
  const [gate] = await runQualityGate([brief], args.recentTitles);
  if (!gate?.ok) throw new Error(`release quality gate: ${(gate?.reasons || []).join('; ')}`);
  return brief;
}

export async function runReleaseMonitor(
  opts: { maxAgeHours?: number } = {}
): Promise<ReleaseMonitorReport> {
  const maxAgeHours = opts.maxAgeHours ?? 72;
  const runId = randomUUID();
  const report: ReleaseMonitorReport = {
    runId,
    checkedSources: 0,
    unchangedSources: 0,
    fetchedEntries: 0,
    newEntries: 0,
    ignoredEntries: 0,
    candidates: 0,
    needsReview: 0,
    published: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  const storedSources = await syncSourceRegistry();
  const recentTitles = await recentEnglishTitles();
  const publishedUrls = await existingPublishedUrls();
  const now = Date.now();

  const activeSources: Array<{ source: NewsSourceDefinition; stored: StoredSource }> = [];
  for (const source of listWatchedSources()) {
    const stored = storedSources.get(source.slug);
    if (!stored) {
      report.failed++;
      report.errors.push({ source: source.slug, message: 'source registry row missing' });
      continue;
    }
    if (!stored.enabled) {
      report.skipped++;
      continue;
    }
    activeSources.push({ source, stored });
  }
  report.checkedSources = activeSources.length;

  // Network collection is the slowest phase. Run independent sources in
  // parallel, then process/publish their entries sequentially so title
  // dedupe and editorial state stay deterministic.
  const collections = await Promise.all(
    activeSources.map(async ({ source, stored }) => {
      try {
        const result = await collectWatchSource(
          source,
          {
            etag: stored.etag || undefined,
            lastModified: stored.last_modified || undefined,
          },
          { maxLinks: 8 }
        );
        await saveSourceState(stored.id, result);
        return { source, stored, result, error: null as string | null };
      } catch (err: any) {
        return {
          source,
          stored,
          result: null,
          error: err?.message || String(err),
        };
      }
    })
  );

  for (const collection of collections) {
    const { source, stored, result } = collection;
    if (collection.error || !result) {
      report.failed++;
      report.errors.push({
        source: source.slug,
        message: collection.error || 'source collection failed',
      });
      continue;
    }
    if (result.notModified) {
      report.unchangedSources++;
      continue;
    }
    if (result.error) {
      report.failed++;
      report.errors.push({ source: source.slug, message: result.error });
      continue;
    }
    report.fetchedEntries += result.entries.length;

    try {
      for (const rawEntry of result.entries) {
        const publishedTime = new Date(rawEntry.publishedAt).getTime();
        const ageHours = (now - publishedTime) / 3_600_000;
        if (!Number.isFinite(ageHours) || ageHours < -6 || ageHours > maxAgeHours) continue;

        const classification = classifyRelease(rawEntry.title, rawEntry.summary, source);
        if (!classification.isRelease) {
          const storedEntry = await saveEntry(
            stored.id,
            rawEntry,
            classification.eventType,
            classification.priority,
            'ignored'
          );
          if (!storedEntry.existed) {
            report.newEntries++;
            report.ignoredEntries++;
          } else {
            report.skipped++;
          }
          continue;
        }

        const entry = await hydrateFeedEntry(rawEntry);
        const storedEntry = await saveEntry(
          stored.id,
          entry,
          classification.eventType,
          classification.priority,
          'candidate'
        );
        if (storedEntry.existed || publishedUrls.has(entry.url)) {
          report.skipped++;
          continue;
        }
        report.newEntries++;

        const candidate = await saveCandidate({
          source,
          sourceEntryId: storedEntry.id,
          entry,
          eventType: classification.eventType,
          priority: classification.priority,
          matchedProduct: classification.matchedProduct,
        });
        report.candidates++;

        if (candidate.editorialStatus === 'needs_review') {
          report.needsReview++;
          continue;
        }

        try {
          const brief = await writeReleaseBrief({
            source,
            entry,
            candidateId: candidate.id,
            factSheet: candidate.factSheet,
            eventType: classification.eventType,
            priority: classification.priority,
            qualityScore: candidate.score,
            recentTitles,
          });
          await publishBrief(brief);
          await setCandidateStatus(candidate.id, storedEntry.id, 'published');
          publishedUrls.add(entry.url);
          recentTitles.push(brief.en.title);
          report.published++;
        } catch (err: any) {
          const message = err?.message || String(err);
          await setCandidateStatus(candidate.id, storedEntry.id, 'failed', [message]);
          report.failed++;
          report.errors.push({ source: source.slug, url: entry.url, message });
        }
      }
    } catch (err: any) {
      report.failed++;
      report.errors.push({
        source: source.slug,
        message: err?.message || String(err),
      });
    }
  }

  return report;
}
