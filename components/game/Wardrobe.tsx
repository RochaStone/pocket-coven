"use client";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { ItemIcon } from "@/components/art/ItemIcon";
import { Sparkles } from "@/components/art/Sparkles";
import { Witch } from "@/components/art/Witch";
import { api } from "@/lib/game/api";
import { ITEMS } from "@/lib/game/catalog";
import { HAIR_STYLES, type Equipped, type Slot } from "@/lib/game/types";
import { useGame } from "./GameContext";
import { PearlIcon } from "./Icons";

const TABS: { id: string; label: string; slots: Slot[] }[] = [
  { id: "outfit", label: "Outfits", slots: ["outfit"] },
  { id: "tail", label: "Tails", slots: ["tail"] },
  { id: "hat", label: "Hats", slots: ["hat"] },
  { id: "jewellery", label: "Jewels", slots: ["necklace", "earrings"] },
  { id: "hair_acc", label: "Hair", slots: ["hair_acc"] },
  { id: "companion", label: "Familiars", slots: ["companion"] },
  { id: "look", label: "Look", slots: [] },
  { id: "profile", label: "Profile", slots: [] },
];

const HAIR_SWATCHES = ["#ff8fc8", "#2a2433", "#3a2a6e", "#ff8766", "#c3ecf2", "#f6d58b", "#6b3f2a", "#b9a7ff", "#e9e3ef", "#1f5f5b"];
const SKIN_SWATCHES = ["#fde3d4", "#f9d6c3", "#f0c4a4", "#e6b591", "#c48c69", "#a8724f", "#8a5a3c", "#6b4430", "#4f3124"];
const EYE_SWATCHES = ["#8a4fe0", "#38a89d", "#b49bff", "#2e9cb4", "#7fd9d2", "#6b3f2a", "#3b6fd1", "#d0558f"];
const HAIR_LABEL: Record<string, string> = {
  long_waves: "Long waves", short_undercut: "Undercut", straight_long: "Sleek long", beach_waves: "Beach waves",
  ethereal_long: "Ethereal", pixie: "Pixie", space_buns: "Space buns",
};

export function Wardrobe() {
  const { state, setState, fail, toast, announceAchievements } = useGame();
  const [tab, setTab] = useState("outfit");
  const [tryOn, setTryOn] = useState<{ slot: Slot; itemId: string } | null>(null);
  const [flash, setFlash] = useState(0);
  const [working, setWorking] = useState(false);
  const owned = new Set(state.inventory.map((i) => i.item_id));
  const preview: Equipped = tryOn ? { ...state.equipment, [tryOn.slot]: tryOn.itemId } : state.equipment;
  const current = TABS.find((t) => t.id === tab)!;

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

  const equip = (slot: Slot, itemId: string | null) =>
    run(async () => {
      const r = await api.equip(slot, itemId);
      setState(r.state);
      setTryOn(null);
      setFlash((f) => f + 1);
      announceAchievements(r.achievements);
    });

  const buy = (slot: Slot, itemId: string) =>
    run(async () => {
      const r = await api.buy(itemId);
      setState(r.state);
      announceAchievements(r.achievements);
      const e = await api.equip(slot, itemId);
      setState(e.state);
      setTryOn(null);
      setFlash((f) => f + 1);
      toast({ tone: "gold", text: `${ITEMS.find((i) => i.id === itemId)?.name} is yours. Wearing it immediately, obviously.` });
    });

  return (
    <div className="flex flex-col gap-3 px-3 pb-4">
      <section className="pearl-panel relative overflow-hidden" style={{ background: "radial-gradient(90% 80% at 50% 30%, #fff 0%, #ffe6f2 45%, #e8dcff 100%)" }}>
        <Sparkles count={14} />
        <div className="relative flex flex-col items-center pt-3">
          <AnimatePresence>
            <motion.div key={flash} initial={{ scale: flash ? 0.9 : 1, rotate: flash ? -3 : 0 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 300, damping: 12 }}>
              <Witch characterId={state.character.id as never} look={state.character.look} equipped={preview} mood={tryOn ? "magical" : state.mood} size={230} />
            </motion.div>
          </AnimatePresence>
          {tryOn && (
            <div className="mb-3 flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold shadow">
              Trying on {ITEMS.find((i) => i.id === tryOn.itemId)?.name}
              <button className="text-shell-500" onClick={() => setTryOn(null)}>
                Undo
              </button>
            </div>
          )}
        </div>
      </section>

      <div className="-mx-3 flex gap-1.5 overflow-x-auto px-3 pb-1" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold ring-2 ${tab === t.id ? "bg-shell-400 text-white ring-shell-400" : "bg-white/85 ring-shell-100"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {current.slots.length > 0 &&
        current.slots.map((slot) => (
          <section key={slot}>
            {current.slots.length > 1 && <h3 className="mb-1 px-1 text-xs font-bold uppercase tracking-wider text-ink/50">{slot === "necklace" ? "Necklaces" : "Earrings"}</h3>}
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {state.equipment[slot] && slot !== "outfit" && (
                <button onClick={() => equip(slot, null)} disabled={working} className="pearl-panel flex flex-col items-center justify-center gap-1 p-2 text-xs font-bold text-ink/60">
                  <span className="grid h-14 w-14 place-items-center rounded-full border-2 border-dashed border-shell-200">None</span>
                  Take off
                </button>
              )}
              {ITEMS.filter((i) => i.slot === slot && (owned.has(i.id) || (i.price && (!i.season || i.season.includes(state.month))))).map((i) => {
                const has = owned.has(i.id);
                const on = state.equipment[slot] === i.id;
                const trying = tryOn?.itemId === i.id;
                return (
                  <div key={i.id} className={`pearl-panel flex flex-col items-center p-2 text-center ${on ? "!shadow-[0_0_0_3px_#f76fae,0_0_0_5px_#fff]" : ""}`}>
                    <button className="flex flex-col items-center" onClick={() => (has ? equip(slot, i.id) : setTryOn({ slot, itemId: i.id }))} disabled={working} aria-label={has ? `Wear ${i.name}` : `Try on ${i.name}`}>
                      <ItemIcon itemId={i.id} size={60} />
                      <span className="mt-0.5 text-[11px] font-bold leading-tight">{i.name}</span>
                    </button>
                    {on ? (
                      <span className="mt-1 rounded-full bg-shell-100 px-2 text-[10px] font-bold text-shell-500">Wearing</span>
                    ) : has ? (
                      <span className="mt-1 text-[10px] font-semibold text-ink/50">Owned</span>
                    ) : trying ? (
                      <button className="pearl-button gold mt-1 !px-2 !py-0.5 text-[11px]" disabled={working || state.pearls < (i.price ?? 0)} onClick={() => buy(slot, i.id)}>
                        Buy {i.price}
                      </button>
                    ) : (
                      <span className="mt-1 flex items-center gap-0.5 text-[11px] font-bold text-champagne-600">
                        <PearlIcon size={13} /> {i.price}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}

      {tab === "look" && <LookEditor />}
      {tab === "profile" && <ProfileEditor />}
    </div>
  );
}

function Swatches({ colors, value, onPick, label }: { colors: string[]; value: string; onPick: (c: string) => void; label: string }) {
  return (
    <div>
      <p className="mb-1 text-xs font-bold text-ink/60">{label}</p>
      <div className="flex flex-wrap gap-2">
        {colors.map((c) => (
          <button key={c} onClick={() => onPick(c)} aria-label={`${label} ${c}`} className={`h-8 w-8 rounded-full ring-2 ring-offset-2 ${value.toLowerCase() === c ? "ring-shell-400" : "ring-white"}`} style={{ background: c }} />
        ))}
      </div>
    </div>
  );
}

function LookEditor() {
  const { state, setState, fail } = useGame();
  const look = state.character.look;
  const save = async (patch: Record<string, unknown>) => {
    try {
      setState(await api.setLook(patch));
    } catch (e) {
      fail(e);
    }
  };
  return (
    <section className="pearl-panel space-y-4 p-4">
      <div>
        <p className="mb-1 text-xs font-bold text-ink/60">Hairstyle</p>
        <div className="flex flex-wrap gap-1.5">
          {HAIR_STYLES.map((h) => (
            <button key={h} onClick={() => save({ hairStyle: h })} className={`rounded-full px-3 py-1 text-xs font-bold ring-2 ${look.hairStyle === h ? "bg-lilac-500 text-white ring-lilac-500" : "bg-white ring-lilac-100"}`}>
              {HAIR_LABEL[h]}
            </button>
          ))}
        </div>
      </div>
      <Swatches label="Hair colour" colors={HAIR_SWATCHES} value={look.hairColor} onPick={(c) => save({ hairColor: c })} />
      <Swatches label="Skin" colors={SKIN_SWATCHES} value={look.skin} onPick={(c) => save({ skin: c })} />
      <Swatches label="Eyes" colors={EYE_SWATCHES} value={look.eyeColor} onPick={(c) => save({ eyeColor: c })} />
      <label className="flex items-center gap-2 text-sm font-bold">
        <input type="checkbox" checked={Boolean(look.tattoos)} onChange={(e) => save({ tattoos: e.target.checked })} className="h-5 w-5 accent-[#f76fae]" />
        Tattoos
      </label>
    </section>
  );
}

const PRONOUN_SETS = [
  { subject: "she", object: "her", possessive: "her", plural: false },
  { subject: "they", object: "them", possessive: "their", plural: true },
  { subject: "he", object: "him", possessive: "his", plural: false },
];

function ProfileEditor() {
  const { state, setState, fail, toast } = useGame();
  const c = state.character;
  const [description, setDescription] = useState(c.description);
  const [personality, setPersonality] = useState(c.personality);
  const [pronouns, setPronouns] = useState(c.pronouns);
  const save = async () => {
    try {
      setState(await api.updateProfile(description, personality, pronouns));
      toast({ tone: "flavour", text: "Profile saved. The shell has been informed." });
    } catch (e) {
      fail(e);
    }
  };
  return (
    <section className="pearl-panel space-y-3 p-4">
      <div>
        <p className="mb-1 text-xs font-bold text-ink/60">Pronouns</p>
        <div className="flex flex-wrap gap-1.5">
          {PRONOUN_SETS.map((p) => (
            <button key={p.subject} onClick={() => setPronouns(p)} className={`rounded-full px-3 py-1 text-xs font-bold ring-2 ${pronouns.subject === p.subject ? "bg-lagoon-500 text-white ring-lagoon-500" : "bg-white ring-lagoon-100"}`}>
              {p.subject}/{p.object}
            </button>
          ))}
        </div>
      </div>
      <label className="block">
        <span className="mb-1 block text-xs font-bold text-ink/60">Personality</span>
        <textarea value={personality} onChange={(e) => setPersonality(e.target.value.slice(0, 500))} rows={3} className="w-full rounded-2xl border-2 border-shell-100 bg-white p-2 text-[16px]" />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-bold text-ink/60">Description</span>
        <textarea value={description} onChange={(e) => setDescription(e.target.value.slice(0, 500))} rows={3} className="w-full rounded-2xl border-2 border-shell-100 bg-white p-2 text-[16px]" />
      </label>
      <button className="pearl-button" onClick={save}>
        Save profile
      </button>
    </section>
  );
}
