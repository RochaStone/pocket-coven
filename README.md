# Rocha's Pocket Coven: Baby Merwitch Edition

A pocket-sized, multiplayer seashell world for five witches. A pearl-pink compact opens into a miniature
dollhouse: Pearl Palace, Pearl Café, Champagne Grotto, Moon Deck, Mermaid Lagoon, Crystal Reef, Shell Beach,
the Coven Lounge, and a portal to the Kairos members' club. Each witch is a real person on their own device,
with a persistent Tamagotchi-style character, wardrobe, room and pearl purse.

## What is in the box

| Area | What works |
|---|---|
| Accounts | Email magic link **and** 6-digit code (Supabase Auth). The code path works when the email opens in another browser, which is common on phones. |
| Invites | Owner mints one link per founding witch. Tokens are 192-bit, stored only as SHA-256 hashes, shown once, expire (1 to 30 days), can be revoked, and are single-use. Minting a new invite revokes the previous open one. |
| Ownership | One witch per account, enforced in the database (`characters.owner_user_id unique`, row locks in `claim_invite`). |
| Tamagotchi | Five needs (nourishment, energy, joy, magic, social), seven moods, time-based decay with a floor (no death), a 72-hour decay cap, and a "retreated into the shell" state that care actions reverse. |
| Actions | 34 activities across 14 locations, each a tappable illustrated hotspot. Cooldowns, stat costs, loot tables, XP, levels, achievements, daily gifts. |
| Kairos | Pool (swim, float), Studio (Pilates, yoga, stretch), Gym (weights), Sound Sanctuary (sound healing + group sound bath), Co-Work (earn pearls), Café. |
| Economy | Pearls via a ledger. Balances can never go negative, every change is recorded, purchases are idempotent. No real money. |
| Wardrobe | 39 wearables across 7 slots (outfits, tails, hats, necklaces, earrings, hair, familiars). Try-on preview, buy, wear. Look editor (hairstyle, hair, skin, eyes, tattoos). Pronoun and profile editor. |
| Rooms | Six-by-four placement grid, 5 wallpapers, 4 floors, furniture shop, move and put away, private/coven privacy, friend visits with a daily social bonus. |
| Multiplayer | Realtime presence, chat, stickers, floating reactions, live roster (mood, location, activity, outfit), activity invitations, "friends nearby" social bonus, and two shared ceremonies (Moon Ritual, Group Sound Bath) where every participant is rewarded. |
| Owner | `/admin`: invites (create, share sheet, copy, revoke), claimed status, edit witch text and pronouns, reset or release a witch, gift pearls, moderate chat, edit game config, edit shop prices. |

Lizz uses they/them everywhere. Dray, Cheryl and Veda also default to they/them until they set their own
pronouns (Wardrobe → Profile), because their pronouns were not specified. Rocha uses she/her.
Flavour text is templated so no line assumes a gender, and a unit test fails if one does.

The baby-aesthetic rule is enforced server-side: adult-themed activities (champagne toast, balcony gossip
break, glowshroom giggles) are flagged `adult_only` and the database refuses them for Rocha's witch. They
are stylised fantasy, never instructions.

## Stack, and why

- **Next.js 16 + React 19 + TypeScript + Tailwind v4.** App Router, server components for the auth gates, a client game shell.
- **Motion** (`motion/react`) for the shell opening, scene transitions, equip feedback and reveals. Every animation respects `prefers-reduced-motion`.
- **Supabase** Auth, Postgres, Realtime. **The game engine is in Postgres**: every action is a `SECURITY DEFINER` function that validates the caller, locks the character row, applies decay, checks cooldowns and costs, credits the ledger and returns the new state in one transaction. Clients have read-only, RLS-scoped table access and cannot write a single row directly. This removes a whole class of cheating bugs (client-supplied stats or balances are never trusted) and means there is no separate game server to host.
- **Vercel** for hosting. No server secrets are needed at runtime: the browser only ever holds the anon key plus the player's own session.

## Project map

```
app/                    routes: / (splash), /invite/[token], /play, /admin, /auth/callback, /gallery/*
components/art/         original SVG art: Witch, ItemIcon, ShellCompact, WorldMap, KairosMap, LocationScene,
                        RoomBackdrop, ActivityProp, Sticker, Sparkles
components/game/        game UI: context, HUD, views, chat, events, wardrobe, rooms, admin
lib/game/catalog.ts     single source of truth for characters, items, activities, locations
lib/game/logic.ts       client mirrors of mood/decay rules (tested against the SQL)
supabase/migrations/    schema, engine, security (RLS, grants, realtime)
supabase/seed.sql       GENERATED from the catalog by `node scripts/gen-seed.ts`
scripts/create-invite.mjs  owner bootstrap (service role, local only)
tests/unit, tests/db, tests/e2e
```

## Environment variables

| Name | Where | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel + local | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel + local | Anon / publishable key (safe in the browser; RLS protects data) |
| `NEXT_PUBLIC_SITE_URL` | Vercel + local | Absolute site URL, used for invite links and magic-link redirects |
| `SUPABASE_SERVICE_ROLE_KEY` | **local only** | Only for `scripts/create-invite.mjs`. Never set it in Vercel, never prefix it with `NEXT_PUBLIC_`, never commit it. |
| `TEST_DATABASE_URL` | local tests | Throwaway Postgres for `tests/db` (database name must end in `_test`) |

Copy `.env.example` to `.env.local` and fill it in. `.env*` files are gitignored.

## Run it locally

Needs Node 22.18+ and Docker.

```bash
npm install
npx supabase start            # local Postgres, Auth, Realtime, and a mail catcher at http://127.0.0.1:54324
npx supabase status -o env    # copy API_URL, ANON_KEY, SERVICE_ROLE_KEY into .env.local
npm run dev                   # http://localhost:3000
node --env-file=.env.local scripts/create-invite.mjs rocha
```

Open the printed link, sign in (the code arrives in the local mail catcher), claim Rocha. Rocha is the
owner witch, so the Owner tab appears; mint the other four invites from there.

## Deploy to production

1. **Supabase project** (free tier is enough for five witches). Then link and push the schema:
   ```bash
   npx supabase link --project-ref <ref>
   npx supabase db push            # applies supabase/migrations
   psql "<connection string>" -f supabase/seed.sql   # idempotent; safe to re-run after catalog changes
   ```
2. **Auth settings** (Dashboard → Authentication):
   - URL Configuration: Site URL = your production URL; add `https://<your-domain>/**` to Redirect URLs.
   - Email Templates → Magic Link: include the code so phone users can type it, for example
     `<p><a href="{{ .ConfirmationURL }}">Open your seashell</a></p><p>Or enter this code: <b>{{ .Token }}</b></p>`
   - SMTP: the built-in sender is rate-limited to a few emails per hour. For five people it is usually fine;
     a free Resend or similar SMTP account removes the limit.
3. **Realtime**: Settings → Realtime → keep private channels authorised (the migration adds the
   `realtime.messages` policies that limit `coven:<id>` channels to coven members).
4. **Vercel**: import the repository, set the three `NEXT_PUBLIC_*` variables, deploy.
5. Mint Rocha's invite locally with the production service-role key in `.env.local`:
   `node --env-file=.env.local scripts/create-invite.mjs rocha 7`. Everything after that happens in `/admin`.

## Testing

```bash
npm run typecheck
npm run lint
npm test                 # unit (catalog integrity, pronouns, rules) + db (engine, RLS, invites, economy)
npm run build
```

- `tests/db` builds a throwaway database from a small Supabase auth stub plus the **real migrations and seed**,
  then calls every RPC as signed-in users under the `authenticated` role. It covers claims, invite reuse,
  revocation and expiry, RLS isolation, admin enforcement, idempotent retries, cooldowns, stat floors,
  decay, daily rewards, buying, equipping, room privacy, chat rate limits and the shared ritual.
- `tests/e2e/multiplayer.spec.ts` drives two separate browser identities (mobile viewport) against a
  local Supabase stack: owner invite, in-app invite, sign-in by emailed code, claim, invite reuse blocked,
  presence, cross-device chat, the shared moon ritual rewarding both players, a care action, persistence
  across reload, wardrobe purchase, zero console errors.
  ```bash
  npx supabase db reset && npm run build && npx next start &
  npx playwright test
  ```

## Art

Every character, item, scene, sticker and ornament is original inline SVG authored for this game:
no emojis, no stock, no external images. Characters are layered (hair back and front, outfit, tail or legs,
jewellery, hat, familiar, mood face), so every wardrobe item visibly changes the avatar. `/gallery/characters`
and `/gallery/scenes` show the full asset set.

If you later commission or generate illustrated art, these are the swap points, each behind a stable
component interface so nothing else changes: `Witch` (characters and moods), `ItemIcon` (all item and
furniture sprites), `LocationScene` (14 backdrops), `WorldMap` and `KairosMap`, `ShellCompact`,
`RoomBackdrop`, `Sticker`.

## Security model, briefly

- Identity: Supabase Auth sessions (httpOnly cookies refreshed by `proxy.ts`).
- Authorisation: RLS on every table; SELECT only, scoped to the caller's coven or to their own witch.
  No INSERT/UPDATE/DELETE grants to clients at all.
- Mutations: whitelisted RPCs, each `SECURITY DEFINER` with a pinned `search_path`, validating ownership,
  inputs and limits. Admin RPCs re-check the caller is the coven owner on every call.
- Realtime: postgres_changes honours RLS per subscriber; presence and broadcast use a private channel
  authorised by `realtime.messages` policies.
- Chat: plain text rendered by React (never as HTML), control characters stripped, 280-character cap,
  5 messages per 10 seconds per witch, stickers whitelisted.
- Idempotency: actions and purchases carry a client key; a retried request returns the original result.

## Known limitations

- Tutorial progress for the "visit Kairos" and "say hello" steps is stored per device (localStorage);
  the other steps come from the server.
- Presence-based "who is here" falls back to last-seen within five minutes for witches whose socket dropped.
- Room placement is a tidy grid rather than free positioning, by design.
- There is one founding coven; the schema supports more, but there is no UI to create another.
