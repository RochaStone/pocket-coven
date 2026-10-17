// Delivers queued coven alerts (public.notify_queue) as Web Push notifications.
// Woken every minute by game.dispatch_push() (pg_cron + pg_net) with the shared secret header.
// Deploy with JWT verification off (the cron call carries x-push-secret, not a JWT):
//   supabase functions deploy send-push --no-verify-jwt
// Config (VAPID keys, subject, cron secret) comes from the service-role-only RPC push_config(),
// which reads game.private_config; each value falls back to env (PUSH_CRON_SECRET, VAPID_PUBLIC_KEY,
// VAPID_PRIVATE_KEY, VAPID_SUBJECT) for local runs. SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are
// provided by Supabase. Rows are only ever updated, never deleted.
import { createClient } from "jsr:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

type QueueRow = { id: number; character_id: string; kind: string; title: string; body: string; url: string; attempts: number };
type Sub = { id: number; character_id: string; endpoint: string; p256dh: string; auth: string };
type Outcome = "ok" | "gone" | "error";
type Config = { vapidPublic: string; vapidPrivate: string; vapidSubject: string; pushSecret: string };

const BATCH = 50;
const MAX_ATTEMPTS = 3;
const TTL_SECONDS = 6 * 60 * 60;

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

function safeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const x = enc.encode(a);
  const y = enc.encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Cached for the life of the isolate once complete; an incomplete config is re-read next call.
let cachedConfig: Config | null = null;

async function loadConfig(): Promise<Config | null> {
  if (cachedConfig) return cachedConfig;
  let fromDb: Record<string, unknown> = {};
  try {
    const { data, error } = await db.rpc("push_config");
    if (!error && data && typeof data === "object") fromDb = data as Record<string, unknown>;
  } catch {
    // RPC missing or unreachable: env fallback below.
  }
  const pick = (key: string, env: string) => {
    const v = fromDb[key];
    return typeof v === "string" && v ? v : Deno.env.get(env) || "";
  };
  const config: Config = {
    vapidPublic: pick("vapid_public", "VAPID_PUBLIC_KEY"),
    vapidPrivate: pick("vapid_private", "VAPID_PRIVATE_KEY"),
    vapidSubject: pick("vapid_subject", "VAPID_SUBJECT") || "https://pocket-coven.vercel.app",
    pushSecret: pick("push_secret", "PUSH_CRON_SECRET"),
  };
  if (!config.vapidPublic || !config.vapidPrivate || !config.pushSecret) return null;
  webpush.setVapidDetails(config.vapidSubject, config.vapidPublic, config.vapidPrivate);
  cachedConfig = config;
  return config;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json(405, { ok: false, code: "method" });

  const config = await loadConfig();
  if (!config) return json(503, { ok: false, code: "config_missing" });
  if (!safeEqual(req.headers.get("x-push-secret") ?? "", config.pushSecret)) return json(401, { ok: false, code: "unauthorized" });

  const { data: rows, error: qErr } = await db
    .from("notify_queue")
    .select("id, character_id, kind, title, body, url, attempts")
    .is("sent_at", null)
    .lt("attempts", MAX_ATTEMPTS)
    .order("created_at", { ascending: true })
    .order("id", { ascending: true })
    .limit(BATCH);
  if (qErr) return json(500, { ok: false, code: "queue_read", hint: qErr.message });
  const queue = (rows ?? []) as QueueRow[];
  if (queue.length === 0) return json(200, { ok: true, processed: 0, sent: 0, no_device: 0, failed: 0, disabled: 0 });

  const chars = [...new Set(queue.map((r) => r.character_id))];
  const { data: subRows, error: sErr } = await db
    .from("push_subscriptions")
    .select("id, character_id, endpoint, p256dh, auth")
    .in("character_id", chars)
    .is("disabled_at", null);
  if (sErr) return json(500, { ok: false, code: "subs_read", hint: sErr.message });

  const byChar = new Map<string, Sub[]>();
  for (const s of (subRows ?? []) as Sub[]) byChar.set(s.character_id, [...(byChar.get(s.character_id) ?? []), s]);

  const gone = new Set<number>();
  const sentIds: number[] = [];
  const noDeviceIds: number[] = [];
  const failed: QueueRow[] = [];

  const deliver = async (sub: Sub, row: QueueRow): Promise<Outcome> => {
    const payload = JSON.stringify({ title: row.title, body: row.body, url: row.url, tag: row.kind });
    try {
      await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload, {
        TTL: TTL_SECONDS,
        urgency: "normal",
        timeout: 10_000,
      });
      return "ok";
    } catch (e) {
      const status = (e as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) {
        gone.add(sub.id);
        return "gone";
      }
      console.error("push failed", sub.id, status ?? (e as Error).message);
      return "error";
    }
  };

  // Rows in order, devices of one row in parallel, so a dead device is skipped for later rows.
  for (const row of queue) {
    const devices = (byChar.get(row.character_id) ?? []).filter((s) => !gone.has(s.id));
    if (devices.length === 0) {
      noDeviceIds.push(row.id);
      continue;
    }
    const outcomes = await Promise.all(devices.map((s) => deliver(s, row)));
    if (outcomes.includes("ok")) sentIds.push(row.id);
    else if (outcomes.every((o) => o === "gone")) noDeviceIds.push(row.id);
    else failed.push(row);
  }

  const now = new Date().toISOString();
  const errors: string[] = [];
  const done = [...sentIds, ...noDeviceIds];
  if (done.length) {
    const { error } = await db.from("notify_queue").update({ sent_at: now }).in("id", done).is("sent_at", null);
    if (error) errors.push(error.message);
  }
  if (gone.size) {
    const { error } = await db.from("push_subscriptions").update({ disabled_at: now }).in("id", [...gone]).is("disabled_at", null);
    if (error) errors.push(error.message);
  }
  const byAttempts = new Map<number, number[]>();
  for (const r of failed) byAttempts.set(r.attempts + 1, [...(byAttempts.get(r.attempts + 1) ?? []), r.id]);
  for (const [attempts, ids] of byAttempts) {
    const { error } = await db.from("notify_queue").update({ attempts }).in("id", ids).is("sent_at", null);
    if (error) errors.push(error.message);
  }

  return json(errors.length ? 500 : 200, {
    ok: errors.length === 0,
    processed: queue.length,
    sent: sentIds.length,
    no_device: noDeviceIds.length,
    failed: failed.length,
    disabled: gone.size,
    ...(errors.length ? { errors } : {}),
  });
});
