"use client";

import { useId } from "react";
import { OUTLINE, safeId } from "./color";
import { HEART_D, SPARKLE_D, starD } from "./Witch";

const ol = { stroke: OUTLINE, strokeWidth: 2, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
const thin = { stroke: OUTLINE, strokeWidth: 1.2, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
const f2 = (n: number) => Math.round(n * 100) / 100;

function fanD(cx: number, cy: number, r: number, n: number, bump: number) {
  const pts: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const a = Math.PI + (Math.PI * i) / n;
    pts.push([f2(cx + r * Math.cos(a)), f2(cy + r * Math.sin(a))]);
  }
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const a = Math.PI + (Math.PI * (i - 0.5)) / n;
    d += ` Q ${f2(cx + (r + bump) * Math.cos(a))} ${f2(cy + (r + bump) * Math.sin(a))} ${pts[i][0]} ${pts[i][1]}`;
  }
  return { d: d + " Z", pts };
}

const CSS = `
.pcg-lid { transform-box: view-box; transform-origin: 16px 66px; }
.pcg-spill { opacity: 0; }
.pcg-open .pcg-lid { transform: translate(-4px, -16px) rotate(-17deg); }
.pcg-open .pcg-spill { opacity: 1; }
@media (prefers-reduced-motion: no-preference) {
  .pcg-lid { transition: transform .65s cubic-bezier(.34,1.5,.5,1); }
  .pcg-spill { transition: opacity .4s ease .15s; }
  .pcg-open .pcg-rise { animation: pcgRise 2.2s ease-out infinite; transform-box: fill-box; transform-origin: 50% 50%; }
  .pcg-open .pcg-beam { animation: pcgBeam 2.4s ease-in-out infinite; }
  .pcg-closed .pcg-wiggle { animation: pcgWiggle 3.6s ease-in-out infinite; transform-box: view-box; transform-origin: 60px 108px; }
}
@keyframes pcgRise { 0% { transform: translate(0, 18px) scale(.3); opacity: 0; } 20% { opacity: 1; } 100% { transform: translate(var(--gx, 0px), -26px) scale(1); opacity: 0; } }
@keyframes pcgBeam { 0%,100% { opacity: .7; } 50% { opacity: 1; } }
@keyframes pcgWiggle { 0%,80%,100% { transform: rotate(0deg); } 84% { transform: rotate(-3deg); } 88% { transform: rotate(3deg); } 92% { transform: rotate(-2deg); } 96% { transform: rotate(1deg); } }
`;

const SPILL: { x: number; y: number; kind: "spark" | "pearl" | "heart" | "star"; c: string; s: number; gx: number; d: number }[] = [
  { x: 44, y: 44, kind: "spark", c: "#fff", s: 1.5, gx: -10, d: 0 },
  { x: 60, y: 34, kind: "star", c: "#f4d68e", s: 1.4, gx: 2, d: 0.5 },
  { x: 76, y: 42, kind: "heart", c: "#ff9fcb", s: 1.5, gx: 10, d: 0.25 },
  { x: 52, y: 52, kind: "pearl", c: "#fff", s: 1.3, gx: -4, d: 0.9 },
  { x: 70, y: 54, kind: "spark", c: "#d9fbf7", s: 1.2, gx: 8, d: 1.2 },
  { x: 34, y: 54, kind: "pearl", c: "#fff", s: 0.8, gx: -14, d: 1.5 },
  { x: 86, y: 52, kind: "spark", c: "#ffd9ec", s: 0.9, gx: 14, d: 0.7 },
  { x: 60, y: 22, kind: "spark", c: "#fff6d8", s: 1.3, gx: 0, d: 1.7 },
  { x: 40, y: 30, kind: "heart", c: "#c9b6ff", s: 0.9, gx: -12, d: 1.0 },
  { x: 82, y: 30, kind: "star", c: "#ffd9ec", s: 0.8, gx: 12, d: 1.4 },
];

/** A pearly pink seashell gift box with a lavender satin bow. `open` lifts the lid and lets sparkles spill out. */
export function GiftBox({ open = false, size = 120, className }: { open?: boolean; size?: number; className?: string }) {
  const u = safeId(useId());
  const lid = fanD(60, 66, 44, 9, 7);
  const bodyD = "M 16 66 Q 18 106 60 108 Q 102 106 104 66 Z";
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={[open ? "pcg-open" : "pcg-closed", className ?? ""].join(" ").trim()}
      role="img"
      aria-label={open ? "Open seashell gift box" : "Wrapped seashell gift box"}
      style={{ overflow: "visible" }}
    >
      <style>{CSS}</style>
      <defs>
        <linearGradient id={`${u}-shell`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffe6f2" />
          <stop offset="0.45" stopColor="#ffbcdc" />
          <stop offset="0.8" stopColor="#f59ac8" />
          <stop offset="1" stopColor="#e7b9f0" />
        </linearGradient>
        <radialGradient id={`${u}-sheen`} cx="0.3" cy="0.25" r="0.7">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.15" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${u}-rib`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#b9a0f2" />
          <stop offset="0.35" stopColor="#e4d8ff" />
          <stop offset="0.6" stopColor="#c9b6ff" />
          <stop offset="1" stopColor="#9f86e0" />
        </linearGradient>
        <linearGradient id={`${u}-ribv`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e4d8ff" />
          <stop offset="1" stopColor="#ad94ec" />
        </linearGradient>
        <radialGradient id={`${u}-in`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fffbe6" />
          <stop offset="0.6" stopColor="#ffd2e6" />
          <stop offset="1" stopColor="#e070a8" />
        </radialGradient>
        <linearGradient id={`${u}-beam`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#fff6d8" stopOpacity="0.95" />
          <stop offset="1" stopColor="#ffd9ec" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`${u}-pearl`} cx="0.4" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.5" stopColor="#fff3f8" />
          <stop offset="1" stopColor="#dccff0" />
        </radialGradient>
        <clipPath id={`${u}-bc`}>
          <path d={bodyD} />
        </clipPath>
        <clipPath id={`${u}-lc`}>
          <path d={lid.d} />
        </clipPath>
      </defs>

      <ellipse cx={60} cy={110} rx={40} ry={5} fill={OUTLINE} opacity={0.14} />

      <g className="pcg-wiggle">
        {/* glow and spill, behind the lid */}
        <g className="pcg-spill" aria-hidden>
          <path d="M 22 66 L 6 6 L 114 6 L 98 66 Z" fill={`url(#${u}-beam)`} className="pcg-beam" />
          <ellipse cx={60} cy={60} rx={34} ry={14} fill="#fff6d8" opacity={0.7} />
          {SPILL.map((p, i) => (
            <g key={i} className="pcg-rise" style={{ animationDelay: `${p.d}s`, ["--gx" as string]: `${p.gx}px` }}>
              {p.kind === "spark" && <path d={SPARKLE_D} transform={`translate(${p.x} ${p.y}) scale(${p.s})`} fill={p.c} stroke="#e9c27a" strokeWidth={0.5} />}
              {p.kind === "star" && <path d={starD(p.x, p.y, 5 * p.s, 2.2 * p.s)} fill={p.c} {...thin} strokeWidth={0.9} />}
              {p.kind === "heart" && <path d={HEART_D} transform={`translate(${p.x} ${p.y}) scale(${p.s})`} fill={p.c} stroke={OUTLINE} strokeWidth={0.8} />}
              {p.kind === "pearl" && (
                <g>
                  <circle cx={p.x} cy={p.y} r={3.4 * p.s} fill={`url(#${u}-pearl)`} stroke={OUTLINE} strokeWidth={0.8} />
                  <circle cx={p.x - 1} cy={p.y - 1} r={1} fill="#fff" />
                </g>
              )}
            </g>
          ))}
        </g>

        {/* body: the lower half of the clam */}
        <ellipse cx={60} cy={66} rx={44} ry={8} fill={`url(#${u}-in)`} {...thin} />
        <path d={bodyD} fill={`url(#${u}-shell)`} {...ol} />
        <g clipPath={`url(#${u}-bc)`}>
          {[-36, -24, -12, 0, 12, 24, 36].map((x) => (
            <path key={x} d={`M ${60 + x * 0.18} 108 L ${60 + x} 66`} stroke="#e47aae" strokeWidth={1.1} opacity={0.6} />
          ))}
          <rect x={16} y={60} width={88} height={50} fill={`url(#${u}-sheen)`} />
          <path d="M 16 80 Q 60 90 104 80 L 104 91 Q 60 101 16 91 Z" fill={`url(#${u}-ribv)`} {...thin} />
          <rect x={53} y={60} width={14} height={50} fill={`url(#${u}-rib)`} {...thin} />
          <path d="M 57 66 L 57 106" stroke="#fff" strokeWidth={1.2} opacity={0.7} />
        </g>
        <path d={bodyD} fill="none" {...ol} />
        <path d="M 50 106 L 46 112 L 74 112 L 70 106" fill={`url(#${u}-shell)`} {...thin} />
        <circle cx={28} cy={86} r={2.2} fill={`url(#${u}-pearl)`} stroke={OUTLINE} strokeWidth={0.7} />
        <circle cx={92} cy={86} r={2.2} fill={`url(#${u}-pearl)`} stroke={OUTLINE} strokeWidth={0.7} />

        {/* lid: the scalloped top half, with the bow */}
        <g className="pcg-lid">
          <path d={lid.d} fill={`url(#${u}-shell)`} {...ol} />
          <g clipPath={`url(#${u}-lc)`}>
            {lid.pts.slice(1, -1).map(([x, y], i) => (
              <path key={i} d={`M 60 66 L ${x} ${y}`} stroke="#e47aae" strokeWidth={1.1} opacity={0.6} />
            ))}
            <rect x={14} y={16} width={92} height={52} fill={`url(#${u}-sheen)`} />
            <rect x={53} y={16} width={14} height={52} fill={`url(#${u}-rib)`} {...thin} />
            <path d="M 57 22 L 57 64" stroke="#fff" strokeWidth={1.2} opacity={0.7} />
          </g>
          <path d={lid.d} fill="none" {...ol} />
          <path d="M 14 66 Q 60 72 106 66" stroke={OUTLINE} strokeWidth={1.4} fill="none" />
          <path d="M 26 46 Q 34 32 48 28" stroke="#fff" strokeWidth={2.4} fill="none" strokeLinecap="round" opacity={0.75} />
          <g transform="translate(60 22)">
            <path d="M -2 2 L -12 18 L -7 17 L -5 22 L 1 5 Z M 2 2 L 12 18 L 7 17 L 5 22 L -1 5 Z" fill="#a98ce8" {...thin} />
            <path d="M 0 0 C -8 -14 -26 -14 -25 -1 C -26 11 -8 10 0 0 Z" fill={`url(#${u}-rib)`} {...ol} />
            <path d="M 0 0 C 8 -14 26 -14 25 -1 C 26 11 8 10 0 0 Z" fill={`url(#${u}-rib)`} {...ol} />
            <path d="M -4 -1 C -10 -6 -16 -5 -19 -1 M 4 -1 C 10 -6 16 -5 19 -1" stroke="#8a6fd6" strokeWidth={1} fill="none" />
            <path d="M -19 -6 Q -14 -9 -9 -6 M 19 -6 Q 14 -9 9 -6" stroke="#fff" strokeWidth={1.4} fill="none" strokeLinecap="round" opacity={0.85} />
            <ellipse rx={5} ry={5.4} fill="#d9caff" {...ol} />
            <circle cx={-1.4} cy={-1.6} r={1.4} fill="#fff" />
          </g>
          <path d={SPARKLE_D} transform="translate(92 34) scale(0.6)" fill="#fff" />
        </g>
      </g>
    </svg>
  );
}
