import { Client } from '@notionhq/client';

export const notionClient = new Client({
  auth: import.meta.env.NOTION_API_KEY || 'dummy_key',
});

export const getDailyBriefs = async () => {
    return [
        { id: '1', category: 'AI News', impact: 'high', title: 'GPT-5 Rumored Capabilities', snippet: 'Latest rumors suggest massive multi-modal leaps...', date: '2026-04-12' },
        { id: '2', category: 'Strategy', impact: 'med', title: 'Scaling 1-Person Agencies', snippet: 'How automation is replacing the traditional agency model.', date: '2026-04-11' },
    ];
};

export const getToolReviews = async () => {
    return [
        { slug: 'claude-3', rating: 5, pricing: 'freemium', title: 'Claude 3 Opus vs GPT-4', snippet: 'An in-depth look at coding performance differences.', date: '2026-04-10' },
        { slug: 'midjourney-v6', rating: 4.5, pricing: 'paid', title: 'Midjourney v6 is here', snippet: 'Realistic photo generation hits a new plateau.', date: '2026-04-09' },
    ];
};

export const getCaseStudies = async () => {
    return [
        { slug: 'newsletter-ai', industry: 'Media', revenue: '$10k/mo', title: 'Automated AI Newsletter', snippet: 'How a solo founder reached $10k MRR in 3 months with AI content generation.', date: '2026-04-08' },
        { slug: 'saas-micro', industry: 'SaaS', revenue: '$5k/mo', title: 'Micro-SaaS for Realtors', snippet: 'Building a specialized AI copywriter for real estate listings.', date: '2026-04-07' },
    ];
};
