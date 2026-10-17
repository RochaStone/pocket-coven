import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type pg from "pg";
import { as, expectFail, freshDb, key, makeUser, rpc, serviceInvite } from "./harness";
import { ORACLE_CARDS } from "@/lib/game/catalog.ts";

let pool: pg.Pool;
let rocha: string, lizz: string, dray: string;
const sql = (q: string, p: unknown[] = []) => pool.query(q, p);

beforeAll(async () => {
  pool = await freshDb();
  rocha = await makeUser(pool, "rocha@example.com");
  lizz = await makeUser(pool, "lizz@example.com");
  dray = await makeUser(pool, "dray@example.com");
  await rpc(pool, rocha, "claim_invite", [await serviceInvite(pool, "rocha")]);
  await rpc(pool, lizz, "claim_invite", [await serviceInvite(pool, "lizz")]);
  await rpc(pool, dray, "claim_invite", [await serviceInvite(pool, "dray")]);
});
afterAll(async () => pool?.end());

describe("gifts", () => {
  it("a treat costs the sender and nourishes the recipient when opened", async () => {
    const before = await rpc(pool, rocha, "get_my_state");
    const sent = await rpc(pool, rocha, "send_gift", ["lizz", "treat", "treat_matcha", null, "for my favourite chaos witch", key()]);
    expect(sent.state.pearls).toBe(before.pearls - 8);
    const lizzState = await rpc(pool, lizz, "get_my_state");
    expect(lizzState.unopened_gifts).toBe(1);
    const [gift] = await as(pool, lizz, "select * from public.gifts where to_char = 'lizz'");
    expect(gift.note).toBe("for my favourite chaos witch");
    await sql("update public.character_stats set joy = 50, social = 50 where character_id = 'lizz'");
    const opened = await rpc(pool, lizz, "open_gift", [gift.id]);
    expect(Number(opened.state.stats.joy)).toBe(65);
    expect(Number(opened.state.stats.social)).toBe(60);
    expect(opened.state.unopened_gifts).toBe(0);
    expect((await rpc(pool, lizz, "open_gift", [gift.id])).already_opened).toBe(true);
    // Nobody else can open or even see it.
    await expectFail(rpc(pool, dray, "open_gift", [gift.id]), "not_found");
    expect(await as(pool, dray, "select * from public.gifts")).toHaveLength(0);
  });

  it("items move between witches; wearables and placed items cannot be gifted", async () => {
    await sql("select game.grant_item('rocha', 'col_rose_quartz', 1)");
    await rpc(pool, rocha, "send_gift", ["dray", "item", "col_rose_quartz", null, null, key()]);
    const r = await rpc(pool, rocha, "get_my_state");
    expect(r.inventory.find((i: any) => i.item_id === "col_rose_quartz")).toBeUndefined();
    await expectFail(rpc(pool, rocha, "send_gift", ["dray", "item", "col_rose_quartz", null, null, key()]), "none_left");
    await expectFail(rpc(pool, rocha, "send_gift", ["dray", "item", "hat_pearl_crown", null, null, key()]), "bad_gift");
    await rpc(pool, rocha, "place_decoration", ["decor_palm_pot", 0, 0]);
    await expectFail(rpc(pool, rocha, "send_gift", ["dray", "item", "decor_palm_pot", null, null, key()]), "none_left");
    const [g] = await as(pool, dray, "select id from public.gifts where to_char = 'dray' and ref = 'col_rose_quartz'");
    const d = await rpc(pool, dray, "open_gift", [g.id]);
    expect(d.state.inventory.find((i: any) => i.item_id === "col_rose_quartz")?.qty).toBe(1);
    // A re-granted item reappears after hitting zero.
    await sql("select game.grant_item('rocha', 'col_rose_quartz', 1)");
    expect((await rpc(pool, rocha, "get_my_state")).inventory.find((i: any) => i.item_id === "col_rose_quartz")?.qty).toBe(1);
  });

  it("pearl gifts are bounded, self-gifts refused, retries are idempotent, daily limit holds", async () => {
    await expectFail(rpc(pool, lizz, "send_gift", ["lizz", "pearls", null, 5, null, key()]), "self_gift");
    await expectFail(rpc(pool, lizz, "send_gift", ["rocha", "pearls", null, 500, null, key()]), "bad_gift");
    await expectFail(rpc(pool, lizz, "send_gift", ["veda", "pearls", null, 5, null, key()]), "not_found");
    const k = key();
    const a = await rpc(pool, lizz, "send_gift", ["rocha", "pearls", null, 5, null, k]);
    const b = await rpc(pool, lizz, "send_gift", ["rocha", "pearls", null, 5, null, k]);
    expect(b.replayed).toBe(true);
    expect(b.state.pearls).toBe(a.state.pearls);
    // Lizz has now sent one gift today; with a limit of 2 the second succeeds and the third is refused.
    await sql("update public.game_config set value = '2' where key = 'gift_daily_limit'");
    await rpc(pool, lizz, "send_gift", ["rocha", "pearls", null, 1, null, key()]);
    await expectFail(rpc(pool, lizz, "send_gift", ["rocha", "pearls", null, 1, null, key()]), "gift_limit");
    await sql("update public.game_config set value = '12' where key = 'gift_daily_limit'");
  });
});

describe("daily oracle", () => {
  it("draws one card per day and repeats it", async () => {
    await sql("update public.character_stats set magic = 40 where character_id = 'dray'");
    const a = await rpc(pool, dray, "draw_oracle");
    expect(a.new).toBe(true);
    expect(ORACLE_CARDS.map((c) => c.id)).toContain(a.card_id);
    expect(Number(a.state.stats.magic)).toBe(48);
    expect(a.state.oracle_today).toBe(a.card_id);
    const b = await rpc(pool, dray, "draw_oracle");
    expect(b.new).toBe(false);
    expect(b.card_id).toBe(a.card_id);
    expect(Number(b.state.stats.magic)).toBe(48);
  });
});

describe("coven goal", () => {
  it("fills from ordinary play and rewards every member once", async () => {
    const goal = await rpc(pool, rocha, "get_coven_goal");
    expect(goal.target).toBeGreaterThan(0);
    // Force this week's goal to matcha with a small target, then brew.
    await sql("update public.coven_goals set kind = 'matcha', target = 2, progress = 0, completed_at = null");
    const pearlsBefore = (await sql("select character_id, pearls from public.character_stats where character_id in ('lizz','dray') order by character_id")).rows;
    await rpc(pool, lizz, "perform_activity", ["cafe_matcha", key()]);
    expect((await rpc(pool, dray, "get_coven_goal")).progress).toBe(1);
    await rpc(pool, dray, "perform_activity", ["kairos_matcha", key()]);
    const done = await rpc(pool, dray, "get_coven_goal");
    expect(done.completed_at).not.toBeNull();
    const after = (await sql("select character_id, pearls from public.character_stats where character_id in ('lizz','dray') order by character_id")).rows;
    // dray paid 10 for the matcha, lizz paid 8 earlier; both got +40.
    expect(after[0].pearls).toBe(pearlsBefore[0].pearls + 40 - 10);
    expect(after[1].pearls).toBe(pearlsBefore[1].pearls + 40 - 8);
    const charms = await sql("select count(*)::int as n from public.inventory where item_id = 'col_coven_charm' and qty > 0");
    expect(charms.rows[0].n).toBe(3);
    // Further matchas do not pay out again.
    await sql("update public.activity_log set created_at = created_at - interval '1 hour'");
    await rpc(pool, lizz, "perform_activity", ["cafe_matcha", key()]);
    const charms2 = await sql("select sum(qty)::int as n from public.inventory where item_id = 'col_coven_charm'");
    expect(charms2.rows[0].n).toBe(3);
  });
});

describe("moon ceremonies", () => {
  it("knows real full and new moons", async () => {
    const { rows } = await sql(`select game.moon_window('2024-01-25 17:54+00') as full_, game.moon_window('2024-01-11 11:57+00') as new_,
                                       game.moon_window('2024-01-18 03:52+00') as quarter`);
    expect(rows[0]).toEqual({ full_: "full", new_: "new", quarter: null });
  });
  it("only opens a moon ceremony in its window", async () => {
    const { rows } = await sql("select game.moon_window() as w");
    if (rows[0].w === "full") {
      expect((await rpc(pool, rocha, "start_event", ["full_moon"])).kind).toBe("full_moon");
    } else {
      const e = await expectFail(rpc(pool, rocha, "start_event", ["full_moon"]), "not_moon_time");
      expect(e.hint).toMatch(/full moon arrives in about \d+ days/);
    }
  });
});

describe("seasons", () => {
  it("seasonal items sell only in their month", async () => {
    const { rows } = await sql("select game.local_month() as m");
    const month = rows[0].m as number;
    const inSeason = month === 10 ? "decor_pumpkin_lantern" : month === 12 ? "decor_coral_tree" : null;
    const outSeason = month === 12 ? "decor_pumpkin_lantern" : "decor_coral_tree";
    await sql("update public.character_stats set pearls = 500 where character_id = 'veda'");
    await expectFail(rpc(pool, rocha, "buy_item", [outSeason, key()]), "out_of_season");
    if (inSeason) expect((await rpc(pool, rocha, "buy_item", [inSeason, key()])).ok).toBe(true);
  });
});

describe("notifications", () => {
  it("queues only for witches who turned alerts on, and stops when turned off", async () => {
    await expectFail(rpc(pool, lizz, "save_push_subscription", ["http://evil", "k", "a"]), "bad_subscription");
    await rpc(pool, lizz, "save_push_subscription", ["https://push.example.com/abc", "p256", "authk"]);
    expect((await rpc(pool, lizz, "get_my_state")).push_enabled).toBe(true);
    await rpc(pool, rocha, "send_gift", ["lizz", "treat", "treat_bouquet", null, "hi", key()]);
    await rpc(pool, rocha, "send_gift", ["dray", "treat", "treat_bouquet", null, "hi", key()]);
    const q = (await sql("select character_id, kind, title from public.notify_queue order by id")).rows;
    expect(q.map((r) => r.character_id)).toEqual(["lizz"]);
    expect(q[0].title).toBe("Rocha sent you a gift");
    await rpc(pool, rocha, "invite_witch", ["lizz", "kairos_pool"]);
    await rpc(pool, rocha, "invite_witch", ["lizz", "kairos_pool"]);
    expect((await sql("select count(*)::int as n from public.notify_queue where kind = 'invite:rocha'")).rows[0].n).toBe(1);
    await rpc(pool, lizz, "remove_push_subscription", ["https://push.example.com/abc"]);
    await rpc(pool, rocha, "send_gift", ["lizz", "treat", "treat_bouquet", null, "again", key()]);
    expect((await sql("select count(*)::int as n from public.notify_queue where character_id = 'lizz' and kind = 'gift'")).rows[0].n).toBe(1);
    // Players cannot read the queue or subscriptions at all.
    await expectFail(as(pool, lizz, "select * from public.notify_queue"), "permission denied");
    await expectFail(as(pool, lizz, "select * from public.push_subscriptions"), "permission denied");
  });
  it("starting a coven event notifies the other subscribed witches", async () => {
    await rpc(pool, dray, "save_push_subscription", ["https://push.example.com/dray", "p", "a"]);
    await rpc(pool, rocha, "start_event", ["sound_bath"]);
    const rows = (await sql("select character_id, title from public.notify_queue where kind = 'event'")).rows;
    expect(rows).toEqual([{ character_id: "dray", title: "Group Sound Bath" }]);
  });
});

describe("push sender config", () => {
  it("is readable by the service role only", async () => {
    await sql("insert into game.private_config (key, value) values ('vapid_private', 'secret-key') on conflict (key) do update set value = excluded.value");
    await expectFail(rpc(pool, lizz, "push_config"), "permission denied");
    await expectFail(rpc(pool, null, "push_config"), "permission denied");
    await expectFail(as(pool, rocha, "select * from game.private_config"), "permission denied");
    const client = await pool.connect();
    try {
      await client.query("begin; set local role service_role");
      const { rows } = await client.query("select public.push_config() as c");
      expect(rows[0].c.vapid_private).toBe("secret-key");
      await client.query("commit");
    } finally {
      client.release();
    }
  });
});

describe("owner activity view", () => {
  it("is owner-only and reports everyone", async () => {
    await expectFail(rpc(pool, lizz, "admin_activity_summary"), "not_admin");
    const s = await rpc(pool, rocha, "admin_activity_summary");
    expect(s.map((x: any) => x.id)).toEqual(expect.arrayContaining(["rocha", "lizz", "dray", "cheryl", "veda"]));
    const l = s.find((x: any) => x.id === "lizz");
    expect(l.actions_7d).toBeGreaterThan(0);
    expect(l.gifts_sent_7d).toBeGreaterThan(0);
  });
});
