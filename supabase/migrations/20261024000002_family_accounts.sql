-- Family accounts: one login can own more than one witch (a parent and her child).
-- A family invite carries extra characters in `bundle`; claiming it claims them all.
-- The player picks which of her witches is active; every action runs as that witch.

alter table public.characters drop constraint if exists characters_owner_user_id_key;
create index if not exists characters_owner_user_id_idx on public.characters (owner_user_id);

alter table public.invitations add column if not exists bundle text[] not null default '{}';

create table if not exists public.active_character (
  user_id uuid primary key references auth.users (id) on delete cascade,
  character_id text not null references public.characters (id) on delete cascade,
  updated_at timestamptz not null default now()
);
alter table public.active_character enable row level security;
revoke all on public.active_character from anon, authenticated;

create or replace function game.require_character() returns text
language plpgsql set search_path = public, game, pg_temp as $$
declare v text;
begin
  if auth.uid() is null then
    perform game.fail('not_signed_in', 'Sign in to enter the coven.');
  end if;
  select c.id into v from public.active_character a join public.characters c on c.id = a.character_id
  where a.user_id = auth.uid() and c.owner_user_id = auth.uid();
  if v is null then
    select id into v from public.characters where owner_user_id = auth.uid() order by claimed_at nulls last, id limit 1;
  end if;
  if v is null then
    perform game.fail('no_character', 'You have not claimed a witch yet. Open your invitation link.');
  end if;
  return v;
end $$;

create or replace function public.peek_invite(p_token text) returns jsonb
language plpgsql stable security definer set search_path = public, game, extensions, pg_temp as $$
declare inv public.invitations; c public.characters; bundle_taken boolean;
begin
  select * into inv from public.invitations where token_hash = encode(extensions.digest(coalesce(p_token, ''), 'sha256'), 'hex');
  if not found then return jsonb_build_object('valid', false, 'reason', 'not_found'); end if;
  select * into c from public.characters where id = inv.character_id;
  bundle_taken := exists (select 1 from public.characters b where b.id = any(inv.bundle) and b.owner_user_id is not null);
  return jsonb_build_object(
    'valid', inv.revoked_at is null and inv.claimed_at is null and inv.expires_at > now() and c.owner_user_id is null and not bundle_taken,
    'reason', case when inv.revoked_at is not null then 'revoked'
                   when inv.claimed_at is not null or c.owner_user_id is not null or bundle_taken then 'claimed'
                   when inv.expires_at <= now() then 'expired' else null end,
    'character_id', c.id, 'name', c.name, 'title', c.title, 'look', c.look, 'equipment', c.default_equipped,
    'pronouns', jsonb_build_object('subject', c.pronoun_subject, 'object', c.pronoun_object,
                                   'possessive', c.pronoun_possessive, 'plural', c.pronoun_plural),
    'bundle', coalesce((select jsonb_agg(jsonb_build_object('character_id', b.id, 'name', b.name, 'title', b.title,
                                                            'look', b.look, 'equipment', b.default_equipped) order by b.id)
                        from public.characters b where b.id = any(inv.bundle)), '[]'::jsonb));
end $$;

create or replace function public.claim_invite(p_token text) returns jsonb
language plpgsql security definer set search_path = public, game, extensions, pg_temp as $$
declare inv public.invitations; c public.characters; main public.characters; existing text; uid uuid := auth.uid(); cid text;
begin
  if uid is null then perform game.fail('not_signed_in', 'Sign in first, then open your invitation again.'); end if;
  select * into inv from public.invitations
  where token_hash = encode(extensions.digest(coalesce(p_token, ''), 'sha256'), 'hex') for update;
  if not found then perform game.fail('invite_invalid', 'That invitation does not exist.'); end if;

  select id into existing from public.characters where owner_user_id = uid limit 1;
  if existing is not null then
    if exists (select 1 from public.characters where id = inv.character_id and owner_user_id = uid) then
      return game.state(inv.character_id);
    end if;
    perform game.fail('already_has_character', 'You already have a witch. One witch per account.');
  end if;
  if inv.revoked_at is not null then perform game.fail('invite_revoked', 'That invitation was revoked. Ask the coven owner for a new one.'); end if;
  if inv.claimed_at is not null then perform game.fail('invite_used', 'That invitation has already been used.'); end if;
  if inv.expires_at <= now() then perform game.fail('invite_expired', 'That invitation has expired. Ask the coven owner for a new one.'); end if;

  select * into main from public.characters where id = inv.character_id;
  foreach cid in array array[inv.character_id] || inv.bundle loop
    select * into c from public.characters where id = cid for update;
    if not found or c.coven_id <> main.coven_id then perform game.fail('invite_invalid', 'That invitation does not exist.'); end if;
    if c.owner_user_id is not null then perform game.fail('character_taken', c.name || ' has already been claimed.'); end if;
    update public.characters set owner_user_id = uid, claimed_at = now() where id = c.id;
    perform game.touch_status(c.id, 'palace', null);
    perform game.system_message(c.coven_id, c.name || ' has joined the coven. The shell is a little more sparkly now.');
  end loop;

  insert into public.profiles (id, display_name) values (uid, main.name) on conflict (id) do nothing;
  insert into public.coven_members (coven_id, user_id, role)
  values (main.coven_id, uid, case when main.is_owner_character then 'owner' else 'member' end)
  on conflict (coven_id, user_id) do update set role = excluded.role;
  if main.is_owner_character then
    update public.covens set owner_user_id = uid where id = main.coven_id;
  end if;
  insert into public.active_character (user_id, character_id) values (uid, main.id)
  on conflict (user_id) do update set character_id = excluded.character_id, updated_at = now();
  update public.invitations set claimed_at = now(), claimed_by = uid where id = inv.id;
  return game.state(main.id);
end $$;

-- Switch which of your witches you are playing.
create or replace function public.switch_character(p_char text) returns jsonb
language plpgsql security definer set search_path = public, game, pg_temp as $$
declare uid uuid := auth.uid();
begin
  if uid is null then perform game.fail('not_signed_in', 'Sign in to enter the coven.'); end if;
  if not exists (select 1 from public.characters where id = p_char and owner_user_id = uid) then
    perform game.fail('not_yours', 'That is not one of your witches.');
  end if;
  insert into public.active_character (user_id, character_id) values (uid, p_char)
  on conflict (user_id) do update set character_id = excluded.character_id, updated_at = now();
  perform game.touch_status(p_char, coalesce((select location_id from public.character_status where character_id = p_char), 'palace'), null);
  return game.state(p_char);
end $$;

-- Private state now lists the family (every witch this login owns) so the app can offer a switch.
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
    'coven_id', game.coven_of(p_char),
    'family', coalesce((select jsonb_agg(jsonb_build_object('id', f.id, 'name', f.name, 'title', f.title) order by f.claimed_at, f.id)
                        from public.characters me join public.characters f on f.owner_user_id = me.owner_user_id
                        where me.id = p_char and me.owner_user_id is not null), '[]'::jsonb)
  )
  from public.character_stats s where s.character_id = p_char
$$;

revoke execute on function public.switch_character(text) from public, anon;
grant execute on function public.switch_character(text) to authenticated;
