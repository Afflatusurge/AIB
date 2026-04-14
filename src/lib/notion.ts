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

// ── Helper: extract plain text from Notion rich_text / title ──
function getText(prop: any): string {
  if (!prop) return '';
  // title type
  if (prop.type === 'title') {
    return prop.title?.map((t: any) => t.plain_text).join('') || '';
  }
  // rich_text type
  if (prop.type === 'rich_text') {
    return prop.rich_text?.map((t: any) => t.plain_text).join('') || '';
  }
  // select type
  if (prop.type === 'select') {
    return prop.select?.name || '';
  }
  // multi_select
  if (prop.type === 'multi_select') {
    return prop.multi_select?.map((s: any) => s.name).join(', ') || '';
  }
  // number
  if (prop.type === 'number') {
    return prop.number?.toString() || '';
  }
  // date
  if (prop.type === 'date') {
    return prop.date?.start || '';
  }
  // url
  if (prop.type === 'url') {
    return prop.url || '';
  }
  // status
  if (prop.type === 'status') {
    return prop.status?.name || '';
  }
  return '';
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
}

export async function getDailyBriefs(lang: Lang = 'en'): Promise<DailyBrief[]> {
  if (!isConfigured() || !DB.daily[lang]) return getMockDailyBriefs();

  try {
    const response = await notion.databases.query({
      database_id: DB.daily[lang],
      sorts: [{ property: 'Date', direction: 'descending' }],
      page_size: 20,
    });

    return response.results.map((page: any) => {
      const props = page.properties;
      return {
        id: page.id,
        title: getText(props['Title']),
        snippet: getText(props['Summary']),
        category: getText(props['Category']),
        impact: getText(props['Impact']),
        date: getText(props['Date']),
        slug: getText(props['Slug']),
        sourceUrl: getText(props['Source URL']),
        commentary: getText(props['Commentary']),
      };
    });
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
}

export async function getToolReviews(lang: Lang = 'en'): Promise<ToolReview[]> {
  if (!isConfigured() || !DB.tools[lang]) return getMockToolReviews();

  try {
    const response = await notion.databases.query({
      database_id: DB.tools[lang],
      sorts: [{ property: 'Publish Date', direction: 'descending' }],
      page_size: 20,
    });

    return response.results.map((page: any) => {
      const props = page.properties;
      return {
        id: page.id,
        title: getText(props['Tool Name']) || getText(props['Title']),
        snippet: getText(props['Tagline']) || getText(props['Summary']),
        rating: parseFloat(getText(props['Rating'])) || 4,
        pricing: getText(props['Pricing']),
        slug: getText(props['Slug']),
        date: getText(props['Publish Date']),
        category: getText(props['Category']),
        url: getText(props['Official URL']) || getText(props['URL']),
      };
    });
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
}

export async function getCaseStudies(lang: Lang = 'en'): Promise<CaseStudy[]> {
  if (!isConfigured() || !DB.cases[lang]) return getMockCaseStudies();

  try {
    const response = await notion.databases.query({
      database_id: DB.cases[lang],
      sorts: [{ property: 'Publish Date', direction: 'descending' }],
      page_size: 20,
    });

    return response.results.map((page: any) => {
      const props = page.properties;
      return {
        id: page.id,
        title: getText(props['Title']),
        snippet: getText(props['Subtitle']) || getText(props['Summary']),
        industry: getText(props['Industry']),
        revenue: getText(props['Revenue Impact']) || getText(props['Revenue']),
        slug: getText(props['Slug']),
        date: getText(props['Publish Date']),
        tags: getText(props['AI Tools Used']) || getText(props['Tags']),
      };
    });
  } catch (err) {
    console.error(`[Notion] Failed to fetch case studies (${lang}):`, err);
    return getMockCaseStudies();
  }
}

// ══════════════════════════════════════════════════════════════
// MOCK DATA (fallback when Notion is not connected)
// ══════════════════════════════════════════════════════════════

function getMockDailyBriefs(): DailyBrief[] {
  return [
    { id: '1', title: 'OpenAI Releases GPT-5 Turbo with 2M Context Window', snippet: 'New model supports structured output natively, 40% cheaper than GPT-4.', category: 'LLM', impact: 'Major', date: '2026-04-12', slug: 'gpt5-turbo', sourceUrl: '', commentary: '' },
    { id: '2', title: 'Anthropic Ships Claude Computer Use API', snippet: 'Developers can now build agents that control desktop applications via API.', category: 'Agent', impact: 'Major', date: '2026-04-12', slug: 'claude-computer-use', sourceUrl: '', commentary: '' },
    { id: '3', title: 'Solopreneur Hits $2M ARR with AI Writing Agency', snippet: 'Former journalist leverages Claude + custom workflows to serve 200+ clients.', category: 'Business', impact: 'Notable', date: '2026-04-11', slug: 'ai-writing-agency', sourceUrl: '', commentary: '' },
    { id: '4', title: 'Cursor 2.0 Adds Multi-File Agent Mode', snippet: 'AI code editor can now autonomously refactor entire codebases.', category: 'Coding', impact: 'Notable', date: '2026-04-11', slug: 'cursor-2', sourceUrl: '', commentary: '' },
    { id: '5', title: 'NVIDIA Announces B300 GPU with 300GB HBM4', snippet: 'Next-gen data center GPU targets inference workloads, shipping Q3 2026.', category: 'Hardware', impact: 'Routine', date: '2026-04-10', slug: 'nvidia-b300', sourceUrl: '', commentary: '' },
  ];
}

function getMockToolReviews(): ToolReview[] {
  return [
    { id: '1', title: 'Claude Code: The Terminal-First AI Coding Agent', snippet: 'Build full-stack apps 10x faster with agentic AI in your terminal.', rating: 5, pricing: 'Freemium', slug: 'claude-code', date: '2026-04-10', category: 'Coding', url: '' },
    { id: '2', title: 'n8n: Self-Hosted Workflow Automation', snippet: 'Build complex AI workflows without code. Connect 400+ apps and chain LLM calls.', rating: 4, pricing: 'Open Source', slug: 'n8n', date: '2026-04-08', category: 'Automation', url: '' },
    { id: '3', title: 'Midjourney v7: Photorealism Redefined', snippet: 'The latest version delivers near-perfect photorealistic images from text prompts.', rating: 4.5, pricing: 'Paid', slug: 'midjourney-v7', date: '2026-04-06', category: 'Image', url: '' },
  ];
}

function getMockCaseStudies(): CaseStudy[] {
  return [
    { id: '1', title: 'From Zero to $42M: AI-Powered Marketing One-Man Company', snippet: 'How one marketer built a $42M revenue business using AI with zero employees.', industry: 'Marketing', revenue: '$42M', slug: 'ai-marketing-42m', date: '2026-04-09', tags: 'Marketing, Growth' },
    { id: '2', title: 'AI Writing Matrix: $3K to $18K Monthly Revenue', snippet: 'A freelance writer scaled from $3K to $18K/month using AI content systems.', industry: 'Content', revenue: '$18K/mo', slug: 'ai-writing-matrix', date: '2026-04-07', tags: 'Writing, Growth' },
    { id: '3', title: 'Replacing a $200K Data Team with AI', snippet: 'One analyst replaced an entire data team using AI-powered analysis tools.', industry: 'Data', revenue: '$200K saved', slug: 'ai-data-team', date: '2026-04-05', tags: 'Data, Cost Reduction' },
  ];
}
