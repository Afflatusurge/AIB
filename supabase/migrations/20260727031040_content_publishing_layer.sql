-- Dynamic publishing layer for Notion-authored tools, cases, and playbooks.
-- Notion remains the editorial source of truth. Supabase stores the published
-- snapshot used by Astro SSR so content changes do not require a Vercel build.

create table public.cms_content (
  id uuid primary key default gen_random_uuid(),
  section text not null check (section in ('tools', 'cases', 'playbooks')),
  lang text not null check (lang in ('en', 'zh', 'ja')),
  slug text not null check (slug = lower(slug) and slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  title text not null,
  snippet text not null default '',
  featured boolean not null default false,
  published_at date,
  body_html text not null default '',
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  notion_page_id uuid not null unique,
  notion_database_id uuid not null,
  notion_last_edited_at timestamptz not null,
  source_synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (section, lang, slug)
);

create index cms_content_published_listing_idx
  on public.cms_content (
    section,
    lang,
    featured desc,
    published_at desc nulls last,
    created_at desc
  )
  where status = 'published';

create index cms_content_source_scope_idx
  on public.cms_content (notion_database_id, notion_last_edited_at desc);

create table public.cms_sync_runs (
  id uuid primary key default gen_random_uuid(),
  trigger text not null check (trigger in ('manual', 'cron', 'deploy', 'api')),
  section text check (section in ('tools', 'cases', 'playbooks')),
  lang text check (lang in ('en', 'zh', 'ja')),
  status text not null default 'running' check (status in ('running', 'completed', 'failed')),
  scanned_count integer not null default 0 check (scanned_count >= 0),
  changed_count integer not null default 0 check (changed_count >= 0),
  unchanged_count integer not null default 0 check (unchanged_count >= 0),
  published_count integer not null default 0 check (published_count >= 0),
  draft_count integer not null default 0 check (draft_count >= 0),
  archived_count integer not null default 0 check (archived_count >= 0),
  failed_count integer not null default 0 check (failed_count >= 0),
  details jsonb not null default '{}'::jsonb check (jsonb_typeof(details) = 'object'),
  error text,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

create index cms_sync_runs_recent_idx
  on public.cms_sync_runs (created_at desc);

alter table public.cms_content enable row level security;
alter table public.cms_sync_runs enable row level security;

-- These tables intentionally have no anon/authenticated RLS policy. Every
-- public page reads them through server-only Astro code using the secret key.
revoke all on table public.cms_content from public, anon, authenticated, service_role;
revoke all on table public.cms_sync_runs from public, anon, authenticated, service_role;

grant select, insert, update, delete on table public.cms_content to service_role;
grant select, insert, update on table public.cms_sync_runs to service_role;

-- Supabase Cron calls the same protected endpoint as the editorial console,
-- but uses a separate Vault secret. Four reconciliations per day bound drift
-- if an editor forgets to press "Sync now".
do $migration$
begin
  if not exists (
    select 1
    from vault.decrypted_secrets
    where name = 'aiandbusiness_content_sync_secret'
  ) then
    perform vault.create_secret(
      encode(extensions.gen_random_bytes(32), 'hex'),
      'aiandbusiness_content_sync_secret',
      'Authenticates Supabase Cron calls to the AIandBusiness CMS sync endpoint'
    );
  end if;
end
$migration$;

create or replace function public.verify_content_sync_cron_secret(candidate text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select coalesce((
    select
      encode(extensions.digest(candidate, 'sha256'), 'hex')
      = encode(extensions.digest(secret.decrypted_secret, 'sha256'), 'hex')
    from vault.decrypted_secrets as secret
    where secret.name = 'aiandbusiness_content_sync_secret'
    limit 1
  ), false);
$function$;

revoke all on function public.verify_content_sync_cron_secret(text)
  from public, anon, authenticated;
grant execute on function public.verify_content_sync_cron_secret(text)
  to service_role;

create or replace function public.invoke_aiandbusiness_content_sync(
  requested_section text default null,
  requested_lang text default null
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $function$
declare
  scheduler_secret text;
  request_id bigint;
begin
  select secret.decrypted_secret
  into scheduler_secret
  from vault.decrypted_secrets as secret
  where secret.name = 'aiandbusiness_content_sync_secret'
  limit 1;

  if scheduler_secret is null then
    raise exception 'AIandBusiness CMS sync scheduler secret is missing';
  end if;

  select net.http_post(
    url := 'https://aiandbusiness.com/api/cron/content-sync',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-aiandbusiness-content-secret', scheduler_secret
    ),
    body := jsonb_build_object(
      'trigger', 'cron',
      'requested_at', now(),
      'section', requested_section,
      'lang', requested_lang
    ),
    timeout_milliseconds := 300000
  )
  into request_id;

  return request_id;
end
$function$;

revoke all on function public.invoke_aiandbusiness_content_sync(text, text)
  from public, anon, authenticated, service_role;

select cron.schedule(
  'aiandbusiness-content-sync',
  '20 0,6,12,18 * * *',
  $job$select public.invoke_aiandbusiness_content_sync();$job$
);
