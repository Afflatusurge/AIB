// Autonomous Daily Brief generation using OpenAI's Responses API.
//
// One call does the whole job:
//   1. Built-in web_search_preview tool → finds recent AI/business news.
//   2. Strict JSON schema output → returns a batch of briefs with EN/ZH/JA
//      translations and editorial metadata, ready to upsert into Supabase.
//
// This replaces the old pipeline that relied on Inoreader for aggregation
// and a separate summarization call per item.

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
  published_at: string;   // ISO 8601; may be the discovery date if publish time unknown
  category: BriefCategory;
  impact: BriefImpact;
  slug: string;           // url-safe, lowercase, hyphen-separated, <= 70 chars
  en: BriefLangBlock;
  zh: BriefLangBlock;
  ja: BriefLangBlock;
}

export interface GenerateOptions {
  max?: number;                    // desired number of briefs (1..12). Default 6.
  excludeUrls?: string[];          // URLs the model should avoid (already ingested)
  excludeTitles?: string[];        // titles the model should avoid (loose dedupe aid)
}

function env(name: string): string | undefined {
  return (globalThis as any)?.process?.env?.[name]
    ?? (import.meta as any)?.env?.[name];
}

const SYSTEM_PROMPT = `You are the editor of "AI and Business", a daily publication for solo operators, indie builders, and small-team founders.

TASK
Use the web_search_preview tool to find the 5-8 most important AI / AI-business news items from the last 24 hours. Focus on developments that actually change what an independent builder or small business could do this week: foundational model launches, pricing / access changes, new agent or coding tools, funding / acquisitions that signal platform shifts, and credible research with near-term practical impact. Skip press-release filler, rumors without sources, and incremental point updates unless they matter for real work.

For every item you include, you MUST have a real URL returned by the web search tool. Do not fabricate URLs, titles, numbers, or quotes. If you cannot find primary reporting, skip the item.

EDITORIAL VOICE
- Calm, analytical, concrete. Never hype. Avoid empty marketing words.
- Tie everything back to: what this changes for a solo operator, what decision or experiment it unlocks, or why they can ignore it.
- No emojis. No "stay tuned". No "exciting". No lead-ins like "In today's fast-moving world of AI…".
- Do not invent facts, company names, numbers, or features that aren't in the source.

OUTPUT
Return a JSON object matching the provided schema exactly. Each brief must contain:
- source_url:   canonical URL of the primary source (company blog > reputable outlet > aggregator).
- source_name:  human-readable publisher name (e.g. "Anthropic", "The Verge", "Bloomberg").
- published_at: ISO 8601 timestamp of the source article. If unknown, use today's date at 12:00 UTC.
- category:     one of LLM, Agent, Business, Coding, Hardware, Image, Video, Research, Funding.
- impact:       "major" (changes indie-builder decisions this week), "notable" (moves market, not urgent), or "routine" (incremental; use sparingly).
- slug:         url-safe, lowercase, hyphen-separated, <= 70 chars, derived from the English title.
- en / zh / ja: each an object with title, snippet, commentary, why_it_matters, body_html.

FIELD RULES
- title: concise headline, <= 80 chars.
- snippet: one sentence, <= 180 chars. Summarize what happened, not why.
- commentary: 1-2 sentences, editor voice.
- why_it_matters: 1-2 sentences addressed to solopreneurs / indie devs / small teams.
- body_html: 120-220 words of valid HTML. Use 2-4 <p>. May include at most one <h2>. No <script>, no inline styles, no images, no external links inside the body.

LANGUAGE RULES
- en: natural American English.
- zh: 简体中文. Keep product / company / model names in their original Latin spelling.
- ja: 自然な日本語. Keep product / company / model names in Latin spelling.

Return ONLY the structured JSON object described by the schema.`;

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

function buildUserPrompt(opts: GenerateOptions): string {
  const target = Math.min(Math.max(opts.max ?? 6, 1), 12);
  const today = new Date().toISOString().slice(0, 10);
  const lines: string[] = [
    `Today is ${today} (UTC).`,
    `Please produce exactly ${target} brief entries covering the most important AI / AI-business developments in the last 24 hours.`,
    `Use the web search tool aggressively — do NOT rely on prior knowledge for what happened today.`,
  ];
  if (opts.excludeUrls && opts.excludeUrls.length) {
    const list = opts.excludeUrls.slice(0, 40).map(u => `- ${u}`).join('\n');
    lines.push('', 'The following source URLs are already ingested — DO NOT re-cover the same stories:', list);
  }
  if (opts.excludeTitles && opts.excludeTitles.length) {
    const list = opts.excludeTitles.slice(0, 40).map(t => `- ${t}`).join('\n');
    lines.push('', 'Recent headlines already covered (avoid near-duplicates):', list);
  }
  return lines.join('\n');
}

/**
 * Call OpenAI Responses API once to discover + summarize + translate a batch
 * of briefs. Returns a normalized, validated list ready for Supabase upsert.
 */
export async function generateDailyBriefs(opts: GenerateOptions = {}): Promise<StructuredBrief[]> {
  const apiKey = env('OPENAI_API_KEY');
  if (!apiKey) throw new Error('OPENAI_API_KEY missing');
  const model = env('OPENAI_MODEL') || 'gpt-4o';

  const body = {
    model,
    tools: [{ type: 'web_search_preview' }],
    input: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildUserPrompt(opts) },
    ],
    text: {
      format: {
        type: 'json_schema',
        name: 'DailyBriefsBatch',
        strict: true,
        schema: briefsBatchSchema,
      },
    },
  };

  const resp = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`OpenAI Responses API error ${resp.status}: ${text.slice(0, 600)}`);
  }

  const payload: any = await resp.json();

  // Prefer the convenience aggregator; fall back to walking the output array.
  let rawText: string = typeof payload.output_text === 'string' ? payload.output_text : '';
  if (!rawText && Array.isArray(payload.output)) {
    for (const entry of payload.output) {
      if (entry?.type === 'message' && Array.isArray(entry.content)) {
        for (const part of entry.content) {
          if (part?.type === 'output_text' && typeof part.text === 'string') {
            rawText += part.text;
          }
        }
      }
    }
  }
  if (!rawText) {
    throw new Error('OpenAI returned no text output');
  }

  let parsed: any;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new Error(`OpenAI returned non-JSON: ${rawText.slice(0, 400)}`);
  }

  const briefs = Array.isArray(parsed?.briefs) ? parsed.briefs : [];
  return briefs.map(normalizeStructured).filter(Boolean) as StructuredBrief[];
}

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

  const clean: StructuredBrief = {
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
  return clean;
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
