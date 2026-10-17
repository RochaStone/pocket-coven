"use client";
import { useEffect, useMemo, useState } from "react";
import { KairosMap } from "@/components/art/KairosMap";
import { ShellCompact, ShellNightSky } from "@/components/art/ShellCompact";
import { WorldMap } from "@/components/art/WorldMap";
import { MiniWitch } from "@/components/art/Witch";
import { LOCATIONS } from "@/lib/game/catalog";
import { moodFromStats } from "@/lib/game/logic";
import { useGame } from "./GameContext";
import { AlertsCard } from "./AlertsCard";
import { GiftsWaiting } from "./Gifts";
import { CovenGoalCard, OracleDraw } from "./Rituals";
import { Tutorial } from "./Tutorial";
import { play } from "@/lib/sound";

// Small avatars of every witch at their last known location (online or not).
export function useOccupants(world: "shell" | "kairos") {
  const { coven, state } = useGame();
  return useMemo(() => {
    const out: Record<string, React.ReactNode[]> = {};
    for (const r of Object.values(coven.roster)) {
      if (!r.claimed || !r.status?.location_id) continue;
      const loc = LOCATIONS.find((l) => l.id === r.status!.location_id);
      if (!loc || loc.world !== world) continue;
      const isMe = r.id === state.character.id;
      const online = coven.online.has(r.id) || isMe;
      const look = isMe ? state.character.look : r.look;
      const eq = isMe ? state.equipment : r.equipment;
      const mood = isMe ? state.mood : r.stats ? moodFromStats(r.stats) : "happy";
      (out[loc.id] ??= []).push(
        <span key={r.id} className={`inline-block ${online ? "" : "opacity-60 grayscale-[40%]"}`} title={`${r.name}${online ? "" : " (away)"}`}>
          <MiniWitch characterId={r.id as never} look={look} equipped={eq} mood={mood} size={40} />
        </span>,
      );
    }
    return out;
  }, [coven.roster, coven.online, state, world]);
}

export function WorldView() {
  const { go, state, setGiftsOpen, refresh } = useGame();
  const [open, setOpen] = useState(false);
  const occupants = useOccupants("shell");
  useEffect(() => {
    // The shell opens itself on arrival; tapping the lid closes it again.
    const t = setTimeout(() => setOpen(true), 450);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="flex flex-col items-center gap-3 px-3 pb-4">
      <div className="relative flex w-full justify-center overflow-hidden rounded-[32px] px-1 py-4">
        <ShellNightSky />
        <ShellCompact open={open} onToggle={() => { play("shell"); setOpen((o) => !o); }}>
          <WorldMap
            onSelect={(id) => (id === "kairos" ? go({ kind: "kairos" }) : go({ kind: "location", id }))}
            occupants={occupants}
          />
        </ShellCompact>
      </div>
      {open && (
        <>
          <GiftsWaiting onOpen={() => setGiftsOpen(true)} />
          <Tutorial />
          <OracleDraw />
          <CovenGoalCard />
          <AlertsCard pushEnabled={state.push_enabled} onChange={() => refresh()} />
        </>
      )}
    </div>
  );
}

export function KairosView() {
  const { go } = useGame();
  const occupants = useOccupants("kairos");
  return (
    <div className="px-3 pb-4">
      <KairosMap onSelect={(id) => go({ kind: "location", id })} onBack={() => go({ kind: "world" })} occupants={occupants} />
    </div>
  );
}
