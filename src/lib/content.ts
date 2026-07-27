import {
  getCaseStudies as getNotionCaseStudies,
  getPageContent,
  getPlaybooks as getNotionPlaybooks,
  getToolReviews as getNotionToolReviews,
  type CaseStudy,
  type CmsContentItem,
  type CmsSection,
  type Lang,
  type Playbook,
  type ToolReview,
} from './notion';
import { supabaseAdmin } from './supabase';

export interface ContentDocument<T extends CmsContentItem> {
  item: T;
  bodyHtml: string;
}

interface CmsRow {
  notion_page_id: string;
  payload: Record<string, unknown>;
  body_html?: string;
}

const fallbackLists = {
  tools: getNotionToolReviews,
  cases: getNotionCaseStudies,
  playbooks: getNotionPlaybooks,
} satisfies Record<CmsSection, (lang: Lang) => Promise<CmsContentItem[]>>;

function hydrateItem<T extends CmsContentItem>(row: CmsRow): T {
  return {
    ...row.payload,
    id: row.notion_page_id,
  } as T;
}

async function fallbackList<T extends CmsContentItem>(
  section: CmsSection,
  lang: Lang,
): Promise<T[]> {
  return fallbackLists[section](lang) as Promise<T[]>;
}

async function listPublishedContent<T extends CmsContentItem>(
  section: CmsSection,
  lang: Lang,
): Promise<T[]> {
  try {
    const { data, error } = await supabaseAdmin()
      .from('cms_content')
      .select('notion_page_id, payload')
      .eq('section', section)
      .eq('lang', lang)
      .eq('status', 'published')
      .order('featured', { ascending: false })
      .order('published_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (data?.length) return (data as CmsRow[]).map((row) => hydrateItem<T>(row));
  } catch (error: any) {
    console.warn(`[content] Supabase list fallback (${section}/${lang}):`, error?.message || error);
  }

  return fallbackList<T>(section, lang);
}

async function getPublishedContentBySlug<T extends CmsContentItem>(
  section: CmsSection,
  lang: Lang,
  slug: string,
): Promise<ContentDocument<T> | null> {
  try {
    const { data, error } = await supabaseAdmin()
      .from('cms_content')
      .select('notion_page_id, payload, body_html')
      .eq('section', section)
      .eq('lang', lang)
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle();

    if (error) throw error;
    if (data) {
      const row = data as CmsRow;
      return {
        item: hydrateItem<T>(row),
        bodyHtml: row.body_html || '',
      };
    }
  } catch (error: any) {
    console.warn(`[content] Supabase detail fallback (${section}/${lang}/${slug}):`, error?.message || error);
  }

  const items = await fallbackList<T>(section, lang);
  const item = items.find((candidate) => candidate.slug === slug);
  if (!item) return null;
  return {
    item,
    bodyHtml: await getPageContent(item.id),
  };
}

export function listToolReviews(lang: Lang = 'en'): Promise<ToolReview[]> {
  return listPublishedContent<ToolReview>('tools', lang);
}

export function listCaseStudies(lang: Lang = 'en'): Promise<CaseStudy[]> {
  return listPublishedContent<CaseStudy>('cases', lang);
}

export function listPlaybooks(lang: Lang = 'en'): Promise<Playbook[]> {
  return listPublishedContent<Playbook>('playbooks', lang);
}

export function getToolReviewBySlug(slug: string, lang: Lang): Promise<ContentDocument<ToolReview> | null> {
  return getPublishedContentBySlug<ToolReview>('tools', lang, slug);
}

export function getCaseStudyBySlug(slug: string, lang: Lang): Promise<ContentDocument<CaseStudy> | null> {
  return getPublishedContentBySlug<CaseStudy>('cases', lang, slug);
}

export function getPlaybookBySlug(slug: string, lang: Lang): Promise<ContentDocument<Playbook> | null> {
  return getPublishedContentBySlug<Playbook>('playbooks', lang, slug);
}
