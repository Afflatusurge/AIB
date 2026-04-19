import { getDailyBriefs, getToolReviews, getCaseStudies } from '../lib/notion';

const SITE_URL = import.meta.env.SITE_URL || 'https://aiandbusiness.com';

export async function GET() {
  const dailyBriefs = await getDailyBriefs();
  const toolReviews = await getToolReviews();
  const caseStudies = await getCaseStudies();

  // Combine all content and sort by date
  const allContent = [
    ...dailyBriefs.map((brief) => ({
      id: brief.id,
      title: brief.title,
      description: brief.snippet,
      link: `${SITE_URL}/en/daily/${brief.slug || brief.id}/`,
      pubDate: new Date(brief.date),
      category: 'Daily Brief',
    })),
    ...toolReviews.map((tool) => ({
      id: tool.slug,
      title: tool.title,
      description: tool.snippet,
      link: `${SITE_URL}/en/tools/${tool.slug}/`,
      pubDate: new Date(tool.date),
      category: 'Tool Review',
    })),
    ...caseStudies.map((caseStudy) => ({
      id: caseStudy.slug,
      title: caseStudy.title,
      description: caseStudy.snippet,
      link: `${SITE_URL}/en/cases/${caseStudy.slug}/`,
      pubDate: new Date(caseStudy.date),
      category: 'Case Study',
    })),
  ].sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());

  const rssContent = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>AI Solopreneur Guide</title>
    <link>${SITE_URL}</link>
    <description>Your comprehensive guide to building and scaling AI-powered solo businesses. Daily insights, tool reviews, and proven case studies.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <image>
      <url>${SITE_URL}/icon-512.png</url>
      <title>AI Solopreneur Guide</title>
      <link>${SITE_URL}</link>
    </image>
    ${allContent
      .map(
        (item) => `
    <item>
      <title>${escapeXml(item.title)}</title>
      <description>${escapeXml(item.description)}</description>
      <link>${item.link}</link>
      <guid isPermaLink="true">${item.link}</guid>
      <pubDate>${item.pubDate.toUTCString()}</pubDate>
      <category>${escapeXml(item.category)}</category>
    </item>
    `
      )
      .join('')}
  </channel>
</rss>`;

  return new Response(rssContent, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

function escapeXml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
