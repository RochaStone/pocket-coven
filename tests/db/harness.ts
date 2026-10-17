import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { randomUUID, randomBytes, createHash } from "node:crypto";
import pg from "pg";
import { buildSeedSql, FOUNDING_COVEN_ID } from "@/lib/game/seed-sql.ts";

const ROOT = path.resolve(__dirname, "../..");
const URL_ = process.env.TEST_DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/pocket_coven_test";

export { FOUNDING_COVEN_ID };

// Rebuilds the throwaway test database from the stub + real migrations + generated seed.
export async function freshDb(): Promise<pg.Pool> {
  const u = new URL(URL_);
  const dbName = u.pathname.slice(1);
  if (!dbName.endsWith("_test")) throw new Error(`Refusing to recreate non-test database "${dbName}"`);
  const adminUrl = new URL(URL_);
  adminUrl.pathname = "/postgres";
  const admin = new pg.Client({ connectionString: adminUrl.toString() });
  await admin.connect();
  await admin.query(`drop database if exists ${dbName} with (force)`);
  await admin.query(`create database ${dbName}`);
  await admin.end();

  const pool = new pg.Pool({ connectionString: URL_, max: 4 });
  await pool.query(readFileSync(path.join(ROOT, "tests/db/supabase-stub.sql"), "utf8"));
  const migDir = path.join(ROOT, "supabase/migrations");
  for (const f of readdirSync(migDir).filter((x) => x.endsWith(".sql")).sort()) {
    await pool.query(readFileSync(path.join(migDir, f), "utf8"));
  }
  await pool.query(buildSeedSql());
  return pool;
}

export async function makeUser(pool: pg.Pool, email: string): Promise<string> {
  const id = randomUUID();
  await pool.query("insert into auth.users (id, email) values ($1, $2)", [id, email]);
  return id;
}

// Mints an invite the way scripts/create-invite.mjs does (service role, hash only).
export async function serviceInvite(pool: pg.Pool, characterId: string, opts: { expiresInDays?: number } = {}) {
  const token = randomBytes(24).toString("hex");
  const hash = createHash("sha256").update(token).digest("hex");
  await pool.query(
    "insert into public.invitations (coven_id, character_id, token_hash, expires_at) values ($1, $2, $3, now() + make_interval(days => $4))",
    [FOUNDING_COVEN_ID, characterId, hash, opts.expiresInDays ?? 7],
  );
  return token;
}

export class PgError extends Error {
  constructor(public code: string, public hint: string | undefined, public pgcode: string | undefined) {
    super(code);
  }
}

// Runs SQL as a signed-in Supabase user: role `authenticated`, JWT sub = uid.
export async function as<T = any>(pool: pg.Pool, uid: string | null, sql: string, params: unknown[] = []): Promise<T[]> {
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query(`set local role ${uid ? "authenticated" : "anon"}`);
    if (uid) await client.query("select set_config('request.jwt.claim.sub', $1, true)", [uid]);
    const res = await client.query(sql, params);
    await client.query("commit");
    return res.rows as T[];
  } catch (e: any) {
    await client.query("rollback").catch(() => {});
    throw new PgError(e.message, e.hint, e.code);
  } finally {
    client.release();
  }
}

export async function rpc<T = any>(pool: pg.Pool, uid: string | null, fn: string, args: unknown[] = []): Promise<T> {
  const placeholders = args.map((_, i) => `$${i + 1}`).join(", ");
  const rows = await as(pool, uid, `select public.${fn}(${placeholders}) as r`, args);
  return rows[0].r as T;
}

export async function expectFail(p: Promise<unknown>, code: string) {
  try {
    await p;
  } catch (e: any) {
    if (e.code === code || e.message === code || String(e.message).includes(code)) return e;
    throw new Error(`expected failure "${code}" but got "${e.message}"`);
  }
  throw new Error(`expected failure "${code}" but call succeeded`);
}

export const key = () => randomUUID();
