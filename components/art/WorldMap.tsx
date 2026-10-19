"use client";

import { useState, type KeyboardEvent, type ReactNode } from "react";
import { locationById } from "@/lib/game/catalog";
import { ArtKeyframes, Frangipani, Glint, PLUM, Palm, Pearl, lobedPath, rng, star5Path, starPath, useArtId } from "./Sparkles";

const VB_W = 400;
const VB_H = 500;

type Rect = { x: number; y: number; w: number; h: number };

/** Lobed clamshell silhouette the whole map is clipped to (matches the ShellCompact recess). */
export const WORLD_SHELL_PATH = lobedPath(200, 250, 188, 235, 16, 1.1);

/** Room rectangles in SVG units (viewBox 400 x 500). */
const ROOMS_UNITS: Record<string, Rect> = {
  moon_deck: { x: 24, y: 60, w: 128, h: 92 },
  palace: { x: 156, y: 20, w: 222, h: 132 },
  cafe: { x: 22, y: 166, w: 120, h: 106 },
  lounge: { x: 146, y: 166, w: 108, h: 106 },
  grotto: { x: 258, y: 166, w: 120, h: 106 },
  reef: { x: 26, y: 290, w: 110, h: 142 },
  kairos: { x: 168, y: 286, w: 88, h: 82 },
  lagoon: { x: 134, y: 376, w: 140, h: 104 },
  beach: { x: 264, y: 290, w: 114, h: 116 },
};

/** Original art extents, used to fit each room drawing into its new rectangle. */
const ART_UNITS: Record<string, Rect> = {
  moon_deck: { x: 12, y: 20, w: 184, h: 122 },
  cafe: { x: 12, y: 152, w: 122, h: 108 },
  lounge: { x: 139, y: 152, w: 122, h: 108 },
  grotto: { x: 266, y: 152, w: 122, h: 108 },
  reef: { x: 151, y: 284, w: 98, h: 126 },
  beach: { x: 254, y: 290, w: 138, h: 128 },
  kairos: { x: 150, y: 404, w: 100, h: 94 },
};

function fit(id: string) {
  const o = ART_UNITS[id];
  const n = ROOMS_UNITS[id];
  const s = Math.min(n.w / o.w, n.h / o.h);
  const tx = n.x + (n.w - o.w * s) / 2 - o.x * s;
  const ty = n.y + n.h - o.h * s - o.y * s;
  return `translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${s.toFixed(4)})`;
}

/** Room rectangles in % of the map box, for HTML overlays (occupants, tooltips). */
export const WORLD_ROOMS: Record<string, { x: number; y: number; w: number; h: number }> = Object.fromEntries(
  Object.entries(ROOMS_UNITS).map(([k, r]) => [
    k,
    {
      x: +((r.x / VB_W) * 100).toFixed(2),
      y: +((r.y / VB_H) * 100).toFixed(2),
      w: +((r.w / VB_W) * 100).toFixed(2),
      h: +((r.h / VB_H) * 100).toFixed(2),
    },
  ]),
);

const PLAQUES: Record<string, { lines: string[]; cx?: number; cy: number }> = {
  moon_deck: { lines: ["MOON DECK"], cy: 72 },
  palace: { lines: ["PEARL PALACE"], cy: 54 },
  cafe: { lines: ["MATCHA CAFÉ"], cy: 178 },
  lounge: { lines: ["COVEN", "LOUNGE"], cy: 186 },
  grotto: { lines: ["CHAMPAGNE", "GROTTO"], cy: 186 },
  reef: { lines: ["CRYSTAL REEF"], cy: 304 },
  kairos: { lines: ["KAIROS", "MEMBERS’ CLUB"], cy: 366 },
  lagoon: { lines: ["MERMAID LAGOON"], cy: 470 },
  beach: { lines: ["SHELL BEACH"], cy: 304 },
};

/** Painted map (Higgsfield, production `art` bucket). The drawn map stays underneath as the fallback. */
const PAINTED_MAP_URL = "https://ogvydqsynyksgbymptzm.supabase.co/storage/v1/object/public/art/map/v1/shell.jpg";
/** The painting (880 x 1168) is scaled so its shell interior fills the 400 x 500 recess. */
const PAINTED_IMAGE = { x: -30, y: -24.4, w: 460, h: 610.5 };
/** Tap spots over each painted place: centre in SVG units. */
const PAINTED_SPOTS: Record<string, { cx: number; cy: number }> = {
  palace: { cx: 200, cy: 92 },
  moon_deck: { cx: 283, cy: 52 },
  cafe: { cx: 90, cy: 165 },
  grotto: { cx: 310, cy: 165 },
  lagoon: { cx: 200, cy: 268 },
  lounge: { cx: 318, cy: 330 },
  reef: { cx: 72, cy: 348 },
  beach: { cx: 326, cy: 425 },
  kairos: { cx: 200, cy: 450 },
};
const PAINTED_ROOMS: Record<string, Rect> = Object.fromEntries(
  Object.entries(PAINTED_SPOTS).map(([k, { cx, cy }]) => [k, { x: cx - 52, y: cy - 34, w: 104, h: 72 }]),
);
const toPercent = (r: Rect) => ({
  x: +((r.x / VB_W) * 100).toFixed(2),
  y: +((r.y / VB_H) * 100).toFixed(2),
  w: +((r.w / VB_W) * 100).toFixed(2),
  h: +((r.h / VB_H) * 100).toFixed(2),
});
const PAINTED_ROOMS_PCT = Object.fromEntries(Object.entries(PAINTED_ROOMS).map(([k, r]) => [k, toPercent(r)]));

const ORDER = ["moon_deck", "palace", "cafe", "lounge", "grotto", "reef", "beach", "lagoon", "kairos"];

function ariaName(id: string) {
  if (id === "kairos") return "Kairos Members’ Club portal";
  return locationById(id)?.name ?? id;
}

const MAP_CSS = `
.pcw-room { cursor: pointer; outline: none; -webkit-tap-highlight-color: transparent; }
.pcw-room .pcw-glow { opacity: 0; transition: opacity .2s ease; }
.pcw-room:hover .pcw-glow, .pcw-room:focus-visible .pcw-glow { opacity: 1; }
.pcw-room.is-hl .pcw-glow { opacity: 1; animation: pcwPulse 1.4s ease-in-out infinite; }
.pcw-room .pcw-plaque { transition: transform .2s ease; transform-box: fill-box; transform-origin: center; }
.pcw-room:hover .pcw-plaque, .pcw-room:focus-visible .pcw-plaque, .pcw-room.is-hl .pcw-plaque { transform: scale(1.08); }
.pcw-room.is-locked { cursor: not-allowed; }
@keyframes pcwPulse { 0%,100% { opacity: .55; } 50% { opacity: 1; } }
@keyframes pcwDisco { to { transform: rotate(360deg); } }
@keyframes pcwFall { to { stroke-dashoffset: -40; } }
.pcw-disco { animation: pcwDisco 9s linear infinite; transform-box: fill-box; transform-origin: center; }
.pcw-fall { animation: pcwFall 1.1s linear infinite; }
@media (prefers-reduced-motion: reduce) { .pcw-room.is-hl .pcw-glow, .pcw-disco, .pcw-fall { animation: none !important; } }
`;

function Plaque({ cx, cy, lines, gid }: { cx: number; cy: number; lines: string[]; gid: string }) {
  const w = Math.max(...lines.map((l) => l.length)) * 8.1 + 16;
  const h = lines.length * 13 + 8;
  const x = cx - w / 2;
  const y = cy - h / 2;
  return (
    <g className="pcw-plaque">
      <rect x={x} y={y + 2} width={w} height={h} rx={5} fill={PLUM} opacity={0.35} />
      <rect x={x} y={y} width={w} height={h} rx={5} fill={`url(#${gid}-plq)`} stroke="#f39cc7" strokeWidth={1.6} />
      <rect x={x + 2.2} y={y + 2.2} width={w - 4.4} height={h - 4.4} rx={3.5} fill="none" stroke="#fff" strokeWidth={0.9} />
      {lines.map((l, i) => (
        <text
          key={l}
          x={cx}
          y={cy - ((lines.length - 1) * 13) / 2 + i * 13 + 4.3}
          textAnchor="middle"
          fontSize={12.2}
          fontWeight={700}
          fill="#4a2148"
          style={{ fontFamily: "var(--font-display), ui-rounded, system-ui, sans-serif", letterSpacing: "0.05em" }}
        >
          {l}
        </text>
      ))}
    </g>
  );
}

/* ------------------------- room art ------------------------- */

function Palace({ g }: { g: string }) {
  return (
    <g>
      {/* shell crest */}
      <path d="M222 44Q222 12 267 10Q312 12 312 44Z" fill={`url(#${g}-shellpink)`} stroke={PLUM} strokeWidth="1.4" />
      {[-34, -22, -11, 0, 11, 22, 34].map((dx) => (
        <line key={dx} x1="267" y1="42" x2={267 + dx} y2={dx === 0 ? 13 : 16 + Math.abs(dx) * 0.2} stroke={PLUM} strokeOpacity="0.25" strokeWidth="1" />
      ))}
      {/* wall */}
      <path d="M160 152V58Q160 42 176 42H358Q374 42 374 58V152Z" fill={`url(#${g}-pinkwall)`} />
      <path d="M160 152V58Q160 42 176 42H358Q374 42 374 58V152Z" fill={`url(#${g}-dots)`} />
      {/* big crescent moon window */}
      <circle cx="322" cy="92" r="34" fill={`url(#${g}-night)`} stroke={`url(#${g}-gold)`} strokeWidth="5" />
      <circle cx="322" cy="92" r="34" fill="none" stroke={PLUM} strokeWidth="1.2" />
      <path d="M330 68A24 24 0 1 0 330 116A30 30 0 0 1 330 68Z" fill="#ffe7a6" stroke={PLUM} strokeWidth="1" />
      <Glint x={340} y={78} r={3} delay={0.4} />
      <Glint x={306} y={110} r={2.4} delay={1.4} />
      <path d="M288 92H356M322 58V126" stroke="#fff" strokeOpacity="0.25" strokeWidth="1.2" />
      {/* chandelier */}
      <line x1="232" y1="42" x2="232" y2="52" stroke={PLUM} strokeWidth="0.8" />
      <path d="M220 54Q232 62 244 54" fill="none" stroke="#d9ac5c" strokeWidth="1.6" />
      {[220, 226, 232, 238, 244].map((x, i) => (
        <circle key={x} cx={x} cy={56 + (i === 2 ? 4 : i % 2 ? 3 : 0)} r="1.8" fill="#fff7fb" stroke={PLUM} strokeWidth="0.5" />
      ))}
      {/* floor */}
      <rect x="160" y="138" width="214" height="14" fill="#f6c9dc" />
      {Array.from({ length: 11 }, (_, i) => 160 + i * 20).map((x) => (
        <path key={x} d={`M${x} 138l10 14`} stroke={PLUM} strokeOpacity="0.14" strokeWidth="1" />
      ))}
      <ellipse cx="236" cy="146" rx="52" ry="5" fill="#e7d6fb" stroke="#fff" strokeWidth="1.4" />
      {/* canopy bed */}
      <g>
        <path d="M184 72Q232 56 280 72L276 80Q232 66 188 80Z" fill="#ff9fcb" stroke={PLUM} strokeWidth="1.2" />
        <path d="M188 80Q180 104 186 126L194 126Q190 102 196 80Z" fill="#ffc8e2" stroke={PLUM} strokeWidth="0.9" opacity="0.95" />
        <path d="M276 80Q284 104 278 126L270 126Q274 102 268 80Z" fill="#ffc8e2" stroke={PLUM} strokeWidth="0.9" opacity="0.95" />
        <path d="M186 72V138M278 72V138" stroke={`url(#${g}-gold)`} strokeWidth="3" />
        <circle cx="186" cy="70" r="3" fill={`url(#${g}-gold)`} />
        <circle cx="278" cy="70" r="3" fill={`url(#${g}-gold)`} />
        <path d="M196 112Q196 92 232 90Q268 92 268 112Z" fill={`url(#${g}-shellpink)`} stroke={PLUM} strokeWidth="1.2" />
        {[206, 218, 232, 246, 258].map((x) => (
          <line key={x} x1="232" y1="110" x2={x} y2="96" stroke={PLUM} strokeOpacity="0.22" strokeWidth="0.9" />
        ))}
        <rect x="192" y="110" width="80" height="20" rx="6" fill="#ff8fc0" stroke={PLUM} strokeWidth="1.2" />
        <path d="M194 116Q232 108 270 116V128H194Z" fill="#ffb3d6" />
        <ellipse cx="208" cy="111" rx="10" ry="5" fill="#fff7fb" stroke={PLUM} strokeWidth="0.8" />
        <ellipse cx="226" cy="110" rx="9" ry="4.6" fill="#efe2ff" stroke={PLUM} strokeWidth="0.8" />
        <path d="M244 118l2.4 2.4l2.4 -2.4a1.6 1.6 0 0 0 -2.4 -1.8a1.6 1.6 0 0 0 -2.4 1.8z" fill="#fff" />
        <path d="M196 130v8M268 130v8" stroke="#d9ac5c" strokeWidth="2.4" />
      </g>
      {/* vanity */}
      <g>
        <ellipse cx="352" cy="118" rx="8" ry="10" fill={`url(#${g}-mirror)`} stroke={`url(#${g}-gold)`} strokeWidth="2" />
        <rect x="338" y="128" width="28" height="4" rx="1.5" fill="#ffd2e8" stroke={PLUM} strokeWidth="0.8" />
        <path d="M341 132v6M363 132v6" stroke="#d9ac5c" strokeWidth="2" />
        <rect x="341" y="123" width="4" height="5" rx="1.2" fill="#7ee6dc" stroke={PLUM} strokeWidth="0.6" />
      </g>
      <path d="M160 152V58Q160 42 176 42H358Q374 42 374 58V152" fill="none" stroke={`url(#${g}-gold)`} strokeWidth="4" />
      <path d="M160 152V58Q160 42 176 42H358Q374 42 374 58V152" fill="none" stroke={PLUM} strokeWidth="1.1" />
      <Pearl x={267} y={10} r={3.6} />
    </g>
  );
}

function Lagoon({ g }: { g: string }) {
  return (
    <g>
      <ellipse cx="204" cy="424" rx="72" ry="40" fill="#ffe3ef" stroke={PLUM} strokeWidth="1.3" />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        const x = Math.round((204 + Math.cos(a) * 68) * 100) / 100;
        const y = Math.round((424 + Math.sin(a) * 37) * 100) / 100;
        return (
          <g key={i}>
            <ellipse cx={x} cy={y} rx="11" ry="7.5" fill={i % 2 ? "#f6d4e6" : "#ead9f7"} stroke={PLUM} strokeWidth="1" />
            <ellipse cx={x - 3} cy={y - 2.4} rx="4" ry="2" fill="#fff" opacity="0.8" />
          </g>
        );
      })}
      <ellipse cx="204" cy="424" rx="60" ry="30" fill={`url(#${g}-lagoon)`} stroke={PLUM} strokeWidth="1.1" />
      <ellipse cx="190" cy="414" rx="28" ry="8" fill="#fff" opacity="0.3" />
      {[0, 1, 2].map((i) => (
        <ellipse key={i} cx="178" cy="404" rx={6 + i * 6} ry={2 + i * 2} fill="none" stroke="#fff" strokeOpacity={0.8 - i * 0.22} strokeWidth="1.1" />
      ))}
      <g className="pc-bob">
        <ellipse cx="226" cy="430" rx="11" ry="5.5" fill="#ff9fcb" stroke={PLUM} strokeWidth="1" />
        <ellipse cx="226" cy="429" rx="4.5" ry="2.2" fill="#5fd8cf" />
        <path d="M217 428l4 -3M231 425l4 3" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
      </g>
      <g className="pc-bob" style={{ animationDelay: "1.2s" }}>
        <path d="M244 414a7 4 0 1 0 6 2l-6 -2z" fill="#6fd1a8" stroke={PLUM} strokeWidth="0.8" />
        <circle cx="248" cy="412" r="2.4" fill="#ffb3d6" />
      </g>
      {[
        [196, 432, 0],
        [210, 438, 1.1],
        [186, 440, 2.3],
        [240, 432, 3],
      ].map(([x, y, d], i) => (
        <circle key={i} cx={x} cy={y} r={1.8 + (i % 2)} fill="#fff" fillOpacity="0.35" stroke="#fff" strokeWidth="0.8" className="pc-rise" style={{ animationDelay: `${d}s` }} />
      ))}
      <Glint x={236} y={404} r={3.5} delay={0.6} />
    </g>
  );
}

function MoonDeck({ g }: { g: string }) {
  const r = rng(3);
  const stars = Array.from({ length: 16 }, () => ({ x: 22 + r() * 166, y: 30 + r() * 70, s: 1.6 + r() * 3.2, d: r() * 3 }));
  return (
    <g>
      <path d="M16 142V64Q16 26 54 26H154Q192 26 192 64V142Z" fill={`url(#${g}-night)`} />
      {stars.map((s, i) => (
        <Glint key={i} x={s.x} y={s.y} r={s.s} delay={s.d} fill={i % 3 ? "#fff" : "#ffe7b0"} />
      ))}
      {/* moon */}
      <circle cx="56" cy="66" r="26" fill="#fff3c4" opacity="0.12" />
      <circle cx="56" cy="66" r="20" fill="#fff3c4" opacity="0.15" />
      <path d="M62 46A21 21 0 1 0 62 86A26 26 0 0 1 62 46Z" fill="#fff4d6" stroke={PLUM} strokeWidth="1.2" />
      <circle cx="52" cy="62" r="2.4" fill="#f1d9a4" />
      <circle cx="49" cy="74" r="1.6" fill="#f1d9a4" />
      {/* ritual crystal circle */}
      <ellipse cx="128" cy="128" rx="30" ry="6" fill="#c9b0ff" opacity="0.55" />
      {[100, 116, 140, 156].map((x, i) => (
        <g key={x}>
          <rect x={x - 1.6} y={118 + (i % 2) * 3} width="3.2" height="8" rx="1" fill="#fff6e6" stroke={PLUM} strokeWidth="0.6" />
          <ellipse cx={x} cy={116 + (i % 2) * 3} rx="1.6" ry="2.6" fill="#ffcf6e" className="pc-pulse" style={{ animationDelay: `${i * 0.3}s` }} />
        </g>
      ))}
      <path d="M128 106L134 118L128 126L122 118Z" fill="#c9b0ff" stroke={PLUM} strokeWidth="1" />
      <path d="M128 106L130 118L128 126Z" fill="#efe2ff" />
      {/* telescope */}
      <g>
        <line x1="166" y1="128" x2="172" y2="104" stroke="#b98a3a" strokeWidth="2" />
        <line x1="180" y1="128" x2="172" y2="104" stroke="#b98a3a" strokeWidth="2" />
        <line x1="173" y1="128" x2="172" y2="104" stroke="#9d7330" strokeWidth="2" />
        <g transform="rotate(-32 172 102)">
          <rect x="150" y="96" width="38" height="11" rx="3" fill={`url(#${g}-gold)`} stroke={PLUM} strokeWidth="1.2" />
          <rect x="144" y="94" width="9" height="15" rx="2" fill="#f2d48f" stroke={PLUM} strokeWidth="1.2" />
          <rect x="186" y="98" width="6" height="7" rx="1.5" fill="#8f6bf0" stroke={PLUM} strokeWidth="1" />
          <rect x="156" y="98" width="20" height="2.4" rx="1" fill="#fff" opacity="0.7" />
        </g>
      </g>
      {/* deck */}
      <rect x="16" y="128" width="176" height="14" fill="#d9c3f2" />
      {[16, 38, 60, 82, 104, 126, 148, 170].map((x) => (
        <line key={x} x1={x} y1="128" x2={x} y2="142" stroke={PLUM} strokeOpacity="0.2" strokeWidth="1" />
      ))}
      <rect x="16" y="128" width="176" height="2.5" fill="#fff" opacity="0.6" />
      {/* railing */}
      <rect x="16" y="112" width="40" height="2.4" rx="1.2" fill="#fff3d6" stroke={PLUM} strokeWidth="0.6" />
      {[20, 30, 40, 50].map((x) => (
        <rect key={x} x={x - 1} y="114" width="2" height="14" fill="#fff3d6" stroke={PLUM} strokeWidth="0.4" />
      ))}
      <path d="M16 142V64Q16 26 54 26H154Q192 26 192 64V142" fill="none" stroke={`url(#${g}-gold)`} strokeWidth="5" />
      <path d="M16 142V64Q16 26 54 26H154Q192 26 192 64V142" fill="none" stroke={PLUM} strokeWidth="1.2" />
    </g>
  );
}


function Cafe({ g }: { g: string }) {
  return (
    <g>
      <rect x="12" y="152" width="122" height="108" fill="#dff8f4" />
      <rect x="12" y="152" width="122" height="108" fill={`url(#${g}-tile)`} />
      {/* awning */}
      <rect x="12" y="176" width="122" height="8" fill="#fff" />
      {Array.from({ length: 8 }, (_, i) => (
        <path key={i} d={`M${12 + i * 15.25} 176h15.25v8a7.6 7.6 0 0 1 -15.25 0z`} fill={i % 2 ? "#fff" : "#ff9fcb"} stroke={PLUM} strokeWidth="0.8" />
      ))}
      {/* pendant lamps */}
      {[40, 106].map((x) => (
        <g key={x}>
          <line x1={x} y1="192" x2={x} y2="200" stroke={PLUM} strokeWidth="0.8" />
          <path d={`M${x - 7} 207Q${x} 196 ${x + 7} 207Z`} fill="#e9c27a" stroke={PLUM} strokeWidth="0.8" />
          <ellipse cx={x} cy="210" rx="9" ry="4" fill="#fff3c4" opacity="0.5" className="pc-glow" />
        </g>
      ))}
      {/* menu board */}
      <rect x="58" y="192" width="30" height="20" rx="3" fill="#5d4a6e" stroke="#d9ac5c" strokeWidth="1.6" />
      <path d="M63 199h14M63 204h20M63 208h10" stroke="#fff" strokeWidth="1.2" opacity="0.85" strokeLinecap="round" />
      {/* counter */}
      <rect x="18" y="224" width="110" height="7" rx="2" fill="#fbe9c4" stroke={PLUM} strokeWidth="1" />
      <path d="M20 231H126V250H20Z" fill="#ffb3d6" stroke={PLUM} strokeWidth="1" />
      {Array.from({ length: 7 }, (_, i) => (
        <path key={i} d={`M${24 + i * 15} 250v-14a6 6 0 0 1 12 0v14`} fill="#ffd2e8" stroke={PLUM} strokeOpacity="0.4" strokeWidth="0.8" />
      ))}
      {/* matcha cups */}
      {[30, 46].map((x, i) => (
        <g key={x}>
          <path d={`M${x - 5} 206L${x + 5} 206L${x + 4} 224L${x - 4} 224Z`} fill="#e8fff5" stroke={PLUM} strokeWidth="0.9" />
          <path d={`M${x - 4.6} 212L${x + 4.6} 212L${x + 4} 224L${x - 4} 224Z`} fill="#8fd48a" />
          <path d={`M${x - 4.2} 219L${x + 4.2} 219L${x + 4} 224L${x - 4} 224Z`} fill="#ff8fb7" />
          <line x1={x + 2} y1="206" x2={x + 5 - i} y2="198" stroke="#ff6fa8" strokeWidth="1.6" strokeLinecap="round" />
        </g>
      ))}
      {/* cake stand */}
      <g>
        <path d="M96 222h22M107 222v-8" stroke="#d9ac5c" strokeWidth="1.6" />
        <path d="M99 214h16v-6a8 8 0 0 0 -16 0z" fill="#fff0f7" stroke={PLUM} strokeWidth="0.9" />
        <path d="M99 210h16" stroke="#ff9fcb" strokeWidth="2" />
        <circle cx="107" cy="201" r="2.4" fill="#ff5f8f" />
      </g>
      <rect x="12" y="250" width="122" height="10" fill="#bdeee6" />
    </g>
  );
}


function Lounge({ g }: { g: string }) {
  return (
    <g>
      <rect x="139" y="152" width="122" height="108" fill="#d8c6fb" />
      <rect x="139" y="152" width="122" height="108" fill={`url(#${g}-velvet)`} />
      {/* arched mirror */}
      <path d="M182 220V196Q182 180 200 180Q218 180 218 196V220Z" fill={`url(#${g}-mirror)`} stroke={`url(#${g}-gold)`} strokeWidth="3" />
      <path d="M190 206l12 -14M196 214l14 -16" stroke="#fff" strokeWidth="1.5" opacity="0.8" />
      {/* chandelier */}
      <line x1="200" y1="170" x2="200" y2="176" stroke={PLUM} strokeWidth="0.8" />
      <path d="M188 178Q200 186 212 178" fill="none" stroke="#d9ac5c" strokeWidth="1.6" />
      {[188, 194, 200, 206, 212].map((x, i) => (
        <circle key={x} cx={x} cy={180 + (i === 2 ? 4 : i % 2 ? 3 : 0)} r="1.8" fill="#fff7fb" stroke={PLUM} strokeWidth="0.5" />
      ))}
      {/* shell sofas */}
      {[164, 236].map((x) => (
        <g key={x}>
          <path d={`M${x - 20} 238Q${x - 22} 212 ${x} 210Q${x + 22} 212 ${x + 20} 238Z`} fill="#ff9fcb" stroke={PLUM} strokeWidth="1.2" />
          {[-12, -6, 0, 6, 12].map((dx) => (
            <line key={dx} x1={x} y1="236" x2={x + dx * 1.4} y2="214" stroke={PLUM} strokeOpacity="0.25" strokeWidth="1" />
          ))}
          <rect x={x - 22} y="234" width="44" height="10" rx="5" fill="#ffc8e2" stroke={PLUM} strokeWidth="1.2" />
          <path d={`M${x - 18} 244v6M${x + 18} 244v6`} stroke="#d9ac5c" strokeWidth="2" />
        </g>
      ))}
      {/* rug */}
      <ellipse cx="200" cy="253" rx="44" ry="5" fill="#fbe9c4" stroke="#d9ac5c" strokeWidth="1" />
      <rect x="139" y="250" width="122" height="10" fill="#b79be8" opacity="0.6" />
      <ellipse cx="200" cy="253" rx="44" ry="5" fill="#fbe9c4" stroke="#d9ac5c" strokeWidth="1" />
      {/* side table with candle */}
      <rect x="194" y="236" width="12" height="3" rx="1" fill="#e9c27a" />
      <rect x="198.5" y="230" width="3" height="6" fill="#fff" />
      <ellipse cx="200" cy="228" rx="1.4" ry="2.4" fill="#ffcf6e" className="pc-pulse" />
    </g>
  );
}


function Grotto({ g }: { g: string }) {
  const r = rng(11);
  const glitter = Array.from({ length: 22 }, () => ({ x: 270 + r() * 114, y: 160 + r() * 92, s: 0.8 + r() * 1.6 }));
  return (
    <g>
      <rect x="266" y="152" width="122" height="108" fill={`url(#${g}-cave)`} />
      {glitter.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={p.s} fill={i % 3 ? "#ffe3a3" : "#fff"} opacity={0.75} className={i % 4 === 0 ? "anim-twinkle" : undefined} style={{ animationDelay: `${i * 0.21}s` }} />
      ))}
      {/* stalactites */}
      <path d="M266 152H388V168L380 162L374 176L366 164L356 172L346 160L334 170L322 160L312 174L300 162L290 170L280 160L272 168L266 162Z" fill="#4a2a4f" opacity="0.85" />
      {/* light rays */}
      <path d="M327 188L292 250H312Z" fill="#fff3c4" className="pc-ray" />
      <path d="M327 188L362 250H342Z" fill="#ffd2ea" className="pc-ray" style={{ animationDelay: "1.4s" }} />
      {/* disco shell */}
      <line x1="327" y1="166" x2="327" y2="176" stroke="#e9c27a" strokeWidth="1" />
      <g className="pcw-disco">
        <path d="M327 176L313 192Q316 204 327 205Q338 204 341 192Z" fill={`url(#${g}-disco)`} stroke={PLUM} strokeWidth="1.2" />
        {[317, 322, 327, 332, 337].map((x) => (
          <line key={x} x1="327" y1="177" x2={x} y2="203" stroke="#fff" strokeOpacity="0.7" strokeWidth="0.8" />
        ))}
        <path d="M316 190h22M318 197h18" stroke="#fff" strokeOpacity="0.6" strokeWidth="0.8" />
      </g>
      <Glint x={318} y={185} r={3} />
      {/* coupe tower */}
      <g>
        {[
          [358, 242],
          [370, 242],
          [382, 242],
          [364, 230],
          [376, 230],
          [370, 218],
        ].map(([x, y], i) => (
          <g key={i}>
            <path d={`M${x - 6} ${y}Q${x} ${y + 5} ${x + 6} ${y}Z`} fill="#ffe7a6" stroke={PLUM} strokeWidth="0.8" />
            <line x1={x} y1={y + 2.5} x2={x} y2={y + 9} stroke="#fff" strokeWidth="1.2" />
            <line x1={x - 3} y1={y + 9.5} x2={x + 3} y2={y + 9.5} stroke="#fff" strokeWidth="1.2" />
          </g>
        ))}
        <circle cx="372" cy="214" r="1.2" fill="#fff" className="pc-rise" />
        <circle cx="368" cy="226" r="1" fill="#fff" className="pc-rise" style={{ animationDelay: "1.2s" }} />
      </g>
      {/* velvet bench */}
      <rect x="276" y="236" width="34" height="9" rx="4.5" fill="#c9b0ff" stroke={PLUM} strokeWidth="1" />
      <path d="M280 245v6M306 245v6" stroke="#d9ac5c" strokeWidth="2" />
      <rect x="266" y="250" width="122" height="10" fill="#3b2244" />
      <path d="M266 250H388" stroke="#e9c27a" strokeWidth="1.5" />
    </g>
  );
}


function Reef({ g, gid }: { g: string; gid: string }) {
  return (
    <g>
      <path d="M154 410V336Q154 288 200 288Q246 288 246 336V410Z" fill={`url(#${g}-deep)`} />
      <g clipPath={`url(#${gid}-reefclip)`}>
        <path d="M164 300L184 410H174Z" fill="#fff" opacity="0.12" className="pc-ray" />
        <path d="M210 296L236 410H222Z" fill="#fff" opacity="0.12" className="pc-ray" style={{ animationDelay: "2s" }} />
        {/* kelp */}
        {[
          [166, "#3fbf9f", 0],
          [178, "#2fa98d", 0.6],
          [232, "#3fbf9f", 1.2],
          [222, "#4fd0a8", 1.8],
        ].map(([x, c, d], i) => (
          <path
            key={i}
            d={`M${x} 410C${(x as number) - 8} 380 ${(x as number) + 8} 360 ${(x as number) - 2} 326C${(x as number) + 4} 352 ${(x as number) + 4} 380 ${(x as number) + 5} 410Z`}
            fill={c as string}
            stroke={PLUM}
            strokeWidth="0.8"
            className="pc-sway"
            style={{ animationDelay: `${d}s` }}
          />
        ))}
        {/* coral */}
        <path d="M196 404c-2 -8 -8 -10 -8 -18M196 404c0 -10 4 -14 2 -22M196 404c2 -6 8 -8 10 -16" stroke="#ff8a73" strokeWidth="3" strokeLinecap="round" fill="none" />
        {/* crystals */}
        <g>
          <path d="M210 404L214 380L220 404Z" fill="#c9b0ff" stroke={PLUM} strokeWidth="0.9" />
          <path d="M216 404L222 372L228 404Z" fill="#7ee6dc" stroke={PLUM} strokeWidth="0.9" />
          <path d="M224 404L228 386L233 404Z" fill="#ffc8e2" stroke={PLUM} strokeWidth="0.9" />
          <path d="M222 372L224 404" stroke="#fff" strokeWidth="1" opacity="0.8" />
        </g>
        {/* mushrooms */}
        {[
          [176, 392, 9, "#ff9fcb"],
          [188, 398, 6, "#c9b0ff"],
        ].map(([x, y, s, c], i) => (
          <g key={i}>
            <ellipse cx={x as number} cy={(y as number) - 2} rx={(s as number) * 1.4} ry={s as number} fill={c as string} opacity="0.35" className="pc-glow" style={{ animationDelay: `${i}s` }} />
            <rect x={(x as number) - 2} y={y as number} width="4" height={(s as number) + 2} rx="2" fill="#fff6ea" stroke={PLUM} strokeWidth="0.8" />
            <path d={`M${(x as number) - (s as number)} ${(y as number) + 1}Q${x} ${(y as number) - (s as number) * 1.4} ${(x as number) + (s as number)} ${(y as number) + 1}Z`} fill={c as string} stroke={PLUM} strokeWidth="0.9" />
            <circle cx={(x as number) - 2} cy={(y as number) - 3} r="1.3" fill="#fff" />
            <circle cx={(x as number) + 3} cy={(y as number) - 1.5} r="1" fill="#fff" />
          </g>
        ))}
        {[
          [200, 380, 0],
          [206, 390, 1.5],
          [186, 370, 2.6],
        ].map(([x, y, d], i) => (
          <circle key={i} cx={x} cy={y} r="2" fill="none" stroke="#fff" strokeWidth="0.8" className="pc-rise" style={{ animationDelay: `${d}s` }} />
        ))}
        {/* tiny fish */}
        <g className="pc-bob">
          <path d="M196 330q8 -6 14 0q-6 6 -14 0zM210 330l5 -4v8z" fill="#ffd36e" stroke={PLUM} strokeWidth="0.7" />
        </g>
      </g>
      <path d="M154 410V336Q154 288 200 288Q246 288 246 336V410" fill="none" stroke={`url(#${g}-gold)`} strokeWidth="5" />
      <path d="M154 410V336Q154 288 200 288Q246 288 246 336V410" fill="none" stroke={PLUM} strokeWidth="1.2" />
      {[
        [154, 336],
        [168, 300],
        [200, 288],
        [232, 300],
        [246, 336],
      ].map(([x, y]) => (
        <Pearl key={`${x}`} x={x} y={y} r={3.6} />
      ))}
    </g>
  );
}


function Beach({ g }: { g: string }) {
  return (
    <g>
      <path d="M256 384Q258 330 300 318Q340 300 392 304V412Q330 420 290 412Q256 404 256 384Z" fill={`url(#${g}-sand)`} stroke={PLUM} strokeWidth="1.3" />
      <path d="M258 392Q290 410 330 410Q364 410 392 404" fill="none" stroke="#fff" strokeWidth="3" strokeOpacity="0.9" />
      {/* umbrella */}
      <line x1="342" y1="330" x2="348" y2="378" stroke="#b98a3a" strokeWidth="2" />
      <path d="M314 336Q340 310 370 326Z" fill="#ff9fcb" stroke={PLUM} strokeWidth="1.2" />
      <path d="M332 324L340 333L348 320Z" fill="#fff" />
      <path d="M356 321L360 330L370 326Z" fill="#fff" />
      {/* towel */}
      <path d="M318 372L354 368L358 380L322 384Z" fill="#7ee6dc" stroke={PLUM} strokeWidth="1" />
      <path d="M326 371l3 12M338 370l3 12" stroke="#fff" strokeWidth="2" />
      {/* chest */}
      <g>
        <rect x="270" y="368" width="28" height="18" rx="2" fill="#c98a4f" stroke={PLUM} strokeWidth="1.2" />
        <path d="M270 368Q284 354 298 368Z" fill="#dd9f60" stroke={PLUM} strokeWidth="1.2" />
        <rect x="270" y="368" width="28" height="3" fill="#e9c27a" />
        <rect x="282" y="370" width="5" height="6" rx="1" fill="#f3d596" stroke={PLUM} strokeWidth="0.6" />
        <circle cx="290" cy="362" r="2" fill="#fff" opacity="0.8" />
        <Glint x={298} y={358} r={4} delay={0.3} fill="#fff3c4" />
      </g>
      {/* sea glass and starfish */}
      {[
        [306, 396, "#7ee6dc"],
        [314, 400, "#c9b0ff"],
        [300, 402, "#ffc8e2"],
        [368, 394, "#9be7c4"],
      ].map(([x, y, c], i) => (
        <ellipse key={i} cx={x as number} cy={y as number} rx="3" ry="2" fill={c as string} stroke={PLUM} strokeWidth="0.6" transform={`rotate(${i * 30} ${x} ${y})`} />
      ))}
      <path d={star5Path(372, 384, 6, 0.5)} fill="#ff8a73" stroke={PLUM} strokeWidth="0.8" strokeLinejoin="round" />
      <Palm x={384} y={360} h={62} lean={-8} delay={1.2} />
      <Frangipani x={268} y={346} r={4} />
    </g>
  );
}


function Portal({ g }: { g: string }) {
  return (
    <g>
      <ellipse cx="200" cy="486" rx="56" ry="10" fill="#f3e2c8" stroke={PLUM} strokeWidth="1.2" />
      <ellipse cx="200" cy="484" rx="46" ry="6" fill="#fff3e2" />
      <path d="M170 482V446Q170 418 200 418Q230 418 230 446V482Z" fill={`url(#${g}-portal)`} />
      <g className="pc-spin" style={{ transformOrigin: "200px 452px" }}>
        <ellipse cx="200" cy="452" rx="20" ry="24" fill="none" stroke="#fff" strokeOpacity="0.7" strokeWidth="1.4" strokeDasharray="6 8" />
        <ellipse cx="200" cy="452" rx="13" ry="16" fill="none" stroke="#fff3c4" strokeOpacity="0.8" strokeWidth="1.2" strokeDasharray="3 6" />
      </g>
      {/* palm silhouette */}
      <g opacity="0.75">
        <path d="M198 482Q200 466 204 452" stroke="#2c6d75" strokeWidth="2.6" fill="none" />
        <path d="M204 452q-12 -6 -18 2q10 -2 18 -2zM204 452q10 -8 18 -2q-10 0 -18 2zM204 452q-4 -10 -12 -10q6 4 12 10zM204 452q6 -10 14 -8q-8 2 -14 8z" fill="#2c6d75" />
      </g>
      <path d="M170 482V446Q170 418 200 418Q230 418 230 446V482" fill="none" stroke={`url(#${g}-gold)`} strokeWidth="7" />
      <path d="M170 482V446Q170 418 200 418Q230 418 230 446V482" fill="none" stroke={PLUM} strokeWidth="1.3" />
      <path d="M163 482V446Q163 411 200 411Q237 411 237 446V482" fill="none" stroke="#7ee6dc" strokeWidth="2" opacity="0.8" className="pc-glow" />
      <Frangipani x={170} y={420} r={5} rot={10} />
      <Frangipani x={232} y={424} r={4} rot={-20} />
      <Glint x={160} y={436} r={4} delay={0.4} />
      <Glint x={242} y={450} r={5} delay={1.3} />
      <Glint x={200} y={410} r={3.5} delay={2} fill="#fff3c4" />
    </g>
  );
}


/* ------------------------- structure ------------------------- */

function Stairs({ x0, y0, x1, y1, steps = 9, g }: { x0: number; y0: number; x1: number; y1: number; steps?: number; g: string }) {
  const dx = (x1 - x0) / steps;
  const dy = (y1 - y0) / steps;
  return (
    <g pointerEvents="none">
      <path d={`M${x0} ${y0}L${x1} ${y1}L${x1} ${y1 + 8}L${x0} ${y0 + 8}Z`} fill="#e98bbb" opacity="0.6" />
      {Array.from({ length: steps }, (_, i) => {
        const x = x0 + dx * i;
        const y = y0 + dy * i;
        return (
          <g key={i}>
            <rect x={Math.min(x, x + dx) - 6} y={y} width={Math.abs(dx) + 12} height={dy} fill="#ffc8e2" stroke={PLUM} strokeWidth="0.8" />
            <rect x={Math.min(x, x + dx) - 6} y={y} width={Math.abs(dx) + 12} height="2" fill="#fff" opacity="0.8" />
          </g>
        );
      })}
      <path d={`M${x0 + (dx > 0 ? -6 : 6)} ${y0 - 6}L${x1 + (dx > 0 ? -6 : 6)} ${y1 - 6}`} stroke={`url(#${g}-gold)`} strokeWidth="2" />
    </g>
  );
}

export function WorldMap({
  onSelect,
  occupants,
  highlight = null,
  lockedLocations = [],
}: {
  onSelect: (locationId: string) => void;
  occupants?: Record<string, ReactNode[]>;
  highlight?: string | null;
  lockedLocations?: string[];
}) {
  const g = useArtId("wm");
  const r = rng(19);
  const [painted, setPainted] = useState(false);
  const roomsPct = painted ? PAINTED_ROOMS_PCT : WORLD_ROOMS;
  const skyStars = Array.from({ length: 22 }, () => ({ x: Math.round(r() * 4000) / 10, y: Math.round((4 + r() * 150) * 10) / 10, s: Math.round((1.2 + r() * 2) * 10) / 10 }));

  const handleKey = (id: string, locked: boolean) => (e: KeyboardEvent<SVGGElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (!locked) onSelect(id);
    }
  };

  const roomArt = (id: string) => {
    switch (id) {
      case "moon_deck":
        return <MoonDeck g={g} />;
      case "palace":
        return <Palace g={g} />;
      case "cafe":
        return <Cafe g={g} />;
      case "lounge":
        return <Lounge g={g} />;
      case "grotto":
        return <Grotto g={g} />;
      case "reef":
        return <Reef g={g} gid={g} />;
      case "beach":
        return <Beach g={g} />;
      case "lagoon":
        return <Lagoon g={g} />;
      case "kairos":
        return <Portal g={g} />;
    }
    return null;
  };

  return (
    <div className="relative w-full select-none" style={{ aspectRatio: "4 / 5" }}>
      <ArtKeyframes />
      <style>{MAP_CSS}</style>
      <svg viewBox={`0 0 ${VB_W} ${VB_H}`} width="100%" height="100%" className="absolute inset-0 block" role="group" aria-label="Seashell world map">
        <defs>
          <linearGradient id={`${g}-sky`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#21194f" />
            <stop offset="0.3" stopColor="#4a2f80" />
            <stop offset="0.55" stopColor="#9b5aa6" />
            <stop offset="0.75" stopColor="#ef9fc6" />
          </linearGradient>
          <linearGradient id={`${g}-rock`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffd3e6" />
            <stop offset="1" stopColor="#f0a9cc" />
          </linearGradient>
          <linearGradient id={`${g}-falls`} x1="0" x2="1">
            <stop offset="0" stopColor="#7ee6dc" />
            <stop offset="0.5" stopColor="#d9fbf7" />
            <stop offset="1" stopColor="#5fd8cf" />
          </linearGradient>
          <linearGradient id={`${g}-night`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1f1a52" />
            <stop offset="0.6" stopColor="#4b2f86" />
            <stop offset="1" stopColor="#b464a8" />
          </linearGradient>
          <linearGradient id={`${g}-gold`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff3c9" />
            <stop offset="0.5" stopColor="#e7bf73" />
            <stop offset="1" stopColor="#b98a3a" />
          </linearGradient>
          <linearGradient id={`${g}-pearl`} x1="0" x2="1">
            <stop offset="0" stopColor="#f3c4df" />
            <stop offset="0.45" stopColor="#fff4fa" />
            <stop offset="1" stopColor="#efc0dc" />
          </linearGradient>
          <linearGradient id={`${g}-plq`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="1" stopColor="#ffe1ef" />
          </linearGradient>
          <linearGradient id={`${g}-pinkwall`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffe2f0" />
            <stop offset="1" stopColor="#ffc6e0" />
          </linearGradient>
          <linearGradient id={`${g}-shellpink`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#f7a8cf" />
            <stop offset="0.5" stopColor="#fff0f7" />
            <stop offset="1" stopColor="#f2a0c9" />
          </linearGradient>
          <linearGradient id={`${g}-mirror`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f6fbff" />
            <stop offset="0.5" stopColor="#d3dcf7" />
            <stop offset="1" stopColor="#efe1ff" />
          </linearGradient>
          <linearGradient id={`${g}-cave`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#3b2147" />
            <stop offset="0.6" stopColor="#6d3a63" />
            <stop offset="1" stopColor="#a8706a" />
          </linearGradient>
          <linearGradient id={`${g}-disco`} x1="0" x2="1">
            <stop offset="0" stopColor="#d6def8" />
            <stop offset="0.5" stopColor="#ffffff" />
            <stop offset="1" stopColor="#f3c6e6" />
          </linearGradient>
          <radialGradient id={`${g}-lagoon`} cx="0.45" cy="0.4" r="0.7">
            <stop offset="0" stopColor="#c9fbf4" />
            <stop offset="0.6" stopColor="#4fd6cc" />
            <stop offset="1" stopColor="#17a9b3" />
          </radialGradient>
          <linearGradient id={`${g}-deep`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#5fd8cf" />
            <stop offset="0.5" stopColor="#1fa0a8" />
            <stop offset="1" stopColor="#21557e" />
          </linearGradient>
          <linearGradient id={`${g}-sand`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff1d6" />
            <stop offset="1" stopColor="#f3d3a2" />
          </linearGradient>
          <radialGradient id={`${g}-portal`} cx="0.5" cy="0.55" r="0.6">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.35" stopColor="#c9fbf4" />
            <stop offset="0.7" stopColor="#c9b0ff" />
            <stop offset="1" stopColor="#ff9fcb" />
          </radialGradient>
          <radialGradient id={`${g}-warm`} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#fff1c9" stopOpacity="0.7" />
            <stop offset="1" stopColor="#fff1c9" stopOpacity="0" />
          </radialGradient>
          <filter id={`${g}-glow`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" />
          </filter>
          <pattern id={`${g}-tile`} width="10" height="10" patternUnits="userSpaceOnUse">
            <rect width="10" height="10" fill="none" stroke="#fff" strokeWidth="1" />
            <path d="M2 6q3 -3 6 0" stroke="#7ee6dc" strokeWidth="0.8" fill="none" />
          </pattern>
          <pattern id={`${g}-velvet`} width="12" height="12" patternUnits="userSpaceOnUse">
            <rect width="6" height="12" fill="#cbb5f6" />
            <circle cx="9" cy="6" r="0.9" fill="#fff" opacity="0.6" />
          </pattern>
          <pattern id={`${g}-dots`} width="14" height="14" patternUnits="userSpaceOnUse">
            <circle cx="3" cy="3" r="1.1" fill="#fff" opacity="0.8" />
            <path d={starPath(10, 10, 2)} fill="#f7b3d4" />
          </pattern>
          <clipPath id={`${g}-reefclip`}>
            <path d="M154 410V336Q154 288 200 288Q246 288 246 336V410Z" />
          </clipPath>
          <clipPath id={`${g}-shell`}>
            <path d={WORLD_SHELL_PATH} />
          </clipPath>
        </defs>

        <g clipPath={`url(#${g}-shell)`}>
          {/* night sky + warm glow */}
          <rect width={VB_W} height={VB_H} fill={`url(#${g}-sky)`} />
          {skyStars.map((s, i) => (
            <Glint key={i} x={s.x} y={s.y} r={s.s} delay={i * 0.27} fill={i % 3 ? "#fff" : "#ffe7b0"} />
          ))}
          <circle cx="200" cy="230" r="190" fill={`url(#${g}-warm)`} />
          <Palm x={20} y={170} h={96} lean={10} frond="#3c9a7f" frondDark="#2a7a66" delay={0.3} />
          <Palm x={384} y={176} h={90} lean={-10} frond="#3c9a7f" frondDark="#2a7a66" delay={1.1} />

          {/* top tier floor and middle tier back wall */}
          <rect x="14" y="160" width="372" height="114" fill={`url(#${g}-pearl)`} />
          {[18, 142, 254, 378].map((x) => (
            <g key={x} pointerEvents="none">
              <rect x={x - 3} y="160" width="7" height="114" fill="#ffd2e6" stroke={PLUM} strokeWidth="0.9" />
              <rect x={x - 4.5} y="160" width="10" height="5" rx="1.5" fill={`url(#${g}-gold)`} />
            </g>
          ))}
          <rect x="8" y="150" width="384" height="12" fill="#f6b6d6" stroke={PLUM} strokeWidth="1.2" />
          <rect x="8" y="150" width="384" height="3" fill="#fff" opacity="0.8" />
          {Array.from({ length: 24 }, (_, i) => (
            <Pearl key={i} x={14 + i * 16} y={162} r={2.2} />
          ))}

          {/* lower pink rock terrace */}
          <path d="M0 278Q60 270 120 282Q200 292 280 282Q340 270 400 278V500H0Z" fill={`url(#${g}-rock)`} />
          <path d="M0 278Q60 270 120 282Q200 292 280 282Q340 270 400 278" fill="none" stroke={PLUM} strokeWidth="1.2" />
          <rect x="8" y="272" width="384" height="11" fill="#f6b6d6" stroke={PLUM} strokeWidth="1.2" />
          <rect x="8" y="272" width="384" height="3" fill="#fff" opacity="0.8" />
          {/* water channel at the bottom */}
          <path d="M0 470Q100 456 200 466Q300 476 400 462V500H0Z" fill="#4fd6cc" />
          <path d="M0 470Q100 456 200 466Q300 476 400 462" fill="none" stroke="#fff" strokeOpacity="0.7" strokeWidth="2" />

          {/* waterfall from the lounge into the lagoon */}
          <g pointerEvents="none">
            <path d="M154 280H176L182 410H150Z" fill={`url(#${g}-falls)`} opacity="0.95" />
            {[158, 165, 172].map((x, i) => (
              <path key={x} className="pcw-fall" d={`M${x} 282L${x + 1 + i} 410`} stroke="#fff" strokeWidth="1.6" strokeDasharray="10 10" strokeLinecap="round" opacity="0.85" style={{ animationDelay: `${i * 0.2}s` }} />
            ))}
            <ellipse cx="166" cy="408" rx="20" ry="5" fill="#fff" opacity="0.8" className="pc-pulse" />
            <path d="M148 276Q165 296 182 276Z" fill={`url(#${g}-gold)`} stroke={PLUM} strokeWidth="1" />
          </g>
          <Stairs x0={130} y0={284} x1={146} y1={372} steps={8} g={g} />
          <Stairs x0={286} y0={284} x1={266} y1={372} steps={8} g={g} />

          <image
            href={PAINTED_MAP_URL}
            x={PAINTED_IMAGE.x}
            y={PAINTED_IMAGE.y}
            width={PAINTED_IMAGE.w}
            height={PAINTED_IMAGE.h}
            preserveAspectRatio="xMidYMid slice"
            onLoad={() => setPainted(true)}
            style={{ opacity: painted ? 1 : 0, transition: "opacity .5s ease" }}
            pointerEvents="none"
          />

          {/* rooms */}
          {ORDER.map((id) => {
            const rect = painted ? PAINTED_ROOMS[id] : ROOMS_UNITS[id];
            const locked = lockedLocations.includes(id);
            const pl = PLAQUES[id];
            const hl = highlight === id;
            const art = roomArt(id);
            return (
              <g
                key={id}
                role="button"
                tabIndex={0}
                aria-label={locked ? `${ariaName(id)} (locked)` : ariaName(id)}
                aria-disabled={locked || undefined}
                className={`pcw-room${hl ? " is-hl" : ""}${locked ? " is-locked" : ""}`}
                onClick={() => {
                  if (!locked) onSelect(id);
                }}
                onKeyDown={handleKey(id, locked)}
              >
                <rect x={rect.x} y={rect.y} width={rect.w} height={rect.h} fill="#fff" fillOpacity={0} />
                {!painted && (ART_UNITS[id] ? <g transform={fit(id)}>{art}</g> : art)}
                {locked && (
                  <g>
                    <rect x={rect.x} y={rect.y} width={rect.w} height={rect.h} rx="8" fill="#efe2ff" opacity="0.62" />
                    <g transform={`translate(${rect.x + rect.w / 2} ${rect.y + rect.h / 2 + 10})`}>
                      <path d="M-6 -4v-5a6 6 0 0 1 12 0v5" fill="none" stroke="#b98a3a" strokeWidth="2.6" />
                      <rect x="-9" y="-5" width="18" height="14" rx="4" fill="#e9c27a" stroke={PLUM} strokeWidth="1.2" />
                      <circle cy="1.5" r="2" fill={PLUM} />
                    </g>
                  </g>
                )}
                <g className="pcw-glow" pointerEvents="none">
                  <rect x={rect.x + 1} y={rect.y + 1} width={rect.w - 2} height={rect.h - 2} rx="10" fill="#fff6c9" fillOpacity={0.12} stroke="#fff6c9" strokeWidth="5" filter={`url(#${g}-glow)`} />
                  <rect x={rect.x + 1} y={rect.y + 1} width={rect.w - 2} height={rect.h - 2} rx="10" fill="none" stroke="#fff" strokeWidth="1.6" strokeDasharray="1 5" strokeLinecap="round" />
                </g>
                <Plaque cx={painted ? rect.x + rect.w / 2 : (pl.cx ?? rect.x + rect.w / 2)} cy={painted ? rect.y + 8 : pl.cy} lines={pl.lines} gid={g} />
              </g>
            );
          })}
          {!painted && <Field />}
        </g>
        <path d={WORLD_SHELL_PATH} fill="none" stroke={PLUM} strokeOpacity="0.5" strokeWidth="1.5" />
      </svg>

      {/* occupant overlay */}
      {occupants && (
        <div className="pointer-events-none absolute inset-0">
          {Object.entries(occupants).map(([id, nodes]) => {
            const rr = roomsPct[id];
            if (!rr || !nodes?.length) return null;
            return (
              <div
                key={id}
                className="absolute flex flex-wrap content-end items-end justify-center"
                style={{ left: `${rr.x}%`, top: `${rr.y + rr.h * 0.35}%`, width: `${rr.w}%`, height: `${rr.h * 0.6}%`, gap: "2px", paddingBottom: "2%" }}
              >
                {nodes.map((n, i) => (
                  <div key={i}>{n}</div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Floating glitter over the whole map. */
function Field() {
  const r = rng(99);
  return (
    <g pointerEvents="none">
      {Array.from({ length: 12 }, (_, i) => (
        <Glint key={i} x={Math.round((20 + r() * 360) * 10) / 10} y={Math.round((170 + r() * 300) * 10) / 10} r={2 + (i % 3)} delay={i * 0.35} fill={i % 2 ? "#fff" : "#fff3c4"} />
      ))}
    </g>
  );
}
