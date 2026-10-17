// Owner tool: copies a generated painting from the Higgsfield CDN into the public `art` bucket,
// resized and re-encoded as JPEG so phones load it fast. Returns a small preview (base64) so the
// result can be checked by the person building the game. Called with the push secret header
// (via pg_net), never by players. Deploy with --no-verify-jwt.
import { createClient } from "jsr:@supabase/supabase-js@2";
import { Image } from "https://deno.land/x/imagescript@1.3.0/mod.ts";

const ALLOWED = [/\.cloudfront\.net$/, /(^|\.)higgsfield\.ai$/];
const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function b64(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json(405, { ok: false, code: "method" });
  const { data: cfg } = await db.rpc("push_config");
  const secret = (cfg as { push_secret?: string } | null)?.push_secret;
  if (!secret || req.headers.get("x-push-secret") !== secret) return json(401, { ok: false, code: "unauthorized" });

  const { url, path, width = 900, preview = 280, sheet, cell = 64, cols = 5 } = await req.json().catch(() => ({}));

  // Contact sheet: one small grid of already-stored paintings, for reviewing a whole set at once.
  if (Array.isArray(sheet)) {
    const paths = (sheet as unknown[]).filter((x): x is string => typeof x === "string" && /^[a-z0-9_\-/]{1,80}\.jpg$/.test(x)).slice(0, 20);
    const ch = Math.round(cell * 4 / 3);
    const grid = new Image(cell * cols, ch * Math.ceil(paths.length / cols));
    grid.fill(0xffffffff);
    for (const [i, pth] of paths.entries()) {
      const { data, error } = await db.storage.from("art").download(pth);
      if (error || !data) continue;
      const tile = (await Image.decode(new Uint8Array(await data.arrayBuffer()))).resize(cell, ch);
      grid.composite(tile, (i % cols) * cell, Math.floor(i / cols) * ch);
    }
    return json(200, { ok: true, count: paths.length, preview: b64(await grid.encodeJPEG(72)) });
  }

  let src: URL;
  try {
    src = new URL(url);
  } catch {
    return json(400, { ok: false, code: "bad_url" });
  }
  if (src.protocol !== "https:" || !ALLOWED.some((r) => r.test(src.hostname))) return json(400, { ok: false, code: "host_not_allowed" });
  if (typeof path !== "string" || !/^[a-z0-9_\-/]{1,80}$/.test(path)) return json(400, { ok: false, code: "bad_path" });

  const res = await fetch(src);
  if (!res.ok) return json(502, { ok: false, code: "fetch_failed", status: res.status });
  const img = await Image.decode(new Uint8Array(await res.arrayBuffer()));
  const srcSize = { w: img.width, h: img.height };
  const full = img.clone().resize(Math.min(width, img.width), Image.RESIZE_AUTO);
  const jpeg = await full.encodeJPEG(84);
  const { error } = await db.storage.from("art").upload(`${path}.jpg`, jpeg, { contentType: "image/jpeg", upsert: true, cacheControl: "31536000" });
  if (error) return json(500, { ok: false, code: "upload_failed", hint: error.message });
  const thumb = await img.resize(preview, Image.RESIZE_AUTO).encodeJPEG(70);
  return json(200, { ok: true, path: `${path}.jpg`, source: srcSize, stored: { w: full.width, h: full.height, bytes: jpeg.length }, preview: b64(thumb) });
});
