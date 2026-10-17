"use client";
import { useSound } from "@/lib/sound";

const S = "#6b3a5e";

function SpeakerGlyph({ muted, size = 20 }: { muted: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden fill="none" stroke={S} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 9.5h3l4.5-4v13L7 14.5H4a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1Z" fill="#ffc8e2" />
      {muted ? (
        <path d="m15.5 9.5 5 5M20.5 9.5l-5 5" stroke="#e64b93" />
      ) : (
        <>
          <path d="M15 9.2a4 4 0 0 1 0 5.6" />
          <path d="M17.6 6.8a7.5 7.5 0 0 1 0 10.4" stroke="#c9b0ff" />
        </>
      )}
    </svg>
  );
}

// Small round pearl button that mutes or unmutes the shell's sounds.
export function SoundToggle({ className = "" }: { className?: string }) {
  const { muted, toggle } = useSound();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={muted ? "Turn sounds on" : "Turn sounds off"}
      aria-pressed={!muted}
      title={muted ? "Sounds off" : "Sounds on"}
      className={`pearl-button ghost grid h-10 w-10 place-items-center !p-0 ${className}`}
    >
      <SpeakerGlyph muted={muted} />
    </button>
  );
}
