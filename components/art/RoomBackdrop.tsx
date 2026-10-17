"use client";

import type { ReactNode } from "react";
import type { Floor, Wallpaper } from "@/lib/game/types";
import { ArtKeyframes, Glint, PLUM, Pearl, starPath, useArtId } from "./Sparkles";

/**
 * Floor area (in % of the backdrop box) where a ROOM_COLS x ROOM_ROWS grid of
 * decorations can be laid out in an HTML overlay. It sits fully on the floor.
 */
export const ROOM_FLOOR_BOX = { x: 14, y: 53, w: 72, h: 37 };

const W = 500;
const H = 400;
// Diorama geometry (viewBox units)
const BACK = { x0: 70, x1: 430, y0: 74, y1: 200 };
const OPEN = { x0: 12, x1: 488, y0: 34, y1: 380 };

const BACK_WALL = `M${BACK.x0} ${BACK.y0}H${BACK.x1}V${BACK.y1}H${BACK.x0}Z`;
const LEFT_WALL = `M${OPEN.x0} ${OPEN.y0}L${BACK.x0} ${BACK.y0}V${BACK.y1}L${OPEN.x0} ${OPEN.y1}Z`;
const RIGHT_WALL = `M${OPEN.x1} ${OPEN.y0}L${BACK.x1} ${BACK.y0}V${BACK.y1}L${OPEN.x1} ${OPEN.y1}Z`;
const CEILING = `M${OPEN.x0} ${OPEN.y0}H${OPEN.x1}L${BACK.x1} ${BACK.y0}H${BACK.x0}Z`;
const FLOOR = `M${BACK.x0} ${BACK.y1}H${BACK.x1}L${OPEN.x1} ${OPEN.y1}H${OPEN.x0}Z`;

function WallpaperDefs({ id, kind }: { id: string; kind: Wallpaper }) {
  switch (kind) {
    case "pearl_stripe":
      return (
        <pattern id={id} width="28" height="28" patternUnits="userSpaceOnUse">
          <rect width="28" height="28" fill="#fff6fb" />
          <rect width="14" height="28" fill="#ffd3e8" />
          <rect x="13" width="1.4" height="28" fill="#fff" />
          <circle cx="21" cy="7" r="2.2" fill="#fff" stroke="#f0bcd7" strokeWidth="0.6" />
          <circle cx="21" cy="21" r="1.2" fill="#f7c6de" />
        </pattern>
      );
    case "lagoon_tile":
      return (
        <pattern id={id} width="24" height="24" patternUnits="userSpaceOnUse">
          <rect width="24" height="24" fill="#bff3ec" />
          <rect x="1" y="1" width="22" height="22" rx="3" fill="#d9fbf7" />
          <path d="M5 15q3.5 -4 7 0t7 0" stroke="#5fd8cf" strokeWidth="1.3" fill="none" />
          <circle cx="7" cy="7" r="1.3" fill="#fff" />
        </pattern>
      );
    case "moon_velvet":
      return (
        <pattern id={id} width="40" height="40" patternUnits="userSpaceOnUse">
          <rect width="40" height="40" fill="#4a3a8c" />
          <rect width="20" height="40" fill="#52419a" />
          <path d="M14 8A6 6 0 1 0 14 20A7.5 7.5 0 0 1 14 8Z" fill="#f3d596" />
          <path d={starPath(32, 30, 3.4)} fill="#fff3c9" />
          <circle cx="30" cy="10" r="0.9" fill="#fff" />
          <circle cx="8" cy="32" r="0.9" fill="#fff" />
        </pattern>
      );
    case "coral_damask":
      return (
        <pattern id={id} width="44" height="52" patternUnits="userSpaceOnUse">
          <rect width="44" height="52" fill="#ffb4a3" />
          <g fill="#ffd8cc">
            <path d="M22 6c5 6 9 8 9 14s-5 9 -9 12c-4 -3 -9 -6 -9 -12s4 -8 9 -14z" />
            <path d="M22 34c3 3 6 5 6 9s-3 5 -6 7c-3 -2 -6 -3 -6 -7s3 -6 6 -9z" opacity="0.8" />
            <path d="M0 26c3 -4 6 -5 8 -2c-2 3 -5 4 -8 2zM44 26c-3 -4 -6 -5 -8 -2c2 3 5 4 8 2z" />
          </g>
          <circle cx="22" cy="20" r="2" fill="#f3d596" />
          <circle cx="0" cy="0" r="1.4" fill="#f3d596" />
          <circle cx="44" cy="0" r="1.4" fill="#f3d596" />
          <circle cx="0" cy="52" r="1.4" fill="#f3d596" />
          <circle cx="44" cy="52" r="1.4" fill="#f3d596" />
        </pattern>
      );
    case "kelp_mural":
      return (
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9ff3e8" />
          <stop offset="1" stopColor="#3cbcb8" />
        </linearGradient>
      );
  }
}

function FloorDefs({ id, kind }: { id: string; kind: Floor }) {
  switch (kind) {
    case "shell_parquet":
      return (
        <pattern id={id} width="40" height="20" patternUnits="userSpaceOnUse">
          <rect width="40" height="20" fill="#f3c9a6" />
          <path d="M0 0L20 10L0 20M20 10L40 0M20 10L40 20" stroke="#d99f7b" strokeWidth="1.4" fill="none" />
          <path d="M10 0L30 10M10 20L30 10" stroke="#fbe1cc" strokeWidth="1" fill="none" />
          <path d="M20 7.5l-2.4 3q0.8 2 2.4 2q1.6 0 2.4 -2z" fill="#ffd2e8" stroke="#c98a72" strokeWidth="0.5" />
        </pattern>
      );
    case "sand":
      return (
        <pattern id={id} width="30" height="30" patternUnits="userSpaceOnUse">
          <rect width="30" height="30" fill="#f8e3bd" />
          <path d="M0 12q7 -4 15 0t15 0" stroke="#ecca93" strokeWidth="1.4" fill="none" />
          <circle cx="6" cy="22" r="0.9" fill="#d7ad70" />
          <circle cx="22" cy="5" r="0.8" fill="#fff" />
          <circle cx="25" cy="24" r="1" fill="#e9bd85" />
        </pattern>
      );
    case "marble":
      return (
        <pattern id={id} width="60" height="60" patternUnits="userSpaceOnUse">
          <rect width="60" height="60" fill="#fff8fb" />
          <rect x="0.5" y="0.5" width="59" height="59" fill="none" stroke="#efd6e4" strokeWidth="1.2" />
          <path d="M4 14q14 6 20 18t30 14M30 2q-4 12 6 20" stroke="#e2c2d6" strokeWidth="1.1" fill="none" />
          <path d="M40 40q8 4 16 14" stroke="#e8d0f0" strokeWidth="0.9" fill="none" />
        </pattern>
      );
    case "moss":
      return (
        <pattern id={id} width="34" height="34" patternUnits="userSpaceOnUse">
          <rect width="34" height="34" fill="#8fd6a2" />
          <circle cx="8" cy="8" r="6" fill="#a3e2b2" />
          <circle cx="26" cy="20" r="7" fill="#7cc993" />
          <circle cx="12" cy="27" r="4" fill="#9edfae" />
          <circle cx="24" cy="6" r="1.6" fill="#fff6fb" />
          <circle cx="24" cy="6" r="0.7" fill="#ffd36e" />
          <circle cx="6" cy="20" r="1.4" fill="#ffc8e2" />
        </pattern>
      );
  }
}

function KelpMural() {
  return (
    <g>
      {[96, 140, 190, 300, 350, 400].map((x, i) => (
        <path
          key={x}
          d={`M${x} 200C${x - 12} 170 ${x + 12} 140 ${x - 2} ${96 + (i % 3) * 10}C${x + 8} 140 ${x + 6} 170 ${x + 9} 200Z`}
          fill={i % 2 ? "#4fd0a8" : "#2fa98d"}
          stroke={PLUM}
          strokeOpacity="0.5"
          strokeWidth="1"
          className="pc-sway"
          style={{ animationDelay: `${i * 0.5}s` }}
        />
      ))}
      <path d="M232 120q8 -6 14 0q-6 6 -14 0zM246 120l5 -4v8z" fill="#ffd36e" stroke={PLUM} strokeWidth="0.7" />
      <path d="M260 160q6 -5 11 0q-5 5 -11 0zM271 160l4 -3v6z" fill="#ff9fcb" stroke={PLUM} strokeWidth="0.7" />
      {[
        [120, 150, 0],
        [330, 140, 1.4],
        [214, 170, 2.6],
      ].map(([x, y, d], i) => (
        <circle key={i} cx={x} cy={y} r="3" fill="none" stroke="#fff" strokeWidth="1" className="pc-rise" style={{ animationDelay: `${d}s` }} />
      ))}
    </g>
  );
}

export function RoomBackdrop({ wallpaper, floor, children }: { wallpaper: Wallpaper; floor: Floor; children?: ReactNode }) {
  const g = useArtId("rb");
  const wp = `${g}-wp`;
  const fl = `${g}-fl`;
  const dark = wallpaper === "moon_velvet";
  return (
    <div className="relative w-full select-none" style={{ aspectRatio: "5 / 4" }}>
      <ArtKeyframes />
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" className="absolute inset-0 block" aria-hidden>
        <defs>
          <WallpaperDefs id={wp} kind={wallpaper} />
          <FloorDefs id={fl} kind={floor} />
          <linearGradient id={`${g}-gold`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff3c9" />
            <stop offset="0.5" stopColor="#e7bf73" />
            <stop offset="1" stopColor="#b98a3a" />
          </linearGradient>
          <linearGradient id={`${g}-frame`} x1="0" x2="1">
            <stop offset="0" stopColor="#f1bfdc" />
            <stop offset="0.2" stopColor="#ffe6f2" />
            <stop offset="0.5" stopColor="#fff8fc" />
            <stop offset="0.8" stopColor="#ffe3f1" />
            <stop offset="1" stopColor="#eeb8d6" />
          </linearGradient>
          <linearGradient id={`${g}-floorShade`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#6b3a5e" stopOpacity="0.28" />
            <stop offset="0.35" stopColor="#6b3a5e" stopOpacity="0.05" />
            <stop offset="1" stopColor="#fff" stopOpacity="0.12" />
          </linearGradient>
          <linearGradient id={`${g}-view`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#c9b0ff" />
            <stop offset="0.55" stopColor="#ffd3e2" />
            <stop offset="0.6" stopColor="#7ee6dc" />
            <stop offset="1" stopColor="#22b8b0" />
          </linearGradient>
          <radialGradient id={`${g}-light`} cx="0.5" cy="0" r="0.9">
            <stop offset="0" stopColor="#fff" stopOpacity="0.45" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* room box */}
        <path d={CEILING} fill={dark ? "#3b2f72" : "#fff4fa"} />
        <path d={CEILING} fill={`url(#${wp})`} opacity="0.35" />
        <path d={BACK_WALL} fill={`url(#${wp})`} />
        {wallpaper === "kelp_mural" && <KelpMural />}
        <path d={LEFT_WALL} fill={`url(#${wp})`} />
        <path d={LEFT_WALL} fill="#6b3a5e" opacity="0.16" />
        <path d={RIGHT_WALL} fill={`url(#${wp})`} />
        <path d={RIGHT_WALL} fill="#6b3a5e" opacity="0.1" />

        {/* back-wall window */}
        <g>
          <path d="M218 172V116Q218 92 250 92Q282 92 282 116V172Z" fill={`url(#${g}-view)`} stroke={`url(#${g}-gold)`} strokeWidth="5" />
          <path d="M218 172V116Q218 92 250 92Q282 92 282 116V172Z" fill="none" stroke={PLUM} strokeWidth="1.2" />
          <path d="M250 92V172M218 136H282" stroke="#fff" strokeWidth="2" opacity="0.8" />
          <path d="M262 102A9 9 0 1 0 262 120A11 11 0 0 1 262 102Z" fill="#fff4d6" />
          <Glint x={232} y={110} r={3} delay={0.5} />
        </g>
        {/* shell sconces */}
        {[140, 360].map((x, i) => (
          <g key={x}>
            <circle cx={x} cy="120" r="18" fill="#fff6d6" opacity="0.4" className="pc-glow" style={{ animationDelay: `${i}s` }} />
            <path d={`M${x - 10} 126Q${x} 104 ${x + 10} 126Z`} fill="#ffd2e8" stroke={PLUM} strokeWidth="1" />
            <path d={`M${x} 124L${x - 5} 112M${x} 124V108M${x} 124L${x + 5} 112`} stroke={PLUM} strokeOpacity="0.3" />
            <rect x={x - 2.5} y="126" width="5" height="6" fill={`url(#${g}-gold)`} />
          </g>
        ))}
        {/* baseboard */}
        <path d={`M${BACK.x0} ${BACK.y1 - 8}H${BACK.x1}V${BACK.y1}H${BACK.x0}Z`} fill="#fff6fb" stroke={PLUM} strokeOpacity="0.35" strokeWidth="1" />
        <path d={`M${OPEN.x0} ${OPEN.y1 - 30}L${BACK.x0} ${BACK.y1 - 8}V${BACK.y1}L${OPEN.x0} ${OPEN.y1}Z`} fill="#f3dbe9" />
        <path d={`M${OPEN.x1} ${OPEN.y1 - 30}L${BACK.x1} ${BACK.y1 - 8}V${BACK.y1}L${OPEN.x1} ${OPEN.y1}Z`} fill="#f3dbe9" />
        <path d={`M${BACK.x0} ${BACK.y0}H${BACK.x1}`} stroke={`url(#${g}-gold)`} strokeWidth="4" />
        {/* edges */}
        <path d={`M${OPEN.x0} ${OPEN.y0}L${BACK.x0} ${BACK.y0}V${BACK.y1}L${OPEN.x0} ${OPEN.y1}M${OPEN.x1} ${OPEN.y0}L${BACK.x1} ${BACK.y0}V${BACK.y1}L${OPEN.x1} ${OPEN.y1}`} fill="none" stroke={PLUM} strokeOpacity="0.35" strokeWidth="1.4" />

        {/* floor */}
        <path d={FLOOR} fill={`url(#${fl})`} />
        {Array.from({ length: 9 }, (_, i) => i - 4).map((i) => (
          <line key={i} x1={250 + i * 45} y1={BACK.y1} x2={250 + i * 59.5} y2={OPEN.y1} stroke={PLUM} strokeOpacity="0.07" strokeWidth="1.2" />
        ))}
        <path d={FLOOR} fill={`url(#${g}-floorShade)`} />
        <path d={`M${BACK.x0} ${BACK.y1}H${BACK.x1}`} stroke={PLUM} strokeOpacity="0.35" strokeWidth="1.4" />
        <path d={`M${BACK.x0} ${BACK.y0}H${BACK.x1}V${BACK.y1}H${BACK.x0}Z`} fill={`url(#${g}-light)`} />

        {/* pearly shell arch frame */}
        <path
          d={`M0 400V56Q0 20 36 20H464Q500 20 500 56V400ZM${OPEN.x0} ${OPEN.y1}H${OPEN.x1}V60Q${OPEN.x1} ${OPEN.y0} 460 ${OPEN.y0}H40Q${OPEN.x0} ${OPEN.y0} ${OPEN.x0} 60Z`}
          fillRule="evenodd"
          fill={`url(#${g}-frame)`}
          stroke={PLUM}
          strokeWidth="2.4"
        />
        <path d={`M${OPEN.x0} ${OPEN.y1}V60Q${OPEN.x0} ${OPEN.y0} 40 ${OPEN.y0}H460Q${OPEN.x1} ${OPEN.y0} ${OPEN.x1} 60V${OPEN.y1}`} fill="none" stroke={`url(#${g}-gold)`} strokeWidth="4" />
        <rect x="0" y="380" width="500" height="20" fill={`url(#${g}-frame)`} stroke={PLUM} strokeWidth="2" />
        <rect x="0" y="380" width="500" height="4" fill={`url(#${g}-gold)`} />
        {/* crown scallop */}
        <g>
          <path d="M180 34Q180 -4 250 -4Q320 -4 320 34Z" fill={`url(#${g}-frame)`} stroke={PLUM} strokeWidth="2.2" />
          {[-60, -40, -20, 0, 20, 40, 60].map((dx) => (
            <line key={dx} x1="250" y1="32" x2={250 + dx} y2={dx === 0 ? 0 : 6 + Math.abs(dx) * 0.2} stroke={PLUM} strokeOpacity="0.25" strokeWidth="1.4" />
          ))}
          <Pearl x={250} y={30} r={6} />
        </g>
        {[30, 90, 150, 350, 410, 470].map((x) => (
          <Pearl key={x} x={x} y={27} r={3.6} />
        ))}
        {[80, 160, 240, 320].map((y) => (
          <g key={y}>
            <Pearl x={6} y={y} r={3.2} />
            <Pearl x={494} y={y} r={3.2} />
          </g>
        ))}
        <Glint x={40} y={50} r={4} delay={0.3} />
        <Glint x={470} y={360} r={4} delay={1.4} />
      </svg>
      {children && <div className="absolute inset-0">{children}</div>}
    </div>
  );
}
