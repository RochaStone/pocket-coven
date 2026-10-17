-- Pocket Coven: final step. Paste into Supabase -> SQL Editor (project pocket-coven) and press Run.
-- Adds the 5 engine functions that contain deletes (resetting a witch, taking off an outfit,
-- removing a decoration, leaving a ritual, releasing a witch), then sets up each witch.
-- Supabase may warn this is destructive: it is safe to confirm. Safe to re-run.

create or replace function game.init_character(p_char text) returns void
language plpgsql set search_path = public, game, pg_temp as $$
declare c public.characters; it text; k text; start_pearls int := (game.cfg('starting_pearls'))::int; cur int;
begin
  select * into c from public.characters where id = p_char for update;
  delete from public.equipment where character_id = p_char;
  delete from public.inventory where character_id = p_char;
  delete from public.room_decorations where character_id = p_char;
  delete from public.character_achievements where character_id = p_char;
  delete from public.activity_log where character_id = p_char;
  delete from public.action_receipts where character_id = p_char;
  delete from public.daily_claims where character_id = p_char;
  insert into public.character_stats (character_id) values (p_char)
  on conflict (character_id) do update set nourishment = 70, energy = 70, joy = 70, magic = 70, social = 70,
    xp = 0, level = 1, updated_at = now();
  select pearls into cur from public.character_stats where character_id = p_char;
  perform game.credit(p_char, start_pearls - cur, 'starting', null);
  foreach it in array c.starter_items loop
    perform game.grant_item(p_char, it, 1);
  end loop;
  for k in select jsonb_object_keys(c.default_equipped) loop
    insert into public.equipment (character_id, slot, item_id) values (p_char, k, c.default_equipped ->> k);
  end loop;
  insert into public.rooms (character_id) values (p_char)
  on conflict (character_id) do update set wallpaper = 'pearl_stripe', floor = 'shell_parquet', privacy = 'coven', updated_at = now();
  insert into public.character_status (character_id, location_id, last_seen_at) values (p_char, 'palace', now() - interval '1 day')
  on conflict (character_id) do update set location_id = 'palace', activity_id = null, activity_at = null;
end $$;

create or replace function public.equip_item(p_slot text, p_item_id text) returns jsonb
language plpgsql security definer set search_path = public, game, pg_temp as $$
declare v text := game.require_character(); it public.items; ach text[];
begin
  if p_slot not in ('outfit','tail','hat','necklace','earrings','hair_acc','companion') then
    perform game.fail('bad_slot', 'Unknown wardrobe slot.');
  end if;
  if p_item_id is null then
    delete from public.equipment where character_id = v and slot = p_slot;
  else
    select * into it from public.items where id = p_item_id;
    if not found or it.slot is distinct from p_slot then perform game.fail('bad_slot', 'That does not go there.'); end if;
    if not exists (select 1 from public.inventory where character_id = v and item_id = p_item_id) then
      perform game.fail('not_owned', 'You do not own that yet.');
    end if;
    insert into public.equipment (character_id, slot, item_id) values (v, p_slot, p_item_id)
    on conflict (character_id, slot) do update set item_id = excluded.item_id;
  end if;
  ach := game.check_achievements(v);
  return jsonb_build_object('ok', true, 'achievements', to_jsonb(ach), 'state', game.state(v));
end $$;

create or replace function public.remove_decoration(p_id bigint) returns jsonb
language plpgsql security definer set search_path = public, game, pg_temp as $$
declare v text := game.require_character();
begin
  delete from public.room_decorations where id = p_id and character_id = v;
  return game.state(v);
end $$;

create or replace function public.leave_event(p_event_id uuid) returns void
language plpgsql security definer set search_path = public, game, pg_temp as $$
declare v text := game.require_character(); ev public.shared_events; next_host text;
begin
  select * into ev from public.shared_events where id = p_event_id for update;
  if not found or ev.status <> 'gathering' then return; end if;
  delete from public.shared_event_participants where event_id = ev.id and character_id = v;
  if ev.host_character_id = v then
    select character_id into next_host from public.shared_event_participants where event_id = ev.id order by joined_at limit 1;
    if next_host is null then
      update public.shared_events set status = 'cancelled' where id = ev.id;
    else
      update public.shared_events set host_character_id = next_host where id = ev.id;
    end if;
  end if;
end $$;

create or replace function public.admin_release_character(p_character_id text) returns void
language plpgsql security definer set search_path = public, game, pg_temp as $$
declare coven uuid := game.admin_coven(); c public.characters;
begin
  select * into c from public.characters where id = p_character_id and coven_id = coven for update;
  if not found then perform game.fail('not_found', 'No such witch in your coven.'); end if;
  if c.is_owner_character then perform game.fail('cannot_release_owner', 'The owner witch cannot be released.'); end if;
  if c.owner_user_id is not null then
    delete from public.coven_members where coven_id = coven and user_id = c.owner_user_id and role = 'member';
  end if;
  update public.characters set owner_user_id = null, claimed_at = null where id = c.id;
  perform game.init_character(c.id);
end $$;

revoke execute on function game.init_character(text) from public, anon, authenticated;
revoke execute on function public.equip_item(text, text), public.remove_decoration(bigint),
  public.leave_event(uuid), public.admin_release_character(text) from public, anon;
grant execute on function public.equip_item(text, text), public.remove_decoration(bigint),
  public.leave_event(uuid), public.admin_release_character(text) to authenticated;

-- Set up each witch once (stats, starting pearls, starter wardrobe, room). Never resets an existing witch.
select game.init_character(id) from public.characters c
where not exists (select 1 from public.character_stats s where s.character_id = c.id);

select c.id, c.pronoun_subject, s.pearls, (select count(*) from public.inventory i where i.character_id = c.id) as items
from public.characters c join public.character_stats s on s.character_id = c.id order by c.id;
