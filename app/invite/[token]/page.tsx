import { InviteClaim } from "@/components/game/InviteClaim";
import { isConfigured } from "@/lib/supabase/env";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!isConfigured()) return <p className="p-8 text-center">The coven database is not connected yet.</p>;
  const supabase = await supabaseServer();
  const [{ data: peek }, { data: user }] = await Promise.all([supabase.rpc("peek_invite", { p_token: token }), supabase.auth.getUser()]);
  return <InviteClaim token={token} peek={peek} signedIn={Boolean(user.user)} />;
}
