#!/usr/bin/env node
// One-shot: pull every Daily Brief from Notion (EN / ZH / JA) + page body HTML
// and dump to scripts/out/notion-briefs.json so the migrate step can upsert
// into Supabase. Safe to re-run.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@notionhq/client';

// --- Load .env (simple parser, no extra deps) ---
const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');
const envPath = resolve(projectRoot, '.env');
if (existsSync(envPath)) {
  const text = readFileSync(envPath, 'utf8');
  for (const raw of text.split(/\r?\n/)) {
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
}

const notion = new Client({ auth: process.env.NOTION_API_KEY });

const DB = {
  en: process.env.NOTION_DB_DAILY_EN,
  zh: process.env.NOTION_DB_DAILY_ZH,
  ja: process.env.NOTION_DB_DAILY_JA,
};

// Visible when status says so, or when there is no status field but content
// exists. Mirrors src/lib/notion.ts (kept deliberately permissive to avoid
// dropping old briefs during migration).
const VISIBLE_STATUSES = new Set(['done', 'published', 'live', 'ready', 'complete', 'completed']);

function normText(v) {
  return (v || '').replace(/^=\s*/, '').replace(/\s+/g, ' ').trim();
}
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
function getAnyText(props, names) {
  for (const n of names) { const v = getText(props[n]); if (v) return v; }
  return '';
}
function getAnyCheckbox(props, names) {
  for (const n of names) {
    const p = props[n];
    if (!p) continue;
    if (p.type === 'checkbox') return !!p.checkbox;
    const txt = getText(p).toLowerCase();
    if (['true', 'yes', '1', 'featured'].includes(txt)) return true;
  }
  return false;
}
function getStatus(props) {
  for (const name of ['Status', 'Publish Status', 'State']) {
    const v = getText(props[name]);
    if (v) return v;
  }
  return '';
}
function isVisible(props) {
  const status = getStatus(props).toLowerCase();
  if (status && VISIBLE_STATUSES.has(status)) return true;
  if (!status) {
    // allow when there is real content
    return !!(getAnyText(props, ['Title', 'Name']));
  }
  return false;
}

// ── Block → HTML (mirrors notion.ts behaviour, trimmed down) ──
async function listAllChildren(blockId) {
  const all = [];
  let cursor;
  do {
    const resp = await notion.blocks.children.list({ block_id: blockId, start_cursor: cursor, page_size: 100 });
    all.push(...resp.results);
    cursor = resp.has_more ? resp.next_cursor : undefined;
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
function escapeHtml(s) {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function escapeAttr(s) {
  return (s || '').replace(/"/g, '&quot;');
}
async function blockToHtml(block) {
  const t = block.type;
  const d = block[t];
  const children = block.has_children ? await listAllChildren(block.id) : [];
  const inner = [];
  for (const c of children) inner.push(await blockToHtml(c));
  const childHtml = inner.join('');
  switch (t) {
    case 'paragraph': return `<p>${richTextToHtml(d.rich_text)}</p>${childHtml}`;
    case 'heading_1': return `<h1>${richTextToHtml(d.rich_text)}</h1>${childHtml}`;
    case 'heading_2': return `<h2>${richTextToHtml(d.rich_text)}</h2>${childHtml}`;
    case 'heading_3': return `<h3>${richTextToHtml(d.rich_text)}</h3>${childHtml}`;
    case 'bulleted_list_item': return `<li>${richTextToHtml(d.rich_text)}${childHtml}</li>`;
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
  const parts = [];
  let listBuffer = null; // { tag, items }
  const flush = () => {
    if (listBuffer) {
      parts.push(`<${listBuffer.tag}>${listBuffer.items.join('')}</${listBuffer.tag}>`);
      listBuffer = null;
    }
  };
  for (const b of blocks) {
    const isBullet = b.type === 'bulleted_list_item';
    const isNumbered = b.type === 'numbered_list_item';
    if (isBullet || isNumbered) {
      const tag = isBullet ? 'ul' : 'ol';
      if (!listBuffer || listBuffer.tag !== tag) { flush(); listBuffer = { tag, items: [] }; }
      listBuffer.items.push(await blockToHtml(b));
    } else {
      flush();
      parts.push(await blockToHtml(b));
    }
  }
  flush();
  return parts.join('');
}

// ── Fetch ──
async function queryAll(databaseId) {
  const all = [];
  let cursor;
  do {
    const resp = await notion.databases.query({
      database_id: databaseId,
      sorts: [{ property: 'Date', direction: 'descending' }],
      start_cursor: cursor,
      page_size: 100,
    });
    all.push(...resp.results);
    cursor = resp.has_more ? resp.next_cursor : undefined;
  } while (cursor);
  return all;
}

async function fetchLang(lang) {
  const dbId = DB[lang];
  if (!dbId) { console.warn(`[skip] no DB configured for ${lang}`); return []; }
  console.error(`[fetch] ${lang} …`);
  const pages = await queryAll(dbId);
  const out = [];
  for (const page of pages) {
    if (!isVisible(page.properties)) continue;
    const props = page.properties;
    const row = {
      lang,
      notion_id: page.id,
      title: getAnyText(props, ['Title', 'Name']),
      snippet: getAnyText(props, ['Summary', 'Dek', 'Subtitle']),
      category: getAnyText(props, ['Category', 'Signal', 'Topic']),
      impact: getAnyText(props, ['Impact', 'Priority']),
      date: getAnyText(props, ['Date', 'Publish Date']),
      slug: getAnyText(props, ['Slug']),
      source_url: getAnyText(props, ['Source URL', 'Source', 'Original URL']),
      commentary: getAnyText(props, ['Commentary', 'Analysis', 'Editor Note']),
      why_it_matters: getAnyText(props, ['Why It Matters', 'Why it matters', 'Takeaway', 'Key Takeaway']),
      featured: getAnyCheckbox(props, ['Featured', 'Lead', 'Homepage']),
      body_html: '',
    };
    if (!row.title) continue;
    try {
      row.body_html = await pageToHtml(page.id);
    } catch (err) {
      console.error(`  [warn] body fetch failed for ${lang} ${row.title}:`, err.message);
    }
    out.push(row);
  }
  console.error(`[fetch] ${lang}: ${out.length} visible briefs`);
  return out;
}

// ── Main ──
async function main() {
  if (!process.env.NOTION_API_KEY) { console.error('NOTION_API_KEY missing'); process.exit(1); }
  const result = { en: [], zh: [], ja: [] };
  for (const lang of ['en', 'zh', 'ja']) {
    result[lang] = await fetchLang(lang);
  }
  const outDir = resolve(projectRoot, 'scripts/out');
  mkdirSync(outDir, { recursive: true });
  const outPath = resolve(outDir, 'notion-briefs.json');
  writeFileSync(outPath, JSON.stringify(result, null, 2));
  console.error(`[done] wrote ${outPath}`);
  console.error(`[counts] en=${result.en.length} zh=${result.zh.length} ja=${result.ja.length}`);
}

main().catch(err => { console.error(err); process.exit(1); });
