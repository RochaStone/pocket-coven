"use client";
import { useState } from "react";
import { ItemIcon } from "@/components/art/ItemIcon";
import { ITEMS } from "@/lib/game/catalog";
import { useGame } from "./GameContext";

const MONTH = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// Every collectible, found or not. Unfound ones show as silhouettes so there is always something to hunt.
export function TreasureAlbum() {
  const { state } = useGame();
  const [open, setOpen] = useState(false);
  const owned = new Map(state.inventory.map((i) => [i.item_id, i.qty]));
  const collectibles = ITEMS.filter((i) => i.category === "collectible" || (i.season && i.placeable));
  const found = collectibles.filter((i) => owned.has(i.id)).length;
  return (
    <section className="pearl-panel p-3">
      <button className="flex w-full items-center justify-between" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className="title-script text-xl text-lilac-500">Treasure album</span>
        <span className="rounded-full bg-lilac-100 px-2.5 py-0.5 text-xs font-bold text-lilac-500">
          {found} / {collectibles.length} found
        </span>
      </button>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-white ring-1 ring-lilac-100">
        <div className="h-full rounded-full bg-gradient-to-r from-lilac-300 to-lilac-500" style={{ width: `${(found / collectibles.length) * 100}%` }} />
      </div>
      {open && (
        <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
          {collectibles.map((i) => {
            const has = owned.has(i.id);
            return (
              <div key={i.id} className="flex flex-col items-center rounded-2xl bg-white/70 p-1.5 text-center">
                <ItemIcon itemId={i.id} size={46} silhouette={!has} />
                <span className="text-[10px] font-bold leading-tight">{has ? i.name : "???"}</span>
                <span className={`text-[9px] font-semibold ${i.rarity === "mythic" ? "text-champagne-600" : i.rarity === "rare" ? "text-lilac-500" : "text-ink/45"}`}>
                  {has ? `x${owned.get(i.id)}` : i.season ? `${MONTH[i.season[0]]} only` : i.rarity}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
