"use client";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { ItemIcon } from "@/components/art/ItemIcon";
import { RoomBackdrop, ROOM_FLOOR_BOX } from "@/components/art/RoomBackdrop";
import { Witch } from "@/components/art/Witch";
import { api } from "@/lib/game/api";
import { ITEMS, itemById } from "@/lib/game/catalog";
import type { Decoration, WitchPublic } from "@/lib/game/state";
import { FLOORS, ROOM_COLS, ROOM_ROWS, WALLPAPERS } from "@/lib/game/types";
import { useGame } from "./GameContext";
import { NavIcon, PearlIcon } from "./Icons";
import { TreasureAlbum } from "./TreasureAlbum";

const WALL_LABEL: Record<string, string> = { pearl_stripe: "Pearl stripe", lagoon_tile: "Lagoon tile", moon_velvet: "Moon velvet", coral_damask: "Coral damask", kelp_mural: "Kelp mural" };
const FLOOR_LABEL: Record<string, string> = { shell_parquet: "Shell parquet", sand: "Sand", marble: "Marble", moss: "Moss" };

function RoomGrid({ decorations, onCell, selected }: { decorations: Decoration[]; onCell?: (col: number, row: number, d: Decoration | undefined) => void; selected?: number | null }) {
  const cells = [];
  for (let row = 0; row < ROOM_ROWS; row++) {
    for (let col = 0; col < ROOM_COLS; col++) {
      const d = decorations.find((x) => x.col === col && x.row === row);
      cells.push(
        <button
          key={`${col}-${row}`}
          disabled={!onCell}
          onClick={() => onCell?.(col, row, d)}
          className={`relative flex items-end justify-center ${onCell ? "rounded-lg outline-dashed outline-1 outline-white/70" : ""} ${d && selected === d.id ? "bg-shell-200/50" : ""}`}
          aria-label={d ? `${itemById(d.item_id)?.name} at ${col + 1},${row + 1}` : `Empty spot ${col + 1},${row + 1}`}
          style={{ zIndex: row + 1 }}
        >
          {d && (
            <motion.span initial={{ scale: 0.4, y: -20 }} animate={{ scale: 1, y: 0 }} transition={{ type: "spring", stiffness: 400, damping: 15 }} className="pointer-events-none">
              <ItemIcon itemId={d.item_id} size={40 + row * 6} />
            </motion.span>
          )}
        </button>,
      );
    }
  }
  return (
    <div
      className="absolute grid"
      style={{
        left: `${ROOM_FLOOR_BOX.x}%`, top: `${ROOM_FLOOR_BOX.y}%`, width: `${ROOM_FLOOR_BOX.w}%`, height: `${ROOM_FLOOR_BOX.h}%`,
        gridTemplateColumns: `repeat(${ROOM_COLS}, 1fr)`, gridTemplateRows: `repeat(${ROOM_ROWS}, 1fr)`,
      }}
    >
      {cells}
    </div>
  );
}

export function RoomView({ host }: { host?: string }) {
  return host ? <VisitRoom host={host} /> : <MyRoom />;
}

function VisitRoom({ host }: { host: string }) {
  const { go, setState, fail, toast, coven } = useGame();
  const [witch, setWitch] = useState<WitchPublic | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    api
      .visit(host)
      .then((r) => {
        if (!live) return;
        setWitch(r.host);
        setState(r.state);
        if (r.first_visit_today) toast({ tone: "lagoon", text: `You visited ${r.host.character.name}. Social sparkle +10.` });
      })
      .catch((e) => {
        if (!live) return;
        setError(e.hint ?? "That room is closed.");
        fail(e);
      });
    return () => {
      live = false;
    };
  }, [host, setState, toast, fail]);
  const r = coven.roster[host];
  return (
    <div className="flex flex-col gap-3 px-3 pb-4">
      <div className="flex items-center gap-2">
        <button className="pearl-button ghost !px-2.5 !py-1.5" onClick={() => go({ kind: "coven" })} aria-label="Back">
          <NavIcon name="back" size={20} />
        </button>
        <h1 className="font-[family-name:var(--font-display)] text-xl font-semibold text-shell-500">{r?.name ?? "A witch"}&apos;s room</h1>
      </div>
      {error && <p className="pearl-panel p-4 text-center text-sm">{error}</p>}
      {witch && (
        <div className="pearl-panel overflow-hidden p-1.5">
          <div className="relative aspect-[4/5] w-full sm:aspect-[5/4]">
            <RoomBackdrop wallpaper={witch.room.wallpaper} floor={witch.room.floor}>
              <RoomGrid decorations={witch.decorations} />
              <div className="pointer-events-none absolute bottom-[6%] left-1/2 -translate-x-1/2" style={{ zIndex: 20 }}>
                <Witch characterId={witch.character.id as never} look={witch.character.look} equipped={witch.equipment} mood={witch.mood} size={150} />
              </div>
            </RoomBackdrop>
          </div>
        </div>
      )}
      {witch?.character.description && <p className="pearl-panel p-3 text-sm">{witch.character.description}</p>}
    </div>
  );
}

function MyRoom() {
  const { state, setState, fail, announceAchievements, toast } = useGame();
  const [editing, setEditing] = useState(false);
  const [placing, setPlacing] = useState<string | null>(null);
  const [moving, setMoving] = useState<number | null>(null);
  const [tray, setTray] = useState<"mine" | "shop">("mine");
  const [working, setWorking] = useState(false);

  const placedCount = (id: string) => state.decorations.filter((d) => d.item_id === id).length;
  const placeables = state.inventory
    .filter((i) => itemById(i.item_id)?.placeable)
    .map((i) => ({ ...i, left: i.qty - placedCount(i.item_id) }));
  const shop = ITEMS.filter((i) => i.placeable && i.price && (!i.season || i.season.includes(state.month)));

  const run = async (fn: () => Promise<void>) => {
    setWorking(true);
    try {
      await fn();
    } catch (e) {
      fail(e);
    } finally {
      setWorking(false);
    }
  };

  const onCell = (col: number, row: number, d: Decoration | undefined) => {
    if (moving !== null) {
      if (d) return setMoving(d.id === moving ? null : d.id);
      return run(async () => {
        setState(await api.move(moving, col, row));
        setMoving(null);
      });
    }
    if (d) return setMoving(d.id);
    if (placing) {
      return run(async () => {
        const r = await api.place(placing, col, row);
        setState(r.state);
        announceAchievements(r.achievements);
        const remaining = (state.inventory.find((i) => i.item_id === placing)?.qty ?? 0) - placedCount(placing) - 1;
        if (remaining <= 0) setPlacing(null);
      });
    }
  };

  return (
    <div className="flex flex-col gap-3 px-3 pb-4">
      <div className="flex items-center justify-between px-1">
        <h1 className="title-script text-2xl text-shell-500">{state.character.name}&apos;s Pearl Palace</h1>
        <button className={`pearl-button ${editing ? "gold" : "lagoon"} !px-3 !py-1.5 text-xs`} onClick={() => { setEditing((e) => !e); setPlacing(null); setMoving(null); }}>
          {editing ? "Done" : "Decorate"}
        </button>
      </div>
      <div className="pearl-panel overflow-hidden p-1.5">
        <div className="relative aspect-[4/5] w-full sm:aspect-[5/4]">
          <RoomBackdrop wallpaper={state.room.wallpaper} floor={state.room.floor}>
            <RoomGrid decorations={state.decorations} onCell={editing ? onCell : undefined} selected={moving} />
            {!editing && (
              <div className="pointer-events-none absolute bottom-[6%] left-1/2 -translate-x-1/2" style={{ zIndex: 20 }}>
                <Witch characterId={state.character.id as never} look={state.character.look} equipped={state.equipment} mood={state.mood} size={150} />
              </div>
            )}
          </RoomBackdrop>
        </div>
      </div>

      {!editing && <TreasureAlbum />}
      {editing && (
        <>
          <p className="text-center text-xs font-semibold text-ink/60">
            {moving !== null ? "Tap an empty spot to move it, or put it away." : placing ? `Tap a spot to place ${itemById(placing)?.name}.` : "Pick something below, then tap the floor. Tap a placed item to move it."}
          </p>
          {moving !== null && (
            <div className="flex justify-center gap-2">
              <button className="pearl-button ghost !py-1.5 text-xs" onClick={() => run(async () => { setState(await api.remove(moving)); setMoving(null); })}>
                Put away
              </button>
              <button className="pearl-button ghost !py-1.5 text-xs" onClick={() => setMoving(null)}>
                Cancel
              </button>
            </div>
          )}
          <div className="flex gap-1.5">
            {(["mine", "shop"] as const).map((t) => (
              <button key={t} onClick={() => setTray(t)} className={`rounded-full px-3.5 py-1.5 text-xs font-bold ring-2 ${tray === t ? "bg-shell-400 text-white ring-shell-400" : "bg-white ring-shell-100"}`}>
                {t === "mine" ? "My treasures" : "Furniture shop"}
              </button>
            ))}
          </div>
          {tray === "mine" ? (
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
              {placeables.length === 0 && <p className="col-span-full text-sm text-ink/60">Nothing to place yet. Visit the shop or hunt for treasure.</p>}
              {placeables.map((p) => (
                <button key={p.item_id} disabled={p.left <= 0 || working} onClick={() => { setPlacing(p.item_id); setMoving(null); }} className={`pearl-panel flex flex-col items-center p-1.5 text-center disabled:opacity-40 ${placing === p.item_id ? "!shadow-[0_0_0_3px_#34c4ba,0_0_0_5px_#fff]" : ""}`}>
                  <ItemIcon itemId={p.item_id} size={44} />
                  <span className="text-[10px] font-bold leading-tight">{itemById(p.item_id)?.name}</span>
                  <span className="text-[10px] text-ink/50">{p.left} left</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {shop.map((i) => (
                <button
                  key={i.id}
                  disabled={working || state.pearls < (i.price ?? 0)}
                  onClick={() => run(async () => {
                    const r = await api.buy(i.id);
                    setState(r.state);
                    announceAchievements(r.achievements);
                    toast({ tone: "gold", text: `${i.name} delivered by a very small crab.` });
                    setTray("mine");
                    setPlacing(i.id);
                  })}
                  className="pearl-panel flex flex-col items-center p-2 text-center disabled:opacity-50"
                >
                  <ItemIcon itemId={i.id} size={52} />
                  <span className="text-[11px] font-bold leading-tight">{i.name}</span>
                  {i.season && <span className="rounded-full bg-coral-400/15 px-1.5 text-[9px] font-bold text-coral-400">Limited</span>}
                  <span className="mt-0.5 flex items-center gap-0.5 text-[11px] font-bold text-champagne-600">
                    <PearlIcon size={12} /> {i.price}
                  </span>
                </button>
              ))}
            </div>
          )}
          <section className="pearl-panel space-y-3 p-3">
            <div>
              <p className="mb-1 text-xs font-bold text-ink/60">Wallpaper</p>
              <div className="flex flex-wrap gap-1.5">
                {WALLPAPERS.map((w) => (
                  <button key={w} onClick={() => run(async () => setState(await api.roomStyle(w, null, null)))} className={`rounded-full px-3 py-1 text-xs font-bold ring-2 ${state.room.wallpaper === w ? "bg-lilac-500 text-white ring-lilac-500" : "bg-white ring-lilac-100"}`}>
                    {WALL_LABEL[w]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1 text-xs font-bold text-ink/60">Floor</p>
              <div className="flex flex-wrap gap-1.5">
                {FLOORS.map((f) => (
                  <button key={f} onClick={() => run(async () => setState(await api.roomStyle(null, f, null)))} className={`rounded-full px-3 py-1 text-xs font-bold ring-2 ${state.room.floor === f ? "bg-lagoon-500 text-white ring-lagoon-500" : "bg-white ring-lagoon-100"}`}>
                    {FLOOR_LABEL[f]}
                  </button>
                ))}
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm font-bold">
              <input type="checkbox" className="h-5 w-5 accent-[#f76fae]" checked={state.room.privacy === "private"} onChange={(e) => run(async () => setState(await api.roomStyle(null, null, e.target.checked ? "private" : "coven")))} />
              Private room (friends cannot visit)
            </label>
          </section>
        </>
      )}
    </div>
  );
}
