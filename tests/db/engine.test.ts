import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import type pg from "pg";
import { as, expectFail, freshDb, key, makeUser, rpc, serviceInvite } from "./harness";
import { buildSeedSql } from "@/lib/game/seed-sql.ts";
import { moodFromStats, projectStats } from "@/lib/game/logic.ts";
import { CHARACTERS, GAME_CONFIG } from "@/lib/game/catalog.ts";
import type { Stats } from "@/lib/game/types.ts";

let pool: pg.Pool;
let rocha: string, lizz: string, dray: string, stranger: string;

beforeAll(async () => {
  pool = await freshDb();
  rocha = await makeUser(pool, "rocha@example.com");
  lizz = await makeUser(pool, "lizz@example.com");
  dray = await makeUser(pool, "dray@example.com");
  stranger = await makeUser(pool, "stranger@example.com");
});
afterAll(async () => pool?.end());

const statsOf = (s: any): Stats => ({
  nourishment: Number(s.stats.nourishment), energy: Number(s.stats.energy), joy: Number(s.stats.joy),
  magic: Number(s.stats.magic), social: Number(s.stats.social),
});
const superSql = (sql: string, params: unknown[] = []) => pool.query(sql, params);

describe("seed", () => {
  it("committed seed.sql matches the catalog", () => {
    const file = readFileSync(path.resolve(__dirname, "../../supabase/seed.sql"), "utf8");
    expect(file).toBe(buildSeedSql());
  });
  it("creates five unclaimed founding witches with starter wardrobes", async () => {
    const { rows } = await superSql("select id, owner_user_id from public.characters order by id");
    expect(rows.map((r) => r.id)).toEqual(["cheryl", "christiana", "dray", "layla", "lizz", "rocha", "veda"]);
    expect(rows.every((r) => r.owner_user_id === null)).toBe(true);
    const inv = await superSql("select count(*)::int as n from public.inventory where character_id = 'lizz'");
    expect(inv.rows[0].n).toBeGreaterThan(4);
  });
  it("seed is re-runnable without resetting witches", async () => {
    await superSql("update public.character_stats set pearls = 999 where character_id = 'veda'");
    await superSql(buildSeedSql());
    const { rows } = await superSql("select pearls from public.character_stats where character_id = 'veda'");
    expect(rows[0].pearls).toBe(999);
    await superSql("select game.init_character('veda')");
  });
});

describe("invitations and ownership", () => {
  it("anonymous visitors can peek an invite but not claim it", async () => {
    const token = await serviceInvite(pool, "rocha");
    const peek = await rpc(pool, null, "peek_invite", [token]);
    expect(peek).toMatchObject({ valid: true, character_id: "rocha", name: "Rocha" });
    await expectFail(rpc(pool, null, "claim_invite", [token]), "permission denied");
    // Owner claims Rocha and becomes coven admin.
    const state = await rpc(pool, rocha, "claim_invite", [token]);
    expect(state.character.id).toBe("rocha");
    expect(state.is_admin).toBe(true);
    expect((await rpc(pool, null, "peek_invite", [token])).valid).toBe(false);
  });

  it("admin mints an invite; it can be claimed exactly once", async () => {
    const inv = await rpc(pool, rocha, "admin_create_invite", [ "lizz", 7 ]);
    expect(inv.token).toMatch(/^[0-9a-f]{48}$/);
    const stored = await superSql("select token_hash from public.invitations where id = $1", [inv.id]);
    expect(stored.rows[0].token_hash).not.toBe(inv.token);
    const state = await rpc(pool, lizz, "claim_invite", [inv.token]);
    expect(state.character).toMatchObject({ id: "lizz", pronouns: { subject: "they", object: "them", plural: true } });
    expect(state.is_admin).toBe(false);
    // Re-use by someone else fails.
    await expectFail(rpc(pool, stranger, "claim_invite", [inv.token]), "invite_used");
    // Claiming again by the same user is idempotent.
    expect((await rpc(pool, lizz, "claim_invite", [inv.token])).character.id).toBe("lizz");
  });

  it("one witch per account, no claiming without a valid invite", async () => {
    const inv = await rpc(pool, rocha, "admin_create_invite", ["dray", 7]);
    await expectFail(rpc(pool, lizz, "claim_invite", [inv.token]), "already_has_character");
    await expectFail(rpc(pool, stranger, "claim_invite", ["deadbeef".repeat(6)]), "invite_invalid");
    // Direct table writes are impossible for players.
    await expectFail(as(pool, stranger, "update public.characters set owner_user_id = auth.uid() where id = 'veda'"), "permission denied");
    await expectFail(as(pool, stranger, "insert into public.currency_ledger (character_id, delta, balance_after, reason) values ('veda', 1000, 1000, 'x')"), "permission denied");
    await rpc(pool, dray, "claim_invite", [inv.token]);
  });

  it("revoked and expired invites are refused; minting a new invite revokes the old one", async () => {
    const a = await rpc(pool, rocha, "admin_create_invite", ["cheryl", 7]);
    const b = await rpc(pool, rocha, "admin_create_invite", ["cheryl", 7]);
    await expectFail(rpc(pool, stranger, "claim_invite", [a.token]), "invite_revoked");
    await rpc(pool, rocha, "admin_revoke_invite", [b.id]);
    await expectFail(rpc(pool, stranger, "claim_invite", [b.token]), "invite_revoked");
    const expired = await serviceInvite(pool, "cheryl");
    await superSql("update public.invitations set expires_at = now() - interval '1 minute' where revoked_at is null and claimed_at is null and character_id = 'cheryl'");
    await expectFail(rpc(pool, stranger, "claim_invite", [expired]), "invite_expired");
  });

  it("non-owners cannot use admin powers or see invitations", async () => {
    await expectFail(rpc(pool, lizz, "admin_create_invite", ["veda", 7]), "not_admin");
    await expectFail(rpc(pool, lizz, "admin_reset_character", ["rocha"]), "not_admin");
    const rows = await as(pool, lizz, "select * from public.invitations");
    expect(rows).toHaveLength(0);
    expect((await as(pool, rocha, "select * from public.invitations")).length).toBeGreaterThan(0);
  });

  it("strangers without a witch see nothing of the coven", async () => {
    expect(await as(pool, stranger, "select * from public.characters")).toHaveLength(0);
    expect(await as(pool, stranger, "select * from public.chat_messages")).toHaveLength(0);
    expect(await as(pool, stranger, "select * from public.character_stats")).toHaveLength(0);
    await expectFail(rpc(pool, stranger, "get_my_state"), "no_character");
    expect((await as(pool, lizz, "select id from public.characters")).length).toBe(CHARACTERS.length);
  });
});

describe("tamagotchi engine", () => {
  it("care actions change stats and pearls, and are idempotent on retry", async () => {
    await superSql("update public.character_stats set energy = 50, nourishment = 50 where character_id = 'rocha'");
    const before = await rpc(pool, rocha, "get_my_state");
    const k = key();
    const r = await rpc(pool, rocha, "perform_activity", ["kairos_cowork", k]);
    expect(r.ok).toBe(true);
    expect(r.state.pearls).toBe(before.pearls + 25);
    expect(Number(r.state.stats.energy)).toBe(Number(before.stats.energy) - 20);
    const replay = await rpc(pool, rocha, "perform_activity", ["kairos_cowork", k]);
    expect(replay.replayed).toBe(true);
    expect(replay.state.pearls).toBe(r.state.pearls);
    const ledger = await superSql("select count(*)::int as n from public.currency_ledger where character_id = 'rocha' and reason = 'activity'");
    expect(ledger.rows[0].n).toBe(1);
    expect(r.state.achievements).toContain("first_care");
  });

  it("enforces cooldowns", async () => {
    const e = await expectFail(rpc(pool, rocha, "perform_activity", ["kairos_cowork", key()]), "cooldown");
    expect(e.hint).toMatch(/Ready again/);
  });

  it("stat costs cannot go below zero", async () => {
    await superSql("update public.character_stats set energy = 5 where character_id = 'lizz'");
    await expectFail(rpc(pool, lizz, "perform_activity", ["kairos_weights", key()]), "too_tired");
    const nap = await rpc(pool, lizz, "perform_activity", ["nap_oyster", key()]);
    expect(Number(nap.state.stats.energy)).toBe(40);
  });

  it("the baby-aesthetic witch never gets adult activities; grown witches do", async () => {
    await expectFail(rpc(pool, rocha, "perform_activity", ["grotto_toast", key()]), "adult_only");
    await expectFail(rpc(pool, rocha, "perform_activity", ["reef_mushroom", key()]), "adult_only");
    const r = await rpc(pool, lizz, "perform_activity", ["grotto_toast", key()]);
    expect(r.ok).toBe(true);
  });

  it("stats stay in 0..100", async () => {
    await superSql("update public.character_stats set nourishment = 95 where character_id = 'lizz'");
    const r = await rpc(pool, lizz, "perform_activity", ["cafe_broth", key()]);
    expect(Number(r.state.stats.nourishment)).toBe(100);
  });

  it("needs decay with time, floor out (no death) and the witch retreats into her shell", async () => {
    await superSql("update public.character_stats set nourishment=80, energy=80, joy=80, magic=80, social=80, updated_at = now() - interval '10 hours' where character_id = 'dray'");
    const s10 = await rpc(pool, dray, "get_my_state");
    expect(statsOf(s10)).toEqual({ nourishment: 40, energy: 50, joy: 50, magic: 60, social: 50 });
    await superSql("update public.character_stats set updated_at = now() - interval '500 hours' where character_id = 'dray'");
    const sLong = await rpc(pool, dray, "get_my_state");
    for (const v of Object.values(statsOf(sLong))) expect(v).toBe(10);
    expect(sLong.mood).toBe("offended");
    // Care restores.
    const fed = await rpc(pool, dray, "perform_activity", ["cafe_broth", key()]);
    expect(Number(fed.state.stats.nourishment)).toBe(40);
  });

  it("decay ignores sub-3-minute windows so frequent reads never lose decay", async () => {
    await superSql("update public.character_stats set joy = 60, updated_at = now() - interval '1 minute' where character_id = 'dray'");
    const s = await rpc(pool, dray, "get_my_state");
    expect(Number(s.stats.joy)).toBe(60);
    const { rows } = await superSql("select updated_at < now() - interval '50 seconds' as kept from public.character_stats where character_id = 'dray'");
    expect(rows[0].kept).toBe(true);
  });

  it("daily reward claims once per day", async () => {
    const a = await rpc(pool, lizz, "claim_daily");
    expect(a.ok).toBe(true);
    expect(a.loot).toHaveLength(1);
    const b = await rpc(pool, lizz, "claim_daily");
    expect(b.already_claimed).toBe(true);
    expect(b.state.pearls).toBe(a.state.pearls);
  });

  it("friends at the same place lift social", async () => {
    await rpc(pool, dray, "set_location", ["kairos_studio"]);
    await superSql("update public.character_stats set energy = 90, social = 40 where character_id = 'lizz'");
    const r = await rpc(pool, lizz, "perform_activity", ["kairos_yoga", key()]);
    expect(r.friends).toContain("Dray");
    expect(Number(r.effects.social)).toBe(5);
  });
});

describe("economy, wardrobe and rooms", () => {
  it("buying debits pearls; found-only items are not for sale; balance cannot go negative", async () => {
    const s = await rpc(pool, lizz, "get_my_state");
    const r = await rpc(pool, lizz, "buy_item", ["hat_witch_pink", key()]);
    expect(r.state.pearls).toBe(s.pearls - 70);
    await expectFail(rpc(pool, lizz, "buy_item", ["hat_witch_pink", key()]), "already_owned");
    await expectFail(rpc(pool, lizz, "buy_item", ["col_golden_scallop", key()]), "not_for_sale");
    await superSql("update public.character_stats set pearls = 10 where character_id = 'lizz'");
    await expectFail(rpc(pool, lizz, "buy_item", ["tail_gold_champagne", key()]), "not_enough_pearls");
    const { rows } = await superSql("select pearls from public.character_stats where character_id = 'lizz'");
    expect(rows[0].pearls).toBe(10);
  });

  it("equipping requires ownership and the right slot, and changes the visible avatar state", async () => {
    await expectFail(rpc(pool, lizz, "equip_item", ["tail", "tail_gold_champagne"]), "not_owned");
    await expectFail(rpc(pool, lizz, "equip_item", ["tail", "hat_witch_pink"]), "bad_slot");
    const r = await rpc(pool, lizz, "equip_item", ["hat", "hat_witch_pink"]);
    expect(r.state.equipment.hat).toBe("hat_witch_pink");
    const off = await rpc(pool, lizz, "equip_item", ["hat", null]);
    expect(off.state.equipment.hat).toBeUndefined();
  });

  it("look edits are validated", async () => {
    await expectFail(rpc(pool, lizz, "set_look", [JSON.stringify({ skin: "red; drop table" })]), "bad_look");
    const s = await rpc(pool, lizz, "set_look", [JSON.stringify({ hairStyle: "pixie", hairColor: "#123ABC" })]);
    expect(s.character.look).toMatchObject({ hairStyle: "pixie", hairColor: "#123abc", tattoos: true });
  });

  it("room decorations respect ownership, cells and privacy", async () => {
    const r = await rpc(pool, lizz, "place_decoration", ["furn_clam_chair", 0, 0]);
    expect(r.state.decorations).toHaveLength(1);
    await expectFail(rpc(pool, lizz, "place_decoration", ["decor_moon_lantern", 0, 0]), "cell_taken");
    await expectFail(rpc(pool, lizz, "place_decoration", ["furn_clam_chair", 1, 0]), "none_left");
    await expectFail(rpc(pool, lizz, "place_decoration", ["furn_disco_shell", 2, 0]), "none_left");
    await expectFail(rpc(pool, lizz, "place_decoration", ["hat_witch_pink", 2, 0]), "not_placeable");
    // Coven can see it; then Lizz goes private.
    expect(await as(pool, dray, "select * from public.room_decorations where character_id = 'lizz'")).toHaveLength(1);
    const visit = await rpc(pool, dray, "visit_room", ["lizz"]);
    expect(visit.first_visit_today).toBe(true);
    expect((await rpc(pool, dray, "visit_room", ["lizz"])).first_visit_today).toBe(false);
    await rpc(pool, lizz, "set_room_style", ["moon_velvet", "marble", "private"]);
    expect(await as(pool, dray, "select * from public.room_decorations where character_id = 'lizz'")).toHaveLength(0);
    await expectFail(rpc(pool, dray, "visit_room", ["lizz"]), "room_private");
    expect(await as(pool, lizz, "select * from public.room_decorations where character_id = 'lizz'")).toHaveLength(1);
    await expectFail(rpc(pool, lizz, "set_room_style", ["glitter_bomb", null, null]), "bad_style");
  });

  it("pronoun edits are validated and saved", async () => {
    await expectFail(rpc(pool, dray, "update_my_profile", [null, null, JSON.stringify({ subject: "<b>", object: "x", possessive: "x", plural: true })]), "bad_pronouns");
    const s = await rpc(pool, dray, "update_my_profile", ["Moon witch", "Calm, then chaotic", JSON.stringify({ subject: "she", object: "her", possessive: "her", plural: false })]);
    expect(s.character.pronouns).toEqual({ subject: "she", object: "her", possessive: "her", plural: false });
    expect(s.character.personality).toBe("Calm, then chaotic");
  });
});

describe("chat and shared events", () => {
  it("chat syncs to coven members, is rate limited and stickers are whitelisted", async () => {
    const m = await rpc(pool, lizz, "send_chat", ["text", "  <img src=x onerror=alert(1)> hi\u0007  "]);
    expect(m.body).toBe("<img src=x onerror=alert(1)> hi");
    await rpc(pool, lizz, "send_chat", ["sticker", "matcha_cheers"]);
    await expectFail(rpc(pool, lizz, "send_chat", ["sticker", "nope"]), "bad_sticker");
    await expectFail(rpc(pool, lizz, "send_chat", ["text", "x".repeat(281)]), "too_long");
    for (let i = 0; i < 3; i++) await rpc(pool, lizz, "send_chat", ["text", `msg ${i}`]);
    await expectFail(rpc(pool, lizz, "send_chat", ["text", "one too many"]), "slow_down");
    const seen = await as(pool, dray, "select body from public.chat_messages where character_id = 'lizz'");
    expect(seen.length).toBe(5);
    expect(await as(pool, stranger, "select body from public.chat_messages")).toHaveLength(0);
  });

  it("admin moderation hides messages", async () => {
    const [msg] = await as(pool, rocha, "select id from public.chat_messages where character_id = 'lizz' order by id limit 1");
    await expectFail(rpc(pool, dray, "admin_delete_chat", [msg.id]), "not_admin");
    await rpc(pool, rocha, "admin_delete_chat", [msg.id]);
    expect(await as(pool, dray, "select * from public.chat_messages where id = $1", [msg.id])).toHaveLength(0);
  });

  it("a moon ritual needs two witches, only the host begins it, and everyone is rewarded", async () => {
    await superSql("update public.character_stats set magic = 40 where character_id in ('rocha','dray')");
    const ev = await rpc(pool, rocha, "start_event", ["moon_ritual"]);
    expect(ev.status).toBe("gathering");
    // Starting again joins the same gathering instead of making a second one.
    expect((await rpc(pool, rocha, "start_event", ["moon_ritual"])).id).toBe(ev.id);
    await expectFail(rpc(pool, rocha, "complete_event", [ev.id]), "need_more_witches");
    await rpc(pool, dray, "join_event", [ev.id]);
    await expectFail(rpc(pool, dray, "complete_event", [ev.id]), "not_host");
    const pearlsBefore = (await superSql("select character_id, pearls from public.character_stats where character_id in ('rocha','dray') order by character_id")).rows;
    const done = await rpc(pool, rocha, "complete_event", [ev.id]);
    expect(done.ok).toBe(true);
    const after = (await superSql("select character_id, pearls, magic from public.character_stats where character_id in ('rocha','dray') order by character_id")).rows;
    expect(after[0].pearls).toBe(pearlsBefore[0].pearls + 30);
    expect(after[1].pearls).toBe(pearlsBefore[1].pearls + 30);
    const moon = await superSql("select count(*)::int as n from public.inventory where item_id = 'col_moonstone' and character_id in ('rocha','dray')");
    expect(moon.rows[0].n).toBe(2);
    const ach = await superSql("select count(*)::int as n from public.character_achievements where achievement_id = 'coven_ritual'");
    expect(ach.rows[0].n).toBe(2);
    await expectFail(rpc(pool, dray, "join_event", [ev.id]), "event_closed");
  });

  it("admin reset restores a witch without unclaiming", async () => {
    await rpc(pool, rocha, "admin_reset_character", ["lizz"]);
    const s = await rpc(pool, lizz, "get_my_state");
    expect(s.pearls).toBe(GAME_CONFIG.starting_pearls);
    expect(s.decorations).toHaveLength(0);
    expect(s.character.id).toBe("lizz");
  });
});

describe("client mirrors agree with the database", () => {
  const fixtures: Stats[] = [
    { nourishment: 70, energy: 70, joy: 70, magic: 70, social: 70 },
    { nourishment: 90, energy: 90, joy: 90, magic: 90, social: 90 },
    { nourishment: 85, energy: 85, joy: 80, magic: 70, social: 85 },
    { nourishment: 20, energy: 70, joy: 70, magic: 70, social: 70 },
    { nourishment: 70, energy: 20, joy: 70, magic: 70, social: 70 },
    { nourishment: 70, energy: 70, joy: 30, magic: 70, social: 70 },
    { nourishment: 70, energy: 70, joy: 70, magic: 70, social: 25 },
    { nourishment: 10, energy: 10, joy: 10, magic: 10, social: 10 },
    { nourishment: 60, energy: 60, joy: 60, magic: 90, social: 60 },
    { nourishment: 15, energy: 90, joy: 90, magic: 90, social: 90 },
  ];
  it("mood", async () => {
    for (const f of fixtures) {
      const { rows } = await superSql("select game.mood($1,$2,$3,$4,$5) as m", [f.nourishment, f.energy, f.joy, f.magic, f.social]);
      expect(rows[0].m).toBe(moodFromStats(f));
    }
  });
  it("decay projection", async () => {
    const cfg = { decay_per_hour: GAME_CONFIG.decay_per_hour, decay_floor: GAME_CONFIG.decay_floor, decay_max_hours: GAME_CONFIG.decay_max_hours };
    const now = new Date();
    for (const hours of [0.5, 3, 12, 100]) {
      await superSql("update public.character_stats set nourishment=73, energy=55, joy=12, magic=99, social=40, updated_at = now() - make_interval(secs => $1) where character_id = 'veda'", [hours * 3600]);
      await superSql("select game.apply_decay('veda')");
      const { rows } = await superSql("select nourishment, energy, joy, magic, social from public.character_stats where character_id = 'veda'");
      const db = Object.fromEntries(Object.entries(rows[0]).map(([k, v]) => [k, Number(v)]));
      const updatedAt = new Date(now.getTime() - hours * 3600_000);
      const ts = projectStats({ nourishment: 73, energy: 55, joy: 12, magic: 99, social: 40 }, updatedAt, now, cfg);
      for (const k of Object.keys(ts) as (keyof Stats)[]) expect(Math.abs(ts[k] - db[k])).toBeLessThan(0.05);
    }
  });
});
