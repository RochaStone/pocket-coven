"use client";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { GiftBox } from "@/components/art/GiftBox";
import { ItemIcon } from "@/components/art/ItemIcon";
import { TreasureBurst } from "@/components/art/Sparkles";
import { MiniWitch } from "@/components/art/Witch";
import { api } from "@/lib/game/api";
import { GIFT_TREATS, itemById } from "@/lib/game/catalog";
import type { Gift } from "@/lib/game/state";
import { play } from "@/lib/sound";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useGame } from "./GameContext";
import { NavIcon, PearlIcon } from "./Icons";

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-[#4a2a4f]/40 backdrop-blur-sm sm:items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div
        className="pearl-panel max-h-[88dvh] w-full max-w-md overflow-y-auto rounded-b-none p-4 pb-[max(env(safe-area-inset-bottom),16px)] sm:rounded-b-[28px]"
        initial={{ y: 60 }}
        animate={{ y: 0 }}
        exit={{ y: 60 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-2 flex items-center justify-between">
          <h2 className="title-script text-2xl text-shell-500">{title}</h2>
          <button className="rounded-full p-1" onClick={onClose} aria-label="Close">
            <NavIcon name="close" size={22} />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}

const describeGift = (g: Gift) =>
  g.kind === "pearls" ? `${g.pearls} pearls` : g.kind === "treat" ? GIFT_TREATS.find((t) => t.id === g.ref)?.name ?? "A treat" : itemById(g.ref ?? "")?.name ?? "A treasure";

export function GiftComposer({ to, onClose }: { to: string; onClose: () => void }) {
  const { state, setState, toast, fail, coven, announceAchievements } = useGame();
  const [tab, setTab] = useState<"treat" | "pearls" | "item">("treat");
  const [choice, setChoice] = useState<string | null>(GIFT_TREATS[0].id);
  const [pearls, setPearls] = useState(10);
  const [note, setNote] = useState("");
  const [working, setWorking] = useState(false);
  const r = coven.roster[to];
  const placed = (id: string) => state.decorations.filter((d) => d.item_id === id).length;
  const treasures = state.inventory
    .map((i) => ({ ...i, def: itemById(i.item_id) }))
    .filter((i) => i.def && !i.def.slot && i.qty - placed(i.item_id) > 0);

  const send = async () => {
    setWorking(true);
    try {
      const res =
        tab === "pearls"
          ? await api.sendGift(to, "pearls", null, pearls, note || null)
          : await api.sendGift(to, tab, choice, null, note || null);
      setState(res.state);
      announceAchievements(res.achievements);
      play("gift");
      toast({ tone: "lagoon", text: `Gift sent. ${r?.name ?? "They"} will find it in ${r?.pronouns.possessive ?? "their"} shell.` });
      onClose();
    } catch (e) {
      fail(e);
    } finally {
      setWorking(false);
    }
  };

  const cost = tab === "treat" ? GIFT_TREATS.find((t) => t.id === choice)?.cost ?? 0 : tab === "pearls" ? pearls : 0;
  return (
    <Sheet title={`A gift for ${r?.name ?? "a witch"}`} onClose={onClose}>
      {r && (
        <div className="mb-3 flex items-center gap-3">
          <MiniWitch characterId={r.id as never} look={r.look} equipped={r.equipment} mood="thriving" size={64} />
          <p className="text-sm text-ink/70">Choose something lovely. It waits in {r.pronouns.possessive} shell until {r.pronouns.subject} {r.pronouns.plural ? "open" : "opens"} it.</p>
        </div>
      )}
      <div className="mb-3 flex gap-1.5" role="tablist">
        {(["treat", "pearls", "item"] as const).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => { setTab(t); setChoice(t === "treat" ? GIFT_TREATS[0].id : t === "item" ? treasures[0]?.item_id ?? null : null); }}
            className={`rounded-full px-3.5 py-1.5 text-xs font-bold ring-2 ${tab === t ? "bg-shell-400 text-white ring-shell-400" : "bg-white ring-shell-100"}`}
          >
            {t === "treat" ? "Treat" : t === "pearls" ? "Pearls" : "Treasure"}
          </button>
        ))}
      </div>

      {tab === "treat" && (
        <div className="grid grid-cols-2 gap-2">
          {GIFT_TREATS.map((t) => (
            <button key={t.id} onClick={() => setChoice(t.id)} className={`pearl-panel flex items-center gap-2 p-2 text-left ${choice === t.id ? "!shadow-[0_0_0_3px_#f76fae,0_0_0_5px_#fff]" : ""}`}>
              <ItemIcon itemId={t.id} size={44} />
              <span className="min-w-0">
                <span className="block text-xs font-bold leading-tight">{t.name}</span>
                <span className="flex items-center gap-0.5 text-[11px] font-bold text-champagne-600"><PearlIcon size={12} /> {t.cost}</span>
              </span>
            </button>
          ))}
        </div>
      )}
      {tab === "pearls" && (
        <div className="flex flex-wrap gap-2">
          {[5, 10, 25, 50, 100].map((n) => (
            <button key={n} onClick={() => setPearls(n)} disabled={n > state.pearls} className={`flex items-center gap-1 rounded-full px-4 py-2 text-sm font-bold ring-2 disabled:opacity-40 ${pearls === n ? "bg-champagne-200 ring-champagne-400" : "bg-white ring-shell-100"}`}>
              <PearlIcon size={16} /> {n}
            </button>
          ))}
        </div>
      )}
      {tab === "item" && (
        <div className="grid grid-cols-3 gap-2">
          {treasures.length === 0 && <p className="col-span-full text-sm text-ink/60">No spare treasures yet. Hunt on Shell Beach or the Crystal Reef.</p>}
          {treasures.map((i) => (
            <button key={i.item_id} onClick={() => setChoice(i.item_id)} className={`pearl-panel flex flex-col items-center p-2 text-center ${choice === i.item_id ? "!shadow-[0_0_0_3px_#f76fae,0_0_0_5px_#fff]" : ""}`}>
              <ItemIcon itemId={i.item_id} size={44} />
              <span className="text-[10px] font-bold leading-tight">{i.def!.name}</span>
              <span className="text-[10px] text-ink/50">{i.qty - placed(i.item_id)} spare</span>
            </button>
          ))}
        </div>
      )}

      <label className="mt-3 block">
        <span className="mb-1 block text-xs font-bold text-ink/60">Note (optional)</span>
        <input value={note} onChange={(e) => setNote(e.target.value.slice(0, 140))} placeholder="For my favourite chaos witch..." className="w-full rounded-full border-2 border-shell-200 bg-white px-4 py-2 text-[16px] outline-none focus:border-shell-400" />
      </label>
      <button className="pearl-button mt-3 w-full" disabled={working || (tab !== "pearls" && !choice) || cost > state.pearls} onClick={send}>
        {working ? "Wrapping..." : cost ? `Send gift (${cost} pearls)` : "Send gift"}
      </button>
    </Sheet>
  );
}

export function GiftInbox({ onClose }: { onClose: () => void }) {
  const { state, setState, fail, coven, announceAchievements, showTreasure } = useGame();
  const [gifts, setGifts] = useState<Gift[] | null>(null);
  const [opening, setOpening] = useState<number | null>(null);
  const [revealed, setRevealed] = useState<Gift | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabaseBrowser()
      .from("gifts")
      .select("*")
      .eq("to_char", state.character.id)
      .order("created_at", { ascending: false })
      .limit(30);
    setGifts((data ?? []) as Gift[]);
  }, [state.character.id]);
  useEffect(() => {
    // Initial fetch from Supabase; state is set after the network round trip.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const open = async (g: Gift) => {
    setOpening(g.id);
    play("gift");
    try {
      const r = await api.openGift(g.id);
      await new Promise((res) => setTimeout(res, 700));
      setState(r.state);
      setRevealed(r.gift);
      announceAchievements(r.achievements);
      if (r.gift.kind === "item" && r.gift.ref) setTimeout(() => showTreasure([r.gift.ref!]), 1400);
      await load();
    } catch (e) {
      fail(e);
    } finally {
      setOpening(null);
    }
  };

  const waiting = (gifts ?? []).filter((g) => !g.opened_at);
  const past = (gifts ?? []).filter((g) => g.opened_at).slice(0, 8);
  return (
    <Sheet title="Gifts in your shell" onClose={onClose}>
      <AnimatePresence>
        {revealed && (
          <motion.div className="mb-3 rounded-3xl bg-gradient-to-b from-white to-shell-50 p-4 text-center" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <TreasureBurst show>
              <div className="flex flex-col items-center">
                {revealed.kind === "pearls" ? <PearlIcon size={64} /> : <ItemIcon itemId={revealed.ref ?? ""} size={72} />}
                <p className="mt-1 font-bold">{describeGift(revealed)}</p>
                <p className="text-xs text-ink/60">from {coven.roster[revealed.from_char]?.name ?? "a witch"}</p>
                {revealed.note && <p className="title-script mt-1 text-lg text-lilac-500">&ldquo;{revealed.note}&rdquo;</p>}
              </div>
            </TreasureBurst>
          </motion.div>
        )}
      </AnimatePresence>
      {gifts === null && <p className="py-6 text-center text-sm text-ink/60">Checking the shell...</p>}
      {gifts !== null && waiting.length === 0 && !revealed && <p className="py-4 text-center text-sm text-ink/60">No gifts waiting. Why not send one? Gifts tend to come back.</p>}
      <div className="grid grid-cols-2 gap-3">
        {waiting.map((g) => (
          <button key={g.id} onClick={() => open(g)} disabled={opening !== null} className="pearl-panel flex flex-col items-center p-3">
            <GiftBox open={opening === g.id} size={84} />
            <span className="mt-1 text-xs font-bold">From {coven.roster[g.from_char]?.name ?? "a witch"}</span>
            <span className="text-[11px] text-shell-500">Tap to open</span>
          </button>
        ))}
      </div>
      {past.length > 0 && (
        <div className="mt-4">
          <h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-ink/50">Opened</h3>
          <ul className="space-y-1 text-sm">
            {past.map((g) => (
              <li key={g.id} className="flex items-center gap-2">
                {g.kind === "pearls" ? <PearlIcon size={18} /> : <ItemIcon itemId={g.ref ?? ""} size={22} />}
                <span className="min-w-0 flex-1 truncate">
                  {describeGift(g)} from {coven.roster[g.from_char]?.name ?? "a witch"}
                  {g.note ? `: "${g.note}"` : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="mt-3 text-center text-[11px] text-ink/50">You have {state.pearls} pearls. Send gifts from the Coven tab.</p>
    </Sheet>
  );
}

export function GiftsWaiting({ onOpen }: { onOpen: () => void }) {
  const { state } = useGame();
  if (!state.unopened_gifts) return null;
  return (
    <button onClick={onOpen} className="pearl-panel flex w-full max-w-[520px] items-center gap-3 px-4 py-3 text-left">
      <GiftBox size={52} />
      <span className="flex-1">
        <span className="block font-bold text-shell-500">{state.unopened_gifts === 1 ? "A gift is waiting" : `${state.unopened_gifts} gifts are waiting`}</span>
        <span className="text-xs text-ink/60">Someone in the coven was thinking of you.</span>
      </span>
      <span className="pearl-button !px-3 !py-1.5 text-xs">Open</span>
    </button>
  );
}
