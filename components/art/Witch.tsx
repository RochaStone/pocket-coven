"use client";

import { useId, type CSSProperties, type ReactNode } from "react";
import type { AnimationKey, CharacterId, Equipped, HairStyle, Look, Mood } from "@/lib/game/types";
import { INK, OUTLINE, darken, hairPalette, lighten, luminance, mix, safeId, skinPalette, type HairPalette, type SkinPalette } from "./color";

/* ------------------------------------------------------------------ */
/* Geometry                                                            */
/* ------------------------------------------------------------------ */

export interface Build {
  sh: number; // shoulder half width
  wa: number; // waist half width
  hip: number; // hip half width
  sY: number; // shoulder line
  waistY: number;
  hipY: number;
  footY: number;
  legX: number; // leg offset from centre
  armW: number;
  corner: number; // shoulder rounding: big = soft/round, small = square
  andro: boolean;
  baby: boolean;
  headScale: number;
}

const ADULT: Build = { sh: 22, wa: 15.5, hip: 21, sY: 146, waistY: 186, hipY: 196, footY: 252, legX: 8, armW: 8, corner: 7, andro: false, baby: false, headScale: 1 };

export const BUILDS: Record<CharacterId, Build> = {
  rocha: { sh: 18, wa: 15, hip: 19, sY: 143, waistY: 176, hipY: 186, footY: 238, legX: 7, armW: 8.5, corner: 10, andro: false, baby: true, headScale: 1.07 },
  lizz: { sh: 28, wa: 22.5, hip: 22.5, sY: 146, waistY: 192, hipY: 199, footY: 252, legX: 11, armW: 9.5, corner: 2.5, andro: true, baby: false, headScale: 0.98 },
  dray: { ...ADULT, sh: 23 },
  cheryl: { ...ADULT },
  veda: { ...ADULT, sh: 21.5, wa: 15 },
  christiana: { ...ADULT, sh: 21.5 },
  // LaLa is a child: shorter, slighter, a touch more head.
  layla: { sh: 16, wa: 13.5, hip: 15, sY: 142, waistY: 170, hipY: 178, footY: 222, legX: 6, armW: 7, corner: 8, andro: false, baby: false, headScale: 1.06 },
};

export const DEFAULT_BUILD = ADULT;

type Pt = [number, number];
const lerp = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const f = (n: number) => Math.round(n * 100) / 100;

function armPts(b: Build) {
  const S: Pt = [100 + b.sh - 3, b.sY + 5];
  const E: Pt = [100 + b.sh + 5, b.sY + 21];
  const H: Pt = [100 + b.sh + 6.5, b.sY + 36];
  return { S, E, H };
}

function torsoD(b: Build) {
  const L = 100 - b.sh, R = 100 + b.sh, c = b.corner, y = b.sY;
  return `M ${L} ${y + c} Q ${L} ${y} ${L + c} ${y} L ${R - c} ${y} Q ${R} ${y} ${R} ${y + c} L ${100 + b.wa} ${b.waistY} L ${100 - b.wa} ${b.waistY} Z`;
}

/** Garment body from a given top line to a bottom line, following the build's shoulders and waist. */
function garmentD(b: Build, topY: number, botY: number, botW: number, topInset = 0) {
  const L = 100 - b.sh + topInset, R = 100 + b.sh - topInset, c = Math.min(b.corner, 6), y = topY;
  const waist = botY > b.waistY + 1 ? ` L ${100 + b.wa} ${b.waistY} L ${100 + botW} ${botY} L ${100 - botW} ${botY} L ${100 - b.wa} ${b.waistY}` : ` L ${100 + b.wa} ${botY} L ${100 - b.wa} ${botY}`;
  return `M ${L} ${y + c} Q ${L} ${y} ${L + c} ${y} L ${R - c} ${y} Q ${R} ${y} ${R} ${y + c}${waist} Z`;
}

function scallops(x1: number, x2: number, y: number, n: number, depth: number) {
  let s = "";
  const w = (x2 - x1) / n;
  for (let i = 0; i < n; i++) {
    const xa = x1 + w * i;
    s += ` Q ${f(xa + w / 2)} ${f(y + depth)} ${f(xa + w)} ${y}`;
  }
  return s;
}

function skirtD(sy: number, sw: number, hy: number, hw: number, n = 6, depth = 4) {
  return `M ${100 - sw} ${sy} L ${100 + sw} ${sy} Q ${100 + hw - 1} ${(sy + hy) / 2} ${100 + hw} ${hy}${scallops(100 + hw, 100 - hw, hy, n, depth)} Q ${100 - hw + 1} ${(sy + hy) / 2} ${100 - sw} ${sy} Z`;
}

function trousersD(b: Build, ankleY: number, extra = 1) {
  const hw = Math.max(b.wa, b.hip - 2) + extra;
  const top = b.waistY - 2;
  return `M ${100 - b.wa} ${top} L ${100 + b.wa} ${top} L ${100 + hw} ${b.hipY} L ${100 + hw + 0.5} ${ankleY} L 102 ${ankleY} L 100 ${b.hipY + 9} L 98 ${ankleY} L ${100 - hw - 0.5} ${ankleY} L ${100 - hw} ${b.hipY} Z`;
}

export function starD(cx: number, cy: number, r1: number, r2: number, n = 5, rot = -90) {
  let d = "";
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 === 0 ? r1 : r2;
    const a = ((rot + (i * 180) / n) * Math.PI) / 180;
    d += `${i === 0 ? "M" : "L"} ${f(cx + r * Math.cos(a))} ${f(cy + r * Math.sin(a))} `;
  }
  return d + "Z";
}

export const SPARKLE_D = "M0 -6 Q 1 -1 6 0 Q 1 1 0 6 Q -1 1 -6 0 Q -1 -1 0 -6 Z";
export const HEART_D = "M0 3.4 C -4.2 0 -6.4 -3.2 -3.6 -5.6 C -2 -6.8 -0.4 -6.1 0 -4.6 C 0.4 -6.1 2 -6.8 3.6 -5.6 C 6.4 -3.2 4.2 0 0 3.4 Z";

const ol = { stroke: OUTLINE, strokeWidth: 1.8, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
const thin = { stroke: OUTLINE, strokeWidth: 1.2, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

function Grad({ id, stops, x2 = 0, y2 = 1 }: { id: string; stops: [number, string, number?][]; x2?: number; y2?: number }) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2={x2} y2={y2}>
      {stops.map(([o, c, op], i) => (
        <stop key={i} offset={o} stopColor={c} stopOpacity={op ?? 1} />
      ))}
    </linearGradient>
  );
}

/* ------------------------------------------------------------------ */
/* Outfits                                                             */
/* ------------------------------------------------------------------ */

type SleeveKind = "none" | "puff" | "cap" | "tee" | "rolled" | "bell" | "flutter" | "long";
type ShoeKind = "maryjane" | "boots" | "sneakers" | "sandals" | "loafers" | "slippers";
type Mode = "full" | "tail" | "tunic";

interface OCtx {
  b: Build;
  u: string;
  mode: Mode;
}

interface OutfitDef {
  sleeve: SleeveKind;
  sleeveFill: string;
  sleeveTrim?: string;
  shoes: ShoeKind;
  shoeColor: string;
  trousers?: string; // native trousers colour
  andTrousers?: string; // trousers used instead of a skirt on an androgynous build
  leggings?: string;
  draw: (c: OCtx) => { lower?: ReactNode; upper: ReactNode };
}

function Glitter({ pts, color = "#fff", s = 1 }: { pts: Pt[]; color?: string; s?: number }) {
  return (
    <g fill={color}>
      {pts.map(([x, y], i) => (
        <path key={i} d={SPARKLE_D} transform={`translate(${x} ${y}) scale(${(i % 3 === 0 ? 0.42 : 0.28) * s})`} />
      ))}
    </g>
  );
}

const OUTFITS: Record<string, OutfitDef> = {
  outfit_babydoll_y2k: {
    sleeve: "puff",
    sleeveFill: "#ffa8d2",
    sleeveTrim: "#fff4fa",
    shoes: "maryjane",
    shoeColor: "#ff7fbf",
    andTrousers: "#6a5a84",
    draw: ({ b, u, mode }) => {
      const emp = b.sY + 15;
      const hemY = mode === "tail" ? b.waistY + 5 : mode === "tunic" ? b.hipY + 6 : b.waistY + (b.baby ? 20 : 26);
      const hemW = mode === "tail" ? b.wa + 9 : mode === "tunic" ? b.hip + 5 : b.hip + 12;
      const n = mode === "tail" ? 5 : 7;
      return {
        lower: (
          <g>
            <defs>
              <Grad id={`${u}-bd`} stops={[[0, "#ffaed6"], [0.6, "#ff94c6"], [1, "#f075b0"]]} />
            </defs>
            <path d={skirtD(emp, b.sh - 4, hemY + 2, hemW + 1, n, 4)} fill="#fff6fb" {...ol} />
            <path d={skirtD(emp, b.sh - 4, hemY, hemW, n, 3.5)} fill={`url(#${u}-bd)`} {...ol} />
            <path d={`M ${100 - 6} ${emp + 4} L ${100 - 10} ${hemY - 2} M ${100 + 6} ${emp + 4} L ${100 + 10} ${hemY - 2} M 100 ${emp + 4} L 100 ${hemY - 1}`} stroke="#e46aa6" strokeWidth={1} fill="none" opacity={0.6} />
            <Glitter pts={[[100 - hemW + 9, hemY - 7], [92, emp + 14], [108, emp + 10], [100 + hemW - 8, hemY - 9], [100, hemY - 6]]} />
          </g>
        ),
        upper: (
          <g>
            <path d={`M ${100 - b.sh + 3} ${b.sY + 3} Q 100 ${b.sY + 13} ${100 + b.sh - 3} ${b.sY + 3} L ${100 + b.sh - 3} ${emp} L ${100 - b.sh + 3} ${emp} Z`} fill="#ffb0d6" {...ol} />
            <path d={`M ${100 - b.sh + 4} ${b.sY + 4} Q 100 ${b.sY + 14} ${100 + b.sh - 4} ${b.sY + 4}`} fill="none" stroke="#fff6fb" strokeWidth={2.2} strokeDasharray="0.1 3.2" strokeLinecap="round" />
            <rect x={100 - b.sh + 2.5} y={emp - 2.2} width={(b.sh - 2.5) * 2} height={4.4} rx={2} fill="#fff1f8" {...thin} />
            <g transform={`translate(100 ${emp})`}>
              <path d="M0 0 C -4 -5 -10 -4 -9 0 C -10 4 -4 5 0 0 Z M0 0 C 4 -5 10 -4 9 0 C 10 4 4 5 0 0 Z" fill="#ff7fbf" {...thin} />
              <path d="M -1 1 L -4 8 M 1 1 L 4 8" stroke="#ff7fbf" strokeWidth={2} strokeLinecap="round" />
              <circle r={1.8} fill="#ffe3f1" {...thin} />
            </g>
          </g>
        ),
      };
    },
  },
  outfit_pearl_gown: {
    sleeve: "none",
    sleeveFill: "#fff8ee",
    shoes: "slippers",
    shoeColor: "#f6e2c8",
    andTrousers: "#d8c2a6",
    draw: ({ b, u, mode }) => {
      const hemY = mode === "tail" ? b.waistY + 10 : mode === "tunic" ? b.hipY + 10 : b.footY - 7;
      const hemW = mode === "tail" ? b.wa + 10 : mode === "tunic" ? b.hip + 5 : b.hip + 17;
      const top = b.sY + 7;
      return {
        lower: (
          <g>
            <defs>
              <Grad id={`${u}-pg`} stops={[[0, "#fffaf2"], [0.5, "#f7e6cf"], [0.8, "#f4dcd8"], [1, "#e2c6a2"]]} />
              <Grad id={`${u}-pi`} x2={1} y2={0} stops={[[0, "#ffd9ec", 0.0], [0.35, "#ffd9ec", 0.55], [0.6, "#cdf3f5", 0.5], [1, "#e7dcff", 0]]} />
            </defs>
            <path d={skirtD(b.waistY - 1, b.wa, hemY, hemW, mode === "full" ? 8 : 5, 3.5)} fill={`url(#${u}-pg)`} {...ol} />
            <path d={skirtD(b.waistY - 1, b.wa, hemY, hemW, mode === "full" ? 8 : 5, 3.5)} fill={`url(#${u}-pi)`} opacity={0.7} />
            {mode === "full" && <path d={`M 94 ${b.waistY + 6} Q 88 ${hemY - 30} 84 ${hemY - 2} M 106 ${b.waistY + 6} Q 112 ${hemY - 30} 117 ${hemY - 2} M 100 ${b.waistY + 8} L 100 ${hemY}`} stroke="#d9b48c" strokeWidth={1} fill="none" opacity={0.6} />}
            {mode === "full" &&
              Array.from({ length: 9 }, (_, i) => {
                const x = 100 - hemW + 6 + (i * (hemW * 2 - 12)) / 8;
                return <circle key={i} cx={x} cy={hemY - 4} r={1.7} fill="#fff" stroke="#d9b48c" strokeWidth={0.6} />;
              })}
          </g>
        ),
        upper: (
          <g>
            <path d={`M ${100 - b.sh + 4} ${top + 2} Q ${100 - 8} ${top - 4} 100 ${top + 4} Q ${100 + 8} ${top - 4} ${100 + b.sh - 4} ${top + 2} L ${100 + b.wa + 0.5} ${b.waistY} L ${100 - b.wa - 0.5} ${b.waistY} Z`} fill="#fff8ee" {...ol} />
            <path d={`M ${100 - b.sh + 4} ${top + 2} Q ${100 - 8} ${top - 4} 100 ${top + 4} Q ${100 + 8} ${top - 4} ${100 + b.sh - 4} ${top + 2} L ${100 + b.wa + 0.5} ${b.waistY} L ${100 - b.wa - 0.5} ${b.waistY} Z`} fill={`url(#${u}-pi)`} opacity={0.6} />
            {[0, 1, 2].map((r) => (
              <path key={r} d={`M ${100 - b.wa + 1} ${top + 9 + r * 7} Q 100 ${top + 14 + r * 7} ${100 + b.wa - 1} ${top + 9 + r * 7}`} fill="none" stroke="#fff" strokeWidth={2.4} strokeDasharray="0.1 3" strokeLinecap="round" />
            ))}
            {[-1, 1].map((s) => (
              <path key={s} d={`M ${100 + s * (b.sh - 4)} ${top + 2} Q ${100 + s * (b.sh + 1)} ${top - 4} ${100 + s * (b.sh - 1)} ${b.sY + 8}`} fill="none" stroke="#fff" strokeWidth={2.6} strokeDasharray="0.1 3" strokeLinecap="round" />
            ))}
            <rect x={100 - b.wa - 1} y={b.waistY - 3} width={(b.wa + 1) * 2} height={3.5} rx={1.7} fill="#f2d79b" {...thin} />
          </g>
        ),
      };
    },
  },
  outfit_moon_robe: {
    sleeve: "bell",
    sleeveFill: "#30357d",
    sleeveTrim: "#e9c27a",
    shoes: "slippers",
    shoeColor: "#30357d",
    andTrousers: "#2a2f63",
    draw: ({ b, u, mode }) => {
      const hemY = mode === "tail" ? b.waistY + 8 : mode === "tunic" ? b.hipY + 24 : b.footY - 5;
      const hemW = mode === "tail" ? b.wa + 7 : mode === "tunic" ? b.hip + 9 : b.hip + 14;
      const stars: Pt[] = [[100 - hemW + 8, hemY - 10], [92, b.waistY + 16], [111, b.waistY + 26], [100 + hemW - 9, hemY - 18], [96, hemY - 14], [100 - b.sh + 6, b.sY + 18]];
      return {
        lower: (
          <g>
            <defs>
              <Grad id={`${u}-mr`} stops={[[0, "#3b41a0"], [0.6, "#2a2f74"], [1, "#1d2056"]]} />
            </defs>
            <path d={`M ${100 - b.wa} ${b.waistY - 1} L ${100 + b.wa} ${b.waistY - 1} Q ${100 + hemW - 1} ${(b.waistY + hemY) / 2} ${100 + hemW} ${hemY} Q 100 ${hemY + 4} ${100 - hemW} ${hemY} Q ${100 - hemW + 1} ${(b.waistY + hemY) / 2} ${100 - b.wa} ${b.waistY - 1} Z`} fill={`url(#${u}-mr)`} {...ol} />
            <path d={`M ${100 + hemW - 1} ${hemY - 1} Q 100 ${hemY + 3} ${100 - hemW + 1} ${hemY - 1}`} fill="none" stroke="#e9c27a" strokeWidth={2.2} />
            <path d={`M 103 ${b.waistY} L ${104 + (hemW - b.wa) * 0.25} ${hemY + 1}`} stroke="#e9c27a" strokeWidth={1.6} />
            {stars.slice(0, mode === "full" ? 5 : 2).map(([x, y], i) => (
              <path key={i} d={SPARKLE_D} transform={`translate(${x} ${y}) scale(${i % 2 ? 0.45 : 0.6})`} fill={i % 2 ? "#fff" : "#f4d68e"} />
            ))}
            {mode === "full" && <path d="M0 -4 A4 4 0 1 0 3 3 A3 3 0 1 1 0 -4 Z" transform={`translate(${100 - hemW / 2} ${hemY - 26})`} fill="#f4d68e" />}
          </g>
        ),
        upper: (
          <g>
            <path d={garmentD(b, b.sY, b.waistY, b.wa)} fill={`url(#${u}-mr)`} {...ol} />
            <path d={`M ${100 - 9} ${b.sY} L 100 ${b.sY + 16} L ${100 + 9} ${b.sY}`} fill="#4b52b8" stroke="#e9c27a" strokeWidth={1.8} strokeLinejoin="round" />
            <path d={`M ${100 - 9} ${b.sY} L 103 ${b.waistY}`} stroke="#e9c27a" strokeWidth={1.6} fill="none" />
            <rect x={100 - b.wa - 1} y={b.waistY - 4} width={(b.wa + 1) * 2} height={4} rx={2} fill="#e9c27a" {...thin} />
            <path d={`M ${100 - b.wa + 3} ${b.waistY - 1} q -1 6 -3 10 M ${100 - b.wa + 3} ${b.waistY - 1} q 2 6 1 11`} stroke="#e9c27a" strokeWidth={1.6} fill="none" strokeLinecap="round" />
            <circle cx={100 - b.wa + 3} cy={b.waistY - 1} r={2} fill="#f4d68e" {...thin} />
            <path d={SPARKLE_D} transform={`translate(${100 + b.sh - 7} ${b.sY + 14}) scale(0.5)`} fill="#f4d68e" />
          </g>
        ),
      };
    },
  },
  outfit_leather_jacket: {
    sleeve: "rolled",
    sleeveFill: "#2e2734",
    sleeveTrim: "#4a3f55",
    shoes: "boots",
    shoeColor: "#241e2a",
    trousers: "#4c4a62",
    draw: ({ b, u }) => {
      const bot = b.waistY + 5;
      const botW = b.wa + 2.5;
      return {
        upper: (
          <g>
            <defs>
              <Grad id={`${u}-lj`} x2={1} y2={1} stops={[[0, "#55495f"], [0.45, "#2e2734"], [1, "#1f1a24"]]} />
            </defs>
            {/* black crop top, cut low enough to show collarbone ink */}
            <path d={`M ${100 - b.wa - 1} ${b.sY + 6} Q 100 ${b.sY + 16} ${100 + b.wa + 1} ${b.sY + 6} L ${100 + b.wa + 0.5} ${b.waistY - 7} Q 100 ${b.waistY - 5} ${100 - b.wa - 0.5} ${b.waistY - 7} Z`} fill="#1f1a24" {...ol} />
            <path d={`M ${100 - 8} ${b.sY + 12} Q 100 ${b.sY + 17} ${100 + 8} ${b.sY + 12}`} stroke="#4d4456" strokeWidth={1} fill="none" />
            {/* jacket panels */}
            <path d={`M ${100 - b.sh} ${b.sY + b.corner} Q ${100 - b.sh} ${b.sY} ${100 - b.sh + b.corner} ${b.sY} L ${100 - 7} ${b.sY} L ${100 - 5} ${b.sY + 22} L ${100 - 4} ${bot} L ${100 - botW} ${bot} Z`} fill={`url(#${u}-lj)`} {...ol} />
            <path d={`M ${100 + b.sh} ${b.sY + b.corner} Q ${100 + b.sh} ${b.sY} ${100 + b.sh - b.corner} ${b.sY} L ${100 + 7} ${b.sY} L ${100 + 5} ${b.sY + 22} L ${100 + 4} ${bot} L ${100 + botW} ${bot} Z`} fill={`url(#${u}-lj)`} {...ol} />
            {/* lapels */}
            <path d={`M ${100 - 7} ${b.sY} L ${100 - 13} ${b.sY + 3} L ${100 - 6} ${b.sY + 18} Z`} fill="#463b52" {...thin} />
            <path d={`M ${100 + 7} ${b.sY} L ${100 + 13} ${b.sY + 3} L ${100 + 6} ${b.sY + 18} Z`} fill="#463b52" {...thin} />
            {[[-11, 4], [11, 4], [-8.5, 9], [8.5, 9]].map(([x, y], i) => (
              <circle key={i} cx={100 + x} cy={b.sY + y} r={1} fill="#e9e6f2" stroke="#8d88a0" strokeWidth={0.4} />
            ))}
            <path d={`M ${100 + 5.5} ${b.sY + 20} L ${100 + 4.5} ${bot - 1}`} stroke="#bdb8cc" strokeWidth={1} strokeDasharray="1.2 1" />
            <path d={`M ${100 - b.sh + 4} ${b.sY + 6} Q ${100 - b.sh + 3} ${b.sY + 20} ${100 - b.sh + 6} ${bot - 4}`} stroke="#7a6e86" strokeWidth={1.2} fill="none" opacity={0.7} />
            <rect x={100 - botW + 2} y={bot - 4.5} width={botW - 7} height={1.2} fill="#5d5168" />
          </g>
        ),
      };
    },
  },
  outfit_coral_sarong: {
    sleeve: "none",
    sleeveFill: "#ff8a73",
    shoes: "sandals",
    shoeColor: "#ff7a68",
    andTrousers: "#f07a6c",
    draw: ({ b, u, mode }) => {
      const hemY = mode === "tail" ? b.waistY + 13 : b.footY - (b.baby ? 16 : 24);
      const hemW = mode === "tail" ? b.wa + 9 : b.hip + 9;
      const knotX = 100 - b.wa - 1;
      return {
        lower:
          mode === "tunic" ? (
            <g>
              <path d={`M ${100 - b.wa - 1} ${b.waistY - 2} L ${100 + b.wa + 1} ${b.waistY - 2} L ${100 + b.wa + 1} ${b.waistY + 3} L ${100 - b.wa - 1} ${b.waistY + 3} Z`} fill="#ffb199" {...thin} />
              <path d={`M ${knotX} ${b.waistY} q -3 8 -1 14 M ${knotX} ${b.waistY} q 4 7 3 13`} stroke="#ff6f61" strokeWidth={2.4} fill="none" strokeLinecap="round" />
              <circle cx={knotX} cy={b.waistY} r={2.4} fill="#ff6f61" {...thin} />
            </g>
          ) : (
            <g>
              <defs>
                <Grad id={`${u}-cs`} stops={[[0, "#ffb199"], [0.55, "#ff8a73"], [1, "#f0606a"]]} />
              </defs>
              <path d={`M ${100 - b.wa - 1} ${b.waistY - 2} L ${100 + b.wa + 1} ${b.waistY - 2} Q ${100 + hemW} ${(b.waistY + hemY) / 2} ${100 + hemW - 2} ${hemY} L ${100 - hemW} ${hemY + 2} Q ${100 - hemW + 1} ${(b.waistY + hemY) / 2} ${100 - b.wa - 1} ${b.waistY - 2} Z`} fill={`url(#${u}-cs)`} {...ol} />
              <path d={`M ${100 + b.wa} ${b.waistY} Q ${104} ${(b.waistY + hemY) / 2} ${100 + 6} ${hemY + 1}`} fill="none" stroke="#e5505a" strokeWidth={1.4} />
              {[[-6, 12], [7, 22], [-10, 30], [3, 38]].filter(([, y]) => b.waistY + y < hemY - 3).map(([x, y], i) => (
                <g key={i} transform={`translate(${100 + x} ${b.waistY + y})`}>
                  {[0, 72, 144, 216, 288].map((a) => (
                    <ellipse key={a} cx={0} cy={-2} rx={1.3} ry={2} fill="#fff1e4" opacity={0.9} transform={`rotate(${a})`} />
                  ))}
                  <circle r={0.9} fill="#ffd27a" />
                </g>
              ))}
              <path d={`M ${knotX} ${b.waistY} q -4 8 -2 15 M ${knotX} ${b.waistY} q 4 8 3 14`} stroke="#ff6f61" strokeWidth={2.6} fill="none" strokeLinecap="round" />
              <circle cx={knotX} cy={b.waistY} r={2.8} fill="#ff6f61" {...thin} />
            </g>
          ),
        upper: b.andro ? (
          <g>
            <path d={`M ${100 - b.sh + 6} ${b.sY + 1} L ${100 - b.sh + 9} ${b.sY + 1} Q 100 ${b.sY + 10} ${100 + b.sh - 9} ${b.sY + 1} L ${100 + b.sh - 6} ${b.sY + 1} L ${100 + b.wa} ${b.waistY - 6} L ${100 - b.wa} ${b.waistY - 6} Z`} fill="#ff9a83" {...ol} />
            <path d={`M ${100 - b.wa + 1} ${b.waistY - 9} L ${100 + b.wa - 1} ${b.waistY - 9}`} stroke="#ffd2c2" strokeWidth={1.4} />
          </g>
        ) : (
          <g>
            <path d={`M ${100 - b.sh + 4} ${b.sY + 10} Q ${100 - 8} ${b.sY + 6} 100 ${b.sY + 11} Q ${100 + 8} ${b.sY + 6} ${100 + b.sh - 4} ${b.sY + 10} L ${100 + b.sh - 5} ${b.sY + 20} Q 100 ${b.sY + 22} ${100 - b.sh + 5} ${b.sY + 20} Z`} fill="#ffb3a7" {...ol} />
            {[-1, 1].map((s) => (
              <path key={s} d={`M ${100 + s * 2} ${b.sY + 19} L ${100 + s * 6} ${b.sY + 9} M ${100 + s * 2} ${b.sY + 19} L ${100 + s * 10} ${b.sY + 10} M ${100 + s * 2} ${b.sY + 19} L ${100 + s * 13.5} ${b.sY + 13}`} stroke="#ff7a68" strokeWidth={0.9} fill="none" />
            ))}
            <circle cx={100} cy={b.sY + 14} r={1.8} fill="#f4d68e" {...thin} />
          </g>
        ),
      };
    },
  },
  outfit_mist_gown: {
    sleeve: "flutter",
    sleeveFill: "#e4d6ff",
    shoes: "slippers",
    shoeColor: "#cdb8f7",
    andTrousers: "#8a7db3",
    draw: ({ b, u, mode }) => {
      const hemY = mode === "tail" ? b.waistY + 20 : mode === "tunic" ? b.hipY + 12 : b.footY - 5;
      const hemW = mode === "tail" ? b.wa + 12 : mode === "tunic" ? b.hip + 6 : b.hip + 18;
      return {
        lower: (
          <g>
            <defs>
              <Grad id={`${u}-mg`} stops={[[0, "#efe4ff"], [0.55, "#d3c0fa"], [1, "#b9e9ee"]]} />
            </defs>
            <path d={skirtD(b.waistY - 1, b.wa, hemY + 1, hemW + 4, 5, 6)} fill="#e9dcff" opacity={0.65} {...ol} strokeOpacity={0.5} />
            <path d={skirtD(b.waistY - 1, b.wa, hemY - 3, hemW - 2, 6, 5)} fill={`url(#${u}-mg)`} opacity={mode === "tail" ? 0.8 : 0.95} {...ol} />
            <path d={`M 96 ${b.waistY + 4} Q 92 ${(b.waistY + hemY) / 2} 90 ${hemY - 6} M 104 ${b.waistY + 4} Q 108 ${(b.waistY + hemY) / 2} 111 ${hemY - 6}`} stroke="#fff" strokeWidth={1.4} fill="none" opacity={0.7} />
            {mode === "full" && <Glitter pts={[[86, hemY - 18], [114, hemY - 28], [100, hemY - 10]]} color="#ffffff" />}
          </g>
        ),
        upper: (
          <g>
            <path d={`M ${100 - b.sh + 3} ${b.sY + 2} Q 100 ${b.sY + 14} ${100 + b.sh - 3} ${b.sY + 2} L ${100 + b.wa} ${b.waistY} L ${100 - b.wa} ${b.waistY} Z`} fill="#dccbfb" {...ol} />
            <path d={`M ${100 - b.sh + 5} ${b.sY + 4} Q 100 ${b.sY + 16} ${100 + b.sh - 5} ${b.sY + 4}`} fill="none" stroke="#fff" strokeWidth={1.2} opacity={0.8} />
            <path d={`M ${100 - b.wa - 1} ${b.waistY - 3} Q 100 ${b.waistY + 1} ${100 + b.wa + 1} ${b.waistY - 3} L ${100 + b.wa + 1} ${b.waistY} Q 100 ${b.waistY + 4} ${100 - b.wa - 1} ${b.waistY} Z`} fill="#b9e9ee" {...thin} />
            <path d={`M ${100 + b.wa - 2} ${b.waistY} q 3 8 8 12 M ${100 + b.wa - 2} ${b.waistY} q 0 9 2 15`} stroke="#b9e9ee" strokeWidth={1.8} fill="none" strokeLinecap="round" />
          </g>
        ),
      };
    },
  },
  outfit_kairos_active: {
    sleeve: "none",
    sleeveFill: "#8fdccd",
    shoes: "sneakers",
    shoeColor: "#ffb3d1",
    leggings: "#6fc6b8",
    andTrousers: "#6fc6b8",
    draw: ({ b, mode }) => ({
      lower:
        mode === "full" ? (
          <path d={`M ${100 - b.wa - 1} ${b.waistY - 3} L ${100 + b.wa + 1} ${b.waistY - 3} L ${100 + b.wa + 2} ${b.waistY + 3} L ${100 - b.wa - 2} ${b.waistY + 3} Z`} fill="#ffb3d1" {...thin} />
        ) : mode === "tunic" ? (
          <path d={`M ${100 - b.wa - 1} ${b.waistY - 3} L ${100 + b.wa + 1} ${b.waistY - 3} L ${100 + b.wa + 1} ${b.waistY + 2} L ${100 - b.wa - 1} ${b.waistY + 2} Z`} fill="#ffb3d1" {...thin} />
        ) : undefined,
      upper: b.andro ? (
        <g>
          <path d={`M ${100 - b.sh + 5} ${b.sY} L ${100 - 8} ${b.sY} Q 100 ${b.sY + 8} ${100 + 8} ${b.sY} L ${100 + b.sh - 5} ${b.sY} L ${100 + b.wa} ${b.waistY - 2} L ${100 - b.wa} ${b.waistY - 2} Z`} fill="#a8e6da" {...ol} />
          <path d={`M ${100 - b.sh + 6} ${b.sY + 2} L ${100 - b.wa + 1} ${b.waistY - 3} M ${100 + b.sh - 6} ${b.sY + 2} L ${100 + b.wa - 1} ${b.waistY - 3}`} stroke="#ffb3d1" strokeWidth={1.4} />
        </g>
      ) : (
        <g>
          <path d={`M ${100 - b.sh + 6} ${b.sY + 1} L ${100 - 7} ${b.sY + 1} Q 100 ${b.sY + 8} ${100 + 7} ${b.sY + 1} L ${100 + b.sh - 6} ${b.sY + 1} L ${100 + b.wa + 2} ${b.sY + 22} Q 100 ${b.sY + 24} ${100 - b.wa - 2} ${b.sY + 22} Z`} fill="#a8e6da" {...ol} />
          <path d={`M ${100 - b.wa - 1} ${b.sY + 19} Q 100 ${b.sY + 21} ${100 + b.wa + 1} ${b.sY + 19}`} stroke="#ffb3d1" strokeWidth={2} fill="none" />
        </g>
      ),
    }),
  },
  outfit_shell_suit: {
    sleeve: "long",
    sleeveFill: "#dcd7e6",
    sleeveTrim: "#ffffff",
    shoes: "loafers",
    shoeColor: "#d9b46a",
    trousers: "#c6c0d4",
    draw: ({ b, u }) => {
      const bot = b.hipY + 3;
      const botW = b.hip + 2;
      return {
        upper: (
          <g>
            <defs>
              <Grad id={`${u}-ss`} x2={1} y2={1} stops={[[0, "#f6f3fa"], [0.5, "#dcd7e6"], [1, "#b9b2c9"]]} />
            </defs>
            <path d={garmentD(b, b.sY, b.waistY, b.wa)} fill="#fff" {...ol} />
            <path d={garmentD(b, b.sY, bot, botW)} fill={`url(#${u}-ss)`} {...ol} />
            <path d={`M ${100 - 7} ${b.sY} L 100 ${b.sY + 22} L ${100 + 7} ${b.sY} Z`} fill="#fff" {...thin} />
            <path d={`M ${100 - 7} ${b.sY} L ${100 - 13} ${b.sY + 4} L ${100 - 8} ${b.sY + 10} L ${100 - 11} ${b.sY + 12} L 100 ${b.sY + 22}`} fill="#cfc9dc" {...thin} />
            <path d={`M ${100 + 7} ${b.sY} L ${100 + 13} ${b.sY + 4} L ${100 + 8} ${b.sY + 10} L ${100 + 11} ${b.sY + 12} L 100 ${b.sY + 22}`} fill="#cfc9dc" {...thin} />
            <path d={`M 100 ${b.sY + 22} L 100 ${bot}`} stroke={OUTLINE} strokeWidth={1} />
            <circle cx={101.8} cy={b.sY + 28} r={1.1} fill="#fff" {...thin} />
            <circle cx={101.8} cy={b.sY + 35} r={1.1} fill="#fff" {...thin} />
            <g transform={`translate(${100 - 10} ${b.sY + 9}) scale(0.32)`}>
              <path d="M0 6 L -11 -4 Q -8 -12 0 -13 Q 8 -12 11 -4 Z" fill="#ffc8de" stroke="#d9a94e" strokeWidth={2.4} />
            </g>
            <path d={`M ${100 + b.wa - 7} ${b.waistY + 3} L ${100 + b.wa - 1} ${b.waistY + 3}`} stroke={OUTLINE} strokeWidth={1} />
          </g>
        ),
      };
    },
  },
  outfit_overalls: {
    sleeve: "tee",
    sleeveFill: "#ffc6dd",
    shoes: "sneakers",
    shoeColor: "#9be8d8",
    trousers: "#8fb6de",
    draw: ({ b, mode }) => {
      const bibTop = b.sY + 11;
      return {
        upper: (
          <g>
            <path d={garmentD(b, b.sY, b.waistY, b.wa)} fill="#ffc6dd" {...ol} />
            <path d={`M ${100 - 6} ${b.sY} Q 100 ${b.sY + 5} ${100 + 6} ${b.sY}`} fill="none" {...thin} />
            <path d={`M ${100 - b.wa + 1} ${bibTop} L ${100 + b.wa - 1} ${bibTop} L ${100 + b.wa} ${b.waistY + (mode === "tail" ? 3 : 0)} L ${100 - b.wa} ${b.waistY + (mode === "tail" ? 3 : 0)} Z`} fill="#9cc0e6" {...ol} />
            <path d={`M ${100 - b.wa + 2} ${bibTop + 1} L ${100 - b.sh + 6} ${b.sY} M ${100 + b.wa - 2} ${bibTop + 1} L ${100 + b.sh - 6} ${b.sY}`} stroke="#8fb6de" strokeWidth={4} strokeLinecap="round" />
            <rect x={100 - 6} y={bibTop + 5} width={12} height={9} rx={2} fill="#b3d2f0" stroke="#5f89b8" strokeWidth={0.8} strokeDasharray="1.2 1" />
            <circle cx={100 - b.wa + 3} cy={bibTop + 2} r={2} fill="#9be8d8" {...thin} />
            <circle cx={100 + b.wa - 3} cy={bibTop + 2} r={2} fill="#9be8d8" {...thin} />
          </g>
        ),
      };
    },
  },
  outfit_fairy_tutu: {
    sleeve: "tee",
    sleeveFill: "#fff0f7",
    shoes: "sneakers",
    shoeColor: "#ff7fbf",
    leggings: "#ffc6df",
    draw: ({ b, u, mode }) => {
      const hemY = mode === "tail" ? b.waistY + 5 : b.waistY + 17;
      const hemW = mode === "tail" ? b.wa + 8 : b.hip + 11;
      return {
        lower: (
          <g>
            <defs>
              <Grad id={`${u}-tutu`} stops={[[0, "#ff9ccb"], [1, "#ff6fb4"]]} />
            </defs>
            <path d={skirtD(b.waistY - 2, b.wa + 1, hemY + 2, hemW + 2, 8, 3)} fill="#ffd3e8" {...ol} />
            <path d={skirtD(b.waistY - 2, b.wa + 1, hemY - 1, hemW, 8, 3)} fill={`url(#${u}-tutu)`} {...ol} />
            <rect x={100 - b.wa - 1.5} y={b.waistY - 4} width={(b.wa + 1.5) * 2} height={4.5} rx={2} fill="#ff7fbf" {...thin} />
            <Glitter pts={[[100 - hemW + 8, hemY - 6], [94, b.waistY + 6], [107, b.waistY + 9], [100 + hemW - 7, hemY - 5]]} />
          </g>
        ),
        upper: (
          <g>
            <path d={garmentD(b, b.sY, b.waistY, b.wa)} fill="#fff0f7" {...ol} />
            <path d={`M ${100 - 6} ${b.sY} Q 100 ${b.sY + 5} ${100 + 6} ${b.sY}`} fill="none" {...thin} />
            <path d={HEART_D} transform={`translate(100 ${b.sY + 15}) scale(1.1)`} fill="#ff7fbf" {...thin} />
          </g>
        ),
      };
    },
  },
  outfit_rose_wrap: {
    sleeve: "flutter",
    sleeveFill: "#eaa7b3",
    shoes: "sandals",
    shoeColor: "#c98a6a",
    draw: ({ b, u, mode }) => {
      const hemY = mode === "tail" ? b.waistY + 6 : b.waistY + 44;
      const hemW = mode === "tail" ? b.wa + 7 : b.hip + 8;
      return {
        lower: (
          <g>
            <defs>
              <Grad id={`${u}-rose`} stops={[[0, "#eaa7b3"], [1, "#d98394"]]} />
            </defs>
            <path d={skirtD(b.waistY - 1, b.wa, hemY, hemW, 6, 3)} fill={`url(#${u}-rose)`} {...ol} />
            <path d={`M ${100 + 4} ${b.waistY + 1} Q ${100 + 8} ${(b.waistY + hemY) / 2} ${100 + hemW - 6} ${hemY - 2}`} stroke="#c9707f" strokeWidth={1.1} fill="none" opacity={0.7} />
          </g>
        ),
        upper: (
          <g>
            <path d={garmentD(b, b.sY + 1, b.waistY, b.wa)} fill="#eaa7b3" {...ol} />
            <path d={`M ${100 - b.sh + 7} ${b.sY + 1} L ${100 + 5} ${b.waistY - 3} M ${100 + b.sh - 7} ${b.sY + 1} L ${100 - 2} ${b.sY + 18}`} stroke="#c9707f" strokeWidth={1.3} fill="none" />
            <rect x={100 - b.wa - 1} y={b.waistY - 4} width={(b.wa + 1) * 2} height={4.5} rx={2} fill="#c9707f" {...thin} />
            <circle cx={100 + b.wa - 3} cy={b.waistY - 1.8} r={2.4} fill="#f6d3d9" {...thin} />
          </g>
        ),
      };
    },
  },
};

function defaultOutfit(id: CharacterId): OutfitDef {
  if (id === "lizz") {
    return {
      sleeve: "tee",
      sleeveFill: "#e8e4f0",
      shoes: "boots",
      shoeColor: "#241e2a",
      trousers: "#3d3b52",
      draw: ({ b }) => ({
        upper: (
          <g>
            <path d={garmentD(b, b.sY, b.waistY + 3, b.wa + 1)} fill="#e8e4f0" {...ol} />
            <path d={`M ${100 - 6} ${b.sY} Q 100 ${b.sY + 5} ${100 + 6} ${b.sY}`} fill="none" {...thin} />
            <path d={starD(100, b.sY + 18, 4.5, 2)} fill="#b9a3f5" {...thin} />
          </g>
        ),
      }),
    };
  }
  const col = id === "rocha" ? "#ffe0ef" : "#ece4ff";
  const deep = id === "rocha" ? "#f7b6d6" : "#cbbcf2";
  return {
    sleeve: "none",
    sleeveFill: col,
    shoes: "slippers",
    shoeColor: deep,
    draw: ({ b, mode }) => {
      const hemY = mode === "tail" ? b.waistY + 6 : b.waistY + (b.baby ? 20 : 28);
      const hemW = mode === "tail" ? b.wa + 7 : b.hip + 9;
      return {
        lower: <path d={skirtD(b.waistY - 1, b.wa, hemY, hemW, 6, 3)} fill={col} {...ol} />,
        upper: (
          <g>
            <path d={`M ${100 - b.sh + 6} ${b.sY + 6} Q 100 ${b.sY + 12} ${100 + b.sh - 6} ${b.sY + 6} L ${100 + b.wa} ${b.waistY} L ${100 - b.wa} ${b.waistY} Z`} fill={col} {...ol} />
            <path d={`M ${100 - b.sh + 6} ${b.sY + 6} L ${100 - b.sh + 5} ${b.sY} M ${100 + b.sh - 6} ${b.sY + 6} L ${100 + b.sh - 5} ${b.sY}`} stroke={deep} strokeWidth={1.4} />
          </g>
        ),
      };
    },
  };
}

/* ------------------------------------------------------------------ */
/* Arms, legs, shoes                                                   */
/* ------------------------------------------------------------------ */

function Tattoos({ b, side }: { b: Build; side: 1 | -1 }) {
  const { S, E, H } = armPts(b);
  const ink = "#2c3566";
  const u1 = lerp(S, E, 0.62);
  const u2 = lerp(S, E, 0.92);
  const f1 = lerp(E, H, 0.35);
  const f2 = lerp(E, H, 0.75);
  return (
    <g fill="none" stroke={ink} strokeWidth={0.9} strokeLinecap="round" strokeLinejoin="round">
      <path d={`M ${S[0] + 1} ${S[1] + 6} L ${E[0]} ${E[1]} L ${H[0]} ${H[1] - 2}`} stroke={ink} strokeWidth={b.armW - 2.5} opacity={0.13} />
      {side === 1 ? (
        <>
          <path d="M0 -3 A3 3 0 1 0 2.4 2 A2.2 2.2 0 1 1 0 -3 Z" transform={`translate(${u1[0]} ${u1[1]})`} fill={ink} stroke="none" />
          <path d={starD(f1[0], f1[1], 2.8, 1.2)} fill="none" />
          <path d={starD(u2[0] + 1, u2[1] + 1, 1.4, 0.6)} fill={ink} stroke="none" />
          <path d={starD(f2[0] - 1, f2[1], 1.5, 0.6)} fill={ink} stroke="none" />
          <circle cx={f2[0] + 2} cy={f2[1] - 3} r={0.55} fill={ink} stroke="none" />
        </>
      ) : (
        <>
          <path d={`M ${u1[0] - 3} ${u1[1]} q 1.5 -1.6 3 0 t 3 0 M ${u1[0] - 3} ${u1[1] + 2.4} q 1.5 -1.6 3 0 t 3 0`} />
          <path d={`M ${u2[0] - 3} ${u2[1] + 1} q 1.5 -1.6 3 0 t 3 0`} />
          <g transform={`translate(${f1[0] + 0.5} ${f1[1] + 2})`}>
            <path d="M -1.2 2 L -3.8 4.6 M 1 2.2 L 2.6 5" stroke="#2f7a5a" strokeWidth={1} />
            <circle r={2.5} fill="#e0507a" stroke={ink} strokeWidth={0.8} />
            <path d="M -1 -0.4 Q 0 -1.6 1 -0.4 Q 0.4 0.9 -0.6 0.4" stroke={ink} strokeWidth={0.6} />
          </g>
          <circle cx={f2[0]} cy={f2[1] + 1} r={0.6} fill={ink} stroke="none" />
        </>
      )}
    </g>
  );
}

function Arm({ b, sp, o, tattoos, side }: { b: Build; sp: SkinPalette; o: OutfitDef; tattoos: boolean; side: 1 | -1 }) {
  const { S, E, H } = armPts(b);
  const armD = `M ${S[0]} ${S[1]} Q ${E[0] - 1} ${E[1] - 7} ${E[0]} ${E[1]} Q ${E[0] + 2.5} ${E[1] + 7} ${H[0]} ${H[1]}`;
  const seg = (t: number) => {
    const p = lerp(S, E, t);
    return `M ${S[0] - 1} ${S[1] - 1} L ${f(p[0])} ${f(p[1])}`;
  };
  const sleeveStroke = (d: string, w: number, fill = o.sleeveFill) => (
    <>
      <path d={d} stroke={OUTLINE} strokeWidth={w + 3.4} strokeLinecap="round" fill="none" />
      <path d={d} stroke={fill} strokeWidth={w} strokeLinecap="round" fill="none" />
    </>
  );
  let sleeve: ReactNode = null;
  switch (o.sleeve) {
    case "puff":
      sleeve = (
        <g>
          <ellipse cx={S[0] + 2.5} cy={S[1] + 3.5} rx={8.6} ry={8} fill={o.sleeveFill} {...ol} />
          <path d={`M ${S[0] - 4} ${S[1] + 8} Q ${S[0] + 3} ${S[1] + 13.5} ${S[0] + 10} ${S[1] + 7}`} fill="none" stroke={o.sleeveTrim ?? "#fff"} strokeWidth={2.2} strokeLinecap="round" />
          <ellipse cx={S[0] + 0.5} cy={S[1] + 0.5} rx={3} ry={2} fill="#fff" opacity={0.55} />
        </g>
      );
      break;
    case "cap":
      sleeve = sleeveStroke(seg(0.3), b.armW + 4);
      break;
    case "tee":
      sleeve = (
        <>
          {sleeveStroke(seg(0.62), b.armW + 4)}
          {o.sleeveTrim && <path d={seg(0.62)} stroke={o.sleeveTrim} strokeWidth={1} fill="none" />}
        </>
      );
      break;
    case "rolled": {
      const p = lerp(S, E, 0.45);
      sleeve = (
        <>
          {sleeveStroke(seg(0.42), b.armW + 2.6)}
          <path d={`M ${p[0] - 6} ${p[1] - 1.6} L ${p[0] + 5.5} ${p[1] + 1.2}`} stroke={OUTLINE} strokeWidth={5.4} strokeLinecap="round" />
          <path d={`M ${p[0] - 6} ${p[1] - 1.6} L ${p[0] + 5.5} ${p[1] + 1.2}`} stroke={o.sleeveTrim ?? o.sleeveFill} strokeWidth={3} strokeLinecap="round" />
          <path d={`M ${S[0] - 1} ${S[1] + 1} L ${S[0] + 2} ${S[1] + 6}`} stroke="#6d6078" strokeWidth={1} opacity={0.8} />
        </>
      );
      break;
    }
    case "bell":
      sleeve = (
        <g>
          <path d={`M ${S[0] - 5} ${S[1] - 3} L ${S[0] + 4} ${S[1] - 3} Q ${E[0] + 4} ${E[1] - 4} ${E[0] + 9} ${E[1] + 6} Q ${E[0] + 1} ${E[1] + 10} ${E[0] - 8} ${E[1] + 4} Q ${E[0] - 6} ${E[1] - 6} ${S[0] - 5} ${S[1] - 3} Z`} fill={o.sleeveFill} {...ol} />
          <path d={`M ${E[0] + 8.5} ${E[1] + 6} Q ${E[0] + 1} ${E[1] + 10} ${E[0] - 7.5} ${E[1] + 4}`} fill="none" stroke={o.sleeveTrim ?? "#fff"} strokeWidth={2} />
        </g>
      );
      break;
    case "flutter":
      sleeve = (
        <path d={`M ${S[0] - 5} ${S[1] - 4} Q ${S[0] + 9} ${S[1] - 6} ${S[0] + 12} ${S[1] + 8} Q ${S[0] + 8} ${S[1] + 10} ${S[0] + 6} ${S[1] + 7} Q ${S[0] + 3} ${S[1] + 12} ${S[0] - 1} ${S[1] + 8} Q ${S[0] - 4} ${S[1] + 6} ${S[0] - 5} ${S[1] - 4} Z`} fill={o.sleeveFill} opacity={0.88} {...ol} strokeOpacity={0.7} />
      );
      break;
    case "long":
      sleeve = (
        <>
          <path d={armD} stroke={OUTLINE} strokeWidth={b.armW + 4.6} strokeLinecap="round" fill="none" />
          <path d={armD} stroke={o.sleeveFill} strokeWidth={b.armW + 1.4} strokeLinecap="round" fill="none" />
          <path d={`M ${H[0] - 5} ${H[1] - 5.5} L ${H[0] + 4.5} ${H[1] - 3.5}`} stroke={o.sleeveTrim ?? "#fff"} strokeWidth={1.6} strokeLinecap="round" />
        </>
      );
      break;
    default:
      sleeve = null;
  }
  return (
    <g>
      <path d={armD} stroke={sp.line} strokeWidth={b.armW + 3} strokeLinecap="round" fill="none" />
      <path d={armD} stroke={sp.base} strokeWidth={b.armW} strokeLinecap="round" fill="none" />
      <path d={`M ${S[0] - 1.5} ${S[1] + 4} Q ${E[0] - 3.5} ${E[1] - 4} ${E[0] - 2} ${E[1] + 2}`} stroke={sp.light} strokeWidth={1.4} strokeLinecap="round" fill="none" opacity={0.6} />
      {tattoos && <Tattoos b={b} side={side} />}
      {sleeve}
      <circle cx={H[0] + 0.5} cy={H[1] + 1} r={b.armW / 2 + 1.2} fill={sp.base} stroke={sp.line} strokeWidth={1.4} />
    </g>
  );
}

function Shoe({ kind, color, x, y }: { kind: ShoeKind; color: string; x: number; y: number }) {
  const hi = lighten(color, 0.45);
  const dk = darken(color, 0.3);
  let body: ReactNode;
  switch (kind) {
    case "boots":
      body = (
        <g>
          <path d="M -7 -22 L 6.5 -22 L 7 -9 Q 13.5 -8 13.5 -3 L 13.5 1 L -7.5 1 Z" fill={color} {...ol} />
          <path d="M -7.5 -2.5 L 13.5 -2.5" stroke={OUTLINE} strokeWidth={1} />
          <rect x={-7.5} y={-2.5} width={21} height={3.5} fill="#15101a" />
          <path d="M -3 -18 L 3 -15 M 3 -18 L -3 -15 M -3 -13 L 3 -10 M 3 -13 L -3 -10" stroke="#9a93ad" strokeWidth={0.8} />
          <path d="M -5 -20 L -5 -6" stroke="#6d6078" strokeWidth={1.4} strokeLinecap="round" />
          <circle cx={-6.2} cy={-21} r={0.8} fill="#c9c6d6" />
        </g>
      );
      break;
    case "sneakers":
      body = (
        <g>
          <path d="M -6 -9 Q -7 -2 -5.5 0.5 L 10 0.5 Q 12 -0.5 11 -3.5 Q 7 -4.5 4.5 -9 Z" fill="#fff" {...ol} />
          <path d="M -6 -1.4 L 11.5 -1.4" stroke={OUTLINE} strokeWidth={0.8} />
          <path d="M -4 -5 Q 2 -3 7 -5.5" stroke={color} strokeWidth={2.2} fill="none" strokeLinecap="round" />
          <path d="M 0 -8 L 3 -7" stroke="#cfc9dc" strokeWidth={0.9} />
        </g>
      );
      break;
    case "sandals":
      body = (
        <g>
          <path d="M -5 -8 Q -6 -1 -4 0 L 9 0 Q 11 -2 8 -4 L 4 -7 Z" fill="#f7cdb4" stroke={OUTLINE} strokeWidth={1.2} strokeLinejoin="round" />
          <path d="M -5 0.6 L 10 0.6" stroke={dk} strokeWidth={1.6} strokeLinecap="round" />
          <path d="M -4.5 -4 Q 1 -2 6 -5.5 M -4.5 -7 L 4 -6" stroke={color} strokeWidth={1.6} fill="none" strokeLinecap="round" />
          <circle cx={1} cy={-3.2} r={1} fill="#f4d68e" />
        </g>
      );
      break;
    case "loafers":
      body = (
        <g>
          <path d="M -6 -7 Q -7 -1 -5 0.5 L 9 0.5 Q 12 -1 10.5 -4.5 Q 7 -7 1 -7.5 Z" fill={color} {...ol} />
          <path d="M 0 -5 L 6 -4.5" stroke="#fff3cf" strokeWidth={1.4} strokeLinecap="round" />
          <ellipse cx={-2} cy={-5} rx={2} ry={1} fill={hi} opacity={0.8} />
        </g>
      );
      break;
    case "slippers":
      body = (
        <g>
          <path d="M -5.5 -6 Q -6.5 -1 -4.5 0.5 L 8.5 0.5 Q 11 -1 9.5 -4 Q 6 -6.5 0 -6.5 Z" fill={color} {...ol} />
          <circle cx={3} cy={-5.5} r={1.5} fill={hi} {...thin} />
          <ellipse cx={-2} cy={-3.6} rx={2.2} ry={1} fill="#fff" opacity={0.6} />
        </g>
      );
      break;
    default:
      body = (
        <g>
          <rect x={-4.6} y={-12} width={9.2} height={5} rx={1.5} fill="#fff" {...thin} />
          <path d="M -6 -7.5 Q -7 -1 -5 0.5 L 9 0.5 Q 12 -1 10.5 -4.5 Q 7 -7.5 1 -7.5 Z" fill={color} {...ol} />
          <path d="M -4.5 -6.5 L 6 -6.5" stroke={dk} strokeWidth={1.5} strokeLinecap="round" />
          <circle cx={4.5} cy={-6.5} r={1} fill="#fff" />
          <ellipse cx={-2} cy={-3.5} rx={2.2} ry={1} fill={hi} opacity={0.8} />
        </g>
      );
  }
  return <g transform={`translate(${x} ${y})`}>{body}</g>;
}

const mirror = "translate(200 0) scale(-1 1)";

/* ------------------------------------------------------------------ */
/* Tails                                                               */
/* ------------------------------------------------------------------ */

interface TailStyle {
  g: [string, string, string];
  fin: [string, string];
  scale: string;
  fin_d: string;
  extra?: "stars" | "bubbles" | "moon" | "sun";
}

const FINS = {
  lobe: "M -3 -2 C -10 4 -20 13 -17 21 C -10 23 -3 17 1 9 C 4 17 14 24 25 20 C 26 12 15 2 5 -3 Z",
  crescent: "M -2 -2 C -16 0 -27 12 -24 23 C -16 15 -6 11 3 11 C 12 11 22 15 29 22 C 31 11 19 -1 6 -3 Z",
  fan: "M -2 -2 L -21 13 Q -17 21 -10 20 Q -5 25 1 21 Q 7 26 13 21 Q 20 24 25 17 Q 29 12 27 8 L 6 -3 Z",
  ruffle: "M -2 -2 C -12 2 -23 9 -23 18 Q -18 15 -15 21 Q -10 16 -6 22 Q -2 16 2 22 Q 6 16 10 21 Q 14 15 19 19 Q 25 15 26 8 C 20 2 12 -2 5 -3 Z",
  swallow: "M -2 -2 C -10 6 -21 17 -30 23 C -18 22 -8 16 1 9 C 8 17 18 23 32 25 C 24 15 14 4 5 -3 Z",
};

export const TAILS: Record<string, TailStyle> = {
  tail_pink_aqua: { g: ["#ffb3dc", "#ff9fd0", "#7fe3e0"], fin: ["#a9f0ea", "#c9b6ff"], scale: "#ffffff", fin_d: FINS.lobe },
  tail_lavender_moon: { g: ["#e6d9ff", "#c4aef7", "#9f8ae8"], fin: ["#efe6ff", "#b39ef0"], scale: "#ffffff", fin_d: FINS.crescent, extra: "moon" },
  tail_gold_champagne: { g: ["#fff3cf", "#f2d38b", "#d6a24c"], fin: ["#fff0c2", "#e2b65e"], scale: "#fffbe9", fin_d: FINS.fan, extra: "bubbles" },
  tail_coral_sunset: { g: ["#ffd88a", "#ff9a7a", "#ff6f91"], fin: ["#ffb199", "#ff7aa8"], scale: "#fff2df", fin_d: FINS.ruffle, extra: "sun" },
  tail_midnight: { g: ["#4553ad", "#2b3478", "#1a1f4d"], fin: ["#6b5fd1", "#24285e"], scale: "#8f9cff", fin_d: FINS.swallow, extra: "stars" },
};

export function TailPart({ id, b, u, sway = true }: { id: string; b: Build; u: string; sway?: boolean }) {
  const t = TAILS[id] ?? TAILS.tail_pink_aqua;
  const jY = b.footY - 17;
  const jx = 107;
  const L = 100 - b.wa - 1.5, R = 100 + b.wa + 1.5, top = b.waistY - 5;
  const d = `M ${L} ${top} C ${100 - b.hip - 6} ${b.waistY + 14}, ${100 - b.hip + 1} ${b.waistY + 36}, ${jx - 5} ${jY} L ${jx + 4} ${jY - 2} C ${jx + 10} ${b.waistY + 30}, ${100 + b.hip + 5} ${b.waistY + 14}, ${R} ${top} Z`;
  const id2 = `${u}-t${id.length}`;
  const dots: Pt[] = [[92, b.waistY + 14], [106, b.waistY + 22], [96, b.waistY + 34], [108, b.waistY + 42], [88, b.waistY + 26], [112, b.waistY + 10]];
  return (
    <g>
      <defs>
        <Grad id={`${id2}g`} stops={[[0, t.g[0]], [0.45, t.g[1]], [1, t.g[2]]]} />
        <Grad id={`${id2}f`} x2={1} y2={1} stops={[[0, t.fin[0]], [1, t.fin[1]]]} />
        <pattern id={`${id2}p`} width={7} height={10} patternUnits="userSpaceOnUse">
          <path d="M 0 5 Q 3.5 0 7 5 M -3.5 10 Q 0 5 3.5 10 M 3.5 10 Q 7 5 10.5 10" fill="none" stroke={t.scale} strokeWidth={0.8} opacity={0.75} />
        </pattern>
        <clipPath id={`${id2}c`}>
          <path d={d} />
        </clipPath>
      </defs>
      <g className={sway ? "pcw-fin" : undefined} style={{ transformBox: "fill-box", transformOrigin: "30% 0%" } as CSSProperties}>
        <g transform={`translate(${jx} ${jY})`}>
          <path d={t.fin_d} fill={`url(#${id2}f)`} {...ol} />
          <path d={t.fin_d} fill="none" stroke="#fff" strokeWidth={0.8} opacity={0.6} transform="scale(0.7) translate(1 1)" />
          <path d="M 1 2 L -12 16 M 2 3 L 0 19 M 3 2 L 14 18" stroke={darken(t.fin[1], 0.15)} strokeWidth={0.8} opacity={0.55} fill="none" />
        </g>
      </g>
      <path d={d} fill={`url(#${id2}g)`} {...ol} />
      <g clipPath={`url(#${id2}c)`}>
        <rect x={60} y={top} width={80} height={jY - top + 4} fill={`url(#${id2}p)`} />
        <path d={`M ${L + 4} ${top + 6} C ${100 - b.hip - 1} ${b.waistY + 16}, ${100 - b.hip + 4} ${b.waistY + 32}, ${jx - 4} ${jY - 4}`} stroke="#fff" strokeWidth={3} fill="none" opacity={0.45} strokeLinecap="round" />
        <g className={sway ? "pcw-shimmer" : undefined}>
          <path d={`M 70 ${jY + 8} L 82 ${jY + 8} L 104 ${top - 6} L 92 ${top - 6} Z`} fill="#fff" opacity={0.28} />
        </g>
        {t.extra === "stars" && dots.map(([x, y], i) => <path key={i} d={SPARKLE_D} transform={`translate(${x} ${y}) scale(${i % 2 ? 0.35 : 0.5})`} fill={i % 3 ? "#ffffff" : "#f4d68e"} />)}
        {t.extra === "bubbles" && dots.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i % 2 ? 1.3 : 2} fill="none" stroke="#fffbe9" strokeWidth={0.8} />)}
        {t.extra === "sun" && dots.slice(0, 4).map(([x, y], i) => <circle key={i} cx={x} cy={y} r={1} fill="#fff6c8" />)}
      </g>
      {t.extra === "moon" && <path d="M0 -4 A4 4 0 1 0 3 3 A3 3 0 1 1 0 -4 Z" transform={`translate(93 ${b.waistY + 20})`} fill="#fff4cf" stroke="#d9a94e" strokeWidth={0.7} />}
      <path d={`M ${L - 1} ${top + 2}${scallops(L - 1, R + 1, top + 2, 6, 4.5)}`} fill={t.fin[0]} stroke={OUTLINE} strokeWidth={1.2} strokeLinejoin="round" />
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Hair                                                                */
/* ------------------------------------------------------------------ */

/** Builds a fringe edge from alternating dip / tip points (right to left). */
function fringe(pts: Pt[]) {
  let s = "";
  for (let i = 1; i < pts.length; i++) {
    const [px, py] = pts[i - 1];
    const [x, y] = pts[i];
    if (i % 2 === 1) s += ` Q ${f(px - 1)} ${f((py + y) / 2 + 5)} ${x} ${y}`; // dip -> tip
    else s += ` Q ${f(px - 2)} ${f((py + y) / 2 - 1)} ${x} ${y}`; // tip -> dip
  }
  return s;
}

interface HairShape {
  back?: string;
  backInner?: string;
  cap: string;
  locks?: string[];
  extra?: (p: HairPalette, u: string) => ReactNode;
  strands?: string;
  shine: string;
  earsVisible?: boolean;
}

const LOCK_L_LONG = "M 54 90 C 45 110 52 128 44 146 C 40 156 45 165 52 167 C 50 158 56 150 60 140 C 64 126 60 110 63 94 Z";
const LOCK_L_STRAIGHT = "M 51 88 C 49 106 48 126 48 143 L 62 143 C 62 124 62 106 63 92 Z";
const LOCK_L_WAVE = "M 53 90 C 46 106 52 120 46 134 C 43 142 47 150 53 151 C 52 144 57 138 60 130 C 63 118 60 106 63 94 Z";
const LOCK_L_ETHEREAL = "M 54 92 C 46 116 50 140 42 162 C 40 170 44 178 50 178 C 48 168 54 160 57 150 C 62 132 60 112 62 96 Z";
const LOCK_L_BOB = "M 51 90 C 47 108 46 124 50 140 Q 56 142 62 136 C 60 122 61 106 63 92 Z";
const mirrorD = (d: string) =>
  d.replace(/(-?\d+\.?\d*) (-?\d+\.?\d*)/g, (_m, x: string, y: string) => `${f(200 - parseFloat(x))} ${y}`);

const HAIR: Record<HairStyle, HairShape> = {
  long_waves: {
    back: "M 54 66 C 28 92 24 150 32 186 C 26 198 36 212 48 208 C 54 218 70 218 76 208 C 88 214 112 214 124 208 C 130 218 146 218 152 208 C 164 212 174 198 168 186 C 176 150 172 92 146 66 Z",
    backInner: "M 70 120 C 64 160 72 190 80 204 L 120 204 C 128 190 136 160 130 120 Z",
    strands: "M 40 120 C 34 150 44 170 38 190 M 160 120 C 166 150 156 170 162 190 M 52 150 C 50 170 58 186 56 204 M 148 150 C 150 170 142 186 144 204",
    cap: "M 47 118 C 40 70 66 36 100 36 C 134 36 160 70 153 118 L 145 116 C 145 98 142 86 138 78" + fringe([[138, 78], [134, 95], [126, 74], [116, 91], [108, 72], [99, 93], [90, 72], [82, 90], [74, 74], [66, 94], [62, 80]]) + " C 58 88 55 100 55 116 Z",
    locks: [LOCK_L_LONG, mirrorD(LOCK_L_LONG)],
    shine: "M 68 60 Q 100 44 132 60",
  },
  straight_long: {
    back: "M 52 68 C 34 96 34 160 36 216 L 50 214 L 62 217 L 76 214 L 90 217 L 110 217 L 124 214 L 138 217 L 150 214 L 164 216 C 166 160 166 96 148 68 Z",
    backInner: "M 70 120 L 70 212 L 130 212 L 130 120 Z",
    strands: "M 44 110 L 44 210 M 156 110 L 156 210 M 56 140 L 56 212 M 144 140 L 144 212",
    cap: "M 47 120 C 40 70 66 36 100 36 C 134 36 160 70 153 120 L 146 118 C 146 100 143 88 140 80 L 140 90 Q 136 88 133 91 L 131 80 L 129 91 Q 124 88 120 91 L 118 79 L 116 91 Q 110 88 104 91 L 102 79 L 100 91 Q 94 88 88 91 L 86 79 L 84 91 Q 78 88 73 91 L 71 80 L 69 91 Q 64 88 60 90 L 60 80 C 57 88 55 100 55 118 Z",
    locks: [LOCK_L_STRAIGHT, mirrorD(LOCK_L_STRAIGHT)],
    shine: "M 68 60 Q 100 45 132 60",
  },
  beach_waves: {
    back: "M 52 66 C 30 90 30 130 26 160 C 22 172 34 178 40 170 C 44 182 58 184 62 172 C 76 180 124 180 138 172 C 142 184 156 182 160 170 C 166 178 178 172 174 160 C 170 130 170 90 148 66 Z",
    backInner: "M 70 120 C 66 150 72 168 78 174 L 122 174 C 128 168 134 150 130 120 Z",
    strands: "M 38 118 C 32 136 40 150 34 164 M 162 118 C 168 136 160 150 166 164",
    cap: "M 46 116 C 40 68 66 36 100 36 C 134 36 160 68 154 116 L 146 114 C 147 100 144 86 140 80 Q 146 92 142 100 Q 138 84 128 74 Q 134 86 128 94 Q 122 78 110 70 Q 112 80 106 88 Q 98 74 82 70 Q 86 78 80 86 Q 72 74 64 76 C 58 86 55 100 55 114 Z",
    locks: [LOCK_L_WAVE, mirrorD(LOCK_L_WAVE)],
    shine: "M 70 58 Q 100 44 130 58",
  },
  ethereal_long: {
    back: "M 54 66 C 26 100 22 170 24 222 C 22 236 34 246 44 238 C 52 248 66 248 72 238 C 86 244 114 244 128 238 C 134 248 148 248 156 238 C 166 246 178 236 176 222 C 178 170 174 100 146 66 Z",
    backInner: "M 70 120 C 66 170 72 214 78 234 L 122 234 C 128 214 134 170 130 120 Z",
    strands: "M 36 120 C 28 160 40 200 30 232 M 164 120 C 172 160 160 200 170 232 M 50 160 C 46 190 56 214 52 238 M 150 160 C 154 190 144 214 148 238",
    cap: "M 46 120 C 40 66 66 36 100 36 C 134 36 160 66 154 120 L 146 118 C 146 102 134 88 115 86 Q 107 74 100 62 Q 93 74 85 86 C 66 88 54 102 54 118 Z",
    locks: [LOCK_L_ETHEREAL, mirrorD(LOCK_L_ETHEREAL)],
    extra: (p) => (
      <g fill="none" stroke={p.light} strokeWidth={1.4} strokeLinecap="round" opacity={0.85}>
        <path d="M 30 150 C 18 170 30 186 20 204" />
        <path d="M 170 150 C 182 170 170 186 180 204" />
        <path d="M 99 64 Q 92 76 80 86" stroke={p.shade} strokeWidth={1} />
        <path d="M 101 64 Q 108 76 120 86" stroke={p.shade} strokeWidth={1} />
      </g>
    ),
    shine: "M 62 70 Q 74 54 92 50 M 108 50 Q 126 54 138 70",
  },
  short_undercut: {
    back: "M 52 104 C 46 60 154 60 148 104 C 146 124 138 132 130 134 L 70 134 C 62 132 54 124 52 104 Z",
    cap: "M 62 72 C 64 46 84 34 104 34 C 134 34 158 56 152 100 L 147 102 C 147 94 145 88 141 82 Q 143 92 140 100 Q 135 86 126 80 Q 129 88 124 95 Q 118 82 106 76 Q 92 70 80 74 Q 70 78 62 72 Z",
    extra: (p) => (
      <g>
        <path d="M 53 104 C 50 80 56 62 66 56 L 70 72 C 62 78 58 90 58 104 Z" fill={p.deep} opacity={0.9} stroke={p.line} strokeWidth={1.2} />
        <path d="M 56 96 L 58 92 M 58 86 L 60 82 M 61 77 L 63 73 M 55 101 L 57 98" stroke={p.light} strokeWidth={0.7} opacity={0.6} />
      </g>
    ),
    strands: "M 96 40 Q 120 44 138 72 M 86 44 Q 110 54 126 80",
    shine: "M 84 46 Q 110 38 136 54",
    earsVisible: true,
  },
  pixie: {
    back: "M 50 104 C 44 58 156 58 150 104 C 150 124 142 132 132 134 L 68 134 C 58 132 50 124 50 104 Z",
    cap: "M 50 110 C 42 64 66 36 100 36 C 134 36 158 64 150 110 Q 146 104 145 98 Q 144 106 140 110 C 142 98 140 88 136 80" + fringe([[136, 80], [131, 92], [124, 76], [114, 89], [106, 74], [97, 88], [88, 74], [79, 87], [72, 77], [64, 90], [63, 82]]) + " C 60 88 58 98 60 110 Q 56 106 55 98 Q 54 106 50 110 Z",
    shine: "M 68 60 Q 100 44 132 60",
    earsVisible: true,
  },
  space_buns: {
    back: "M 48 70 C 32 96 34 130 40 146 Q 52 150 64 144 L 136 144 Q 148 150 160 146 C 166 130 168 96 152 70 Z",
    cap: "M 47 118 C 40 70 66 36 100 36 C 134 36 160 70 153 118 L 146 116 C 146 100 143 88 139 80" + fringe([[139, 80], [134, 92], [126, 77], [118, 90], [110, 76], [101, 91], [92, 76], [84, 90], [76, 77], [67, 92], [61, 82]]) + " C 57 90 55 102 55 116 Z",
    locks: [LOCK_L_BOB, mirrorD(LOCK_L_BOB)],
    extra: (p, u) => (
      <g>
        {[62, 138].map((x) => (
          <g key={x}>
            <circle cx={x} cy={42} r={17} fill={`url(#${u}-hair)`} stroke={p.line} strokeWidth={1.8} />
            <path d={`M ${x - 10} ${40} Q ${x} ${28} ${x + 10} ${38} M ${x - 11} ${47} Q ${x} ${36} ${x + 12} ${46} M ${x - 6} ${53} Q ${x + 2} ${46} ${x + 10} ${52}`} stroke={p.shade} strokeWidth={1.2} fill="none" />
            <path d={`M ${x - 9} ${34} Q ${x - 3} ${28} ${x + 4} ${29}`} stroke={p.shine} strokeWidth={2.4} strokeLinecap="round" fill="none" opacity={0.85} />
          </g>
        ))}
      </g>
    ),
    shine: "M 68 60 Q 100 44 132 60",
  },
  pigtails: {
    // Two bunches tied high at the sides, drawn behind the head.
    back: "M 56 78 C 32 84 22 116 26 146 C 28 164 38 176 46 172 C 41 162 47 152 45 138 C 43 118 50 100 62 90 Z" + " " + mirrorD("M 56 78 C 32 84 22 116 26 146 C 28 164 38 176 46 172 C 41 162 47 152 45 138 C 43 118 50 100 62 90 Z"),
    strands: "M 36 110 C 30 128 36 146 34 160 M 164 110 C 170 128 164 146 166 160",
    cap: "M 47 118 C 40 70 66 36 100 36 C 134 36 160 70 153 118 L 145 116 C 145 98 142 86 138 78" + fringe([[138, 78], [134, 95], [126, 74], [116, 91], [108, 72], [99, 93], [90, 72], [82, 90], [74, 74], [66, 94], [62, 80]]) + " C 58 88 55 100 55 116 Z",
    extra: () => (
      <g>
        {[56, 144].map((x) => (
          <g key={x}>
            <circle cx={x} cy={80} r={6} fill="#ff7fbf" stroke={OUTLINE} strokeWidth={1.4} />
            <circle cx={x - 1.8} cy={78} r={1.6} fill="#fff" opacity={0.85} />
          </g>
        ))}
      </g>
    ),
    shine: "M 68 60 Q 100 44 132 60",
  },
};

type Curl = [number, number, number];
const SHORT_STYLES = new Set<HairStyle>(["short_undercut", "pixie"]);

function curlSet(style: HairStyle): { back: Curl[]; lock: Curl[]; bottom: number } | null {
  if (SHORT_STYLES.has(style) || style === "space_buns") return null;
  if (style === "beach_waves") {
    const half: Curl[] = [[50, 72, 16], [40, 90, 16], [35, 109, 17], [34, 128, 17], [37, 147, 16], [44, 164, 15], [58, 176, 13], [74, 181, 12], [90, 183, 11]];
    return { back: [...half, ...half.map(([x, y, r]) => [200 - x, y, r] as Curl)], lock: [[55, 96, 7], [51, 108, 7.5], [50, 121, 7.5], [52, 133, 7]], bottom: 184 };
  }
  const half: Curl[] = [[50, 70, 19], [38, 90, 19], [32, 112, 20], [29, 135, 20], [30, 158, 20], [34, 180, 19], [41, 199, 18], [56, 212, 16], [74, 218, 15], [92, 220, 14]];
  return { back: [...half, ...half.map(([x, y, r]) => [200 - x, y, r] as Curl)], lock: [[55, 96, 7], [51, 108, 7.5], [49, 121, 8], [49, 134, 8], [50, 147, 7.5], [53, 159, 6.5]], bottom: 220 };
}

function Curls({ curls, p, u, fillCenter }: { curls: Curl[]; p: HairPalette; u: string; fillCenter?: number }) {
  return (
    <g>
      {curls.map(([x, y, r], i) => (
        <circle key={`o${i}`} cx={x} cy={y} r={r + 1.8} fill={p.line} />
      ))}
      {fillCenter && <path d={`M 52 70 L 148 70 L 150 ${fillCenter - 8} L 50 ${fillCenter - 8} Z`} fill={p.deep} />}
      {curls.map(([x, y, r], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={r} fill={`url(#${u}-curl)`} />
          <path d={`M ${f(x - r * 0.45)} ${f(y + r * 0.1)} Q ${f(x - r * 0.2)} ${f(y - r * 0.55)} ${f(x + r * 0.35)} ${f(y - r * 0.3)} Q ${f(x + r * 0.55)} ${f(y + r * 0.25)} ${f(x + r * 0.05)} ${f(y + r * 0.4)} Q ${f(x - r * 0.25)} ${f(y + r * 0.3)} ${f(x - r * 0.1)} ${f(y + r * 0.05)}`} stroke={luminance(p.base) < 0.06 ? p.light : p.shade} strokeWidth={1.2} fill="none" strokeLinecap="round" />
          <path d={`M ${f(x - r * 0.6)} ${f(y - r * 0.35)} Q ${f(x - r * 0.3)} ${f(y - r * 0.75)} ${f(x + r * 0.15)} ${f(y - r * 0.72)}`} stroke={p.shine} strokeWidth={2.2} fill="none" strokeLinecap="round" opacity={0.9} />
        </g>
      ))}
    </g>
  );
}

function HairBack({ style, p, u, curly }: { style: HairStyle; p: HairPalette; u: string; curly?: boolean }) {
  const h = HAIR[style] ?? HAIR.long_waves;
  const cs = curly ? curlSet(style) : null;
  if (cs) return <Curls curls={cs.back} p={p} u={u} fillCenter={cs.bottom} />;
  if (!h.back) return null;
  return (
    <g>
      <path d={h.back} fill={`url(#${u}-hairb)`} stroke={p.line} strokeWidth={1.8} strokeLinejoin="round" />
      {h.backInner && <path d={h.backInner} fill={p.deep} opacity={0.55} />}
      {h.strands && <path d={h.strands} stroke={p.shade} strokeWidth={1.3} fill="none" strokeLinecap="round" opacity={0.8} />}
      {h.strands && <path d={h.strands} stroke={p.shine} strokeWidth={1} fill="none" strokeLinecap="round" opacity={0.5} transform="translate(3 -4)" />}
    </g>
  );
}

function HairFront({ style, p, u, sp, curly }: { style: HairStyle; p: HairPalette; u: string; sp: SkinPalette; curly?: boolean }) {
  const h = HAIR[style] ?? HAIR.long_waves;
  const cs = curly ? curlSet(style) : null;
  return (
    <g>
      {/* soft hair shadow on the forehead */}
      <path d={h.cap} transform="translate(0 3.5)" fill={sp.shade} opacity={0.5} clipPath={`url(#${u}-face)`} />
      {style === "space_buns" && h.extra?.(p, u)}
      <path d={h.cap} fill={`url(#${u}-hair)`} stroke={p.line} strokeWidth={1.8} strokeLinejoin="round" />
      {cs ? (
        <Curls curls={[...cs.lock, ...cs.lock.map(([x, y, r]) => [200 - x, y, r] as Curl)]} p={p} u={u} />
      ) : (
        h.locks?.map((d, i) => <path key={i} d={d} fill={`url(#${u}-hair)`} stroke={p.line} strokeWidth={1.6} strokeLinejoin="round" />)
      )}
      {style !== "space_buns" && h.extra?.(p, u)}
      <path d={h.shine} stroke={p.shine} strokeWidth={4} strokeLinecap="round" fill="none" strokeDasharray="13 5 8 6 18 5" opacity={0.9} />
      <path d={h.shine} stroke="#fff" strokeWidth={1.4} strokeLinecap="round" fill="none" strokeDasharray="4 30 3 40" opacity={0.85} transform="translate(0 -1)" />
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Accessories (local coordinates, exported for ItemIcon)              */
/* ------------------------------------------------------------------ */

/** Hats are drawn with the origin at the crown of the head (100, 40 in avatar space). */
export function HatPart({ id, u }: { id: string; u: string }) {
  switch (id) {
    case "hat_witch_pink":
    case "hat_crescent": {
      const pink = id === "hat_witch_pink";
      const c = pink ? ["#ffc4e2", "#ff8fc8", "#e0609f"] : ["#4b52b8", "#30357d", "#1d2056"];
      const band = pink ? "#fff1f8" : "#e9c27a";
      return (
        <g>
          <defs>
            <Grad id={`${u}-hat`} x2={1} y2={0.4} stops={[[0, c[0]], [0.5, c[1]], [1, c[2]]]} />
          </defs>
          <ellipse cx={0} cy={15} rx={60} ry={11} fill={`url(#${u}-hat)`} {...ol} />
          <path d={pink ? "M -26 13 C -22 -8 -10 -28 6 -42 C 14 -48 26 -48 31 -40 C 25 -42 19 -40 15 -34 C 19 -15 22 0 27 13 Z" : "M -26 13 C -22 -8 -14 -28 -4 -42 C -10 -48 -22 -46 -27 -38 C -20 -38 -14 -38 -10 -34 C -6 -14 18 0 27 13 Z"} fill={`url(#${u}-hat)`} {...ol} transform="translate(0 13) scale(1 0.8) translate(0 -13)" />
          <path d="M -25 7 Q 0 13 26 7 L 27 13 Q 0 19 -26 13 Z" fill={band} {...thin} />
          {pink ? (
            <>
              <path d={starD(0, 10, 5, 2.2)} fill="#f4d68e" {...thin} />
              <circle cx={-12} cy={-6} r={1.6} fill="#fff" opacity={0.9} />
              <circle cx={-4} cy={-14} r={1.2} fill="#fff" opacity={0.9} />
              <circle cx={10} cy={-4} r={1.3} fill="#fff" opacity={0.9} />
              <path d="M -16 6 C -12 -8 -4 -18 4 -27" stroke="#fff" strokeWidth={2} fill="none" opacity={0.5} strokeLinecap="round" />
            </>
          ) : (
            <>
              <path d="M0 -8 A8 8 0 1 0 6 6 A6 6 0 1 1 0 -8 Z" transform="translate(2 -6) scale(0.85)" fill="#f4d68e" {...thin} />
              <path d={SPARKLE_D} transform="translate(-10 -16) scale(0.5)" fill="#fff" />
              <path d={SPARKLE_D} transform="translate(14 2) scale(0.4)" fill="#f4d68e" />
              <path d={SPARKLE_D} transform="translate(-40 16) scale(0.4)" fill="#fff" />
            </>
          )}
          <path d="M -52 12 Q -30 6 -10 6" stroke="#fff" strokeWidth={1.6} fill="none" opacity={0.45} strokeLinecap="round" />
        </g>
      );
    }
    case "hat_pearl_crown":
      return (
        <g transform="translate(0 6)">
          <path d="M -22 4 L -24 -10 L -14 -3 L -7 -16 L 0 -5 L 7 -16 L 14 -3 L 24 -10 L 22 4 Q 0 9 -22 4 Z" fill="#f2cd78" {...ol} />
          <path d="M -21 1 Q 0 6 21 1" stroke="#fff3cf" strokeWidth={1.2} fill="none" />
          {[[-24, -11], [-7, -17], [7, -17], [24, -11]].map(([x, y], i) => (
            <g key={i}>
              <circle cx={x} cy={y} r={3} fill="#fffaf4" {...thin} />
              <circle cx={x - 1} cy={y - 1} r={1} fill="#fff" />
            </g>
          ))}
          <circle cx={0} cy={-8} r={4.4} fill="#fffaf4" {...thin} />
          <circle cx={-1.4} cy={-9.4} r={1.4} fill="#fff" />
          <path d="M 0 -2 L 3 1.5 L 0 5 L -3 1.5 Z" fill="#ff8fc8" {...thin} />
          {[-15, 15].map((x) => (
            <circle key={x} cx={x} cy={2.5} r={1.6} fill="#c9f2f0" {...thin} />
          ))}
        </g>
      );
    case "hat_sun_pink":
      return (
        <g transform="rotate(-10) translate(2 10)">
          <defs>
            <radialGradient id={`${u}-sunp`} cx="0.45" cy="0.3" r="0.75">
              <stop offset="0" stopColor="#ffd3e8" />
              <stop offset="0.6" stopColor="#ff8fc0" />
              <stop offset="1" stopColor="#e2609e" />
            </radialGradient>
          </defs>
          <path d="M -84 16 C -86 2 -50 -2 0 -2 C 50 -2 88 2 86 16 C 84 30 50 34 0 33 C -50 34 -84 30 -84 16 Z" fill={`url(#${u}-sunp)`} {...ol} />
          <path d="M -70 22 Q 0 34 72 22" stroke="#fff" strokeWidth={1.4} fill="none" opacity={0.5} />
          <path d="M -42 12 C -45 -26 45 -26 42 12 Z" fill={`url(#${u}-sunp)`} {...ol} />
          <path d="M -42 4 Q 0 12 42 4 L 42 12 Q 0 20 -42 12 Z" fill="#fff0f7" {...thin} />
          <path d="M -30 -6 Q -10 -20 16 -14" stroke="#fff" strokeWidth={2.4} fill="none" opacity={0.6} strokeLinecap="round" />
          <g transform="translate(34 8)">
            <path d="M 0 0 C -4 -10 -16 -10 -15 0 C -16 9 -4 9 0 0 Z M 0 0 C 4 -10 16 -10 15 0 C 16 9 4 9 0 0 Z" fill="#9fdcf0" {...thin} />
            <path d="M -2 2 L -6 14 L -2 12 L 0 16 Z M 2 2 L 7 13 L 3 12 L 1 16 Z" fill="#7fcbe6" {...thin} />
            <circle r={3} fill="#c9f0fb" {...thin} />
          </g>
          <circle cx={-18} cy={9} r={2.4} fill="#fffaf6" {...thin} />
          <circle cx={-8} cy={11} r={2.4} fill="#fffaf6" {...thin} />
        </g>
      );
    case "hat_sun_straw":
      return (
        <g transform="rotate(-8) translate(4 10)">
          <defs>
            <radialGradient id={`${u}-straw`} cx="0.45" cy="0.35" r="0.7">
              <stop offset="0" stopColor="#fff2c9" />
              <stop offset="0.7" stopColor="#f2d38b" />
              <stop offset="1" stopColor="#d9a94e" />
            </radialGradient>
          </defs>
          <ellipse cx={0} cy={14} rx={80} ry={16} fill={`url(#${u}-straw)`} {...ol} />
          <ellipse cx={0} cy={14} rx={60} ry={10.5} fill="none" stroke="#d9a94e" strokeWidth={0.8} strokeDasharray="2 2" />
          <ellipse cx={0} cy={14} rx={44} ry={7.5} fill="none" stroke="#d9a94e" strokeWidth={0.8} strokeDasharray="2 2" />
          <path d="M -42 12 C -44 -24 44 -24 42 12 Z" fill={`url(#${u}-straw)`} {...ol} />
          <path d="M -42 5 Q 0 12 42 5 L 42 12 Q 0 19 -42 12 Z" fill="#ff8a73" {...thin} />
          <path d="M -32 -4 Q -8 -18 20 -10" stroke="#fff" strokeWidth={2} fill="none" opacity={0.6} strokeLinecap="round" />
          <g transform="translate(34 7)">
            {[0, 72, 144, 216, 288].map((a) => (
              <ellipse key={a} cx={0} cy={-4.5} rx={3.2} ry={4.8} fill="#fff8ef" stroke={OUTLINE} strokeWidth={0.8} transform={`rotate(${a})`} />
            ))}
            <circle r={2.4} fill="#ffd27a" />
          </g>
        </g>
      );
    case "hat_flower_crown":
      return (
        <g>
          <path d="M -50 22 Q -40 2 0 -2 Q 40 2 50 22" fill="none" stroke="#5fae7c" strokeWidth={3} strokeLinecap="round" />
          {[[-44, 12, -40], [-26, 2, -20], [26, 2, 20], [44, 12, 40], [-36, 6, 30], [36, 6, -30]].map(([x, y, r], i) => (
            <ellipse key={i} cx={x} cy={y} rx={6} ry={3} fill="#7cc795" stroke={OUTLINE} strokeWidth={0.9} transform={`rotate(${r} ${x} ${y})`} />
          ))}
          {[[-40, 15, 0.8], [-18, 0, 1], [0, -3, 1.15], [18, 0, 1], [40, 15, 0.8]].map(([x, y, s], i) => (
            <g key={i} transform={`translate(${x} ${y}) scale(${s}) rotate(${i * 17})`}>
              {[0, 72, 144, 216, 288].map((a) => (
                <path key={a} d="M0 0 C -4 -3 -4 -9 0 -10 C 4 -9 4 -3 0 0 Z" fill={i % 2 ? "#ffd1e3" : "#fff8ef"} stroke={OUTLINE} strokeWidth={0.9} transform={`rotate(${a})`} />
              ))}
              <circle r={2.4} fill="#ffcf5a" />
            </g>
          ))}
        </g>
      );
    case "hat_beanie_black":
      return (
        <g>
          <path d="M -54 32 C -58 -4 -30 -16 2 -16 C 22 -16 40 -10 50 0 C 58 -2 64 4 60 12 C 58 18 58 26 56 32 Z" fill="#2a2430" {...ol} />
          <path d="M -40 2 C -30 -8 -10 -12 10 -11" stroke="#4d4456" strokeWidth={2.4} fill="none" strokeLinecap="round" />
          <path d="M -57 26 Q 0 18 59 26 L 59 38 Q 0 30 -57 38 Z" fill="#3a3342" {...ol} />
          {Array.from({ length: 15 }, (_, i) => -50 + i * 7.2).map((x) => (
            <path key={x} d={`M ${x} 26 L ${x} 35`} stroke="#25202b" strokeWidth={1} />
          ))}
          <rect x={30} y={27} width={11} height={6} rx={1} fill="#c9c6d6" {...thin} />
        </g>
      );
    case "hat_crystal_tiara": {
      const crystals: [number, number, number, string][] = [[-22, 6, 9, "#d8f4ff"], [-11, 2, 13, "#e7dcff"], [0, 0, 19, "#c9f2f0"], [11, 2, 13, "#e7dcff"], [22, 6, 9, "#d8f4ff"]];
      return (
        <g transform="translate(0 4)">
          <path d="M -30 10 Q 0 0 30 10" fill="none" stroke="#c9c6d6" strokeWidth={3.6} strokeLinecap="round" />
          <path d="M -30 10 Q 0 0 30 10" fill="none" stroke="#fff" strokeWidth={1} strokeLinecap="round" />
          {crystals.map(([x, y, h, c], i) => (
            <g key={i} transform={`translate(${x} ${y})`}>
              <path d={`M -3.2 0 L -3.2 ${-h + 4} L 0 ${-h} L 3.2 ${-h + 4} L 3.2 0 Z`} fill={c} {...thin} />
              <path d={`M 0 ${-h} L 0 0`} stroke="#fff" strokeWidth={0.8} opacity={0.9} />
              <path d={`M -2 -2 L -2 ${-h + 5}`} stroke="#fff" strokeWidth={0.9} opacity={0.8} />
            </g>
          ))}
          <path d={SPARKLE_D} transform="translate(6 -18) scale(0.5)" fill="#fff" />
        </g>
      );
    }
    case "hat_snow_pearl": {
      const n = 13;
      let fluff = "";
      for (let i = 0; i <= n; i++) {
        const a = Math.PI + (i / n) * Math.PI * 2;
        const x = f(6 + Math.cos(a) * 50);
        const y = f(-8 + Math.sin(a) * 21);
        if (i === 0) fluff = `M ${x} ${y}`;
        else {
          const m = a - Math.PI / n;
          fluff += ` Q ${f(6 + Math.cos(m) * 58)} ${f(-8 + Math.sin(m) * 28)} ${x} ${y}`;
        }
      }
      return (
        <g transform="rotate(-12) translate(0 8)">
          <defs>
            <radialGradient id={`${u}-beret`} cx="0.4" cy="0.25" r="0.8">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="0.55" stopColor="#f7f3fd" />
              <stop offset="1" stopColor="#cfc2ea" />
            </radialGradient>
            <radialGradient id={`${u}-bpearl`} cx="0.38" cy="0.32" r="0.7">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="0.5" stopColor="#fff2f8" />
              <stop offset="1" stopColor="#d9dcf5" />
            </radialGradient>
          </defs>
          <path d="M -38 6 Q 0 18 38 6 L 38 15 Q 0 27 -38 15 Z" fill="#e6def4" {...ol} />
          <path d="M -30 12 Q 0 21 30 12" stroke="#fff" strokeWidth={1.2} fill="none" opacity={0.8} />
          <path d={fluff + " Z"} fill={`url(#${u}-beret)`} {...ol} />
          <path d="M -40 2 Q 6 16 52 0 Q 8 10 -40 2 Z" fill="#d6cbee" opacity={0.8} />
          <path d="M -34 -8 Q -38 -16 -30 -22 M -14 -26 Q -6 -31 2 -28 M 22 -26 Q 30 -26 34 -20 M 44 -10 Q 50 -6 48 0" stroke="#d2c6ea" strokeWidth={1.4} fill="none" strokeLinecap="round" />
          <path d="M -26 -16 Q -12 -27 6 -27" stroke="#fff" strokeWidth={3.4} fill="none" strokeLinecap="round" opacity={0.95} />
          <path d="M 6 -33 Q 8 -41 13 -39" stroke={OUTLINE} strokeWidth={3.8} fill="none" strokeLinecap="round" />
          <path d="M 6 -33 Q 8 -41 13 -39" stroke="#f6f1fc" strokeWidth={2.2} fill="none" strokeLinecap="round" />
          <g transform="translate(34 2) scale(1.15)">
            <path d="M 0 0 C -4 -7 -12 -6 -11 0 C -12 6 -4 7 0 0 Z M 0 0 C 4 -7 12 -6 11 0 C 12 6 4 7 0 0 Z" fill="#ffc6df" {...thin} />
            <circle r={6} fill={`url(#${u}-bpearl)`} {...thin} />
            <circle cx={-2} cy={-2.2} r={1.9} fill="#fff" />
          </g>
          <path d={SPARKLE_D} transform="translate(-36 -22) scale(0.5)" fill="#fff" stroke="#c9d7f5" strokeWidth={0.6} />
          <path d={SPARKLE_D} transform="translate(46 -14) scale(0.4)" fill="#e6f4ff" />
        </g>
      );
    }
    default:
      return null;
  }
}

/** Necklaces: origin at the centre of the neck base (100, sY). */
export function NecklacePart({ id, u }: { id: string; u: string }) {
  const arc = (n: number, w: number, depth: number, y0 = -1): Pt[] =>
    Array.from({ length: n }, (_, i) => {
      const t = i / (n - 1);
      const x = -w + 2 * w * t;
      return [x, y0 + depth * (1 - Math.pow((x / w) ** 2, 1))];
    });
  switch (id) {
    case "neck_pearls":
      return (
        <g>
          {arc(11, 11, 10).map(([x, y], i) => (
            <g key={i}>
              <circle cx={x} cy={y} r={2.2} fill="#fffaf6" stroke="#b98aa8" strokeWidth={0.6} />
              <circle cx={x - 0.7} cy={y - 0.7} r={0.7} fill="#fff" />
            </g>
          ))}
        </g>
      );
    case "neck_shell":
      return (
        <g>
          <path d="M -11 -1 Q 0 18 11 -1" fill="none" stroke="#b98a5a" strokeWidth={0.9} />
          {arc(5, 7, 8, 2).map(([x, y], i) => (
            <g key={i} transform={`translate(${x} ${y + 1}) rotate(${x * 4})`}>
              <ellipse rx={2} ry={3} fill="#fff6e6" stroke={OUTLINE} strokeWidth={0.7} />
              <path d="M 0 -2 L 0 2" stroke="#d9a94e" strokeWidth={0.7} />
            </g>
          ))}
        </g>
      );
    case "neck_moonstone":
      return (
        <g>
          <defs>
            <radialGradient id={`${u}-ms`} cx="0.4" cy="0.35" r="0.7">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="0.5" stopColor="#d9f3ff" />
              <stop offset="1" stopColor="#b9a3f5" />
            </radialGradient>
          </defs>
          <path d="M -11 -1 Q 0 16 11 -1" fill="none" stroke="#e2b65e" strokeWidth={0.8} />
          <ellipse cx={0} cy={10.5} rx={4} ry={5} fill="#e2b65e" {...thin} />
          <ellipse cx={0} cy={10.5} rx={2.8} ry={3.7} fill={`url(#${u}-ms)`} />
          <circle cx={-1} cy={9} r={0.9} fill="#fff" />
          <circle cx={0} cy={10.5} r={7.5} fill="#cfe9ff" opacity={0.25} />
        </g>
      );
    case "neck_chain_dark":
      return (
        <g>
          {arc(9, 12, 9).map(([x, y], i) => (
            <ellipse key={i} cx={x} cy={y} rx={2.3} ry={1.5} fill="none" stroke="#2c2a36" strokeWidth={2.4} transform={`rotate(${i % 2 ? 60 : 0} ${x} ${y})`} />
          ))}
          {arc(9, 12, 9).map(([x, y], i) => (
            <ellipse key={i} cx={x} cy={y} rx={2.3} ry={1.5} fill="none" stroke="#9c97ad" strokeWidth={1} transform={`rotate(${i % 2 ? 60 : 0} ${x} ${y})`} />
          ))}
        </g>
      );
    case "neck_crystal":
      return (
        <g>
          <path d="M -11 -1 Q 0 15 11 -1" fill="none" stroke="#c9c6d6" strokeWidth={0.8} />
          <path d="M -2.6 7 L 2.6 7 L 2.6 13 L 0 17 L -2.6 13 Z" fill="#e8faff" {...thin} />
          <path d="M 0 7 L 0 17 M -2.6 13 L 2.6 13" stroke="#b9a3f5" strokeWidth={0.6} />
          <path d="M -1.5 8 L -1.5 12" stroke="#fff" strokeWidth={0.8} />
        </g>
      );
    case "neck_black_pearl":
      return (
        <g>
          <path d="M -7.5 -9 Q 0 -6.5 7.5 -9 L 7.5 -5.5 Q 0 -3 -7.5 -5.5 Z" fill="#241e2a" {...thin} />
          {arc(5, 6, 2.2, -8).map(([x, y], i) => (
            <g key={i}>
              <circle cx={x} cy={y + 0.8} r={1.6} fill="#2a2333" stroke="#120d16" strokeWidth={0.4} />
              <circle cx={x - 0.5} cy={y + 0.3} r={0.55} fill="#d8c6ff" />
            </g>
          ))}
          <path d="M 0 -4.5 L 0 -1" stroke="#c9c6d6" strokeWidth={0.6} />
          <circle cx={0} cy={1.4} r={2.6} fill="#2a2333" stroke="#120d16" strokeWidth={0.5} />
          <circle cx={-0.9} cy={0.5} r={0.9} fill="#e6dcff" />
          <circle cx={0.9} cy={2.4} r={0.5} fill="#9be8d8" opacity={0.8} />
        </g>
      );
    default:
      return null;
  }
}

/** One earring with the origin at the ear lobe. */
export function EarringPart({ id }: { id: string }) {
  switch (id) {
    case "ear_pearl_drop":
      return (
        <g>
          <path d="M 0 0 L 0 4" stroke="#e2b65e" strokeWidth={0.9} />
          <circle cx={0} cy={6.5} r={2.6} fill="#fffaf6" stroke="#b98aa8" strokeWidth={0.6} />
          <circle cx={-0.8} cy={5.7} r={0.8} fill="#fff" />
        </g>
      );
    case "ear_silver_hoops":
      return (
        <g>
          <circle cx={0} cy={4.5} r={4.5} fill="none" stroke="#5b5868" strokeWidth={2.6} />
          <circle cx={0} cy={4.5} r={4.5} fill="none" stroke="#e8e6f0" strokeWidth={1.2} />
        </g>
      );
    case "ear_star_studs":
      return (
        <g>
          <path d={starD(0, 1, 3.4, 1.5)} fill="#f4d68e" stroke="#b98a3a" strokeWidth={0.6} />
          <circle cx={-0.6} cy={0.4} r={0.6} fill="#fff" />
        </g>
      );
    case "ear_shell_dangles":
      return (
        <g>
          <path d="M 0 0 L 0 3" stroke="#e2b65e" strokeWidth={0.9} />
          <path d="M 0 10 L -3.8 5 Q -2.4 2.6 0 2.6 Q 2.4 2.6 3.8 5 Z" fill="#ffd1e3" stroke={OUTLINE} strokeWidth={0.6} />
          <path d="M 0 10 L -1.4 3 M 0 10 L 1.4 3" stroke="#ff9fcb" strokeWidth={0.5} />
        </g>
      );
    default:
      return null;
  }
}

/** A tiny velvet bat on a gold clip, centred on the body, about 40 units wide. */
export function BatClip() {
  const wing = "M -3 -2 C -7 -10 -15 -12 -20 -8 C -19 -5 -18 -2 -16 0 Q -14 -2 -12 1 Q -10 -1 -8 3 Q -6 1 -3 4 Z";
  return (
    <g>
      <path d="M -9 6.5 L 9 6.5" stroke={OUTLINE} strokeWidth={3.2} strokeLinecap="round" />
      <path d="M -9 6.5 L 9 6.5" stroke="#f0c76e" strokeWidth={1.8} strokeLinecap="round" />
      {[1, -1].map((sx) => (
        <g key={sx} transform={sx === -1 ? "scale(-1 1)" : undefined}>
          <path d={wing} fill="#5a3f78" stroke={OUTLINE} strokeWidth={1.1} strokeLinejoin="round" />
          <path d="M -4 -1 C -8 -6 -13 -8 -17 -7" stroke="#8b6fb0" strokeWidth={1} fill="none" strokeLinecap="round" />
          <path d="M -8 -2 L -9 2 M -13 -3 L -13 0" stroke="#3d2a55" strokeWidth={0.7} strokeLinecap="round" />
        </g>
      ))}
      <path d="M -3.4 -3 L -4 -8 L -1.4 -5 Z M 3.4 -3 L 4 -8 L 1.4 -5 Z" fill="#4a3264" stroke={OUTLINE} strokeWidth={0.9} strokeLinejoin="round" />
      <ellipse cx={0} cy={0.6} rx={4.4} ry={5} fill="#4a3264" stroke={OUTLINE} strokeWidth={1.1} />
      <path d="M -2.6 -2.6 Q -1 -4 1 -3.6" stroke="#8b6fb0" strokeWidth={0.8} fill="none" strokeLinecap="round" />
      <circle cx={-1.6} cy={0} r={0.85} fill="#fff" />
      <circle cx={1.6} cy={0} r={0.85} fill="#fff" />
      <ellipse cx={-2.8} cy={2} rx={1.1} ry={0.6} fill="#ff8fbf" opacity={0.8} />
      <ellipse cx={2.8} cy={2} rx={1.1} ry={0.6} fill="#ff8fbf" opacity={0.8} />
      <path d="M -0.8 2.2 L 0 3.2 L 0.8 2.2" stroke="#fff" strokeWidth={0.5} fill="none" />
    </g>
  );
}

/** Hair accessories, origin at their anchor point on the head. */
export function HairAccPart({ id }: { id: string }) {
  switch (id) {
    case "hair_shell_clip":
      return (
        <g transform="rotate(20)">
          <path d="M 0 8 L -11 -3 Q -8 -11 0 -12 Q 8 -11 11 -3 Z" fill="#ffd9ea" {...ol} />
          <path d="M 0 8 L -6 -9 M 0 8 L 0 -11 M 0 8 L 6 -9 M 0 8 L -10 -3 M 0 8 L 10 -3" stroke="#ff9fcb" strokeWidth={0.9} />
          <path d="M -5 -9 Q 0 -11 5 -9" stroke="#fff" strokeWidth={1.4} fill="none" strokeLinecap="round" />
          <circle cx={0} cy={8} r={2.6} fill="#fffaf6" {...thin} />
        </g>
      );
    case "hair_bow_pink":
      return (
        <g transform="rotate(-14)">
          <path d="M 0 0 C -6 -10 -18 -10 -17 0 C -18 9 -6 9 0 0 Z" fill="#ff8fc8" {...ol} />
          <path d="M 0 0 C 6 -10 18 -10 17 0 C 18 9 6 9 0 0 Z" fill="#ff8fc8" {...ol} />
          <path d="M -2 2 L -7 13 L -3 12 L -1 15 Z M 2 2 L 7 13 L 3 12 L 1 15 Z" fill="#f772b3" {...thin} />
          <path d="M -13 -4 Q -9 -7 -5 -4 M 13 -4 Q 9 -7 5 -4" stroke="#fff" strokeWidth={1.4} fill="none" strokeLinecap="round" opacity={0.8} />
          <ellipse cx={0} cy={0} rx={3.4} ry={3.8} fill="#ffa8d2" {...thin} />
        </g>
      );
    case "hair_starfish":
      return (
        <g transform="rotate(12)">
          <path d={starD(0, 0, 11, 5)} fill="#ffa98a" stroke={OUTLINE} strokeWidth={1.4} strokeLinejoin="round" />
          {[0, 72, 144, 216, 288].map((a) => (
            <g key={a} transform={`rotate(${a})`}>
              <circle cx={0} cy={-6} r={0.8} fill="#fff1e4" />
              <circle cx={0} cy={-3.5} r={0.6} fill="#fff1e4" />
            </g>
          ))}
          <path d="M -3 0 Q -2 1 -1 0 M 1 0 Q 2 1 3 0" stroke={INK} strokeWidth={0.8} fill="none" strokeLinecap="round" />
          <circle cx={-3.5} cy={1.8} r={1} fill="#ff6f91" opacity={0.6} />
          <circle cx={3.5} cy={1.8} r={1} fill="#ff6f91" opacity={0.6} />
        </g>
      );
    case "hair_moon_pins":
      return (
        <g>
          {([[-38, 10, 1, -20], [36, 4, 0, 0], [42, 30, 1, 30], [-44, 34, 0, 0], [-22, -10, 0, 0], [24, -12, 1, 15]] as [number, number, number, number][]).map(([x, y, moon, r], i) =>
            moon ? (
              <path key={i} d="M0 -5 A5 5 0 1 0 4 3.5 A3.8 3.8 0 1 1 0 -5 Z" transform={`translate(${x} ${y}) rotate(${r})`} fill="#f4d68e" stroke="#a87a2a" strokeWidth={0.8} />
            ) : (
              <path key={i} d={starD(x, y, 4, 1.7)} fill="#f4d68e" stroke="#a87a2a" strokeWidth={0.7} />
            ),
          )}
        </g>
      );
    case "hair_sunglasses":
      return (
        <g>
          <path d="M -30 2 Q -32 -6 -24 -7 L -8 -6 Q -3 -5 -4 2 Q -6 8 -16 8 Q -28 8 -30 2 Z" fill="#1d1722" {...ol} />
          <path d="M 30 2 Q 32 -6 24 -7 L 8 -6 Q 3 -5 4 2 Q 6 8 16 8 Q 28 8 30 2 Z" fill="#1d1722" {...ol} />
          <path d="M -4 -2 Q 0 -4 4 -2" stroke="#1d1722" strokeWidth={2} fill="none" />
          <path d="M -25 -3 L -19 -4 M 13 -4 L 23 -3" stroke="#ff9fcb" strokeWidth={1.6} strokeLinecap="round" opacity={0.85} />
          <path d="M -24 1 L -15 -2" stroke="#9be8d8" strokeWidth={1} strokeLinecap="round" opacity={0.7} />
        </g>
      );
    case "hair_bat_clips":
      return (
        <g>
          <g transform="translate(-41 6) rotate(-28) scale(1.15)">
            <BatClip />
          </g>
          <g transform="translate(40 2) rotate(24) scale(1.05)">
            <BatClip />
          </g>
        </g>
      );
    default:
      return null;
  }
}

/** Companions, origin at the creature's centre, roughly 40 x 44 units. */
export function CompanionPart({ id, u }: { id: string; u: string }) {
  switch (id) {
    case "pet_seahorse":
      return (
        <g>
          <defs>
            <Grad id={`${u}-sh`} x2={1} y2={1} stops={[[0, "#ffd3ea"], [0.5, "#ff9fd0"], [1, "#e46aa6"]]} />
          </defs>
          <path d="M -9 2 Q -16 4 -14 10 Q -10 8 -7 9 Z M -10 -4 Q -17 -4 -15 2 Q -11 0 -8 1 Z" fill="#c9b6ff" {...thin} />
          <path d="M -2 -19 C 9 -21 13 -12 9 -6 C 13 -1 13 9 5 13 C 1 15 -1 19 3 21 C 7 23 9 18 5 17 C 4 21 0 21 -1 17 C -3 12 -2 8 -5 4 C -9 -2 -10 -15 -2 -19 Z" fill={`url(#${u}-sh)`} {...ol} />
          <path d="M 7 -15 L 16 -13 Q 17 -11 16 -9 L 8 -10 Z" fill={`url(#${u}-sh)`} {...thin} />
          <path d="M -4 -18 L -6 -23 L -1 -20 L 0 -25 L 3 -20 L 6 -23 L 5 -18" fill="#f4d68e" {...thin} />
          {[-2, 2, 6].map((y) => (
            <path key={y} d={`M 2 ${y} Q 6 ${y + 1} 9 ${y}`} stroke="#fff" strokeWidth={0.9} fill="none" opacity={0.8} />
          ))}
          <circle cx={2} cy={-13} r={2.4} fill={INK} />
          <circle cx={1.2} cy={-13.8} r={0.9} fill="#fff" />
          <circle cx={3} cy={-9} r={1.4} fill="#ff6f91" opacity={0.5} />
          <circle cx={-4} cy={-12} r={1.2} fill="#fff" opacity={0.8} />
        </g>
      );
    case "pet_jellyfish":
      return (
        <g>
          <defs>
            <radialGradient id={`${u}-jf`} cx="0.4" cy="0.3" r="0.8">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="0.5" stopColor="#d8ccff" />
              <stop offset="1" stopColor="#9fe6e6" />
            </radialGradient>
          </defs>
          <g fill="none" strokeLinecap="round" strokeWidth={1.6} opacity={0.9}>
            <path d="M -8 2 Q -11 9 -7 14 Q -4 19 -8 24" stroke="#c9b6ff" />
            <path d="M -2 3 Q -4 11 -1 16 Q 2 21 -1 26" stroke="#9fe6e6" />
            <path d="M 4 3 Q 2 10 5 15 Q 8 20 5 24" stroke="#ffb3dc" />
            <path d="M 9 2 Q 12 8 9 13" stroke="#c9b6ff" />
          </g>
          <circle cx={0} cy={-6} r={16} fill="#d8ccff" opacity={0.25} />
          <path d="M -14 2 C -14 -18 14 -18 14 2 Q 10.5 5 7 2 Q 3.5 5 0 2 Q -3.5 5 -7 2 Q -10.5 5 -14 2 Z" fill={`url(#${u}-jf)`} {...ol} opacity={0.95} />
          <path d="M -8 -8 Q -4 -13 2 -12" stroke="#fff" strokeWidth={1.8} fill="none" strokeLinecap="round" />
          <circle cx={-4.5} cy={-3} r={1.3} fill={INK} />
          <circle cx={4.5} cy={-3} r={1.3} fill={INK} />
          <path d="M -1.5 -0.5 Q 0 1 1.5 -0.5" stroke={INK} strokeWidth={0.8} fill="none" strokeLinecap="round" />
          <circle cx={-7.5} cy={-0.8} r={1.3} fill="#ff8fc8" opacity={0.55} />
          <circle cx={7.5} cy={-0.8} r={1.3} fill="#ff8fc8" opacity={0.55} />
          <path d="M0 -4 A4 4 0 1 0 3 3 A3 3 0 1 1 0 -4 Z" transform="translate(6 -9) scale(0.5)" fill="#fff4cf" />
        </g>
      );
    case "pet_crab_bat":
      return (
        <g>
          <path d="M -8 -2 C -14 -10 -22 -10 -25 -4 Q -21 -4 -20 0 Q -17 -3 -15 1 Q -12 -2 -9 2 Z" fill="#4a3a5e" {...thin} />
          <path d="M 8 -2 C 14 -10 22 -10 25 -4 Q 21 -4 20 0 Q 17 -3 15 1 Q 12 -2 9 2 Z" fill="#4a3a5e" {...thin} />
          <path d="M -9 6 L -14 10 M -7 8 L -10 13 M 9 6 L 14 10 M 7 8 L 10 13" stroke={OUTLINE} strokeWidth={1.4} strokeLinecap="round" />
          <ellipse cx={0} cy={3} rx={11} ry={8} fill="#ff7f8f" {...ol} />
          <ellipse cx={-3} cy={0} rx={4} ry={2} fill="#ffc2cb" opacity={0.8} />
          <path d="M -10 -3 Q -15 -8 -13 -13 L -9 -10 L -11 -14 Q -6 -12 -8 -6 Z" fill="#ff7f8f" {...thin} />
          <path d="M 10 -3 Q 15 -8 13 -13 L 9 -10 L 11 -14 Q 6 -12 8 -6 Z" fill="#ff7f8f" {...thin} />
          <path d="M -3 -4 L -4 -9 M 3 -4 L 4 -9" stroke={OUTLINE} strokeWidth={1.2} />
          <circle cx={-4} cy={-10} r={2.2} fill="#fff" {...thin} />
          <circle cx={4} cy={-10} r={2.2} fill="#fff" {...thin} />
          <circle cx={-3.6} cy={-9.6} r={1.1} fill={INK} />
          <circle cx={4.4} cy={-9.6} r={1.1} fill={INK} />
          <path d="M -2 5 Q 0 7 2 5" stroke={INK} strokeWidth={0.9} fill="none" strokeLinecap="round" />
        </g>
      );
    case "pet_black_cat":
      return (
        <g>
          <path d="M 9 14 C 22 12 22 -4 15 -6 C 19 0 18 8 8 9 Z" fill="#2a2430" {...thin} />
          <path d="M -11 18 C -14 6 -10 -2 0 -2 C 10 -2 14 6 11 18 Q 0 21 -11 18 Z" fill="#2a2430" {...ol} />
          <path d="M -6 18 L -6 14 M 6 18 L 6 14" stroke="#4d4456" strokeWidth={1} />
          <path d="M -12 -10 L -11 -24 L -3 -15 Z M 12 -10 L 11 -24 L 3 -15 Z" fill="#2a2430" {...ol} />
          <path d="M -10 -14 L -10 -20 L -6 -15 Z M 10 -14 L 10 -20 L 6 -15 Z" fill="#ff9fc4" />
          <ellipse cx={0} cy={-9} rx={13} ry={11} fill="#2a2430" {...ol} />
          <path d="M -8 -15 Q -2 -19 4 -17" stroke="#5d5468" strokeWidth={1.4} fill="none" strokeLinecap="round" />
          {[-5, 5].map((x) => (
            <g key={x}>
              <ellipse cx={x} cy={-9} rx={3} ry={3.4} fill="#f4c94a" />
              <ellipse cx={x} cy={-9} rx={1} ry={2.6} fill="#1a1420" />
              <circle cx={x - 1} cy={-10.4} r={0.9} fill="#fff" />
            </g>
          ))}
          <path d="M -1 -5 L 1 -5 L 0 -4 Z" fill="#ff9fc4" />
          <path d="M -9 -4 L -16 -5 M -9 -3 L -16 -1 M 9 -4 L 16 -5 M 9 -3 L 16 -1" stroke="#8d88a0" strokeWidth={0.6} />
          <path d="M -7 1 Q 0 4 7 1" stroke="#b9a3f5" strokeWidth={1.8} fill="none" />
          <path d="M0 -3 A3 3 0 1 0 2.2 2 A2.2 2.2 0 1 1 0 -3 Z" transform="translate(0 5)" fill="#f4d68e" />
        </g>
      );
    case "pet_pomeranian": {
      // A round orange fluffball with a plume tail and a tiny pink bow.
      const puff = (cx: number, cy: number, r: number, n: number) => {
        let d = "";
        for (let i = 0; i <= n; i++) {
          const a = (i / n) * Math.PI * 2;
          const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
          if (i === 0) d = `M ${f(x)} ${f(y)}`;
          else {
            const m = a - Math.PI / n;
            d += ` Q ${f(cx + Math.cos(m) * r * 1.22)} ${f(cy + Math.sin(m) * r * 1.22)} ${f(x)} ${f(y)}`;
          }
        }
        return d + " Z";
      };
      return (
        <g>
          <path d={puff(12, 2, 8, 9)} fill="#ffcf8a" {...thin} />
          <path d={puff(0, 9, 12, 12)} fill="#f4a64a" {...ol} />
          <ellipse cx={-5} cy={19} rx={3.2} ry={2} fill="#f4a64a" {...thin} />
          <ellipse cx={5} cy={19} rx={3.2} ry={2} fill="#f4a64a" {...thin} />
          <path d={puff(0, -6, 13, 14)} fill="#ffd9a3" {...ol} />
          <path d="M -9 -13 L -11 -24 L -3 -18 Z M 9 -13 L 11 -24 L 3 -18 Z" fill="#f4a64a" {...ol} />
          <path d="M -8.5 -16 L -9.5 -21 L -5.5 -18 Z M 8.5 -16 L 9.5 -21 L 5.5 -18 Z" fill="#ffc2d8" />
          <ellipse cx={0} cy={-7} rx={10} ry={9} fill="#f7b45e" stroke={OUTLINE} strokeWidth={1.2} />
          <ellipse cx={0} cy={-3} rx={5.5} ry={4.2} fill="#fff1dc" />
          {[-4.2, 4.2].map((x) => (
            <g key={x}>
              <circle cx={x} cy={-9} r={2.3} fill="#2a1c14" />
              <circle cx={x - 0.8} cy={-10} r={0.8} fill="#fff" />
            </g>
          ))}
          <ellipse cx={0} cy={-5} rx={1.6} ry={1.1} fill="#2a1c14" />
          <path d="M -1.8 -3.4 Q 0 -2 0 -4 Q 0 -2 1.8 -3.4" stroke={OUTLINE} strokeWidth={0.7} fill="none" />
          <path d="M -1 -2.6 Q 0 0.6 1 -2.6 Z" fill="#ff8fb4" />
          <ellipse cx={-7.5} cy={-4.5} rx={1.8} ry={1.1} fill="#ff9fc4" opacity={0.6} />
          <ellipse cx={7.5} cy={-4.5} rx={1.8} ry={1.1} fill="#ff9fc4" opacity={0.6} />
          <g transform="translate(8 -15) rotate(18)">
            <path d="M0 0 C -2 -3 -6 -3 -5.5 0 C -6 3 -2 3 0 0 Z M0 0 C 2 -3 6 -3 5.5 0 C 6 3 2 3 0 0 Z" fill="#ff7fbf" {...thin} />
            <circle r={1.2} fill="#ffd3e8" />
          </g>
        </g>
      );
    }
    case "pet_white_kitten": {
      let fluff = "M -12 18";
      const pts: [number, number][] = [[-14, 10], [-13, 2], [-9, -2], [0, -3], [9, -2], [13, 2], [14, 10], [12, 18]];
      for (const [x, y] of pts) fluff += ` Q ${x * 1.15} ${y + 1} ${x} ${y}`;
      fluff += " Q 0 21 -12 18 Z";
      return (
        <g>
          <path d="M 10 15 C 20 14 22 2 16 0 C 18 6 16 10 9 11 Z" fill="#fffaf6" {...thin} />
          <path d={fluff} fill="#fffaf6" {...ol} />
          <path d="M -12 -9 L -12 -23 L -4 -16 Z M 12 -9 L 12 -23 L 4 -16 Z" fill="#fffaf6" {...ol} />
          <path d="M -10.5 -13 L -10.5 -19 L -6.5 -15.5 Z M 10.5 -13 L 10.5 -19 L 6.5 -15.5 Z" fill="#ffc2d8" />
          <path d="M -14 -8 Q -15 -14 -10 -18 Q -6 -21 0 -21 Q 6 -21 10 -18 Q 15 -14 14 -8 Q 15 -2 10 1 Q 6 3 0 3 Q -6 3 -10 1 Q -15 -2 -14 -8 Z" fill="#fffaf6" {...ol} />
          {[-5.2, 5.2].map((x) => (
            <g key={x}>
              <ellipse cx={x} cy={-8.5} rx={3.2} ry={3.8} fill="#5f9fe0" />
              <ellipse cx={x} cy={-8} rx={1.6} ry={2.2} fill="#1e3a66" />
              <circle cx={x - 1.1} cy={-10} r={1.1} fill="#fff" />
              <circle cx={x + 1} cy={-6.8} r={0.5} fill="#fff" />
            </g>
          ))}
          <path d="M -1.2 -4 L 1.2 -4 L 0 -2.8 Z" fill="#ff9fc4" />
          <path d="M -1.8 -1.6 Q 0 -0.4 0 -2.6 Q 0 -0.4 1.8 -1.6" stroke={OUTLINE} strokeWidth={0.7} fill="none" />
          <ellipse cx={-9.5} cy={-3.5} rx={2} ry={1.2} fill="#ff9fc4" opacity={0.6} />
          <ellipse cx={9.5} cy={-3.5} rx={2} ry={1.2} fill="#ff9fc4" opacity={0.6} />
          <ellipse cx={-5} cy={18} rx={3} ry={1.8} fill="#fffaf6" {...thin} />
          <ellipse cx={5} cy={18} rx={3} ry={1.8} fill="#fffaf6" {...thin} />
        </g>
      );
    }
    case "pet_butterfly":
      return (
        <g>
          <defs>
            <Grad id={`${u}-bf`} x2={1} y2={1} stops={[[0, "#e7d6ff"], [0.5, "#b48cf0"], [1, "#7a52d6"]]} />
          </defs>
          <path d="M -1 0 C -8 -16 -22 -16 -21 -5 C -20 3 -9 4 -1 2 Z" fill={`url(#${u}-bf)`} {...ol} />
          <path d="M 1 0 C 8 -16 22 -16 21 -5 C 20 3 9 4 1 2 Z" fill={`url(#${u}-bf)`} {...ol} />
          <path d="M -1 3 C -10 4 -16 12 -11 16 C -6 18 -2 10 -1 5 Z" fill={`url(#${u}-bf)`} {...thin} />
          <path d="M 1 3 C 10 4 16 12 11 16 C 6 18 2 10 1 5 Z" fill={`url(#${u}-bf)`} {...thin} />
          {[[-14, -6], [14, -6], [-10, 11], [10, 11], [-9, -11], [9, -11]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={i > 3 ? 1 : 1.8} fill="#f4d68e" />
          ))}
          <ellipse cx={0} cy={3} rx={1.8} ry={7} fill="#4a3a6e" {...thin} />
          <path d="M -1 -4 Q -4 -10 -6 -12 M 1 -4 Q 4 -10 6 -12" stroke={OUTLINE} strokeWidth={0.9} fill="none" />
          <circle cx={-6} cy={-12} r={1} fill="#f4d68e" />
          <circle cx={6} cy={-12} r={1} fill="#f4d68e" />
          <path d="M -15 -10 Q -12 -13 -8 -12" stroke="#fff" strokeWidth={1.2} fill="none" strokeLinecap="round" />
        </g>
      );
    case "pet_moth_moon":
      return (
        <g>
          <defs>
            <Grad id={`${u}-mo`} x2={1} y2={1} stops={[[0, "#e8fbe0"], [0.6, "#b8ecc6"], [1, "#8fd8b4"]]} />
          </defs>
          <path d="M -2 4 C -8 10 -12 18 -9 26 C -6 20 -4 14 -1 8 Z M 2 4 C 8 10 12 18 9 26 C 6 20 4 14 1 8 Z" fill={`url(#${u}-mo)`} {...thin} />
          <path d="M -1 -2 C -10 -16 -24 -14 -22 -2 C -21 6 -10 8 -1 3 Z" fill={`url(#${u}-mo)`} {...ol} />
          <path d="M 1 -2 C 10 -16 24 -14 22 -2 C 21 6 10 8 1 3 Z" fill={`url(#${u}-mo)`} {...ol} />
          <circle cx={-12} cy={-3} r={2.6} fill="#ffe28a" {...thin} />
          <circle cx={12} cy={-3} r={2.6} fill="#ffe28a" {...thin} />
          <circle cx={-12} cy={-3} r={1} fill="#ff8fc8" />
          <circle cx={12} cy={-3} r={1} fill="#ff8fc8" />
          <path d="M -3 -14 C -2 -9 -2 -5 -1 -3 M 3 -14 C 2 -9 2 -5 1 -3" stroke={OUTLINE} strokeWidth={0.9} fill="none" />
          <path d="M -3 -14 l -2 -1 M -2.6 -11.5 l -2 -1 M 3 -14 l 2 -1 M 2.6 -11.5 l 2 -1" stroke={OUTLINE} strokeWidth={0.7} />
          <ellipse cx={0} cy={2} rx={3.2} ry={6.5} fill="#fffaf2" {...thin} />
          <circle cx={-1.2} cy={-1.5} r={0.8} fill={INK} />
          <circle cx={1.2} cy={-1.5} r={0.8} fill={INK} />
          <path d="M -15 -9 Q -12 -12 -8 -11" stroke="#fff" strokeWidth={1.2} fill="none" strokeLinecap="round" />
        </g>
      );
    default:
      return null;
  }
}

/** Garment-only rendering of an outfit, used by item icons. */
export function OutfitIconPart({ id, u }: { id: string; u: string }) {
  const o = OUTFITS[id];
  if (!o) return null;
  const b = DEFAULT_BUILD;
  const parts = o.draw({ b, u, mode: "full" });
  const { S, E, H } = armPts(b);
  const sleeveW = b.armW + 4;
  const sleeveEnd = o.sleeve === "long" ? H : o.sleeve === "tee" ? lerp(S, E, 0.62) : o.sleeve === "rolled" ? lerp(S, E, 0.5) : null;
  const sleeves = (
    <>
      {sleeveEnd && (
        <>
          {[1, -1].map((s) => (
            <g key={s} transform={s === -1 ? mirror : undefined}>
              <path d={`M ${S[0] - 1} ${S[1] - 1} L ${sleeveEnd[0]} ${sleeveEnd[1]}`} stroke={OUTLINE} strokeWidth={sleeveW + 3.4} strokeLinecap="round" />
              <path d={`M ${S[0] - 1} ${S[1] - 1} L ${sleeveEnd[0]} ${sleeveEnd[1]}`} stroke={o.sleeveFill} strokeWidth={sleeveW} strokeLinecap="round" />
            </g>
          ))}
        </>
      )}
      {(o.sleeve === "puff" || o.sleeve === "bell" || o.sleeve === "flutter") &&
        [1, -1].map((s) => (
          <g key={s} transform={s === -1 ? mirror : undefined}>
            {o.sleeve === "puff" && <ellipse cx={S[0] + 2.5} cy={S[1] + 3.5} rx={8.6} ry={8} fill={o.sleeveFill} {...ol} />}
            {o.sleeve === "bell" && <path d={`M ${S[0] - 5} ${S[1] - 3} L ${S[0] + 4} ${S[1] - 3} Q ${E[0] + 4} ${E[1] - 4} ${E[0] + 9} ${E[1] + 6} Q ${E[0] + 1} ${E[1] + 10} ${E[0] - 8} ${E[1] + 4} Q ${E[0] - 6} ${E[1] - 6} ${S[0] - 5} ${S[1] - 3} Z`} fill={o.sleeveFill} {...ol} />}
            {o.sleeve === "flutter" && <path d={`M ${S[0] - 5} ${S[1] - 4} Q ${S[0] + 9} ${S[1] - 6} ${S[0] + 12} ${S[1] + 8} Q ${S[0] + 8} ${S[1] + 10} ${S[0] + 6} ${S[1] + 7} Q ${S[0] + 3} ${S[1] + 12} ${S[0] - 1} ${S[1] + 8} Z`} fill={o.sleeveFill} {...ol} />}
          </g>
        ))}
    </>
  );
  return (
    <g>
      {o.trousers && <path d={trousersD(b, b.footY - 8)} fill={o.trousers} {...ol} />}
      {o.leggings && <path d={trousersD(b, b.footY - 8, -3)} fill={o.leggings} {...ol} />}
      {sleeves}
      {parts.lower}
      {parts.upper}
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Faces                                                               */
/* ------------------------------------------------------------------ */

const EYE_D = "M -12.5 -3 Q -11.5 -15 0 -15 Q 10 -15 12.8 -5 Q 13.5 6 6.5 12 Q 0 15.5 -6 12.2 Q -13 7 -12.5 -3 Z";

type EyeKind = "open" | "sparkle" | "star" | "half" | "closedDown" | "closedUp" | "teary";

function Eye({ cx, cy, side, kind, u, iris, soft, sp }: { cx: number; cy: number; side: 1 | -1; kind: EyeKind; u: string; iris: string; soft: boolean; sp: SkinPalette }) {
  const lidW = soft ? 2.6 : 3.2;
  if (kind === "closedDown" || kind === "closedUp") {
    const d = kind === "closedDown" ? "M -11 1 Q 0 9 12 1" : "M -11 5 Q 0 -6 12 4";
    const lash = kind === "closedDown" ? "M 11 2 Q 14.5 4 17 3" : "M 11.5 4 Q 15 3 17.5 0";
    return (
      <g transform={`translate(${cx} ${cy}) scale(${side} 1)`}>
        <path d={d} stroke={INK} strokeWidth={lidW} fill="none" strokeLinecap="round" />
        {!soft && <path d={lash} stroke={INK} strokeWidth={1.8} fill="none" strokeLinecap="round" />}
      </g>
    );
  }
  const pupil = kind === "star" ? (
    <path d={starD(0, 2.5, 6.2, 2.6)} fill={darken(iris, 0.7)} />
  ) : (
    <ellipse cx={0} cy={3} rx={kind === "teary" ? 5 : 4.4} ry={kind === "teary" ? 6.4 : 5.8} fill={darken(iris, 0.68)} />
  );
  return (
    <g>
      <g transform={`translate(${cx} ${cy}) scale(${side} 1)`}>
        <path d={EYE_D} fill="#fff" />
        <g clipPath={`url(#${u}-eye)`}>
          <path d="M -14 -16 L 14 -16 L 14 -8 Q 0 -4 -14 -8 Z" fill="#e7dcf5" />
          <ellipse cx={0} cy={2} rx={9.4} ry={11.8} fill={`url(#${u}-iris)`} />
          <ellipse cx={0} cy={2} rx={9.4} ry={11.8} fill="none" stroke={darken(iris, 0.55)} strokeWidth={1} />
          {pupil}
          <path d="M -6.5 8 Q 0 13.5 6.5 8 Q 0 10.8 -6.5 8 Z" fill={lighten(iris, 0.65)} opacity={0.9} />
          {kind === "half" && (
            <>
              <rect x={-15} y={-17} width={30} height={15.5} fill={sp.base} />
            </>
          )}
          {kind === "teary" && <path d="M -10 9 Q 0 15 10 9 L 10 16 L -10 16 Z" fill="#bfefff" opacity={0.7} />}
        </g>
        {kind === "half" ? (
          <path d="M -13 -1.6 Q 0 -3 13.6 -2.4" stroke={INK} strokeWidth={lidW} fill="none" strokeLinecap="round" />
        ) : (
          <path d="M -13.2 -2 Q -12 -16.5 0 -16 Q 10.5 -16 13.8 -5.5" stroke={INK} strokeWidth={lidW} fill="none" strokeLinecap="round" />
        )}
        {!soft && kind !== "half" && <path d="M 12 -7 Q 15.5 -9 17.5 -13 M 13.2 -3.6 Q 17 -3.8 19 -7" stroke={INK} strokeWidth={1.8} fill="none" strokeLinecap="round" />}
        {soft && kind !== "half" && <path d="M 12.4 -6 Q 15 -7 16 -9.5" stroke={INK} strokeWidth={1.4} fill="none" strokeLinecap="round" />}
        <path d="M 3 13.2 Q 7.5 12 10.2 8.5" stroke={INK} strokeWidth={1.1} fill="none" strokeLinecap="round" opacity={0.55} />
      </g>
      {kind === "sparkle" ? (
        <>
          <path d={SPARKLE_D} transform={`translate(${cx - 3.6} ${cy - 3.5}) scale(0.95)`} fill="#fff" />
          <path d={SPARKLE_D} transform={`translate(${cx + 4} ${cy + 6}) scale(0.45)`} fill="#fff" />
        </>
      ) : kind === "half" ? (
        <circle cx={cx - 3} cy={cy + 2} r={2} fill="#fff" />
      ) : (
        <>
          <ellipse cx={cx - 3.8} cy={cy - 3.6} rx={kind === "teary" ? 4.4 : 3.8} ry={kind === "teary" ? 4.8 : 4.2} fill="#fff" />
          <circle cx={cx + 4} cy={cy + 6} r={kind === "teary" ? 2.2 : 1.7} fill="#fff" />
          <circle cx={cx + 5} cy={cy - 5} r={0.9} fill="#fff" opacity={0.9} />
        </>
      )}
    </g>
  );
}

function Brows({ mood, p, andro, sleepy }: { mood: Mood; p: HairPalette; andro: boolean; sleepy: boolean }) {
  const col = mix(p.deep, INK, 0.35);
  let d = andro ? "M -9 0 Q 0 -2.4 9 -0.6" : "M -8.5 1 Q 0 -3 9 0";
  if (mood === "hungry") d = "M -8.5 -2.8 Q 0 -2.4 9 1.8";
  if (mood === "offended") d = "M -8.5 -1 Q 0 -6.5 9 -3";
  if (mood === "bored" || sleepy) d = "M -8.5 1.5 Q 0 0.5 9 1.5";
  if (mood === "thriving" || mood === "magical") d = andro ? "M -9 -1 Q 0 -3.6 9 -1.2" : "M -8.5 0 Q 0 -4.4 9 -1";
  return (
    <g stroke={col} strokeWidth={andro ? 2.6 : 1.9} fill="none" strokeLinecap="round" opacity={0.92}>
      <path d={d} transform="translate(121 85)" />
      <path d={d} transform="translate(79 85) scale(-1 1)" />
    </g>
  );
}

function Mouth({ mood, sp }: { mood: Mood; sp: SkinPalette }) {
  const lip = "#b8406f";
  switch (mood) {
    case "thriving":
      return (
        <g>
          <path d="M 90.5 123.5 Q 100 125.5 109.5 123.5 Q 108.5 136.5 100 137.5 Q 91.5 136.5 90.5 123.5 Z" fill="#a8305e" stroke={INK} strokeWidth={1.4} strokeLinejoin="round" />
          <path d="M 94 133.2 Q 100 129.5 106 133.2 Q 100 137.6 94 133.2 Z" fill="#ff8fb1" />
          <path d="M 92 124.6 Q 100 126.4 108 124.6 L 107.6 126.4 Q 100 128 92.4 126.4 Z" fill="#fff" />
        </g>
      );
    case "happy":
      return (
        <g>
          <path d="M 93.5 125 Q 100 126.5 106.5 125 Q 105 132 100 132.4 Q 95 132 93.5 125 Z" fill="#b8406f" stroke={INK} strokeWidth={1.3} strokeLinejoin="round" />
          <path d="M 96.5 130.4 Q 100 128.6 103.5 130.4 Q 100 132.2 96.5 130.4 Z" fill="#ff8fb1" />
        </g>
      );
    case "sleepy":
      return <ellipse cx={100} cy={129} rx={2.4} ry={2.8} fill={lip} stroke={INK} strokeWidth={1.1} />;
    case "hungry":
      return (
        <g>
          <path d="M 91.5 125 q 2.8 -2 5.6 0 q 2.8 2 5.6 0 q 2.8 -2 5.6 0 L 108.3 127 Q 100 138 91.5 127 Z" fill="#a8305e" stroke={INK} strokeWidth={1.3} strokeLinejoin="round" />
          <path d="M 95 132 Q 100 129.5 105 132 Q 100 135 95 132 Z" fill="#ff8fb1" />
          <path d="M 107.6 128.5 Q 106.4 132.5 107.8 134 Q 109.6 132.4 107.6 128.5 Z" fill="#c9f2ff" stroke="#7fc6e0" strokeWidth={0.7} />
        </g>
      );
    case "bored":
      return <path d="M 94.5 128.8 Q 100 127.6 106 128.4" stroke={INK} strokeWidth={1.6} fill="none" strokeLinecap="round" />;
    case "magical":
      return <path d="M 92.5 126 Q 96.3 130.5 100 126.6 Q 103.7 130.5 107.5 126" stroke={INK} strokeWidth={1.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />;
    case "offended":
      return (
        <g>
          <path d="M 96 130.5 Q 100 126 104 130.2 Q 100 131.6 96 130.5 Z" fill={lip} stroke={INK} strokeWidth={1.3} strokeLinejoin="round" />
          <path d="M 98 128.6 Q 99.6 128 101 128.5" stroke="#ff9fbf" strokeWidth={0.8} />
        </g>
      );
    default:
      return <path d="M 95 127 Q 100 131 105 127" stroke={INK} strokeWidth={1.5} fill="none" strokeLinecap="round" />;
  }
  void sp;
}

/* ------------------------------------------------------------------ */
/* Mood effects                                                        */
/* ------------------------------------------------------------------ */

function MoodFx({ mood, b }: { mood: Mood; b: Build }) {
  switch (mood) {
    case "thriving":
      return (
        <g>
          {[[156, 62, 1.3, 0], [168, 86, 0.9, 0.8], [40, 70, 1.1, 1.5]].map(([x, y, s, dl], i) => (
            <g key={i} className="pcw-float" style={{ animationDelay: `${dl}s` }}>
              <path d={HEART_D} transform={`translate(${x} ${y}) scale(${s})`} fill="#ff6fa8" stroke={OUTLINE} strokeWidth={0.8} />
              <circle cx={x - 1.6 * s} cy={y - 2.4 * s} r={0.9 * s} fill="#fff" opacity={0.85} />
            </g>
          ))}
          <path d={SPARKLE_D} transform="translate(30 104) scale(0.7)" fill="#f4d68e" className="pcw-twinkle" />
          <path d={SPARKLE_D} transform="translate(170 116) scale(0.55)" fill="#fff" stroke="#f4d68e" strokeWidth={0.6} />
        </g>
      );
    case "sleepy":
      return (
        <g className="pcw-z" fill="none" stroke="#8f6bf0" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M 156 84 h 8 l -8 9 h 8" />
          <path d="M 168 64 h 11 l -11 12 h 11" strokeWidth={2.4} />
          <path d="M 182 46 h 6 l -6 7 h 6" strokeWidth={1.6} />
        </g>
      );
    case "hungry":
      return (
        <g stroke="#e8734f" strokeWidth={1.5} fill="none" strokeLinecap="round" className="pcw-twinkle">
          <path d={`M ${100 + b.wa + 14} ${b.waistY - 12} q 3 3 0 6 M ${100 + b.wa + 18} ${b.waistY - 14} q 4 5 0 10`} />
          <path d={`M ${100 - b.wa - 14} ${b.waistY - 12} q -3 3 0 6 M ${100 - b.wa - 18} ${b.waistY - 14} q -4 5 0 10`} />
        </g>
      );
    case "bored":
      return (
        <g className="pcw-puff">
          <g fill="#f3eefc" stroke="#b8a9d9" strokeWidth={1}>
            <circle cx={118} cy={134} r={3.4} />
            <circle cx={124} cy={131} r={4.4} />
            <circle cx={131} cy={133} r={3.6} />
          </g>
        </g>
      );
    case "magical":
      return (
        <g className="pcw-orbit" style={{ transformBox: "fill-box", transformOrigin: "50% 50%" } as CSSProperties}>
          {Array.from({ length: 6 }, (_, i) => {
            const a = (i / 6) * Math.PI * 2;
            const x = 100 + Math.cos(a) * 70;
            const y = 98 + Math.sin(a) * 58;
            return i % 2 === 0 ? (
              <path key={i} d={SPARKLE_D} transform={`translate(${f(x)} ${f(y)}) scale(0.9)`} fill="#f4d68e" stroke="#fff" strokeWidth={0.6} />
            ) : (
              <path key={i} d={starD(x, y, 3.6, 1.6)} fill="#c9b0ff" stroke="#fff" strokeWidth={0.5} />
            );
          })}
        </g>
      );
    case "offended":
      return (
        <g transform="translate(140 64)" stroke="#ef4f74" strokeWidth={2.2} fill="none" strokeLinecap="round">
          <path d="M -6 -2 Q -2 -2 -2 -6 M 2 -6 Q 2 -2 6 -2 M 6 2 Q 2 2 2 6 M -2 6 Q -2 2 -6 2" />
        </g>
      );
    default:
      return null;
  }
}

/* ------------------------------------------------------------------ */
/* Offended shell                                                      */
/* ------------------------------------------------------------------ */

function ShellBack({ u }: { u: string }) {
  const cx = 100, cy = 236, r = 98, n = 9;
  const pts: Pt[] = Array.from({ length: n + 1 }, (_, i) => {
    const a = Math.PI + (i / n) * Math.PI;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  });
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const a = Math.PI + ((i - 0.5) / n) * Math.PI;
    d += ` Q ${f(cx + (r + 10) * Math.cos(a))} ${f(cy + (r + 10) * Math.sin(a))} ${f(pts[i][0])} ${f(pts[i][1])}`;
  }
  d += " Z";
  return (
    <g>
      <defs>
        <radialGradient id={`${u}-shb`} cx="0.5" cy="1" r="1">
          <stop offset="0" stopColor="#ffe9f3" />
          <stop offset="0.6" stopColor="#ffb3d5" />
          <stop offset="1" stopColor="#f58cbc" />
        </radialGradient>
      </defs>
      <path d={d} fill={`url(#${u}-shb)`} {...ol} />
      {pts.slice(1, -1).map(([x, y], i) => (
        <path key={i} d={`M ${cx} ${cy} L ${f(x)} ${f(y)}`} stroke="#e37fb0" strokeWidth={1.4} opacity={0.7} />
      ))}
      <path d={`M 30 200 Q 60 150 100 146`} stroke="#fff" strokeWidth={3} fill="none" opacity={0.5} strokeLinecap="round" />
    </g>
  );
}

function ShellFront({ u }: { u: string }) {
  const top = 208;
  return (
    <g>
      <defs>
        <Grad id={`${u}-shf`} stops={[[0, "#ffd3e7"], [0.5, "#ffa6cf"], [1, "#ef7db2"]]} />
      </defs>
      <path d={`M 16 ${top + 4}${scallops(16, 184, top + 4, 10, -7)} L 178 246 Q 100 266 22 246 Z`} fill={`url(#${u}-shf)`} {...ol} />
      {Array.from({ length: 9 }, (_, i) => 16 + ((i + 1) * 168) / 10).map((x, i) => (
        <path key={i} d={`M ${f(x)} ${top + 4} Q ${f(100 + (x - 100) * 0.8)} 236 ${f(100 + (x - 100) * 0.72)} 254`} stroke="#e47aae" strokeWidth={1.3} fill="none" opacity={0.75} />
      ))}
      <path d={`M 30 ${top + 6} Q 100 ${top - 4} 170 ${top + 6}`} stroke="#fff" strokeWidth={2.4} fill="none" opacity={0.6} strokeLinecap="round" />
      <circle cx={28} cy={top + 10} r={3.4} fill="#fffaf6" {...thin} />
      <circle cx={172} cy={top + 10} r={3.4} fill="#fffaf6" {...thin} />
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Styles                                                              */
/* ------------------------------------------------------------------ */

const CSS = `
@media (prefers-reduced-motion: no-preference) {
  .pcw-anim .pcw-bob { animation: pcwBob 3.4s ease-in-out infinite; }
  .pcw-anim .pcw-blink { animation: pcwBlink 5.2s infinite; transform-box: fill-box; transform-origin: 50% 50%; }
  .pcw-anim .pcw-sway { animation: pcwSway 4.2s ease-in-out infinite; }
  .pcw-anim .pcw-fin { animation: pcwFin 2.8s ease-in-out infinite; }
  .pcw-anim .pcw-pet { animation: pcwPet 2.9s ease-in-out infinite; }
  .pcw-anim .pcw-wing { animation: pcwWing 1.6s ease-in-out infinite; transform-box: fill-box; transform-origin: 0% 60%; }
  .pcw-anim .pcw-float-soft { animation: pcwBob 2.6s ease-in-out infinite; }
  .pcw-anim .pcw-float { animation: pcwFloat 3.2s ease-in-out infinite; }
  .pcw-anim .pcw-orbit { animation: pcwOrbit 14s linear infinite; }
  .pcw-anim .pcw-dance { animation: pcwDance 0.9s ease-in-out infinite; }
  .pcw-anim .pcw-shimmer { animation: pcwShimmer 3.8s ease-in-out infinite; }
  .pcw-anim .pcw-z { animation: pcwZ 3s ease-in-out infinite; }
  .pcw-anim .pcw-puff { animation: pcwPuff 3.6s ease-out infinite; }
  .pcw-anim .pcw-twinkle { animation: pcwTwinkle 1.8s ease-in-out infinite; transform-box: fill-box; transform-origin: 50% 50%; }
}
@keyframes pcwBob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
@keyframes pcwBlink { 0%,90%,100% { transform: scaleY(1); } 93% { transform: scaleY(0.08); } 96% { transform: scaleY(1); } }
@keyframes pcwSway { 0%,100% { transform: rotate(-2deg); } 50% { transform: rotate(2.5deg); } }
@keyframes pcwFin { 0%,100% { transform: rotate(-7deg); } 50% { transform: rotate(8deg); } }
@keyframes pcwWing { 0%,100% { transform: rotate(0deg) scaleX(1); } 50% { transform: rotate(-6deg) scaleX(0.9); } }
@keyframes pcwPet { 0%,100% { transform: translateY(0) rotate(-3deg); } 50% { transform: translateY(-6px) rotate(3deg); } }
@keyframes pcwFloat { 0% { transform: translateY(4px); opacity: 0; } 25% { opacity: 1; } 100% { transform: translateY(-12px); opacity: 0; } }
@keyframes pcwOrbit { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes pcwDance { 0%,100% { transform: rotate(-5deg); } 50% { transform: rotate(5deg) translateY(-3px); } }
@keyframes pcwShimmer { 0% { transform: translateX(-30px); } 60%,100% { transform: translateX(60px); } }
@keyframes pcwZ { 0%,100% { transform: translate(0,0); opacity: 0.6; } 50% { transform: translate(3px,-5px); opacity: 1; } }
@keyframes pcwPuff { 0% { transform: translate(0,0); opacity: 0; } 30% { opacity: 1; } 100% { transform: translate(10px,-6px); opacity: 0; } }
@keyframes pcwTwinkle { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(0.6); opacity: 0.6; } }
`;

/* ------------------------------------------------------------------ */
/* Witch                                                               */
/* ------------------------------------------------------------------ */

export interface WitchProps {
  petName?: string;
  characterId: CharacterId;
  look: Look;
  equipped: Equipped;
  mood: Mood;
  size?: number;
  animate?: boolean;
  action?: AnimationKey | null;
  className?: string;
  title?: string;
}

const EAR_L: Pt = [57, 110];
const EAR_R: Pt = [143, 110];

const HAT_IDS = new Set(["hat_sun_pink", "hat_witch_pink", "hat_pearl_crown", "hat_sun_straw", "hat_crescent", "hat_flower_crown", "hat_beanie_black", "hat_crystal_tiara", "hat_snow_pearl"]);

export function Witch({ characterId, look, equipped, mood, size = 220, animate = true, action = null, className, title, petName }: WitchProps) {
  const u = safeId(useId());
  const b = BUILDS[characterId] ?? ADULT;
  const hp = hairPalette(look.hairColor);
  const sp = skinPalette(look.skin);
  const offended = mood === "offended";
  const tail = equipped.tail && TAILS[equipped.tail] ? equipped.tail : undefined;
  const outfit = (equipped.outfit && OUTFITS[equipped.outfit]) || defaultOutfit(characterId);
  const mode: Mode = tail ? "tail" : b.andro && outfit.andTrousers ? "tunic" : "full";
  const parts = outfit.draw({ b, u, mode });
  const trousers = !tail ? outfit.trousers ?? (mode === "tunic" ? outfit.andTrousers : undefined) : undefined;
  const leggings = !tail && mode === "full" ? outfit.leggings : undefined;
  const shoes: ShoeKind = b.andro ? "boots" : outfit.shoes;
  const shoeColor = b.andro && outfit.shoes !== "boots" ? "#241e2a" : outfit.shoeColor;
  const style = HAIR[look.hairStyle] ? look.hairStyle : "long_waves";
  const sleeping = action === "sleep";
  const tattoos = !!look.tattoos;
  // The reference gives Dray big midnight curls and Cheryl honey curls.
  const curly = characterId === "dray" || characterId === "cheryl";

  let eye: EyeKind = "open";
  if (mood === "thriving") eye = "sparkle";
  else if (mood === "magical") eye = "star";
  else if (mood === "sleepy") eye = "closedDown";
  else if (mood === "bored") eye = "half";
  else if (mood === "offended") eye = "closedUp";
  else if (mood === "hungry") eye = "teary";
  if (sleeping) eye = "closedDown";
  const canBlink = eye === "open" || eye === "sparkle" || eye === "star" || eye === "teary";

  const headT = `translate(100 140) scale(${b.headScale}) ${offended ? "rotate(-5) " : ""}translate(-100 -140)`;
  const tilt = action === "swim" || action === "float" ? "rotate(-9 100 170)" : undefined;
  let hash = 0;
  for (const ch of u) hash = (hash * 31 + ch.charCodeAt(0)) % 997;
  const blinkDelay = `${(hash % 40) / 10}s`;

  const eyeY = b.baby ? 107 : 106;
  const eyeDX = b.baby ? 21.5 : 21;
  const blushStrength = mood === "thriving" || mood === "offended" ? 0.75 : mood === "bored" || mood === "sleepy" ? 0.35 : 0.5;

  const label = title ?? `${characterId} feeling ${mood}`;
  const hat = equipped.hat && HAT_IDS.has(equipped.hat) ? equipped.hat : undefined;
  const hairAccPos: Record<string, Pt> = { hair_shell_clip: [140, 64], hair_bow_pink: [62, 52], hair_starfish: [141, 66], hair_sunglasses: [100, 50], hair_moon_pins: [100, 60], hair_bat_clips: [100, 60] };
  const acc = equipped.hair_acc && hairAccPos[equipped.hair_acc] ? equipped.hair_acc : undefined;
  // A wide hat sits where shades or a top bow would go, so tuck those away.
  const accHidden = acc && hat && (acc === "hair_sunglasses" || acc === "hair_bow_pink") && hat !== "hat_pearl_crown" && hat !== "hat_crystal_tiara" && hat !== "hat_flower_crown";
  const buns = style === "space_buns";

  return (
    <svg
      viewBox="0 0 200 260"
      width={(size * 200) / 260}
      height={size}
      role="img"
      aria-label={label}
      className={[animate ? "pcw-anim" : "", className ?? ""].join(" ").trim() || undefined}
      style={{ overflow: "visible" }}
    >
      <title>{label}</title>
      <style>{CSS}</style>
      <defs>
        <radialGradient id={`${u}-orb`} cx="0.4" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.4" stopColor="#e7d6ff" />
          <stop offset="0.8" stopColor="#a77ef0" />
          <stop offset="1" stopColor="#6b46c8" />
        </radialGradient>
        <radialGradient id={`${u}-curl`} cx="0.38" cy="0.3" r="0.75">
          <stop offset="0" stopColor={hp.light} />
          <stop offset="0.55" stopColor={hp.base} />
          <stop offset="1" stopColor={hp.shade} />
        </radialGradient>
        <Grad id={`${u}-hair`} stops={[[0, hp.light], [0.5, hp.base], [1, hp.shade]]} />
        <Grad id={`${u}-hairb`} stops={[[0, hp.base], [0.6, hp.shade], [1, style === "ethereal_long" ? lighten(mix(hp.base, "#c9b0ff", 0.3), 0.1) : hp.deep]]} />
        <radialGradient id={`${u}-skin`} cx="0.4" cy="0.35" r="0.75">
          <stop offset="0" stopColor={sp.light} />
          <stop offset="0.55" stopColor={sp.base} />
          <stop offset="1" stopColor={mix(sp.base, sp.shade, 0.5)} />
        </radialGradient>
        <Grad id={`${u}-iris`} stops={[[0, darken(look.eyeColor, 0.45)], [0.45, look.eyeColor], [1, lighten(look.eyeColor, 0.45)]]} />
        <clipPath id={`${u}-eye`}>
          <path d={EYE_D} />
        </clipPath>
        <clipPath id={`${u}-face`}>
          <path d={FACE_D} />
        </clipPath>
      </defs>

      {offended && <ShellBack u={u} />}

      <g transform={offended ? "translate(0 28)" : undefined}>
        <g transform={tilt}>
          <g className={action === "dance" ? "pcw-dance" : undefined} style={{ transformBox: "fill-box", transformOrigin: "50% 100%" } as CSSProperties}>
            <g className="pcw-bob">
              {characterId === "layla" && !offended && (
                <g>
                  <defs>
                    <Grad id={`${u}-wing`} stops={[[0, "#ffffff", 0.95], [0.45, "#ffb3da", 0.92], [1, "#c9a6ff", 0.92]]} x2={1} y2={1} />
                  </defs>
                  {[1, -1].map((s) => (
                    <g key={s} transform={s === -1 ? mirror : undefined}>
                      <g className="pcw-wing" style={{ animationDelay: s === 1 ? "0s" : "0.05s" }}>
                        <path d={`M 104 ${b.sY + 6} C 126 ${b.sY - 30} 176 ${b.sY - 34} 178 ${b.sY - 8} C 180 ${b.sY + 12} 150 ${b.sY + 20} 106 ${b.sY + 16} Z`} fill={`url(#${u}-wing)`} stroke="#e58bbd" strokeWidth={1.4} strokeLinejoin="round" />
                        <path d={`M 106 ${b.sY + 18} C 140 ${b.sY + 16} 164 ${b.sY + 34} 156 ${b.sY + 54} C 148 ${b.sY + 66} 120 ${b.sY + 46} 106 ${b.sY + 24} Z`} fill={`url(#${u}-wing)`} stroke="#e58bbd" strokeWidth={1.4} strokeLinejoin="round" />
                        <path d={`M 108 ${b.sY + 10} C 130 ${b.sY - 8} 152 ${b.sY - 18} 170 ${b.sY - 14} M 110 ${b.sY + 22} C 128 ${b.sY + 28} 142 ${b.sY + 38} 150 ${b.sY + 50}`} stroke="#f7a8cf" strokeWidth={1} fill="none" opacity={0.8} />
                        <Glitter pts={[[166, b.sY - 18], [150, b.sY + 2], [140, b.sY + 40]]} color="#fff" />
                      </g>
                    </g>
                  ))}
                </g>
              )}
              {/* back hair */}
              <g transform={headT}>
                {buns && HAIR.space_buns.extra?.(hp, u)}
                <g transform="translate(100 0) scale(0.87 1) translate(-100 0)">
                  <HairBack style={style} p={hp} u={u} curly={curly} />
                </g>
              </g>

              {/* lower body */}
              {offended ? null : tail ? (
                <g className="pcw-sway" style={{ transformBox: "fill-box", transformOrigin: "50% 0%" } as CSSProperties}>
                  <TailPart id={tail} b={b} u={u} sway={animate} />
                </g>
              ) : (
                <g>
                  {[1, -1].map((s) => (
                    <g key={s} transform={s === -1 ? mirror : undefined}>
                      <path d={`M ${100 + b.legX} ${b.hipY - 4} L ${100 + b.legX + 0.5} ${b.footY - 6}`} stroke={sp.line} strokeWidth={b.baby ? 12.5 : 11.5} strokeLinecap="round" />
                      <path d={`M ${100 + b.legX} ${b.hipY - 4} L ${100 + b.legX + 0.5} ${b.footY - 6}`} stroke={sp.base} strokeWidth={b.baby ? 9.5 : 8.5} strokeLinecap="round" />
                    </g>
                  ))}
                  {leggings && (
                    <>
                      <path d={`M ${100 - b.wa - 1} ${b.waistY - 2} L ${100 + b.wa + 1} ${b.waistY - 2} L ${100 + b.legX + 5} ${b.hipY + 2} L ${100 + b.legX + 5} ${b.footY - 7} L ${100 + b.legX - 4.5} ${b.footY - 7} L 100.5 ${b.hipY + 8} L 99.5 ${b.hipY + 8} L ${100 - b.legX + 4.5} ${b.footY - 7} L ${100 - b.legX - 5} ${b.footY - 7} L ${100 - b.legX - 5} ${b.hipY + 2} Z`} fill={leggings} {...ol} />
                      <path d={`M ${100 + b.legX + 3} ${b.hipY + 4} L ${100 + b.legX + 3} ${b.footY - 9} M ${100 - b.legX - 3} ${b.hipY + 4} L ${100 - b.legX - 3} ${b.footY - 9}`} stroke="#ffb3d1" strokeWidth={1.2} />
                    </>
                  )}
                  {trousers && (
                    <>
                      <path d={trousersD(b, b.footY - 9)} fill={trousers} {...ol} />
                      <path d={`M 100 ${b.hipY + 9} L 100 ${b.waistY + 2}`} stroke={darken(trousers, 0.25)} strokeWidth={1} />
                      <path d={`M ${100 - Math.max(b.wa, b.hip - 2) + 3} ${b.hipY + 4} L ${100 - Math.max(b.wa, b.hip - 2) + 3} ${b.footY - 12}`} stroke={lighten(trousers, 0.25)} strokeWidth={1.2} opacity={0.7} />
                      {equipped.outfit === "outfit_overalls" && (
                        <path d={`M ${100 - b.hip - 1.5} ${b.footY - 13} L 98 ${b.footY - 13} M 102 ${b.footY - 13} L ${100 + b.hip + 1.5} ${b.footY - 13}`} stroke="#c7ddf3" strokeWidth={3} />
                      )}
                    </>
                  )}
                  {parts.lower}
                  {[1, -1].map((s) => (
                    <g key={s} transform={s === -1 ? mirror : undefined}>
                      <Shoe kind={shoes} color={shoeColor} x={100 + b.legX + 0.5} y={b.footY} />
                    </g>
                  ))}
                </g>
              )}
              {tail && !offended && parts.lower}

              {/* torso */}
              <path d={`M 94 128 L 94 ${b.sY + 4} L 106 ${b.sY + 4} L 106 128 Z`} fill={sp.base} stroke={sp.line} strokeWidth={1.4} />
              <path d={torsoD(b)} fill={sp.base} stroke={sp.line} strokeWidth={1.4} strokeLinejoin="round" />
              <path d={`M 94 ${b.sY - 6} Q 100 ${b.sY - 1} 106 ${b.sY - 6} L 106 ${b.sY - 10} L 94 ${b.sY - 10} Z`} fill={sp.shade} opacity={0.6} />
              {tattoos && (
                <g fill="#2c3566" stroke="#2c3566" strokeLinecap="round">
                  <path d={`M 88 ${b.sY + 3} Q 100 ${b.sY + 9} 112 ${b.sY + 3}`} fill="none" strokeWidth={0.8} strokeDasharray="0.1 2" />
                  <path d="M0 -3 A3 3 0 1 0 2.4 2 A2.2 2.2 0 1 1 0 -3 Z" transform={`translate(100 ${b.sY + 9})`} stroke="none" />
                  <path d={starD(91, b.sY + 7, 1.8, 0.8)} stroke="none" />
                  <path d={starD(109, b.sY + 7, 1.8, 0.8)} stroke="none" />
                </g>
              )}
              {parts.upper}
              <Arm b={b} sp={sp} o={outfit} tattoos={tattoos} side={1} />
              <g transform={mirror}>
                <Arm b={b} sp={sp} o={outfit} tattoos={tattoos} side={-1} />
              </g>
              {equipped.necklace && (
                <g transform={`translate(100 ${b.sY + (equipped.necklace === "neck_black_pearl" ? 0 : 1)}) scale(1.15)`}>
                  <NecklacePart id={equipped.necklace} u={u} />
                </g>
              )}

              {/* head */}
              <g transform={headT}>
                {/* ears */}
                {[1, -1].map((s) => (
                  <g key={s} transform={s === -1 ? mirror : undefined}>
                    {b.baby ? (
                      <path d="M 141 100 Q 154 90 158 96 Q 155 100 157 106 Q 151 110 141 112 Z" fill="#ffc4e6" stroke={OUTLINE} strokeWidth={1.4} strokeLinejoin="round" />
                    ) : (
                      <ellipse cx={143} cy={104} rx={6} ry={8} fill={sp.base} stroke={sp.line} strokeWidth={1.4} />
                    )}
                    {!b.baby && <path d="M 144 100 Q 147 104 144 108" stroke={sp.shade} strokeWidth={1.2} fill="none" />}
                  </g>
                ))}
                <path d={FACE_D} fill={`url(#${u}-skin)`} stroke={sp.line} strokeWidth={1.8} />
                {offended && <path d="M 138 110 Q 151 118 140 132" fill={sp.base} stroke={sp.line} strokeWidth={1.6} />}
                {characterId === "cheryl" && (
                  <g fill={mix(sp.base, "#7a4a2a", 0.45)} opacity={0.8}>
                    {[[70, 116], [75, 118.5], [79, 115.5], [121, 115.5], [125, 118.5], [130, 116]].map(([x, y], i) => (
                      <circle key={i} cx={x} cy={y} r={0.9} />
                    ))}
                  </g>
                )}
                {characterId === "veda" && (
                  <g>
                    <path d="M 100 76 L 103 81 L 100 86 L 97 81 Z" fill="#bfeff2" stroke={OUTLINE} strokeWidth={0.8} />
                    <circle cx={99} cy={80} r={0.8} fill="#fff" />
                    <circle cx={94} cy={83} r={0.7} fill="#c9b0ff" />
                    <circle cx={106} cy={83} r={0.7} fill="#c9b0ff" />
                  </g>
                )}
                {/* blush */}
                <g opacity={blushStrength}>
                  <ellipse cx={100 - 27} cy={120} rx={offended ? 9 : 8.5} ry={5} fill={sp.blush} />
                  <ellipse cx={100 + 27 + (offended ? 3 : 0)} cy={120} rx={offended ? 10 : 8.5} ry={5} fill={sp.blush} />
                </g>
                {(mood === "thriving" || offended) && (
                  <g stroke="#e8507f" strokeWidth={0.9} strokeLinecap="round" opacity={0.7}>
                    <path d="M 69 118 l -2 3 M 73 118 l -2 3 M 77 118 l -2 3" />
                    <path d="M 125 118 l -2 3 M 129 118 l -2 3 M 133 118 l -2 3" />
                  </g>
                )}
                <path d="M 99 118.5 Q 100.4 119.6 101.6 118.4" stroke={sp.line} strokeWidth={1.1} fill="none" strokeLinecap="round" opacity={0.6} />

                <g className={canBlink ? "pcw-blink" : undefined} style={{ animationDelay: blinkDelay }}>
                  <Eye cx={100 + eyeDX} cy={eyeY} side={1} kind={eye} u={u} iris={look.eyeColor} soft={b.andro} sp={sp} />
                  <Eye cx={100 - eyeDX} cy={eyeY} side={-1} kind={eye} u={u} iris={look.eyeColor} soft={b.andro} sp={sp} />
                </g>
                <Mouth mood={sleeping ? "sleepy" : mood} sp={sp} />

                <HairFront style={style} p={hp} u={u} sp={sp} curly={curly} />
                <Brows mood={mood} p={hp} andro={b.andro} sleepy={sleeping} />

                {equipped.earrings && (
                  <>
                    <g transform={`translate(${EAR_R[0]} ${EAR_R[1]}) scale(1.3)`}>
                      <EarringPart id={equipped.earrings} />
                    </g>
                    <g transform={`translate(${EAR_L[0]} ${EAR_L[1]}) scale(1.3)`}>
                      <EarringPart id={equipped.earrings} />
                    </g>
                  </>
                )}
                {acc && !accHidden && (
                  <g transform={`translate(${hairAccPos[acc][0]} ${hairAccPos[acc][1]})`}>
                    <HairAccPart id={acc} />
                  </g>
                )}
                {hat && (
                  <g transform={`translate(100 ${buns && (hat === "hat_witch_pink" || hat === "hat_crescent" || hat === "hat_sun_straw") ? 34 : hat === "hat_witch_pink" || hat === "hat_crescent" ? 43 : 40})`}>
                    <HatPart id={hat} u={u} />
                  </g>
                )}
              </g>

              {characterId === "dray" && !offended && (
                <g className="pcw-float-soft">
                  <circle cx={70} cy={b.sY + 42} r={15} fill="#c9a6ff" opacity={0.25} />
                  <circle cx={70} cy={b.sY + 42} r={9} fill={`url(#${u}-orb)`} stroke={OUTLINE} strokeWidth={1.4} />
                  <path d={`M 65 ${b.sY + 44} Q 69 ${b.sY + 38} 74 ${b.sY + 42}`} stroke="#fff" strokeWidth={0.9} fill="none" opacity={0.8} />
                  <ellipse cx={66.5} cy={b.sY + 38.5} rx={2.4} ry={1.5} fill="#fff" opacity={0.9} transform={`rotate(-30 66.5 ${b.sY + 38.5})`} />
                  <path d={SPARKLE_D} transform={`translate(58 ${b.sY + 32}) scale(0.4)`} fill="#f4d68e" />
                </g>
              )}
              <MoodFx mood={sleeping ? "sleepy" : mood} b={b} />
            </g>
          </g>
        </g>
      </g>

      {offended && <ShellFront u={u} />}

      {equipped.companion && (
        <g transform={equipped.companion === "pet_black_cat" || equipped.companion === "pet_white_kitten" || equipped.companion === "pet_pomeranian" ? `translate(${offended ? 178 : 170} ${offended ? 194 : b.footY - 18})` : "translate(176 150)"}>
          <g className="pcw-pet" style={{ animationDelay: `${(hash % 13) / 10}s` }}>
            <CompanionPart id={equipped.companion} u={u} />
          </g>
          {petName && (
            <g transform="translate(0 30)">
              <rect x={-petName.length * 2.7 - 5} y={-6.5} width={petName.length * 5.4 + 10} height={12} rx={6} fill="#fff" stroke="#f7a8cf" strokeWidth={1} />
              <text textAnchor="middle" y={3} fontSize={8.5} fontWeight={700} fill="#c2457f" fontFamily="inherit">{petName}</text>
            </g>
          )}
        </g>
      )}
    </svg>
  );
}

const FACE_D = "M 56 98 C 56 68 76 54 100 54 C 124 54 144 68 144 98 C 144 124 126 141 100 141 C 74 141 56 124 56 98 Z";

export function MiniWitch(props: WitchProps) {
  return <Witch {...props} size={props.size ?? 64} animate={props.animate ?? false} />;
}
