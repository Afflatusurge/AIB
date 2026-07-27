export const prerender = false;

const SITE_URL = (import.meta.env.SITE_URL || 'https://aiandbusiness.com').replace(/\/+$/, '');

export function GET() {
  return new Response(
    [
      'User-agent: *',
      'Allow: /',
      'Disallow: /*/editorial/',
      `Sitemap: ${SITE_URL}/sitemap-index.xml`,
      `Sitemap: ${SITE_URL}/content-sitemap.xml`,
      '',
    ].join('\n'),
    {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    },
  );
}
