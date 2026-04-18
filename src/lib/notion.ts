import { Client } from '@notionhq/client';
import {
  getAllPlaybookSlugs as getSeedPlaybookSlugs,
  getPlaybookBySlug as getSeedPlaybookBySlug,
  getPlaybooks as getSeedPlaybooks,
} from './playbooks';

// ── Notion Client ──────────────────────────────────────────
const notion = new Client({
  auth: import.meta.env.NOTION_API_KEY || '',
});

type Lang = 'en' | 'zh' | 'ja';
type ContentType = 'daily' | 'tools' | 'cases' | 'playbooks';

// Notion now exposes both a database object id and a nested data source / collection id.
// The SDK's databases.query endpoint needs the database id, but it's easy to accidentally
// paste the collection id from a collection:// URL into env vars. This map lets us accept both.
const NOTION_DB_IDS: Record<ContentType, Record<Lang, { databaseId: string; dataSourceId: string }>> = {
  daily: {
    en: {
      databaseId: '68223dc1-0caa-4a8d-ab07-3fa8c336cefc',
      dataSourceId: '0ea22d16-f362-437a-96f0-aa7cae3a9f4d',
    },
    ja: {
      databaseId: 'c7358cf3-6798-40b6-a067-36450d15fe4b',
      dataSourceId: '9e1a115b-fccf-445c-80e1-5a3f9722fee2',
    },
    zh: {
      databaseId: '5336d835-1042-4808-a5b8-ff162542a065',
      dataSourceId: 'e50e7cb0-5eff-46c2-b04e-55ce5a46a43e',
    },
  },
  tools: {
    en: {
      databaseId: '7a982031-2ce7-46c1-8b2d-963f7d792213',
      dataSourceId: '6b5d18a1-84b2-4a6f-9c33-a080064d047f',
    },
    ja: {
      databaseId: 'ff529c1a-64f5-468c-9a10-317a2d7304d8',
      dataSourceId: '3d905653-ba0c-4522-a240-23cc085369fe',
    },
    zh: {
      databaseId: '1026f444-f10a-4f61-9006-5d83902befc3',
      dataSourceId: '88b3c0d1-401e-4470-a400-b47728d20566',
    },
  },
  cases: {
    en: {
      databaseId: '66410679-796e-4f28-bcda-193d15c14ca2',
      dataSourceId: '36156f4e-a322-44f4-9e40-b330dae1a93d',
    },
    ja: {
      databaseId: '321bc96a-80ce-4d56-bdb0-31efe140f116',
      dataSourceId: '7b129e8b-f1e6-4ccf-802c-22d284d7ff13',
    },
    zh: {
      databaseId: '0e795dbe-f0ea-4e9c-9be1-4df7098e2de8',
      dataSourceId: 'c6e44af6-3174-4976-9811-27e9ee660ff6',
    },
  },
  playbooks: {
    en: {
      databaseId: '3815f593-215e-4a20-a74f-54422b2a340c',
      dataSourceId: '452d1a8d-c620-470a-aaba-dad5abb5544c',
    },
    ja: {
      databaseId: 'aea1eb8a-c5dc-435e-9922-490e5f6968dc',
      dataSourceId: '67c9ec0e-a7f7-48a2-b076-511e622ba006',
    },
    zh: {
      databaseId: 'e4128fe0-cf2f-4322-9313-4b917a99d3e1',
      dataSourceId: '1c805889-1e4d-4b95-9d52-ef0b06010e7a',
    },
  },
};

function normalizeId(id: string): string {
  return (id || '').trim().replace(/-/g, '').toLowerCase();
}

function formatUuid(id: string): string {
  const clean = normalizeId(id);
  if (clean.length !== 32) return id;
  return `${clean.slice(0, 8)}-${clean.slice(8, 12)}-${clean.slice(12, 16)}-${clean.slice(16, 20)}-${clean.slice(20)}`;
}

function resolveDatabaseId(type: ContentType, lang: Lang, value: string): string {
  const ids = NOTION_DB_IDS[type][lang];
  const candidate = (value || '').trim();

  if (!candidate) return ids.databaseId;

  if (normalizeId(candidate) === normalizeId(ids.dataSourceId)) {
    return ids.databaseId;
  }

  return formatUuid(candidate);
}

// ── Database ID Map ────────────────────────────────────────
const DB = {
  daily: {
    en: resolveDatabaseId('daily', 'en', import.meta.env.NOTION_DB_DAILY_EN || ''),
    zh: resolveDatabaseId('daily', 'zh', import.meta.env.NOTION_DB_DAILY_ZH || ''),
    ja: resolveDatabaseId('daily', 'ja', import.meta.env.NOTION_DB_DAILY_JA || ''),
  },
  tools: {
    en: resolveDatabaseId('tools', 'en', import.meta.env.NOTION_DB_TOOLS_EN || ''),
    zh: resolveDatabaseId('tools', 'zh', import.meta.env.NOTION_DB_TOOLS_ZH || ''),
    ja: resolveDatabaseId('tools', 'ja', import.meta.env.NOTION_DB_TOOLS_JA || ''),
  },
  cases: {
    en: resolveDatabaseId('cases', 'en', import.meta.env.NOTION_DB_CASES_EN || ''),
    zh: resolveDatabaseId('cases', 'zh', import.meta.env.NOTION_DB_CASES_ZH || ''),
    ja: resolveDatabaseId('cases', 'ja', import.meta.env.NOTION_DB_CASES_JA || ''),
  },
  playbooks: {
    en: resolveDatabaseId('playbooks', 'en', import.meta.env.NOTION_DB_PLAYBOOKS_EN || ''),
    zh: resolveDatabaseId('playbooks', 'zh', import.meta.env.NOTION_DB_PLAYBOOKS_ZH || ''),
    ja: resolveDatabaseId('playbooks', 'ja', import.meta.env.NOTION_DB_PLAYBOOKS_JA || ''),
  },
} as const;

const VISIBLE_STATUSES = new Set([
  'done',
  'published',
  'live',
  'ready',
  'complete',
  'completed',
]);

function normalizeText(value: string): string {
  return value
    .replace(/^=\s*/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ── Helper: extract plain text from Notion rich_text / title ──
function getText(prop: any): string {
  if (!prop) return '';
  // title type
  if (prop.type === 'title') {
    return normalizeText(prop.title?.map((t: any) => t.plain_text).join('') || '');
  }
  // rich_text type
  if (prop.type === 'rich_text') {
    return normalizeText(prop.rich_text?.map((t: any) => t.plain_text).join('') || '');
  }
  // select type
  if (prop.type === 'select') {
    return normalizeText(prop.select?.name || '');
  }
  // multi_select
  if (prop.type === 'multi_select') {
    return normalizeText(prop.multi_select?.map((s: any) => s.name).join(', ') || '');
  }
  // number
  if (prop.type === 'number') {
    return normalizeText(prop.number?.toString() || '');
  }
  // date
  if (prop.type === 'date') {
    return normalizeText(prop.date?.start || '');
  }
  // url
  if (prop.type === 'url') {
    return normalizeText(prop.url || '');
  }
  // status
  if (prop.type === 'status') {
    return normalizeText(prop.status?.name || '');
  }
  // checkbox
  if (prop.type === 'checkbox') {
    return prop.checkbox ? 'true' : 'false';
  }
  // files
  if (prop.type === 'files') {
    const file = prop.files?.[0];
    return normalizeText(file?.file?.url || file?.external?.url || '');
  }
  return '';
}

function getCheckbox(prop: any): boolean {
  if (!prop) return false;
  if (prop.type === 'checkbox') return !!prop.checkbox;
  const text = getText(prop).toLowerCase();
  return ['true', 'yes', '1', 'featured'].includes(text);
}

function getAnyText(props: Record<string, any>, names: string[]): string {
  for (const name of names) {
    const value = getText(props[name]);
    if (value) return value;
  }
  return '';
}

function getAnyCheckbox(props: Record<string, any>, names: string[]): boolean {
  for (const name of names) {
    if (name in props && getCheckbox(props[name])) return true;
  }
  return false;
}

function getStatus(props: Record<string, any>): string {
  return getAnyText(props, ['Status', 'Publish Status', 'State']);
}

function isVisibleEntry(props: Record<string, any>): boolean {
  const status = getStatus(props).toLowerCase();
  return !status || VISIBLE_STATUSES.has(status);
}

function hasRenderableContent(entry: { title?: string; snippet?: string; slug?: string }): boolean {
  return !!(entry.title && entry.slug && entry.snippet);
}

function hasDailyBriefPayload(props: Record<string, any>): boolean {
  return !!(
    getAnyText(props, ['Title', 'Name']) &&
    getAnyText(props, ['Summary', 'Dek', 'Subtitle']) &&
    getAnyText(props, ['Slug']) &&
    getAnyText(props, ['Date', 'Publish Date'])
  );
}

function isDailyBriefVisible(props: Record<string, any>): boolean {
  if (isVisibleEntry(props)) return true;

  const status = getStatus(props).toLowerCase();
  if (status === 'not started' || status === 'in progress') {
    return hasDailyBriefPayload(props);
  }

  return false;
}

function sortByEditorialPriority<T extends { featured?: boolean; date?: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    if (!!a.featured !== !!b.featured) {
      return a.featured ? -1 : 1;
    }

    const aTime = a.date ? new Date(a.date).getTime() : 0;
    const bTime = b.date ? new Date(b.date).getTime() : 0;
    return bTime - aTime;
  });
}

function dedupeBySlug<T extends { id: string; slug?: string; title?: string }>(items: T[], label: string): T[] {
  const seen = new Map<string, T>();

  for (const item of items) {
    const slug = normalizeText(item.slug || '').toLowerCase();
    if (!slug) continue;

    if (seen.has(slug)) {
      const kept = seen.get(slug)!;
      console.warn(
        `[Notion] Duplicate ${label} slug "${slug}" detected. Keeping "${kept.title || kept.id}" and skipping "${item.title || item.id}".`
      );
      continue;
    }

    seen.set(slug, item);
  }

  return Array.from(seen.values());
}

// ── Check if Notion is configured ──────────────────────────
function isConfigured(): boolean {
  return !!(import.meta.env.NOTION_API_KEY);
}

// ══════════════════════════════════════════════════════════════
// DAILY BRIEFS
// ══════════════════════════════════════════════════════════════

export interface DailyBrief {
  id: string;
  title: string;
  snippet: string;
  category: string;
  impact: string;
  date: string;
  slug: string;
  sourceUrl: string;
  commentary: string;
  whyItMatters?: string;
  featured?: boolean;
  status?: string;
}

export async function getDailyBriefs(lang: Lang = 'en'): Promise<DailyBrief[]> {
  if (!isConfigured() || !DB.daily[lang]) return getMockDailyBriefs();

  try {
    const response = await notion.databases.query({
      database_id: DB.daily[lang],
      sorts: [{ property: 'Date', direction: 'descending' }],
      page_size: 100,
    });

    const briefs = response.results
      .filter((page: any) => isDailyBriefVisible(page.properties))
      .map((page: any) => {
      const props = page.properties;
      return {
        id: page.id,
        title: getAnyText(props, ['Title', 'Name']),
        snippet: getAnyText(props, ['Summary', 'Dek', 'Subtitle']),
        category: getAnyText(props, ['Category', 'Signal', 'Topic']),
        impact: getAnyText(props, ['Impact', 'Priority']),
        date: getAnyText(props, ['Date', 'Publish Date']),
        slug: getAnyText(props, ['Slug']),
        sourceUrl: getAnyText(props, ['Source URL', 'Source', 'Original URL']),
        commentary: getAnyText(props, ['Commentary', 'Analysis', 'Editor Note']),
        whyItMatters: getAnyText(props, ['Why It Matters', 'Why it matters', 'Takeaway', 'Key Takeaway']),
        featured: getAnyCheckbox(props, ['Featured', 'Lead', 'Homepage']),
        status: getStatus(props),
      };
      })
      .filter(hasRenderableContent);

    return dedupeBySlug(sortByEditorialPriority(briefs), `daily briefs (${lang})`);
  } catch (err) {
    console.error(`[Notion] Failed to fetch daily briefs (${lang}):`, err);
    return getMockDailyBriefs();
  }
}

// ══════════════════════════════════════════════════════════════
// TOOL REVIEWS
// ══════════════════════════════════════════════════════════════

export interface ToolReview {
  id: string;
  title: string;
  snippet: string;
  rating: number;
  pricing: string;
  slug: string;
  date: string;
  category: string;
  url: string;
  verdict?: string;
  bestFor?: string;
  workflowFit?: string;
  takeaway?: string;
  featured?: boolean;
  coverImage?: string;
  status?: string;
}

export async function getToolReviews(lang: Lang = 'en'): Promise<ToolReview[]> {
  if (!isConfigured() || !DB.tools[lang]) return getMockToolReviews();

  try {
    const response = await notion.databases.query({
      database_id: DB.tools[lang],
      sorts: [{ property: 'Publish Date', direction: 'descending' }],
      page_size: 100,
    });

    const reviews = response.results
      .filter((page: any) => isVisibleEntry(page.properties))
      .map((page: any) => {
      const props = page.properties;
      return {
        id: page.id,
        title: getAnyText(props, ['Tool Name', 'Title', 'Name']),
        snippet: getAnyText(props, ['Tagline', 'Summary', 'Dek', 'Subtitle']),
        rating: parseFloat(getAnyText(props, ['Rating', 'Score'])) || 4,
        pricing: getAnyText(props, ['Pricing', 'Price', 'Pricing Notes']),
        slug: getAnyText(props, ['Slug']),
        date: getAnyText(props, ['Publish Date', 'Date']),
        category: getAnyText(props, ['Category', 'Type']),
        url: getAnyText(props, ['Official URL', 'URL', 'Website']),
        verdict: getAnyText(props, ['Verdict', 'Recommendation']),
        bestFor: getAnyText(props, ['Best For', 'Best for', 'Audience']),
        workflowFit: getAnyText(props, ['Workflow Fit', 'Workflow fit', 'Use Case', 'Use case']),
        takeaway: getAnyText(props, ['Key Takeaway', 'Takeaway', 'Why It Matters']),
        featured: getAnyCheckbox(props, ['Featured', 'Lead', 'Homepage']),
        coverImage: getAnyText(props, ['Cover Image', 'Image', 'Thumbnail']),
        status: getStatus(props),
      };
      })
      .filter(hasRenderableContent);

    return dedupeBySlug(sortByEditorialPriority(reviews), `tool reviews (${lang})`);
  } catch (err) {
    console.error(`[Notion] Failed to fetch tool reviews (${lang}):`, err);
    return getMockToolReviews();
  }
}

// ══════════════════════════════════════════════════════════════
// CASE STUDIES
// ══════════════════════════════════════════════════════════════

export interface CaseStudy {
  id: string;
  title: string;
  snippet: string;
  industry: string;
  revenue: string;
  slug: string;
  date: string;
  tags: string;
  problem?: string;
  problemType?: string;
  applicableTo?: string;
  takeaway?: string;
  featured?: boolean;
  coverImage?: string;
  status?: string;
}

export interface Playbook {
  id: string;
  title: string;
  snippet: string;
  category: string;
  outcome: string;
  bestFor: string;
  useWhen: string;
  slug: string;
  date: string;
  featured?: boolean;
  coverImage?: string;
  status?: string;
}

export async function getCaseStudies(lang: Lang = 'en'): Promise<CaseStudy[]> {
  if (!isConfigured() || !DB.cases[lang]) return getMockCaseStudies();

  try {
    const response = await notion.databases.query({
      database_id: DB.cases[lang],
      sorts: [{ property: 'Publish Date', direction: 'descending' }],
      page_size: 100,
    });

    const studies = response.results
      .filter((page: any) => isVisibleEntry(page.properties))
      .map((page: any) => {
      const props = page.properties;
      return {
        id: page.id,
        title: getAnyText(props, ['Title', 'Name']),
        snippet: getAnyText(props, ['Subtitle', 'Summary', 'Dek']),
        industry: getAnyText(props, ['Industry', 'Category', 'Problem']),
        revenue: getAnyText(props, ['Revenue Impact', 'Revenue', 'Outcome']),
        slug: getAnyText(props, ['Slug']),
        date: getAnyText(props, ['Publish Date', 'Date']),
        tags: getAnyText(props, ['AI Tools Used', 'Tags', 'Stack']),
        problem: getAnyText(props, ['Problem', 'Core Problem']),
        problemType: getAnyText(props, ['Problem Type', 'Problem type']),
        applicableTo: getAnyText(props, ['Applicable To', 'Applicable to', 'Best For', 'Audience']),
        takeaway: getAnyText(props, ['Key Takeaway', 'Takeaway', 'Lesson']),
        featured: getAnyCheckbox(props, ['Featured', 'Lead', 'Homepage']),
        coverImage: getAnyText(props, ['Cover Image', 'Image', 'Thumbnail']),
        status: getStatus(props),
      };
      })
      .filter(hasRenderableContent);

    return dedupeBySlug(sortByEditorialPriority(studies), `case studies (${lang})`);
  } catch (err) {
    console.error(`[Notion] Failed to fetch case studies (${lang}):`, err);
    return getMockCaseStudies();
  }
}

// ══════════════════════════════════════════════════════════════
// PLAYBOOKS
// ══════════════════════════════════════════════════════════════

export async function getPlaybooks(lang: Lang = 'en'): Promise<Playbook[]> {
  if (!isConfigured() || !DB.playbooks[lang]) return getMockPlaybooks(lang);

  try {
    const response = await notion.databases.query({
      database_id: DB.playbooks[lang],
      sorts: [{ property: 'Publish Date', direction: 'descending' }],
      page_size: 100,
    });

    const playbooks = response.results
      .filter((page: any) => isVisibleEntry(page.properties))
      .map((page: any) => {
        const props = page.properties;
        return {
          id: page.id,
          title: getAnyText(props, ['Title', 'Name']),
          snippet: getAnyText(props, ['Summary', 'Dek', 'Subtitle']),
          category: getAnyText(props, ['Category', 'Type']),
          outcome: getAnyText(props, ['Outcome', 'Result']),
          bestFor: getAnyText(props, ['Best For', 'Best for', 'Audience']),
          useWhen: getAnyText(props, ['Use When', 'Use when', 'Cadence']),
          slug: getAnyText(props, ['Slug']),
          date: getAnyText(props, ['Publish Date', 'Date']),
          featured: getAnyCheckbox(props, ['Featured', 'Lead', 'Homepage']),
          coverImage: getAnyText(props, ['Cover Image', 'Image', 'Thumbnail']),
          status: getStatus(props),
        };
      })
      .filter((item) => !!(item.title && item.slug && item.snippet));

    return dedupeBySlug(sortByEditorialPriority(playbooks), `playbooks (${lang})`);
  } catch (err) {
    console.error(`[Notion] Failed to fetch playbooks (${lang}):`, err);
    return getMockPlaybooks(lang);
  }
}

// ══════════════════════════════════════════════════════════════
// PAGE CONTENT (blocks → HTML)
// ══════════════════════════════════════════════════════════════

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderRichText(rt: any[]): string {
  if (!rt || !Array.isArray(rt)) return '';
  return rt
    .map((t: any) => {
      let text = escapeHtml(t.plain_text || '');
      const a = t.annotations || {};
      if (a.code) text = `<code>${text}</code>`;
      if (a.bold) text = `<strong>${text}</strong>`;
      if (a.italic) text = `<em>${text}</em>`;
      if (a.strikethrough) text = `<s>${text}</s>`;
      if (a.underline) text = `<u>${text}</u>`;
      if (t.href) text = `<a href="${escapeHtml(t.href)}" target="_blank" rel="noopener">${text}</a>`;
      return text;
    })
    .join('');
}

function getBlockIcon(icon: any): string {
  if (!icon) return '';
  if (icon.type === 'emoji') return icon.emoji || '';
  if (icon.type === 'external') return `<img src="${escapeHtml(icon.external?.url || '')}" alt="" loading="lazy" />`;
  if (icon.type === 'file') return `<img src="${escapeHtml(icon.file?.url || '')}" alt="" loading="lazy" />`;
  return '';
}

function getFileLikeUrl(block: any): string {
  return (
    block?.file?.url ||
    block?.external?.url ||
    block?.url ||
    ''
  );
}

function isTabToggle(block: any): boolean {
  if (!block || block.type !== 'toggle') return false;
  const raw = renderRichText(block.toggle?.rich_text || []);
  const label = raw.replace(/<[^>]+>/g, '').trim().toLowerCase();
  return label.startsWith('tab:') || label.startsWith('[tab]') || label.startsWith('tab ');
}

function getTabLabel(block: any): string {
  const raw = renderRichText(block.toggle?.rich_text || []);
  return raw.replace(/^\s*(?:\[tab\]|tab:|tab)\s*/i, '').trim() || 'Tab';
}

async function fetchBlockChildren(blockId: string): Promise<any[]> {
  const results: any[] = [];
  let cursor: string | undefined = undefined;

  do {
    const response: any = await notion.blocks.children.list({
      block_id: blockId,
      start_cursor: cursor,
      page_size: 100,
    });
    results.push(...response.results);
    cursor = response.has_more ? response.next_cursor : undefined;
  } while (cursor);

  return results;
}

async function hydrateBlocks(blocks: any[]): Promise<any[]> {
  const hydrated: any[] = [];

  for (const block of blocks) {
    if (!block?.has_children) {
      hydrated.push(block);
      continue;
    }

    try {
      const children = await fetchBlockChildren(block.id);
      hydrated.push({
        ...block,
        children: await hydrateBlocks(children),
      });
    } catch {
      hydrated.push(block);
    }
  }

  return hydrated;
}

function blocksToHtml(blocks: any[]): string {
  let tabGroupCount = 0;

  const renderTable = (block: any): string => {
    const rows = block.children || [];
    if (!rows.length) return '';

    const hasColumnHeader = !!block.table?.has_column_header;
    const hasRowHeader = !!block.table?.has_row_header;

    const body = rows
      .map((row: any, rowIndex: number) => {
        const cells = row.table_row?.cells || [];
        const renderedCells = cells
          .map((cell: any[], cellIndex: number) => {
            const content = renderRichText(cell);
            const isColumnHeader = hasColumnHeader && rowIndex === 0;
            const isRowHeader = hasRowHeader && cellIndex === 0 && !isColumnHeader;
            const tag = isColumnHeader || isRowHeader ? 'th' : 'td';
            const scope = isColumnHeader ? ' scope="col"' : isRowHeader ? ' scope="row"' : '';
            return `<${tag}${scope}>${content || '&nbsp;'}</${tag}>`;
          })
          .join('');

        return `<tr>${renderedCells}</tr>`;
      })
      .join('');

    return `<div class="article-table-wrap"><table>${body}</table></div>`;
  };

  const renderTabGroup = (tabBlocks: any[]): string => {
    const groupId = `notion-tabs-${++tabGroupCount}`;
    const controls = tabBlocks
      .map((block: any, index: number) => {
        const tabId = `${groupId}-panel-${index + 1}`;
        const isActive = index === 0 ? 'true' : 'false';
        const activeClass = index === 0 ? ' is-active' : '';
        return `<button class="article-tab-trigger${activeClass}" type="button" role="tab" aria-selected="${isActive}" aria-controls="${tabId}" data-tab-target="${tabId}">${getTabLabel(block)}</button>`;
      })
      .join('');

    const panels = tabBlocks
      .map((block: any, index: number) => {
        const panelId = `${groupId}-panel-${index + 1}`;
        const activeClass = index === 0 ? ' is-active' : '';
        const children = renderBlocks(block.children || []);
        return `<section id="${panelId}" class="article-tab-panel${activeClass}" role="tabpanel">${children}</section>`;
      })
      .join('');

    return `<div class="article-tabs" data-tab-group><div class="article-tab-list" role="tablist">${controls}</div><div class="article-tab-panels">${panels}</div></div>`;
  };

  const renderList = (listType: 'ul' | 'ol', items: any[]): string => {
    const inner = items
      .map((item: any) => {
        const text = renderRichText(item[item.type]?.rich_text || []);
        const children = item.children?.length ? renderBlocks(item.children) : '';
        return `<li>${text}${children}</li>`;
      })
      .join('');
    return `<${listType}>${inner}</${listType}>`;
  };

  const renderBookmark = (url: string, label?: string): string => {
    if (!url) return '';
    const text = label || url.replace(/^https?:\/\//, '');
    return `<a class="article-link-card" href="${escapeHtml(url)}" target="_blank" rel="noopener"><span class="article-link-card-label">${escapeHtml(text)}</span><span class="article-link-card-url">${escapeHtml(url)}</span></a>`;
  };

  const renderBlock = (block: any): string => {
    const type = block.type;
    const data = block[type];
    if (!data) return '';

    switch (type) {
      case 'paragraph': {
        const content = renderRichText(data.rich_text);
        if (!content.trim()) return '';
        return `<p>${content}</p>`;
      }
      case 'heading_1':
      case 'heading_2':
        return `<h2>${renderRichText(data.rich_text)}</h2>`;
      case 'heading_3':
        return `<h3>${renderRichText(data.rich_text)}</h3>`;
      case 'quote': {
        const content = renderRichText(data.rich_text);
        const children = block.children?.length ? renderBlocks(block.children) : '';
        return `<blockquote>${content}${children}</blockquote>`;
      }
      case 'code': {
        const codeText = (data.rich_text || []).map((t: any) => t.plain_text).join('');
        return `<pre><code>${escapeHtml(codeText)}</code></pre>`;
      }
      case 'callout': {
        const icon = getBlockIcon(data.icon);
        const title = renderRichText(data.rich_text);
        const children = block.children?.length ? renderBlocks(block.children) : '';
        return `<div class="callout">${icon ? `<div class="callout-icon">${icon}</div>` : ''}<div class="callout-body"><div class="callout-copy">${title}</div>${children}</div></div>`;
      }
      case 'divider':
        return '<hr/>';
      case 'image': {
        const url = getFileLikeUrl(data);
        const caption = renderRichText(data.caption || []);
        if (!url) return '';
        return `<figure><img src="${escapeHtml(url)}" alt="${caption.replace(/<[^>]+>/g, '')}" loading="lazy"/>${caption ? `<figcaption>${caption}</figcaption>` : ''}</figure>`;
      }
      case 'video': {
        const url = getFileLikeUrl(data);
        const caption = renderRichText(data.caption || []);
        if (!url) return '';
        if (data.type === 'file') {
          return `<figure><video controls preload="metadata" src="${escapeHtml(url)}"></video>${caption ? `<figcaption>${caption}</figcaption>` : ''}</figure>`;
        }
        return renderBookmark(url, caption.replace(/<[^>]+>/g, '') || 'External video');
      }
      case 'pdf':
      case 'file': {
        const url = getFileLikeUrl(data);
        const caption = renderRichText(data.caption || []);
        return renderBookmark(url, caption.replace(/<[^>]+>/g, '') || 'Attached file');
      }
      case 'bookmark':
      case 'link_preview':
        return renderBookmark(data.url || '');
      case 'embed': {
        const url = data.url || '';
        if (!url) return '';
        return `<div class="article-embed"><iframe src="${escapeHtml(url)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></div><p class="article-embed-note"><a href="${escapeHtml(url)}" target="_blank" rel="noopener">Open embedded source →</a></p>`;
      }
      case 'to_do': {
        const checked = data.checked ? ' checked' : '';
        const content = renderRichText(data.rich_text);
        return `<label class="article-todo"><input type="checkbox" disabled${checked} /><span>${content}</span></label>`;
      }
      case 'toggle': {
        const summary = renderRichText(data.rich_text);
        const children = block.children?.length ? renderBlocks(block.children) : '';
        return `<details class="article-toggle"><summary>${summary}</summary><div class="article-toggle-body">${children}</div></details>`;
      }
      case 'table':
        return renderTable(block);
      case 'column_list': {
        const columns = (block.children || [])
          .filter((child: any) => child.type === 'column')
          .map((column: any) => `<div class="article-column-block">${renderBlocks(column.children || [])}</div>`)
          .join('');
        return columns ? `<div class="article-columns">${columns}</div>` : '';
      }
      case 'synced_block':
      case 'column':
        return block.children?.length ? renderBlocks(block.children) : '';
      case 'child_page': {
        const title = escapeHtml(data.title || 'Related page');
        return `<div class="article-child-card"><span class="article-child-label">Notion page</span><strong>${title}</strong></div>`;
      }
      default:
        return '';
    }
  };

  const renderBlocks = (items: any[]): string => {
    let html = '';

    for (let i = 0; i < items.length; i += 1) {
      const block = items[i];
      if (!block) continue;

      if (isTabToggle(block)) {
        const tabBlocks: any[] = [];
        while (i < items.length && isTabToggle(items[i])) {
          tabBlocks.push(items[i]);
          i += 1;
        }
        i -= 1;
        html += renderTabGroup(tabBlocks);
        continue;
      }

      if (block.type === 'bulleted_list_item' || block.type === 'numbered_list_item') {
        const listType = block.type === 'numbered_list_item' ? 'ol' : 'ul';
        const listBlocks = [block];
        while (i + 1 < items.length && items[i + 1]?.type === block.type) {
          listBlocks.push(items[i + 1]);
          i += 1;
        }
        html += renderList(listType, listBlocks);
        continue;
      }

      html += renderBlock(block);
    }

    return html;
  };

  return renderBlocks(blocks);
}

export async function getPageContent(pageId: string): Promise<string> {
  if (!isConfigured()) return '';
  const blockId = formatUuid(pageId);
  if (normalizeId(blockId).length !== 32) return '';
  try {
    const rootBlocks = await fetchBlockChildren(blockId);
    const hydratedBlocks = await hydrateBlocks(rootBlocks);
    return blocksToHtml(hydratedBlocks);
  } catch (err) {
    console.error(`[Notion] Failed to fetch page content (${blockId}):`, err);
    return '';
  }
}

// ══════════════════════════════════════════════════════════════
// MOCK DATA (fallback when Notion is not connected)
// ══════════════════════════════════════════════════════════════

function getMockDailyBriefs(): DailyBrief[] {
  return [
    { id: '1', title: 'OpenAI Releases GPT-5 Turbo with 2M Context Window', snippet: 'New model supports structured output natively, 40% cheaper than GPT-4.', category: 'LLM', impact: 'Major', date: '2026-04-12', slug: 'gpt5-turbo', sourceUrl: '', commentary: 'This lowers the cost of shipping agent workflows with long context.', whyItMatters: 'Cheaper long-context models make productized AI services easier to operate.', featured: true, status: 'Done' },
    { id: '2', title: 'Anthropic Ships Claude Computer Use API', snippet: 'Developers can now build agents that control desktop applications via API.', category: 'Agent', impact: 'Major', date: '2026-04-12', slug: 'claude-computer-use', sourceUrl: '', commentary: 'Desktop automation gets more realistic for service businesses and ops-heavy workflows.', whyItMatters: 'This expands what solo builders can automate without hiring ops help.', status: 'Done' },
    { id: '3', title: 'Solopreneur Hits $2M ARR with AI Writing Agency', snippet: 'Former journalist leverages Claude + custom workflows to serve 200+ clients.', category: 'Business', impact: 'Notable', date: '2026-04-11', slug: 'ai-writing-agency', sourceUrl: '', commentary: '', whyItMatters: 'A concrete proof point that AI leverage can scale service delivery.', status: 'Done' },
    { id: '4', title: 'Cursor 2.0 Adds Multi-File Agent Mode', snippet: 'AI code editor can now autonomously refactor entire codebases.', category: 'Coding', impact: 'Notable', date: '2026-04-11', slug: 'cursor-2', sourceUrl: '', commentary: '', whyItMatters: 'This pushes solo technical founders toward faster iteration cycles.', status: 'Done' },
    { id: '5', title: 'NVIDIA Announces B300 GPU with 300GB HBM4', snippet: 'Next-gen data center GPU targets inference workloads, shipping Q3 2026.', category: 'Hardware', impact: 'Routine', date: '2026-04-10', slug: 'nvidia-b300', sourceUrl: '', commentary: '', whyItMatters: 'Important market signal, but less immediate than workflow and model changes.', status: 'Done' },
  ];
}

function getMockToolReviews(): ToolReview[] {
  return [
    { id: '1', title: 'Claude Code: The Terminal-First AI Coding Agent', snippet: 'Build full-stack apps 10x faster with agentic AI in your terminal.', rating: 5, pricing: 'Freemium', slug: 'claude-code', date: '2026-04-10', category: 'Coding', url: '', verdict: 'High-priority pick', bestFor: 'Solo technical founders building quickly', workflowFit: 'Best when you already live in the terminal and want an agent to handle implementation loops.', takeaway: 'Its biggest advantage is execution depth rather than chat quality.', featured: true, status: 'Done' },
    { id: '2', title: 'n8n: Self-Hosted Workflow Automation', snippet: 'Build complex AI workflows without code. Connect 400+ apps and chain LLM calls.', rating: 4, pricing: 'Open Source', slug: 'n8n', date: '2026-04-08', category: 'Automation', url: '', verdict: 'Worth evaluating', bestFor: 'Operators packaging repeatable service workflows', workflowFit: 'Strong fit when you need repeatable automations across CMS, email, and AI APIs.', takeaway: 'The value comes from owning the workflow logic, not just connecting apps.', status: 'Done' },
    { id: '3', title: 'Midjourney v7: Photorealism Redefined', snippet: 'The latest version delivers near-perfect photorealistic images from text prompts.', rating: 4.5, pricing: 'Paid', slug: 'midjourney-v7', date: '2026-04-06', category: 'Image', url: '', verdict: 'High-priority pick', bestFor: 'Creators shipping visuals fast', workflowFit: 'Useful when image throughput matters more than full brand-system control.', takeaway: 'Best as a fast visual ideation engine in a larger content pipeline.', status: 'Done' },
  ];
}

function getMockCaseStudies(): CaseStudy[] {
  return [
    { id: '1', title: 'From Zero to $42M: AI-Powered Marketing One-Man Company', snippet: 'How one marketer built a $42M revenue business using AI with zero employees.', industry: 'Marketing', revenue: '$42M', slug: 'ai-marketing-42m', date: '2026-04-09', tags: 'Marketing, Growth', problem: 'Scaling deliverables without scaling headcount', problemType: 'Growth', applicableTo: 'Service founders turning expertise into leveraged productized offers', takeaway: 'The lesson is not the number, but how AI standardized production enough to sell repeatedly.', featured: true, status: 'Done' },
    { id: '2', title: 'AI Writing Matrix: $3K to $18K Monthly Revenue', snippet: 'A freelance writer scaled from $3K to $18K/month using AI content systems.', industry: 'Content', revenue: '$18K/mo', slug: 'ai-writing-matrix', date: '2026-04-07', tags: 'Writing, Growth', problem: 'Breaking out of hourly writing work', problemType: 'Solopreneur', applicableTo: 'Writers, strategists, and creator-led service businesses', takeaway: 'AI mattered most when paired with packaging and process, not just drafting speed.', status: 'Done' },
    { id: '3', title: 'Replacing a $200K Data Team with AI', snippet: 'One analyst replaced an entire data team using AI-powered analysis tools.', industry: 'Data', revenue: '$200K saved', slug: 'ai-data-team', date: '2026-04-05', tags: 'Data, Cost Reduction', problem: 'Reporting bottlenecks and slow analysis cycles', problemType: 'Cost Reduction', applicableTo: 'Operators handling analytics for small teams', takeaway: 'The win came from reducing turnaround time, not from eliminating judgment.', status: 'Done' },
  ];
}

function getMockPlaybooks(lang: Lang): Playbook[] {
  return getSeedPlaybooks(lang).map((playbook) => ({
    id: playbook.slug,
    title: playbook.title,
    snippet: playbook.dek,
    category: playbook.tag,
    outcome: playbook.outcome,
    bestFor: playbook.audience,
    useWhen: playbook.cadence,
    slug: playbook.slug,
    date: '2026-04-15',
    featured: playbook.slug === 'build-your-ai-first-website-or-mvp',
    status: 'Done',
  }));
}

export function getFallbackPlaybookContent(lang: Lang, slug: string): string {
  const fallback = getSeedPlaybookBySlug(lang, slug);
  if (!fallback) return '';

  const stack = fallback.stack
    .map((item) => `<section class="playbook-stack-card"><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.role)}</p></section>`)
    .join('');
  const steps = fallback.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join('');
  const related = fallback.related
    .map((item) => `<a href="${escapeHtml(item.href)}" class="playbook-related-link">${escapeHtml(item.label)}</a>`)
    .join('');

  return [
    `<h2>${escapeHtml(fallback.stackTitle)}</h2>`,
    `<div class="playbook-stack-grid">${stack}</div>`,
    `<h2>${escapeHtml(fallback.stepsTitle)}</h2>`,
    `<ol class="playbook-steps">${steps}</ol>`,
    `<h2>${escapeHtml(fallback.relatedTitle)}</h2>`,
    `<div class="playbook-related-links">${related}</div>`,
  ].join('');
}

export function getFallbackPlaybookSlugs(): string[] {
  return getSeedPlaybookSlugs();
}
