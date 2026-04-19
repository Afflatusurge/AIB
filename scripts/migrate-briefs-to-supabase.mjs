#!/usr/bin/env node
// One-shot migration: Notion Daily Brief DBs (en/zh/ja) → Supabase.
//
// Usage:
//   npm run migrate:briefs
//
// Requires in .env:
//   NOTION_API_KEY
//   NOTION_DB_DAILY_EN / _ZH / _JA
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//
// What it does:
// 1. Pulls every visible brief from all three Notion DBs (title, metadata, body).
// 2. Groups rows across languages by `Slug` (stable cross-language key).
// 3. Upserts one row per slug into `briefs` and one row per (slug, lang) into
//    `brief_translations`. Safe to re-run.

import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client as NotionClient } from '@notionhq/client';
import { createClient } from '@supabase/supabase-js';

// ── Load .env ──────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');
(() => {
  const envPath = resolve(projectRoot, '.env');
  if (!existsSync(envPath)) return;
  for (const raw of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
})();

function required(name) {
  const v = process.env[name];
  if (!v) { console.error(`[migrate] missing env: ${name}`); process.exit(1); }
  return v;
}

const notion = new NotionClient({ auth: required('NOTION_API_KEY') });
const supabase = createClient(required('SUPABASE_URL'), required('SUPABASE_SERVICE_ROLE_KEY'));

const DB = {
  en: process.env.NOTION_DB_DAILY_EN,
  zh: process.env.NOTION_DB_DAILY_ZH,
  ja: process.env.NOTION_DB_DAILY_JA,
};
const VISIBLE = new Set(['done', 'published', 'live', 'ready', 'complete', 'completed']);

// ── Notion helpers ────────────────────────────────────
function normText(v) { return (v || '').replace(/^=\s*/, '').replace(/\s+/g, ' ').trim(); }
function escapeHtml(s) { return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function escapeAttr(s) { return (s || '').replace(/"/g, '&quot;'); }
function getText(prop) {
  if (!prop) return '';
  switch (prop.type) {
    case 'title': return normText(prop.title?.map(t => t.plain_text).join('') || '');
    case 'rich_text': return normText(prop.rich_text?.map(t => t.plain_text).join('') || '');
    case 'select': return normText(prop.select?.name || '');
    case 'multi_select': return normText(prop.multi_select?.map(s => s.name).join(', ') || '');
    case 'number': return normText(prop.number?.toString() || '');
    case 'date': return normText(prop.date?.start || '');
    case 'url': return normText(prop.url || '');
    case 'status': return normText(prop.status?.name || '');
    case 'checkbox': return prop.checkbox ? 'true' : 'false';
    default: return '';
  }
}
function getAnyText(props, names) { for (const n of names) { const v = getText(props[n]); if (v) return v; } return ''; }
function getAnyCheckbox(props, names) {
  for (const n of names) {
    const p = props[n]; if (!p) continue;
    if (p.type === 'checkbox') return !!p.checkbox;
    if (['true', 'yes', '1', 'featured'].includes(getText(p).toLowerCase())) return true;
  }
  return false;
}
function getStatus(props) {
  for (const n of ['Status', 'Publish Status', 'State']) { const v = getText(props[n]); if (v) return v; }
  return '';
}
function isVisible(props) {
  const s = getStatus(props).toLowerCase();
  if (s && VISIBLE.has(s)) return true;
  if (!s) return !!getAnyText(props, ['Title', 'Name']);
  return false;
}

async function listAllChildren(blockId) {
  const all = []; let cursor;
  do {
    const r = await notion.blocks.children.list({ block_id: blockId, start_cursor: cursor, page_size: 100 });
    all.push(...r.results);
    cursor = r.has_more ? r.next_cursor : undefined;
  } while (cursor);
  return all;
}
function richTextToHtml(rt) {
  if (!Array.isArray(rt)) return '';
  return rt.map(t => {
    let s = escapeHtml(t.plain_text || '');
    const a = t.annotations || {};
    if (a.code) s = `<code>${s}</code>`;
    if (a.bold) s = `<strong>${s}</strong>`;
    if (a.italic) s = `<em>${s}</em>`;
    if (a.strikethrough) s = `<s>${s}</s>`;
    if (a.underline) s = `<u>${s}</u>`;
    if (t.href) s = `<a href="${escapeAttr(t.href)}" target="_blank" rel="noopener">${s}</a>`;
    return s;
  }).join('');
}
async function blockToHtml(block) {
  const t = block.type; const d = block[t];
  const children = block.has_children ? await listAllChildren(block.id) : [];
  let childHtml = '';
  for (const c of children) childHtml += await blockToHtml(c);
  switch (t) {
    case 'paragraph': return `<p>${richTextToHtml(d.rich_text)}</p>${childHtml}`;
    case 'heading_1': return `<h1>${richTextToHtml(d.rich_text)}</h1>${childHtml}`;
    case 'heading_2': return `<h2>${richTextToHtml(d.rich_text)}</h2>${childHtml}`;
    case 'heading_3': return `<h3>${richTextToHtml(d.rich_text)}</h3>${childHtml}`;
    case 'bulleted_list_item':
    case 'numbered_list_item': return `<li>${richTextToHtml(d.rich_text)}${childHtml}</li>`;
    case 'quote': return `<blockquote>${richTextToHtml(d.rich_text)}${childHtml}</blockquote>`;
    case 'callout': return `<aside class="callout">${richTextToHtml(d.rich_text)}${childHtml}</aside>`;
    case 'code': return `<pre><code>${escapeHtml(d.rich_text?.map(r => r.plain_text).join('') || '')}</code></pre>`;
    case 'divider': return '<hr />';
    case 'toggle': return `<details><summary>${richTextToHtml(d.rich_text)}</summary>${childHtml}</details>`;
    default: return childHtml;
  }
}
async function pageToHtml(pageId) {
  const blocks = await listAllChildren(pageId);
  const parts = []; let buf = null;
  const flush = () => { if (buf) { parts.push(`<${buf.tag}>${buf.items.join('')}</${buf.tag}>`); buf = null; } };
  for (const b of blocks) {
    const isUl = b.type === 'bulleted_list_item';
    const isOl = b.type === 'numbered_list_item';
    if (isUl || isOl) {
      const tag = isUl ? 'ul' : 'ol';
      if (!buf || buf.tag !== tag) { flush(); buf = { tag, items: [] }; }
      buf.items.push(await blockToHtml(b));
    } else { flush(); parts.push(await blockToHtml(b)); }
  }
  flush();
  return parts.join('');
}

function slugify(s) {
  return (s || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}
function normalizeImpact(v) {
  const s = (v || '').toLowerCase().trim();
  if (['major', 'notable', 'routine'].includes(s)) return s;
  return 'notable';
}

async function queryAll(databaseId) {
  const all = []; let cursor;
  do {
    const r = await notion.databases.query({
      database_id: databaseId,
      sorts: [{ property: 'Date', direction: 'descending' }],
      start_cursor: cursor,
      page_size: 100,
    });
    all.push(...r.results);
    cursor = r.has_more ? r.next_cursor : undefined;
  } while (cursor);
  return all;
}

async function fetchLang(lang) {
  const dbId = DB[lang];
  if (!dbId) { console.warn(`[skip] no DB id for ${lang}`); return []; }
  console.error(`[fetch] ${lang} …`);
  const pages = await queryAll(dbId);
  const out = [];
  for (const page of pages) {
    if (!isVisible(page.properties)) continue;
    const props = page.properties;
    const title = getAnyText(props, ['Title', 'Name']);
    if (!title) continue;
    let body_html = '';
    try { body_html = await pageToHtml(page.id); }
    catch (e) { console.error(`  [warn] body failed ${lang} "${title}": ${e.message}`); }
    out.push({
      lang,
      notion_id: page.id,
      title,
      snippet: getAnyText(props, ['Summary', 'Dek', 'Subtitle']),
      category: getAnyText(props, ['Category', 'Signal', 'Topic']),
      impact: getAnyText(props, ['Impact', 'Priority']),
      date: getAnyText(props, ['Date', 'Publish Date']),
      slug: getAnyText(props, ['Slug']),
      source_url: getAnyText(props, ['Source URL', 'Source', 'Original URL']),
      commentary: getAnyText(props, ['Commentary', 'Analysis', 'Editor Note']),
      why_it_matters: getAnyText(props, ['Why It Matters', 'Why it matters', 'Takeaway', 'Key Takeaway']),
      featured: getAnyCheckbox(props, ['Featured', 'Lead', 'Homepage']),
      body_html,
    });
  }
  console.error(`[fetch] ${lang}: ${out.length} briefs`);
  return out;
}

// ── Group by slug ─────────────────────────────────────
function groupBySlug(all) {
  const byKey = new Map();
  for (const row of all) {
    const slug = row.slug ? row.slug.trim().toLowerCase() : slugify(row.title);
    if (!slug) continue;
    const bucket = byKey.get(slug) || { slug, langs: {}, meta: null };
    bucket.langs[row.lang] = row;
    bucket.meta = bucket.meta || row; // first seen (EN first due to iteration order)
    byKey.set(slug, bucket);
  }
  return [...byKey.values()];
}

// ── Upsert to Supabase ────────────────────────────────
async function upsertGroup(group) {
  // Prefer EN for metadata; fall back to first available.
  const primary = group.langs.en || group.langs.zh || group.langs.ja || group.meta;
  const briefRow = {
    slug: group.slug,
    source_url: primary.source_url || null,
    source_name: null,
    source_item_id: null, // not from Inoreader
    category: primary.category || null,
    impact: normalizeImpact(primary.impact),
    status: 'published',
    featured: !!primary.featured,
    published_at: primary.date ? new Date(primary.date).toISOString() : new Date().toISOString(),
  };
  const { data: upserted, error } = await supabase
    .from('briefs')
    .upsert(briefRow, { onConflict: 'slug' })
    .select('id')
    .single();
  if (error) throw new Error(`briefs upsert failed for ${group.slug}: ${error.message}`);
  const briefId = upserted.id;

  const translations = [];
  for (const lang of ['en', 'zh', 'ja']) {
    const r = group.langs[lang];
    if (!r) continue;
    translations.push({
      brief_id: briefId,
      lang,
      title: r.title,
      snippet: r.snippet || null,
      commentary: r.commentary || null,
      why_it_matters: r.why_it_matters || null,
      body_html: r.body_html || null,
    });
  }
  if (translations.length) {
    const { error: trErr } = await supabase
      .from('brief_translations')
      .upsert(translations, { onConflict: 'brief_id,lang' });
    if (trErr) throw new Error(`brief_translations upsert failed for ${group.slug}: ${trErr.message}`);
  }
  return translations.length;
}

async function main() {
  const all = [];
  for (const lang of ['en', 'zh', 'ja']) all.push(...await fetchLang(lang));
  const groups = groupBySlug(all);
  console.error(`[group] ${groups.length} unique slugs across ${all.length} pages`);
  let ok = 0, fail = 0;
  for (const g of groups) {
    try {
      const n = await upsertGroup(g);
      ok++;
      console.error(`  ✓ ${g.slug} (${n} langs)`);
    } catch (e) {
      fail++;
      console.error(`  ✗ ${g.slug}: ${e.message}`);
    }
  }
  console.error(`[done] upserted=${ok} failed=${fail}`);
  if (fail) process.exit(2);
}

main().catch(err => { console.error(err); process.exit(1); });
