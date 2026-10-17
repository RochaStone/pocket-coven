"use client";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { FUNCTIONS_URL, SUPABASE_ANON_KEY } from "@/lib/supabase/env";

const field =
  "rounded-full border-2 border-shell-200 bg-white px-4 py-2.5 text-[16px] outline-none focus:border-shell-400";

// Email + password. With an invite token, "create" mode first makes a confirmed account
// via the claim-account edge function (no email round trip), then signs in.
export function SignIn({ onSignedIn, inviteToken }: { onSignedIn: () => void; inviteToken?: string }) {
  const [mode, setMode] = useState<"create" | "signin">(inviteToken ? "create" : "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = supabaseBrowser();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWorking(true);
    setError(null);
    try {
      if (mode === "create" && inviteToken) {
        const res = await fetch(`${FUNCTIONS_URL}/claim-account`, {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY },
          body: JSON.stringify({ token: inviteToken, email: email.trim(), password }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok || !body.ok) {
          if (body.code === "account_exists") setMode("signin");
          setError(body.hint ?? "Something fizzled. Try again.");
          return;
        }
      }
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) {
        setError(mode === "signin" ? "That email and password do not match." : "Your login was made but sign-in fizzled. Try signing in.");
        if (mode !== "signin") setMode("signin");
        return;
      }
      onSignedIn();
    } catch {
      setError("The shell lost its signal. Check your connection and try again.");
    } finally {
      setWorking(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex w-full flex-col gap-2 text-left">
      <p className="text-center text-sm font-semibold text-ink/75">
        {mode === "create" ? "Choose your coven login. You will use it every time you come back." : "Welcome back, witch."}
      </p>
      <label className="text-xs font-bold text-ink/60" htmlFor="email">
        Email
      </label>
      <input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="witch@seashell.com" className={field} />
      <label className="text-xs font-bold text-ink/60" htmlFor="password">
        {mode === "create" ? "Choose a password (8+ characters)" : "Password"}
      </label>
      <input
        id="password"
        type="password"
        required
        minLength={mode === "create" ? 8 : 1}
        autoComplete={mode === "create" ? "new-password" : "current-password"}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className={field}
      />
      <button className="pearl-button mt-1" disabled={working}>
        {working ? "Opening the shell..." : mode === "create" ? "Create my login" : "Enter the coven"}
      </button>
      {inviteToken && (
        <button type="button" className="text-center text-xs font-bold text-ink/55" onClick={() => { setMode(mode === "create" ? "signin" : "create"); setError(null); }}>
          {mode === "create" ? "Already have a coven login? Sign in" : "New here? Create a login"}
        </button>
      )}
      {error && <p className="text-center text-sm font-semibold text-[#a8343f]">{error}</p>}
      {!inviteToken && <p className="text-center text-xs text-ink/55">Forgot your password? Tell Rocha and she will sort it.</p>}
    </form>
  );
}
