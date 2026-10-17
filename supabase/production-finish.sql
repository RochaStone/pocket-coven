-- Pocket Coven production finish: run once in Supabase Dashboard -> SQL Editor.
-- The schema (tables) is already applied. This adds the engine, security and seed. Safe to re-run.

-- Game engine. Internal helpers live in schema `game` (not exposed by the API);
-- player-callable RPCs live in `public` and are SECURITY DEFINER with a pinned search_path.
-- Errors use `raise exception using message = '<code>', hint = '<human text>'`.

-- ───────────────────────── helpers ─────────────────────────

create or replace function game.cfg(p_key text) returns jsonb
language sql stable set search_path = public, game, pg_temp as $$
  select value from public.game_config where key = p_key
$$;

create or replace function game.today() returns date
language sql stable set search_path = public, game, pg_temp as $$
  select (now() at time zone coalesce(game.cfg('day_timezone') #>> '{}', 'UTC'))::date
$$;

create or replace function game.mood(n numeric, e numeric, j numeric, m numeric, s numeric) returns text
language sql immutable as $$
  select case
    when least(n, e, j, m, s) <= 15 or (n + e + j + m + s) / 5 < 25 then 'offended'
    when n < 30 then 'hungry'
    when e < 30 then 'sleepy'
    when j < 35 or s < 30 then 'bored'
    when m >= 85 and (n + e + j + m + s) / 5 >= 60 then 'magical'
    when (n + e + j + m + s) / 5 >= 80 then 'thriving'
    else 'happy'
  end
$$;

create or replace function game.level_for(p_xp int) returns int
language sql immutable as $$ select floor(sqrt(greatest(p_xp, 0) / 40.0))::int + 1 $$;

create or replace function game.decay_one(v numeric, rate numeric, hours numeric, floor_v numeric) returns numeric
language sql immutable as $$
  select case when v <= floor_v then v else round(greatest(floor_v, v - rate * hours), 2) end
$$;

create or replace function game.fail(p_code text, p_hint text) returns void
language plpgsql as $$
begin
  raise exception using message = p_code, hint = p_hint, errcode = 'P0001';
end $$;

-- Applies elapsed-time needs decay. Skips windows under 3 minutes so rounding never eats decay.
create or replace function game.apply_decay(p_char text) returns void
language plpgsql set search_path = public, game, pg_temp as $$
declare
  s public.character_stats;
  rates jsonb := game.cfg('decay_per_hour');
  fl numeric := (game.cfg('decay_floor'))::numeric;
  maxh numeric := (game.cfg('decay_max_hours'))::numeric;
  h numeric;
begin
  select * into s from public.character_stats where character_id = p_char for update;
  if not found then return; end if;
  h := extract(epoch from (now() - s.updated_at)) / 3600.0;
  if h < 0.05 then return; end if;
  h := least(h, maxh);
  update public.character_stats set
    nourishment = game.decay_one(nourishment, (rates ->> 'nourishment')::numeric, h, fl),
    energy      = game.decay_one(energy, (rates ->> 'energy')::numeric, h, fl),
    joy         = game.decay_one(joy, (rates ->> 'joy')::numeric, h, fl),
    magic       = game.decay_one(magic, (rates ->> 'magic')::numeric, h, fl),
    social      = game.decay_one(social, (rates ->> 'social')::numeric, h, fl),
    updated_at  = now()
  where character_id = p_char;
end $$;

create or replace function game.apply_effects(p_char text, p_effects jsonb) returns void
language plpgsql set search_path = public, game, pg_temp as $$
begin
  update public.character_stats set
    nourishment = least(100, greatest(0, nourishment + coalesce((p_effects ->> 'nourishment')::numeric, 0))),
    energy      = least(100, greatest(0, energy + coalesce((p_effects ->> 'energy')::numeric, 0))),
    joy         = least(100, greatest(0, joy + coalesce((p_effects ->> 'joy')::numeric, 0))),
    magic       = least(100, greatest(0, magic + coalesce((p_effects ->> 'magic')::numeric, 0))),
    social      = least(100, greatest(0, social + coalesce((p_effects ->> 'social')::numeric, 0)))
  where character_id = p_char;
end $$;

-- Every pearl movement goes through here: balance can never go negative, every change is ledgered.
create or replace function game.credit(p_char text, p_delta int, p_reason text, p_ref text) returns int
language plpgsql set search_path = public, game, pg_temp as $$
declare v int;
begin
  if p_delta = 0 then
    select pearls into v from public.character_stats where character_id = p_char;
    return v;
  end if;
  update public.character_stats set pearls = pearls + p_delta
  where character_id = p_char and pearls + p_delta >= 0
  returning pearls into v;
  if not found then
    perform game.fail('not_enough_pearls', 'Not enough pearls for that. Earn more at the Kairos co-work or the beach.');
  end if;
  insert into public.currency_ledger (character_id, delta, balance_after, reason, ref)
  values (p_char, p_delta, v, p_reason, p_ref);
  return v;
end $$;

create or replace function game.grant_item(p_char text, p_item text, p_qty int) returns void
language plpgsql set search_path = public, game, pg_temp as $$
begin
  insert into public.inventory (character_id, item_id, qty) values (p_char, p_item, p_qty)
  on conflict (character_id, item_id) do update set qty = public.inventory.qty + excluded.qty;
end $$;

create or replace function game.add_xp(p_char text, p_xp int) returns jsonb
language plpgsql set search_path = public, game, pg_temp as $$
declare old_level int; new_xp int; new_level int;
begin
  select level into old_level from public.character_stats where character_id = p_char;
  update public.character_stats set xp = xp + p_xp, level = game.level_for(xp + p_xp)
  where character_id = p_char returning xp, level into new_xp, new_level;
  return jsonb_build_object('xp', new_xp, 'level', new_level, 'leveled_up', new_level > old_level);
end $$;

create or replace function game.touch_status(p_char text, p_location text, p_activity text) returns void
language plpgsql set search_path = public, game, pg_temp as $$
begin
  insert into public.character_status (character_id, location_id, activity_id, activity_at, last_seen_at)
  values (p_char, p_location, p_activity, case when p_activity is null then null else now() end, now())
  on conflict (character_id) do update set
    location_id = coalesce(excluded.location_id, public.character_status.location_id),
    activity_id = case when p_activity is null and excluded.location_id is distinct from public.character_status.location_id
                       then null else coalesce(excluded.activity_id, public.character_status.activity_id) end,
    activity_at = coalesce(excluded.activity_at, public.character_status.activity_at),
    last_seen_at = now();
end $$;

create or replace function game.check_achievements(p_char text) returns text[]
language plpgsql set search_path = public, game, pg_temp as $$
declare earned text[] := '{}'; cand text; ok boolean;
begin
  foreach cand in array array['first_care','first_treasure','kairos_regular','coven_ritual','fashionista','interior_witch','pearl_hoarder'] loop
    continue when exists (select 1 from public.character_achievements where character_id = p_char and achievement_id = cand);
    ok := case cand
      when 'first_care' then exists (select 1 from public.activity_log where character_id = p_char)
      when 'first_treasure' then exists (select 1 from public.inventory i join public.items it on it.id = i.item_id
                                         where i.character_id = p_char and (it.category = 'collectible' or it.id = 'neck_black_pearl'))
      when 'kairos_regular' then (select count(*) from public.activity_log l join public.activities a on a.id = l.activity_id
                                  join public.locations lo on lo.id = a.location_id
                                  where l.character_id = p_char and lo.world = 'kairos') >= 5
      when 'coven_ritual' then exists (select 1 from public.shared_event_participants p join public.shared_events e on e.id = p.event_id
                                       where p.character_id = p_char and e.status = 'complete')
      when 'fashionista' then (select count(*) from public.equipment where character_id = p_char and slot <> 'outfit') >= 5
      when 'interior_witch' then (select count(*) from public.room_decorations where character_id = p_char) >= 5
      when 'pearl_hoarder' then (select pearls from public.character_stats where character_id = p_char) >= 300
      else false end;
    if ok then
      insert into public.character_achievements (character_id, achievement_id) values (p_char, cand);
      earned := earned || cand;
    end if;
  end loop;
  return earned;
end $$;

create or replace function game.require_character() returns text
language plpgsql set search_path = public, game, pg_temp as $$
declare v text;
begin
  if auth.uid() is null then
    perform game.fail('not_signed_in', 'Sign in to enter the coven.');
  end if;
  select id into v from public.characters where owner_user_id = auth.uid();
  if v is null then
    perform game.fail('no_character', 'You have not claimed a witch yet. Open your invitation link.');
  end if;
  return v;
end $$;

create or replace function game.coven_of(p_char text) returns uuid
language sql stable set search_path = public, game, pg_temp as $$
  select coven_id from public.characters where id = p_char
$$;

create or replace function game.is_member(p_coven uuid) returns boolean
language sql stable security definer set search_path = public, game, pg_temp as $$
  select exists (select 1 from public.coven_members where coven_id = p_coven and user_id = auth.uid())
$$;

create or replace function game.is_admin(p_coven uuid) returns boolean
language sql stable security definer set search_path = public, game, pg_temp as $$
  select exists (select 1 from public.coven_members where coven_id = p_coven and user_id = auth.uid() and role = 'owner')
$$;

create or replace function game.can_see_character(p_char text) returns boolean
language sql stable security definer set search_path = public, game, pg_temp as $$
  select exists (
    select 1 from public.characters c
    join public.coven_members m on m.coven_id = c.coven_id
    where c.id = p_char and m.user_id = auth.uid()
  )
$$;

create or replace function game.owns_character(p_char text) returns boolean
language sql stable security definer set search_path = public, game, pg_temp as $$
  select exists (select 1 from public.characters where id = p_char and owner_user_id = auth.uid())
$$;

create or replace function game.admin_coven() returns uuid
language plpgsql set search_path = public, game, pg_temp as $$
declare v uuid;
begin
  select coven_id into v from public.coven_members where user_id = auth.uid() and role = 'owner' limit 1;
  if v is null then
    perform game.fail('not_admin', 'Only the coven owner can do that.');
  end if;
  return v;
end $$;

-- Public snapshot of any witch (what friends see).
create or replace function game.public_state(p_char text) returns jsonb
language sql stable set search_path = public, game, pg_temp as $$
  select jsonb_build_object(
    'character', jsonb_build_object(
      'id', c.id, 'name', c.name, 'title', c.title, 'description', c.description, 'personality', c.personality,
      'pronouns', jsonb_build_object('subject', c.pronoun_subject, 'object', c.pronoun_object,
                                     'possessive', c.pronoun_possessive, 'plural', c.pronoun_plural),
      'baby_aesthetic', c.baby_aesthetic, 'look', c.look, 'claimed', c.owner_user_id is not null),
    'stats', jsonb_build_object('nourishment', s.nourishment, 'energy', s.energy, 'joy', s.joy, 'magic', s.magic,
                                'social', s.social, 'level', s.level, 'updated_at', s.updated_at),
    'mood', game.mood(s.nourishment, s.energy, s.joy, s.magic, s.social),
    'equipment', coalesce((select jsonb_object_agg(e.slot, e.item_id) from public.equipment e where e.character_id = c.id), '{}'::jsonb),
    'room', (select jsonb_build_object('wallpaper', r.wallpaper, 'floor', r.floor, 'privacy', r.privacy)
             from public.rooms r where r.character_id = c.id),
    'decorations', coalesce((select jsonb_agg(jsonb_build_object('id', d.id, 'item_id', d.item_id, 'col', d.col, 'row', d."row") order by d.id)
                             from public.room_decorations d where d.character_id = c.id), '[]'::jsonb)
  )
  from public.characters c join public.character_stats s on s.character_id = c.id
  where c.id = p_char
$$;

-- Full private snapshot for the owning player.
create or replace function game.state(p_char text) returns jsonb
language sql stable set search_path = public, game, pg_temp as $$
  select game.public_state(p_char) || jsonb_build_object(
    'pearls', s.pearls, 'xp', s.xp,
    'inventory', coalesce((select jsonb_agg(jsonb_build_object('item_id', i.item_id, 'qty', i.qty) order by i.acquired_at, i.item_id)
                           from public.inventory i where i.character_id = p_char), '[]'::jsonb),
    'achievements', coalesce((select jsonb_agg(a.achievement_id order by a.earned_at) from public.character_achievements a
                              where a.character_id = p_char), '[]'::jsonb),
    'daily_available', not exists (select 1 from public.daily_claims d where d.character_id = p_char and d.day = game.today()),
    'cooldowns', coalesce((
      select jsonb_object_agg(x.activity_id, x.remaining) from (
        select a.id as activity_id,
               ceil(extract(epoch from (max(l.created_at) + make_interval(secs => a.cooldown_seconds) - now())))::int as remaining
        from public.activity_log l join public.activities a on a.id = l.activity_id
        where l.character_id = p_char
        group by a.id, a.cooldown_seconds
        having max(l.created_at) + make_interval(secs => a.cooldown_seconds) > now()
      ) x), '{}'::jsonb),
    'is_admin', exists (select 1 from public.coven_members m join public.characters c on c.coven_id = m.coven_id
                        where c.id = p_char and m.user_id = c.owner_user_id and m.role = 'owner'),
    'coven_id', game.coven_of(p_char)
  )
  from public.character_stats s where s.character_id = p_char
$$;

-- Fresh (or reset) witch: stats, starting pearls, starter wardrobe, default room.
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

create or replace function game.system_message(p_coven uuid, p_body text) returns void
language sql set search_path = public, game, pg_temp as $$
  insert into public.chat_messages (coven_id, character_id, kind, body) values (p_coven, null, 'system', left(p_body, 280))
$$;

-- ───────────────────────── invitations ─────────────────────────

create or replace function public.peek_invite(p_token text) returns jsonb
language plpgsql stable security definer set search_path = public, game, extensions, pg_temp as $$
declare inv public.invitations; c public.characters;
begin
  select * into inv from public.invitations where token_hash = encode(extensions.digest(coalesce(p_token, ''), 'sha256'), 'hex');
  if not found then return jsonb_build_object('valid', false, 'reason', 'not_found'); end if;
  select * into c from public.characters where id = inv.character_id;
  return jsonb_build_object(
    'valid', inv.revoked_at is null and inv.claimed_at is null and inv.expires_at > now() and c.owner_user_id is null,
    'reason', case when inv.revoked_at is not null then 'revoked'
                   when inv.claimed_at is not null or c.owner_user_id is not null then 'claimed'
                   when inv.expires_at <= now() then 'expired' else null end,
    'character_id', c.id, 'name', c.name, 'title', c.title, 'look', c.look, 'equipment', c.default_equipped,
    'pronouns', jsonb_build_object('subject', c.pronoun_subject, 'object', c.pronoun_object,
                                   'possessive', c.pronoun_possessive, 'plural', c.pronoun_plural));
end $$;

create or replace function public.claim_invite(p_token text) returns jsonb
language plpgsql security definer set search_path = public, game, extensions, pg_temp as $$
declare inv public.invitations; c public.characters; existing text; uid uuid := auth.uid();
begin
  if uid is null then perform game.fail('not_signed_in', 'Sign in first, then open your invitation again.'); end if;
  select * into inv from public.invitations
  where token_hash = encode(extensions.digest(coalesce(p_token, ''), 'sha256'), 'hex') for update;
  if not found then perform game.fail('invite_invalid', 'That invitation does not exist.'); end if;

  select id into existing from public.characters where owner_user_id = uid;
  if existing is not null then
    if existing = inv.character_id then return game.state(existing); end if;
    perform game.fail('already_has_character', 'You already have a witch. One witch per account.');
  end if;
  if inv.revoked_at is not null then perform game.fail('invite_revoked', 'That invitation was revoked. Ask the coven owner for a new one.'); end if;
  if inv.claimed_at is not null then perform game.fail('invite_used', 'That invitation has already been used.'); end if;
  if inv.expires_at <= now() then perform game.fail('invite_expired', 'That invitation has expired. Ask the coven owner for a new one.'); end if;

  select * into c from public.characters where id = inv.character_id for update;
  if c.owner_user_id is not null then perform game.fail('character_taken', 'That witch has already been claimed.'); end if;

  update public.characters set owner_user_id = uid, claimed_at = now() where id = c.id;
  insert into public.profiles (id, display_name) values (uid, c.name) on conflict (id) do nothing;
  insert into public.coven_members (coven_id, user_id, role)
  values (c.coven_id, uid, case when c.is_owner_character then 'owner' else 'member' end)
  on conflict (coven_id, user_id) do update set role = excluded.role;
  if c.is_owner_character then
    update public.covens set owner_user_id = uid where id = c.coven_id;
  end if;
  update public.invitations set claimed_at = now(), claimed_by = uid where id = inv.id;
  perform game.touch_status(c.id, 'palace', null);
  perform game.system_message(c.coven_id, c.name || ' has joined the coven. The shell is a little more sparkly now.');
  return game.state(c.id);
end $$;

-- ───────────────────────── player state ─────────────────────────

create or replace function public.get_my_state() returns jsonb
language plpgsql security definer set search_path = public, game, pg_temp as $$
declare v text := game.require_character();
begin
  perform game.apply_decay(v);
  perform game.touch_status(v, null, null);
  return game.state(v);
end $$;

create or replace function public.get_witch(p_character_id text) returns jsonb
language plpgsql security definer set search_path = public, game, pg_temp as $$
declare me text := game.require_character(); r jsonb;
begin
  if game.coven_of(p_character_id) is distinct from game.coven_of(me) then
    perform game.fail('not_found', 'No such witch in your coven.');
  end if;
  r := game.public_state(p_character_id);
  if p_character_id <> me and r #>> '{room,privacy}' = 'private' then
    r := r - 'decorations' || jsonb_build_object('decorations', '[]'::jsonb);
  end if;
  return r;
end $$;

create or replace function public.set_location(p_location_id text) returns void
language plpgsql security definer set search_path = public, game, pg_temp as $$
declare v text := game.require_character();
begin
  if p_location_id is not null and not exists (select 1 from public.locations where id = p_location_id) then
    perform game.fail('unknown_location', 'That place is not on the map.');
  end if;
  perform game.touch_status(v, p_location_id, null);
end $$;

-- ───────────────────────── actions ─────────────────────────

create or replace function public.perform_activity(p_activity_id text, p_key text) returns jsonb
language plpgsql security definer set search_path = public, game, pg_temp as $$
declare
  v_char text := game.require_character();
  c public.characters;
  a public.activities;
  s public.character_stats;
  prior jsonb;
  r jsonb;
  v_last timestamptz;
  eff jsonb;
  friends text[];
  bonus int;
  loot_won text[] := '{}';
  l jsonb;
  xp jsonb;
  ach text[];
  remaining int;
begin
  select result into prior from public.action_receipts where character_id = v_char and key = p_key;
  if found then return prior || jsonb_build_object('replayed', true, 'state', game.state(v_char)); end if;

  select * into c from public.characters where id = v_char;
  select * into a from public.activities where id = p_activity_id and active;
  if not found then perform game.fail('unknown_activity', 'That activity does not exist.'); end if;
  if a.adult_only and c.baby_aesthetic then
    perform game.fail('adult_only', 'That one is for the grown witches. Baby merwitches get a strawberry iced matcha instead.');
  end if;

  perform game.apply_decay(v_char);
  select * into s from public.character_stats where character_id = v_char for update;

  select max(created_at) into v_last from public.activity_log where character_id = v_char and activity_id = a.id;
  if v_last is not null and v_last + make_interval(secs => a.cooldown_seconds) > now() then
    remaining := ceil(extract(epoch from (v_last + make_interval(secs => a.cooldown_seconds) - now())))::int;
    raise exception using message = 'cooldown', errcode = 'P0001',
      hint = format('Ready again in %s.', case when remaining >= 60 then (remaining / 60 + 1) || ' min' else remaining || ' sec' end),
      detail = remaining::text;
  end if;
  if coalesce((a.effects ->> 'energy')::numeric, 0) < 0 and s.energy + (a.effects ->> 'energy')::numeric < 0 then
    perform game.fail('too_tired', c.name || ' is too tired for that. Try a nap, a float or a matcha.');
  end if;
  if coalesce((a.effects ->> 'nourishment')::numeric, 0) < 0 and s.nourishment + (a.effects ->> 'nourishment')::numeric < 0 then
    perform game.fail('too_hungry', c.name || ' is running on empty. Feed this witch first.');
  end if;

  -- Real multiplayer bonus: witches doing things in the same place recently lift each other.
  select array_agg(ch.name order by ch.name) into friends
  from public.character_status st join public.characters ch on ch.id = st.character_id
  where st.location_id = a.location_id and st.character_id <> v_char
    and st.last_seen_at > now() - interval '3 minutes' and ch.coven_id = c.coven_id;
  bonus := least(coalesce(array_length(friends, 1), 0) * 5, 15);
  eff := a.effects;
  if bonus > 0 then
    eff := jsonb_set(eff, '{social}', to_jsonb(coalesce((eff ->> 'social')::numeric, 0) + bonus));
  end if;

  perform game.apply_effects(v_char, eff);
  perform game.credit(v_char, a.pearls, 'activity', a.id);
  for l in select * from jsonb_array_elements(a.loot) loop
    if random() < (l ->> 'chance')::numeric then
      perform game.grant_item(v_char, l ->> 'item_id', 1);
      loot_won := loot_won || (l ->> 'item_id');
    end if;
  end loop;
  xp := game.add_xp(v_char, a.xp);
  insert into public.activity_log (character_id, activity_id) values (v_char, a.id);
  perform game.touch_status(v_char, a.location_id, a.id);
  ach := game.check_achievements(v_char);

  r := jsonb_build_object(
    'ok', true, 'activity_id', a.id, 'animation', a.animation,
    'flavour_index', floor(random() * a.flavour_count)::int,
    'effects', eff, 'pearls_delta', a.pearls, 'loot', to_jsonb(loot_won),
    'friends', to_jsonb(coalesce(friends, '{}'::text[])), 'xp', xp, 'achievements', to_jsonb(ach));
  insert into public.action_receipts (character_id, key, result) values (v_char, p_key, r);
  return r || jsonb_build_object('state', game.state(v_char));
end $$;

create or replace function public.claim_daily() returns jsonb
language plpgsql security definer set search_path = public, game, pg_temp as $$
declare v text := game.require_character(); pool jsonb := game.cfg('daily_loot'); pick text; amount int := (game.cfg('daily_pearls'))::int; ach text[];
begin
  perform 1 from public.character_stats where character_id = v for update;
  insert into public.daily_claims (character_id, day) values (v, game.today()) on conflict do nothing;
  if not found then
    return jsonb_build_object('ok', false, 'already_claimed', true, 'state', game.state(v));
  end if;
  perform game.credit(v, amount, 'daily', game.today()::text);
  pick := pool ->> floor(random() * jsonb_array_length(pool))::int;
  perform game.grant_item(v, pick, 1);
  ach := game.check_achievements(v);
  return jsonb_build_object('ok', true, 'pearls_delta', amount, 'loot', jsonb_build_array(pick),
                            'achievements', to_jsonb(ach), 'state', game.state(v));
end $$;

create or replace function public.buy_item(p_item_id text, p_key text) returns jsonb
language plpgsql security definer set search_path = public, game, pg_temp as $$
declare v text := game.require_character(); it public.items; prior jsonb; r jsonb; ach text[];
begin
  select result into prior from public.action_receipts where character_id = v and key = p_key;
  if found then return prior || jsonb_build_object('replayed', true, 'state', game.state(v)); end if;
  perform 1 from public.character_stats where character_id = v for update;
  select * into it from public.items where id = p_item_id and active;
  if not found or it.price is null then perform game.fail('not_for_sale', 'That treasure cannot be bought. It must be found.'); end if;
  if it.slot is not null and exists (select 1 from public.inventory where character_id = v and item_id = it.id) then
    perform game.fail('already_owned', 'Already in your wardrobe.');
  end if;
  perform game.credit(v, -it.price, 'purchase', it.id);
  perform game.grant_item(v, it.id, 1);
  ach := game.check_achievements(v);
  r := jsonb_build_object('ok', true, 'item_id', it.id, 'pearls_delta', -it.price, 'achievements', to_jsonb(ach));
  insert into public.action_receipts (character_id, key, result) values (v, p_key, r);
  return r || jsonb_build_object('state', game.state(v));
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

create or replace function public.set_look(p_look jsonb) returns jsonb
language plpgsql security definer set search_path = public, game, pg_temp as $$
declare v text := game.require_character(); cur jsonb; nxt jsonb; k text;
begin
  select look into cur from public.characters where id = v;
  nxt := cur;
  foreach k in array array['skin','hairColor','eyeColor'] loop
    if p_look ? k then
      if (p_look ->> k) !~ '^#[0-9a-fA-F]{6}$' then perform game.fail('bad_look', 'Colours must be hex like #ff8fc8.'); end if;
      nxt := jsonb_set(nxt, array[k], to_jsonb(lower(p_look ->> k)));
    end if;
  end loop;
  if p_look ? 'hairStyle' then
    if (p_look ->> 'hairStyle') not in ('long_waves','short_undercut','straight_long','beach_waves','ethereal_long','pixie','space_buns') then
      perform game.fail('bad_look', 'Unknown hairstyle.');
    end if;
    nxt := jsonb_set(nxt, '{hairStyle}', p_look -> 'hairStyle');
  end if;
  if p_look ? 'tattoos' then
    if jsonb_typeof(p_look -> 'tattoos') <> 'boolean' then perform game.fail('bad_look', 'Tattoos is yes or no.'); end if;
    nxt := jsonb_set(nxt, '{tattoos}', p_look -> 'tattoos');
  end if;
  update public.characters set look = nxt where id = v;
  return game.state(v);
end $$;

create or replace function game.validate_pronouns(p jsonb) returns void
language plpgsql as $$
begin
  if p is null then return; end if;
  if coalesce(p ->> 'subject', '') !~ '^[A-Za-z]{1,12}$' or coalesce(p ->> 'object', '') !~ '^[A-Za-z]{1,12}$'
     or coalesce(p ->> 'possessive', '') !~ '^[A-Za-z]{1,12}$' or jsonb_typeof(p -> 'plural') is distinct from 'boolean' then
    perform game.fail('bad_pronouns', 'Pronouns need subject, object, possessive (letters only) and plural.');
  end if;
end $$;

create or replace function public.update_my_profile(p_description text, p_personality text, p_pronouns jsonb) returns jsonb
language plpgsql security definer set search_path = public, game, pg_temp as $$
declare v text := game.require_character();
begin
  perform game.validate_pronouns(p_pronouns);
  update public.characters set
    description = coalesce(left(p_description, 500), description),
    personality = coalesce(left(p_personality, 500), personality),
    pronoun_subject = coalesce(lower(p_pronouns ->> 'subject'), pronoun_subject),
    pronoun_object = coalesce(lower(p_pronouns ->> 'object'), pronoun_object),
    pronoun_possessive = coalesce(lower(p_pronouns ->> 'possessive'), pronoun_possessive),
    pronoun_plural = coalesce((p_pronouns ->> 'plural')::boolean, pronoun_plural)
  where id = v;
  return game.state(v);
end $$;

-- ───────────────────────── rooms ─────────────────────────

create or replace function public.place_decoration(p_item_id text, p_col int, p_row int) returns jsonb
language plpgsql security definer set search_path = public, game, pg_temp as $$
declare v text := game.require_character(); it public.items; owned int; placed int; ach text[];
begin
  select * into it from public.items where id = p_item_id;
  if not found or not it.placeable then perform game.fail('not_placeable', 'That cannot go in a room.'); end if;
  if p_col not between 0 and 5 or p_row not between 0 and 3 then perform game.fail('bad_cell', 'Off the edge of the room.'); end if;
  perform 1 from public.rooms where character_id = v for update;
  select coalesce(qty, 0) into owned from public.inventory where character_id = v and item_id = p_item_id;
  select count(*) into placed from public.room_decorations where character_id = v and item_id = p_item_id;
  if coalesce(owned, 0) <= placed then perform game.fail('none_left', 'You have placed every one you own.'); end if;
  begin
    insert into public.room_decorations (character_id, item_id, col, "row") values (v, p_item_id, p_col, p_row);
  exception when unique_violation then
    perform game.fail('cell_taken', 'Something is already there.');
  end;
  update public.rooms set updated_at = now() where character_id = v;
  ach := game.check_achievements(v);
  return jsonb_build_object('ok', true, 'achievements', to_jsonb(ach), 'state', game.state(v));
end $$;

create or replace function public.move_decoration(p_id bigint, p_col int, p_row int) returns jsonb
language plpgsql security definer set search_path = public, game, pg_temp as $$
declare v text := game.require_character();
begin
  if p_col not between 0 and 5 or p_row not between 0 and 3 then perform game.fail('bad_cell', 'Off the edge of the room.'); end if;
  begin
    update public.room_decorations set col = p_col, "row" = p_row where id = p_id and character_id = v;
  exception when unique_violation then
    perform game.fail('cell_taken', 'Something is already there.');
  end;
  if not found then perform game.fail('not_found', 'That decoration is not in your room.'); end if;
  return game.state(v);
end $$;

create or replace function public.remove_decoration(p_id bigint) returns jsonb
language plpgsql security definer set search_path = public, game, pg_temp as $$
declare v text := game.require_character();
begin
  delete from public.room_decorations where id = p_id and character_id = v;
  return game.state(v);
end $$;

create or replace function public.set_room_style(p_wallpaper text, p_floor text, p_privacy text) returns jsonb
language plpgsql security definer set search_path = public, game, pg_temp as $$
declare v text := game.require_character();
begin
  update public.rooms set
    wallpaper = coalesce(p_wallpaper, wallpaper),
    floor = coalesce(p_floor, floor),
    privacy = coalesce(p_privacy, privacy),
    updated_at = now()
  where character_id = v;
  return game.state(v);
exception when check_violation then
  perform game.fail('bad_style', 'Unknown wallpaper, floor or privacy setting.');
  return null;
end $$;

create or replace function public.visit_room(p_host text) returns jsonb
language plpgsql security definer set search_path = public, game, pg_temp as $$
declare v text := game.require_character(); host_state jsonb; first_visit boolean; bonus int := (game.cfg('visit_social_bonus'))::int;
begin
  if p_host = v then perform game.fail('own_room', 'That is your own room.'); end if;
  if game.coven_of(p_host) is distinct from game.coven_of(v) then perform game.fail('not_found', 'No such witch in your coven.'); end if;
  if (select privacy from public.rooms where character_id = p_host) = 'private' then
    perform game.fail('room_private', 'That room is private right now.');
  end if;
  insert into public.friend_visits (visitor_id, host_id, day) values (v, p_host, game.today()) on conflict do nothing;
  first_visit := found;
  if first_visit then
    perform game.apply_decay(v);
    perform game.apply_effects(v, jsonb_build_object('social', bonus, 'joy', 5));
    perform game.apply_effects(p_host, jsonb_build_object('social', 5));
  end if;
  host_state := game.public_state(p_host);
  return jsonb_build_object('ok', true, 'first_visit_today', first_visit, 'host', host_state, 'state', game.state(v));
end $$;

-- ───────────────────────── chat ─────────────────────────

create or replace function public.send_chat(p_kind text, p_body text) returns jsonb
language plpgsql security definer set search_path = public, game, pg_temp as $$
declare
  v text := game.require_character();
  coven uuid := game.coven_of(v);
  lim jsonb := game.cfg('chat_rate_limit');
  body text;
  recent int;
  msg public.chat_messages;
begin
  if p_kind not in ('text', 'sticker') then perform game.fail('bad_kind', 'Unknown message type.'); end if;
  body := btrim(regexp_replace(coalesce(p_body, ''), '[[:cntrl:]]', ' ', 'g'));
  if p_kind = 'sticker' and body not in ('heart_shell','sparkle','moon_kiss','matcha_cheers','dramatic_gasp','pearl_rain') then
    perform game.fail('bad_sticker', 'Unknown sticker.');
  end if;
  if char_length(body) < 1 then perform game.fail('empty', 'Say something, witch.'); end if;
  if char_length(body) > 280 then perform game.fail('too_long', 'Keep it under 280 characters.'); end if;
  select count(*) into recent from public.chat_messages
  where character_id = v and created_at > now() - make_interval(secs => (lim ->> 'seconds')::int);
  if recent >= (lim ->> 'messages')::int then
    perform game.fail('slow_down', 'Slow down, chatterbox. Give the shell a second.');
  end if;
  insert into public.chat_messages (coven_id, character_id, kind, body) values (coven, v, p_kind, body) returning * into msg;
  perform game.touch_status(v, null, null);
  return to_jsonb(msg);
end $$;

-- ───────────────────────── shared coven events ─────────────────────────

create or replace function public.start_event(p_kind text) returns jsonb
language plpgsql security definer set search_path = public, game, pg_temp as $$
declare v text := game.require_character(); coven uuid := game.coven_of(v); def jsonb := game.cfg('shared_events') -> p_kind; ev public.shared_events; nm text;
begin
  if def is null then perform game.fail('bad_event', 'Unknown coven event.'); end if;
  select * into ev from public.shared_events where coven_id = coven and kind = p_kind and status = 'gathering';
  if not found then
    insert into public.shared_events (coven_id, kind, location_id, host_character_id)
    values (coven, p_kind, def ->> 'locationId', v) returning * into ev;
    select name into nm from public.characters where id = v;
    perform game.system_message(coven, nm || ' is gathering the coven for a ' || (def ->> 'name') || '. Come and join.');
  end if;
  insert into public.shared_event_participants (event_id, character_id) values (ev.id, v) on conflict do nothing;
  perform game.touch_status(v, ev.location_id, null);
  return to_jsonb(ev);
end $$;

create or replace function public.join_event(p_event_id uuid) returns jsonb
language plpgsql security definer set search_path = public, game, pg_temp as $$
declare v text := game.require_character(); ev public.shared_events;
begin
  select * into ev from public.shared_events where id = p_event_id for update;
  if not found or ev.coven_id <> game.coven_of(v) then perform game.fail('not_found', 'That gathering has vanished.'); end if;
  if ev.status <> 'gathering' then perform game.fail('event_closed', 'That gathering has already finished.'); end if;
  insert into public.shared_event_participants (event_id, character_id) values (ev.id, v) on conflict do nothing;
  perform game.touch_status(v, ev.location_id, null);
  return to_jsonb(ev);
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

create or replace function public.complete_event(p_event_id uuid) returns jsonb
language plpgsql security definer set search_path = public, game, pg_temp as $$
declare
  v text := game.require_character();
  ev public.shared_events;
  def jsonb;
  n int;
  p record;
  names text;
begin
  select * into ev from public.shared_events where id = p_event_id for update;
  if not found or ev.coven_id <> game.coven_of(v) then perform game.fail('not_found', 'That gathering has vanished.'); end if;
  if ev.status <> 'gathering' then perform game.fail('event_closed', 'That gathering has already finished.'); end if;
  if ev.host_character_id <> v then perform game.fail('not_host', 'Only the witch who lit the candles can begin.'); end if;
  def := game.cfg('shared_events') -> ev.kind;
  select count(*) into n from public.shared_event_participants where event_id = ev.id;
  if n < (def ->> 'minParticipants')::int then
    perform game.fail('need_more_witches', 'A coven needs at least ' || (def ->> 'minParticipants') || ' witches. Invite someone.');
  end if;
  for p in select character_id from public.shared_event_participants where event_id = ev.id order by character_id loop
    perform game.apply_decay(p.character_id);
    perform game.apply_effects(p.character_id, def -> 'effects');
    perform game.credit(p.character_id, (def ->> 'pearls')::int, 'event', ev.id::text);
    perform game.grant_item(p.character_id, def ->> 'lootItemId', 1);
    perform game.add_xp(p.character_id, (def ->> 'xp')::int);
  end loop;
  update public.shared_events set status = 'complete', completed_at = now() where id = ev.id;
  for p in select character_id from public.shared_event_participants where event_id = ev.id loop
    perform game.check_achievements(p.character_id);
  end loop;
  select string_agg(c.name, ', ' order by c.name) into names
  from public.shared_event_participants sp join public.characters c on c.id = sp.character_id where sp.event_id = ev.id;
  perform game.system_message(ev.coven_id, 'The ' || (def ->> 'name') || ' is complete: ' || names
    || '. Someone brought champagne to a moon ritual. Nobody is asking questions.');
  return jsonb_build_object('ok', true, 'event', to_jsonb(ev) || jsonb_build_object('status', 'complete'),
    'rewards', jsonb_build_object('effects', def -> 'effects', 'pearls', def -> 'pearls', 'loot', def -> 'lootItemId'),
    'state', game.state(v));
end $$;

-- ───────────────────────── admin ─────────────────────────

create or replace function public.admin_create_invite(p_character_id text, p_days int default 7) returns jsonb
language plpgsql security definer set search_path = public, game, extensions, pg_temp as $$
declare coven uuid := game.admin_coven(); c public.characters; token text; inv public.invitations;
begin
  select * into c from public.characters where id = p_character_id and coven_id = coven;
  if not found then perform game.fail('not_found', 'No such witch in your coven.'); end if;
  if c.owner_user_id is not null then perform game.fail('character_taken', c.name || ' has already been claimed.'); end if;
  if p_days not between 1 and 30 then perform game.fail('bad_expiry', 'Invites last between 1 and 30 days.'); end if;
  update public.invitations set revoked_at = now()
  where character_id = c.id and revoked_at is null and claimed_at is null;
  token := encode(extensions.gen_random_bytes(24), 'hex');
  insert into public.invitations (coven_id, character_id, token_hash, created_by, expires_at)
  values (coven, c.id, encode(extensions.digest(token, 'sha256'), 'hex'), auth.uid(), now() + make_interval(days => p_days))
  returning * into inv;
  -- The raw token is returned exactly once and never stored.
  return jsonb_build_object('id', inv.id, 'character_id', c.id, 'token', token, 'expires_at', inv.expires_at);
end $$;

create or replace function public.admin_revoke_invite(p_id uuid) returns void
language plpgsql security definer set search_path = public, game, pg_temp as $$
declare coven uuid := game.admin_coven();
begin
  update public.invitations set revoked_at = now() where id = p_id and coven_id = coven and revoked_at is null;
end $$;

create or replace function public.admin_delete_chat(p_id bigint) returns void
language plpgsql security definer set search_path = public, game, pg_temp as $$
declare coven uuid := game.admin_coven();
begin
  update public.chat_messages set deleted_at = now(), deleted_by = auth.uid() where id = p_id and coven_id = coven;
end $$;

create or replace function public.admin_update_character(p_id text, p_title text, p_description text, p_personality text, p_pronouns jsonb) returns void
language plpgsql security definer set search_path = public, game, pg_temp as $$
declare coven uuid := game.admin_coven();
begin
  perform game.validate_pronouns(p_pronouns);
  update public.characters set
    title = coalesce(left(p_title, 60), title),
    description = coalesce(left(p_description, 500), description),
    personality = coalesce(left(p_personality, 500), personality),
    pronoun_subject = coalesce(lower(p_pronouns ->> 'subject'), pronoun_subject),
    pronoun_object = coalesce(lower(p_pronouns ->> 'object'), pronoun_object),
    pronoun_possessive = coalesce(lower(p_pronouns ->> 'possessive'), pronoun_possessive),
    pronoun_plural = coalesce((p_pronouns ->> 'plural')::boolean, pronoun_plural)
  where id = p_id and coven_id = coven;
  if not found then perform game.fail('not_found', 'No such witch in your coven.'); end if;
end $$;

create or replace function public.admin_set_config(p_key text, p_value jsonb) returns void
language plpgsql security definer set search_path = public, game, pg_temp as $$
begin
  perform game.admin_coven();
  if p_key not in ('decay_per_hour','decay_floor','decay_max_hours','daily_pearls','daily_loot','starting_pearls',
                   'chat_rate_limit','visit_social_bonus','day_timezone') then
    perform game.fail('bad_config', 'That setting cannot be changed here.');
  end if;
  if jsonb_typeof(p_value) is distinct from jsonb_typeof(game.cfg(p_key)) then
    perform game.fail('bad_config', 'That value has the wrong shape.');
  end if;
  update public.game_config set value = p_value, updated_at = now() where key = p_key;
end $$;

create or replace function public.admin_set_item(p_item_id text, p_price int, p_active boolean) returns void
language plpgsql security definer set search_path = public, game, pg_temp as $$
begin
  perform game.admin_coven();
  if p_price is not null and p_price <= 0 then perform game.fail('bad_price', 'Price must be positive.'); end if;
  update public.items set price = p_price, active = coalesce(p_active, active) where id = p_item_id;
  if not found then perform game.fail('not_found', 'Unknown item.'); end if;
end $$;

create or replace function public.admin_grant(p_character_id text, p_item_id text, p_qty int, p_pearls int) returns void
language plpgsql security definer set search_path = public, game, pg_temp as $$
declare coven uuid := game.admin_coven();
begin
  if game.coven_of(p_character_id) is distinct from coven then perform game.fail('not_found', 'No such witch in your coven.'); end if;
  perform 1 from public.character_stats where character_id = p_character_id for update;
  if p_item_id is not null and coalesce(p_qty, 0) > 0 then perform game.grant_item(p_character_id, p_item_id, p_qty); end if;
  if coalesce(p_pearls, 0) <> 0 then perform game.credit(p_character_id, p_pearls, 'admin_grant', null); end if;
end $$;

create or replace function public.admin_reset_character(p_character_id text) returns void
language plpgsql security definer set search_path = public, game, pg_temp as $$
declare coven uuid := game.admin_coven();
begin
  if game.coven_of(p_character_id) is distinct from coven then perform game.fail('not_found', 'No such witch in your coven.'); end if;
  perform game.init_character(p_character_id);
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
drop policy if exists "read locations" on public.locations;
create policy "read locations" on public.locations for select to authenticated using (true);
drop policy if exists "read items" on public.items;
create policy "read items" on public.items for select to authenticated using (true);
drop policy if exists "read activities" on public.activities;
create policy "read activities" on public.activities for select to authenticated using (true);
drop policy if exists "read achievements" on public.achievements;
create policy "read achievements" on public.achievements for select to authenticated using (true);
drop policy if exists "read config" on public.game_config;
create policy "read config" on public.game_config for select to authenticated using (true);

-- Coven-scoped.
drop policy if exists "own or covenmate profile" on public.profiles;
create policy "own or covenmate profile" on public.profiles for select to authenticated using (
  id = auth.uid() or exists (
    select 1 from public.coven_members a join public.coven_members b on a.coven_id = b.coven_id
    where a.user_id = auth.uid() and b.user_id = public.profiles.id));
drop policy if exists "member covens" on public.covens;
create policy "member covens" on public.covens for select to authenticated using (game.is_member(id));
drop policy if exists "member roster" on public.coven_members;
create policy "member roster" on public.coven_members for select to authenticated using (game.is_member(coven_id));
drop policy if exists "coven characters" on public.characters;
create policy "coven characters" on public.characters for select to authenticated using (game.is_member(coven_id));
drop policy if exists "coven stats" on public.character_stats;
create policy "coven stats" on public.character_stats for select to authenticated using (game.can_see_character(character_id));
drop policy if exists "coven inventory" on public.inventory;
create policy "coven inventory" on public.inventory for select to authenticated using (game.can_see_character(character_id));
drop policy if exists "coven equipment" on public.equipment;
create policy "coven equipment" on public.equipment for select to authenticated using (game.can_see_character(character_id));
drop policy if exists "coven status" on public.character_status;
create policy "coven status" on public.character_status for select to authenticated using (game.can_see_character(character_id));
drop policy if exists "coven achievements" on public.character_achievements;
create policy "coven achievements" on public.character_achievements for select to authenticated using (game.can_see_character(character_id));
drop policy if exists "visible rooms" on public.rooms;
create policy "visible rooms" on public.rooms for select to authenticated using (
  game.owns_character(character_id) or (privacy = 'coven' and game.can_see_character(character_id)));
drop policy if exists "visible decorations" on public.room_decorations;
create policy "visible decorations" on public.room_decorations for select to authenticated using (
  game.owns_character(character_id) or (game.can_see_character(character_id) and exists (
    select 1 from public.rooms r where r.character_id = public.room_decorations.character_id and r.privacy = 'coven')));
drop policy if exists "coven chat" on public.chat_messages;
create policy "coven chat" on public.chat_messages for select to authenticated using (game.is_member(coven_id) and deleted_at is null);
drop policy if exists "coven events" on public.shared_events;
create policy "coven events" on public.shared_events for select to authenticated using (game.is_member(coven_id));
drop policy if exists "coven event participants" on public.shared_event_participants;
create policy "coven event participants" on public.shared_event_participants for select to authenticated using (
  exists (select 1 from public.shared_events e where e.id = event_id and game.is_member(e.coven_id)));
drop policy if exists "own or hosted visits" on public.friend_visits;
create policy "own or hosted visits" on public.friend_visits for select to authenticated using (
  game.owns_character(visitor_id) or game.owns_character(host_id));

-- Private to the owner.
drop policy if exists "own activity log" on public.activity_log;
create policy "own activity log" on public.activity_log for select to authenticated using (game.owns_character(character_id));
drop policy if exists "own receipts" on public.action_receipts;
create policy "own receipts" on public.action_receipts for select to authenticated using (game.owns_character(character_id));
drop policy if exists "own ledger" on public.currency_ledger;
create policy "own ledger" on public.currency_ledger for select to authenticated using (game.owns_character(character_id));
drop policy if exists "own daily" on public.daily_claims;
create policy "own daily" on public.daily_claims for select to authenticated using (game.owns_character(character_id));

-- Admin only (token_hash is a one-way hash; the raw token is never stored).
drop policy if exists "admin invitations" on public.invitations;
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
      if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
        execute format('alter publication supabase_realtime add table public.%I', t);
      end if;
    end loop;
  end if;
end $$;

-- Private realtime channels (presence + broadcast) are limited to coven members.
-- Topic convention: "coven:<coven uuid>".
do $$
begin
  if exists (select 1 from pg_tables where schemaname = 'realtime' and tablename = 'messages') then
    execute 'drop policy if exists "coven members use coven channel" on realtime.messages';
    execute 'drop policy if exists "coven members send on coven channel" on realtime.messages';
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

-- GENERATED by scripts/gen-seed.ts from lib/game/catalog.ts. Do not edit by hand.
begin;

insert into public.covens (id, slug, name) values ('00000000-0000-4000-8000-000000000001', 'pocket-coven', 'The Founding Coven') on conflict (id) do nothing;

insert into public.game_config (key, value) values ('decay_per_hour', '{"nourishment":4,"energy":3,"joy":3,"magic":2,"social":3}'::jsonb) on conflict (key) do nothing;
insert into public.game_config (key, value) values ('decay_floor', '10'::jsonb) on conflict (key) do nothing;
insert into public.game_config (key, value) values ('decay_max_hours', '72'::jsonb) on conflict (key) do nothing;
insert into public.game_config (key, value) values ('daily_pearls', '30'::jsonb) on conflict (key) do nothing;
insert into public.game_config (key, value) values ('daily_loot', '["col_spiral_shell","col_sea_glass_aqua","col_rose_quartz","col_amethyst"]'::jsonb) on conflict (key) do nothing;
insert into public.game_config (key, value) values ('starting_pearls', '120'::jsonb) on conflict (key) do nothing;
insert into public.game_config (key, value) values ('chat_rate_limit', '{"messages":5,"seconds":10}'::jsonb) on conflict (key) do nothing;
insert into public.game_config (key, value) values ('visit_social_bonus', '10'::jsonb) on conflict (key) do nothing;
insert into public.game_config (key, value) values ('shared_events', '{"moon_ritual":{"name":"Coven Moon Ritual","locationId":"moon_deck","minParticipants":2,"effects":{"magic":30,"social":25,"joy":10},"pearls":30,"xp":25,"lootItemId":"col_moonstone"},"sound_bath":{"name":"Group Sound Bath","locationId":"kairos_sound","minParticipants":2,"effects":{"magic":25,"energy":20,"social":20},"pearls":25,"xp":20,"lootItemId":"col_amethyst"}}'::jsonb) on conflict (key) do nothing;
insert into public.game_config (key, value) values ('day_timezone', '"Asia/Makassar"'::jsonb) on conflict (key) do nothing;

insert into public.locations (id, name, world, blurb) values ('palace', 'Pearl Palace', 'shell', 'Your bedroom: oyster bed, vanity and shell spa.') on conflict (id) do update set name = excluded.name, world = excluded.world, blurb = excluded.blurb;
insert into public.locations (id, name, world, blurb) values ('cafe', 'Matcha Café', 'shell', 'Strawberry iced matcha and bone broth on the reef terrace.') on conflict (id) do update set name = excluded.name, world = excluded.world, blurb = excluded.blurb;
insert into public.locations (id, name, world, blurb) values ('grotto', 'Champagne Grotto', 'shell', 'Glittering cave for celebrations. Grown witches only.') on conflict (id) do update set name = excluded.name, world = excluded.world, blurb = excluded.blurb;
insert into public.locations (id, name, world, blurb) values ('moon_deck', 'Moon Deck', 'shell', 'Rituals, stargazing and coven ceremonies.') on conflict (id) do update set name = excluded.name, world = excluded.world, blurb = excluded.blurb;
insert into public.locations (id, name, world, blurb) values ('lagoon', 'Mermaid Lagoon', 'shell', 'Turquoise water, warm and clear.') on conflict (id) do update set name = excluded.name, world = excluded.world, blurb = excluded.blurb;
insert into public.locations (id, name, world, blurb) values ('reef', 'Crystal Reef', 'shell', 'Enchanted kelp forest, crystals and whimsical mushrooms.') on conflict (id) do update set name = excluded.name, world = excluded.world, blurb = excluded.blurb;
insert into public.locations (id, name, world, blurb) values ('beach', 'Shell Beach', 'shell', 'Treasure, sea glass and serious lounging.') on conflict (id) do update set name = excluded.name, world = excluded.world, blurb = excluded.blurb;
insert into public.locations (id, name, world, blurb) values ('lounge', 'Coven Lounge', 'shell', 'Where the coven gathers to gossip in real time.') on conflict (id) do update set name = excluded.name, world = excluded.world, blurb = excluded.blurb;
insert into public.locations (id, name, world, blurb) values ('kairos_pool', 'Kairos Pool', 'kairos', 'Palms, loungers, warm stone and a very blue pool.') on conflict (id) do update set name = excluded.name, world = excluded.world, blurb = excluded.blurb;
insert into public.locations (id, name, world, blurb) values ('kairos_studio', 'Kairos Studio', 'kairos', 'Pilates reformers, yoga mats, stretch corner.') on conflict (id) do update set name = excluded.name, world = excluded.world, blurb = excluded.blurb;
insert into public.locations (id, name, world, blurb) values ('kairos_gym', 'Kairos Gym', 'kairos', 'Tiny pastel dumbbells, enormous effort.') on conflict (id) do update set name = excluded.name, world = excluded.world, blurb = excluded.blurb;
insert into public.locations (id, name, world, blurb) values ('kairos_sound', 'Sound Sanctuary', 'kairos', 'Crystal singing bowls and soft light.') on conflict (id) do update set name = excluded.name, world = excluded.world, blurb = excluded.blurb;
insert into public.locations (id, name, world, blurb) values ('kairos_cowork', 'Kairos Co-Work', 'kairos', 'Rattan desks, laptops and oracle deadlines.') on conflict (id) do update set name = excluded.name, world = excluded.world, blurb = excluded.blurb;
insert into public.locations (id, name, world, blurb) values ('kairos_cafe', 'Kairos Matcha Bar', 'kairos', 'Matcha, broth and nourishing bowls by the pool.') on conflict (id) do update set name = excluded.name, world = excluded.world, blurb = excluded.blurb;

insert into public.items (id, name, category, slot, price, placeable, rarity, description) values ('outfit_babydoll_y2k', 'Y2K Babydoll', 'outfit', 'outfit', 60, false, 'common', 'Pink, puffed, glittered. Dial-up era glamour.') on conflict (id) do update set name = excluded.name, category = excluded.category, slot = excluded.slot, price = excluded.price, placeable = excluded.placeable, rarity = excluded.rarity, description = excluded.description;
insert into public.items (id, name, category, slot, price, placeable, rarity, description) values ('outfit_pearl_gown', 'Pearl Gown', 'outfit', 'outfit', 180, false, 'rare', 'Hand-strung by a very patient oyster.') on conflict (id) do update set name = excluded.name, category = excluded.category, slot = excluded.slot, price = excluded.price, placeable = excluded.placeable, rarity = excluded.rarity, description = excluded.description;
insert into public.items (id, name, category, slot, price, placeable, rarity, description) values ('outfit_moon_robe', 'Moon Robe', 'outfit', 'outfit', 120, false, 'common', 'Navy velvet scattered with stars.') on conflict (id) do update set name = excluded.name, category = excluded.category, slot = excluded.slot, price = excluded.price, placeable = excluded.placeable, rarity = excluded.rarity, description = excluded.description;
insert into public.items (id, name, category, slot, price, placeable, rarity, description) values ('outfit_leather_jacket', 'Inkwell Jacket', 'outfit', 'outfit', 120, false, 'common', 'Black leather, silver studs, zero apologies.') on conflict (id) do update set name = excluded.name, category = excluded.category, slot = excluded.slot, price = excluded.price, placeable = excluded.placeable, rarity = excluded.rarity, description = excluded.description;
insert into public.items (id, name, category, slot, price, placeable, rarity, description) values ('outfit_coral_sarong', 'Coral Sarong Set', 'outfit', 'outfit', 90, false, 'common', 'Sunset coral wrap and shell bandeau.') on conflict (id) do update set name = excluded.name, category = excluded.category, slot = excluded.slot, price = excluded.price, placeable = excluded.placeable, rarity = excluded.rarity, description = excluded.description;
insert into public.items (id, name, category, slot, price, placeable, rarity, description) values ('outfit_mist_gown', 'Mist Gown', 'outfit', 'outfit', 150, false, 'rare', 'Lavender chiffon that drifts like sea fog.') on conflict (id) do update set name = excluded.name, category = excluded.category, slot = excluded.slot, price = excluded.price, placeable = excluded.placeable, rarity = excluded.rarity, description = excluded.description;
insert into public.items (id, name, category, slot, price, placeable, rarity, description) values ('outfit_kairos_active', 'Kairos Activewear', 'outfit', 'outfit', 80, false, 'common', 'Matching set. Pilates-ready, brunch-approved.') on conflict (id) do update set name = excluded.name, category = excluded.category, slot = excluded.slot, price = excluded.price, placeable = excluded.placeable, rarity = excluded.rarity, description = excluded.description;
insert into public.items (id, name, category, slot, price, placeable, rarity, description) values ('outfit_shell_suit', 'Shell Tailored Suit', 'outfit', 'outfit', 160, false, 'rare', 'Sharp pearl-grey suit with a scallop lapel pin.') on conflict (id) do update set name = excluded.name, category = excluded.category, slot = excluded.slot, price = excluded.price, placeable = excluded.placeable, rarity = excluded.rarity, description = excluded.description;
insert into public.items (id, name, category, slot, price, placeable, rarity, description) values ('outfit_overalls', 'Sea-Glass Overalls', 'outfit', 'outfit', 70, false, 'common', 'Washed denim with sea-glass buttons.') on conflict (id) do update set name = excluded.name, category = excluded.category, slot = excluded.slot, price = excluded.price, placeable = excluded.placeable, rarity = excluded.rarity, description = excluded.description;
insert into public.items (id, name, category, slot, price, placeable, rarity, description) values ('tail_pink_aqua', 'Pink Aqua Tail', 'tail', 'tail', 100, false, 'common', 'Shimmers pink to aqua as you swim.') on conflict (id) do update set name = excluded.name, category = excluded.category, slot = excluded.slot, price = excluded.price, placeable = excluded.placeable, rarity = excluded.rarity, description = excluded.description;
insert into public.items (id, name, category, slot, price, placeable, rarity, description) values ('tail_lavender_moon', 'Lavender Moon Tail', 'tail', 'tail', 140, false, 'rare', 'Pale lilac scales with a moonlit fin.') on conflict (id) do update set name = excluded.name, category = excluded.category, slot = excluded.slot, price = excluded.price, placeable = excluded.placeable, rarity = excluded.rarity, description = excluded.description;
insert into public.items (id, name, category, slot, price, placeable, rarity, description) values ('tail_gold_champagne', 'Champagne Gold Tail', 'tail', 'tail', 260, false, 'mythic', 'Effervescent. Literally.') on conflict (id) do update set name = excluded.name, category = excluded.category, slot = excluded.slot, price = excluded.price, placeable = excluded.placeable, rarity = excluded.rarity, description = excluded.description;
insert into public.items (id, name, category, slot, price, placeable, rarity, description) values ('tail_coral_sunset', 'Coral Sunset Tail', 'tail', 'tail', 120, false, 'common', 'Every scale a little sunset.') on conflict (id) do update set name = excluded.name, category = excluded.category, slot = excluded.slot, price = excluded.price, placeable = excluded.placeable, rarity = excluded.rarity, description = excluded.description;
insert into public.items (id, name, category, slot, price, placeable, rarity, description) values ('tail_midnight', 'Midnight Tail', 'tail', 'tail', 140, false, 'rare', 'Deep navy with starlight freckles.') on conflict (id) do update set name = excluded.name, category = excluded.category, slot = excluded.slot, price = excluded.price, placeable = excluded.placeable, rarity = excluded.rarity, description = excluded.description;
insert into public.items (id, name, category, slot, price, placeable, rarity, description) values ('hat_witch_pink', 'Pink Witch Hat', 'hat', 'hat', 70, false, 'common', 'Pointy, pink, perfect.') on conflict (id) do update set name = excluded.name, category = excluded.category, slot = excluded.slot, price = excluded.price, placeable = excluded.placeable, rarity = excluded.rarity, description = excluded.description;
insert into public.items (id, name, category, slot, price, placeable, rarity, description) values ('hat_pearl_crown', 'Pearl Crown', 'hat', 'hat', 150, false, 'rare', 'Tiny, bossy, iconic.') on conflict (id) do update set name = excluded.name, category = excluded.category, slot = excluded.slot, price = excluded.price, placeable = excluded.placeable, rarity = excluded.rarity, description = excluded.description;
insert into public.items (id, name, category, slot, price, placeable, rarity, description) values ('hat_sun_straw', 'Straw Sun Hat', 'hat', 'hat', 60, false, 'common', 'Wide brim, wider attitude.') on conflict (id) do update set name = excluded.name, category = excluded.category, slot = excluded.slot, price = excluded.price, placeable = excluded.placeable, rarity = excluded.rarity, description = excluded.description;
insert into public.items (id, name, category, slot, price, placeable, rarity, description) values ('hat_crescent', 'Crescent Hat', 'hat', 'hat', 110, false, 'common', 'Navy witch hat with a golden crescent.') on conflict (id) do update set name = excluded.name, category = excluded.category, slot = excluded.slot, price = excluded.price, placeable = excluded.placeable, rarity = excluded.rarity, description = excluded.description;
insert into public.items (id, name, category, slot, price, placeable, rarity, description) values ('hat_flower_crown', 'Frangipani Crown', 'hat', 'hat', 80, false, 'common', 'Fresh from a Bali morning.') on conflict (id) do update set name = excluded.name, category = excluded.category, slot = excluded.slot, price = excluded.price, placeable = excluded.placeable, rarity = excluded.rarity, description = excluded.description;
insert into public.items (id, name, category, slot, price, placeable, rarity, description) values ('hat_beanie_black', 'Black Beanie', 'hat', 'hat', 40, false, 'common', 'Slouchy. Cool without trying. (Trying a bit.)') on conflict (id) do update set name = excluded.name, category = excluded.category, slot = excluded.slot, price = excluded.price, placeable = excluded.placeable, rarity = excluded.rarity, description = excluded.description;
insert into public.items (id, name, category, slot, price, placeable, rarity, description) values ('hat_sun_pink', 'Pink Sun Hat', 'hat', 'hat', 70, false, 'common', 'Huge, pink, bow on the band. Practical about shade, impractical about everything else.') on conflict (id) do update set name = excluded.name, category = excluded.category, slot = excluded.slot, price = excluded.price, placeable = excluded.placeable, rarity = excluded.rarity, description = excluded.description;
insert into public.items (id, name, category, slot, price, placeable, rarity, description) values ('hat_crystal_tiara', 'Crystal Tiara', 'hat', 'hat', 170, false, 'rare', 'Quartz points that catch every light.') on conflict (id) do update set name = excluded.name, category = excluded.category, slot = excluded.slot, price = excluded.price, placeable = excluded.placeable, rarity = excluded.rarity, description = excluded.description;
insert into public.items (id, name, category, slot, price, placeable, rarity, description) values ('neck_pearls', 'Pearl Strand', 'jewellery', 'necklace', 80, false, 'common', 'Classic. Smug.') on conflict (id) do update set name = excluded.name, category = excluded.category, slot = excluded.slot, price = excluded.price, placeable = excluded.placeable, rarity = excluded.rarity, description = excluded.description;
insert into public.items (id, name, category, slot, price, placeable, rarity, description) values ('neck_shell', 'Cowrie Necklace', 'jewellery', 'necklace', 50, false, 'common', 'Clinks when you laugh.') on conflict (id) do update set name = excluded.name, category = excluded.category, slot = excluded.slot, price = excluded.price, placeable = excluded.placeable, rarity = excluded.rarity, description = excluded.description;
insert into public.items (id, name, category, slot, price, placeable, rarity, description) values ('neck_moonstone', 'Moonstone Pendant', 'jewellery', 'necklace', 120, false, 'rare', 'Glows faintly at night.') on conflict (id) do update set name = excluded.name, category = excluded.category, slot = excluded.slot, price = excluded.price, placeable = excluded.placeable, rarity = excluded.rarity, description = excluded.description;
insert into public.items (id, name, category, slot, price, placeable, rarity, description) values ('neck_chain_dark', 'Dark Silver Chain', 'jewellery', 'necklace', 60, false, 'common', 'Heavy links, oxidised silver.') on conflict (id) do update set name = excluded.name, category = excluded.category, slot = excluded.slot, price = excluded.price, placeable = excluded.placeable, rarity = excluded.rarity, description = excluded.description;
insert into public.items (id, name, category, slot, price, placeable, rarity, description) values ('neck_crystal', 'Crystal Point Pendant', 'jewellery', 'necklace', 90, false, 'common', 'Clear quartz on a fine chain.') on conflict (id) do update set name = excluded.name, category = excluded.category, slot = excluded.slot, price = excluded.price, placeable = excluded.placeable, rarity = excluded.rarity, description = excluded.description;
insert into public.items (id, name, category, slot, price, placeable, rarity, description) values ('neck_black_pearl', 'Black Pearl Choker', 'jewellery', 'necklace', null, false, 'mythic', 'Found, never bought.') on conflict (id) do update set name = excluded.name, category = excluded.category, slot = excluded.slot, price = excluded.price, placeable = excluded.placeable, rarity = excluded.rarity, description = excluded.description;
insert into public.items (id, name, category, slot, price, placeable, rarity, description) values ('ear_pearl_drop', 'Pearl Drops', 'jewellery', 'earrings', 50, false, 'common', 'A single pearl, swinging.') on conflict (id) do update set name = excluded.name, category = excluded.category, slot = excluded.slot, price = excluded.price, placeable = excluded.placeable, rarity = excluded.rarity, description = excluded.description;
insert into public.items (id, name, category, slot, price, placeable, rarity, description) values ('ear_silver_hoops', 'Silver Hoops', 'jewellery', 'earrings', 40, false, 'common', 'Sturdy, shiny, essential.') on conflict (id) do update set name = excluded.name, category = excluded.category, slot = excluded.slot, price = excluded.price, placeable = excluded.placeable, rarity = excluded.rarity, description = excluded.description;
insert into public.items (id, name, category, slot, price, placeable, rarity, description) values ('ear_star_studs', 'Star Studs', 'jewellery', 'earrings', 45, false, 'common', 'Two tiny stars.') on conflict (id) do update set name = excluded.name, category = excluded.category, slot = excluded.slot, price = excluded.price, placeable = excluded.placeable, rarity = excluded.rarity, description = excluded.description;
insert into public.items (id, name, category, slot, price, placeable, rarity, description) values ('ear_shell_dangles', 'Shell Dangles', 'jewellery', 'earrings', 45, false, 'common', 'Mini scallops on gold.') on conflict (id) do update set name = excluded.name, category = excluded.category, slot = excluded.slot, price = excluded.price, placeable = excluded.placeable, rarity = excluded.rarity, description = excluded.description;
insert into public.items (id, name, category, slot, price, placeable, rarity, description) values ('hair_shell_clip', 'Shell Clip', 'hair_acc', 'hair_acc', 30, false, 'common', 'A pearly scallop clip.') on conflict (id) do update set name = excluded.name, category = excluded.category, slot = excluded.slot, price = excluded.price, placeable = excluded.placeable, rarity = excluded.rarity, description = excluded.description;
insert into public.items (id, name, category, slot, price, placeable, rarity, description) values ('hair_bow_pink', 'Satin Bow', 'hair_acc', 'hair_acc', 30, false, 'common', 'Big. Pink. Unignorable.') on conflict (id) do update set name = excluded.name, category = excluded.category, slot = excluded.slot, price = excluded.price, placeable = excluded.placeable, rarity = excluded.rarity, description = excluded.description;
insert into public.items (id, name, category, slot, price, placeable, rarity, description) values ('hair_starfish', 'Starfish Pin', 'hair_acc', 'hair_acc', 35, false, 'common', 'A sleepy starfish who agreed to this.') on conflict (id) do update set name = excluded.name, category = excluded.category, slot = excluded.slot, price = excluded.price, placeable = excluded.placeable, rarity = excluded.rarity, description = excluded.description;
insert into public.items (id, name, category, slot, price, placeable, rarity, description) values ('hair_moon_pins', 'Moon and Star Pins', 'hair_acc', 'hair_acc', 45, false, 'common', 'Tiny gold crescents scattered through the curls.') on conflict (id) do update set name = excluded.name, category = excluded.category, slot = excluded.slot, price = excluded.price, placeable = excluded.placeable, rarity = excluded.rarity, description = excluded.description;
insert into public.items (id, name, category, slot, price, placeable, rarity, description) values ('hair_sunglasses', 'Shades on Head', 'hair_acc', 'hair_acc', 40, false, 'common', 'Black cat-eye shades pushed up.') on conflict (id) do update set name = excluded.name, category = excluded.category, slot = excluded.slot, price = excluded.price, placeable = excluded.placeable, rarity = excluded.rarity, description = excluded.description;
insert into public.items (id, name, category, slot, price, placeable, rarity, description) values ('pet_seahorse', 'Pearl Seahorse', 'companion', 'companion', 200, false, 'rare', 'Loyal, glittery, mildly judgemental.') on conflict (id) do update set name = excluded.name, category = excluded.category, slot = excluded.slot, price = excluded.price, placeable = excluded.placeable, rarity = excluded.rarity, description = excluded.description;
insert into public.items (id, name, category, slot, price, placeable, rarity, description) values ('pet_jellyfish', 'Moon Jelly', 'companion', 'companion', 180, false, 'rare', 'Bobs beside you. Glows when happy.') on conflict (id) do update set name = excluded.name, category = excluded.category, slot = excluded.slot, price = excluded.price, placeable = excluded.placeable, rarity = excluded.rarity, description = excluded.description;
insert into public.items (id, name, category, slot, price, placeable, rarity, description) values ('pet_crab_bat', 'Bat Crab', 'companion', 'companion', 220, false, 'rare', 'A crab with tiny bat wings. Do not ask.') on conflict (id) do update set name = excluded.name, category = excluded.category, slot = excluded.slot, price = excluded.price, placeable = excluded.placeable, rarity = excluded.rarity, description = excluded.description;
insert into public.items (id, name, category, slot, price, placeable, rarity, description) values ('pet_black_cat', 'Black Cat', 'companion', 'companion', 200, false, 'rare', 'Sleek, unbothered, protective. A classic for a reason.') on conflict (id) do update set name = excluded.name, category = excluded.category, slot = excluded.slot, price = excluded.price, placeable = excluded.placeable, rarity = excluded.rarity, description = excluded.description;
insert into public.items (id, name, category, slot, price, placeable, rarity, description) values ('pet_white_kitten', 'White Kitten', 'companion', 'companion', 200, false, 'rare', 'Fluffy, gentle, occasionally prophetic.') on conflict (id) do update set name = excluded.name, category = excluded.category, slot = excluded.slot, price = excluded.price, placeable = excluded.placeable, rarity = excluded.rarity, description = excluded.description;
insert into public.items (id, name, category, slot, price, placeable, rarity, description) values ('pet_butterfly', 'Violet Butterfly', 'companion', 'companion', 160, false, 'common', 'Flutters in moon-shaped loops.') on conflict (id) do update set name = excluded.name, category = excluded.category, slot = excluded.slot, price = excluded.price, placeable = excluded.placeable, rarity = excluded.rarity, description = excluded.description;
insert into public.items (id, name, category, slot, price, placeable, rarity, description) values ('pet_moth_moon', 'Luna Moth', 'companion', 'companion', 220, false, 'rare', 'Pale green wings, moon-drunk.') on conflict (id) do update set name = excluded.name, category = excluded.category, slot = excluded.slot, price = excluded.price, placeable = excluded.placeable, rarity = excluded.rarity, description = excluded.description;
insert into public.items (id, name, category, slot, price, placeable, rarity, description) values ('furn_oyster_bed', 'Oyster Bed', 'furniture', null, 150, true, 'rare', 'A clam bed with a pearl pillow.') on conflict (id) do update set name = excluded.name, category = excluded.category, slot = excluded.slot, price = excluded.price, placeable = excluded.placeable, rarity = excluded.rarity, description = excluded.description;
insert into public.items (id, name, category, slot, price, placeable, rarity, description) values ('furn_shell_vanity', 'Shell Vanity', 'furniture', null, 120, true, 'common', 'Scallop mirror, gold legs.') on conflict (id) do update set name = excluded.name, category = excluded.category, slot = excluded.slot, price = excluded.price, placeable = excluded.placeable, rarity = excluded.rarity, description = excluded.description;
insert into public.items (id, name, category, slot, price, placeable, rarity, description) values ('furn_clam_chair', 'Clam Chair', 'furniture', null, 70, true, 'common', 'Sit inside a clam. Feel held.') on conflict (id) do update set name = excluded.name, category = excluded.category, slot = excluded.slot, price = excluded.price, placeable = excluded.placeable, rarity = excluded.rarity, description = excluded.description;
insert into public.items (id, name, category, slot, price, placeable, rarity, description) values ('furn_coral_lamp', 'Coral Lamp', 'furniture', null, 60, true, 'common', 'Branching coral with a warm glow.') on conflict (id) do update set name = excluded.name, category = excluded.category, slot = excluded.slot, price = excluded.price, placeable = excluded.placeable, rarity = excluded.rarity, description = excluded.description;
insert into public.items (id, name, category, slot, price, placeable, rarity, description) values ('furn_pearl_rug', 'Pearl Rug', 'furniture', null, 50, true, 'common', 'Round, iridescent, plush.') on conflict (id) do update set name = excluded.name, category = excluded.category, slot = excluded.slot, price = excluded.price, placeable = excluded.placeable, rarity = excluded.rarity, description = excluded.description;
insert into public.items (id, name, category, slot, price, placeable, rarity, description) values ('furn_kelp_shelf', 'Kelp Bookshelf', 'furniture', null, 90, true, 'common', 'Holds spellbooks and gossip mags.') on conflict (id) do update set name = excluded.name, category = excluded.category, slot = excluded.slot, price = excluded.price, placeable = excluded.placeable, rarity = excluded.rarity, description = excluded.description;
insert into public.items (id, name, category, slot, price, placeable, rarity, description) values ('furn_crystal_ball_table', 'Crystal Ball Table', 'furniture', null, 130, true, 'rare', 'Sees everything. Says little.') on conflict (id) do update set name = excluded.name, category = excluded.category, slot = excluded.slot, price = excluded.price, placeable = excluded.placeable, rarity = excluded.rarity, description = excluded.description;
insert into public.items (id, name, category, slot, price, placeable, rarity, description) values ('furn_disco_shell', 'Disco Shell', 'furniture', null, 200, true, 'mythic', 'A mirrorball scallop for emergencies.') on conflict (id) do update set name = excluded.name, category = excluded.category, slot = excluded.slot, price = excluded.price, placeable = excluded.placeable, rarity = excluded.rarity, description = excluded.description;
insert into public.items (id, name, category, slot, price, placeable, rarity, description) values ('decor_palm_pot', 'Potted Palm', 'decor', null, 40, true, 'common', 'A tiny Bali palm.') on conflict (id) do update set name = excluded.name, category = excluded.category, slot = excluded.slot, price = excluded.price, placeable = excluded.placeable, rarity = excluded.rarity, description = excluded.description;
insert into public.items (id, name, category, slot, price, placeable, rarity, description) values ('decor_treasure_chest', 'Treasure Chest', 'decor', null, 110, true, 'rare', 'Slightly ajar. Glittering.') on conflict (id) do update set name = excluded.name, category = excluded.category, slot = excluded.slot, price = excluded.price, placeable = excluded.placeable, rarity = excluded.rarity, description = excluded.description;
insert into public.items (id, name, category, slot, price, placeable, rarity, description) values ('decor_moon_lantern', 'Moon Lantern', 'decor', null, 55, true, 'common', 'A paper moon on a string.') on conflict (id) do update set name = excluded.name, category = excluded.category, slot = excluded.slot, price = excluded.price, placeable = excluded.placeable, rarity = excluded.rarity, description = excluded.description;
insert into public.items (id, name, category, slot, price, placeable, rarity, description) values ('decor_starfish_garland', 'Starfish Garland', 'decor', null, 35, true, 'common', 'Starfish holding hands.') on conflict (id) do update set name = excluded.name, category = excluded.category, slot = excluded.slot, price = excluded.price, placeable = excluded.placeable, rarity = excluded.rarity, description = excluded.description;
insert into public.items (id, name, category, slot, price, placeable, rarity, description) values ('decor_mushroom_lamp', 'Glowshroom Lamp', 'decor', null, 65, true, 'common', 'Soft violet mushroom light.') on conflict (id) do update set name = excluded.name, category = excluded.category, slot = excluded.slot, price = excluded.price, placeable = excluded.placeable, rarity = excluded.rarity, description = excluded.description;
insert into public.items (id, name, category, slot, price, placeable, rarity, description) values ('col_spiral_shell', 'Spiral Shell', 'collectible', null, null, true, 'common', 'Listen closely: it''s gossiping.') on conflict (id) do update set name = excluded.name, category = excluded.category, slot = excluded.slot, price = excluded.price, placeable = excluded.placeable, rarity = excluded.rarity, description = excluded.description;
insert into public.items (id, name, category, slot, price, placeable, rarity, description) values ('col_sea_glass_aqua', 'Aqua Sea Glass', 'collectible', null, null, true, 'common', 'Frosted by a hundred tides.') on conflict (id) do update set name = excluded.name, category = excluded.category, slot = excluded.slot, price = excluded.price, placeable = excluded.placeable, rarity = excluded.rarity, description = excluded.description;
insert into public.items (id, name, category, slot, price, placeable, rarity, description) values ('col_sea_glass_rose', 'Rose Sea Glass', 'collectible', null, null, true, 'rare', 'Pink sea glass. Rare and smug about it.') on conflict (id) do update set name = excluded.name, category = excluded.category, slot = excluded.slot, price = excluded.price, placeable = excluded.placeable, rarity = excluded.rarity, description = excluded.description;
insert into public.items (id, name, category, slot, price, placeable, rarity, description) values ('col_amethyst', 'Amethyst Cluster', 'collectible', null, null, true, 'common', 'Violet points, calming energy.') on conflict (id) do update set name = excluded.name, category = excluded.category, slot = excluded.slot, price = excluded.price, placeable = excluded.placeable, rarity = excluded.rarity, description = excluded.description;
insert into public.items (id, name, category, slot, price, placeable, rarity, description) values ('col_rose_quartz', 'Rose Quartz', 'collectible', null, null, true, 'common', 'Soft pink, softer heart.') on conflict (id) do update set name = excluded.name, category = excluded.category, slot = excluded.slot, price = excluded.price, placeable = excluded.placeable, rarity = excluded.rarity, description = excluded.description;
insert into public.items (id, name, category, slot, price, placeable, rarity, description) values ('col_moonstone', 'Moonstone', 'collectible', null, null, true, 'rare', 'Holds a sliver of moonlight.') on conflict (id) do update set name = excluded.name, category = excluded.category, slot = excluded.slot, price = excluded.price, placeable = excluded.placeable, rarity = excluded.rarity, description = excluded.description;
insert into public.items (id, name, category, slot, price, placeable, rarity, description) values ('col_talisman_eye', 'Evil-Eye Talisman', 'collectible', null, null, true, 'rare', 'Watches your back so you don''t have to.') on conflict (id) do update set name = excluded.name, category = excluded.category, slot = excluded.slot, price = excluded.price, placeable = excluded.placeable, rarity = excluded.rarity, description = excluded.description;
insert into public.items (id, name, category, slot, price, placeable, rarity, description) values ('col_golden_scallop', 'Golden Scallop', 'collectible', null, null, true, 'mythic', 'The rarest shell in the lagoon.') on conflict (id) do update set name = excluded.name, category = excluded.category, slot = excluded.slot, price = excluded.price, placeable = excluded.placeable, rarity = excluded.rarity, description = excluded.description;
insert into public.items (id, name, category, slot, price, placeable, rarity, description) values ('col_glowshroom', 'Glowshroom Cap', 'collectible', null, null, true, 'common', 'A tiny violet mushroom that hums.') on conflict (id) do update set name = excluded.name, category = excluded.category, slot = excluded.slot, price = excluded.price, placeable = excluded.placeable, rarity = excluded.rarity, description = excluded.description;

insert into public.activities (id, location_id, name, effects, pearls, xp, cooldown_seconds, adult_only, loot, animation, flavour_count) values ('nap_oyster', 'palace', 'Nap in the oyster bed', '{"energy":35,"joy":5}'::jsonb, 0, 5, 600, false, '[]'::jsonb, 'sleep', 2) on conflict (id) do update set location_id = excluded.location_id, name = excluded.name, effects = excluded.effects, pearls = excluded.pearls, xp = excluded.xp, cooldown_seconds = excluded.cooldown_seconds, adult_only = excluded.adult_only, loot = excluded.loot, animation = excluded.animation, flavour_count = excluded.flavour_count;
insert into public.activities (id, location_id, name, effects, pearls, xp, cooldown_seconds, adult_only, loot, animation, flavour_count) values ('shell_spa', 'palace', 'Bathe in the shell spa', '{"joy":20,"magic":10,"energy":5}'::jsonb, 0, 6, 900, false, '[]'::jsonb, 'bathe', 2) on conflict (id) do update set location_id = excluded.location_id, name = excluded.name, effects = excluded.effects, pearls = excluded.pearls, xp = excluded.xp, cooldown_seconds = excluded.cooldown_seconds, adult_only = excluded.adult_only, loot = excluded.loot, animation = excluded.animation, flavour_count = excluded.flavour_count;
insert into public.activities (id, location_id, name, effects, pearls, xp, cooldown_seconds, adult_only, loot, animation, flavour_count) values ('cuddle', 'palace', 'Cuddle', '{"joy":15,"social":10}'::jsonb, 0, 4, 300, false, '[]'::jsonb, 'cuddle', 2) on conflict (id) do update set location_id = excluded.location_id, name = excluded.name, effects = excluded.effects, pearls = excluded.pearls, xp = excluded.xp, cooldown_seconds = excluded.cooldown_seconds, adult_only = excluded.adult_only, loot = excluded.loot, animation = excluded.animation, flavour_count = excluded.flavour_count;
insert into public.activities (id, location_id, name, effects, pearls, xp, cooldown_seconds, adult_only, loot, animation, flavour_count) values ('play', 'palace', 'Play dress-up', '{"joy":20,"energy":-8}'::jsonb, 2, 5, 300, false, '[]'::jsonb, 'play', 2) on conflict (id) do update set location_id = excluded.location_id, name = excluded.name, effects = excluded.effects, pearls = excluded.pearls, xp = excluded.xp, cooldown_seconds = excluded.cooldown_seconds, adult_only = excluded.adult_only, loot = excluded.loot, animation = excluded.animation, flavour_count = excluded.flavour_count;
insert into public.activities (id, location_id, name, effects, pearls, xp, cooldown_seconds, adult_only, loot, animation, flavour_count) values ('cast_spell', 'palace', 'Cast a little spell', '{"magic":20,"energy":-10}'::jsonb, 3, 8, 600, false, '[{"item_id":"col_rose_quartz","chance":0.15}]'::jsonb, 'spell', 2) on conflict (id) do update set location_id = excluded.location_id, name = excluded.name, effects = excluded.effects, pearls = excluded.pearls, xp = excluded.xp, cooldown_seconds = excluded.cooldown_seconds, adult_only = excluded.adult_only, loot = excluded.loot, animation = excluded.animation, flavour_count = excluded.flavour_count;
insert into public.activities (id, location_id, name, effects, pearls, xp, cooldown_seconds, adult_only, loot, animation, flavour_count) values ('cafe_matcha', 'cafe', 'Strawberry iced matcha', '{"nourishment":15,"joy":15,"energy":10}'::jsonb, -8, 4, 180, false, '[]'::jsonb, 'drink', 2) on conflict (id) do update set location_id = excluded.location_id, name = excluded.name, effects = excluded.effects, pearls = excluded.pearls, xp = excluded.xp, cooldown_seconds = excluded.cooldown_seconds, adult_only = excluded.adult_only, loot = excluded.loot, animation = excluded.animation, flavour_count = excluded.flavour_count;
insert into public.activities (id, location_id, name, effects, pearls, xp, cooldown_seconds, adult_only, loot, animation, flavour_count) values ('cafe_broth', 'cafe', 'Bone broth', '{"nourishment":30,"energy":5}'::jsonb, -6, 4, 180, false, '[]'::jsonb, 'eat', 2) on conflict (id) do update set location_id = excluded.location_id, name = excluded.name, effects = excluded.effects, pearls = excluded.pearls, xp = excluded.xp, cooldown_seconds = excluded.cooldown_seconds, adult_only = excluded.adult_only, loot = excluded.loot, animation = excluded.animation, flavour_count = excluded.flavour_count;
insert into public.activities (id, location_id, name, effects, pearls, xp, cooldown_seconds, adult_only, loot, animation, flavour_count) values ('cafe_feed', 'cafe', 'Pearl pancakes', '{"nourishment":25,"joy":8}'::jsonb, -5, 3, 180, false, '[]'::jsonb, 'eat', 2) on conflict (id) do update set location_id = excluded.location_id, name = excluded.name, effects = excluded.effects, pearls = excluded.pearls, xp = excluded.xp, cooldown_seconds = excluded.cooldown_seconds, adult_only = excluded.adult_only, loot = excluded.loot, animation = excluded.animation, flavour_count = excluded.flavour_count;
insert into public.activities (id, location_id, name, effects, pearls, xp, cooldown_seconds, adult_only, loot, animation, flavour_count) values ('cafe_socialise', 'cafe', 'Chat with the regulars', '{"social":20,"joy":5}'::jsonb, 1, 4, 300, false, '[]'::jsonb, 'gossip', 2) on conflict (id) do update set location_id = excluded.location_id, name = excluded.name, effects = excluded.effects, pearls = excluded.pearls, xp = excluded.xp, cooldown_seconds = excluded.cooldown_seconds, adult_only = excluded.adult_only, loot = excluded.loot, animation = excluded.animation, flavour_count = excluded.flavour_count;
insert into public.activities (id, location_id, name, effects, pearls, xp, cooldown_seconds, adult_only, loot, animation, flavour_count) values ('grotto_toast', 'grotto', 'Champagne toast', '{"joy":25,"social":15,"energy":-5}'::jsonb, 0, 6, 900, true, '[]'::jsonb, 'toast', 2) on conflict (id) do update set location_id = excluded.location_id, name = excluded.name, effects = excluded.effects, pearls = excluded.pearls, xp = excluded.xp, cooldown_seconds = excluded.cooldown_seconds, adult_only = excluded.adult_only, loot = excluded.loot, animation = excluded.animation, flavour_count = excluded.flavour_count;
insert into public.activities (id, location_id, name, effects, pearls, xp, cooldown_seconds, adult_only, loot, animation, flavour_count) values ('grotto_dance', 'grotto', 'Dance under the disco shell', '{"joy":25,"energy":-15,"social":10}'::jsonb, 2, 6, 600, false, '[]'::jsonb, 'dance', 2) on conflict (id) do update set location_id = excluded.location_id, name = excluded.name, effects = excluded.effects, pearls = excluded.pearls, xp = excluded.xp, cooldown_seconds = excluded.cooldown_seconds, adult_only = excluded.adult_only, loot = excluded.loot, animation = excluded.animation, flavour_count = excluded.flavour_count;
insert into public.activities (id, location_id, name, effects, pearls, xp, cooldown_seconds, adult_only, loot, animation, flavour_count) values ('grotto_gossip_break', 'grotto', 'Balcony gossip break', '{"social":25,"joy":10}'::jsonb, 0, 5, 900, true, '[]'::jsonb, 'gossip', 2) on conflict (id) do update set location_id = excluded.location_id, name = excluded.name, effects = excluded.effects, pearls = excluded.pearls, xp = excluded.xp, cooldown_seconds = excluded.cooldown_seconds, adult_only = excluded.adult_only, loot = excluded.loot, animation = excluded.animation, flavour_count = excluded.flavour_count;
insert into public.activities (id, location_id, name, effects, pearls, xp, cooldown_seconds, adult_only, loot, animation, flavour_count) values ('moon_stargaze', 'moon_deck', 'Stargaze', '{"magic":20,"joy":10}'::jsonb, 2, 6, 600, false, '[{"item_id":"col_moonstone","chance":0.1}]'::jsonb, 'stargaze', 2) on conflict (id) do update set location_id = excluded.location_id, name = excluded.name, effects = excluded.effects, pearls = excluded.pearls, xp = excluded.xp, cooldown_seconds = excluded.cooldown_seconds, adult_only = excluded.adult_only, loot = excluded.loot, animation = excluded.animation, flavour_count = excluded.flavour_count;
insert into public.activities (id, location_id, name, effects, pearls, xp, cooldown_seconds, adult_only, loot, animation, flavour_count) values ('moon_ritual_solo', 'moon_deck', 'Personal moon ritual', '{"magic":30,"energy":-10}'::jsonb, 4, 10, 1800, false, '[{"item_id":"col_amethyst","chance":0.25}]'::jsonb, 'spell', 2) on conflict (id) do update set location_id = excluded.location_id, name = excluded.name, effects = excluded.effects, pearls = excluded.pearls, xp = excluded.xp, cooldown_seconds = excluded.cooldown_seconds, adult_only = excluded.adult_only, loot = excluded.loot, animation = excluded.animation, flavour_count = excluded.flavour_count;
insert into public.activities (id, location_id, name, effects, pearls, xp, cooldown_seconds, adult_only, loot, animation, flavour_count) values ('lagoon_swim', 'lagoon', 'Swim', '{"joy":20,"energy":-10,"magic":5}'::jsonb, 2, 6, 300, false, '[{"item_id":"col_sea_glass_aqua","chance":0.2}]'::jsonb, 'swim', 2) on conflict (id) do update set location_id = excluded.location_id, name = excluded.name, effects = excluded.effects, pearls = excluded.pearls, xp = excluded.xp, cooldown_seconds = excluded.cooldown_seconds, adult_only = excluded.adult_only, loot = excluded.loot, animation = excluded.animation, flavour_count = excluded.flavour_count;
insert into public.activities (id, location_id, name, effects, pearls, xp, cooldown_seconds, adult_only, loot, animation, flavour_count) values ('lagoon_float', 'lagoon', 'Float and do nothing', '{"energy":15,"joy":10}'::jsonb, 0, 3, 300, false, '[]'::jsonb, 'float', 2) on conflict (id) do update set location_id = excluded.location_id, name = excluded.name, effects = excluded.effects, pearls = excluded.pearls, xp = excluded.xp, cooldown_seconds = excluded.cooldown_seconds, adult_only = excluded.adult_only, loot = excluded.loot, animation = excluded.animation, flavour_count = excluded.flavour_count;
insert into public.activities (id, location_id, name, effects, pearls, xp, cooldown_seconds, adult_only, loot, animation, flavour_count) values ('reef_explore', 'reef', 'Explore the kelp forest', '{"joy":10,"energy":-12,"magic":8}'::jsonb, 3, 8, 600, false, '[{"item_id":"col_amethyst","chance":0.3},{"item_id":"col_spiral_shell","chance":0.3},{"item_id":"col_golden_scallop","chance":0.02}]'::jsonb, 'explore', 2) on conflict (id) do update set location_id = excluded.location_id, name = excluded.name, effects = excluded.effects, pearls = excluded.pearls, xp = excluded.xp, cooldown_seconds = excluded.cooldown_seconds, adult_only = excluded.adult_only, loot = excluded.loot, animation = excluded.animation, flavour_count = excluded.flavour_count;
insert into public.activities (id, location_id, name, effects, pearls, xp, cooldown_seconds, adult_only, loot, animation, flavour_count) values ('reef_crystals', 'reef', 'Collect crystals', '{"magic":15,"energy":-8}'::jsonb, 2, 6, 600, false, '[{"item_id":"col_rose_quartz","chance":0.4},{"item_id":"col_amethyst","chance":0.3},{"item_id":"col_talisman_eye","chance":0.05}]'::jsonb, 'dig', 2) on conflict (id) do update set location_id = excluded.location_id, name = excluded.name, effects = excluded.effects, pearls = excluded.pearls, xp = excluded.xp, cooldown_seconds = excluded.cooldown_seconds, adult_only = excluded.adult_only, loot = excluded.loot, animation = excluded.animation, flavour_count = excluded.flavour_count;
insert into public.activities (id, location_id, name, effects, pearls, xp, cooldown_seconds, adult_only, loot, animation, flavour_count) values ('reef_mushroom', 'reef', 'Glowshroom giggles', '{"joy":25,"magic":15,"energy":-5}'::jsonb, 0, 6, 1800, true, '[{"item_id":"col_glowshroom","chance":0.5}]'::jsonb, 'mushroom', 2) on conflict (id) do update set location_id = excluded.location_id, name = excluded.name, effects = excluded.effects, pearls = excluded.pearls, xp = excluded.xp, cooldown_seconds = excluded.cooldown_seconds, adult_only = excluded.adult_only, loot = excluded.loot, animation = excluded.animation, flavour_count = excluded.flavour_count;
insert into public.activities (id, location_id, name, effects, pearls, xp, cooldown_seconds, adult_only, loot, animation, flavour_count) values ('beach_treasure', 'beach', 'Treasure hunt', '{"joy":15,"energy":-12}'::jsonb, 6, 8, 600, false, '[{"item_id":"col_spiral_shell","chance":0.4},{"item_id":"col_sea_glass_rose","chance":0.12},{"item_id":"col_golden_scallop","chance":0.03},{"item_id":"neck_black_pearl","chance":0.01}]'::jsonb, 'dig', 2) on conflict (id) do update set location_id = excluded.location_id, name = excluded.name, effects = excluded.effects, pearls = excluded.pearls, xp = excluded.xp, cooldown_seconds = excluded.cooldown_seconds, adult_only = excluded.adult_only, loot = excluded.loot, animation = excluded.animation, flavour_count = excluded.flavour_count;
insert into public.activities (id, location_id, name, effects, pearls, xp, cooldown_seconds, adult_only, loot, animation, flavour_count) values ('beach_glass', 'beach', 'Sea-glass stroll', '{"joy":10,"magic":5,"energy":-5}'::jsonb, 3, 5, 300, false, '[{"item_id":"col_sea_glass_aqua","chance":0.4},{"item_id":"col_sea_glass_rose","chance":0.1}]'::jsonb, 'explore', 2) on conflict (id) do update set location_id = excluded.location_id, name = excluded.name, effects = excluded.effects, pearls = excluded.pearls, xp = excluded.xp, cooldown_seconds = excluded.cooldown_seconds, adult_only = excluded.adult_only, loot = excluded.loot, animation = excluded.animation, flavour_count = excluded.flavour_count;
insert into public.activities (id, location_id, name, effects, pearls, xp, cooldown_seconds, adult_only, loot, animation, flavour_count) values ('beach_lounge', 'beach', 'Lounge on the sand', '{"energy":20,"joy":10}'::jsonb, 0, 3, 300, false, '[]'::jsonb, 'float', 2) on conflict (id) do update set location_id = excluded.location_id, name = excluded.name, effects = excluded.effects, pearls = excluded.pearls, xp = excluded.xp, cooldown_seconds = excluded.cooldown_seconds, adult_only = excluded.adult_only, loot = excluded.loot, animation = excluded.animation, flavour_count = excluded.flavour_count;
insert into public.activities (id, location_id, name, effects, pearls, xp, cooldown_seconds, adult_only, loot, animation, flavour_count) values ('lounge_dance', 'lounge', 'Dance it out', '{"joy":20,"social":15,"energy":-10}'::jsonb, 2, 5, 300, false, '[]'::jsonb, 'dance', 2) on conflict (id) do update set location_id = excluded.location_id, name = excluded.name, effects = excluded.effects, pearls = excluded.pearls, xp = excluded.xp, cooldown_seconds = excluded.cooldown_seconds, adult_only = excluded.adult_only, loot = excluded.loot, animation = excluded.animation, flavour_count = excluded.flavour_count;
insert into public.activities (id, location_id, name, effects, pearls, xp, cooldown_seconds, adult_only, loot, animation, flavour_count) values ('lounge_movie', 'lounge', 'Movie night', '{"joy":20,"social":15,"energy":5}'::jsonb, 0, 5, 1800, false, '[]'::jsonb, 'play', 2) on conflict (id) do update set location_id = excluded.location_id, name = excluded.name, effects = excluded.effects, pearls = excluded.pearls, xp = excluded.xp, cooldown_seconds = excluded.cooldown_seconds, adult_only = excluded.adult_only, loot = excluded.loot, animation = excluded.animation, flavour_count = excluded.flavour_count;
insert into public.activities (id, location_id, name, effects, pearls, xp, cooldown_seconds, adult_only, loot, animation, flavour_count) values ('lounge_gossip', 'lounge', 'Gossip on the shell sofa', '{"social":25,"joy":10}'::jsonb, 0, 4, 600, false, '[]'::jsonb, 'gossip', 2) on conflict (id) do update set location_id = excluded.location_id, name = excluded.name, effects = excluded.effects, pearls = excluded.pearls, xp = excluded.xp, cooldown_seconds = excluded.cooldown_seconds, adult_only = excluded.adult_only, loot = excluded.loot, animation = excluded.animation, flavour_count = excluded.flavour_count;
insert into public.activities (id, location_id, name, effects, pearls, xp, cooldown_seconds, adult_only, loot, animation, flavour_count) values ('beach_day', 'beach', 'Beach day picnic', '{"joy":20,"social":10,"nourishment":10}'::jsonb, 0, 5, 1800, false, '[]'::jsonb, 'eat', 2) on conflict (id) do update set location_id = excluded.location_id, name = excluded.name, effects = excluded.effects, pearls = excluded.pearls, xp = excluded.xp, cooldown_seconds = excluded.cooldown_seconds, adult_only = excluded.adult_only, loot = excluded.loot, animation = excluded.animation, flavour_count = excluded.flavour_count;
insert into public.activities (id, location_id, name, effects, pearls, xp, cooldown_seconds, adult_only, loot, animation, flavour_count) values ('kairos_swim', 'kairos_pool', 'Laps in the pool', '{"joy":20,"energy":-10,"social":5}'::jsonb, 3, 6, 300, false, '[]'::jsonb, 'swim', 2) on conflict (id) do update set location_id = excluded.location_id, name = excluded.name, effects = excluded.effects, pearls = excluded.pearls, xp = excluded.xp, cooldown_seconds = excluded.cooldown_seconds, adult_only = excluded.adult_only, loot = excluded.loot, animation = excluded.animation, flavour_count = excluded.flavour_count;
insert into public.activities (id, location_id, name, effects, pearls, xp, cooldown_seconds, adult_only, loot, animation, flavour_count) values ('kairos_float', 'kairos_pool', 'Float and lounge', '{"energy":20,"joy":15}'::jsonb, 0, 3, 300, false, '[]'::jsonb, 'float', 2) on conflict (id) do update set location_id = excluded.location_id, name = excluded.name, effects = excluded.effects, pearls = excluded.pearls, xp = excluded.xp, cooldown_seconds = excluded.cooldown_seconds, adult_only = excluded.adult_only, loot = excluded.loot, animation = excluded.animation, flavour_count = excluded.flavour_count;
insert into public.activities (id, location_id, name, effects, pearls, xp, cooldown_seconds, adult_only, loot, animation, flavour_count) values ('kairos_pilates', 'kairos_studio', 'Pilates class', '{"energy":-15,"joy":10,"magic":5,"social":5}'::jsonb, 5, 10, 900, false, '[]'::jsonb, 'pilates', 2) on conflict (id) do update set location_id = excluded.location_id, name = excluded.name, effects = excluded.effects, pearls = excluded.pearls, xp = excluded.xp, cooldown_seconds = excluded.cooldown_seconds, adult_only = excluded.adult_only, loot = excluded.loot, animation = excluded.animation, flavour_count = excluded.flavour_count;
insert into public.activities (id, location_id, name, effects, pearls, xp, cooldown_seconds, adult_only, loot, animation, flavour_count) values ('kairos_yoga', 'kairos_studio', 'Yoga flow', '{"magic":20,"energy":-5,"joy":10}'::jsonb, 4, 9, 900, false, '[]'::jsonb, 'yoga', 2) on conflict (id) do update set location_id = excluded.location_id, name = excluded.name, effects = excluded.effects, pearls = excluded.pearls, xp = excluded.xp, cooldown_seconds = excluded.cooldown_seconds, adult_only = excluded.adult_only, loot = excluded.loot, animation = excluded.animation, flavour_count = excluded.flavour_count;
insert into public.activities (id, location_id, name, effects, pearls, xp, cooldown_seconds, adult_only, loot, animation, flavour_count) values ('kairos_stretch', 'kairos_studio', 'Gentle stretch', '{"energy":10,"joy":8}'::jsonb, 2, 4, 300, false, '[]'::jsonb, 'stretch', 2) on conflict (id) do update set location_id = excluded.location_id, name = excluded.name, effects = excluded.effects, pearls = excluded.pearls, xp = excluded.xp, cooldown_seconds = excluded.cooldown_seconds, adult_only = excluded.adult_only, loot = excluded.loot, animation = excluded.animation, flavour_count = excluded.flavour_count;
insert into public.activities (id, location_id, name, effects, pearls, xp, cooldown_seconds, adult_only, loot, animation, flavour_count) values ('kairos_weights', 'kairos_gym', 'Lift tiny weights', '{"energy":-18,"joy":12,"nourishment":-8}'::jsonb, 5, 10, 900, false, '[]'::jsonb, 'weights', 2) on conflict (id) do update set location_id = excluded.location_id, name = excluded.name, effects = excluded.effects, pearls = excluded.pearls, xp = excluded.xp, cooldown_seconds = excluded.cooldown_seconds, adult_only = excluded.adult_only, loot = excluded.loot, animation = excluded.animation, flavour_count = excluded.flavour_count;
insert into public.activities (id, location_id, name, effects, pearls, xp, cooldown_seconds, adult_only, loot, animation, flavour_count) values ('kairos_sound', 'kairos_sound', 'Sound healing', '{"magic":25,"energy":15,"joy":5}'::jsonb, 3, 9, 900, false, '[{"item_id":"col_moonstone","chance":0.08}]'::jsonb, 'sound', 2) on conflict (id) do update set location_id = excluded.location_id, name = excluded.name, effects = excluded.effects, pearls = excluded.pearls, xp = excluded.xp, cooldown_seconds = excluded.cooldown_seconds, adult_only = excluded.adult_only, loot = excluded.loot, animation = excluded.animation, flavour_count = excluded.flavour_count;
insert into public.activities (id, location_id, name, effects, pearls, xp, cooldown_seconds, adult_only, loot, animation, flavour_count) values ('kairos_cowork', 'kairos_cowork', 'Write an oracle column', '{"energy":-20,"social":-5,"magic":5}'::jsonb, 25, 12, 1200, false, '[]'::jsonb, 'work', 3) on conflict (id) do update set location_id = excluded.location_id, name = excluded.name, effects = excluded.effects, pearls = excluded.pearls, xp = excluded.xp, cooldown_seconds = excluded.cooldown_seconds, adult_only = excluded.adult_only, loot = excluded.loot, animation = excluded.animation, flavour_count = excluded.flavour_count;
insert into public.activities (id, location_id, name, effects, pearls, xp, cooldown_seconds, adult_only, loot, animation, flavour_count) values ('kairos_matcha', 'kairos_cafe', 'Strawberry iced matcha', '{"nourishment":15,"joy":15,"energy":10}'::jsonb, -10, 4, 180, false, '[]'::jsonb, 'drink', 2) on conflict (id) do update set location_id = excluded.location_id, name = excluded.name, effects = excluded.effects, pearls = excluded.pearls, xp = excluded.xp, cooldown_seconds = excluded.cooldown_seconds, adult_only = excluded.adult_only, loot = excluded.loot, animation = excluded.animation, flavour_count = excluded.flavour_count;
insert into public.activities (id, location_id, name, effects, pearls, xp, cooldown_seconds, adult_only, loot, animation, flavour_count) values ('kairos_broth', 'kairos_cafe', 'Bone broth', '{"nourishment":30,"energy":5}'::jsonb, -8, 4, 180, false, '[]'::jsonb, 'eat', 1) on conflict (id) do update set location_id = excluded.location_id, name = excluded.name, effects = excluded.effects, pearls = excluded.pearls, xp = excluded.xp, cooldown_seconds = excluded.cooldown_seconds, adult_only = excluded.adult_only, loot = excluded.loot, animation = excluded.animation, flavour_count = excluded.flavour_count;
insert into public.activities (id, location_id, name, effects, pearls, xp, cooldown_seconds, adult_only, loot, animation, flavour_count) values ('kairos_bowl', 'kairos_cafe', 'Dragonfruit bowl', '{"nourishment":25,"joy":10}'::jsonb, -9, 4, 180, false, '[]'::jsonb, 'eat', 1) on conflict (id) do update set location_id = excluded.location_id, name = excluded.name, effects = excluded.effects, pearls = excluded.pearls, xp = excluded.xp, cooldown_seconds = excluded.cooldown_seconds, adult_only = excluded.adult_only, loot = excluded.loot, animation = excluded.animation, flavour_count = excluded.flavour_count;

insert into public.achievements (id, name, description) values ('first_care', 'Tender Witch', 'Complete your first care action.') on conflict (id) do update set name = excluded.name, description = excluded.description;
insert into public.achievements (id, name, description) values ('first_treasure', 'Finders Keepers', 'Discover your first treasure.') on conflict (id) do update set name = excluded.name, description = excluded.description;
insert into public.achievements (id, name, description) values ('kairos_regular', 'Kairos Regular', 'Complete five Kairos activities.') on conflict (id) do update set name = excluded.name, description = excluded.description;
insert into public.achievements (id, name, description) values ('coven_ritual', 'Coven Bound', 'Complete a shared coven event.') on conflict (id) do update set name = excluded.name, description = excluded.description;
insert into public.achievements (id, name, description) values ('fashionista', 'Fashion Familiar', 'Wear five accessories at once.') on conflict (id) do update set name = excluded.name, description = excluded.description;
insert into public.achievements (id, name, description) values ('interior_witch', 'Interior Witch', 'Place five items in your room.') on conflict (id) do update set name = excluded.name, description = excluded.description;
insert into public.achievements (id, name, description) values ('pearl_hoarder', 'Pearl Hoarder', 'Hold 300 pearls at once.') on conflict (id) do update set name = excluded.name, description = excluded.description;

insert into public.characters (id, coven_id, name, title, pronoun_subject, pronoun_object, pronoun_possessive, pronoun_plural, baby_aesthetic, is_owner_character, description, personality, look, default_equipped, starter_items) values ('rocha', '00000000-0000-4000-8000-000000000001', 'Rocha', 'Baby Merwitch', 'she', 'her', 'her', false, true, true, 'The original keeper of the seashell world. Pink hair, pearl crown, a tail that shimmers pink to aqua.', 'Playful, powerful, spoiled, sacred. Mystical but irreverent. Takes neglect personally.', '{"skin":"#f9d6c3","hairColor":"#ff8fc8","hairStyle":"long_waves","eyeColor":"#8a4fe0"}'::jsonb, '{"outfit":"outfit_babydoll_y2k","tail":"tail_pink_aqua","hat":"hat_pearl_crown","necklace":"neck_pearls","hair_acc":"hair_shell_clip"}'::jsonb, array['outfit_babydoll_y2k', 'tail_pink_aqua', 'hat_pearl_crown', 'neck_pearls', 'hair_shell_clip', 'hat_witch_pink', 'pet_seahorse', 'furn_oyster_bed', 'decor_palm_pot']::text[]) on conflict (id) do update set default_equipped = excluded.default_equipped, starter_items = excluded.starter_items, baby_aesthetic = excluded.baby_aesthetic, is_owner_character = excluded.is_owner_character;
insert into public.characters (id, coven_id, name, title, pronoun_subject, pronoun_object, pronoun_possessive, pronoun_plural, baby_aesthetic, is_owner_character, description, personality, look, default_equipped, starter_items) values ('lizz', '00000000-0000-4000-8000-000000000001', 'Lizz', 'The Lesbian Witch', 'they', 'them', 'their', true, false, false, 'Platinum short hair, shades pushed up, inked arms, all black, a black cat who also means business.', 'Androgynous, tattooed, protective, chaotic, cool, deep.', '{"skin":"#b47a52","hairColor":"#f2ece2","hairStyle":"short_undercut","eyeColor":"#c99a3c","tattoos":true}'::jsonb, '{"outfit":"outfit_leather_jacket","necklace":"neck_chain_dark","earrings":"ear_silver_hoops","hair_acc":"hair_sunglasses","companion":"pet_black_cat"}'::jsonb, array['outfit_leather_jacket', 'neck_chain_dark', 'ear_silver_hoops', 'hair_sunglasses', 'hat_beanie_black', 'pet_black_cat', 'furn_clam_chair', 'decor_moon_lantern']::text[]) on conflict (id) do update set default_equipped = excluded.default_equipped, starter_items = excluded.starter_items, baby_aesthetic = excluded.baby_aesthetic, is_owner_character = excluded.is_owner_character;
insert into public.characters (id, coven_id, name, title, pronoun_subject, pronoun_object, pronoun_possessive, pronoun_plural, baby_aesthetic, is_owner_character, description, personality, look, default_equipped, starter_items) values ('dray', '00000000-0000-4000-8000-000000000001', 'Dray', 'The Moon Witch', 'she', 'her', 'her', false, false, false, 'Long midnight curls pinned with moons and stars, tattoos, a glowing crystal ball, a violet butterfly in tow.', 'Intuitive, mysterious, dreamy, cosmic, a little unhinged.', '{"skin":"#c48c69","hairColor":"#24204f","hairStyle":"long_waves","eyeColor":"#b49bff","tattoos":true}'::jsonb, '{"outfit":"outfit_moon_robe","necklace":"neck_moonstone","earrings":"ear_star_studs","hair_acc":"hair_moon_pins","companion":"pet_butterfly"}'::jsonb, array['outfit_moon_robe', 'hat_crescent', 'neck_moonstone', 'ear_star_studs', 'hair_moon_pins', 'tail_midnight', 'pet_butterfly', 'furn_crystal_ball_table', 'decor_moon_lantern']::text[]) on conflict (id) do update set default_equipped = excluded.default_equipped, starter_items = excluded.starter_items, baby_aesthetic = excluded.baby_aesthetic, is_owner_character = excluded.is_owner_character;
insert into public.characters (id, coven_id, name, title, pronoun_subject, pronoun_object, pronoun_possessive, pronoun_plural, baby_aesthetic, is_owner_character, description, personality, look, default_equipped, starter_items) values ('cheryl', '00000000-0000-4000-8000-000000000001', 'Cheryl', 'The Practical Witch', 'she', 'her', 'her', false, false, false, 'Honey-gold curls under a big pink sun hat, shell jewellery that clinks, always has snacks.', 'Grounded, funny, brutally honest. Snacks. Solutions.', '{"skin":"#c98d5e","hairColor":"#e3a54c","hairStyle":"beach_waves","eyeColor":"#7a4a2a"}'::jsonb, '{"outfit":"outfit_coral_sarong","hat":"hat_sun_pink","necklace":"neck_shell","earrings":"ear_shell_dangles"}'::jsonb, array['outfit_coral_sarong', 'hat_sun_pink', 'hat_sun_straw', 'neck_shell', 'ear_shell_dangles', 'tail_coral_sunset', 'pet_jellyfish', 'furn_coral_lamp', 'decor_starfish_garland']::text[]) on conflict (id) do update set default_equipped = excluded.default_equipped, starter_items = excluded.starter_items, baby_aesthetic = excluded.baby_aesthetic, is_owner_character = excluded.is_owner_character;
insert into public.characters (id, coven_id, name, title, pronoun_subject, pronoun_object, pronoun_possessive, pronoun_plural, baby_aesthetic, is_owner_character, description, personality, look, default_equipped, starter_items) values ('veda', '00000000-0000-4000-8000-000000000001', 'Veda', 'The Mystic Oracle', 'she', 'her', 'her', false, false, false, 'Silver-blue waves, a crystal tiara, pale aqua and pearl, and a tiny white kitten who sees the future.', 'Spiritual, soft, otherworldly, prophetic, gentle.', '{"skin":"#f5dacb","hairColor":"#dce8f6","hairStyle":"ethereal_long","eyeColor":"#5f9fe0"}'::jsonb, '{"outfit":"outfit_mist_gown","hat":"hat_crystal_tiara","necklace":"neck_crystal","earrings":"ear_pearl_drop","companion":"pet_white_kitten"}'::jsonb, array['outfit_mist_gown', 'hat_crystal_tiara', 'neck_crystal', 'ear_pearl_drop', 'tail_lavender_moon', 'pet_white_kitten', 'furn_shell_vanity', 'decor_mushroom_lamp']::text[]) on conflict (id) do update set default_equipped = excluded.default_equipped, starter_items = excluded.starter_items, baby_aesthetic = excluded.baby_aesthetic, is_owner_character = excluded.is_owner_character;

-- Initialise each witch once (stats, starter wardrobe, room). Never resets an existing witch.
select game.init_character('rocha') where not exists (select 1 from public.character_stats where character_id = 'rocha');
select game.init_character('lizz') where not exists (select 1 from public.character_stats where character_id = 'lizz');
select game.init_character('dray') where not exists (select 1 from public.character_stats where character_id = 'dray');
select game.init_character('cheryl') where not exists (select 1 from public.character_stats where character_id = 'cheryl');
select game.init_character('veda') where not exists (select 1 from public.character_stats where character_id = 'veda');

commit;
