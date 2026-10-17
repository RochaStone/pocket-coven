import { redirect } from "next/navigation";
import Game from "@/components/game/Game";
import type { MyState } from "@/lib/game/state";
import { isConfigured } from "@/lib/supabase/env";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PlayPage({ searchParams }: { searchParams: Promise<{ go?: string }> }) {
  const { go } = await searchParams;
  if (!isConfigured()) redirect("/");
  const supabase = await supabaseServer();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) redirect("/");
  const { data, error } = await supabase.rpc("get_my_state");
  if (error || !data) redirect("/");
  return <Game initial={data as MyState} go={go} />;
}
