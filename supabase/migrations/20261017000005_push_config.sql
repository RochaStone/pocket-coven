-- Push sender configuration lives in game.private_config (no client access) and is read by the
-- send-push edge function through this service-role-only RPC, so no dashboard secrets are needed.
create or replace function public.push_config() returns jsonb
language sql stable security definer set search_path = public, game, pg_temp as $$
  select jsonb_build_object(
    'vapid_public', (select value from game.private_config where key = 'vapid_public'),
    'vapid_private', (select value from game.private_config where key = 'vapid_private'),
    'vapid_subject', (select value from game.private_config where key = 'vapid_subject'),
    'push_secret', (select value from game.private_config where key = 'push_secret'))
$$;
revoke execute on function public.push_config() from public, anon, authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'grant execute on function public.push_config() to service_role';
  end if;
end $$;
