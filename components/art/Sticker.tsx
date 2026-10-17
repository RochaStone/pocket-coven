"use client";

import { useId, type ReactNode } from "react";
import type { Sticker as StickerId } from "@/lib/game/types";
import { INK, OUTLINE, safeId } from "./color";
import { HEART_D, SPARKLE_D, starD } from "./Witch";

const ol = { stroke: OUTLINE, strokeWidth: 2.2, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
const thin = { stroke: OUTLINE, strokeWidth: 1.3, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
const Spark = ({ x, y, s = 0.8, c = "#fff" }: { x: number; y: number; s?: number; c?: string }) => <path d={SPARKLE_D} transform={`translate(${x} ${y}) scale(${s})`} fill={c} stroke={c === "#fff" ? "#e9c27a" : OUTLINE} strokeWidth={0.6} />;

function Face({ x, y, s = 1, mood = "happy" }: { x: number; y: number; s?: number; mood?: "happy" | "kiss" | "gasp" }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {mood === "kiss" ? (
        <path d="M -9 -1 Q -6 2 -3 -1 M 3 -1 Q 6 2 9 -1" stroke={INK} strokeWidth={1.8} fill="none" strokeLinecap="round" />
      ) : (
        [-6, 6].map((ex) => (
          <g key={ex}>
            <ellipse cx={ex} cy={-1} rx={mood === "gasp" ? 3.4 : 2.6} ry={mood === "gasp" ? 4.4 : 3.4} fill={INK} />
            <circle cx={ex - 1} cy={-2.4} r={1.2} fill="#fff" />
            <circle cx={ex + 1} cy={0.6} r={0.6} fill="#fff" />
          </g>
        ))
      )}
      {mood === "happy" && <path d="M -2.4 4 Q 0 6.6 2.4 4" stroke={INK} strokeWidth={1.6} fill="none" strokeLinecap="round" />}
      {mood === "kiss" && <path d="M 0 3 Q 3 3.5 1.4 5.2 Q 3.4 6.6 0.4 7.6" stroke={INK} strokeWidth={1.4} fill="none" strokeLinecap="round" />}
      {mood === "gasp" && <ellipse cx={0} cy={7} rx={3} ry={4} fill="#a8305e" stroke={INK} strokeWidth={1.2} />}
      <ellipse cx={-10} cy={4} rx={3.4} ry={2} fill="#ff6f9f" opacity={0.55} />
      <ellipse cx={10} cy={4} rx={3.4} ry={2} fill="#ff6f9f" opacity={0.55} />
    </g>
  );
}

function art(id: StickerId, u: string): { cut: ReactNode; body: ReactNode } {
  switch (id) {
    case "heart_shell":
      return {
        cut: <path d={HEART_D} transform="translate(60 64) scale(8.6)" vectorEffect="non-scaling-stroke" />,
        body: (
          <g>
            <defs>
              <linearGradient id={`${u}-hs`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#ffd6ea" />
                <stop offset="0.6" stopColor="#ff9fcb" />
                <stop offset="1" stopColor="#f070ab" />
              </linearGradient>
            </defs>
            <path d={HEART_D} transform="translate(60 64) scale(7.6)" fill={`url(#${u}-hs)`} stroke={OUTLINE} strokeWidth={0.28} />
            {[-28, -14, 0, 14, 28].map((x) => (
              <path key={x} d={`M 60 90 Q ${60 + x * 0.6} 60 ${60 + x} ${30 + Math.abs(x) * 0.3}`} stroke="#e46aa6" strokeWidth={1.4} fill="none" opacity={0.7} />
            ))}
            <path d="M 32 40 Q 36 28 48 26" stroke="#fff" strokeWidth={3.4} fill="none" strokeLinecap="round" opacity={0.75} />
            <circle cx={60} cy={84} r={7} fill="#fffaf6" {...thin} />
            <circle cx={58} cy={82} r={2.2} fill="#fff" />
            <Spark x={94} y={26} s={1.1} />
            <Spark x={22} y={86} s={0.7} c="#c9f2f0" />
          </g>
        ),
      };
    case "sparkle":
      return {
        cut: <path d={SPARKLE_D} transform="translate(60 60) scale(9.6)" vectorEffect="non-scaling-stroke" />,
        body: (
          <g>
            <defs>
              <radialGradient id={`${u}-sp`} cx="0.45" cy="0.4" r="0.6">
                <stop offset="0" stopColor="#fffbe9" />
                <stop offset="0.6" stopColor="#f7dc8f" />
                <stop offset="1" stopColor="#e9b84f" />
              </radialGradient>
            </defs>
            <path d={SPARKLE_D} transform="translate(60 60) scale(8.6)" fill={`url(#${u}-sp)`} stroke={OUTLINE} strokeWidth={0.26} />
            <Face x={60} y={60} s={1.3} />
            <Spark x={92} y={26} s={1.2} c="#ff9fcb" />
            <Spark x={28} y={92} s={0.9} c="#9be8d8" />
            <Spark x={30} y={30} s={0.6} />
          </g>
        ),
      };
    case "moon_kiss":
      return {
        cut: <circle cx={60} cy={60} r={48} />,
        body: (
          <g>
            <circle cx={60} cy={60} r={44} fill="#3a3f8f" {...ol} />
            <circle cx={60} cy={60} r={44} fill="none" stroke="#5a62c8" strokeWidth={3} opacity={0.5} />
            <path d="M 58 22 A 36 36 0 1 0 92 76 A 30 30 0 1 1 58 22 Z" fill="#fff1c4" {...ol} />
            <path d="M 40 40 Q 36 52 40 64" stroke="#fff" strokeWidth={3} fill="none" strokeLinecap="round" opacity={0.7} />
            <Face x={52} y={66} s={1.1} mood="kiss" />
            <g transform="translate(86 42)">
              <path d={HEART_D} transform="scale(1.8)" fill="#ff6fa8" {...thin} />
            </g>
            <path d={HEART_D} transform="translate(96 26) scale(1)" fill="#ffb3d5" />
            <path d={starD(84, 94, 4, 1.8)} fill="#fff" />
            <path d={starD(26, 30, 3, 1.3)} fill="#f4d68e" />
          </g>
        ),
      };
    case "matcha_cheers": {
      const cup = (x: number, r: number) => (
        <g transform={`translate(${x} 62) rotate(${r})`}>
          <path d="M 4 -34 L -1 -18" stroke={OUTLINE} strokeWidth={4.6} strokeLinecap="round" />
          <path d="M 4 -34 L -1 -18" stroke="#ff8fc8" strokeWidth={2.6} strokeLinecap="round" />
          <path d="M -15 -18 L 15 -18 L 11 24 Q 0 27 -11 24 Z" fill={`url(#${u}-mc)`} {...ol} />
          <path d="M -17 -21 Q 0 -24 17 -21 L 17 -16 Q 0 -13 -17 -16 Z" fill="#fff4fb" {...thin} />
          <path d="M -10 -10 L -7 20" stroke="#fff" strokeWidth={2.2} opacity={0.6} strokeLinecap="round" />
          <Face x={1} y={6} s={0.7} />
        </g>
      );
      return {
        cut: <rect x={10} y={14} width={100} height={96} rx={36} />,
        body: (
          <g>
            <defs>
              <linearGradient id={`${u}-mc`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#ffd3e6" />
                <stop offset="0.45" stopColor="#ff9fc4" />
                <stop offset="0.55" stopColor="#c7e8a4" />
                <stop offset="1" stopColor="#86c46c" />
              </linearGradient>
            </defs>
            {cup(40, 12)}
            {cup(80, -12)}
            <Spark x={60} y={28} s={1.1} />
            <text x={60} y={104} textAnchor="middle" fontFamily="var(--font-display), ui-rounded, system-ui, sans-serif" fontWeight={700} fontSize={15} fill="#ff6fa8" stroke="#fff" strokeWidth={3} paintOrder="stroke">
              cheers!
            </text>
          </g>
        ),
      };
    }
    case "dramatic_gasp":
      return {
        cut: <circle cx={60} cy={62} r={46} />,
        body: (
          <g>
            <defs>
              <radialGradient id={`${u}-dg`} cx="0.4" cy="0.35" r="0.7">
                <stop offset="0" stopColor="#ffffff" />
                <stop offset="0.6" stopColor="#ffe3f1" />
                <stop offset="1" stopColor="#f2c6e6" />
              </radialGradient>
            </defs>
            <circle cx={60} cy={64} r={38} fill={`url(#${u}-dg)`} {...ol} />
            <Face x={60} y={62} s={1.8} mood="gasp" />
            <path d="M 34 44 Q 40 36 50 34" stroke="#fff" strokeWidth={3.4} fill="none" strokeLinecap="round" />
            <path d="M 92 44 Q 88 52 92 56 Q 96 52 92 44 Z" fill="#bfe9ff" stroke="#6fb6d6" strokeWidth={1.2} />
            <g stroke="#ef4f74" strokeWidth={3.4} strokeLinecap="round">
              <path d="M 20 22 L 24 38" />
              <path d="M 30 18 L 32 36" />
            </g>
            <circle cx={25} cy={44} r={2} fill="#ef4f74" />
            <circle cx={33} cy={42} r={2} fill="#ef4f74" />
            <path d="M 86 22 l 6 -6 M 94 30 l 8 -2 M 82 16 l 0 -8" stroke="#f4b23e" strokeWidth={2.6} strokeLinecap="round" />
          </g>
        ),
      };
    case "pearl_rain":
      return {
        cut: <path d="M 14 54 C 10 34 30 20 46 28 C 52 12 80 10 88 30 C 104 28 114 46 104 60 L 104 104 L 16 104 Z" />,
        body: (
          <g>
            {[[30, 72, 5], [50, 86, 6], [72, 74, 5], [90, 90, 4.4], [40, 98, 4], [64, 100, 4.6], [22, 92, 3.6]].map(([x, y, r], i) => (
              <g key={i}>
                <circle cx={x} cy={y} r={r} fill={i % 3 === 1 ? "#ffe3f1" : "#fffaf6"} {...thin} />
                <circle cx={x - r * 0.35} cy={y - r * 0.35} r={r * 0.3} fill="#fff" />
              </g>
            ))}
            <path d="M 22 60 C 14 46 28 32 44 38 C 48 22 76 20 82 38 C 98 34 106 50 98 60 Q 60 68 22 60 Z" fill="#e7dcff" {...ol} />
            <path d="M 32 44 Q 38 36 48 38" stroke="#fff" strokeWidth={3} fill="none" strokeLinecap="round" />
            <Face x={62} y={50} s={1} />
            <Spark x={104} y={70} s={0.7} c="#ff9fcb" />
          </g>
        ),
      };
    default:
      return { cut: <circle cx={60} cy={60} r={40} />, body: <circle cx={60} cy={60} r={30} fill="#fffaf6" {...ol} /> };
  }
}

export function Sticker({ sticker, size = 96 }: { sticker: StickerId; size?: number }) {
  const u = safeId(useId());
  const a = art(sticker, u);
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} role="img" aria-label={`${sticker.replace(/_/g, " ")} sticker`} style={{ overflow: "visible" }}>
      <defs>
        <filter id={`${u}-sh`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#6b3a5e" floodOpacity="0.25" />
        </filter>
      </defs>
      <g filter={`url(#${u}-sh)`} fill="#fff" stroke="#fff" strokeWidth={8} strokeLinejoin="round">
        {a.cut}
      </g>
      {a.body}
    </svg>
  );
}
