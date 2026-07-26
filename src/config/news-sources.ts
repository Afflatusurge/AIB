export type SourceReliability = 'A' | 'B' | 'C' | 'blocked';
export type SourceKind =
  | 'official_release'
  | 'primary_research'
  | 'regulator'
  | 'media'
  | 'specialist_media'
  | 'vendor_marketing';
export type SourceAdapter = 'rss' | 'html_links' | 'sitemap' | 'web_search' | 'policy_only';
export type WatchPriority = 'P0' | 'P1' | 'P2';

export interface NewsSourceDefinition {
  slug: string;
  name: string;
  entity?: string;
  products?: string[];
  domains: string[];
  adapter: SourceAdapter;
  feedUrl?: string;
  pageUrl?: string;
  allowedPathPrefixes?: string[];
  reliability: SourceReliability;
  kind: SourceKind;
  independent: boolean;
  allowDiscovery: boolean;
  allowAutoPublish: boolean;
  requiresCorroboration: boolean;
  mustWatch?: boolean;
  watchPriority?: WatchPriority;
  includeTerms?: string[];
  excludeTerms?: string[];
}

/**
 * Editorial source registry.
 *
 * Feed/page URLs are intentionally explicit. A source being reachable does
 * not make it publishable: the policy fields below decide whether an item can
 * enter discovery, needs review, or may use the P0 release fast lane.
 */
export const NEWS_SOURCES: NewsSourceDefinition[] = [
  {
    slug: 'openai',
    name: 'OpenAI',
    entity: 'OpenAI',
    products: ['GPT', 'ChatGPT', 'Codex', 'Sora', 'o-series'],
    domains: ['openai.com'],
    adapter: 'rss',
    feedUrl: 'https://openai.com/news/rss.xml',
    reliability: 'A',
    kind: 'official_release',
    independent: false,
    allowDiscovery: true,
    allowAutoPublish: true,
    requiresCorroboration: false,
    mustWatch: true,
    watchPriority: 'P0',
    excludeTerms: ['board', 'office', 'partnership', 'customer story', 'education program'],
  },
  {
    slug: 'anthropic',
    name: 'Anthropic',
    entity: 'Anthropic',
    products: ['Claude', 'Claude Code', 'Claude API'],
    domains: ['anthropic.com'],
    adapter: 'html_links',
    pageUrl: 'https://www.anthropic.com/news',
    allowedPathPrefixes: ['/news/'],
    reliability: 'A',
    kind: 'official_release',
    independent: false,
    allowDiscovery: true,
    allowAutoPublish: true,
    requiresCorroboration: false,
    mustWatch: true,
    watchPriority: 'P0',
    excludeTerms: ['appoint', 'partnership', 'case study', 'policy', 'economic index'],
  },
  {
    slug: 'google-ai',
    name: 'Google AI',
    entity: 'Google',
    products: ['Gemini', 'Veo', 'Imagen', 'Gemma', 'Lyria'],
    domains: ['blog.google', 'deepmind.google'],
    adapter: 'rss',
    feedUrl: 'https://blog.google/technology/ai/rss/',
    reliability: 'A',
    kind: 'official_release',
    independent: false,
    allowDiscovery: true,
    allowAutoPublish: true,
    requiresCorroboration: false,
    mustWatch: true,
    watchPriority: 'P0',
    excludeTerms: ['partnership', 'customer', 'education', 'policy'],
  },
  {
    slug: 'mistral-ai',
    name: 'Mistral AI',
    entity: 'Mistral AI',
    products: ['Mistral', 'Magistral', 'Codestral', 'Devstral', 'Le Chat', 'Voxtral'],
    domains: ['mistral.ai'],
    adapter: 'html_links',
    pageUrl: 'https://mistral.ai/news',
    allowedPathPrefixes: ['/news/'],
    reliability: 'A',
    kind: 'official_release',
    independent: false,
    allowDiscovery: true,
    allowAutoPublish: true,
    requiresCorroboration: false,
    mustWatch: true,
    watchPriority: 'P0',
    excludeTerms: ['partnership', 'customer story', 'office', 'funding'],
  },
  {
    slug: 'meta-ai',
    name: 'Meta AI',
    entity: 'Meta',
    products: ['Llama', 'Meta AI', 'SAM', 'Segment Anything'],
    domains: ['ai.meta.com'],
    adapter: 'web_search',
    pageUrl: 'https://ai.meta.com/blog/',
    allowedPathPrefixes: ['/blog/'],
    reliability: 'A',
    kind: 'official_release',
    independent: false,
    allowDiscovery: true,
    allowAutoPublish: true,
    requiresCorroboration: false,
    mustWatch: true,
    watchPriority: 'P0',
    excludeTerms: ['partnership', 'grant', 'community', 'economic impact'],
  },
  {
    slug: 'xai',
    name: 'xAI',
    entity: 'xAI',
    products: ['Grok', 'Grok Build', 'xAI API'],
    domains: ['x.ai'],
    adapter: 'web_search',
    pageUrl: 'https://x.ai/news',
    allowedPathPrefixes: ['/news/'],
    reliability: 'A',
    kind: 'official_release',
    independent: false,
    allowDiscovery: true,
    allowAutoPublish: true,
    requiresCorroboration: false,
    mustWatch: true,
    watchPriority: 'P0',
    excludeTerms: ['data center', 'funding', 'acquisition'],
  },
  {
    slug: 'deepseek',
    name: 'DeepSeek',
    entity: 'DeepSeek',
    products: ['DeepSeek', 'deepseek-chat', 'deepseek-reasoner'],
    domains: ['api-docs.deepseek.com'],
    adapter: 'sitemap',
    pageUrl: 'https://api-docs.deepseek.com/sitemap.xml',
    allowedPathPrefixes: ['/news/', '/updates/'],
    reliability: 'A',
    kind: 'official_release',
    independent: false,
    allowDiscovery: true,
    allowAutoPublish: true,
    requiresCorroboration: false,
    mustWatch: true,
    watchPriority: 'P0',
    includeTerms: ['news'],
  },
  {
    slug: 'qwen',
    name: 'Qwen',
    entity: 'Alibaba Cloud',
    products: ['Qwen', 'QVQ', 'Wan', 'QwQ'],
    domains: ['qwenlm.github.io'],
    adapter: 'web_search',
    pageUrl: 'https://qwenlm.github.io/blog/',
    allowedPathPrefixes: ['/blog/'],
    reliability: 'A',
    kind: 'official_release',
    independent: false,
    allowDiscovery: true,
    allowAutoPublish: true,
    requiresCorroboration: false,
    mustWatch: true,
    watchPriority: 'P0',
    excludeTerms: ['community', 'challenge', 'conference'],
  },
  {
    slug: 'bytedance-seed',
    name: 'ByteDance Seed',
    entity: 'ByteDance',
    products: ['Seedance', 'Seedream', 'Seed2', 'Seed3D', 'Doubao', 'UI-TARS'],
    domains: ['seed.bytedance.com'],
    adapter: 'sitemap',
    pageUrl: 'https://seed.bytedance.com/sitemap.xml',
    allowedPathPrefixes: ['/blog/', '/en/blog/'],
    reliability: 'A',
    kind: 'official_release',
    independent: false,
    allowDiscovery: true,
    allowAutoPublish: true,
    requiresCorroboration: false,
    mustWatch: true,
    watchPriority: 'P0',
    excludeTerms: ['recruitment', 'campus', 'internship'],
  },
  {
    slug: 'runway',
    name: 'Runway',
    entity: 'Runway',
    products: ['Runway', 'Gen', 'Aleph', 'Frames', 'Act-One'],
    domains: ['runway.com', 'runwayml.com'],
    adapter: 'sitemap',
    pageUrl: 'https://runway.com/sitemap.xml',
    allowedPathPrefixes: ['/news/'],
    reliability: 'A',
    kind: 'official_release',
    independent: false,
    allowDiscovery: true,
    allowAutoPublish: true,
    requiresCorroboration: false,
    mustWatch: true,
    watchPriority: 'P0',
    excludeTerms: ['customer stor', 'partnership', 'office', 'report'],
  },
  {
    slug: 'luma-ai',
    name: 'Luma AI',
    entity: 'Luma AI',
    products: ['Luma', 'Ray', 'Dream Machine', 'Uni'],
    domains: ['lumalabs.ai'],
    adapter: 'html_links',
    pageUrl: 'https://lumalabs.ai/news',
    allowedPathPrefixes: ['/news/'],
    reliability: 'A',
    kind: 'official_release',
    independent: false,
    allowDiscovery: true,
    allowAutoPublish: true,
    requiresCorroboration: false,
    mustWatch: true,
    watchPriority: 'P0',
    excludeTerms: ['partnership', 'customer', 'award', 'office', 'funding'],
  },
  {
    slug: 'elevenlabs',
    name: 'ElevenLabs',
    entity: 'ElevenLabs',
    products: ['Eleven v3', 'Scribe', 'Dubbing', 'Eleven Music', 'ElevenReader'],
    domains: ['elevenlabs.io'],
    adapter: 'html_links',
    pageUrl: 'https://elevenlabs.io/blog/category/research',
    allowedPathPrefixes: ['/blog/'],
    reliability: 'A',
    kind: 'official_release',
    independent: false,
    allowDiscovery: true,
    allowAutoPublish: true,
    requiresCorroboration: false,
    mustWatch: true,
    watchPriority: 'P0',
    excludeTerms: ['customer story', 'partnership', 'funding'],
  },
  {
    slug: 'ideogram',
    name: 'Ideogram',
    entity: 'Ideogram',
    products: ['Ideogram', 'Canvas', 'Magic Fill'],
    domains: ['ideogram.ai'],
    adapter: 'sitemap',
    pageUrl: 'https://ideogram.ai/sitemap-0.xml',
    allowedPathPrefixes: ['/news/', '/blog/'],
    reliability: 'A',
    kind: 'official_release',
    independent: false,
    allowDiscovery: true,
    allowAutoPublish: true,
    requiresCorroboration: false,
    mustWatch: true,
    watchPriority: 'P0',
    excludeTerms: ['funding', 'partnership'],
  },
  {
    slug: 'recraft',
    name: 'Recraft',
    entity: 'Recraft',
    products: ['Recraft'],
    domains: ['recraft.ai'],
    adapter: 'html_links',
    pageUrl: 'https://www.recraft.ai/blog-announcements',
    allowedPathPrefixes: ['/blog/'],
    reliability: 'A',
    kind: 'official_release',
    independent: false,
    allowDiscovery: true,
    allowAutoPublish: true,
    requiresCorroboration: false,
    mustWatch: true,
    watchPriority: 'P0',
    excludeTerms: ['partnership', 'customer', 'funding'],
  },
  {
    slug: 'techcrunch-ai',
    name: 'TechCrunch',
    domains: ['techcrunch.com'],
    adapter: 'rss',
    feedUrl: 'https://techcrunch.com/category/artificial-intelligence/feed/',
    reliability: 'B',
    kind: 'media',
    independent: true,
    allowDiscovery: true,
    allowAutoPublish: false,
    requiresCorroboration: false,
  },
  {
    slug: 'the-verge-ai',
    name: 'The Verge',
    domains: ['theverge.com'],
    adapter: 'rss',
    feedUrl: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml',
    reliability: 'B',
    kind: 'media',
    independent: true,
    allowDiscovery: true,
    allowAutoPublish: false,
    requiresCorroboration: false,
  },
  {
    slug: 'venturebeat-ai',
    name: 'VentureBeat',
    domains: ['venturebeat.com'],
    adapter: 'rss',
    feedUrl: 'https://venturebeat.com/category/ai/feed/',
    reliability: 'B',
    kind: 'specialist_media',
    independent: true,
    allowDiscovery: true,
    allowAutoPublish: false,
    requiresCorroboration: false,
  },
  {
    slug: 'reuters',
    name: 'Reuters',
    domains: ['reuters.com'],
    adapter: 'policy_only',
    reliability: 'A',
    kind: 'media',
    independent: true,
    allowDiscovery: true,
    allowAutoPublish: true,
    requiresCorroboration: false,
  },
  {
    slug: 'ars-technica',
    name: 'Ars Technica',
    domains: ['arstechnica.com'],
    adapter: 'policy_only',
    reliability: 'A',
    kind: 'specialist_media',
    independent: true,
    allowDiscovery: true,
    allowAutoPublish: true,
    requiresCorroboration: false,
  },
];

function normalizedHost(value: string): string {
  try {
    return new URL(value).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return value.toLowerCase().replace(/^www\./, '');
  }
}

export function findNewsSourceByUrl(url: string): NewsSourceDefinition | null {
  const host = normalizedHost(url);
  return NEWS_SOURCES.find((source) =>
    source.domains.some((domain) => host === domain || host.endsWith(`.${domain}`))
  ) || null;
}

export function listDiscoveryFeeds(): NewsSourceDefinition[] {
  return NEWS_SOURCES.filter((source) =>
    source.allowDiscovery && source.adapter === 'rss' && !!source.feedUrl
  );
}

export function listWatchedSources(): NewsSourceDefinition[] {
  return NEWS_SOURCES.filter((source) =>
    source.mustWatch && source.allowDiscovery && source.adapter !== 'policy_only'
  );
}
