// Daily Brief generation — TWO-stage OpenAI pipeline.
//
//   Stage 1 (discovery) — gpt-4o-mini-search-preview, Chat Completions
//     Uses built-in web search to surface 5-8 notable AI / AI-business
//     stories from the last 24 hours. Returns a compact JSON list of
//     { url, title, source_name, published_at, summary }.
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

Use the web search tool to find the most important AI / AI-business news from the last 24 hours. Focus on things that actually change what an indie builder could do this week: foundational model launches, pricing / access changes, new agent or coding tools, meaningful funding or acquisitions, credible research with near-term practical impact. Skip press-release filler, rumor posts, and minor point updates.

RULES
- Every item MUST have a real URL returned by the web search. Never fabricate URLs, titles, numbers, or quotes.
- Prefer primary sources (company blog, official announcement) over aggregators, and reputable press (Bloomberg, Reuters, Ars Technica, The Information, The Verge) over low-quality blogs.
- If you cannot find a credible source for a story, drop it.
- Keep summaries strictly factual — no opinion, no marketing adjectives.

OUTPUT FORMAT — CRITICAL
Your entire response must be a single JSON object and nothing else.
- No prose before or after.
- No markdown code fences.
- No headings, no commentary, no disclaimers.
- Your output is fed directly into JSON.parse(); any non-JSON text will break the pipeline.

Schema:
{
  "items": [
    {
      "url":          "https://...",
      "title":        "concise, accurate headline",
      "source_name":  "publisher name",
      "published_at": "ISO 8601 timestamp if available, otherwise today's date at 12:00 UTC",
      "summary":      "2-4 sentences, neutral, factual"
    }
  ]
}

Keep each summary under ~500 characters. Do not add any extra fields.`;

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
    // NOTE: search-preview models disallow BOTH `temperature` AND `response_format`
    // when web search is enabled. We constrain output via the system prompt and
    // recover JSON below with defensive extraction.
    // Default output cap on search-preview is low enough that 6 items can be
    // truncated mid-JSON; bump it so we always get a complete object.
    max_tokens: 6000,
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
  const items = extractItems(raw);
  if (items === null) {
    throw new Error(`[discover] non-JSON response: ${String(raw).slice(0, 400)}`);
  }
  return items.map(normalizeDiscovered).filter(Boolean) as DiscoveredItem[];
}

/**
 * Extract the `items` array from the model's discovery output.
 *
 * Search-preview models occasionally (a) wrap output in markdown fences,
 * (b) prepend a short lead-in, or (c) — most disruptively — truncate the
 * JSON mid-object because of token limits. This helper tries, in order:
 *
 *   1. raw JSON.parse                      (clean response)
 *   2. ```json ... ``` fence contents
 *   3. first `{` through last `}` slice    (lead-in / trailing prose)
 *   4. salvage: walk the items[] array and keep every complete {…} item,
 *      silently dropping a trailing incomplete one
 *
 * Returns the items array, or null if nothing could be parsed.
 */
function extractItems(raw: string): any[] | null {
  const s = String(raw).trim();

  const tryParseObj = (txt: string): any[] | null => {
    try {
      const obj = JSON.parse(txt);
      if (Array.isArray(obj?.items)) return obj.items;
    } catch {}
    return null;
  };

  // 1) raw
  const a = tryParseObj(s);
  if (a) return a;

  // 2) fenced
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence?.[1]) {
    const b = tryParseObj(fence[1].trim());
    if (b) return b;
  }

  // 3) first { … last }
  const first = s.indexOf('{');
  const last = s.lastIndexOf('}');
  if (first !== -1 && last > first) {
    const c = tryParseObj(s.slice(first, last + 1));
    if (c) return c;
  }

  // 4) salvage from truncation
  return salvageItems(s);
}

/**
 * Walk forward from `"items":[`, brace-matching each object so we can keep
 * the complete ones and drop a final truncated tail. Respects JSON string
 * escaping (so `"}"` inside a value doesn't fool the counter).
 */
function salvageItems(s: string): any[] | null {
  const keyIdx = s.indexOf('"items"');
  if (keyIdx === -1) return null;
  const arrStart = s.indexOf('[', keyIdx);
  if (arrStart === -1) return null;

  const items: any[] = [];
  let i = arrStart + 1;
  const n = s.length;

  while (i < n) {
    // skip whitespace / commas
    while (i < n && (s[i] === ' ' || s[i] === '\t' || s[i] === '\n' || s[i] === '\r' || s[i] === ',')) i++;
    if (i >= n) break;
    if (s[i] === ']') break;
    if (s[i] !== '{') break;

    const objStart = i;
    let depth = 0;
    let inStr = false;
    let escape = false;
    let objEnd = -1;
    for (; i < n; i++) {
      const c = s[i];
      if (escape) { escape = false; continue; }
      if (inStr) {
        if (c === '\\') { escape = true; }
        else if (c === '"') { inStr = false; }
        continue;
      }
      if (c === '"') { inStr = true; continue; }
      if (c === '{') { depth++; continue; }
      if (c === '}') {
        depth--;
        if (depth === 0) { objEnd = i + 1; i++; break; }
      }
    }
    if (objEnd === -1) break; // truncated mid-object — stop here
    try {
      items.push(JSON.parse(s.slice(objStart, objEnd)));
    } catch {
      break;
    }
  }

  return items.length > 0 ? items : null;
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
- Do not invent facts, company names, numbers, or features that aren't supported by the provided summary.

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
