// Daily Brief generation — TWO-stage OpenAI pipeline.
//
//   Stage 1 (discovery) — gpt-4o-mini-search-preview, Chat Completions
//     Uses built-in web search to surface 5-8 notable AI / AI-business
//     stories from the last 24 hours. Returns a compact JSON list of
//     { url, title, source_name, published_at, summary, key_facts }.
//
//   Stage 2 (editor) — gpt-4.1, Chat Completions (json_schema strict)
//     Takes the stage-1 list and, per item, produces the full editorial
//     payload in EN / ZH / JA with category, impact, slug, snippet,
//     commentary, why_it_matters, body_html.
//
// Split rationale: search-preview models are cheap & fresh but mediocre
// writers; gpt-4.1 is a strong editor but has no browsing. Running them
// back-to-back plays to each one's strength.

export interface BriefLangBlock {
  title: string;
  snippet: string;         // 1 sentence (~180 chars max)
  commentary: string;      // 1-2 sentences, editor voice
  why_it_matters: string;  // 1-2 sentences
  body_html: string;       // short HTML article, 120-220 words
}

export type BriefCategory =
  | 'LLM' | 'Agent' | 'Business' | 'Coding'
  | 'Hardware' | 'Image' | 'Video' | 'Research' | 'Funding';

export type BriefImpact = 'major' | 'notable' | 'routine';

export interface StructuredBrief {
  source_url: string;
  source_name: string;
  published_at: string;   // ISO 8601
  category: BriefCategory;
  impact: BriefImpact;
  slug: string;
  en: BriefLangBlock;
  zh: BriefLangBlock;
  ja: BriefLangBlock;
}

export interface DiscoveredItem {
  url: string;
  title: string;
  source_name: string;
  published_at: string;
  summary: string;     // 2-4 sentence neutral summary, used by the editor
  key_facts: string[]; // bullet-form facts preserved for the editor
}

export interface GenerateOptions {
  max?: number;                    // desired number of briefs (1..12). Default 6.
  excludeUrls?: string[];
  excludeTitles?: string[];
}

function env(name: string): string | undefined {
  return (globalThis as any)?.process?.env?.[name]
    ?? (import.meta as any)?.env?.[name];
}

// ─────────────────────────────────────────────────────────────
// Stage 1 — discovery (search preview model)
// ─────────────────────────────────────────────────────────────

const DISCOVERY_SYSTEM = `You are a news-scout for "AI and Business", a daily publication for independent builders and small-team founders.

Use the web_search tool to find the most important AI / AI-business news from the last 24 hours. Focus on things that actually change what an indie builder could do this week: foundational model launches, pricing / access changes, new agent or coding tools, meaningful funding or acquisitions, credible research with near-term practical impact. Skip press-release filler, rumor posts, and minor point updates.

RULES
- Every item MUST have a real URL returned by the web search. Never fabricate URLs, titles, numbers, or quotes.
- Prefer primary sources (company blog, official announcement) over aggregators, and reputable press (Bloomberg, Reuters, Ars Technica, The Information, The Verge) over low-quality blogs.
- If you cannot find a credible source for a story, drop it.
- Keep summaries strictly factual — no opinion, no marketing adjectives.

OUTPUT (JSON only)
{
  "items": [
    {
      "url":          "https://...",
      "title":        "concise, accurate headline",
      "source_name":  "publisher name",
      "published_at": "ISO 8601 timestamp if available, otherwise today's date at 12:00 UTC",
      "summary":      "2-4 sentences, neutral, factual",
      "key_facts":    ["short fact 1", "short fact 2", "..."]
    }
  ]
}

Return ONLY this JSON object.`;

function buildDiscoveryUser(opts: GenerateOptions): string {
  const target = Math.min(Math.max(opts.max ?? 6, 1), 12);
  const today = new Date().toISOString().slice(0, 10);
  const lines: string[] = [
    `Today is ${today} (UTC).`,
    `Find exactly ${target} distinct stories from the last 24 hours that matter to solo operators / indie builders.`,
    `Use the web search tool aggressively — do NOT rely on prior knowledge.`,
  ];
  if (opts.excludeUrls?.length) {
    lines.push('', 'Already ingested — do NOT cover these URLs:', ...opts.excludeUrls.slice(0, 40).map(u => `- ${u}`));
  }
  if (opts.excludeTitles?.length) {
    lines.push('', 'Already covered headlines (avoid near-duplicates):', ...opts.excludeTitles.slice(0, 40).map(t => `- ${t}`));
  }
  return lines.join('\n');
}

export async function discoverNews(opts: GenerateOptions = {}): Promise<DiscoveredItem[]> {
  const apiKey = env('OPENAI_API_KEY');
  if (!apiKey) throw new Error('OPENAI_API_KEY missing');
  const model = env('OPENAI_SEARCH_MODEL') || 'gpt-4o-mini-search-preview';

  const body = {
    model,
    web_search_options: {
      search_context_size: 'medium',
    },
    // NOTE: temperature is NOT supported by search-preview models.
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: DISCOVERY_SYSTEM },
      { role: 'user', content: buildDiscoveryUser(opts) },
    ],
  };

  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`[discover] ${model} error ${resp.status}: ${text.slice(0, 600)}`);
  }
  const json: any = await resp.json();
  const raw = json?.choices?.[0]?.message?.content || '';
  if (!raw) throw new Error('[discover] empty response');
  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`[discover] non-JSON response: ${String(raw).slice(0, 400)}`);
  }
  const items = Array.isArray(parsed?.items) ? parsed.items : [];
  return items.map(normalizeDiscovered).filter(Boolean) as DiscoveredItem[];
}

function normalizeDiscovered(x: any): DiscoveredItem | null {
  if (!x || typeof x !== 'object') return null;
  if (!x.url || !x.title) return null;
  return {
    url: String(x.url).trim(),
    title: String(x.title).trim(),
    source_name: String(x.source_name || '').trim() || 'Unknown',
    published_at: toIso(x.published_at) || new Date().toISOString(),
    summary: String(x.summary || '').trim(),
    key_facts: Array.isArray(x.key_facts) ? x.key_facts.map((k: any) => String(k).trim()).filter(Boolean) : [],
  };
}

// ─────────────────────────────────────────────────────────────
// Stage 2 — editor (gpt-4.1 with strict JSON schema)
// ─────────────────────────────────────────────────────────────

const EDITOR_SYSTEM = `You are the editor of "AI and Business", a daily publication for solo operators, indie builders, and small-team founders.

You will receive a list of news items discovered earlier. For each item, produce a structured trilingual Daily Brief entry (en / zh / ja) plus editorial metadata.

EDITORIAL VOICE
- Calm, analytical, concrete. Never hype. Avoid empty marketing words.
- Tie everything back to: what this changes for a solo operator, what decision or experiment it unlocks, or why they can ignore it.
- No emojis. No "stay tuned". No "exciting". No filler lead-ins.
- Do not invent facts, company names, numbers, or features that aren't supported by the provided summary / key_facts.

FIELDS (per brief)
- source_url:   exactly the url provided.
- source_name:  exactly the source_name provided (or refined if clearly wrong).
- published_at: exactly the published_at provided.
- category:     one of LLM, Agent, Business, Coding, Hardware, Image, Video, Research, Funding.
- impact:       "major" (changes indie-builder decisions this week) | "notable" (moves market, not urgent) | "routine" (use sparingly).
- slug:         url-safe, lowercase, hyphen-separated, <= 70 chars, derived from the English title.
- en / zh / ja: each an object with title, snippet, commentary, why_it_matters, body_html.

FIELD RULES
- title:          <= 80 chars, concise, accurate.
- snippet:        one sentence, <= 180 chars. Summarize what happened.
- commentary:     1-2 sentences, editor voice.
- why_it_matters: 1-2 sentences, addressed to indie builders / small teams.
- body_html:      120-220 words of valid HTML. Use 2-4 <p>. May include at most one <h2>. No <script>, no inline styles, no images, no external links inside the body.

LANGUAGE
- en: natural American English.
- zh: 简体中文. Product / company / model names stay in Latin spelling.
- ja: 自然な日本語. Product / company / model names stay in Latin spelling.

Return ONLY the structured JSON described by the schema.`;

const langBlockSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    title: { type: 'string' },
    snippet: { type: 'string' },
    commentary: { type: 'string' },
    why_it_matters: { type: 'string' },
    body_html: { type: 'string' },
  },
  required: ['title', 'snippet', 'commentary', 'why_it_matters', 'body_html'],
};

const briefsBatchSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    briefs: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          source_url: { type: 'string' },
          source_name: { type: 'string' },
          published_at: { type: 'string' },
          category: {
            type: 'string',
            enum: ['LLM', 'Agent', 'Business', 'Coding', 'Hardware', 'Image', 'Video', 'Research', 'Funding'],
          },
          impact: {
            type: 'string',
            enum: ['major', 'notable', 'routine'],
          },
          slug: { type: 'string' },
          en: langBlockSchema,
          zh: langBlockSchema,
          ja: langBlockSchema,
        },
        required: ['source_url', 'source_name', 'published_at', 'category', 'impact', 'slug', 'en', 'zh', 'ja'],
      },
    },
  },
  required: ['briefs'],
};

export async function editBriefs(items: DiscoveredItem[]): Promise<StructuredBrief[]> {
  if (items.length === 0) return [];
  const apiKey = env('OPENAI_API_KEY');
  if (!apiKey) throw new Error('OPENAI_API_KEY missing');
  const model = env('OPENAI_EDITOR_MODEL') || 'gpt-4.1';

  const body = {
    model,
    temperature: 0.3,
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'DailyBriefsBatch',
        strict: true,
        schema: briefsBatchSchema,
      },
    },
    messages: [
      { role: 'system', content: EDITOR_SYSTEM },
      {
        role: 'user',
        content: JSON.stringify({
          note: 'For each item below, generate a full brief (en/zh/ja) per the schema.',
          items,
        }),
      },
    ],
  };

  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`[editor] ${model} error ${resp.status}: ${text.slice(0, 600)}`);
  }
  const json: any = await resp.json();
  const raw = json?.choices?.[0]?.message?.content || '';
  if (!raw) throw new Error('[editor] empty response');
  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`[editor] non-JSON response: ${String(raw).slice(0, 400)}`);
  }
  const briefs = Array.isArray(parsed?.briefs) ? parsed.briefs : [];
  return briefs.map(normalizeStructured).filter(Boolean) as StructuredBrief[];
}

// ─────────────────────────────────────────────────────────────
// Orchestrator — single entry used by the cron ingest.
// ─────────────────────────────────────────────────────────────

export async function generateDailyBriefs(opts: GenerateOptions = {}): Promise<StructuredBrief[]> {
  const discovered = await discoverNews(opts);
  if (discovered.length === 0) return [];
  // Cap editor input to requested max (discovery may over-deliver).
  const cap = Math.min(Math.max(opts.max ?? 6, 1), 12);
  const feed = discovered.slice(0, cap);
  return await editBriefs(feed);
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function slugify(s: string): string {
  return (s || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 70);
}

function normalizeStructured(b: any): StructuredBrief | null {
  if (!b || typeof b !== 'object') return null;
  if (!b.source_url || !b.en?.title) return null;

  return {
    source_url: String(b.source_url).trim(),
    source_name: String(b.source_name || '').trim() || 'Unknown',
    published_at: toIso(b.published_at) || new Date().toISOString(),
    category: (['LLM', 'Agent', 'Business', 'Coding', 'Hardware', 'Image', 'Video', 'Research', 'Funding']
      .includes(b.category) ? b.category : 'LLM') as BriefCategory,
    impact: (['major', 'notable', 'routine'].includes(b.impact) ? b.impact : 'notable') as BriefImpact,
    slug: slugify(b.slug || b.en?.title || '') || `brief-${Date.now()}`,
    en: normalizeLang(b.en),
    zh: normalizeLang(b.zh),
    ja: normalizeLang(b.ja),
  };
}

function normalizeLang(block: any): BriefLangBlock {
  return {
    title: String(block?.title || '').trim(),
    snippet: String(block?.snippet || '').trim(),
    commentary: String(block?.commentary || '').trim(),
    why_it_matters: String(block?.why_it_matters || '').trim(),
    body_html: String(block?.body_html || ''),
  };
}

function toIso(v: unknown): string | null {
  if (!v) return null;
  const d = new Date(String(v));
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}
