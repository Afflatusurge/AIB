-- Vercel Hobby only supports daily Cron Jobs. Run the four-times-daily
-- Release Monitor from Supabase Cron and keep its credential in Vault.

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

do $migration$
begin
  if not exists (
    select 1
    from vault.decrypted_secrets
    where name = 'aiandbusiness_release_cron_secret'
  ) then
    perform vault.create_secret(
      encode(extensions.gen_random_bytes(32), 'hex'),
      'aiandbusiness_release_cron_secret',
      'Authenticates the Supabase Cron call to AIandBusiness Release Monitor'
    );
  end if;
end
$migration$;

create or replace function public.verify_release_cron_secret(candidate text)
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
    where secret.name = 'aiandbusiness_release_cron_secret'
    limit 1
  ), false);
$function$;

revoke all on function public.verify_release_cron_secret(text)
  from public, anon, authenticated;
grant execute on function public.verify_release_cron_secret(text)
  to service_role;

create or replace function public.invoke_aiandbusiness_release_monitor()
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
  where secret.name = 'aiandbusiness_release_cron_secret'
  limit 1;

  if scheduler_secret is null then
    raise exception 'AIandBusiness Release Monitor scheduler secret is missing';
  end if;

  select net.http_post(
    url := 'https://aiandbusiness.com/api/cron/releases',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-aiandbusiness-release-secret', scheduler_secret
    ),
    body := jsonb_build_object(
      'trigger', 'supabase_cron',
      'requested_at', now()
    ),
    timeout_milliseconds := 300000
  )
  into request_id;

  return request_id;
end
$function$;

revoke all on function public.invoke_aiandbusiness_release_monitor()
  from public, anon, authenticated, service_role;

select cron.schedule(
  'aiandbusiness-release-monitor',
  '0 */6 * * *',
  $job$select public.invoke_aiandbusiness_release_monitor();$job$
);
