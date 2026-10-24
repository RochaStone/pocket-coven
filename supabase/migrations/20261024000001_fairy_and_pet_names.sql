-- LaLa's pigtails become a valid hairstyle, and every witch can name the familiars she owns.

alter table public.characters add column if not exists pet_names jsonb not null default '{}'::jsonb;

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
    if (p_look ->> 'hairStyle') not in ('long_waves','short_undercut','straight_long','beach_waves','ethereal_long','pixie','space_buns','pigtails') then
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

-- Public snapshot now carries pet names so friends see them too.
create or replace function game.public_state(p_char text) returns jsonb
language sql stable set search_path = public, game, pg_temp as $$
  select jsonb_build_object(
    'character', jsonb_build_object(
      'id', c.id, 'name', c.name, 'title', c.title, 'description', c.description, 'personality', c.personality,
      'pronouns', jsonb_build_object('subject', c.pronoun_subject, 'object', c.pronoun_object,
                                     'possessive', c.pronoun_possessive, 'plural', c.pronoun_plural),
      'baby_aesthetic', c.baby_aesthetic, 'look', c.look, 'claimed', c.owner_user_id is not null,
      'pet_names', c.pet_names),
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

-- Name (or un-name, with an empty name) a familiar you own. Letters, spaces, apostrophes, dots and hyphens; 16 max.
create or replace function public.name_pet(p_item_id text, p_name text) returns jsonb
language plpgsql security definer set search_path = public, game, pg_temp as $$
declare v text := game.require_character(); nm text := btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g'));
begin
  if not exists (select 1 from public.items where id = p_item_id and slot = 'companion') then
    perform game.fail('bad_pet', 'That is not a familiar.');
  end if;
  if not exists (select 1 from public.inventory where character_id = v and item_id = p_item_id) then
    perform game.fail('not_owned', 'You do not own that familiar yet.');
  end if;
  if nm = '' then
    update public.characters set pet_names = pet_names - p_item_id where id = v;
  else
    if char_length(nm) > 16 or nm !~ '^[[:alpha:]][[:alpha:] ''.-]*$' then
      perform game.fail('bad_name', 'Pet names are letters only, up to 16.');
    end if;
    update public.characters set pet_names = pet_names || jsonb_build_object(p_item_id, nm) where id = v;
  end if;
  return game.state(v);
end $$;

revoke execute on function public.name_pet(text, text) from public, anon;
grant execute on function public.name_pet(text, text) to authenticated;
