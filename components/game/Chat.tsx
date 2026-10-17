"use client";
import { useEffect, useRef, useState } from "react";
import { Sticker as StickerArt } from "@/components/art/Sticker";
import { MiniWitch } from "@/components/art/Witch";
import { api } from "@/lib/game/api";
import { STICKERS, type Sticker } from "@/lib/game/types";
import { useGame } from "./GameContext";
import { NavIcon } from "./Icons";
import { markTutorial } from "./Tutorial";

export function ReactionBar() {
  const { coven } = useGame();
  return (
    <div className="flex items-center justify-center gap-1.5 pb-2" role="group" aria-label="Send a magical reaction">
      {STICKERS.map((s) => (
        <button key={s} onClick={() => coven.react(s)} className="rounded-2xl bg-white/80 p-1 ring-1 ring-shell-200 transition active:scale-90" aria-label={s.replace(/_/g, " ")}>
          <StickerArt sticker={s} size={30} />
        </button>
      ))}
    </div>
  );
}

const time = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

// Messages render as plain React text, never HTML.
export function Chat({ height = 320 }: { height?: number }) {
  const { coven, state, fail } = useGame();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [stickers, setStickers] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [coven.chat.length]);

  const send = async (kind: "text" | "sticker", body: string) => {
    if (!body.trim() || sending) return;
    setSending(true);
    try {
      const m = await api.chat(kind, body);
      coven.pushLocalMessage(m);
      if (kind === "text") setText("");
      setStickers(false);
      markTutorial("lounge");
    } catch (e) {
      fail(e);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col">
      <div ref={scroller} className="space-y-2 overflow-y-auto rounded-2xl bg-white/60 p-2" style={{ height }}>
        {coven.chat.length === 0 && <p className="py-8 text-center text-sm text-ink/50">The lounge is quiet. Start the gossip.</p>}
        {coven.chat.map((m) => {
          if (m.kind === "system") {
            return (
              <p key={m.id} className="mx-auto max-w-[90%] rounded-full bg-lilac-100 px-3 py-1 text-center text-[11px] font-semibold text-lilac-500">
                {m.body}
              </p>
            );
          }
          const r = m.character_id ? coven.roster[m.character_id] : null;
          const mine = m.character_id === state.character.id;
          return (
            <div key={m.id} className={`flex items-end gap-1.5 ${mine ? "flex-row-reverse" : ""}`}>
              {r && (
                <div className="shrink-0">
                  <MiniWitch characterId={r.id as never} look={mine ? state.character.look : r.look} equipped={mine ? state.equipment : r.equipment} mood="happy" size={34} />
                </div>
              )}
              <div className={`max-w-[75%] ${mine ? "items-end" : "items-start"} flex flex-col`}>
                <span className="px-1 text-[10px] font-bold text-ink/50">
                  {r?.name ?? "A witch"} · {time(m.created_at)}
                </span>
                {m.kind === "sticker" ? (
                  <StickerArt sticker={m.body as Sticker} size={64} />
                ) : (
                  <p className={`whitespace-pre-wrap break-words rounded-2xl px-3 py-1.5 text-sm ${mine ? "rounded-br-sm bg-shell-300 text-white" : "rounded-bl-sm bg-white ring-1 ring-shell-100"}`}>{m.body}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {stickers && (
        <div className="mt-2 grid grid-cols-6 gap-1">
          {STICKERS.map((s) => (
            <button key={s} onClick={() => send("sticker", s)} className="rounded-xl bg-white/80 p-1 ring-1 ring-shell-100" aria-label={`Send ${s.replace(/_/g, " ")} sticker`}>
              <StickerArt sticker={s} size={40} />
            </button>
          ))}
        </div>
      )}
      <form
        className="mt-2 flex items-center gap-1.5"
        onSubmit={(e) => {
          e.preventDefault();
          send("text", text);
        }}
      >
        <button type="button" className={`pearl-button ghost !px-2.5 !py-2 ${stickers ? "!bg-shell-100" : ""}`} onClick={() => setStickers((s) => !s)} aria-label="Stickers">
          <StickerArt sticker="heart_shell" size={22} />
        </button>
        <input
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 280))}
          placeholder="Spill the tea..."
          className="min-w-0 flex-1 rounded-full border-2 border-shell-200 bg-white px-4 py-2 text-[16px] outline-none focus:border-shell-400"
          maxLength={280}
          aria-label="Message"
        />
        <button type="submit" className="pearl-button !px-3 !py-2" disabled={sending || !text.trim()} aria-label="Send">
          <NavIcon name="send" size={20} />
        </button>
      </form>
    </div>
  );
}
