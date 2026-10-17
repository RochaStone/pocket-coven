"use client";

import { useEffect, useState } from "react";
import { CHARACTERS, ITEMS } from "@/lib/game/catalog";
import { MOODS, STICKERS, type AnimationKey, type Equipped, type Slot } from "@/lib/game/types";
import { Witch, MiniWitch } from "@/components/art/Witch";
import { ItemIcon } from "@/components/art/ItemIcon";
import { ActivityProp } from "@/components/art/ActivityProp";
import { Sticker } from "@/components/art/Sticker";

const ANIMS: AnimationKey[] = ["eat", "drink", "sleep", "bathe", "cuddle", "play", "dance", "spell", "swim", "float", "pilates", "yoga", "weights", "sound", "stretch", "work", "dig", "explore", "stargaze", "toast", "gossip", "mushroom"];

const card: React.CSSProperties = { background: "rgba(255,250,253,0.8)", borderRadius: 20, padding: 10, display: "flex", flexDirection: "column", alignItems: "center", fontSize: 12 };
const h2: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: 22, margin: "28px 0 10px" };

const WEARABLES = ITEMS.filter((i) => i.slot);

export default function CharacterGallery() {
  const [animate, setAnimate] = useState(true);
  const [tick, setTick] = useState(0);
  const [cycle, setCycle] = useState(true);
  useEffect(() => {
    if (!cycle) return;
    const t = setInterval(() => setTick((n) => n + 1), 1600);
    return () => clearInterval(t);
  }, [cycle]);
  const rocha = CHARACTERS[0];
  const lizz = CHARACTERS[1];
  const cycled = WEARABLES[tick % WEARABLES.length];

  return (
    <main style={{ padding: 16, maxWidth: 1800, margin: "0 auto" }}>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 30, margin: 0 }}>Character art gallery</h1>
      <label style={{ marginRight: 16 }}>
        <input type="checkbox" checked={animate} onChange={(e) => setAnimate(e.target.checked)} /> idle animation
      </label>
      <label>
        <input type="checkbox" checked={cycle} onChange={(e) => setCycle(e.target.checked)} /> cycle wearables
      </label>

      <h2 style={h2}>The coven</h2>
      <section id="hero" style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {CHARACTERS.map((c) => (
          <div key={c.id} style={card}>
            <Witch characterId={c.id} look={c.look} equipped={c.equipped} mood="happy" size={420} animate={animate} />
            <strong>{c.name}</strong>
            <span>{c.title}</span>
          </div>
        ))}
      </section>

      <h2 style={h2}>Moods</h2>
      <section id="moods">
        {CHARACTERS.map((c) => (
          <div key={c.id} id={`row-${c.id}`} style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
            {MOODS.map((m) => (
              <div key={m} style={card}>
                <Witch characterId={c.id} look={c.look} equipped={c.equipped} mood={m} size={230} animate={animate} />
                <span>
                  {c.name}: {m}
                </span>
              </div>
            ))}
          </div>
        ))}
      </section>

      <h2 style={h2}>Wardrobe cycle</h2>
      <section style={{ display: "flex", gap: 12, alignItems: "center" }}>
        {[rocha, lizz].map((c) => {
          const eq: Equipped = { ...c.equipped, [cycled.slot as Slot]: cycled.id };
          return (
            <div key={c.id} style={card}>
              <Witch characterId={c.id} look={c.look} equipped={eq} mood="happy" size={300} animate={animate} />
              <span>{cycled.name}</span>
            </div>
          );
        })}
      </section>

      <h2 style={h2}>Every wearable on Rocha and Lizz</h2>
      {[rocha, lizz].map((c) => (
        <section key={c.id} id={`wear-${c.id}`} style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
          {WEARABLES.map((it) => {
            const base: Equipped = { ...c.equipped };
            if (it.slot === "outfit") delete base.tail;
            const eq: Equipped = { ...base, [it.slot as Slot]: it.id };
            return (
              <div key={it.id} style={{ ...card, width: 130 }}>
                <Witch characterId={c.id} look={c.look} equipped={eq} mood="happy" size={160} animate={false} />
                <span style={{ textAlign: "center" }}>{it.name}</span>
              </div>
            );
          })}
        </section>
      ))}

      <h2 style={h2}>Item icons</h2>
      <section id="icons" style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {[...ITEMS.map((i) => i.id), "unknown_thing"].map((id) => (
          <div key={id} style={{ ...card, width: 104 }}>
            <ItemIcon itemId={id} size={84} />
            <span style={{ textAlign: "center" }}>{ITEMS.find((i) => i.id === id)?.name ?? "Unknown (pearl)"}</span>
          </div>
        ))}
      </section>

      <h2 style={h2}>Activity props</h2>
      <section id="props" style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {ANIMS.map((a) => (
          <div key={a} style={{ ...card, width: 120 }}>
            <ActivityProp animation={a} size={100} />
            <span>{a}</span>
          </div>
        ))}
      </section>

      <h2 style={h2}>Stickers</h2>
      <section id="stickers" style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        {STICKERS.map((s) => (
          <div key={s} style={{ ...card, width: 130 }}>
            <Sticker sticker={s} size={110} />
            <span>{s.replace(/_/g, " ")}</span>
          </div>
        ))}
      </section>

      <h2 style={h2}>Mini witches and actions</h2>
      <section id="minis" style={{ display: "flex", gap: 8, alignItems: "end", flexWrap: "wrap" }}>
        {CHARACTERS.map((c) => (
          <MiniWitch key={c.id} characterId={c.id} look={c.look} equipped={c.equipped} mood="happy" />
        ))}
        {(["sleep", "swim", "dance"] as AnimationKey[]).map((a) => (
          <div key={a} style={card}>
            <Witch characterId="cheryl" look={CHARACTERS[3].look} equipped={CHARACTERS[3].equipped} mood="happy" action={a} size={160} animate={animate} />
            <span>action: {a}</span>
          </div>
        ))}
      </section>
    </main>
  );
}
