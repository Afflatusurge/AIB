-- Private credentials and immutable review history for the editorial console.
-- The browser only sends an opaque high-entropy token. Its SHA-256 hash is
-- stored here; neither the raw token nor the service-role key reaches client
-- code.

create table if not exists public.editor_access_keys (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  enabled boolean not null default true,
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.editorial_review_events (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.news_candidates(id) on delete restrict,
  action text not null check (action in ('approve', 'reject', 'approve_failed')),
  actor text not null,
  previous_status text,
  next_status text,
  note text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists editorial_review_events_candidate_idx
  on public.editorial_review_events (candidate_id, created_at desc);

alter table public.editor_access_keys enable row level security;
alter table public.editorial_review_events enable row level security;

revoke all on table public.editor_access_keys from public, anon, authenticated, service_role;
revoke all on table public.editorial_review_events from public, anon, authenticated, service_role;

grant select, update on table public.editor_access_keys to service_role;
grant select, insert on table public.editorial_review_events to service_role;

insert into public.editor_access_keys (name, token_hash, enabled, updated_at)
values (
  'primary-editor',
  '0ebaae3f4e4f01ae9782671ccc251f4134eea00e3f525ec7e269ae8702a880e8',
  true,
  now()
)
on conflict (name) do update
set
  token_hash = excluded.token_hash,
  enabled = true,
  updated_at = now();
