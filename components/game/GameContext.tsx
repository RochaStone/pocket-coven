"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { api, GameError } from "@/lib/game/api";
import { ACHIEVEMENTS, activityById, itemById, locationById } from "@/lib/game/catalog";
import { renderFlavour } from "@/lib/game/logic";
import type { ActivityResult, MyState, SharedEvent } from "@/lib/game/state";
import type { AnimationKey, StatKey } from "@/lib/game/types";
import { useCoven, type ActivityInvite, type Coven } from "./useCoven";

export type View =
  | { kind: "world" }
  | { kind: "kairos" }
  | { kind: "location"; id: string }
  | { kind: "wardrobe" }
  | { kind: "room"; host?: string }
  | { kind: "coven" };

export interface Toast {
  id: string;
  tone: "flavour" | "error" | "gold" | "lagoon";
  text: string;
  chips?: { stat: StatKey | "pearls" | "xp"; delta: number }[];
  action?: { label: string; run: () => void };
}

interface Ctx {
  state: MyState;
  setState: (s: MyState) => void;
  view: View;
  go: (v: View) => void;
  coven: Coven;
  toast: (t: Omit<Toast, "id">) => void;
  toasts: Toast[];
  dismiss: (id: string) => void;
  fail: (e: unknown) => void;
  perform: (activityId: string) => Promise<ActivityResult | null>;
  busy: string | null;
  playing: { animation: AnimationKey; key: string } | null;
  play: (a: AnimationKey, ms?: number) => void;
  treasure: string[] | null;
  showTreasure: (items: string[] | null) => void;
  cooldownLeft: (activityId: string) => number;
  announceAchievements: (ids: string[] | undefined) => void;
  refresh: () => Promise<void>;
  now: number;
}

const GameCtx = createContext<Ctx | null>(null);
export const useGame = () => {
  const c = useContext(GameCtx);
  if (!c) throw new Error("useGame outside provider");
  return c;
};

export function GameProvider({ initial, children }: { initial: MyState; children: React.ReactNode }) {
  // State plus the moment it was fetched, so cooldown badges can count down locally.
  const [bundle, setBundle] = useState(() => ({ state: initial, at: Date.now() }));
  const state = bundle.state;
  const [view, setView] = useState<View>({ kind: "world" });
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [playing, setPlaying] = useState<Ctx["playing"]>(null);
  const [treasure, setTreasure] = useState<string[] | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const lastEvents = useRef<SharedEvent[] | null>(null);

  const setState = useCallback((s: MyState) => setBundle({ state: s, at: Date.now() }), []);

  const dismiss = useCallback((id: string) => setToasts((cur) => cur.filter((t) => t.id !== id)), []);
  const toast = useCallback((t: Omit<Toast, "id">) => {
    const id = crypto.randomUUID();
    setToasts((cur) => [...cur.slice(-1), { ...t, id }]);
    setTimeout(() => dismiss(id), t.action ? 12000 : t.tone === "error" ? 4000 : 4200);
  }, [dismiss]);
  const fail = useCallback((e: unknown) => {
    toast({ tone: "error", text: e instanceof GameError ? e.hint : "Something fizzled. Try again in a moment." });
  }, [toast]);

  const announceAchievements = useCallback((ids: string[] | undefined) => {
    for (const id of ids ?? []) {
      const a = ACHIEVEMENTS.find((x) => x.id === id);
      if (a) toast({ tone: "gold", text: `Achievement unlocked: ${a.name}. ${a.description}` });
    }
  }, [toast]);

  const goRef = useRef<(v: View) => void>(() => {});
  const viewRef = useRef<View>({ kind: "world" });
  useEffect(() => {
    viewRef.current = view;
  }, [view]);
  const coven = useCoven(initial.coven_id, initial.character.id, {
    onInvite: (inv: ActivityInvite) => {
      const from = coven.roster[inv.from]?.name ?? "A witch";
      const loc = locationById(inv.locationId);
      toast({
        tone: "lagoon",
        text: `${from} invites you to ${inv.label} at ${loc?.name ?? "somewhere fabulous"}.`,
        action: { label: "Join", run: () => goRef.current({ kind: "location", id: inv.locationId }) },
      });
    },
    onEventChange: (list) => {
      // Celebrate when an event I joined completes (the host pressed "Begin").
      const prev = lastEvents.current;
      lastEvents.current = list;
      if (!prev) return;
      for (const e of list) {
        const was = prev.find((p) => p.id === e.id);
        if (was && was.status === "gathering" && e.status === "complete" && e.participants.includes(initial.character.id)) {
          api.myState().then(setState).catch(() => {});
          toast({ tone: "gold", text: "The coven ritual is complete. Magic, pearls and a moon gift have landed in your shell." });
        }
      }
    },
  });

  const play = useCallback((animation: AnimationKey, ms = 2600) => {
    const key = crypto.randomUUID();
    setPlaying({ animation, key });
    setTimeout(() => setPlaying((cur) => (cur?.key === key ? null : cur)), ms);
  }, []);

  const go = useCallback((v: View) => {
    setView(v);
    const loc = v.kind === "location" ? v.id : v.kind === "room" ? "palace" : null;
    if (loc) {
      coven.setPresenceLocation(loc);
      api.setLocation(loc).catch(() => {});
    }
  }, [coven]);
  useEffect(() => {
    goRef.current = go;
  }, [go]);

  const perform = useCallback(async (activityId: string) => {
    const act = activityById(activityId);
    if (!act || busy) return null;
    setBusy(activityId);
    try {
      const r = await api.perform(activityId);
      setState(r.state);
      play(r.animation as AnimationKey);
      const me = r.state.character;
      const line = renderFlavour(act.flavour[r.flavour_index] ?? act.flavour[0], me.name, me.pronouns);
      const chips: Toast["chips"] = Object.entries(r.effects)
        .filter(([, v]) => v)
        .map(([stat, delta]) => ({ stat: stat as StatKey, delta: Number(delta) }));
      if (r.pearls_delta) chips.push({ stat: "pearls", delta: r.pearls_delta });
      const friends = r.friends.length ? ` ${r.friends.join(" and ")} cheered from nearby.` : "";
      toast({ tone: "flavour", text: line + friends, chips });
      if (r.loot.length) setTimeout(() => setTreasure(r.loot), 900);
      if (r.xp.leveled_up) toast({ tone: "gold", text: `${me.name} reached level ${r.xp.level}. Sparkle intensifies.` });
      announceAchievements(r.achievements);
      return r;
    } catch (e) {
      fail(e);
      return null;
    } finally {
      setBusy(null);
    }
  }, [busy, setState, play, toast, fail, announceAchievements]);

  const refresh = useCallback(async () => {
    try {
      setState(await api.myState());
    } catch (e) {
      fail(e);
    }
  }, [setState, fail]);

  // Clock for cooldown badges; periodic refresh applies decay; heartbeat keeps "nearby" fresh.
  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000);
    const heartbeat = setInterval(() => {
      const v = viewRef.current;
      const loc = v.kind === "location" ? v.id : null;
      api.setLocation(loc).catch(() => {});
    }, 60_000);
    const refreshTimer = setInterval(() => {
      api.myState().then(setState).catch(() => {});
    }, 5 * 60_000);
    return () => {
      clearInterval(tick);
      clearInterval(heartbeat);
      clearInterval(refreshTimer);
    };
  }, [setState]);

  const cooldownLeft = useCallback(
    (id: string) => {
      const base = state.cooldowns[id];
      if (!base) return 0;
      return Math.max(0, base - Math.floor((now - bundle.at) / 1000));
    },
    [state.cooldowns, now, bundle.at],
  );

  const value = useMemo<Ctx>(
    () => ({
      state, setState, view, go, coven, toast, toasts, dismiss, fail, perform, busy, playing, play,
      treasure, showTreasure: setTreasure, cooldownLeft, announceAchievements, refresh, now,
    }),
    [state, setState, view, go, coven, toast, toasts, dismiss, fail, perform, busy, playing, play, treasure, cooldownLeft, announceAchievements, refresh, now],
  );
  return <GameCtx.Provider value={value}>{children}</GameCtx.Provider>;
}

export const itemName = (id: string) => itemById(id)?.name ?? id;
