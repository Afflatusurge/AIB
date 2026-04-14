import { Client } from '@notionhq/client';

// ── Notion Client ──────────────────────────────────────────
const notion = new Client({
  auth: import.meta.env.NOTION_API_KEY || '',
});

// ── Database ID Map ────────────────────────────────────────
const DB = {
  daily: {
    en: import.meta.env.NOTION_DB_DAILY_EN || '',
    zh: import.meta.env.NOTION_DB_DAILY_ZH || '',
    ja: import.meta.env.NOTION_DB_DAILY_JA || '',
  },
  tools: {
    en: import.meta.env.NOTION_DB_TOOLS_EN || '',
    zh: import.meta.env.NOTION_DB_TOOLS_ZH || '',
    ja: import.meta.env.NOTION_DB_TOOLS_JA || '',
  },
  cases: {
    en: import.meta.env.NOTION_DB_CASES_EN || '',
    zh: import.meta.env.NOTION_DB_CASES_ZH || '',
    ja: import.meta.env.NOTION_DB_CASES_JA || '',
  },
} as const;

type Lang = 'en' | 'zh' | 'ja';

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

    return response.results
      .filter((page: any) => isVisibleEntry(page.properties))
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

    return response.results
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

export async function getCaseStudies(lang: Lang = 'en'): Promise<CaseStudy[]> {
  if (!isConfigured() || !DB.cases[lang]) return getMockCaseStudies();

  try {
    const response = await notion.databases.query({
      database_id: DB.cases[lang],
      sorts: [{ property: 'Publish Date', direction: 'descending' }],
      page_size: 100,
    });

    return response.results
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
  } catch (err) {
    console.error(`[Notion] Failed to fetch case studies (${lang}):`, err);
    return getMockCaseStudies();
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

function blocksToHtml(blocks: any[]): string {
  let html = '';
  let listBuffer: string[] = [];
  let listType: 'ul' | 'ol' | null = null;

  const flushList = () => {
    if (listBuffer.length && listType) {
      html += `<${listType}>${listBuffer.join('')}</${listType}>`;
      listBuffer = [];
      listType = null;
    }
  };

  for (const block of blocks) {
    const type = block.type;
    const data = block[type];
    if (!data) continue;

    const isList = type === 'bulleted_list_item' || type === 'numbered_list_item';
    const wantedListType = type === 'numbered_list_item' ? 'ol' : 'ul';
    if (!isList || (listType && listType !== wantedListType)) flushList();

    switch (type) {
      case 'paragraph': {
        const content = renderRichText(data.rich_text);
        if (content.trim()) html += `<p>${content}</p>`;
        break;
      }
      case 'heading_1':
        html += `<h2>${renderRichText(data.rich_text)}</h2>`;
        break;
      case 'heading_2':
        html += `<h2>${renderRichText(data.rich_text)}</h2>`;
        break;
      case 'heading_3':
        html += `<h3>${renderRichText(data.rich_text)}</h3>`;
        break;
      case 'bulleted_list_item':
        listType = 'ul';
        listBuffer.push(`<li>${renderRichText(data.rich_text)}</li>`);
        break;
      case 'numbered_list_item':
        listType = 'ol';
        listBuffer.push(`<li>${renderRichText(data.rich_text)}</li>`);
        break;
      case 'quote':
        html += `<blockquote>${renderRichText(data.rich_text)}</blockquote>`;
        break;
      case 'code': {
        const codeText = (data.rich_text || []).map((t: any) => t.plain_text).join('');
        html += `<pre><code>${escapeHtml(codeText)}</code></pre>`;
        break;
      }
      case 'callout':
        html += `<div class="callout">${renderRichText(data.rich_text)}</div>`;
        break;
      case 'divider':
        html += '<hr/>';
        break;
      case 'image': {
        const url = data.file?.url || data.external?.url || '';
        const caption = renderRichText(data.caption || []);
        if (url) html += `<figure><img src="${escapeHtml(url)}" alt="${caption}"/>${caption ? `<figcaption>${caption}</figcaption>` : ''}</figure>`;
        break;
      }
      case 'bookmark':
      case 'embed':
      case 'link_preview': {
        const url = data.url || '';
        if (url) html += `<p><a href="${escapeHtml(url)}" target="_blank" rel="noopener">${escapeHtml(url)}</a></p>`;
        break;
      }
      case 'to_do': {
        const checked = data.checked ? '☑' : '☐';
        html += `<p>${checked} ${renderRichText(data.rich_text)}</p>`;
        break;
      }
      case 'toggle':
        html += `<details><summary>${renderRichText(data.rich_text)}</summary></details>`;
        break;
    }
  }
  flushList();
  return html;
}

export async function getPageContent(pageId: string): Promise<string> {
  if (!isConfigured()) return '';
  try {
    const allBlocks: any[] = [];
    let cursor: string | undefined = undefined;
    do {
      const res: any = await notion.blocks.children.list({
        block_id: pageId,
        start_cursor: cursor,
        page_size: 100,
      });
      allBlocks.push(...res.results);
      cursor = res.has_more ? res.next_cursor : undefined;
    } while (cursor);
    return blocksToHtml(allBlocks);
  } catch (err) {
    console.error(`[Notion] Failed to fetch page content (${pageId}):`, err);
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
