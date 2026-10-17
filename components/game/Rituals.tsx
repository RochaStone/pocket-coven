"use client";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { ItemIcon } from "@/components/art/ItemIcon";
import { MoonPhase } from "@/components/art/MoonPhase";
import { OracleCard } from "@/components/art/OracleCard";
import { api } from "@/lib/game/api";
import { ORACLE_CARDS } from "@/lib/game/catalog";
import type { CovenGoal } from "@/lib/game/state";
import { play } from "@/lib/sound";
import { useGame } from "./GameContext";
import { NavIcon, PearlIcon } from "./Icons";
import { markTutorial } from "./Tutorial";

const cardById = (id: string | null) => ORACLE_CARDS.find((c) => c.id === id) ?? null;

// Daily oracle: one card a day, a little magic, and an easy share to the lounge.
export function OracleDraw() {
  const { state, setState, fail, toast, coven, announceAchievements } = useGame();
  const [open, setOpen] = useState(false);
  const [revealed, setRevealed] = useState(Boolean(state.oracle_today));
  const [cardId, setCardId] = useState<string | null>(state.oracle_today);
  const [working, setWorking] = useState(false);
  const [shared, setShared] = useState(false);
  const card = cardById(cardId);

  const draw = async () => {
    setWorking(true);
    try {
      const r = await api.drawOracle();
      setCardId(r.card_id);
      setState(r.state);
      announceAchievements(r.achievements);
      play("oracle");
      setTimeout(() => setRevealed(true), 250);
      if (r.new) toast({ tone: "flavour", text: "The cards have spoken. +8 magic.", chips: [{ stat: "magic", delta: 8 }, { stat: "joy", delta: 4 }] });
    } catch (e) {
      fail(e);
    } finally {
      setWorking(false);
    }
  };

  const share = async () => {
    if (!card) return;
    try {
      const m = await api.chat("text", `drew ${card.name} today: "${card.message}"`);
      coven.pushLocalMessage(m);
      setShared(true);
      markTutorial("lounge");
      toast({ tone: "lagoon", text: "Shared with the coven lounge." });
    } catch (e) {
      fail(e);
    }
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="pearl-panel flex w-full max-w-[520px] items-center gap-3 px-4 py-3 text-left">
        <OracleCard cardId={cardId ?? "pearl"} revealed={Boolean(state.oracle_today)} size={44} />
        <span className="flex-1">
          <span className="block font-bold text-lilac-500">{state.oracle_today ? `Today's card: ${cardById(state.oracle_today)?.name}` : "Draw today's oracle card"}</span>
          <span className="text-xs text-ink/60">{state.oracle_today ? "Tap to read it again." : "One card a day. A little magic for whoever draws it."}</span>
        </span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-50 grid place-items-center bg-[#2a1846]/60 p-5 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)}>
            <motion.div className="pearl-panel w-full max-w-sm p-5 text-center" initial={{ scale: 0.9 }} animate={{ scale: 1 }} onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <p className="title-script text-2xl text-lilac-500">The daily oracle</p>
                <button onClick={() => setOpen(false)} aria-label="Close"><NavIcon name="close" size={22} /></button>
              </div>
              <div className="my-3 flex justify-center">
                <OracleCard cardId={cardId ?? "pearl"} revealed={revealed} size={190} />
              </div>
              {revealed && card ? (
                <>
                  <p className="font-[family-name:var(--font-display)] text-xl font-semibold text-shell-500">{card.name}</p>
                  <p className="mt-1 text-sm leading-relaxed text-ink/80">{card.message}</p>
                  <button className="pearl-button lagoon mt-4" onClick={share} disabled={shared}>
                    {shared ? "Shared with the coven" : "Share with the coven"}
                  </button>
                </>
              ) : (
                <button className="pearl-button mt-2" onClick={draw} disabled={working}>
                  {working ? "Shuffling..." : "Draw my card"}
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Weekly shared goal everyone fills together.
export function CovenGoalCard() {
  const { now, coven } = useGame();
  const [goal, setGoal] = useState<CovenGoal | null>(null);
  const load = useCallback(() => {
    api.covenGoal().then(setGoal).catch(() => {});
  }, []);
  useEffect(() => {
    load();
    const t = setInterval(load, 45_000);
    return () => clearInterval(t);
  }, [load, coven.chat.length]);
  if (!goal) return null;
  const pct = Math.min(100, (goal.progress / goal.target) * 100);
  const daysLeft = Math.max(0, Math.ceil((new Date(goal.ends_at).getTime() - now) / 86_400_000));
  return (
    <section className="pearl-panel w-full max-w-[520px] px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-lagoon-500">This week&apos;s coven goal</p>
          <p className="font-[family-name:var(--font-display)] text-lg font-semibold leading-tight">{goal.name}</p>
          <p className="text-xs text-ink/60">{goal.description}</p>
        </div>
        <div className="flex shrink-0 flex-col items-center">
          <ItemIcon itemId={goal.reward.itemId} size={40} />
          <span className="flex items-center gap-0.5 text-[10px] font-bold text-champagne-600">+<PearlIcon size={11} />{goal.reward.pearls}</span>
        </div>
      </div>
      <div className="mt-2 h-3 overflow-hidden rounded-full bg-white ring-1 ring-lagoon-300">
        <motion.div className="h-full rounded-full bg-gradient-to-r from-lagoon-300 to-lagoon-500" initial={false} animate={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1 text-[11px] font-semibold text-ink/60">
        {goal.completed_at ? "Complete. Everyone earned a Coven Charm." : `${goal.progress} of ${goal.target} · ${daysLeft} day${daysLeft === 1 ? "" : "s"} left · rewards for every witch`}
      </p>
    </section>
  );
}

// Shown on the Moon Deck: the real moon, and when the next ceremony opens.
export function MoonStatus() {
  const { state } = useGame();
  const synodic = 29.530588853;
  const toFull = ((0.5 - state.moon.phase + 1) % 1) * synodic;
  const toNew = ((1 - state.moon.phase) % 1) * synodic;
  const label = state.moon.window === "full" ? "The moon is full tonight" : state.moon.window === "new" ? "It is a new moon" : toFull < toNew ? `Full moon in ${Math.ceil(toFull)} days` : `New moon in ${Math.ceil(toNew)} days`;
  return (
    <section className="pearl-panel flex items-center gap-3 px-4 py-3">
      <MoonPhase phase={state.moon.phase} size={64} />
      <div>
        <p className="font-[family-name:var(--font-display)] text-lg font-semibold text-lilac-500">{label}</p>
        <p className="text-xs text-ink/65">
          {state.moon.window ? "A once-a-cycle ceremony is open below. It needs two witches or more." : "Moon ceremonies open for about three nights around each full and new moon. You will get an alert."}
        </p>
      </div>
    </section>
  );
}
