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
