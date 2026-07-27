import { listCaseStudies, listPlaybooks, listToolReviews } from '../lib/content';
import type { Lang } from '../lib/notion';

export const prerender = false;

const SITE_URL = (import.meta.env.SITE_URL || 'https://aiandbusiness.com').replace(/\/+$/, '');
const LANGS: Lang[] = ['en', 'zh', 'ja'];

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const groups = await Promise.all(
    LANGS.map(async (lang) => {
      const [tools, cases, playbooks] = await Promise.all([
        listToolReviews(lang),
        listCaseStudies(lang),
        listPlaybooks(lang),
      ]);
      return [
        ...tools.map((item) => ({ lang, section: 'tools', ...item })),
        ...cases.map((item) => ({ lang, section: 'cases', ...item })),
        ...playbooks.map((item) => ({ lang, section: 'playbooks', ...item })),
      ];
    }),
  );

  const urls = groups
    .flat()
    .map((item) => {
      const loc = `${SITE_URL}/${item.lang}/${item.section}/${item.slug}/`;
      const lastmod = item.date ? `<lastmod>${escapeXml(item.date)}</lastmod>` : '';
      return `<url><loc>${escapeXml(loc)}</loc>${lastmod}</url>`;
    })
    .join('');

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`,
    {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
      },
    },
  );
}
