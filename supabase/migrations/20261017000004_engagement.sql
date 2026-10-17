-- Engagement layer: gifts, daily oracle, moon ceremonies, weekly coven goals, seasonal items,
-- push notification queue, care nudges and the owner's activity view.
-- Written without row deletes: things are marked (disabled_at, qty 0) rather than removed.

-- ───────────────────────── schema ─────────────────────────

alter table public.items add column if not exists season int[];

-- Inventory may now hold qty 0 (an item given away); state hides those rows.
alter table public.inventory drop constraint if exists inventory_qty_check;
alter table public.inventory add constraint inventory_qty_check check (qty >= 0);

alter table public.shared_events drop constraint if exists shared_events_kind_check;
alter table public.shared_events add constraint shared_events_kind_check
  check (kind in ('moon_ritual', 'sound_bath', 'full_moon', 'new_moon'));

create table if not exists public.gifts (
  id bigint generated always as identity primary key,
  coven_id uuid not null references public.covens (id) on delete cascade,
  from_char text not null references public.characters (id) on delete cascade,
  to_char text not null references public.characters (id) on delete cascade,
  kind text not null check (kind in ('treat', 'pearls', 'item')),
  ref text,
  pearls int check (pearls is null or pearls between 1 and 100),
  note text check (note is null or char_length(note) <= 140),
  created_at timestamptz not null default now(),
  opened_at timestamptz,
  check (from_char <> to_char)
);
create index if not exists gifts_to_idx on public.gifts (to_char, opened_at);
create index if not exists gifts_from_idx on public.gifts (from_char, created_at desc);

create table if not exists public.daily_oracle (
  character_id text not null references public.characters (id) on delete cascade,
  day date not null,
  card_id text not null,
  drawn_at timestamptz not null default now(),
  primary key (character_id, day)
);

create table if not exists public.coven_goals (
  coven_id uuid not null references public.covens (id) on delete cascade,
  week_start date not null,
  kind text not null,
  target int not null check (target > 0),
  progress int not null default 0,
  completed_at timestamptz,
  primary key (coven_id, week_start)
);

create table if not exists public.push_subscriptions (
  id bigint generated always as identity primary key,
  character_id text not null references public.characters (id) on delete cascade,
  endpoint text not null unique check (endpoint ~ '^https://'),
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  disabled_at timestamptz
);

create table if not exists public.notify_queue (
  id bigint generated always as identity primary key,
  character_id text not null references public.characters (id) on delete cascade,
  kind text not null,
  title text not null,
  body text not null,
  url text not null default '/play',
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  attempts int not null default 0
);
create index if not exists notify_queue_pending_idx on public.notify_queue (sent_at) where sent_at is null;

-- One-off markers (moon announcements, nudges) so cron jobs never repeat themselves.
create table if not exists game.markers (
  key text primary key,
  created_at timestamptz not null default now()
);

-- Server-only settings (push function URL and shared secret). No grants to clients.
create table if not exists game.private_config (
  key text primary key,
  value text not null
);

-- ───────────────────────── helpers ─────────────────────────

-- Fraction of the synodic month: 0 new, 0.5 full. Reference new moon 2000-01-06 18:14 UTC.
create or replace function game.moon_phase(p_at timestamptz default now()) returns numeric
language sql immutable as $$
  select mod((extract(epoch from (p_at - timestamptz '2000-01-06 18:14:00+00')) / 86400.0 / 29.530588853)::numeric, 1)
$$;

create or replace function game.moon_window(p_at timestamptz default now()) returns text
language sql immutable as $$
  select case
    when abs(game.moon_phase(p_at) - 0.5) <= 1.25 / 29.530588853 then 'full'
    when game.moon_phase(p_at) <= 1.25 / 29.530588853 or game.moon_phase(p_at) >= 1 - 1.25 / 29.530588853 then 'new'
    else null end
$$;

create or replace function game.local_month() returns int
language sql stable set search_path = public, game, pg_temp as $$
  select extract(month from (now() at time zone coalesce(game.cfg('day_timezone') #>> '{}', 'UTC')))::int
$$;

create or replace function game.in_season(p_season int[]) returns boolean
language sql stable set search_path = public, game, pg_temp as $$
  select p_season is null or game.local_month() = any (p_season)
$$;

create or replace function game.has_push(p_char text) returns boolean
language sql stable set search_path = public, game, pg_temp as $$
  select exists (select 1 from public.push_subscriptions where character_id = p_char and disabled_at is null)
$$;

-- Queue a notification for one witch (only if they turned alerts on).
create or replace function game.notify(p_char text, p_kind text, p_title text, p_body text, p_url text) returns void
language plpgsql set search_path = public, game, pg_temp as $$
begin
  if game.has_push(p_char) then
    insert into public.notify_queue (character_id, kind, title, body, url)
    values (p_char, p_kind, left(p_title, 80), left(p_body, 200), coalesce(p_url, '/play'));
  end if;
end $$;

create or replace function game.notify_coven(p_coven uuid, p_except text, p_kind text, p_title text, p_body text, p_url text) returns void
language plpgsql set search_path = public, game, pg_temp as $$
declare c record;
begin
  for c in select id from public.characters where coven_id = p_coven and owner_user_id is not null and id is distinct from p_except loop
    perform game.notify(c.id, p_kind, p_title, p_body, p_url);
  end loop;
end $$;

-- ───────────────────────── coven goals ─────────────────────────

create or replace function game.current_goal(p_coven uuid) returns public.coven_goals
language plpgsql set search_path = public, game, pg_temp as $$
declare g public.coven_goals; wk date := date_trunc('week', game.today())::date; defs jsonb := game.cfg('coven_goals'); def jsonb;
begin
  select * into g from public.coven_goals where coven_id = p_coven and week_start = wk;
  if found then return g; end if;
  def := defs -> (mod(extract(week from wk)::int, jsonb_array_length(defs)));
  insert into public.coven_goals (coven_id, week_start, kind, target)
  values (p_coven, wk, def ->> 'kind', (def ->> 'target')::int)
  on conflict (coven_id, week_start) do nothing;
  select * into g from public.coven_goals where coven_id = p_coven and week_start = wk;
  return g;
end $$;

create or replace function game.bump_goal(p_coven uuid, p_kind text, p_n int) returns void
language plpgsql set search_path = public, game, pg_temp as $$
declare g public.coven_goals; reward jsonb := game.cfg('coven_goal_reward'); def jsonb; c record;
begin
  g := game.current_goal(p_coven);
  if g.kind <> p_kind or g.completed_at is not null then return; end if;
  update public.coven_goals set progress = progress + p_n
  where coven_id = p_coven and week_start = g.week_start returning * into g;
  if g.progress >= g.target then
    update public.coven_goals set completed_at = now() where coven_id = p_coven and week_start = g.week_start;
    select d into def from jsonb_array_elements(game.cfg('coven_goals')) d where d ->> 'kind' = g.kind;
    for c in select id from public.characters where coven_id = p_coven and owner_user_id is not null loop
      perform game.credit(c.id, (reward ->> 'pearls')::int, 'coven_goal', g.week_start::text);
      perform game.grant_item(c.id, reward ->> 'itemId', 1);
    end loop;
    perform game.system_message(p_coven, 'The coven completed ' || (def ->> 'name') || '. Pearls and a Coven Charm for everyone. Nobody is surprised.');
    perform game.notify_coven(p_coven, null, 'goal', 'Coven goal complete', (def ->> 'name') || ' is done. Your Coven Charm is waiting.', '/play');
  end if;
end $$;

-- Goals fill from what already happens in the game, via triggers (no engine rewrites needed).
create or replace function game.on_activity_logged() returns trigger
language plpgsql security definer set search_path = public, game, pg_temp as $$
declare coven uuid := game.coven_of(new.character_id); world text;
begin
  if new.activity_id in ('cafe_matcha', 'kairos_matcha') then perform game.bump_goal(coven, 'matcha', 1); end if;
  select l.world into world from public.activities a join public.locations l on l.id = a.location_id where a.id = new.activity_id;
  if world = 'kairos' then perform game.bump_goal(coven, 'kairos', 1); end if;
  return new;
end $$;
drop trigger if exists activity_goal on public.activity_log;
create trigger activity_goal after insert on public.activity_log for each row execute function game.on_activity_logged();

create or replace function game.on_event_completed() returns trigger
language plpgsql security definer set search_path = public, game, pg_temp as $$
begin
  if new.status = 'complete' and old.status is distinct from 'complete' then
    perform game.bump_goal(new.coven_id, 'rituals', 1);
  end if;
  return new;
end $$;
drop trigger if exists event_goal on public.shared_events;
create trigger event_goal after update on public.shared_events for each row execute function game.on_event_completed();

create or replace function game.on_event_started() returns trigger
language plpgsql security definer set search_path = public, game, pg_temp as $$
declare host text; def jsonb := game.cfg('shared_events') -> new.kind;
begin
  select name into host from public.characters where id = new.host_character_id;
  perform game.notify_coven(new.coven_id, new.host_character_id, 'event',
    def ->> 'name', host || ' is gathering the coven. Join on the ' || case when new.location_id = 'kairos_sound' then 'Sound Sanctuary' else 'Moon Deck' end || '.',
    '/play?go=' || new.location_id);
  return new;
end $$;
drop trigger if exists event_notify on public.shared_events;
create trigger event_notify after insert on public.shared_events for each row execute function game.on_event_started();

-- ───────────────────────── achievements (extended) ─────────────────────────

create or replace function game.check_achievements(p_char text) returns text[]
language plpgsql set search_path = public, game, pg_temp as $$
declare earned text[] := '{}'; cand text; ok boolean;
begin
  foreach cand in array array['first_care','first_treasure','kairos_regular','coven_ritual','fashionista','interior_witch',
                              'pearl_hoarder','generous_witch','oracle_devotee','moon_child'] loop
    continue when exists (select 1 from public.character_achievements where character_id = p_char and achievement_id = cand);
    continue when not exists (select 1 from public.achievements where id = cand);
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
      when 'generous_witch' then (select count(*) from public.gifts where from_char = p_char) >= 5
      when 'oracle_devotee' then (select count(*) from public.daily_oracle where character_id = p_char) >= 7
      when 'moon_child' then exists (select 1 from public.shared_event_participants p join public.shared_events e on e.id = p.event_id
                                     where p.character_id = p_char and e.status = 'complete' and e.kind in ('full_moon', 'new_moon'))
      else false end;
    if ok then
      insert into public.character_achievements (character_id, achievement_id) values (p_char, cand);
      earned := earned || cand;
    end if;
  end loop;
  return earned;
end $$;

-- ───────────────────────── state (hide given-away items, add extras) ─────────────────────────

create or replace function game.state(p_char text) returns jsonb
language sql stable set search_path = public, game, pg_temp as $$
  select game.public_state(p_char) || jsonb_build_object(
    'pearls', s.pearls, 'xp', s.xp,
    'inventory', coalesce((select jsonb_agg(jsonb_build_object('item_id', i.item_id, 'qty', i.qty) order by i.acquired_at, i.item_id)
                           from public.inventory i where i.character_id = p_char and i.qty > 0), '[]'::jsonb),
    'achievements', coalesce((select jsonb_agg(a.achievement_id order by a.earned_at) from public.character_achievements a
                              where a.character_id = p_char), '[]'::jsonb),
    'daily_available', not exists (select 1 from public.daily_claims d where d.character_id = p_char and d.day = game.today()),
    'oracle_today', (select o.card_id from public.daily_oracle o where o.character_id = p_char and o.day = game.today()),
    'unopened_gifts', (select count(*) from public.gifts g where g.to_char = p_char and g.opened_at is null),
    'push_enabled', game.has_push(p_char),
    'moon', jsonb_build_object('phase', round(game.moon_phase(), 4), 'window', game.moon_window()),
    'month', game.local_month(),
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

-- ───────────────────────── seasonal shop & daily gift ─────────────────────────

create or replace function public.buy_item(p_item_id text, p_key text) returns jsonb
language plpgsql security definer set search_path = public, game, pg_temp as $$
declare v text := game.require_character(); it public.items; prior jsonb; r jsonb; ach text[];
begin
  select result into prior from public.action_receipts where character_id = v and key = p_key;
  if found then return prior || jsonb_build_object('replayed', true, 'state', game.state(v)); end if;
  perform 1 from public.character_stats where character_id = v for update;
  select * into it from public.items where id = p_item_id and active;
  if not found or it.price is null then perform game.fail('not_for_sale', 'That treasure cannot be bought. It must be found.'); end if;
  if not game.in_season(it.season) then perform game.fail('out_of_season', 'That one only appears in its season. Check back then.'); end if;
  if it.slot is not null and exists (select 1 from public.inventory where character_id = v and item_id = it.id and qty > 0) then
    perform game.fail('already_owned', 'Already in your wardrobe.');
  end if;
  perform game.credit(v, -it.price, 'purchase', it.id);
  perform game.grant_item(v, it.id, 1);
  ach := game.check_achievements(v);
  r := jsonb_build_object('ok', true, 'item_id', it.id, 'pearls_delta', -it.price, 'achievements', to_jsonb(ach));
  insert into public.action_receipts (character_id, key, result) values (v, p_key, r);
  return r || jsonb_build_object('state', game.state(v));
end $$;

create or replace function public.claim_daily() returns jsonb
language plpgsql security definer set search_path = public, game, pg_temp as $$
declare
  v text := game.require_character();
  pool jsonb := game.cfg('daily_loot');
  seasonal text[];
  pick text;
  amount int := (game.cfg('daily_pearls'))::int;
  ach text[];
begin
  perform 1 from public.character_stats where character_id = v for update;
  insert into public.daily_claims (character_id, day) values (v, game.today()) on conflict do nothing;
  if not found then
    return jsonb_build_object('ok', false, 'already_claimed', true, 'state', game.state(v));
  end if;
  perform game.credit(v, amount, 'daily', game.today()::text);
  select array_agg(id) into seasonal from public.items where season is not null and game.in_season(season) and placeable;
  if seasonal is not null and random() < 0.3 then
    pick := seasonal[1 + floor(random() * array_length(seasonal, 1))::int];
  else
    pick := pool ->> floor(random() * jsonb_array_length(pool))::int;
  end if;
  perform game.grant_item(v, pick, 1);
  ach := game.check_achievements(v);
  return jsonb_build_object('ok', true, 'pearls_delta', amount, 'loot', jsonb_build_array(pick),
                            'achievements', to_jsonb(ach), 'state', game.state(v));
end $$;

-- ───────────────────────── moon ceremonies ─────────────────────────

create or replace function public.start_event(p_kind text) returns jsonb
language plpgsql security definer set search_path = public, game, pg_temp as $$
declare v text := game.require_character(); coven uuid := game.coven_of(v); def jsonb := game.cfg('shared_events') -> p_kind;
        ev public.shared_events; nm text; days numeric;
begin
  if def is null then perform game.fail('bad_event', 'Unknown coven event.'); end if;
  if def ? 'moonPhase' and game.moon_window() is distinct from (def ->> 'moonPhase') then
    days := mod((case when def ->> 'moonPhase' = 'full' then 0.5 else 1.0 end) - game.moon_phase() + 1, 1) * 29.530588853;
    perform game.fail('not_moon_time', 'The ' || (def ->> 'moonPhase') || ' moon arrives in about ' || ceil(days) || ' days.');
  end if;
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

-- ───────────────────────── gifts ─────────────────────────

create or replace function public.send_gift(p_to text, p_kind text, p_ref text, p_pearls int, p_note text, p_key text) returns jsonb
language plpgsql security definer set search_path = public, game, pg_temp as $$
declare
  v text := game.require_character();
  coven uuid := game.coven_of(v);
  prior jsonb;
  treat jsonb;
  it public.items;
  owned int;
  placed int;
  sent_today int;
  from_name text;
  to_name text;
  what text;
  g public.gifts;
  ach text[];
  r jsonb;
  note text := nullif(btrim(regexp_replace(coalesce(p_note, ''), '[[:cntrl:]]', ' ', 'g')), '');
begin
  select result into prior from public.action_receipts where character_id = v and key = p_key;
  if found then return prior || jsonb_build_object('replayed', true, 'state', game.state(v)); end if;
  if p_to = v then perform game.fail('self_gift', 'Gifts are for other witches. (Self-care is a separate department.)'); end if;
  if game.coven_of(p_to) is distinct from coven or not exists (select 1 from public.characters where id = p_to and owner_user_id is not null) then
    perform game.fail('not_found', 'That witch has not joined the coven yet.');
  end if;
  if char_length(coalesce(note, '')) > 140 then perform game.fail('too_long', 'Keep the note under 140 characters.'); end if;
  perform 1 from public.character_stats where character_id = v for update;
  select count(*) into sent_today from public.gifts where from_char = v and created_at > now() - interval '1 day';
  if sent_today >= (game.cfg('gift_daily_limit'))::int then
    perform game.fail('gift_limit', 'You have been very generous today. More gifts tomorrow.');
  end if;
  select name into from_name from public.characters where id = v;
  select name into to_name from public.characters where id = p_to;

  if p_kind = 'treat' then
    select t into treat from jsonb_array_elements(game.cfg('gift_treats')) t where t ->> 'id' = p_ref;
    if treat is null then perform game.fail('bad_gift', 'Unknown treat.'); end if;
    perform game.credit(v, -(treat ->> 'cost')::int, 'gift', p_ref);
    what := lower(treat ->> 'name');
  elsif p_kind = 'pearls' then
    if p_pearls is null or p_pearls not between 1 and 100 then perform game.fail('bad_gift', 'Send between 1 and 100 pearls.'); end if;
    perform game.credit(v, -p_pearls, 'gift', p_to);
    what := p_pearls || ' pearls';
  elsif p_kind = 'item' then
    select * into it from public.items where id = p_ref;
    if not found or it.slot is not null then perform game.fail('bad_gift', 'Only treasures and decor can be gifted.'); end if;
    select coalesce(qty, 0) into owned from public.inventory where character_id = v and item_id = p_ref for update;
    select count(*) into placed from public.room_decorations where character_id = v and item_id = p_ref;
    if coalesce(owned, 0) - placed < 1 then perform game.fail('none_left', 'Take it out of your room first, or find another.'); end if;
    update public.inventory set qty = qty - 1 where character_id = v and item_id = p_ref;
    what := it.name;
  else
    perform game.fail('bad_gift', 'Unknown gift.');
  end if;

  insert into public.gifts (coven_id, from_char, to_char, kind, ref, pearls, note)
  values (coven, v, p_to, p_kind, case when p_kind = 'pearls' then null else p_ref end, case when p_kind = 'pearls' then p_pearls end, note)
  returning * into g;
  perform game.bump_goal(coven, 'gifts', 1);
  perform game.system_message(coven, from_name || ' sent ' || to_name || ' a gift: ' || what || '.');
  perform game.notify(p_to, 'gift', from_name || ' sent you a gift', coalesce(note, 'Something is waiting in your shell.'), '/play?go=gifts');
  ach := game.check_achievements(v);
  r := jsonb_build_object('ok', true, 'gift_id', g.id, 'achievements', to_jsonb(ach));
  insert into public.action_receipts (character_id, key, result) values (v, p_key, r);
  return r || jsonb_build_object('state', game.state(v));
end $$;

create or replace function public.open_gift(p_id bigint) returns jsonb
language plpgsql security definer set search_path = public, game, pg_temp as $$
declare v text := game.require_character(); g public.gifts; treat jsonb; ach text[];
begin
  select * into g from public.gifts where id = p_id and to_char = v for update;
  if not found then perform game.fail('not_found', 'That gift is not addressed to you.'); end if;
  if g.opened_at is not null then
    return jsonb_build_object('ok', true, 'already_opened', true, 'gift', to_jsonb(g), 'state', game.state(v));
  end if;
  perform game.apply_decay(v);
  if g.kind = 'treat' then
    select t into treat from jsonb_array_elements(game.cfg('gift_treats')) t where t ->> 'id' = g.ref;
    perform game.apply_effects(v, coalesce(treat -> 'effects', '{}'::jsonb));
  elsif g.kind = 'pearls' then
    perform game.credit(v, g.pearls, 'gift_received', g.id::text);
  elsif g.kind = 'item' then
    perform game.grant_item(v, g.ref, 1);
  end if;
  perform game.apply_effects(v, jsonb_build_object('social', 10));
  update public.gifts set opened_at = now() where id = g.id returning * into g;
  ach := game.check_achievements(v);
  return jsonb_build_object('ok', true, 'gift', to_jsonb(g), 'effects', treat -> 'effects', 'achievements', to_jsonb(ach), 'state', game.state(v));
end $$;

-- ───────────────────────── daily oracle ─────────────────────────

create or replace function public.draw_oracle() returns jsonb
language plpgsql security definer set search_path = public, game, pg_temp as $$
declare v text := game.require_character(); deck jsonb := game.cfg('oracle_cards'); card text; existing text; ach text[];
begin
  perform 1 from public.character_stats where character_id = v for update;
  select card_id into existing from public.daily_oracle where character_id = v and day = game.today();
  if existing is not null then
    return jsonb_build_object('ok', true, 'card_id', existing, 'new', false, 'state', game.state(v));
  end if;
  card := deck ->> floor(random() * jsonb_array_length(deck))::int;
  insert into public.daily_oracle (character_id, day, card_id) values (v, game.today(), card);
  perform game.apply_decay(v);
  perform game.apply_effects(v, '{"magic": 8, "joy": 4}'::jsonb);
  ach := game.check_achievements(v);
  return jsonb_build_object('ok', true, 'card_id', card, 'new', true, 'achievements', to_jsonb(ach), 'state', game.state(v));
end $$;

-- ───────────────────────── coven goal + invites + push ─────────────────────────

create or replace function public.get_coven_goal() returns jsonb
language plpgsql security definer set search_path = public, game, pg_temp as $$
declare v text := game.require_character(); g public.coven_goals; def jsonb;
begin
  g := game.current_goal(game.coven_of(v));
  select d into def from jsonb_array_elements(game.cfg('coven_goals')) d where d ->> 'kind' = g.kind;
  return to_jsonb(g) || jsonb_build_object('name', def ->> 'name', 'description', def ->> 'description',
    'ends_at', (g.week_start + 7)::text, 'reward', game.cfg('coven_goal_reward'));
end $$;

create or replace function public.invite_witch(p_to text, p_location_id text) returns void
language plpgsql security definer set search_path = public, game, pg_temp as $$
declare v text := game.require_character(); nm text; loc text;
begin
  if game.coven_of(p_to) is distinct from game.coven_of(v) or p_to = v then perform game.fail('not_found', 'No such witch in your coven.'); end if;
  select name into loc from public.locations where id = p_location_id;
  if loc is null then perform game.fail('unknown_location', 'That place is not on the map.'); end if;
  -- One invite notification per pair every 2 minutes.
  if exists (select 1 from public.notify_queue where character_id = p_to and kind = 'invite:' || v and created_at > now() - interval '2 minutes') then
    return;
  end if;
  select name into nm from public.characters where id = v;
  perform game.notify(p_to, 'invite:' || v, nm || ' is calling you', 'Come to ' || loc || '.', '/play?go=' || p_location_id);
end $$;

create or replace function public.save_push_subscription(p_endpoint text, p_p256dh text, p_auth text) returns void
language plpgsql security definer set search_path = public, game, pg_temp as $$
declare v text := game.require_character();
begin
  if p_endpoint !~ '^https://' or char_length(p_endpoint) > 1000 or char_length(p_p256dh) > 200 or char_length(p_auth) > 100 then
    perform game.fail('bad_subscription', 'That notification subscription looks wrong.');
  end if;
  insert into public.push_subscriptions (character_id, endpoint, p256dh, auth)
  values (v, p_endpoint, p_p256dh, p_auth)
  on conflict (endpoint) do update set character_id = excluded.character_id, p256dh = excluded.p256dh,
    auth = excluded.auth, disabled_at = null;
end $$;

create or replace function public.remove_push_subscription(p_endpoint text) returns void
language plpgsql security definer set search_path = public, game, pg_temp as $$
declare v text := game.require_character();
begin
  update public.push_subscriptions set disabled_at = now() where endpoint = p_endpoint and character_id = v;
end $$;

-- ───────────────────────── owner activity view ─────────────────────────

create or replace function public.admin_activity_summary() returns jsonb
language plpgsql security definer set search_path = public, game, pg_temp as $$
declare coven uuid := game.admin_coven();
begin
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', c.id, 'name', c.name, 'claimed', c.owner_user_id is not null,
      'last_seen', st.last_seen_at,
      'actions_today', (select count(*) from public.activity_log l where l.character_id = c.id and l.created_at > now() - interval '1 day'),
      'actions_7d', (select count(*) from public.activity_log l where l.character_id = c.id and l.created_at > now() - interval '7 days'),
      'days_active_7d', (select count(distinct (l.created_at at time zone 'Asia/Makassar')::date) from public.activity_log l
                         where l.character_id = c.id and l.created_at > now() - interval '7 days'),
      'chats_7d', (select count(*) from public.chat_messages m where m.character_id = c.id and m.created_at > now() - interval '7 days'),
      'gifts_sent_7d', (select count(*) from public.gifts g where g.from_char = c.id and g.created_at > now() - interval '7 days'),
      'alerts_on', game.has_push(c.id)
    ) order by c.created_at)
    from public.characters c left join public.character_status st on st.character_id = c.id
    where c.coven_id = coven), '[]'::jsonb);
end $$;

-- ───────────────────────── cron work ─────────────────────────

-- Hourly: gentle care nudges (max one per witch per 20h, 10:00-20:00 coven time) and moon announcements.
create or replace function game.hourly_tick() returns void
language plpgsql security definer set search_path = public, game, pg_temp as $$
declare c record; hr int := extract(hour from (now() at time zone coalesce(game.cfg('day_timezone') #>> '{}', 'UTC')))::int;
        s public.character_stats; mood text; msg text; win text := game.moon_window(); cycle int; cov record;
begin
  if hr between 10 and 20 then
    for c in select ch.* from public.characters ch where ch.owner_user_id is not null and game.has_push(ch.id) loop
      continue when exists (select 1 from game.markers where key = 'nudge:' || c.id || ':' || to_char(now(), 'YYYY-MM-DD'));
      continue when exists (select 1 from public.notify_queue q where q.character_id = c.id and q.kind = 'nudge' and q.created_at > now() - interval '20 hours');
      perform game.apply_decay(c.id);
      select * into s from public.character_stats where character_id = c.id;
      mood := game.mood(s.nourishment, s.energy, s.joy, s.magic, s.social);
      msg := case mood
        when 'offended' then c.name || ' has retreated into ' || c.pronoun_possessive || ' shell. Apologies accepted in matcha.'
        when 'hungry' then c.name || '''s tummy is rumbling. A strawberry iced matcha would fix everything.'
        when 'sleepy' then c.name || ' is yawning dramatically. The oyster bed is calling.'
        else null end;
      if msg is not null then
        perform game.notify(c.id, 'nudge', 'Your witch misses you', msg, '/play');
        insert into game.markers (key) values ('nudge:' || c.id || ':' || to_char(now(), 'YYYY-MM-DD')) on conflict do nothing;
      end if;
    end loop;
  end if;
  if win is not null and hr between 9 and 21 then
    cycle := floor(extract(epoch from (now() - timestamptz '2000-01-06 18:14:00+00')) / 86400.0 / 29.530588853)::int;
    for cov in select id from public.covens loop
      if not exists (select 1 from game.markers where key = 'moon:' || cov.id || ':' || win || ':' || cycle) then
        insert into game.markers (key) values ('moon:' || cov.id || ':' || win || ':' || cycle);
        perform game.system_message(cov.id, case when win = 'full' then 'The full moon is up. The Full Moon Ceremony is open on the Moon Deck.'
                                                 else 'New moon tonight. Gather on the Moon Deck to set intentions.' end);
        perform game.notify_coven(cov.id, null, 'moon', case when win = 'full' then 'Full moon tonight' else 'New moon tonight' end,
          case when win = 'full' then 'The Full Moon Ceremony is open. Gather the coven on the Moon Deck.'
               else 'New Moon Intentions are open on the Moon Deck.' end, '/play?go=moon_deck');
      end if;
    end loop;
  end if;
end $$;

-- Every minute: if notifications are waiting, wake the send-push edge function.
create or replace function game.dispatch_push() returns void
language plpgsql security definer set search_path = public, game, extensions, pg_temp as $$
declare url text; secret text;
begin
  if not exists (select 1 from public.notify_queue where sent_at is null and attempts < 3) then return; end if;
  if to_regproc('net.http_post') is null then return; end if;
  select value into url from game.private_config where key = 'push_url';
  select value into secret from game.private_config where key = 'push_secret';
  if url is null or secret is null then return; end if;
  perform net.http_post(url := url, body := '{}'::jsonb,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-push-secret', secret));
end $$;

-- ───────────────────────── security ─────────────────────────

alter table public.gifts enable row level security;
alter table public.daily_oracle enable row level security;
alter table public.coven_goals enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.notify_queue enable row level security;
revoke all on public.gifts, public.daily_oracle, public.coven_goals, public.push_subscriptions, public.notify_queue from anon, authenticated;
grant select on public.gifts, public.daily_oracle, public.coven_goals to authenticated;
revoke all on game.markers, game.private_config from public, anon, authenticated;

drop policy if exists "own gifts" on public.gifts;
create policy "own gifts" on public.gifts for select to authenticated
  using (game.owns_character(to_char) or game.owns_character(from_char));
drop policy if exists "own oracle" on public.daily_oracle;
create policy "own oracle" on public.daily_oracle for select to authenticated using (game.owns_character(character_id));
drop policy if exists "coven goals" on public.coven_goals;
create policy "coven goals" on public.coven_goals for select to authenticated using (game.is_member(coven_id));

revoke execute on all functions in schema game from public, anon, authenticated;
grant execute on function game.is_member(uuid), game.is_admin(uuid), game.can_see_character(text), game.owns_character(text) to authenticated;
revoke execute on function public.send_gift(text, text, text, int, text, text), public.open_gift(bigint), public.draw_oracle(),
  public.get_coven_goal(), public.invite_witch(text, text), public.save_push_subscription(text, text, text),
  public.remove_push_subscription(text), public.admin_activity_summary(), public.buy_item(text, text),
  public.claim_daily(), public.start_event(text) from public, anon;
grant execute on function public.send_gift(text, text, text, int, text, text), public.open_gift(bigint), public.draw_oracle(),
  public.get_coven_goal(), public.invite_witch(text, text), public.save_push_subscription(text, text, text),
  public.remove_push_subscription(text), public.admin_activity_summary(), public.buy_item(text, text),
  public.claim_daily(), public.start_event(text) to authenticated;

do $$
declare t text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach t in array array['gifts', 'coven_goals'] loop
      if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
        execute format('alter publication supabase_realtime add table public.%I', t);
      end if;
    end loop;
  end if;
end $$;

-- Schedules (Supabase has pg_cron; plain test databases skip this).
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron;
    perform cron.schedule('pocket-coven-push', '* * * * *', 'select game.dispatch_push()');
    perform cron.schedule('pocket-coven-hourly', '7 * * * *', 'select game.hourly_tick()');
  end if;
end $$;
