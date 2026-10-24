-- Releasing one witch from a family login keeps the login in the coven while she owns another witch.

create or replace function public.admin_release_character(p_character_id text) returns void
language plpgsql security definer set search_path = public, game, pg_temp as $$
declare coven uuid := game.admin_coven(); c public.characters;
begin
  select * into c from public.characters where id = p_character_id and coven_id = coven for update;
  if not found then perform game.fail('not_found', 'No such witch in your coven.'); end if;
  if c.is_owner_character then perform game.fail('cannot_release_owner', 'The owner witch cannot be released.'); end if;
  -- A family login keeps her coven membership while she still owns another witch here.
  if c.owner_user_id is not null and not exists (
    select 1 from public.characters o where o.owner_user_id = c.owner_user_id and o.coven_id = coven and o.id <> c.id
  ) then
    delete from public.coven_members where coven_id = coven and user_id = c.owner_user_id and role = 'member';
  end if;
  update public.characters set owner_user_id = null, claimed_at = null where id = c.id;
  perform game.init_character(c.id);
end $$;
