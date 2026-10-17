"use client";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { SITE_URL } from "@/lib/supabase/env";

// Email magic link plus 6-digit code. The code path works even when the email
// opens in a different browser (common on phones), where PKCE links cannot.
export function SignIn({ next, onSignedIn }: { next: string; onSignedIn: () => void }) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<"email" | "code">("email");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = supabaseBrowser();

  const sendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setWorking(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${SITE_URL}/auth/callback?next=${encodeURIComponent(next)}`, shouldCreateUser: true },
    });
    setWorking(false);
    if (error) setError(error.message);
    else setStage("code");
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setWorking(true);
    setError(null);
    const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: "email" });
    setWorking(false);
    if (error) setError("That code did not match. Check the newest email and try again.");
    else onSignedIn();
  };

  return stage === "email" ? (
    <form onSubmit={sendLink} className="flex w-full flex-col gap-2">
      <label className="text-left text-xs font-bold text-ink/60" htmlFor="email">
        Your email
      </label>
      <input
        id="email"
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="witch@seashell.com"
        className="rounded-full border-2 border-shell-200 bg-white px-4 py-2.5 text-[16px] outline-none focus:border-shell-400"
      />
      <button className="pearl-button" disabled={working}>
        {working ? "Summoning..." : "Send my magic link"}
      </button>
      {error && <p className="text-sm font-semibold text-[#a8343f]">{error}</p>}
    </form>
  ) : (
    <form onSubmit={verify} className="flex w-full flex-col gap-2">
      <p className="text-sm text-ink/75">
        A magic link and a code are on their way to <b>{email}</b>. Tap the link, or type the code here.
      </p>
      <input
        inputMode="numeric"
        autoComplete="one-time-code"
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 10))}
        placeholder="Code from the email"
        className="rounded-full border-2 border-lagoon-300 bg-white px-4 py-2.5 text-center text-[18px] tracking-[0.3em] outline-none focus:border-lagoon-500"
        aria-label="Code from the email"
      />
      <button className="pearl-button lagoon" disabled={working || code.length < 6}>
        {working ? "Checking..." : "Enter the coven"}
      </button>
      <button type="button" className="text-xs font-bold text-ink/50" onClick={() => setStage("email")}>
        Use a different email
      </button>
      {error && <p className="text-sm font-semibold text-[#a8343f]">{error}</p>}
    </form>
  );
}
