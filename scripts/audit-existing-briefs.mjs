#!/usr/bin/env node
// Audit existing published Daily Briefs against the new source policy.
//
// Dry-run (default):
//   npm run audit:briefs
//
// Apply: move flagged rows back to draft, preserving them for review:
//   npm run audit:briefs -- --apply

import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDir, '..');
const envPath = resolve(projectRoot, '.env');
if (existsSync(envPath)) {
  for (const raw of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`missing env: ${name}`);
  return value;
}

const apply = process.argv.includes('--apply');
const db = createClient(
  required('SUPABASE_URL'),
  required('SUPABASE_SERVICE_ROLE_KEY'),
  { auth: { persistSession: false, autoRefreshToken: false } }
);

const VAGUE_TITLE_PATTERNS = [
  /\b(major|several|various|multiple|leading|top)\s+(ai\s+)?(tool\s+)?(providers?|companies|startups|vendors)\b/i,
  /\brecent\s+(ai\s+)?(research|studies|developments?|advances?)\b/i,
  /\bpractical\s+solutions?\s+for\b/i,
  /\bnew\s+ai\s+tools?\s+(emerge|arrive|launch)\b/i,
];

const GENERIC_EDITORIAL_PATTERNS = [
  /should monitor this space/i,
  /potentially improving productivity/i,
  /can save time and reduce costs/i,
  /continues to evolve rapidly/i,
  /独立开发者应关注/i,
  /提高效率并降低成本/i,
];

function hostOf(url) {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return '';
  }
}

function sourceForUrl(url, sources) {
  const host = hostOf(url);
  return sources.find((source) =>
    (source.domains || []).some((domain) => host === domain || host.endsWith(`.${domain}`))
  );
}

function reasonsFor(row, sources) {
  const reasons = [];
  if (!row.source_url || !row.source_name) reasons.push('missing_source');
  const source = row.source_url ? sourceForUrl(row.source_url, sources) : null;
  if (row.source_url && !source) reasons.push('unapproved_source');
  if (source?.reliability === 'C' || source?.reliability === 'blocked') {
    reasons.push('low_reliability_source');
  }
  if (source?.source_kind === 'vendor_marketing') reasons.push('vendor_marketing');

  const translations = row.brief_translations || [];
  const english = translations.find((item) => item.lang === 'en') || translations[0] || {};
  const title = english.title || '';
  if (!title) reasons.push('missing_title');
  if (VAGUE_TITLE_PATTERNS.some((pattern) => pattern.test(title))) reasons.push('vague_title');

  const editorialText = [
    english.snippet,
    english.commentary,
    english.why_it_matters,
    english.body_html,
  ].filter(Boolean).join(' ');
  if (GENERIC_EDITORIAL_PATTERNS.some((pattern) => pattern.test(editorialText))) {
    reasons.push('generic_editorial_copy');
  }
  if (!row.source_published_at && !row.published_at) reasons.push('missing_source_date');
  return [...new Set(reasons)];
}

async function main() {
  const { data: sources, error: sourceError } = await db
    .from('news_sources')
    .select('slug, domains, reliability, source_kind, allow_discovery');
  if (sourceError) {
    throw new Error(
      `news_sources lookup failed; apply the Daily Brief 3.0 migration first: ${sourceError.message}`
    );
  }

  const { data: briefs, error: briefError } = await db
    .from('briefs')
    .select(`
      id, slug, source_url, source_name, source_published_at, published_at,
      status, editorial_status, editorial_flags,
      brief_translations (lang, title, snippet, commentary, why_it_matters, body_html)
    `)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(500);
  if (briefError) throw new Error(`brief lookup failed: ${briefError.message}`);

  const flagged = [];
  for (const row of briefs || []) {
    const reasons = reasonsFor(row, sources || []);
    if (reasons.length) flagged.push({ row, reasons });
  }

  console.log(JSON.stringify({
    mode: apply ? 'apply' : 'dry-run',
    scanned: briefs?.length || 0,
    flagged: flagged.length,
    items: flagged.map(({ row, reasons }) => ({
      id: row.id,
      slug: row.slug,
      sourceUrl: row.source_url,
      reasons,
    })),
  }, null, 2));

  if (!apply || !flagged.length) return;

  for (const { row, reasons } of flagged) {
    const existingFlags =
      row.editorial_flags && typeof row.editorial_flags === 'object'
        ? row.editorial_flags
        : {};
    const { error } = await db
      .from('briefs')
      .update({
        status: 'draft',
        editorial_status: 'needs_review',
        editorial_flags: {
          ...existingFlags,
          legacy_audit_reasons: reasons,
          legacy_audited_at: new Date().toISOString(),
        },
      })
      .eq('id', row.id);
    if (error) throw new Error(`failed to quarantine ${row.slug}: ${error.message}`);
  }

  console.error(`[audit] moved ${flagged.length} briefs to draft for review`);
}

main().catch((error) => {
  console.error(`[audit] ${error.message}`);
  process.exit(1);
});
