"use client";
// Web Push for coven alerts: register the service worker, subscribe this device and tell the shell.
import { supabaseBrowser } from "@/lib/supabase/client";

// Public half of the VAPID pair (safe to ship). The private half lives server-side only.
export const VAPID_PUBLIC_KEY = "BJt4_ab1naIW7kmaCueCzA51FYHGOCFxhzYsWyNU6ftmi58414x0vlYGDJyqJX6kENWX9Z-m6zcGhqQYypv2jGE";

export type EnableResult = "unsupported" | "needs_home_screen" | "denied" | "enabled" | "error";
export type DisableResult = "disabled" | "error";
export type AlertPermission = "unsupported" | "default" | "granted" | "denied";

const SW_URL = "/sw.js";

export function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  // iPadOS reports itself as a Mac, so check for touch too.
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const nav = navigator as Navigator & { standalone?: boolean };
  return Boolean(window.matchMedia?.("(display-mode: standalone)").matches || nav.standalone);
}

export function isPushSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export function alertPermission(): AlertPermission {
  if (!isPushSupported()) return "unsupported";
  return Notification.permission;
}

function keyBytes(base64url: string): Uint8Array<ArrayBuffer> {
  const b64 = (base64url + "=".repeat((4 - (base64url.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function sameKey(a: ArrayBuffer | null, b: Uint8Array): boolean {
  if (!a || a.byteLength !== b.length) return false;
  const x = new Uint8Array(a);
  return x.every((v, i) => v === b[i]);
}

function toBase64Url(buf: ArrayBuffer | null): string {
  if (!buf) return "";
  let s = "";
  for (const byte of new Uint8Array(buf)) s += String.fromCharCode(byte);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function registration(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration("/");
  if (!existing) await navigator.serviceWorker.register(SW_URL, { scope: "/", updateViaCache: "none" });
  return navigator.serviceWorker.ready;
}

export async function getSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  try {
    const reg = await navigator.serviceWorker.getRegistration("/");
    return (await reg?.pushManager.getSubscription()) ?? null;
  } catch {
    return null;
  }
}

/** Call from a tap: asks permission, subscribes this device and saves it for the current witch. */
export async function enableAlerts(): Promise<EnableResult> {
  // iPhone and iPad only offer Web Push to apps added to the home screen.
  if (isIos() && !isStandalone()) return "needs_home_screen";
  if (!isPushSupported()) return "unsupported";
  if (Notification.permission === "denied") return "denied";
  try {
    // Ask first, while we are still inside the tap (Safari requires the user gesture).
    const permission = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
    if (permission === "denied") return "denied";
    if (permission !== "granted") return "error";

    const reg = await registration();
    const key = keyBytes(VAPID_PUBLIC_KEY);
    let sub = await reg.pushManager.getSubscription();
    if (sub && !sameKey(sub.options.applicationServerKey, key)) {
      await sub.unsubscribe();
      sub = null;
    }
    if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });

    const { error } = await supabaseBrowser().rpc("save_push_subscription", {
      p_endpoint: sub.endpoint,
      p_p256dh: toBase64Url(sub.getKey("p256dh")),
      p_auth: toBase64Url(sub.getKey("auth")),
    });
    return error ? "error" : "enabled";
  } catch {
    return "error";
  }
}

/** Turns alerts off for this device: forgets it in the shell, then unsubscribes the browser. */
export async function disableAlerts(): Promise<DisableResult> {
  try {
    const sub = await getSubscription();
    if (!sub) return "disabled";
    const { error } = await supabaseBrowser().rpc("remove_push_subscription", { p_endpoint: sub.endpoint });
    await sub.unsubscribe().catch(() => false);
    return error ? "error" : "disabled";
  } catch {
    return "error";
  }
}
