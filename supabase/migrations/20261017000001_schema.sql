-- Rocha's Pocket Coven: core schema.
-- All gameplay writes go through SECURITY DEFINER functions (see engine migration);
-- clients get read-only, RLS-scoped access to tables.

create extension if not exists pgcrypto with schema extensions;
create schema if not exists game;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

create table public.covens (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  owner_user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.coven_members (
  coven_id uuid not null references public.covens (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (coven_id, user_id)
);
create index coven_members_user_idx on public.coven_members (user_id);

create table public.locations (
  id text primary key,
  name text not null,
  world text not null check (world in ('shell', 'kairos')),
  blurb text not null default ''
);

create table public.items (
  id text primary key,
  name text not null,
  category text not null check (category in ('outfit','tail','hat','jewellery','hair_acc','companion','furniture','decor','collectible')),
  slot text check (slot in ('outfit','tail','hat','necklace','earrings','hair_acc','companion')),
  price int check (price is null or price > 0),
  placeable boolean not null default false,
  rarity text not null default 'common' check (rarity in ('common','rare','mythic')),
  description text not null default '',
  active boolean not null default true
);

create table public.characters (
  id text primary key check (id ~ '^[a-z]{2,20}$'),
  coven_id uuid not null references public.covens (id) on delete cascade,
  name text not null,
  title text not null default '',
  pronoun_subject text not null default 'they',
  pronoun_object text not null default 'them',
  pronoun_possessive text not null default 'their',
  pronoun_plural boolean not null default true,
  baby_aesthetic boolean not null default false,
  is_owner_character boolean not null default false,
  description text not null default '' check (char_length(description) <= 500),
  personality text not null default '' check (char_length(personality) <= 500),
  look jsonb not null,
  default_equipped jsonb not null default '{}'::jsonb,
  starter_items text[] not null default '{}',
  owner_user_id uuid unique references auth.users (id) on delete set null,
  claimed_at timestamptz,
  created_at timestamptz not null default now()
);
create index characters_coven_idx on public.characters (coven_id);

create table public.character_stats (
  character_id text primary key references public.characters (id) on delete cascade,
  nourishment numeric(5,2) not null default 70 check (nourishment between 0 and 100),
  energy numeric(5,2) not null default 70 check (energy between 0 and 100),
  joy numeric(5,2) not null default 70 check (joy between 0 and 100),
  magic numeric(5,2) not null default 70 check (magic between 0 and 100),
  social numeric(5,2) not null default 70 check (social between 0 and 100),
  pearls int not null default 0 check (pearls >= 0),
  xp int not null default 0 check (xp >= 0),
  level int not null default 1 check (level >= 1),
  updated_at timestamptz not null default now()
);

create table public.inventory (
  character_id text not null references public.characters (id) on delete cascade,
  item_id text not null references public.items (id),
  qty int not null check (qty > 0),
  acquired_at timestamptz not null default now(),
  primary key (character_id, item_id)
);

create table public.equipment (
  character_id text not null references public.characters (id) on delete cascade,
  slot text not null check (slot in ('outfit','tail','hat','necklace','earrings','hair_acc','companion')),
  item_id text not null references public.items (id),
  primary key (character_id, slot)
);

create table public.rooms (
  character_id text primary key references public.characters (id) on delete cascade,
  wallpaper text not null default 'pearl_stripe' check (wallpaper in ('pearl_stripe','lagoon_tile','moon_velvet','coral_damask','kelp_mural')),
  floor text not null default 'shell_parquet' check (floor in ('shell_parquet','sand','marble','moss')),
  privacy text not null default 'coven' check (privacy in ('coven','private')),
  updated_at timestamptz not null default now()
);

create table public.room_decorations (
  id bigint generated always as identity primary key,
  character_id text not null references public.characters (id) on delete cascade,
  item_id text not null references public.items (id),
  col int not null check (col between 0 and 5),
  "row" int not null check ("row" between 0 and 3),
  placed_at timestamptz not null default now(),
  unique (character_id, col, "row")
);

create table public.activities (
  id text primary key,
  location_id text not null references public.locations (id),
  name text not null,
  effects jsonb not null default '{}'::jsonb,
  pearls int not null default 0,
  xp int not null default 0 check (xp >= 0),
  cooldown_seconds int not null default 0 check (cooldown_seconds >= 0),
  adult_only boolean not null default false,
  loot jsonb not null default '[]'::jsonb,
  animation text not null,
  flavour_count int not null default 1 check (flavour_count >= 1),
  active boolean not null default true
);

create table public.activity_log (
  id bigint generated always as identity primary key,
  character_id text not null references public.characters (id) on delete cascade,
  activity_id text not null references public.activities (id),
  created_at timestamptz not null default now()
);
create index activity_log_char_act_idx on public.activity_log (character_id, activity_id, created_at desc);

-- Idempotency receipts: a retried action with the same key returns the original result.
create table public.action_receipts (
  character_id text not null references public.characters (id) on delete cascade,
  key text not null check (char_length(key) between 8 and 80),
  result jsonb not null,
  created_at timestamptz not null default now(),
  primary key (character_id, key)
);

create table public.currency_ledger (
  id bigint generated always as identity primary key,
  character_id text not null references public.characters (id) on delete cascade,
  delta int not null,
  balance_after int not null check (balance_after >= 0),
  reason text not null,
  ref text,
  created_at timestamptz not null default now()
);
create index currency_ledger_char_idx on public.currency_ledger (character_id, created_at desc);

create table public.achievements (
  id text primary key,
  name text not null,
  description text not null
);

create table public.character_achievements (
  character_id text not null references public.characters (id) on delete cascade,
  achievement_id text not null references public.achievements (id),
  earned_at timestamptz not null default now(),
  primary key (character_id, achievement_id)
);

create table public.daily_claims (
  character_id text not null references public.characters (id) on delete cascade,
  day date not null,
  claimed_at timestamptz not null default now(),
  primary key (character_id, day)
);

create table public.friend_visits (
  id bigint generated always as identity primary key,
  visitor_id text not null references public.characters (id) on delete cascade,
  host_id text not null references public.characters (id) on delete cascade,
  day date not null,
  created_at timestamptz not null default now(),
  unique (visitor_id, host_id, day),
  check (visitor_id <> host_id)
);

create table public.chat_messages (
  id bigint generated always as identity primary key,
  coven_id uuid not null references public.covens (id) on delete cascade,
  character_id text references public.characters (id) on delete set null,
  kind text not null default 'text' check (kind in ('text','sticker','system')),
  body text not null check (char_length(body) between 1 and 280),
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid
);
create index chat_messages_coven_idx on public.chat_messages (coven_id, created_at desc);

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  coven_id uuid not null references public.covens (id) on delete cascade,
  character_id text not null references public.characters (id) on delete cascade,
  token_hash text not null unique,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  claimed_at timestamptz,
  claimed_by uuid references auth.users (id) on delete set null
);

create table public.shared_events (
  id uuid primary key default gen_random_uuid(),
  coven_id uuid not null references public.covens (id) on delete cascade,
  kind text not null check (kind in ('moon_ritual','sound_bath')),
  location_id text not null references public.locations (id),
  host_character_id text not null references public.characters (id) on delete cascade,
  status text not null default 'gathering' check (status in ('gathering','complete','cancelled')),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
-- At most one gathering event per kind per coven.
create unique index shared_events_one_gathering on public.shared_events (coven_id, kind) where status = 'gathering';

create table public.shared_event_participants (
  event_id uuid not null references public.shared_events (id) on delete cascade,
  character_id text not null references public.characters (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (event_id, character_id)
);

-- Last known whereabouts, so offline witches still appear in the world.
create table public.character_status (
  character_id text primary key references public.characters (id) on delete cascade,
  location_id text references public.locations (id),
  activity_id text references public.activities (id),
  activity_at timestamptz,
  last_seen_at timestamptz not null default now()
);

create table public.game_config (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
