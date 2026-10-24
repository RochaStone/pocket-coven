// Creates a ready-to-use (email-confirmed) account for someone holding a valid, unclaimed invite.
// This lets witches sign up with a password straight from their invite link, with no email round trip.
// It never claims the witch itself: the browser signs in and calls claim_invite as that user.
import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const reply = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

const fail = (status: number, code: string, hint: string) => reply(status, { ok: false, code, hint });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return fail(405, "method", "Use POST.");

  let body: { token?: unknown; email?: unknown; password?: unknown };
  try {
    body = await req.json();
  } catch {
    return fail(400, "bad_request", "Something fizzled. Try again.");
  }
  const token = typeof body.token === "string" ? body.token : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!/^[0-9a-f]{48}$/.test(token)) return fail(400, "invite_invalid", "That invitation link is not valid.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) return fail(400, "bad_email", "That email does not look right.");
  if (password.length < 8 || password.length > 72) return fail(400, "bad_password", "Choose a password of at least 8 characters.");

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: peek, error: peekErr } = await admin.rpc("peek_invite", { p_token: token });
  if (peekErr) return fail(500, "server", "The shell could not check that invitation. Try again.");
  if (!peek?.valid) return fail(400, "invite_invalid", "That invitation has expired, been used or been revoked. Ask the coven owner for a new one.");

  const { error: createErr } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (!createErr) return reply(200, { ok: true, created: true });

  // The email already has an account (for example from an earlier magic-link attempt).
  // Only adopt it if it has no witch yet, so an invite can never take over a coven member's account.
  const { data: users, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (listErr) return fail(500, "server", "The shell could not finish creating your account. Try again.");
  const existing = users.users.find((u) => u.email?.toLowerCase() === email);
  if (!existing) return fail(400, "create_failed", "That account could not be created. Try a different email.");
  const { data: owned, error: ownedErr } = await admin.from("characters").select("id").eq("owner_user_id", existing.id).limit(1);
  if (ownedErr) return fail(500, "server", "The shell could not finish creating your account. Try again.");
  if (owned.length > 0) return fail(409, "account_exists", "This email already has a witch. Sign in with your password instead.");
  const { error: updErr } = await admin.auth.admin.updateUserById(existing.id, { password, email_confirm: true });
  if (updErr) return fail(500, "server", "The shell could not finish creating your account. Try again.");
  return reply(200, { ok: true, created: false });
});
