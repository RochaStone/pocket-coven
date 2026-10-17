import { redirect } from "next/navigation";
import { AdminPanel } from "@/components/game/AdminPanel";
import { isConfigured, SITE_URL } from "@/lib/supabase/env";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Visibility gate only. Every admin action is re-checked in the database (game.admin_coven()).
export default async function AdminPage() {
  if (!isConfigured()) redirect("/");
  const supabase = await supabaseServer();
  const { data: state } = await supabase.rpc("get_my_state");
  if (!state?.is_admin) redirect("/play");
  return <AdminPanel covenId={state.coven_id} siteUrl={SITE_URL} />;
}
