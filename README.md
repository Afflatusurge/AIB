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
