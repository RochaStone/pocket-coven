"use client";
import { MiniWitch } from "@/components/art/Witch";
import { activityById, CHARACTERS, locationById } from "@/lib/game/catalog";
import { MOOD_LABEL, moodFromStats, projectStats } from "@/lib/game/logic";
import { GAME_CONFIG } from "@/lib/game/catalog";
import { Chat, ReactionBar } from "./Chat";
import { useGame } from "./GameContext";

function ago(iso: string, now: number) {
  const m = Math.floor((now - new Date(iso).getTime()) / 60000);
  if (m < 2) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
}

export function CovenView() {
  const { coven, state, go, view, toast, now } = useGame();
  const me = state.character.id;
  const order = CHARACTERS.map((c) => c.id);
  const witches = Object.values(coven.roster).sort((a, b) => order.indexOf(a.id as never) - order.indexOf(b.id as never));
  const myLocation = view.kind === "location" ? view.id : coven.roster[me]?.status?.location_id ?? null;

  return (
    <div className="flex flex-col gap-3 px-3 pb-4">
      <div className="flex items-center justify-between px-1">
        <h1 className="title-script text-2xl text-shell-500">The Coven</h1>
        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${coven.connected ? "bg-lagoon-100 text-[#167a73]" : "bg-shell-100 text-shell-500"}`}>
          {coven.connected ? `${coven.online.size} online` : "Connecting..."}
        </span>
      </div>
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {witches.map((r) => {
          const isMe = r.id === me;
          const online = isMe || coven.online.has(r.id);
          const stats = r.stats ? projectStats(r.stats, r.stats.updated_at, new Date(now), GAME_CONFIG) : null;
          const mood = isMe ? state.mood : stats ? moodFromStats(stats) : "happy";
          const loc = r.status?.location_id ? locationById(r.status.location_id) : null;
          const act = r.status?.activity_id ? activityById(r.status.activity_id) : null;
          const pron = `${r.pronouns.subject}/${r.pronouns.object}`;
          return (
            <li key={r.id} className={`pearl-panel flex items-center gap-3 p-3 ${r.claimed ? "" : "opacity-70"}`}>
              <div className="relative shrink-0">
                <MiniWitch characterId={r.id as never} look={isMe ? state.character.look : r.look} equipped={isMe ? state.equipment : r.equipment} mood={r.claimed ? mood : "sleepy"} size={72} />
                {r.claimed && <span className={`absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full ring-2 ring-white ${online ? "bg-[#34d399]" : "bg-[#d4c4d9]"}`} aria-label={online ? "online" : "offline"} />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-[family-name:var(--font-display)] text-base font-semibold">{r.name}</span>
                  <span className="text-[11px] text-ink/55">{pron}</span>
                </div>
                <p className="text-[11px] font-semibold text-ink/60">{r.title}</p>
                {r.claimed ? (
                  <p className="mt-0.5 text-xs text-ink/75">
                    {MOOD_LABEL[mood]} · {loc ? loc.name : "In the shell"}
                    {online && act && r.status?.activity_at && now - new Date(r.status.activity_at).getTime() < 10 * 60_000 ? `, ${act.name.toLowerCase()}` : ""}
                    {!online && r.status ? ` · seen ${ago(r.status.last_seen_at, now)}` : ""}
                  </p>
                ) : (
                  <p className="mt-0.5 text-xs italic text-ink/60">Awaiting their witch. {state.is_admin ? "Send an invite from Owner." : ""}</p>
                )}
                {r.claimed && !isMe && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <button className="pearl-button ghost !px-2.5 !py-1 text-[11px]" onClick={() => go({ kind: "room", host: r.id })}>
                      Visit room
                    </button>
                    {online && myLocation && (
                      <button
                        className="pearl-button lagoon !px-2.5 !py-1 text-[11px]"
                        onClick={() => {
                          coven.inviteTo(r.id, myLocation, locationById(myLocation)?.name ?? "the shell");
                          toast({ tone: "lagoon", text: `Invitation sent. ${r.name} has been summoned to ${locationById(myLocation)?.name}.` });
                        }}
                      >
                        Invite to {locationById(myLocation)?.name}
                      </button>
                    )}
                    {loc && (
                      <button className="pearl-button ghost !px-2.5 !py-1 text-[11px]" onClick={() => go({ kind: "location", id: loc.id })}>
                        Join {r.pronouns.object}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <section className="pearl-panel p-3">
        <h2 className="title-script mb-1 px-1 text-xl text-lilac-500">Coven chat</h2>
        <ReactionBar />
        <Chat height={300} />
      </section>
    </div>
  );
}
