import type { NewsSourceDefinition, WatchPriority } from '../../config/news-sources';

export type ReleaseEventType =
  | 'new_model'
  | 'major_version'
  | 'availability'
  | 'pricing'
  | 'deprecation'
  | 'api_change'
  | 'license_change'
  | 'major_feature'
  | 'not_release';

export interface ReleaseClassification {
  isRelease: boolean;
  eventType: ReleaseEventType;
  priority: WatchPriority;
  matchedProduct?: string;
  reasons: string[];
}

const RELEASE_TERMS =
  /\b(introduc(?:e|es|ing)|launch(?:es|ed|ing)?|release(?:s|d)?|unveil(?:s|ed)?|available now|general availability|now available|正式发布|发布|上线|推出|リリース|提供開始)\b/i;
const MODEL_TERMS =
  /\b(model|llm|agent|video generation|image generation|audio generation|foundation model|模型|视频生成|图像生成|音频生成|エージェント|モデル)\b/i;
const VERSION_TERM = /\b(?:v(?:ersion)?\s*)?\d+(?:\.\d+){0,2}\b/i;
const PRICING_TERMS = /\b(pric(?:e|ing)|cost|rate limit|token price|价格|定价|料金|価格)\b/i;
const DEPRECATION_TERMS = /\b(deprecat(?:e|ed|ion)|sunset|retir(?:e|ed)|end of support|下线|停用|弃用|廃止)\b/i;
const API_TERMS = /\b(api|sdk|developer platform|endpoint|context window|rate limit|接口|开发者平台)\b/i;
const LICENSE_TERMS = /\b(license|licence|open source|open weights|许可证|开源|ライセンス)\b/i;
const AVAILABILITY_TERMS =
  /\b(general availability|now available|available (?:in|to|for)|api access|public preview|open beta|全面开放|开放使用|上线|提供開始)\b/i;

function includesTerm(text: string, terms: string[] = []): string | null {
  const lower = text.toLowerCase();
  return terms.find((term) => lower.includes(term.toLowerCase())) || null;
}

export function classifyRelease(
  title: string,
  summary: string,
  source: NewsSourceDefinition
): ReleaseClassification {
  const text = `${title} ${summary}`.replace(/\s+/g, ' ').trim();
  const reasons: string[] = [];
  const excluded = includesTerm(text, source.excludeTerms);
  if (excluded) {
    return {
      isRelease: false,
      eventType: 'not_release',
      priority: 'P2',
      reasons: [`excluded term: ${excluded}`],
    };
  }

  const matchedProduct = includesTerm(text, source.products);
  if (matchedProduct) reasons.push(`watch product: ${matchedProduct}`);

  let eventType: ReleaseEventType = 'not_release';
  if (DEPRECATION_TERMS.test(text)) eventType = 'deprecation';
  else if (PRICING_TERMS.test(text)) eventType = 'pricing';
  else if (LICENSE_TERMS.test(text)) eventType = 'license_change';
  else if (VERSION_TERM.test(text) && (RELEASE_TERMS.test(text) || matchedProduct)) {
    eventType = 'major_version';
  }
  else if (RELEASE_TERMS.test(text) && MODEL_TERMS.test(text)) eventType = 'new_model';
  else if (API_TERMS.test(text) && RELEASE_TERMS.test(text)) eventType = 'api_change';
  else if (AVAILABILITY_TERMS.test(text)) eventType = 'availability';
  else if (RELEASE_TERMS.test(text) && matchedProduct) eventType = 'major_feature';

  if (eventType === 'not_release') {
    return {
      isRelease: false,
      eventType,
      priority: 'P2',
      matchedProduct: matchedProduct || undefined,
      reasons: ['no material release event detected'],
    };
  }

  reasons.push(`event: ${eventType}`);
  const p0Types = new Set<ReleaseEventType>([
    'new_model',
    'major_version',
    'pricing',
    'deprecation',
    'license_change',
  ]);
  const priority: WatchPriority = p0Types.has(eventType)
    ? 'P0'
    : source.watchPriority === 'P0' && matchedProduct
      ? 'P0'
      : 'P1';

  return {
    isRelease: true,
    eventType,
    priority,
    matchedProduct: matchedProduct || undefined,
    reasons,
  };
}
