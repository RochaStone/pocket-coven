"use client";
import { useState } from "react";
import { MiniWitch } from "@/components/art/Witch";
import { api } from "@/lib/game/api";
import { SHARED_EVENTS } from "@/lib/game/catalog";
import { useGame } from "./GameContext";

// A real multiplayer ceremony: witches gather from their own devices, the host begins, all are rewarded.
export function EventPanel({ kind }: { kind: keyof typeof SHARED_EVENTS }) {
  const { state, coven, toast, fail, setState, showTreasure, play } = useGame();
  const def = SHARED_EVENTS[kind];
  const ev = coven.events.find((e) => e.kind === kind && e.status === "gathering");
  const [working, setWorking] = useState(false);
  const me = state.character.id;
  const joined = ev?.participants.includes(me) ?? false;
  const isHost = ev?.host_character_id === me;

  const run = async (fn: () => Promise<void>) => {
    setWorking(true);
    try {
      await fn();
      await coven.reloadEvents();
    } catch (e) {
      fail(e);
    } finally {
      setWorking(false);
    }
  };

  return (
    <section className="pearl-panel overflow-hidden p-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="title-script text-xl text-lilac-500">{def.name}</h2>
          <p className="text-xs text-ink/65">
            Needs {def.minParticipants}+ witches. Everyone gets +{def.effects.magic} magic, +{def.pearls} pearls and a gift.
          </p>
        </div>
      </div>
      {ev ? (
        <>
          <div className="mt-3 flex flex-wrap items-end gap-2">
            {ev.participants.map((cid) => {
              const r = coven.roster[cid];
              if (!r) return null;
              return (
                <div key={cid} className="flex flex-col items-center">
                  <MiniWitch characterId={cid as never} look={cid === me ? state.character.look : r.look} equipped={cid === me ? state.equipment : r.equipment} mood="magical" size={56} />
                  <span className="text-[10px] font-bold">
                    {r.name}
                    {ev.host_character_id === cid ? " (host)" : ""}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {!joined && (
              <button className="pearl-button lagoon" disabled={working} onClick={() => run(async () => { await api.joinEvent(ev.id); toast({ tone: "lagoon", text: "You joined the circle. Candles flicker approvingly." }); })}>
                Join the circle
              </button>
            )}
            {isHost && (
              <button
                className="pearl-button gold"
                disabled={working || ev.participants.length < def.minParticipants}
                onClick={() =>
                  run(async () => {
                    const r = await api.completeEvent(ev.id);
                    setState(r.state);
                    play(kind === "sound_bath" ? "sound" : "spell", 3200);
                    toast({ tone: "gold", text: "Someone brought champagne to a moon ritual. Nobody is asking questions." });
                    showTreasure([r.rewards.loot]);
                  })
                }
              >
                {ev.participants.length < def.minParticipants ? "Waiting for the coven..." : "Begin the ceremony"}
              </button>
            )}
            {joined && (
              <button className="pearl-button ghost" disabled={working} onClick={() => run(() => api.leaveEvent(ev.id))}>
                Leave
              </button>
            )}
          </div>
          {joined && !isHost && <p className="mt-2 text-xs text-ink/60">Waiting for the host to begin. Stay close.</p>}
        </>
      ) : (
        <button className="pearl-button mt-3" disabled={working} onClick={() => run(async () => { await api.startEvent(kind); })}>
          Light the candles and gather the coven
        </button>
      )}
    </section>
  );
}
