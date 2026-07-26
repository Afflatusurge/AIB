-- Daily Brief 3.0: shared source layer, release candidates, and trust metadata.
-- Apply this migration before deploying code that writes the new columns.

create extension if not exists pgcrypto;

create table if not exists public.news_sources (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  entity text,
  products text[] not null default '{}',
  domains text[] not null default '{}',
  adapter text not null check (adapter in ('rss', 'html_links', 'sitemap', 'web_search', 'policy_only')),
  feed_url text,
  page_url text,
  source_kind text not null,
  reliability text not null check (reliability in ('A', 'B', 'C', 'blocked')),
  independent boolean not null default false,
  allow_discovery boolean not null default true,
  allow_auto_publish boolean not null default false,
  requires_corroboration boolean not null default false,
  must_watch boolean not null default false,
  watch_priority text check (watch_priority in ('P0', 'P1', 'P2')),
  enabled boolean not null default true,
  etag text,
  last_modified text,
  last_content_hash text,
  last_checked_at timestamptz,
  last_success_at timestamptz,
  last_error text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.source_entries (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.news_sources(id) on delete cascade,
  canonical_url text not null unique,
  title text not null,
  summary text,
  article_text text,
  content_hash text not null,
  source_published_at timestamptz not null,
  source_updated_at timestamptz,
  discovered_at timestamptz not null default now(),
  event_type text,
  event_priority text check (event_priority in ('P0', 'P1', 'P2')),
  status text not null default 'discovered'
    check (status in ('discovered', 'candidate', 'ignored', 'published', 'rejected', 'failed')),
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.news_candidates (
  id uuid primary key default gen_random_uuid(),
  source_entry_id uuid not null unique references public.source_entries(id) on delete cascade,
  event_key text not null unique,
  event_type text not null,
  priority text not null check (priority in ('P0', 'P1', 'P2')),
  editorial_status text not null default 'discovered'
    check (editorial_status in (
      'discovered',
      'researched',
      'drafted',
      'needs_review',
      'approved',
      'published',
      'rejected',
      'failed'
    )),
  authority_score integer,
  freshness_score integer,
  relevance_score integer,
  actionability_score integer,
  novelty_score integer,
  corroboration_score integer,
  promotion_penalty integer,
  total_score integer,
  fact_sheet jsonb not null default '{}'::jsonb,
  corroborating_sources jsonb not null default '[]'::jsonb,
  flags jsonb not null default '[]'::jsonb,
  rejection_reasons jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.briefs
  add column if not exists candidate_id uuid references public.news_candidates(id) on delete set null,
  add column if not exists content_kind text not null default 'signal',
  add column if not exists editorial_status text not null default 'published',
  add column if not exists source_kind text,
  add column if not exists source_reliability text,
  add column if not exists source_independent boolean,
  add column if not exists source_published_at timestamptz,
  add column if not exists source_updated_at timestamptz,
  add column if not exists verified_at timestamptz,
  add column if not exists verification_status text,
  add column if not exists confidence text,
  add column if not exists quality_score integer,
  add column if not exists editorial_flags jsonb not null default '{}'::jsonb;

alter table public.brief_translations
  add column if not exists what_happened text,
  add column if not exists key_facts jsonb not null default '[]'::jsonb,
  add column if not exists action_now text,
  add column if not exists watch_next text,
  add column if not exists caveat text,
  add column if not exists source_note text,
  add column if not exists body_blocks jsonb not null default '[]'::jsonb,
  add column if not exists translation_status text,
  add column if not exists translation_quality_flags jsonb not null default '[]'::jsonb;

create index if not exists news_sources_watch_idx
  on public.news_sources (enabled, must_watch, watch_priority);
create index if not exists source_entries_source_date_idx
  on public.source_entries (source_id, source_published_at desc);
create index if not exists source_entries_event_idx
  on public.source_entries (event_priority, event_type, status);
create index if not exists news_candidates_status_idx
  on public.news_candidates (editorial_status, priority, created_at desc);
create index if not exists briefs_source_published_idx
  on public.briefs (source_published_at desc);
create index if not exists briefs_candidate_idx
  on public.briefs (candidate_id);

-- These tables are server-side editorial infrastructure. The service-role key
-- bypasses RLS; no anonymous policies are intentionally created.
alter table public.news_sources enable row level security;
alter table public.source_entries enable row level security;
alter table public.news_candidates enable row level security;

-- Supabase projects created with the newer secure-by-default Data API settings
-- do not automatically grant service_role access to newly created tables.
-- Keep the editorial pipeline private and grant only the operations it uses.
revoke all on table public.news_sources from anon, authenticated;
revoke all on table public.source_entries from anon, authenticated;
revoke all on table public.news_candidates from anon, authenticated;
revoke all on table public.news_sources from service_role;
revoke all on table public.source_entries from service_role;
revoke all on table public.news_candidates from service_role;

grant select, insert, update on table public.news_sources to service_role;
grant select, insert, update on table public.source_entries to service_role;
grant select, insert, update on table public.news_candidates to service_role;
