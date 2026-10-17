"use client";
import { AnimatePresence, motion } from "motion/react";
import { useMemo } from "react";
import { ActivityProp } from "@/components/art/ActivityProp";
import { LocationScene } from "@/components/art/LocationScene";
import { JoinRipple } from "@/components/art/Sparkles";
import { Sticker as StickerArt } from "@/components/art/Sticker";
import { Witch } from "@/components/art/Witch";
import { ACTIVITIES, locationById, SHARED_EVENTS } from "@/lib/game/catalog";
import { formatSeconds, moodFromStats, moodLine } from "@/lib/game/logic";
import type { AnimationKey } from "@/lib/game/types";
import { Chat, ReactionBar } from "./Chat";
import { EventPanel } from "./EventPanel";
import { useGame } from "./GameContext";
import { NavIcon } from "./Icons";

const PRESENT_WINDOW_MS = 5 * 60_000;

export function LocationView({ id }: { id: string }) {
  const { state, go, perform, busy, playing, cooldownLeft, coven, now } = useGame();
  const loc = locationById(id);
  const me = state.character;
  const activities = ACTIVITIES.filter((a) => a.locationId === id && !(a.adultOnly && me.baby_aesthetic));
  const eventKind = (Object.entries(SHARED_EVENTS).find(([, e]) => e.locationId === id)?.[0] ?? null) as keyof typeof SHARED_EVENTS | null;

  // Other witches here: online and here now, or here within the last few minutes.
  const others = useMemo(
    () =>
      Object.values(coven.roster).filter(
        (r) =>
          r.id !== me.id &&
          r.claimed &&
          r.status?.location_id === id &&
          (coven.online.has(r.id) || now - new Date(r.status.last_seen_at).getTime() < PRESENT_WINDOW_MS),
      ),
    [coven.roster, coven.online, id, me.id, now],
  );

  const hotspots = activities.map((a) => {
    const left = cooldownLeft(a.id);
    return { id: a.id, label: a.name, x: a.spot.x, y: a.spot.y, disabled: left > 0 || busy !== null, badge: left > 0 ? formatSeconds(left) : undefined };
  });

  const reactionFor = (cid: string) => coven.reactions.filter((r) => r.from === cid).slice(-1)[0];
  const myAction = playing?.animation ?? null;
  const othersAction = (activityId: string | null, at: string | null): AnimationKey | null => {
    if (!activityId || !at || now - new Date(at).getTime() > 4000) return null;
    return (ACTIVITIES.find((a) => a.id === activityId)?.animation ?? null) as AnimationKey | null;
  };

  return (
    <div className="flex flex-col gap-3 px-3 pb-4">
      <div className="flex items-center gap-2">
        <button
          className="pearl-button ghost !px-2.5 !py-1.5"
          onClick={() => go(loc?.world === "kairos" ? { kind: "kairos" } : { kind: "world" })}
          aria-label="Back"
        >
          <NavIcon name="back" size={20} />
        </button>
        <div className="min-w-0">
          <h1 className="font-[family-name:var(--font-display)] text-xl font-semibold leading-tight text-shell-500">{loc?.name}</h1>
          <p className="truncate text-xs text-ink/60">{loc?.blurb}</p>
        </div>
      </div>

      <LocationScene locationId={id} hotspots={hotspots} onHotspot={(aid) => perform(aid)}>
        <div className="pointer-events-none absolute inset-x-0 bottom-[4%] flex items-end justify-center gap-1">
          <AnimatePresence>
            {others.map((r) => {
              const online = coven.online.has(r.id);
              const rx = reactionFor(r.id);
              return (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ opacity: online ? 1 : 0.55, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="relative flex flex-col items-center"
                >
                  <JoinRipple />
                  {rx && <FloatingSticker sticker={rx.sticker} key={rx.key} />}
                  <Witch characterId={r.id as never} look={r.look} equipped={r.equipment} mood={r.stats ? moodFromStats(r.stats) : "happy"} size={92} action={othersAction(r.status?.activity_id ?? null, r.status?.activity_at ?? null)} />
                  <span className="-mt-1 rounded-full bg-white/85 px-2 text-[10px] font-bold">{r.name}</span>
                </motion.div>
              );
            })}
          </AnimatePresence>
          <div className="relative flex flex-col items-center">
            {reactionFor(me.id) && <FloatingSticker sticker={reactionFor(me.id)!.sticker} key={reactionFor(me.id)!.key} />}
            <AnimatePresence>
              {myAction && (
                <motion.div key={playing!.key} className="absolute -right-10 bottom-16 z-10" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.7 }}>
                  <ActivityProp animation={myAction} size={84} />
                </motion.div>
              )}
            </AnimatePresence>
            <Witch characterId={me.id as never} look={me.look} equipped={state.equipment} mood={state.mood} size={others.length > 2 ? 110 : 140} action={myAction} />
            <span className="-mt-1 rounded-full bg-shell-400 px-2 text-[10px] font-bold text-white">{me.name}</span>
          </div>
        </div>
      </LocationScene>

      <p className="pearl-panel px-4 py-2 text-center text-sm font-semibold text-ink/80">{moodLine(me.name, me.pronouns, state.mood)}</p>

      {eventKind && <EventPanel kind={eventKind} />}

      {id === "lounge" && (
        <section className="pearl-panel p-3">
          <ReactionBar />
          <Chat height={260} />
        </section>
      )}
      {id !== "lounge" && others.length > 0 && <ReactionBar />}

      <ul className="grid grid-cols-2 gap-2">
        {activities.map((a) => {
          const left = cooldownLeft(a.id);
          return (
            <li key={a.id}>
              <button
                onClick={() => perform(a.id)}
                disabled={left > 0 || busy !== null}
                className="pearl-panel flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left disabled:opacity-60"
              >
                <span className="text-sm font-bold leading-tight">{a.name}</span>
                <span className="text-[11px] text-ink/60">
                  {left > 0 ? `Ready in ${formatSeconds(left)}` : a.pearls < 0 ? `${-a.pearls} pearls` : a.pearls > 0 ? `Earn ${a.pearls} ${a.pearls === 1 ? "pearl" : "pearls"}` : "Free"}
                  {a.loot?.length ? " · treasure chance" : ""}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function FloatingSticker({ sticker }: { sticker: Parameters<typeof StickerArt>[0]["sticker"] }) {
  return (
    <motion.div className="absolute -top-8 z-20" initial={{ opacity: 0, y: 10, scale: 0.5 }} animate={{ opacity: [0, 1, 1, 0], y: -30, scale: 1 }} transition={{ duration: 2.4 }}>
      <StickerArt sticker={sticker} size={48} />
    </motion.div>
  );
}
