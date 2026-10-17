"use client";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { ItemIcon } from "@/components/art/ItemIcon";
import { Sparkles } from "@/components/art/Sparkles";
import { api } from "@/lib/game/api";
import { itemById } from "@/lib/game/catalog";
import type { MyState } from "@/lib/game/state";
import { CovenView } from "./CovenView";
import { GameProvider, useGame, type View } from "./GameContext";
import { GiftComposer, GiftInbox } from "./Gifts";
import { locationById } from "@/lib/game/catalog";
import { Dock, Hud, Toasts, TreasureModal } from "./Hud";
import { PearlIcon } from "./Icons";
import { LocationView } from "./LocationView";
import { RoomView } from "./RoomView";
import { markTutorial } from "./Tutorial";
import { Wardrobe } from "./Wardrobe";
import { KairosView, WorldView } from "./WorldView";

export default function Game({ initial, go }: { initial: MyState; go?: string }) {
  const initialView: View | undefined = !go || go === "gifts" ? undefined : go === "kairos" ? { kind: "kairos" } : locationById(go) ? { kind: "location", id: go } : undefined;
  return (
    <GameProvider initial={initial} initialView={initialView}>
      <GiftsOnArrival open={go === "gifts"} />
      <Shell />
    </GameProvider>
  );
}

function Shell() {
  const { view } = useGame();
  useEffect(() => {
    if (view.kind === "kairos") markTutorial("kairos");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [view]);
  const key = view.kind === "location" ? `loc-${view.id}` : view.kind === "room" ? `room-${view.host ?? "me"}` : view.kind;
  return (
    <div className="relative mx-auto flex min-h-dvh max-w-[560px] flex-col">
      <Sparkles count={18} className="pointer-events-none fixed inset-0 -z-10" />
      <div className="sticky top-0 z-30">
        <Hud />
      </div>
      <main className="flex-1 pt-3">
        <AnimatePresence mode="wait">
          <motion.div key={key} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }}>
            {view.kind === "world" && <WorldView />}
            {view.kind === "kairos" && <KairosView />}
            {view.kind === "location" && <LocationView id={view.id} />}
            {view.kind === "wardrobe" && <Wardrobe />}
            {view.kind === "room" && <RoomView host={view.host} />}
            {view.kind === "coven" && <CovenView />}
          </motion.div>
        </AnimatePresence>
      </main>
      <div className="sticky bottom-0 z-30">
        <Dock />
      </div>
      <Toasts />
      <TreasureModal />
      <DailyReward />
      <GiftSheets />
    </div>
  );
}

function GiftsOnArrival({ open }: { open: boolean }) {
  const { setGiftsOpen } = useGame();
  useEffect(() => {
    if (open) setGiftsOpen(true);
  }, [open, setGiftsOpen]);
  return null;
}

function GiftSheets() {
  const { giftsOpen, setGiftsOpen, composeTo, setComposeTo } = useGame();
  return (
    <AnimatePresence>
      {giftsOpen && <GiftInbox key="inbox" onClose={() => setGiftsOpen(false)} />}
      {composeTo && <GiftComposer key="compose" to={composeTo} onClose={() => setComposeTo(null)} />}
    </AnimatePresence>
  );
}

function DailyReward() {
  const { state, setState, fail, announceAchievements } = useGame();
  const [dismissed, setDismissed] = useState(false);
  const [result, setResult] = useState<{ pearls: number; loot: string[] } | null>(null);
  const [working, setWorking] = useState(false);
  const show = (state.daily_available && !dismissed) || result !== null;
  const claim = async () => {
    setWorking(true);
    try {
      const r = await api.claimDaily();
      setState(r.state);
      if (r.ok) {
        setResult({ pearls: r.pearls_delta ?? 0, loot: r.loot ?? [] });
        announceAchievements(r.achievements);
      } else setDismissed(true);
    } catch (e) {
      fail(e);
      setDismissed(true);
    } finally {
      setWorking(false);
    }
  };
  return (
    <AnimatePresence>
      {show && (
        <motion.div className="fixed inset-0 z-50 grid place-items-center bg-[#4a2a4f]/35 p-6 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="pearl-panel w-full max-w-sm p-6 text-center" initial={{ scale: 0.85, y: 20 }} animate={{ scale: 1, y: 0 }}>
            {result ? (
              <>
                <p className="title-script text-2xl text-shell-500">The tide brought gifts</p>
                <div className="my-4 flex items-center justify-center gap-4">
                  <div className="flex flex-col items-center">
                    <PearlIcon size={56} />
                    <span className="font-bold">+{result.pearls} pearls</span>
                  </div>
                  {result.loot.map((id) => (
                    <div key={id} className="flex flex-col items-center">
                      <ItemIcon itemId={id} size={64} />
                      <span className="text-sm font-bold">{itemById(id)?.name}</span>
                    </div>
                  ))}
                </div>
                <button className="pearl-button" onClick={() => { setResult(null); setDismissed(true); }}>
                  Lovely, thank you
                </button>
              </>
            ) : (
              <>
                <p className="title-script text-2xl text-shell-500">Welcome back, {state.character.name}</p>
                <p className="mt-2 text-sm text-ink/75">Your daily pearls washed up overnight, along with a little something from the sea.</p>
                <button className="pearl-button gold mt-5" disabled={working} onClick={claim}>
                  Collect daily gift
                </button>
                <button className="mt-3 block w-full text-xs font-bold text-ink/50" onClick={() => setDismissed(true)}>
                  Later
                </button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
