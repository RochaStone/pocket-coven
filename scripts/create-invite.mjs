#!/usr/bin/env node
// Mints an invitation with the service-role key (run locally, never deployed).
// Use it once for Rocha (the owner witch); after that the Owner screen mints invites in-app.
//   node --env-file=.env.local scripts/create-invite.mjs rocha [days]
import { createHash, randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const [characterId = "rocha", days = "7"] = process.argv.slice(2);
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (e.g. in .env.local).");
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });
const { data: c, error: ce } = await db.from("characters").select("id, coven_id, owner_user_id").eq("id", characterId).single();
if (ce || !c) {
  console.error(`No witch "${characterId}". Did the seed run?`, ce?.message ?? "");
  process.exit(1);
}
if (c.owner_user_id) {
  console.error(`${characterId} is already claimed.`);
  process.exit(1);
}
const token = randomBytes(24).toString("hex");
const { error } = await db.from("invitations").insert({
  coven_id: c.coven_id,
  character_id: c.id,
  token_hash: createHash("sha256").update(token).digest("hex"),
  expires_at: new Date(Date.now() + Number(days) * 86400_000).toISOString(),
});
if (error) {
  console.error(error.message);
  process.exit(1);
}
console.log(`Invitation for ${characterId} (valid ${days} days, shown once):\n${site}/invite/${token}`);
