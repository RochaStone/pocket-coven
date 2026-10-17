"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ShellCompact, ShellNightSky } from "@/components/art/ShellCompact";
import { Sparkles } from "@/components/art/Sparkles";
import { Witch } from "@/components/art/Witch";
import { CHARACTERS } from "@/lib/game/catalog";
import { supabaseBrowser } from "@/lib/supabase/client";
import { SignIn } from "./SignIn";

export function Splash({ configured, signedIn, characterName, authError }: { configured: boolean; signedIn: boolean; characterName: string | null; authError: string | null }) {
  const [open, setOpen] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const router = useRouter();
  return (
    <main className="relative flex min-h-dvh flex-col items-center px-4 pb-10 pt-[max(env(safe-area-inset-top),24px)]">
      <ShellNightSky className="!fixed -z-20" />
      <Sparkles count={30} className="pointer-events-none fixed inset-0 -z-10" />
      <h1 className="text-center">
        <span className="title-script block text-[17px] tracking-wide text-lilac-300">Rocha&apos;s</span>
        <span className="block font-[family-name:var(--font-display)] text-[40px] font-bold leading-none text-shell-500 drop-shadow-[0_3px_0_#fff]">Pocket Coven</span>
        <span className="mt-1 block text-xs font-bold uppercase tracking-[0.25em] text-lagoon-300">Baby Merwitch Edition</span>
      </h1>
      <div className="mt-4 w-full max-w-[520px]">
        <ShellCompact open={open} onToggle={() => setOpen((o) => !o)}>
          <div className="flex h-full flex-col items-center justify-center gap-3 p-4 text-center">
            <div className="flex items-end justify-center -space-x-5">
              {CHARACTERS.map((c, i) => (
                <div key={c.id} style={{ zIndex: c.id === "rocha" ? 10 : 5 - Math.abs(2 - i) }}>
                  <Witch characterId={c.id} look={c.look} equipped={c.equipped} mood={c.id === "rocha" ? "thriving" : "happy"} size={c.id === "rocha" ? 128 : 96} />
                </div>
              ))}
            </div>
            <p className="max-w-xs text-sm font-semibold text-ink/80">Five witches. One pocket-sized seashell world. Strawberry iced matcha, moon rituals and a members&apos; club by the lagoon.</p>
            {!configured ? (
              <p className="rounded-2xl bg-white/80 p-3 text-xs">The coven&apos;s database is not connected yet. See README: set the Supabase environment variables.</p>
            ) : characterName ? (
              <button className="pearl-button" onClick={() => router.push("/play")}>
                Return to {characterName}&apos;s world
              </button>
            ) : signedIn ? (
              <div className="space-y-2 text-sm">
                <p className="font-semibold">You are signed in, but no witch is linked to this email yet.</p>
                <p className="text-ink/70">Open the invitation link you were sent to claim your witch.</p>
                <button className="text-xs font-bold text-shell-500" onClick={async () => { await supabaseBrowser().auth.signOut(); router.refresh(); }}>
                  Sign out
                </button>
              </div>
            ) : signingIn ? (
              <div className="w-full max-w-xs">
                <SignIn next="/play" onSignedIn={() => { router.push("/play"); router.refresh(); }} />
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <button className="pearl-button" onClick={() => setSigningIn(true)}>
                  Enter the Coven
                </button>
                <p className="text-xs text-ink/60">New witch? Open the invitation link you were sent.</p>
              </div>
            )}
            {authError && <p className="text-sm font-semibold text-[#a8343f]">{authError}</p>}
          </div>
        </ShellCompact>
      </div>
      {!open && <p className="mt-4 animate-pulse text-sm font-bold text-shell-200">Tap the shell to open</p>}
    </main>
  );
}
