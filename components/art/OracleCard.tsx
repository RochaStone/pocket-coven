"use client";

import { useId, useState, type CSSProperties, type ReactNode } from "react";
import { ORACLE_CARDS } from "@/lib/game/catalog";
import { INK, OUTLINE, safeId } from "./color";
import { HEART_D, SPARKLE_D, starD } from "./Witch";

/* ------------------------------------------------------------------ */
/* Shared bits                                                         */
/* ------------------------------------------------------------------ */

const ol = { stroke: OUTLINE, strokeWidth: 2.2, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
const thin = { stroke: OUTLINE, strokeWidth: 1.4, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
const FONT = "var(--font-display), ui-rounded, system-ui, sans-serif";
type Pt = [number, number];

const f2 = (n: number) => Math.round(n * 100) / 100;

/** Scallop fan, the same construction ItemIcon uses for shells. */
function fanD(cx: number, cy: number, r: number, n: number, a0 = 180, a1 = 360, bump = 6) {
  const pts: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180;
    pts.push([f2(cx + r * Math.cos(a)), f2(cy + r * Math.sin(a))]);
  }
  let d = `M ${cx} ${cy} L ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const a = ((a0 + ((a1 - a0) * (i - 0.5)) / n) * Math.PI) / 180;
    d += ` Q ${f2(cx + (r + bump) * Math.cos(a))} ${f2(cy + (r + bump) * Math.sin(a))} ${pts[i][0]} ${pts[i][1]}`;
  }
  return { d: d + " Z", pts };
}

/** A circle with n soft scallops around the rim. */
function lobedCircleD(cx: number, cy: number, r: number, n: number, bump: number) {
  let d = "";
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    const x = f2(cx + r * Math.cos(a));
    const y = f2(cy + r * Math.sin(a));
    if (i === 0) d = `M ${x} ${y}`;
    else {
      const m = a - Math.PI / n;
      d += ` Q ${f2(cx + (r + bump) * Math.cos(m))} ${f2(cy + (r + bump) * Math.sin(m))} ${x} ${y}`;
    }
  }
  return d + " Z";
}

const Spark = ({ x, y, s = 0.8, c = "#fff" }: { x: number; y: number; s?: number; c?: string }) => (
  <path d={SPARKLE_D} transform={`translate(${x} ${y}) scale(${s})`} fill={c} stroke={c === "#fff" ? "#e9c27a" : OUTLINE} strokeWidth={0.5} />
);

function Face({ x, y, s = 1, sleepy = false }: { x: number; y: number; s?: number; sleepy?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {sleepy
        ? [-6, 6].map((ex) => <path key={ex} d={`M ${ex - 3} -1 Q ${ex} 2 ${ex + 3} -1`} stroke={INK} strokeWidth={1.6} fill="none" strokeLinecap="round" />)
        : [-6, 6].map((ex) => (
            <g key={ex}>
              <ellipse cx={ex} cy={-1} rx={2.5} ry={3.3} fill={INK} />
              <circle cx={ex - 0.9} cy={-2.3} r={1.1} fill="#fff" />
            </g>
          ))}
      <path d="M -2.4 4 Q 0 6.4 2.4 4" stroke={INK} strokeWidth={1.5} fill="none" strokeLinecap="round" />
      <ellipse cx={-10} cy={3.6} rx={3.2} ry={1.9} fill="#ff6f9f" opacity={0.55} />
      <ellipse cx={10} cy={3.6} rx={3.2} ry={1.9} fill="#ff6f9f" opacity={0.55} />
    </g>
  );
}

function LG({ id, stops, x1 = 0, y1 = 0, x2 = 0, y2 = 1 }: { id: string; stops: [number, string, number?][]; x1?: number; y1?: number; x2?: number; y2?: number }) {
  return (
    <linearGradient id={id} x1={x1} y1={y1} x2={x2} y2={y2}>
      {stops.map(([o, c, op], i) => (
        <stop key={i} offset={o} stopColor={c} stopOpacity={op ?? 1} />
      ))}
    </linearGradient>
  );
}

function RG({ id, stops, cx = 0.4, cy = 0.35, r = 0.7 }: { id: string; stops: [number, string, number?][]; cx?: number; cy?: number; r?: number }) {
  return (
    <radialGradient id={id} cx={cx} cy={cy} r={r}>
      {stops.map(([o, c, op], i) => (
        <stop key={i} offset={o} stopColor={c} stopOpacity={op ?? 1} />
      ))}
    </radialGradient>
  );
}

function SymbolDefs({ u }: { u: string }) {
  return (
    <defs>
      <LG id={`${u}-gold`} stops={[[0, "#fff1c4"], [0.5, "#f0c76e"], [1, "#c8923c"]]} />
      <LG id={`${u}-goldx`} x2={1} y2={1} stops={[[0, "#fff6d8"], [0.35, "#f4d68e"], [0.7, "#e2b65e"], [1, "#c8923c"]]} />
      <RG id={`${u}-pearl`} stops={[[0, "#ffffff"], [0.45, "#fff3f8"], [0.8, "#f0dcf5"], [1, "#d9e8f5"]]} />
      <LG id={`${u}-pink`} stops={[[0, "#ffe0ef"], [0.55, "#ffaed4"], [1, "#f084b8"]]} />
      <LG id={`${u}-lav`} stops={[[0, "#f1e8ff"], [0.55, "#cbb6ff"], [1, "#a68be8"]]} />
      <LG id={`${u}-aqua`} stops={[[0, "#e4fbf8"], [0.55, "#9fe6dc"], [1, "#5fc7c4"]]} />
      <LG id={`${u}-iri`} x2={1} y2={0.6} stops={[[0, "#ffd0e6"], [0.4, "#ffb3d6"], [0.7, "#d9c6ff"], [1, "#b9ecef"]]} />
      <RG id={`${u}-glow`} cx={0.5} cy={0.5} r={0.5} stops={[[0, "#fffbe9", 0.95], [0.5, "#ffe6b0", 0.45], [1, "#ffe6b0", 0]]} />
      <RG id={`${u}-vglow`} cx={0.5} cy={0.5} r={0.5} stops={[[0, "#f6ecff", 0.95], [0.5, "#d5b8ff", 0.45], [1, "#d5b8ff", 0]]} />
      <RG id={`${u}-pglow`} cx={0.5} cy={0.5} r={0.5} stops={[[0, "#fff3fa", 0.95], [0.5, "#ffc6e2", 0.45], [1, "#ffc6e2", 0]]} />
    </defs>
  );
}

/* ------------------------------------------------------------------ */
/* The 22 symbols, each drawn in a local box of roughly -50..50        */
/* ------------------------------------------------------------------ */

function Shine({ d, w = 3 }: { d: string; w?: number }) {
  return <path d={d} stroke="#fff" strokeWidth={w} fill="none" strokeLinecap="round" opacity={0.75} />;
}

function Frangipani({ x, y, s = 1, pink = false }: { x: number; y: number; s?: number; pink?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {[0, 72, 144, 216, 288].map((a) => (
        <path key={a} d="M 0 0 C -6 -3 -7 -11 -1 -13 C 4 -13 5 -6 0 0 Z" fill={pink ? "#ffc2dc" : "#fffaf3"} stroke={OUTLINE} strokeWidth={0.9} strokeLinejoin="round" transform={`rotate(${a})`} />
      ))}
      <circle r={3} fill="#ffd36a" />
    </g>
  );
}

function symbolArt(symbol: string, u: string): ReactNode {
  switch (symbol) {
    case "pearl": {
      const lid = fanD(0, 8, 44, 9, 192, 348, 7);
      return (
        <g>
          <circle cx={0} cy={-2} r={48} fill={`url(#${u}-glow)`} />
          <path d={lid.d} fill={`url(#${u}-lav)`} {...ol} />
          {lid.pts.slice(1, -1).map(([x, y], i) => (
            <path key={i} d={`M 0 8 L ${x} ${y}`} stroke="#9f86e0" strokeWidth={1.1} opacity={0.7} />
          ))}
          <Shine d="M -30 -16 Q -20 -32 -4 -36" />
          <path d="M -46 12 Q 0 0 46 12 Q 40 24 0 26 Q -40 24 -46 12 Z" fill="#ffe9f3" {...thin} />
          <circle cx={0} cy={4} r={18} fill={`url(#${u}-pearl)`} {...ol} />
          <ellipse cx={-6} cy={-3} rx={6} ry={4.2} fill="#fff" />
          <circle cx={7} cy={11} r={1.8} fill="#fff" opacity={0.8} />
          <path d="M -48 12 Q -44 46 0 47 Q 44 46 48 12 Q 40 28 0 30 Q -40 28 -48 12 Z" fill={`url(#${u}-pink)`} {...ol} />
          {[-32, -16, 0, 16, 32].map((x) => (
            <path key={x} d={`M ${x * 0.15} 46 L ${x} ${29 - Math.abs(x) * 0.12}`} stroke="#e47aae" strokeWidth={1.1} opacity={0.75} />
          ))}
          <Spark x={34} y={-30} s={1.1} />
          <Spark x={-38} y={-34} s={0.7} c="#ffd9ec" />
        </g>
      );
    }
    case "moon":
      return (
        <g>
          <defs>
            <RG id={`${u}-moon`} cx={0.3} cy={0.4} r={0.8} stops={[[0, "#fffdf2"], [0.5, "#fff1c4"], [1, "#f2cf7e"]]} />
          </defs>
          <circle cx={-10} cy={0} r={50} fill={`url(#${u}-glow)`} />
          <path d="M 14 -37.6 A 40 40 0 1 0 14 37.6 A 44 44 0 0 1 14 -37.6 Z" fill={`url(#${u}-moon)`} {...ol} strokeWidth={2.4} />
          <circle cx={-27} cy={-20} r={4} fill="#f2d48c" opacity={0.6} />
          <circle cx={-30} cy={18} r={3} fill="#f2d48c" opacity={0.6} />
          <circle cx={-16} cy={26} r={2} fill="#f2d48c" opacity={0.6} />
          <Shine d="M -32 -14 Q -36 0 -32 12" />
          <path d="M -26 -3 Q -22 1 -18 -3" stroke={INK} strokeWidth={1.8} fill="none" strokeLinecap="round" />
          <ellipse cx={-25} cy={5} rx={3.4} ry={2} fill="#ff6f9f" opacity={0.55} />
          <path d="M -15 6 Q -13 8 -11 6" stroke={INK} strokeWidth={1.4} fill="none" strokeLinecap="round" />
          <path d="M 24 -46 L 24 2" stroke="#e2b65e" strokeWidth={1.4} />
          <path d={starD(24, 11, 10, 4.6)} fill={`url(#${u}-gold)`} {...thin} />
          <circle cx={21} cy={8} r={1.6} fill="#fff" />
          <Spark x={38} y={-24} s={0.9} />
          <Spark x={34} y={32} s={0.6} c="#ffd9ec" />
        </g>
      );
    case "shell": {
      const s = fanD(0, 30, 46, 9, 180, 360, 9);
      return (
        <g>
          <circle cx={0} cy={0} r={48} fill={`url(#${u}-pglow)`} />
          <path d={s.d} fill={`url(#${u}-iri)`} {...ol} strokeWidth={2.4} />
          {s.pts.slice(1, -1).map(([x, y], i) => (
            <path key={i} d={`M 0 30 L ${x} ${y}`} stroke="#e47aae" strokeWidth={1.3} opacity={0.75} />
          ))}
          {s.pts.slice(1, -1).map(([x, y], i) => (
            <path key={`h${i}`} d={`M ${f2(x * 0.92)} ${f2(30 + (y - 30) * 0.92)} L ${f2(x * 0.55)} ${f2(30 + (y - 30) * 0.55)}`} stroke="#fff" strokeWidth={1.4} opacity={0.45} strokeLinecap="round" />
          ))}
          <path d="M -12 30 L -20 44 Q 0 48 20 44 L 12 30 Z" fill={`url(#${u}-pink)`} {...ol} />
          <path d="M -6 34 L -9 42 M 6 34 L 9 42" stroke="#e47aae" strokeWidth={1} />
          <Shine d="M -36 4 Q -30 -16 -12 -24" w={3.4} />
          <circle cx={0} cy={44} r={4} fill={`url(#${u}-pearl)`} {...thin} />
          <Spark x={36} y={-30} s={1.1} />
          <Spark x={-40} y={-26} s={0.7} c="#c9f2f0" />
        </g>
      );
    }
    case "tide":
      return (
        <g>
          <defs>
            <clipPath id={`${u}-tc`}>
              <circle r={44} />
            </clipPath>
            <LG id={`${u}-tsky`} stops={[[0, "#cdb8ff"], [0.6, "#ffd3ea"], [1, "#ffe9f2"]]} />
          </defs>
          <circle r={49} fill={`url(#${u}-goldx)`} {...ol} />
          <g clipPath={`url(#${u}-tc)`}>
            <rect x={-50} y={-50} width={100} height={100} fill={`url(#${u}-tsky)`} />
            <circle cx={0} cy={-24} r={14} fill="#fffaf0" opacity={0.5} />
            <circle cx={0} cy={-24} r={9} fill={`url(#${u}-pearl)`} {...thin} />
            <path d="M -16 -34 A 18 18 0 0 0 -16 -14 M 16 -34 A 18 18 0 0 1 16 -14" stroke="#fff" strokeWidth={1.4} fill="none" strokeDasharray="2 3" strokeLinecap="round" />
            <path d="M -50 -2 Q -37 -8 -25 -2 Q -12 4 0 -2 Q 12 -8 25 -2 Q 37 4 50 -2 L 50 50 L -50 50 Z" fill="#7fcfe0" {...thin} />
            <path d="M -50 8 Q -37 2 -25 8 Q -12 14 0 8 Q 12 2 25 8 Q 37 14 50 8 L 50 50 L -50 50 Z" fill="#a8e6ec" {...thin} />
            <path d="M -36 2 Q -30 -1 -24 2 M 8 1 Q 14 -2 20 1" stroke="#fff" strokeWidth={1.4} fill="none" strokeLinecap="round" />
            <path d="M -50 22 Q 0 12 50 22 L 50 50 L -50 50 Z" fill="#fbe2c2" {...thin} />
            <path d="M -50 21 Q -44 15 -38 19 Q -32 13 -26 17 Q -20 11 -13 15 Q -6 10 1 14 Q 8 10 14 14 Q 21 11 27 16 Q 33 13 39 18 Q 45 15 50 20" stroke="#fff" strokeWidth={3} fill="none" strokeLinecap="round" />
            <path d={starD(20, 33, 7, 3)} fill="#ffa98a" stroke={OUTLINE} strokeWidth={1.1} strokeLinejoin="round" />
            <path d={fanD(-16, 38, 6, 5, 180, 360, 2).d} fill="#ffc2dc" stroke={OUTLINE} strokeWidth={1} />
          </g>
          <circle r={44} fill="none" {...thin} />
          <Spark x={-30} y={-26} s={0.6} />
          <Spark x={30} y={-30} s={0.5} />
        </g>
      );
    case "star":
      return (
        <g>
          <circle r={50} fill={`url(#${u}-glow)`} />
          <path d={starD(0, 4, 48, 23)} fill={`url(#${u}-goldx)`} stroke={OUTLINE} strokeWidth={2.6} strokeLinejoin="round" />
          <path d={starD(0, 4, 39, 18.6)} fill="none" stroke="#fff6d8" strokeWidth={1.4} strokeLinejoin="round" opacity={0.8} />
          <Shine d="M -20 -6 Q -14 -12 -8 -12" />
          <Face x={0} y={10} s={1.15} />
          <path d={starD(-38, -36, 7, 3)} fill="#ffb3d5" {...thin} />
          <path d={starD(40, -30, 5.5, 2.4)} fill="#bfeff2" {...thin} />
          <Spark x={40} y={36} s={0.9} />
        </g>
      );
    case "matcha":
      return (
        <g>
          <defs>
            <LG id={`${u}-mt`} stops={[[0, "#ffe3ef"], [0.38, "#ffa8cb"], [0.56, "#d2edb0"], [1, "#82c46a"]]} />
            <clipPath id={`${u}-mc`}>
              <path d="M -24 -24 L 24 -24 L 18 42 Q 0 46 -18 42 Z" />
            </clipPath>
          </defs>
          <path d="M 12 -50 L 4 -14" stroke={OUTLINE} strokeWidth={8} strokeLinecap="round" />
          <path d="M 12 -50 L 4 -14" stroke="#ff8fc8" strokeWidth={5.4} strokeLinecap="round" />
          <path d="M 11 -44 L 9.5 -37 M 8.4 -31 L 7 -25" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" />
          <path d="M -24 -24 L 24 -24 L 18 42 Q 0 46 -18 42 Z" fill={`url(#${u}-mt)`} {...ol} strokeWidth={2.4} />
          <g clipPath={`url(#${u}-mc)`}>
            <rect x={-20} y={-22} width={14} height={13} rx={3} fill="#fff" opacity={0.55} transform="rotate(-14 -13 -15)" {...thin} />
            <rect x={-2} y={-16} width={13} height={12} rx={3} fill="#fff" opacity={0.5} transform="rotate(12 4 -10)" {...thin} />
            <rect x={-10} y={-2} width={12} height={11} rx={3} fill="#fff" opacity={0.4} transform="rotate(-6 -4 3)" {...thin} />
            <path d="M -24 10 Q -12 6 0 10 Q 12 14 24 10" stroke="#fff" strokeWidth={1.6} fill="none" opacity={0.7} />
          </g>
          <ellipse cx={0} cy={-24} rx={25} ry={4.4} fill="#fff4fb" opacity={0.8} {...thin} />
          <Shine d="M -17 -12 L -12 34" w={3} />
          <path d={HEART_D} transform="translate(4 24) scale(1.5)" fill="#fff" opacity={0.85} />
          <g transform="translate(22 -28) rotate(20)">
            <path d="M 0 12 C -10 6 -12 -4 -6 -7 C -3 -8 0 -6 0 -6 C 0 -6 3 -8 6 -7 C 12 -4 10 6 0 12 Z" fill="#ff6f8f" {...thin} />
            <path d="M -6 -7 L -2 -11 L 0 -7 L 3 -11 L 6 -7 Z" fill="#7cc795" {...thin} />
            {[[-3, -1], [3, 0], [0, 5], [-4, 4], [4, 5]].map(([x, y], i) => (
              <ellipse key={i} cx={x} cy={y} rx={0.7} ry={1} fill="#fff1c4" />
            ))}
          </g>
          <Spark x={-36} y={-36} s={0.9} />
          <circle cx={28} cy={20} r={1.6} fill="#bfeff2" />
          <circle cx={30} cy={28} r={1.1} fill="#bfeff2" />
        </g>
      );
    case "crown":
      return (
        <g>
          <circle cx={0} cy={-4} r={48} fill={`url(#${u}-glow)`} />
          <path d="M -46 26 Q -48 14 -30 12 L 30 12 Q 48 14 46 26 Q 48 42 30 42 L -30 42 Q -48 42 -46 26 Z" fill={`url(#${u}-lav)`} {...ol} />
          <path d="M -40 24 Q 0 18 40 24" stroke="#fff" strokeWidth={1.6} fill="none" opacity={0.6} />
          {[[-44, 38], [44, 38]].map(([x, y], i) => (
            <g key={i}>
              <path d={`M ${x} ${y} L ${x + (x < 0 ? -3 : 3)} ${y + 8}`} stroke="#e2b65e" strokeWidth={3} strokeLinecap="round" />
              <circle cx={x} cy={y} r={3} fill={`url(#${u}-gold)`} {...thin} />
            </g>
          ))}
          <path d="M -34 16 L -38 -22 L -17 -4 L 0 -32 L 17 -4 L 38 -22 L 34 16 Q 0 22 -34 16 Z" fill={`url(#${u}-goldx)`} {...ol} strokeWidth={2.4} />
          <path d="M -35 5 Q 0 11 35 5 L 34 16 Q 0 22 -34 16 Z" fill="#f7d98f" {...thin} />
          <Shine d="M -28 -6 L -30 2" w={2.4} />
          {([[-38, -25, 5], [0, -36, 6.2], [38, -25, 5]] as [number, number, number][]).map(([x, y, r], i) => (
            <g key={i}>
              <circle cx={x} cy={y} r={r} fill={`url(#${u}-pearl)`} {...thin} />
              <circle cx={x - r * 0.35} cy={y - r * 0.35} r={r * 0.32} fill="#fff" />
            </g>
          ))}
          <path d={HEART_D} transform="translate(0 11.5) scale(1.25)" fill="#ff7fb5" stroke={OUTLINE} strokeWidth={0.9} />
          <circle cx={-20} cy={11} r={2.8} fill="#9fe6dc" {...thin} />
          <circle cx={20} cy={11} r={2.8} fill="#9fe6dc" {...thin} />
          <path d={starD(0, -10, 5, 2.2)} fill="#fff" />
          <Spark x={-40} y={-40} s={0.8} />
          <Spark x={42} y={-4} s={0.6} c="#ffd9ec" />
        </g>
      );
    case "key":
      return (
        <g>
          <circle cx={0} cy={0} r={46} fill={`url(#${u}-pglow)`} />
          <g transform="scale(1.22) rotate(-38) translate(0 2)">
            <rect x={-4.5} y={-6} width={9} height={52} rx={3} fill={`url(#${u}-goldx)`} {...ol} />
            <path d="M 4 28 L 16 28 L 16 34 L 11 34 L 11 39 L 16 39 L 16 45 L 4 45 Z" fill={`url(#${u}-goldx)`} {...ol} />
            <path d={HEART_D} transform="translate(0 -20) scale(3.7)" fill={`url(#${u}-goldx)`} stroke={OUTLINE} strokeWidth={2.2 / 3.7} strokeLinejoin="round" />
            <path d={HEART_D} transform="translate(0 -21) scale(1.9)" fill="#ffaed4" stroke={OUTLINE} strokeWidth={1.2 / 1.9} />
            <rect x={-7.5} y={-6} width={15} height={6} rx={2.4} fill="#f7d98f" {...thin} />
            <path d="M -1.6 4 L -1.6 40" stroke="#fff6d8" strokeWidth={1.4} strokeLinecap="round" opacity={0.85} />
            <g transform="translate(0 6)">
              <path d="M 0 0 C -6 -8 -16 -7 -15 0 C -16 7 -6 8 0 0 Z M 0 0 C 6 -8 16 -7 15 0 C 16 7 6 8 0 0 Z" fill="#c9b6ff" {...thin} />
              <path d="M -2 2 L -7 13 L -3 12 L -1 15 Z M 2 2 L 7 13 L 3 12 L 1 15 Z" fill="#b39ef0" {...thin} />
              <ellipse rx={3} ry={3.4} fill="#e2d6ff" {...thin} />
            </g>
          </g>
          <Spark x={-34} y={20} s={0.9} />
          <Spark x={30} y={-36} s={0.7} c="#ffd9ec" />
        </g>
      );
    case "mirror":
      return (
        <g>
          <defs>
            <LG id={`${u}-glass`} x2={1} y2={1} stops={[[0, "#e8fbff"], [0.45, "#bfe6f5"], [0.75, "#d9c6ff"], [1, "#ffd0e6"]]} />
            <clipPath id={`${u}-gc`}>
              <ellipse cx={0} cy={-10} rx={25} ry={31} />
            </clipPath>
          </defs>
          <path d="M -6 26 L -5 46 Q 0 50 5 46 L 6 26 Z" fill={`url(#${u}-goldx)`} {...ol} />
          <circle cx={0} cy={48} r={4.4} fill={`url(#${u}-pearl)`} {...thin} />
          <ellipse cx={0} cy={-10} rx={34} ry={40} fill={`url(#${u}-goldx)`} {...ol} strokeWidth={2.4} />
          {Array.from({ length: 18 }, (_, i) => {
            const a = (i / 18) * Math.PI * 2;
            return <circle key={i} cx={f2(Math.cos(a) * 29.6)} cy={f2(-10 + Math.sin(a) * 35.6)} r={2.4} fill="#fffaf6" stroke={OUTLINE} strokeWidth={0.7} />;
          })}
          <ellipse cx={0} cy={-10} rx={25} ry={31} fill={`url(#${u}-glass)`} {...thin} />
          <g clipPath={`url(#${u}-gc)`}>
            <path d="M -30 -6 L 4 -44 L 14 -44 L -20 -2 Z" fill="#fff" opacity={0.6} />
            <path d="M -16 14 L 22 -30 L 26 -24 L -10 18 Z" fill="#fff" opacity={0.45} />
          </g>
          <path d={HEART_D} transform="translate(8 6) scale(1.3)" fill="#ff9fcb" opacity={0.9} />
          <path d={HEART_D} transform="translate(0 -54) scale(1.2)" fill="#ff7fb5" {...thin} strokeWidth={1} />
          <Spark x={-8} y={-26} s={0.9} />
          <Spark x={38} y={-40} s={0.7} c="#ffd9ec" />
          <Spark x={-38} y={30} s={0.6} />
        </g>
      );
    case "flame":
      return (
        <g>
          <defs>
            <LG id={`${u}-fl`} stops={[[0, "#fff4c4"], [0.5, "#ffc28a"], [1, "#ff8fb8"]]} />
          </defs>
          <circle cx={0} cy={-22} r={40} fill={`url(#${u}-glow)`} />
          <path d="M 0 -52 C 12 -36 19 -26 17 -15 C 15 -4 7 1 0 1 C -7 1 -15 -4 -17 -15 C -19 -26 -9 -34 0 -52 Z" fill={`url(#${u}-fl)`} {...ol} />
          <path d="M 0 -32 C 6 -24 9 -18 8 -12 C 7 -6 3 -4 0 -4 C -3 -4 -7 -6 -8 -12 C -9 -18 -4 -24 0 -32 Z" fill="#fffbe6" />
          <path d="M 0 -2 L 0 5" stroke={INK} strokeWidth={1.8} strokeLinecap="round" />
          <rect x={-15} y={4} width={30} height={34} rx={4} fill={`url(#${u}-pink)`} {...ol} />
          <path d="M -15 9 Q -15 18 -11 18 Q -7 18 -7 11 Q -6 15 -3 15 Q 1 15 1 10 Q 2 22 6 22 Q 10 22 10 12 Q 12 16 15 14 L 15 8 Q 0 2 -15 8 Z" fill="#ffe9f3" {...thin} />
          <ellipse cx={0} cy={6} rx={15} ry={3.6} fill="#fff4fa" {...thin} />
          <Shine d="M -9 20 L -9 32" w={2.6} />
          <path d="M 26 36 A 6 6 0 1 1 30 44" stroke={OUTLINE} strokeWidth={5} fill="none" strokeLinecap="round" />
          <path d="M 26 36 A 6 6 0 1 1 30 44" stroke="#f0c76e" strokeWidth={3} fill="none" strokeLinecap="round" />
          <ellipse cx={0} cy={42} rx={30} ry={7} fill={`url(#${u}-goldx)`} {...ol} />
          <path d="M -22 41 Q 0 45 22 41" stroke="#fff6d8" strokeWidth={1.4} fill="none" />
          <Spark x={-30} y={-36} s={0.9} />
          <Spark x={30} y={-28} s={0.7} c="#ffd9ec" />
        </g>
      );
    case "butterfly": {
      const wing = (
        <g>
          <path d="M -2 -4 C -8 -36 -46 -46 -47 -20 C -48 -4 -28 4 -2 2 Z" fill={`url(#${u}-bw1)`} {...ol} />
          <path d="M -2 2 C -26 4 -42 18 -34 33 C -26 44 -8 32 -2 8 Z" fill={`url(#${u}-bw2)`} {...ol} />
          <path d="M -4 -2 C -14 -14 -26 -22 -38 -24 M -4 0 C -16 -4 -28 -6 -40 -8 M -4 4 C -14 10 -22 18 -28 28" stroke="#fff" strokeWidth={1.1} fill="none" opacity={0.75} />
          <circle cx={-34} cy={-22} r={5} fill="#fff" opacity={0.8} {...thin} strokeWidth={0.9} />
          <circle cx={-24} cy={-30} r={2.6} fill="#f4d68e" />
          <circle cx={-20} cy={22} r={3.6} fill="#fff" opacity={0.75} />
          <circle cx={-27} cy={30} r={2} fill="#f4d68e" />
        </g>
      );
      return (
        <g>
          <defs>
            <RG id={`${u}-bw1`} cx={0.8} cy={0.7} r={0.9} stops={[[0, "#ffd0e8"], [0.55, "#d9b8ff"], [1, "#a98aef"]]} />
            <RG id={`${u}-bw2`} cx={0.8} cy={0.2} r={0.9} stops={[[0, "#ffd0e8"], [0.6, "#b8eef0"], [1, "#7fd3d6"]]} />
          </defs>
          <circle r={48} fill={`url(#${u}-vglow)`} />
          {wing}
          <g transform="scale(-1 1)">{wing}</g>
          <ellipse cx={0} cy={6} rx={4.6} ry={22} fill="#7e5aa6" {...ol} />
          <circle cx={0} cy={-19} r={6.4} fill="#7e5aa6" {...ol} />
          <path d="M -2 -24 Q -8 -40 -16 -42 M 2 -24 Q 8 -40 16 -42" stroke={OUTLINE} strokeWidth={1.6} fill="none" strokeLinecap="round" />
          <circle cx={-16} cy={-42} r={2.6} fill="#ff9fcb" {...thin} strokeWidth={1} />
          <circle cx={16} cy={-42} r={2.6} fill="#ff9fcb" {...thin} strokeWidth={1} />
          <path d="M -1.6 -6 L -1.6 20" stroke="#b996e0" strokeWidth={1.4} strokeLinecap="round" />
          <Spark x={40} y={36} s={0.8} />
        </g>
      );
    }
    case "cat":
      return (
        <g>
          <defs>
            <RG id={`${u}-cat`} cx={0.4} cy={0.3} r={0.8} stops={[[0, "#6a5683"], [0.6, "#45365a"], [1, "#2c2340"]]} />
            <LG id={`${u}-ceye`} stops={[[0, "#fff1a8"], [1, "#e9b44c"]]} />
          </defs>
          <circle cx={0} cy={0} r={46} fill={`url(#${u}-pglow)`} />
          <path d="M 18 40 C 44 38 50 14 40 2 C 36 -4 30 -2 33 3 C 40 12 36 30 18 32" stroke={OUTLINE} strokeWidth={10} fill="none" strokeLinecap="round" />
          <path d="M 18 40 C 44 38 50 14 40 2 C 36 -4 30 -2 33 3 C 40 12 36 30 18 32" stroke="#45365a" strokeWidth={6.6} fill="none" strokeLinecap="round" />
          <path d="M -26 46 C -30 22 -20 4 0 4 C 20 4 30 22 26 46 Q 0 50 -26 46 Z" fill={`url(#${u}-cat)`} {...ol} />
          <ellipse cx={-10} cy={45} rx={7} ry={4} fill="#5a4872" {...thin} />
          <ellipse cx={10} cy={45} rx={7} ry={4} fill="#5a4872" {...thin} />
          <path d="M -24 -24 L -22 -48 L -5 -34 Z M 24 -24 L 22 -48 L 5 -34 Z" fill="#45365a" {...ol} />
          <path d="M -20 -28 L -19.5 -41 L -11 -33 Z M 20 -28 L 19.5 -41 L 11 -33 Z" fill="#ff9fc4" />
          <ellipse cx={0} cy={-14} rx={27} ry={22} fill={`url(#${u}-cat)`} {...ol} />
          <path d="M -16 -30 Q -4 -36 10 -32" stroke="#8a77a6" strokeWidth={2} fill="none" strokeLinecap="round" opacity={0.8} />
          {[-10, 10].map((x) => (
            <g key={x}>
              <ellipse cx={x} cy={-14} rx={6} ry={7} fill={`url(#${u}-ceye)`} stroke={OUTLINE} strokeWidth={1.2} />
              <ellipse cx={x} cy={-13.5} rx={1.8} ry={5.4} fill={INK} />
              <circle cx={x - 2} cy={-17} r={1.6} fill="#fff" />
            </g>
          ))}
          <path d="M -2.4 -5 L 2.4 -5 L 0 -2.4 Z" fill="#ff9fc4" />
          <path d="M -4 -1 Q -2 1.6 0 -1 Q 2 1.6 4 -1" stroke="#c9b6e8" strokeWidth={1.1} fill="none" strokeLinecap="round" />
          <path d="M -12 -4 L -26 -6 M -12 -2 L -25 1 M 12 -4 L 26 -6 M 12 -2 L 25 1" stroke="#c9b6e8" strokeWidth={0.9} strokeLinecap="round" />
          <ellipse cx={-17} cy={-5} rx={3.6} ry={2} fill="#ff8fbf" opacity={0.5} />
          <ellipse cx={17} cy={-5} rx={3.6} ry={2} fill="#ff8fbf" opacity={0.5} />
          <path d="M -15 7 Q 0 13 15 7" stroke="#ff8fc8" strokeWidth={3.4} fill="none" strokeLinecap="round" />
          <path d="M0 -5 A5 5 0 1 0 4 3.5 A3.8 3.8 0 1 1 0 -5 Z" transform="translate(0 15)" fill={`url(#${u}-gold)`} {...thin} strokeWidth={1} />
          <Spark x={-38} y={-34} s={0.8} />
          <Spark x={40} y={-30} s={0.6} c="#ffd9ec" />
        </g>
      );
    case "crystal":
      return (
        <g>
          <defs>
            <RG id={`${u}-cb`} stops={[[0, "#ffffff"], [0.35, "#efe6ff"], [0.75, "#bba5f5"], [1, "#8f6bf0"]]} />
          </defs>
          <circle cx={0} cy={-6} r={48} fill={`url(#${u}-vglow)`} />
          <ellipse cx={0} cy={42} rx={30} ry={6} fill={`url(#${u}-goldx)`} {...ol} />
          <path d="M -24 40 L 24 40 L 17 24 L -17 24 Z" fill={`url(#${u}-goldx)`} {...ol} />
          <path d="M -14 24 Q -22 18 -20 10 M 14 24 Q 22 18 20 10 M 0 26 L 0 20" stroke={OUTLINE} strokeWidth={4.4} fill="none" strokeLinecap="round" />
          <path d="M -14 24 Q -22 18 -20 10 M 14 24 Q 22 18 20 10 M 0 26 L 0 20" stroke="#f0c76e" strokeWidth={2.4} fill="none" strokeLinecap="round" />
          <circle cx={0} cy={-8} r={31} fill={`url(#${u}-cb)`} {...ol} strokeWidth={2.4} />
          <path d="M -22 -2 C -12 -16 8 -2 22 -14" stroke="#fff" strokeWidth={2.6} fill="none" opacity={0.75} strokeLinecap="round" />
          <path d="M -20 8 C -6 -2 8 14 22 4" stroke="#9fe6dc" strokeWidth={2.4} fill="none" opacity={0.8} strokeLinecap="round" />
          <path d="M -12 16 C -2 10 6 20 14 14" stroke="#ffc2dc" strokeWidth={2} fill="none" opacity={0.8} strokeLinecap="round" />
          <path d={starD(6, -14, 7, 2.8)} fill="#fff" />
          <ellipse cx={-12} cy={-24} rx={9} ry={5} fill="#fff" opacity={0.9} transform="rotate(-32 -12 -24)" />
          <circle cx={14} cy={-26} r={1.6} fill="#fff" />
          <Spark x={38} y={-34} s={0.9} />
          <Spark x={-40} y={-30} s={0.6} c="#c9f2f0" />
        </g>
      );
    case "palm": {
      const leaves = [
        "M 0 0 C -12 -12 -30 -12 -42 0 C -28 -4 -14 -2 0 3 Z",
        "M 0 0 C 12 -12 30 -12 42 0 C 28 -4 14 -2 0 3 Z",
        "M 0 0 C -8 -18 -20 -26 -32 -26 C -20 -18 -10 -10 -1 3 Z",
        "M 0 0 C 8 -18 20 -26 32 -26 C 20 -18 10 -10 1 3 Z",
        "M 0 0 C -16 0 -28 8 -32 22 C -22 12 -12 6 0 4 Z",
        "M 0 0 C 16 0 28 8 32 22 C 22 12 12 6 0 4 Z",
      ];
      return (
        <g>
          <circle cx={-18} cy={22} r={22} fill="#ffe6b0" opacity={0.65} />
          <circle cx={-18} cy={22} r={15} fill="#ffd28f" opacity={0.75} />
          <path d="M -50 32 Q 0 26 50 32 L 50 46 Q 0 50 -50 46 Z" fill="#9fe6dc" {...thin} />
          <path d="M -40 38 Q -30 36 -20 38 M 18 40 Q 28 38 38 40" stroke="#fff" strokeWidth={1.4} fill="none" strokeLinecap="round" />
          <path d="M -32 38 Q -18 20 6 20 Q 30 20 40 38 Q 4 44 -32 38 Z" fill="#fbe2c2" {...ol} />
          <path d="M 4 24 C 0 6 6 -14 16 -30" stroke={OUTLINE} strokeWidth={9} fill="none" strokeLinecap="round" />
          <path d="M 4 24 C 0 6 6 -14 16 -30" stroke="#d6a676" strokeWidth={6} fill="none" strokeLinecap="round" />
          {[16, 6, -4, -14, -22].map((y, i) => (
            <path key={y} d={`M ${1 + i * 2.6} ${y} q 3 1.6 6 0`} stroke="#a7784e" strokeWidth={1} fill="none" />
          ))}
          <g transform="translate(16 -30) scale(1.15)">
            {leaves.map((d, i) => (
              <path key={i} d={d} fill={i % 2 ? "#4fbf8f" : "#7fd8a6"} {...thin} strokeWidth={1.2} />
            ))}
            <path d="M -36 -2 Q -18 -8 0 1 M 36 -2 Q 18 -8 0 1" stroke="#c3f2d8" strokeWidth={0.9} fill="none" />
          </g>
          <circle cx={12} cy={-26} r={4} fill="#a7784e" {...thin} />
          <circle cx={20} cy={-25} r={4} fill="#8d6340" {...thin} />
          <Frangipani x={-18} y={32} s={0.75} pink />
          <Frangipani x={28} y={30} s={0.6} />
          <Spark x={-36} y={-30} s={0.8} />
        </g>
      );
    }
    case "sun":
      return (
        <g>
          <defs>
            <RG id={`${u}-sun`} stops={[[0, "#fffbe0"], [0.55, "#ffe08a"], [1, "#f7b06a"]]} />
          </defs>
          <circle r={50} fill={`url(#${u}-glow)`} />
          {Array.from({ length: 12 }, (_, i) => {
            const long = i % 2 === 0;
            return (
              <path
                key={i}
                d={long ? "M -7 -27 Q -3 -46 0 -48 Q 3 -46 7 -27 Z" : "M -6 -27 Q -2 -39 0 -40 Q 2 -39 6 -27 Z"}
                fill={long ? "#ffd27a" : "#ffb8a0"}
                {...thin}
                transform={`rotate(${i * 30})`}
              />
            );
          })}
          <circle r={28} fill={`url(#${u}-sun)`} {...ol} strokeWidth={2.4} />
          <Shine d="M -18 -12 Q -12 -20 -2 -22" />
          <Face x={0} y={3} s={1.3} />
          <Spark x={40} y={38} s={0.7} />
        </g>
      );
    case "lantern":
      return (
        <g>
          <defs>
            <RG id={`${u}-lg`} cx={0.5} cy={0.55} r={0.65} stops={[[0, "#fffbe6"], [0.5, "#ffe3a8"], [1, "#ffb8c8"]]} />
          </defs>
          <circle cx={0} cy={4} r={46} fill={`url(#${u}-glow)`} />
          <path d="M 0 -52 L 0 -40" stroke="#c8923c" strokeWidth={2} />
          <circle cx={0} cy={-38} r={4.4} fill="none" stroke={OUTLINE} strokeWidth={3.6} />
          <circle cx={0} cy={-38} r={4.4} fill="none" stroke="#f0c76e" strokeWidth={2} />
          <path d="M -6 -34 L 6 -34 L 4 -30 L -4 -30 Z" fill={`url(#${u}-goldx)`} {...thin} />
          <rect x={-20} y={-20} width={40} height={46} rx={5} fill={`url(#${u}-lg)`} {...ol} />
          <rect x={-4.5} y={8} width={9} height={14} rx={2} fill="#ffaed4" {...thin} strokeWidth={1} />
          <path d="M 0 -8 C 5 -2 6 3 4 6 C 3 8 -3 8 -4 6 C -6 3 -5 -2 0 -8 Z" fill="#ffb347" stroke="#e68a3a" strokeWidth={0.8} />
          <path d="M 0 -2 C 2 1 2 4 0 5 C -2 4 -2 1 0 -2 Z" fill="#fff6c8" />
          {[-20, -7, 7, 20].map((x) => (
            <path key={x} d={`M ${x} -20 L ${x} 26`} stroke={OUTLINE} strokeWidth={x === -20 || x === 20 ? 0 : 4.4} />
          ))}
          {[-7, 7].map((x) => (
            <path key={`g${x}`} d={`M ${x} -20 L ${x} 26`} stroke="#f0c76e" strokeWidth={2.4} />
          ))}
          <path d="M -14 -14 L -14 18" stroke="#fff" strokeWidth={2} opacity={0.7} strokeLinecap="round" />
          <path d="M -17 -30 L 17 -30 L 26 -19 L -26 -19 Z" fill={`url(#${u}-goldx)`} {...ol} />
          <path d="M -26 25 L 26 25 L 18 34 L -18 34 Z" fill={`url(#${u}-goldx)`} {...ol} />
          <path d="M -4 35 L -5 46 M 0 35 L 0 48 M 4 35 L 5 46" stroke="#ff8fc8" strokeWidth={2} strokeLinecap="round" />
          <circle cx={0} cy={35} r={2.4} fill="#ff8fc8" {...thin} strokeWidth={0.8} />
          <Spark x={-36} y={-20} s={0.8} />
          <Spark x={34} y={-34} s={0.7} c="#ffd9ec" />
          <Spark x={36} y={32} s={0.5} />
        </g>
      );
    case "mushroom": {
      const mini = (x: number, y: number, s: number, cap: string, dark: string) => (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
          <path d="M -8 0 Q -9 14 -10 20 L 10 20 Q 9 14 8 0 Z" fill="#fff4fb" {...ol} />
          <path d="M -26 2 C -28 -20 -10 -30 0 -30 C 10 -30 28 -20 26 2 Q 0 8 -26 2 Z" fill={cap} {...ol} />
          <path d="M -26 2 Q 0 8 26 2 Q 0 14 -26 2 Z" fill={dark} {...thin} />
          <circle cx={-10} cy={-14} r={4} fill="#fff" opacity={0.85} />
          <circle cx={8} cy={-20} r={3} fill="#fff" opacity={0.85} />
        </g>
      );
      return (
        <g>
          <defs>
            <RG id={`${u}-mush`} stops={[[0, "#e9d9ff"], [0.55, "#b48cf0"], [1, "#8f6bf0"]]} />
          </defs>
          <circle cx={0} cy={-6} r={50} fill={`url(#${u}-vglow)`} />
          <path d="M -48 46 Q -42 28 -10 30 Q 22 26 48 40 L 48 48 L -48 48 Z" fill="#bfe8c8" {...ol} />
          <path d="M -36 34 l -2 -6 M -30 33 l 1 -6 M 30 34 l 2 -6 M 36 36 l -1 -6" stroke="#5fae7c" strokeWidth={1.4} strokeLinecap="round" />
          {mini(-34, 26, 0.48, "#ff9fcb", "#e870a8")}
          {mini(34, 24, 0.55, "#9fe6dc", "#5fc7c4")}
          <path d="M -12 2 Q -14 24 -16 34 L 12 34 Q 10 24 8 2 Z" fill="#fff4fb" {...ol} />
          <path d="M -40 4 C -42 -28 -16 -42 -2 -42 C 14 -42 38 -28 36 4 Q -2 12 -40 4 Z" fill={`url(#${u}-mush)`} {...ol} strokeWidth={2.4} />
          <path d="M -40 4 Q -2 12 36 4 Q -2 20 -40 4 Z" fill="#8f6bf0" {...thin} />
          {([[-22, -18, 6], [4, -30, 5], [20, -12, 5.4], [-4, -8, 3.4], [-30, -2, 3]] as [number, number, number][]).map(([x, y, r], i) => (
            <circle key={i} cx={x} cy={y} r={r} fill="#f6efff" opacity={0.95} />
          ))}
          <Shine d="M -30 -14 Q -24 -30 -8 -36" />
          <circle cx={-6} cy={20} r={1.4} fill={INK} />
          <circle cx={2} cy={20} r={1.4} fill={INK} />
          <path d="M -4 24 Q -2 26 0 24" stroke={INK} strokeWidth={1} fill="none" strokeLinecap="round" />
          {[[-26, -40, 2], [30, -36, 1.6], [40, -10, 2.2], [-44, -16, 1.4]].map(([x, y, r], i) => (
            <circle key={i} cx={x} cy={y} r={r} fill="#fff6c8" />
          ))}
          <Spark x={28} y={-44} s={0.6} />
        </g>
      );
    }
    case "compact":
      return (
        <g>
          <defs>
            <LG id={`${u}-cg`} x2={1} y2={1} stops={[[0, "#f0fbff"], [0.5, "#c7e6f8"], [1, "#e6d6ff"]]} />
          </defs>
          <circle cx={0} cy={0} r={48} fill={`url(#${u}-pglow)`} />
          <path d={lobedCircleD(0, -16, 32, 14, 4)} fill={`url(#${u}-pink)`} {...ol} strokeWidth={2.4} />
          <circle cx={0} cy={-16} r={27} fill={`url(#${u}-goldx)`} {...thin} />
          <circle cx={0} cy={-16} r={23} fill={`url(#${u}-cg)`} {...thin} />
          <path d="M -16 -6 L 6 -36 L 13 -33 L -10 -2 Z" fill="#fff" opacity={0.6} />
          <path d="M 0 2 L 14 -18 L 17 -14 L 4 4 Z" fill="#fff" opacity={0.4} />
          <rect x={-10} y={14} width={20} height={7} rx={2.4} fill={`url(#${u}-goldx)`} {...thin} />
          <path d="M -40 28 Q -40 46 0 47 Q 40 46 40 28 Z" fill={`url(#${u}-pink)`} {...ol} />
          <ellipse cx={0} cy={28} rx={40} ry={11} fill={`url(#${u}-goldx)`} {...ol} />
          <ellipse cx={0} cy={28} rx={34} ry={8.4} fill="#ffe3ef" {...thin} />
          <ellipse cx={-6} cy={28.5} rx={20} ry={5.6} fill="#ffb8d4" stroke="#f08fb6" strokeWidth={0.9} />
          <path d={HEART_D} transform="translate(-6 29) scale(0.8 0.5)" fill="#ff8fbf" />
          <ellipse cx={22} cy={27} rx={9} ry={4.4} fill="#fffaf6" stroke="#e7b6d6" strokeWidth={1} />
          <rect x={-5} y={44} width={10} height={5} rx={1.6} fill={`url(#${u}-goldx)`} {...thin} />
          <Spark x={-6} y={-24} s={0.8} />
          <Spark x={38} y={-38} s={0.8} c="#ffd9ec" />
          <Spark x={-40} y={6} s={0.6} />
        </g>
      );
    case "comet":
      return (
        <g>
          <defs>
            <linearGradient id={`${u}-ct1`} gradientUnits="userSpaceOnUse" x1={22} y1={-22} x2={-46} y2={44}>
              <stop offset={0} stopColor="#ff9fcb" />
              <stop offset={1} stopColor="#ff9fcb" stopOpacity={0.12} />
            </linearGradient>
            <linearGradient id={`${u}-ct2`} gradientUnits="userSpaceOnUse" x1={22} y1={-22} x2={-46} y2={44}>
              <stop offset={0} stopColor="#c9b6ff" />
              <stop offset={1} stopColor="#c9b6ff" stopOpacity={0.12} />
            </linearGradient>
            <linearGradient id={`${u}-ct3`} gradientUnits="userSpaceOnUse" x1={22} y1={-22} x2={-46} y2={44}>
              <stop offset={0} stopColor="#9fe6dc" />
              <stop offset={1} stopColor="#9fe6dc" stopOpacity={0.12} />
            </linearGradient>
          </defs>
          <path d="M 22 -22 C 4 -2 -18 18 -48 30" stroke={OUTLINE} strokeOpacity={0.25} strokeWidth={25} fill="none" strokeLinecap="round" />
          <path d="M 22 -22 C 4 -2 -18 18 -48 30" stroke="#fff" strokeOpacity={0.6} strokeWidth={22} fill="none" strokeLinecap="round" />
          <path d="M 22 -22 C 4 -2 -18 18 -48 30" stroke={`url(#${u}-ct2)`} strokeWidth={22} fill="none" strokeLinecap="round" />
          <path d="M 22 -22 C 6 -6 -12 22 -36 46" stroke={`url(#${u}-ct3)`} strokeWidth={13} fill="none" strokeLinecap="round" />
          <path d="M 22 -22 C 0 -10 -24 4 -50 10" stroke={`url(#${u}-ct1)`} strokeWidth={13} fill="none" strokeLinecap="round" />
          <path d="M 18 -14 C 2 0 -16 16 -38 26" stroke="#fff" strokeWidth={2.4} fill="none" strokeLinecap="round" opacity={0.85} strokeDasharray="10 7" />
          <circle cx={22} cy={-22} r={26} fill={`url(#${u}-glow)`} />
          <path d={starD(22, -22, 20, 9.4)} fill={`url(#${u}-goldx)`} stroke={OUTLINE} strokeWidth={2.2} strokeLinejoin="round" />
          <Face x={22} y={-19} s={0.72} />
          {[[-10, 18, 2.2], [-28, 8, 1.6], [-18, 34, 1.8], [2, 8, 1.4]].map(([x, y, r], i) => (
            <circle key={i} cx={x} cy={y} r={r} fill="#fff" />
          ))}
          <Spark x={-30} y={-34} s={0.8} />
          <Spark x={42} y={20} s={0.7} c="#ffd9ec" />
        </g>
      );
    case "rose":
      return (
        <g>
          <defs>
            <RG id={`${u}-rose`} cx={0.5} cy={0.3} r={0.8} stops={[[0, "#ffd6e8"], [0.6, "#ff8fbf"], [1, "#e85d9a"]]} />
          </defs>
          <circle cx={0} cy={-12} r={44} fill={`url(#${u}-pglow)`} />
          <path d="M 0 8 C 4 22 -4 36 0 50" stroke={OUTLINE} strokeWidth={6.4} fill="none" strokeLinecap="round" />
          <path d="M 0 8 C 4 22 -4 36 0 50" stroke="#6cc08a" strokeWidth={3.6} fill="none" strokeLinecap="round" />
          <path d="M 2 22 L 7 20 L 2.6 26 Z M -1.2 38 L -6 36 L -1.6 42 Z" fill="#6cc08a" stroke={OUTLINE} strokeWidth={0.8} strokeLinejoin="round" />
          <path d="M 1 30 C -12 20 -28 24 -34 34 C -22 40 -8 38 1 30 Z" fill="#7fd09a" {...ol} />
          <path d="M 1 30 C -12 28 -22 30 -30 34" stroke="#c3f2d8" strokeWidth={1} fill="none" />
          <path d="M 0 22 C 12 12 28 14 34 22 C 24 30 10 30 0 22 Z" fill="#7fd09a" {...ol} />
          <path d="M 0 22 C 12 20 22 20 30 22" stroke="#c3f2d8" strokeWidth={1} fill="none" />
          <path d={lobedCircleD(0, -18, 27, 7, 7)} fill={`url(#${u}-rose)`} {...ol} strokeWidth={2.4} />
          <path d={lobedCircleD(0, -19, 19, 5, 5)} fill="#ffa8cc" {...thin} transform="rotate(30 0 -19)" />
          <circle cx={0} cy={-19} r={12} fill="#ff9fc6" {...thin} />
          <path d="M 0 -19 C 5 -19 5 -14 0 -13.4 C -7 -13 -8 -22 -3 -25 C 4 -29 13 -23 11 -15 C 9 -7 -3 -5 -9 -9" stroke="#d64f8a" strokeWidth={2} fill="none" strokeLinecap="round" />
          <path d="M -28 -12 C -22 8 22 8 28 -12 C 18 -1 -18 -1 -28 -12 Z" fill="#ffc2dc" {...ol} />
          <path d="M -20 -4 C -10 2 10 2 20 -4" stroke="#fff" strokeWidth={1.4} fill="none" strokeLinecap="round" opacity={0.8} />
          <Shine d="M -28 -26 Q -24 -36 -16 -40" w={2.6} />
          <circle cx={24} cy={-2} r={1.8} fill="#e8f9ff" stroke="#9fd8ef" strokeWidth={0.6} />
          <Spark x={-38} y={-42} s={0.8} />
          <Spark x={36} y={-44} s={0.6} c="#ffd9ec" />
        </g>
      );
    case "eye":
      return (
        <g>
          <defs>
            <RG id={`${u}-iris`} cx={0.45} cy={0.4} r={0.65} stops={[[0, "#e9dcff"], [0.5, "#a98aef"], [1, "#6b46c8"]]} />
            <clipPath id={`${u}-ec`}>
              <path d="M -42 0 Q 0 -36 42 0 Q 0 36 -42 0 Z" />
            </clipPath>
          </defs>
          <circle r={48} fill={`url(#${u}-vglow)`} />
          {Array.from({ length: 16 }, (_, i) => {
            const a = (i / 16) * Math.PI * 2;
            const r1 = 34;
            const r2 = i % 2 ? 42 : 48;
            return <path key={i} d={`M ${f2(Math.cos(a) * r1 * 1.3)} ${f2(Math.sin(a) * r1)} L ${f2(Math.cos(a) * r2 * 1.06)} ${f2(Math.sin(a) * r2)}`} stroke="#e2b65e" strokeWidth={i % 2 ? 2 : 3} strokeLinecap="round" />;
          })}
          <path d="M -42 0 Q 0 -36 42 0 Q 0 36 -42 0 Z" fill="#fffaf6" {...ol} />
          <g clipPath={`url(#${u}-ec)`}>
            <circle cx={0} cy={0} r={17} fill={`url(#${u}-iris)`} stroke={OUTLINE} strokeWidth={1.4} />
            <circle cx={0} cy={0} r={7} fill={INK} />
            <path d={starD(0, 0, 4.6, 1.8)} fill="#c9b6ff" opacity={0.7} />
            <circle cx={-6} cy={-6} r={4} fill="#fff" />
            <circle cx={6} cy={6} r={2} fill="#fff" />
            <path d="M -42 0 Q 0 -30 42 0" stroke="#e7dcff" strokeWidth={6} fill="none" opacity={0.6} />
          </g>
          <path d="M -42 0 Q 0 -36 42 0" stroke={OUTLINE} strokeWidth={3.4} fill="none" strokeLinecap="round" />
          {[-28, -14, 0, 14, 28].map((x) => {
            const y = -18 * (1 - (x / 42) ** 2);
            return <path key={x} d={`M ${x} ${f2(y)} L ${f2(x * 1.25)} ${f2(y - 9)}`} stroke={OUTLINE} strokeWidth={2.4} strokeLinecap="round" />;
          })}
          <path d="M0 -5 A5 5 0 1 0 4 3.5 A3.8 3.8 0 1 1 0 -5 Z" transform="translate(0 38) scale(1.3)" fill={`url(#${u}-gold)`} {...thin} strokeWidth={0.9} />
          <path d="M 18 18 Q 21 24 18 27 Q 15 24 18 18 Z" fill="#bfe9ff" stroke="#6fb6d6" strokeWidth={0.9} />
          <Spark x={0} y={-40} s={0.8} />
        </g>
      );
    case "wave":
      return (
        <g>
          <defs>
            <LG id={`${u}-wv`} x2={0.6} y2={1} stops={[[0, "#c9f6f2"], [0.45, "#7fd3e0"], [1, "#8f9fe8"]]} />
          </defs>
          <path d="M -50 46 L -50 12 C -48 -18 -22 -42 8 -42 C 32 -42 48 -26 46 -8 C 44 6 30 10 22 2 C 16 -4 20 -14 28 -12 C 22 -24 2 -24 -8 -8 C -16 6 -8 30 12 34 L 50 30 L 50 46 Z" fill={`url(#${u}-wv)`} {...ol} strokeWidth={2.4} />
          <path d="M -44 0 C -38 -22 -16 -36 8 -36 C 26 -36 40 -26 40 -12" stroke="#fff" strokeWidth={3.6} fill="none" strokeLinecap="round" opacity={0.9} />
          {[[-40, -10, 4.4], [-30, -26, 4], [-14, -36, 4.6], [4, -40, 4], [22, -38, 3.6], [36, -30, 3.2]].map(([x, y, r], i) => (
            <circle key={i} cx={x} cy={y} r={r} fill="#fff" {...thin} strokeWidth={1} />
          ))}
          <path d="M -36 20 C -34 0 -20 -16 -4 -20 M -26 30 C -24 14 -16 4 -6 0" stroke="#e4fbf8" strokeWidth={1.6} fill="none" strokeLinecap="round" opacity={0.8} />
          <path d="M -50 32 Q -37 22 -25 32 Q -12 42 0 32 Q 12 22 25 32 Q 37 42 50 32 L 50 48 L -50 48 Z" fill="#9fe6dc" {...ol} />
          <path d="M -44 34 Q -37 29 -30 33 M 6 34 Q 13 29 20 33" stroke="#fff" strokeWidth={1.6} fill="none" strokeLinecap="round" />
          {[[34, -44, 2.4], [42, -40, 1.6], [40, -48, 1.4]].map(([x, y, r], i) => (
            <circle key={i} cx={x} cy={y} r={r} fill="#e4fbf8" stroke={OUTLINE} strokeWidth={0.7} />
          ))}
          <Spark x={-36} y={-40} s={0.8} />
        </g>
      );
    default:
      return (
        <g>
          <circle r={46} fill={`url(#${u}-glow)`} />
          <circle r={22} fill={`url(#${u}-pearl)`} {...ol} />
          <Spark x={30} y={-30} s={1} />
        </g>
      );
  }
}

/** Standalone symbol, for anything that wants a card symbol outside a card. viewBox -50..50. */
export function OracleSymbol({ symbol, size = 80, className }: { symbol: string; size?: number; className?: string }) {
  const u = safeId(useId());
  return (
    <svg viewBox="-55 -55 110 110" width={size} height={size} className={className} aria-hidden style={{ overflow: "visible" }}>
      <SymbolDefs u={u} />
      {symbolArt(symbol, u)}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Card faces                                                          */
/* ------------------------------------------------------------------ */

const SKY: Record<string, [string, string, string]> = {
  pearl: ["#ffe3f1", "#f1e4ff", "#fff6ea"],
  moon: ["#a99af0", "#d8c4fb", "#ffd6ea"],
  shell: ["#ffeedd", "#ffd8e6", "#ffc6dd"],
  tide: ["#d8f6f4", "#e4ddff", "#ffe1ef"],
  star: ["#8f80e2", "#c8b2f5", "#f6c9e8"],
  matcha: ["#e8f7da", "#fff0f6", "#ffd9ea"],
  crown: ["#fff1c4", "#ffe4ec", "#ffd1e8"],
  key: ["#e7dcff", "#f6eaff", "#fff1d6"],
  mirror: ["#d8f4ff", "#efe6ff", "#ffe0ef"],
  flame: ["#ffe3c9", "#ffd2df", "#ffb9d3"],
  butterfly: ["#d9fbf7", "#f1ecff", "#ffd9ec"],
  cat: ["#b9a6f5", "#dccdfb", "#ffe0ef"],
  crystal: ["#a993ee", "#c9c6f7", "#d8f4ff"],
  palm: ["#bdeee8", "#ffe7d2", "#ffc9b0"],
  sun: ["#fff6cf", "#ffe2bd", "#ffc9b6"],
  lantern: ["#8478d6", "#c3a6ea", "#f6c0de"],
  mushroom: ["#a58ce4", "#d2c2fb", "#e6f7ea"],
  compact: ["#ffd1e8", "#ffe8f3", "#fff6ea"],
  comet: ["#7470cf", "#ab9ae8", "#ecbfe9"],
  rose: ["#ffe6f0", "#ffd2e3", "#ffc2d8"],
  eye: ["#a58ae8", "#c9c2f5", "#cdf3f5"],
  wave: ["#bdeef3", "#d6e6ff", "#ece0ff"],
};

const DARK_SKY = new Set(["moon", "star", "cat", "crystal", "lantern", "mushroom", "comet", "eye"]);

const ROMAN = ["0", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX", "XXI"];

const SKY_STARS: [number, number, number][] = [
  [34, 66, 0.7],
  [164, 60, 0.9],
  [40, 196, 0.55],
  [166, 182, 0.65],
  [150, 96, 0.45],
  [52, 104, 0.4],
];

function CardFrame({ u, children }: { u: string; children?: ReactNode }) {
  return (
    <g>
      <rect x={2} y={2} width={196} height={296} rx={16} fill={`url(#${u}-fgold)`} stroke={OUTLINE} strokeWidth={2.4} />
      <rect x={5.5} y={5.5} width={189} height={289} rx={13} fill="none" stroke="#fff6d8" strokeWidth={1.4} opacity={0.85} />
      {children}
      <rect x={17} y={17} width={166} height={266} rx={7} fill="none" stroke="#f4d68e" strokeWidth={2.6} strokeDasharray="0.1 6" strokeLinecap="round" />
      {[[17, 17], [183, 17], [17, 283], [183, 283]].map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={5.4} fill={`url(#${u}-pearl)`} stroke={OUTLINE} strokeWidth={1.1} />
          <circle cx={x - 1.6} cy={y - 1.6} r={1.6} fill="#fff" />
        </g>
      ))}
    </g>
  );
}

function FrameDefs({ u }: { u: string }) {
  return (
    <>
      <LG id={`${u}-fgold`} x2={1} y2={1} stops={[[0, "#fff3cc"], [0.25, "#f2cf7e"], [0.5, "#fbe7b0"], [0.75, "#e2b65e"], [1, "#c8923c"]]} />
      <RG id={`${u}-pearl`} stops={[[0, "#ffffff"], [0.45, "#fff3f8"], [0.8, "#f0dcf5"], [1, "#d9e8f5"]]} />
    </>
  );
}

function CardFront({ symbol, name, index, u }: { symbol: string; name: string; index: number; u: string }) {
  const sky = SKY[symbol] ?? ["#ffe3f1", "#efe2ff", "#d9fbf7"];
  const dark = DARK_SKY.has(symbol);
  const long = name.length > 12;
  return (
    <svg viewBox="0 0 200 300" width="100%" height="100%" aria-hidden style={{ display: "block", overflow: "visible" }}>
      <defs>
        <FrameDefs u={u} />
        <LG id={`${u}-sky`} stops={[[0, sky[0]], [0.55, sky[1]], [1, sky[2]]]} />
        <LG id={`${u}-rib`} stops={[[0, "#ffd0e6"], [0.5, "#ff9fcb"], [1, "#f07fb6"]]} />
        <LG id={`${u}-ribd`} stops={[[0, "#f08fbf"], [1, "#d8649f"]]} />
        <path id={`${u}-tp`} d="M 30 258 Q 100 249 170 258" />
      </defs>
      <CardFrame u={u}>
        <rect x={12} y={12} width={176} height={276} rx={10} fill={`url(#${u}-sky)`} stroke={OUTLINE} strokeWidth={1.6} />
        <path d="M 26 232 L 26 92 A 74 66 0 0 1 174 92 L 174 232 Z" fill="#fff" opacity={dark ? 0.1 : 0.28} stroke="#fff" strokeWidth={1.6} strokeOpacity={0.85} />
        {SKY_STARS.map(([x, y, s], i) => (
          <path key={i} d={SPARKLE_D} transform={`translate(${x} ${y}) scale(${s})`} fill={i % 2 ? "#fff6d8" : "#fff"} opacity={0.95} />
        ))}
        {dark &&
          [[60, 50], [140, 44], [28, 140], [174, 132], [120, 214], [74, 222]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={1.1} fill="#fff" opacity={0.85} />)}
        <path d="M 14 236 Q 30 220 48 230 Q 60 216 78 228 Q 100 214 122 228 Q 140 216 152 230 Q 170 220 186 236 L 186 286 L 14 286 Z" fill="#fff" opacity={0.55} />
        <rect x={78} y={21} width={44} height={17} rx={8.5} fill={`url(#${u}-fgold)`} stroke={OUTLINE} strokeWidth={1.3} />
        <text x={100} y={33.6} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={11} fill={INK} letterSpacing={0.5}>
          {ROMAN[index] ?? ""}
        </text>
      </CardFrame>
      <g transform="translate(100 146) scale(1.36)">
        <SymbolDefs u={`${u}s`} />
        {symbolArt(symbol, `${u}s`)}
      </g>
      <g>
        <path d="M 30 248 L 6 252 L 14 261 L 6 272 L 32 268 Z" fill={`url(#${u}-ribd)`} stroke={OUTLINE} strokeWidth={1.6} strokeLinejoin="round" />
        <path d="M 170 248 L 194 252 L 186 261 L 194 272 L 168 268 Z" fill={`url(#${u}-ribd)`} stroke={OUTLINE} strokeWidth={1.6} strokeLinejoin="round" />
        <path d="M 22 244 Q 100 234 178 244 L 178 270 Q 100 260 22 270 Z" fill={`url(#${u}-rib)`} stroke={OUTLINE} strokeWidth={1.8} strokeLinejoin="round" />
        <path d="M 28 247.5 Q 100 238.5 172 247.5" stroke="#fff" strokeWidth={1.4} fill="none" opacity={0.75} />
        <text fontFamily={FONT} fontWeight={700} fontSize={long ? 13.5 : 15} fill="#5a2350" letterSpacing={0.2}>
          <textPath href={`#${u}-tp`} startOffset="50%" textAnchor="middle">
            {name}
          </textPath>
        </text>
      </g>
    </svg>
  );
}

function CardBack({ u }: { u: string }) {
  const shell = fanD(7, 11.5, 6.6, 5, 180, 360, 1.8).d;
  const shell2 = fanD(21, 23.5, 6.6, 5, 180, 360, 1.8).d;
  return (
    <svg viewBox="0 0 200 300" width="100%" height="100%" aria-hidden style={{ display: "block", overflow: "visible" }}>
      <defs>
        <FrameDefs u={u} />
        <LG id={`${u}-bk`} x2={1} y2={1} stops={[[0, "#ffe0ef"], [0.35, "#f3e2ff"], [0.65, "#dff6f6"], [1, "#fff0dc"]]} />
        <RG id={`${u}-sheen`} cx={0.35} cy={0.25} r={0.8} stops={[[0, "#ffffff", 0.75], [0.5, "#ffffff", 0.15], [1, "#ffffff", 0]]} />
        <RG id={`${u}-med`} cx={0.4} cy={0.35} r={0.75} stops={[[0, "#a79af0"], [0.6, "#7466c9"], [1, "#4f3f9e"]]} />
        <LG id={`${u}-cres`} stops={[[0, "#fff6d8"], [1, "#e9b85c"]]} />
        <pattern id={`${u}-pat`} width={28} height={24} patternUnits="userSpaceOnUse" x={2} y={4}>
          <path d={shell} fill="#fff" fillOpacity={0.55} stroke="#e4a8cf" strokeWidth={0.7} />
          <path d="M 7 11.5 L 7 5.4 M 7 11.5 L 3 6.4 M 7 11.5 L 11 6.4" stroke="#eab6d6" strokeWidth={0.5} />
          <path d={shell2} fill="#fff" fillOpacity={0.35} stroke="#c7b0ec" strokeWidth={0.7} />
          <path d="M 21 23.5 L 21 17.4 M 21 23.5 L 17 18.4 M 21 23.5 L 25 18.4" stroke="#cdb9ef" strokeWidth={0.5} />
        </pattern>
      </defs>
      <CardFrame u={u}>
        <rect x={12} y={12} width={176} height={276} rx={10} fill={`url(#${u}-bk)`} stroke={OUTLINE} strokeWidth={1.6} />
        <rect x={12} y={12} width={176} height={276} rx={10} fill={`url(#${u}-pat)`} />
        <rect x={12} y={12} width={176} height={276} rx={10} fill={`url(#${u}-sheen)`} />
      </CardFrame>
      <ellipse cx={100} cy={150} rx={58} ry={66} fill="#fff" opacity={0.35} />
      {Array.from({ length: 20 }, (_, i) => {
        const a = (i / 20) * Math.PI * 2;
        return <circle key={i} cx={f2(100 + Math.cos(a) * 44)} cy={f2(150 + Math.sin(a) * 44)} r={2.6} fill={`url(#${u}-pearl)`} stroke={OUTLINE} strokeWidth={0.7} />;
      })}
      <circle cx={100} cy={150} r={36} fill={`url(#${u}-fgold)`} stroke={OUTLINE} strokeWidth={2} />
      <circle cx={100} cy={150} r={30} fill={`url(#${u}-med)`} stroke={OUTLINE} strokeWidth={1.4} />
      <path d="M 104 128 A 22 22 0 1 0 122 160 A 17 17 0 1 1 104 128 Z" fill={`url(#${u}-cres)`} stroke={OUTLINE} strokeWidth={1.4} strokeLinejoin="round" />
      <path d={starD(116, 140, 4.6, 2)} fill="#fff6d8" />
      <path d={SPARKLE_D} transform="translate(86 166) scale(0.5)" fill="#fff" />
      <circle cx={112} cy={164} r={1.2} fill="#fff" />
      <ellipse cx={89} cy={136} rx={7} ry={3.4} fill="#fff" opacity={0.35} transform="rotate(-35 89 136)" />
      {[50, 250].map((y) => (
        <g key={y}>
          <path d={fanD(100, y + 7, 13, 7, 180, 360, 3).d} fill={`url(#${u}-fgold)`} stroke={OUTLINE} strokeWidth={1.3} strokeLinejoin="round" transform={y === 250 ? `rotate(180 100 ${y})` : undefined} />
          <circle cx={100} cy={y + (y === 250 ? -7 : 7)} r={2.4} fill={`url(#${u}-pearl)`} stroke={OUTLINE} strokeWidth={0.8} />
        </g>
      ))}
      {[[44, 100], [156, 100], [44, 200], [156, 200]].map(([x, y], i) => (
        <path key={i} d={SPARKLE_D} transform={`translate(${x} ${y}) scale(${i % 2 ? 0.8 : 1})`} fill="#fff" stroke="#e9c27a" strokeWidth={0.6} />
      ))}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* OracleCard                                                          */
/* ------------------------------------------------------------------ */

const CSS = `
.pco-card { position: relative; display: inline-block; flex: none; }
.pco-inner { position: absolute; inset: 0; transform-style: preserve-3d; -webkit-transform-style: preserve-3d; }
.pco-face { position: absolute; inset: 0; backface-visibility: hidden; -webkit-backface-visibility: hidden; filter: drop-shadow(0 3px 5px rgba(107,58,94,.22)); }
.pco-back { transform: rotateY(180deg); }
.pco-burst { position: absolute; left: 50%; top: 50%; width: 0; height: 0; pointer-events: none; }
.pco-p { position: absolute; left: 0; top: 0; opacity: 0; filter: drop-shadow(0 0 3px rgba(255,255,255,.95)) drop-shadow(0 1px 2px rgba(107,58,94,.35)); }
.pco-ring { position: absolute; border-radius: 50%; opacity: 0; background: radial-gradient(circle, rgba(255,250,230,.95) 0%, rgba(255,214,234,.6) 40%, rgba(255,214,234,0) 70%); }
@media (prefers-reduced-motion: no-preference) {
  .pco-inner { transition: transform .9s cubic-bezier(.3,1.25,.45,1); }
  .pco-pop-a { animation: pcoPopA .9s ease-out; }
  .pco-pop-b { animation: pcoPopB .9s ease-out; }
  .pco-p { animation: pcoFly 1.1s cubic-bezier(.2,.7,.3,1) .38s forwards; }
  .pco-ring { animation: pcoRing .9s ease-out .32s forwards; }
}
@keyframes pcoPopA { 0% { transform: scale(1); } 45% { transform: scale(1.07) translateY(-4%); } 100% { transform: scale(1); } }
@keyframes pcoPopB { 0% { transform: scale(1); } 45% { transform: scale(1.07) translateY(-4%); } 100% { transform: scale(1); } }
@keyframes pcoFly {
  0% { transform: translate(-50%, -50%) scale(0) rotate(0deg); opacity: 1; }
  35% { opacity: 1; }
  100% { transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(1) rotate(160deg); opacity: 0; }
}
@keyframes pcoRing { 0% { transform: translate(-50%, -50%) scale(.2); opacity: .95; } 100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; } }
`;

const BURST_COLORS = ["#ffffff", "#fff3c4", "#ffd2ea", "#d9fbf7", "#efe2ff", "#f4d68e"];

function Burst({ size }: { size: number }) {
  const n = 18;
  return (
    <div className="pco-burst" aria-hidden>
      <div className="pco-ring" style={{ width: size * 1.3, height: size * 1.3 }} />
      {Array.from({ length: n }, (_, i) => {
        const a = (i / n) * Math.PI * 2 + (i % 3) * 0.12;
        const dist = size * (i % 2 ? 0.62 : 0.86);
        const s = Math.max(10, size * (i % 3 === 0 ? 0.15 : 0.1));
        const style = { "--dx": `${f2(Math.cos(a) * dist)}px`, "--dy": `${f2(Math.sin(a) * dist * 1.25)}px`, width: s, height: s, animationDelay: `${0.36 + (i % 4) * 0.04}s` } as CSSProperties;
        return (
          <svg key={i} className="pco-p" viewBox="-10 -10 20 20" style={style}>
            {i % 4 === 3 ? <circle r={4.4} fill={BURST_COLORS[i % BURST_COLORS.length]} stroke="#d9a84a" strokeWidth={1.4} /> : <path d="M0 -10 Q 1.6 -1.6 10 0 Q 1.6 1.6 0 10 Q -1.6 1.6 -10 0 Q -1.6 -1.6 0 -10 Z" fill={BURST_COLORS[i % BURST_COLORS.length]} stroke="#d9a84a" strokeWidth={1.2} />}
          </svg>
        );
      })}
    </div>
  );
}

export function OracleCard({ cardId, size = 200, revealed = true, className }: { cardId: string; size?: number; revealed?: boolean; className?: string }) {
  const u = safeId(useId());
  const index = ORACLE_CARDS.findIndex((c) => c.id === cardId);
  const card = index >= 0 ? ORACLE_CARDS[index] : undefined;
  const name = card?.name ?? "The Oracle";
  const symbol = card?.symbol ?? "pearl";

  // Play the burst only on a false -> true change, never on first mount.
  const [prev, setPrev] = useState(revealed);
  const [burst, setBurst] = useState(0);
  if (prev !== revealed) {
    setPrev(revealed);
    if (revealed) setBurst((b) => b + 1);
  }

  return (
    <div
      className={["pco-card", className ?? ""].join(" ").trim()}
      style={{ width: size, height: size * 1.5 }}
      role="img"
      aria-label={revealed ? `${name} oracle card` : "Face-down oracle card"}
    >
      <style>{CSS}</style>
      <div className={burst > 0 ? (burst % 2 ? "pco-pop-a" : "pco-pop-b") : undefined} style={{ position: "absolute", inset: 0, perspective: size * 4 }}>
        <div className="pco-inner" style={{ transform: revealed ? "rotateY(0deg)" : "rotateY(180deg)" }}>
          <div className="pco-face">
            <CardFront symbol={symbol} name={name} index={Math.max(0, index)} u={`${u}f`} />
          </div>
          <div className="pco-face pco-back">
            <CardBack u={`${u}b`} />
          </div>
        </div>
      </div>
      {burst > 0 && <Burst key={`b${burst}`} size={size} />}
    </div>
  );
}
