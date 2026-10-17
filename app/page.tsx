import { Splash } from "@/components/game/Splash";
import { isConfigured } from "@/lib/supabase/env";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  let signedIn = false;
  let character: { name: string } | null = null;
  if (isConfigured()) {
    const supabase = await supabaseServer();
    const { data } = await supabase.auth.getUser();
    signedIn = Boolean(data.user);
    if (data.user) {
      const { data: c } = await supabase.from("characters").select("name").eq("owner_user_id", data.user.id).maybeSingle();
      character = c;
    }
  }
  return <Splash configured={isConfigured()} signedIn={signedIn} characterName={character?.name ?? null} authError={params.auth_error ?? null} />;
}
