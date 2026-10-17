// Small illustrated UI glyphs. Character and item art lives in components/art.
import type { StatKey } from "@/lib/game/types";

type P = { size?: number; className?: string };
const S = "#6b3a5e";

export function PearlIcon({ size = 20, className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden>
      <defs>
        <radialGradient id="pi-g" cx="35%" cy="30%" r="75%">
          <stop offset="0" stopColor="#fff" />
          <stop offset="0.45" stopColor="#ffe6f3" />
          <stop offset="0.8" stopColor="#e9d6ff" />
          <stop offset="1" stopColor="#c7b2e6" />
        </radialGradient>
      </defs>
      <circle cx="12" cy="12" r="9" fill="url(#pi-g)" stroke={S} strokeWidth="1.3" />
      <ellipse cx="9" cy="8.5" rx="2.6" ry="1.6" fill="#fff" opacity="0.9" />
    </svg>
  );
}

export function StatIcon({ stat, size = 18 }: { stat: StatKey; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", "aria-hidden": true } as const;
  switch (stat) {
    case "nourishment":
      return (
        <svg {...common}>
          <path d="M3 11h18a9 9 0 0 1-18 0Z" fill="#ffd9b8" stroke={S} strokeWidth="1.4" />
          <path d="M5 11h14" stroke="#f7a26b" strokeWidth="2" />
          <path d="M9 4c1 1.5-1 2.5 0 4M13 3c1 1.5-1 2.5 0 4" stroke="#c9a7d9" strokeWidth="1.4" fill="none" strokeLinecap="round" />
        </svg>
      );
    case "energy":
      return (
        <svg {...common}>
          <path d="M16 3a8.5 8.5 0 1 0 5 13.5A7 7 0 0 1 16 3Z" fill="#ffe7a3" stroke={S} strokeWidth="1.4" />
          <circle cx="9" cy="10" r="1" fill="#e9b949" />
        </svg>
      );
    case "joy":
      return (
        <svg {...common}>
          <path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10Z" fill="#ff8fc0" stroke={S} strokeWidth="1.4" />
          <ellipse cx="8.6" cy="9.6" rx="1.5" ry="1" fill="#fff" opacity="0.8" />
        </svg>
      );
    case "magic":
      return (
        <svg {...common}>
          <path d="m12 2.5 2.5 6.2 6.6.5-5 4.3 1.6 6.5L12 16.5 6.3 20l1.6-6.5-5-4.3 6.6-.5Z" fill="#c9b0ff" stroke={S} strokeWidth="1.3" strokeLinejoin="round" />
          <circle cx="10.5" cy="9.5" r="1.2" fill="#fff" />
        </svg>
      );
    case "social":
      return (
        <svg {...common}>
          <path d="M3 15a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 2-2 3-4.5 3h-9C5 18 3 17 3 15Z" fill="#8ff0e5" stroke={S} strokeWidth="1.3" />
          <path d="M7.5 13.5v3M12 12v5M16.5 13.5v3" stroke="#3aa79e" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );
  }
}

export function NavIcon({ name, size = 26 }: { name: "world" | "wardrobe" | "room" | "coven" | "admin" | "back" | "close" | "send" | "share" | "copy"; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 32 32", "aria-hidden": true, fill: "none", stroke: S, strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;
  switch (name) {
    case "world":
      return (
        <svg {...common}>
          <path d="M4 22C4 12 9.5 5 16 5s12 7 12 17Z" fill="#ffc8e2" />
          <path d="M16 5v17M10 7.5 12.5 22M22 7.5 19.5 22M6 13l4.5 9M26 13l-4.5 9" />
          <path d="M3 22h26a2 2 0 0 1-2 3H5a2 2 0 0 1-2-3Z" fill="#e9c27a" />
        </svg>
      );
    case "wardrobe":
      return (
        <svg {...common}>
          <path d="M12 4h8l-1 4 5 3-2 3-2-1v14H12V13l-2 1-2-3 5-3Z" fill="#c9b0ff" />
          <path d="M14 4c0 2 4 2 4 0" />
          <circle cx="16" cy="18" r="1.2" fill="#fff" />
        </svg>
      );
    case "room":
      return (
        <svg {...common}>
          <path d="M5 14 16 5l11 9v13H5Z" fill="#8ff0e5" />
          <path d="M9 27v-6a7 3 0 0 1 14 0v6" fill="#ffc8e2" />
          <circle cx="16" cy="12" r="2" fill="#fff" />
        </svg>
      );
    case "coven":
      return (
        <svg {...common}>
          <circle cx="10" cy="13" r="4" fill="#ffc8e2" />
          <circle cx="22" cy="13" r="4" fill="#c9b0ff" />
          <circle cx="16" cy="10" r="4" fill="#8ff0e5" />
          <path d="M3 27c1-5 4-7 7-7s5 1 6 3c1-2 3-3 6-3s6 2 7 7" fill="#fff" />
        </svg>
      );
    case "admin":
      return (
        <svg {...common}>
          <path d="M5 23 4 10l6 5 6-9 6 9 6-5-1 13Z" fill="#ffe7a3" />
          <path d="M5 26h22" />
          <circle cx="16" cy="6" r="1.6" fill="#fff" />
        </svg>
      );
    case "back":
      return (
        <svg {...common}>
          <path d="M19 7 10 16l9 9" />
        </svg>
      );
    case "close":
      return (
        <svg {...common}>
          <path d="m9 9 14 14M23 9 9 23" />
        </svg>
      );
    case "send":
      return (
        <svg {...common}>
          <path d="M5 16 27 6l-7 21-4-9Z" fill="#ffc8e2" />
          <path d="m16 18 11-12" />
        </svg>
      );
    case "share":
      return (
        <svg {...common}>
          <path d="M16 4v16M10 10l6-6 6 6" />
          <path d="M8 16v10h16V16" />
        </svg>
      );
    case "copy":
      return (
        <svg {...common}>
          <rect x="10" y="10" width="15" height="17" rx="3" fill="#fff" />
          <path d="M7 22V8a3 3 0 0 1 3-3h10" />
        </svg>
      );
  }
}
