-- Row-level security, grants and realtime.
-- Model: clients may SELECT what their coven may see. Clients never write tables directly;
-- every mutation is a SECURITY DEFINER function that validates the caller.

do $$
declare t text;
begin
  foreach t in array array['profiles','covens','coven_members','locations','items','characters','character_stats',
    'inventory','equipment','rooms','room_decorations','activities','activity_log','action_receipts','currency_ledger',
    'achievements','character_achievements','daily_claims','friend_visits','chat_messages','invitations',
    'shared_events','shared_event_participants','character_status','game_config'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
    execute format('grant select on public.%I to authenticated', t);
  end loop;
end $$;

-- Static content: any signed-in player.
create policy "read locations" on public.locations for select to authenticated using (true);
create policy "read items" on public.items for select to authenticated using (true);
create policy "read activities" on public.activities for select to authenticated using (true);
create policy "read achievements" on public.achievements for select to authenticated using (true);
create policy "read config" on public.game_config for select to authenticated using (true);

-- Coven-scoped.
create policy "own or covenmate profile" on public.profiles for select to authenticated using (
  id = auth.uid() or exists (
    select 1 from public.coven_members a join public.coven_members b on a.coven_id = b.coven_id
    where a.user_id = auth.uid() and b.user_id = public.profiles.id));
create policy "member covens" on public.covens for select to authenticated using (game.is_member(id));
create policy "member roster" on public.coven_members for select to authenticated using (game.is_member(coven_id));
create policy "coven characters" on public.characters for select to authenticated using (game.is_member(coven_id));
create policy "coven stats" on public.character_stats for select to authenticated using (game.can_see_character(character_id));
create policy "coven inventory" on public.inventory for select to authenticated using (game.can_see_character(character_id));
create policy "coven equipment" on public.equipment for select to authenticated using (game.can_see_character(character_id));
create policy "coven status" on public.character_status for select to authenticated using (game.can_see_character(character_id));
create policy "coven achievements" on public.character_achievements for select to authenticated using (game.can_see_character(character_id));
create policy "visible rooms" on public.rooms for select to authenticated using (
  game.owns_character(character_id) or (privacy = 'coven' and game.can_see_character(character_id)));
create policy "visible decorations" on public.room_decorations for select to authenticated using (
  game.owns_character(character_id) or (game.can_see_character(character_id) and exists (
    select 1 from public.rooms r where r.character_id = public.room_decorations.character_id and r.privacy = 'coven')));
create policy "coven chat" on public.chat_messages for select to authenticated using (game.is_member(coven_id) and deleted_at is null);
create policy "coven events" on public.shared_events for select to authenticated using (game.is_member(coven_id));
create policy "coven event participants" on public.shared_event_participants for select to authenticated using (
  exists (select 1 from public.shared_events e where e.id = event_id and game.is_member(e.coven_id)));
create policy "own or hosted visits" on public.friend_visits for select to authenticated using (
  game.owns_character(visitor_id) or game.owns_character(host_id));

-- Private to the owner.
create policy "own activity log" on public.activity_log for select to authenticated using (game.owns_character(character_id));
create policy "own receipts" on public.action_receipts for select to authenticated using (game.owns_character(character_id));
create policy "own ledger" on public.currency_ledger for select to authenticated using (game.owns_character(character_id));
create policy "own daily" on public.daily_claims for select to authenticated using (game.owns_character(character_id));

-- Admin only (token_hash is a one-way hash; the raw token is never stored).
create policy "admin invitations" on public.invitations for select to authenticated using (game.is_admin(coven_id));

-- Functions: nothing is callable unless granted below.
revoke execute on all functions in schema public from public, anon, authenticated;
revoke execute on all functions in schema game from public, anon, authenticated;
revoke usage on schema game from public, anon;
grant usage on schema game to authenticated;
-- RLS policy helpers run as the caller, so the caller needs execute on them.
grant execute on function game.is_member(uuid), game.is_admin(uuid), game.can_see_character(text), game.owns_character(text) to authenticated;

grant execute on function public.peek_invite(text) to anon, authenticated;
grant execute on function
  public.claim_invite(text),
  public.get_my_state(),
  public.get_witch(text),
  public.set_location(text),
  public.perform_activity(text, text),
  public.claim_daily(),
  public.buy_item(text, text),
  public.equip_item(text, text),
  public.set_look(jsonb),
  public.update_my_profile(text, text, jsonb),
  public.place_decoration(text, int, int),
  public.move_decoration(bigint, int, int),
  public.remove_decoration(bigint),
  public.set_room_style(text, text, text),
  public.visit_room(text),
  public.send_chat(text, text),
  public.start_event(text),
  public.join_event(uuid),
  public.leave_event(uuid),
  public.complete_event(uuid),
  public.admin_create_invite(text, int),
  public.admin_revoke_invite(uuid),
  public.admin_delete_chat(bigint),
  public.admin_update_character(text, text, text, text, jsonb),
  public.admin_set_config(text, jsonb),
  public.admin_set_item(text, int, boolean),
  public.admin_grant(text, text, int, int),
  public.admin_reset_character(text),
  public.admin_release_character(text)
to authenticated;

alter default privileges in schema public revoke execute on functions from public, anon, authenticated;

-- Realtime: postgres_changes honours the SELECT policies above per subscriber.
do $$
declare t text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach t in array array['chat_messages','character_status','character_stats','equipment','shared_events',
                             'shared_event_participants','rooms','room_decorations','characters'] loop
      execute format('alter publication supabase_realtime add table public.%I', t);
    end loop;
  end if;
end $$;

-- Private realtime channels (presence + broadcast) are limited to coven members.
-- Topic convention: "coven:<coven uuid>".
do $$
begin
  if exists (select 1 from pg_tables where schemaname = 'realtime' and tablename = 'messages') then
    execute $p$
      create policy "coven members use coven channel" on realtime.messages
      for select to authenticated
      using (realtime.topic() like 'coven:%' and game.is_member(substring(realtime.topic() from 7)::uuid))
    $p$;
    execute $p$
      create policy "coven members send on coven channel" on realtime.messages
      for insert to authenticated
      with check (realtime.topic() like 'coven:%' and game.is_member(substring(realtime.topic() from 7)::uuid))
    $p$;
  end if;
end $$;
