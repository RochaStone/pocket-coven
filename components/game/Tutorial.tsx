"use client";
import { useState } from "react";
import { useGame } from "./GameContext";

const KEY = "pocket-coven:tutorial";

type Flags = { kairos?: boolean; lounge?: boolean; dismissed?: boolean };

function readFlags(): Flags {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}");
  } catch {
    return {};
  }
}

export function markTutorial(flag: keyof Flags) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...readFlags(), [flag]: true }));
  } catch {
    // Storage unavailable (private mode): the quest card simply stays visible.
  }
}

// First-visit quest card. Progress comes from server state where possible.
export function Tutorial() {
  const { state, go } = useGame();
  // Only rendered client-side (after the shell opens), so reading storage at init is safe.
  const [flags, setFlags] = useState<Flags>(readFlags);
  const steps = [
    { done: true, text: "Open your seashell", go: null },
    { done: state.achievements.includes("first_care"), text: "First care: order a strawberry iced matcha at the Matcha Café", go: () => go({ kind: "location", id: "cafe" }) },
    { done: state.achievements.includes("first_treasure"), text: "Hunt for treasure on Shell Beach", go: () => go({ kind: "location", id: "beach" }) },
    { done: Boolean(flags.kairos), text: "Step through the portal to Kairos", go: () => go({ kind: "kairos" }) },
    { done: Boolean(flags.lounge), text: "Say hello to the coven in the Coven Lounge", go: () => go({ kind: "location", id: "lounge" }) },
  ];
  if (flags.dismissed || steps.every((s) => s.done)) return null;
  const next = steps.findIndex((s) => !s.done);
  return (
    <section className="pearl-panel w-full max-w-[520px] px-4 py-3">
      <div className="flex items-center justify-between">
        <h2 className="title-script text-xl text-shell-500">Welcome to your shell, {state.character.name}</h2>
        <button
          className="text-xs font-bold text-ink/50"
          onClick={() => {
            markTutorial("dismissed");
            setFlags(readFlags());
          }}
        >
          Hide
        </button>
      </div>
      <ol className="mt-1.5 space-y-1.5">
        {steps.map((s, i) => (
          <li key={s.text} className={`flex items-center gap-2 text-sm ${s.done ? "text-ink/45 line-through" : i === next ? "font-bold" : ""}`}>
            <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-bold ${s.done ? "bg-lagoon-300 text-white" : "bg-shell-100 text-shell-500"}`}>{i + 1}</span>
            <span className="flex-1">{s.text}</span>
            {!s.done && i === next && s.go && (
              <button className="pearl-button lagoon !px-3 !py-1 text-xs" onClick={s.go}>
                Go
              </button>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
