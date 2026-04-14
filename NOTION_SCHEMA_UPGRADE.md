# Notion Schema Upgrade For `AIandBusiness 2.0`

This is a practical upgrade guide for the live Notion workspace page:

- `AIandBusiness 2.0`

Based on the current connected databases, here is what already exists and what is worth adding next.

## Current live schema

### Daily Brief (EN)

Already present:

- `Title`
- `Summary`
- `Category`
- `Commentary`
- `Date`
- `Impact`
- `Slug`
- `Source URL`
- `Status`

Assessment:

- This is already close to useful for a newsroom-style brief.
- `Commentary` is effectively doing the job of `Why it matters`.

Recommended additions:

- `Featured` (`checkbox`)
- `Editor Pick Note` (`text`) optional

Suggested usage:

- `Commentary`: why the update matters and for whom
- `Featured`: force a homepage or list-page lead story when needed

## Tool Reviews (EN)

Already present:

- `Tool Name`
- `Tagline`
- `Best For`
- `Category`
- `Pricing`
- `Rating`
- `Publish Date`
- `Official URL`
- `Slug`
- `Cover Image`
- `Status`

Assessment:

- This database is already in strong shape.
- `Best For` is especially valuable and is now wired into the front end.

Highest-value additions:

- `Verdict` (`text`)
- `Workflow Fit` (`text`)
- `Featured` (`checkbox`)

Optional additions:

- `Key Takeaway` (`text`)
- `Watch Outs` (`text`)

Suggested usage:

- `Verdict`: one-sentence editorial recommendation
- `Workflow Fit`: where it belongs in a real solo-business workflow
- `Featured`: control the lead review on homepage and `/tools`

## Case Studies (EN)

Already present:

- `Title`
- `Subtitle`
- `Industry`
- `Problem Type`
- `Revenue Impact`
- `AI Tools Used`
- `Publish Date`
- `Slug`
- `Cover Image`
- `Status`

Assessment:

- `Problem Type` is the most important structural field here.
- This database is already halfway to a much more useful case library.

Highest-value additions:

- `Applicable To` (`text`)
- `Key Takeaway` (`text`)
- `Featured` (`checkbox`)

Optional additions:

- `Core Problem` (`text`)
- `Playbook Step` (`text`)

Suggested usage:

- `Applicable To`: who should care about this case
- `Key Takeaway`: the reusable operating lesson
- `Featured`: control homepage and `/cases` lead story

## Recommended field names

To minimize future code churn, use these exact names where possible:

### Daily Brief

- `Featured`

### Tool Reviews

- `Verdict`
- `Workflow Fit`
- `Key Takeaway`
- `Featured`

### Case Studies

- `Applicable To`
- `Key Takeaway`
- `Core Problem`
- `Featured`

## Front-end behavior already ready for these fields

The site now supports:

- homepage lead priority from `Featured`
- tool summary cards using `Best For`
- case cards using `Problem Type`
- detail-page summary sections using structured fields when present

That means you can add fields incrementally in Notion and the front end will improve without a big refactor.

## Recommended rollout order

1. Add `Featured` to all three EN databases.
2. Add `Verdict` and `Workflow Fit` to `Tool Reviews (EN)`.
3. Add `Applicable To` and `Key Takeaway` to `Case Studies (EN)`.
4. Decide whether `Daily Brief` needs a separate `Why It Matters` field or whether `Commentary` is enough.

## Translation note

If EN remains the source of truth, keep field names consistent across JA/ZH databases even if the values are localized. That will keep the front end much simpler over time.
