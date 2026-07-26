# AIandBusiness 2.0

Astro front end for the new `aiandbusiness.com`, with Notion as CMS, Vercel deployment, and a multilingual content model for:

- `Daily Brief`
- `Tool Reviews`
- `Case Studies`
- `Playbooks`

## Local commands

```bash
npm install
npm run dev
npm run build
npm run test:news
npm run check:types
npm run preview
```

## Environment variables

Create a `.env` file with:

```bash
NOTION_API_KEY=

NOTION_DB_DAILY_EN=
NOTION_DB_DAILY_JA=
NOTION_DB_DAILY_ZH=

NOTION_DB_TOOLS_EN=
NOTION_DB_TOOLS_JA=
NOTION_DB_TOOLS_ZH=

NOTION_DB_CASES_EN=
NOTION_DB_CASES_JA=
NOTION_DB_CASES_ZH=

NOTION_DB_PLAYBOOKS_EN=
NOTION_DB_PLAYBOOKS_JA=
NOTION_DB_PLAYBOOKS_ZH=
```

If Notion is unavailable during build, the site falls back to mock data so the front end can still render.

## Daily Brief 3.0

Daily Brief is stored in Supabase and now has two server-side ingestion paths:

- `/api/cron/ingest`: once-daily broad discovery, capped at three qualified stories.
- `/api/cron/releases`: Watchlist monitor, scheduled by Supabase Cron every six hours.

Both paths require `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
`OPENAI_API_KEY`, and `CRON_SECRET`. Public brief reads additionally require
`SUPABASE_PUBLISHABLE_KEY`. Cron endpoints fail closed when `CRON_SECRET` is
missing.

Before deploying this code, apply the migrations in order:

```text
supabase/migrations/202607260001_news_pipeline.sql
supabase/migrations/202607260002_news_pipeline_privileges.sql
supabase/migrations/202607260003_mark_legacy_briefs_unverified.sql
supabase/migrations/202607260004_supabase_release_cron.sql
```

The release schedule runs at `00:00`, `06:00`, `12:00`, and `18:00` UTC.
Supabase Vault owns the scheduler secret; the application validates it through
a service-role-only RPC. This keeps the four-times-daily monitor compatible
with Vercel Hobby while leaving the broad ingest on Vercel's daily Cron.

Then run the legacy-content audit in dry-run mode:

```bash
npm run audit:briefs
```

Review its output before using `npm run audit:briefs -- --apply`, which moves
flagged published rows back to draft without deleting them.

The source and Watchlist policy lives in `src/config/news-sources.ts`. RSS,
official sitemaps/pages, and official-domain search fallbacks all normalize
into the same candidate pipeline. A source can be paused operationally by
setting its `news_sources.enabled` row to `false`.

## Recommended Notion properties

The front end now supports multiple aliases for editorial fields. You do not need every field, but adding them will make the site feel much more structured.

### Daily Brief

Required:

- `Title`
- `Summary`
- `Category`
- `Impact`
- `Date`
- `Slug`

Optional:

- `Source URL`
- `Commentary`
- `Why It Matters`
- `Featured` or `Lead` or `Homepage`

### Tool Reviews

Required:

- `Tool Name` or `Title`
- `Tagline` or `Summary`
- `Pricing`
- `Rating`
- `Publish Date`
- `Slug`

Optional:

- `Category`
- `Official URL`
- `Verdict`
- `Best For`
- `Workflow Fit`
- `Key Takeaway`
- `Featured` or `Lead` or `Homepage`

### Case Studies

Required:

- `Title`
- `Subtitle` or `Summary`
- `Industry`
- `Revenue Impact` or `Revenue`
- `Publish Date`
- `Slug`

Optional:

- `AI Tools Used` or `Tags`
- `Problem`
- `Applicable To`
- `Key Takeaway`
- `Featured` or `Lead` or `Homepage`

### Playbooks

Required:

- `Title`
- `Summary`
- `Category`
- `Outcome`
- `Best For`
- `Use When`
- `Slug`
- `Publish Date`

Optional:

- `Featured`
- `Status`
- `Cover Image`

## Editorial behavior wired into the front end

- Homepage and list pages prioritize entries marked `Featured`, then fall back to the newest entry.
- Article pages render summary cards before the main body.
- Article pages auto-generate an `On this page` rail from `h2` headings.
- Tool and case article summaries now prefer structured Notion fields over inferred fallback copy.
- Playbooks now follow the same multilingual Notion pattern as briefs, reviews, and cases.

## Current direction

The site is intentionally moving away from a SaaS-style landing page and toward an editorial publication:

- stronger hierarchy
- front-page style sectioning
- structured article summaries
- more readable long-form layouts
- clearer distinction between briefs, reviews, and cases

## Next recommended step

Push the Notion schema a bit further so article templates can rely on real editorial fields for:

- `verdict`
- `best for`
- `workflow fit`
- `key takeaway`
- `featured`

Once those fields are consistently populated, we can tighten the design again and reduce fallback copy throughout the site.
