"use client";
import { useState, useSyncExternalStore } from "react";
import { alertPermission, disableAlerts, enableAlerts, isIos, isPushSupported, isStandalone, type AlertPermission } from "@/lib/push";

const DISMISS_KEY = "pocket-coven:alerts-dismissed";
const S = "#6b3a5e";

// ── install prompt (Android / desktop Chrome) ──
// Captured at module load so an early beforeinstallprompt is not missed before the card mounts.
type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };
let installEvent: InstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    installEvent = e as InstallPromptEvent;
    emit();
  });
  window.addEventListener("appinstalled", () => {
    installEvent = null;
    emit();
  });
}
const subscribeInstall = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const useInstallPrompt = () => useSyncExternalStore(subscribeInstall, () => installEvent, () => null);

function readDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

function saveDismissed() {
  try {
    localStorage.setItem(DISMISS_KEY, "1");
  } catch {
    // Storage unavailable (private mode): the card just returns next visit.
  }
}

type Env = { ios: boolean; standalone: boolean; push: boolean };
const readEnv = (): Env =>
  typeof window === "undefined" ? { ios: false, standalone: false, push: false } : { ios: isIos(), standalone: isStandalone(), push: isPushSupported() };

// ── glyphs ──
function BellGlyph({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden fill="none" stroke={S} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 5c-5 0-8 3.6-8 8.5v5L5.5 22h21L24 18.5v-5C24 8.6 21 5 16 5Z" fill="#ffc8e2" />
      <path d="M13 25.5a3 3 0 0 0 6 0" fill="#e9c27a" />
      <ellipse cx="12.5" cy="11" rx="1.8" ry="1.1" fill="#fff" stroke="none" />
      <path d="M26.5 6.5l1.5-1.5M28 10.5h2" stroke="#c9b0ff" />
    </svg>
  );
}

function ShareGlyph({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden fill="none" stroke="#2f7cf6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 9H7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1.5" />
      <path d="M12 3v11M8.5 6.5 12 3l3.5 3.5" />
    </svg>
  );
}

function AddGlyph({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden fill="none" stroke={S} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="4" fill="#fff" />
      <path d="M12 8.5v7M8.5 12h7" />
    </svg>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2.5 rounded-2xl bg-white/80 px-3 py-2 text-sm shadow-[0_2px_0_#f3c3dc]">
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-shell-300 font-display text-xs font-semibold text-white">{n}</span>
      <span className="flex flex-wrap items-center gap-1.5">{children}</span>
    </li>
  );
}

function Shell({ title, children, onDismiss }: { title: string; children: React.ReactNode; onDismiss?: () => void }) {
  return (
    <section className="pearl-panel w-full max-w-[520px] px-4 py-3" aria-label="Coven alerts">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">
          <BellGlyph />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h2 className="title-script text-lg text-lilac-500">{title}</h2>
            {onDismiss && (
              <button type="button" className="text-xs font-semibold text-ink/50 underline-offset-2 hover:underline" onClick={onDismiss}>
                Not now
              </button>
            )}
          </div>
          {children}
        </div>
      </div>
    </section>
  );
}

// Home-screen and push alerts card for the world screen.
export function AlertsCard({ pushEnabled, onChange }: { pushEnabled: boolean; onChange?: (enabled: boolean) => void }) {
  // Only rendered client-side (after the shell opens), so reading the browser at init is safe.
  const [env] = useState<Env>(readEnv);
  const [dismissed, setDismissed] = useState<boolean>(readDismissed);
  const [permission, setPermission] = useState<AlertPermission>(() => (typeof window === "undefined" ? "unsupported" : alertPermission()));
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [working, setWorking] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const install = useInstallPrompt();

  const on = enabled ?? pushEnabled;
  const dismiss = () => {
    saveDismissed();
    setDismissed(true);
  };

  const turnOn = async () => {
    setWorking(true);
    setNote(null);
    const r = await enableAlerts();
    setWorking(false);
    if (r === "enabled") {
      setEnabled(true);
      setPermission("granted");
      onChange?.(true);
    } else if (r === "denied") setPermission("denied");
    else if (r === "needs_home_screen") setNote("Add Pocket Coven to your home screen first, then open it from there.");
    else if (r === "unsupported") setNote("This browser cannot show alerts. Try Chrome, Edge or Safari.");
    else setNote("The shell could not turn alerts on. Try again in a moment.");
  };

  const turnOff = async () => {
    setWorking(true);
    setNote(null);
    const r = await disableAlerts();
    setWorking(false);
    if (r === "disabled") {
      setEnabled(false);
      onChange?.(false);
    } else setNote("The shell could not turn alerts off. Try again in a moment.");
  };

  const addToHome = async () => {
    if (!install) return;
    await install.prompt().catch(() => undefined);
    await install.userChoice.catch(() => undefined);
    installEvent = null;
    emit();
  };

  // (d) alerts on
  if (on) {
    return (
      <section className="pearl-panel flex w-full max-w-[520px] items-center gap-2.5 px-4 py-2" aria-label="Coven alerts">
        <BellGlyph size={22} />
        <p className="flex-1 text-sm font-semibold">Coven alerts are on</p>
        <button type="button" disabled={working} className="text-xs font-semibold text-ink/55 underline underline-offset-2 disabled:opacity-50" onClick={turnOff}>
          Turn off
        </button>
        {note && <p className="sr-only" role="status">{note}</p>}
      </section>
    );
  }

  // (e) blocked in browser settings
  if (permission === "denied") {
    if (dismissed) return null;
    return (
      <Shell title="Alerts are blocked" onDismiss={dismiss}>
        <p className="text-xs text-ink/70">
          {env.ios
            ? "Open Settings, tap Notifications, find Pocket Coven and allow notifications. Then come back here."
            : "Tap the lock or info icon next to the address bar, set Notifications to Allow, then reload the shell."}
        </p>
      </Shell>
    );
  }

  if (dismissed) return null;

  // (a) iPhone or iPad in Safari: install first
  if (env.ios && !env.standalone) {
    return (
      <Shell title="Keep the coven in your pocket">
        <p className="mb-2 text-xs text-ink/70">Add Pocket Coven to your home screen to open it like an app and get coven alerts.</p>
        <ol className="flex flex-col gap-1.5">
          <Step n={1}>
            Tap the Share button <ShareGlyph />
          </Step>
          <Step n={2}>
            then <span className="inline-flex items-center gap-1 font-semibold"><AddGlyph size={18} /> Add to Home Screen</span>
          </Step>
        </ol>
        <div className="mt-2.5 flex justify-end">
          <button type="button" className="pearl-button !px-4 !py-1.5 text-sm" onClick={dismiss}>
            Got it
          </button>
        </div>
      </Shell>
    );
  }

  // (c) push-capable (installed or a desktop / Android browser)
  if (env.push) {
    return (
      <Shell title="Turn on coven alerts" onDismiss={dismiss}>
        <p className="text-xs text-ink/70">Gifts, rituals and when your witch misses you. Never more than a few a day.</p>
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <button type="button" disabled={working} className="pearl-button !px-4 !py-1.5 text-sm" onClick={turnOn}>
            {working ? "Asking the shell..." : "Turn on coven alerts"}
          </button>
          {install && !env.standalone && (
            <button type="button" className="pearl-button ghost inline-flex items-center gap-1.5 !px-3 !py-1.5 text-sm" onClick={addToHome}>
              <AddGlyph size={18} /> Add to home screen
            </button>
          )}
        </div>
        {note && (
          <p className="mt-1.5 text-xs text-coral-400" role="status">
            {note}
          </p>
        )}
      </Shell>
    );
  }

  // (b) no push here, but the browser offers an install
  if (install && !env.standalone) {
    return (
      <Shell title="Keep the coven in your pocket" onDismiss={dismiss}>
        <p className="text-xs text-ink/70">Open Pocket Coven like an app, straight from your home screen.</p>
        <button type="button" className="pearl-button mt-2.5 inline-flex items-center gap-1.5 !px-4 !py-1.5 text-sm" onClick={addToHome}>
          <AddGlyph size={18} /> Add Pocket Coven to your home screen
        </button>
      </Shell>
    );
  }

  return null;
}
