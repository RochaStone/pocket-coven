"use client";

import { useId } from "react";
import { OUTLINE, safeId } from "./color";
import { SPARKLE_D } from "./Witch";

const NAMES = ["New moon", "Waxing crescent", "First quarter", "Waxing gibbous", "Full moon", "Waning gibbous", "Last quarter", "Waning crescent"];

const f2 = (n: number) => Math.round(n * 1000) / 1000;

const CSS = `
@media (prefers-reduced-motion: no-preference) {
  .pcm-tw { animation: pcmTw 2.6s ease-in-out infinite; transform-box: fill-box; transform-origin: 50% 50%; }
  .pcm-halo { animation: pcmHalo 4.2s ease-in-out infinite; }
}
@keyframes pcmTw { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(.55); opacity: .5; } }
@keyframes pcmHalo { 0%,100% { opacity: 1; } 50% { opacity: .75; } }
`;

const STARS: [number, number, number, string][] = [
  [12, 16, 1, "#fff"],
  [88, 14, 0.85, "#fff6d8"],
  [93, 64, 0.7, "#fff"],
  [8, 68, 0.75, "#ffd9ec"],
  [76, 92, 0.6, "#fff"],
  [26, 90, 0.55, "#d9fbf7"],
];

const CRATERS: [number, number, number][] = [
  [40, 38, 5.4],
  [60, 56, 4.2],
  [44, 64, 3.2],
  [64, 36, 2.6],
  [32, 54, 2.2],
  [70, 68, 2],
];

/**
 * A pearly moon drawn with the right lit fraction and side.
 * phase: 0 new, 0.25 first quarter (right half lit), 0.5 full, 0.75 last quarter (left half lit).
 */
export function MoonPhase({ phase, size = 120, className }: { phase: number; size?: number; className?: string }) {
  const u = safeId(useId());
  const p = Number.isFinite(phase) ? ((phase % 1) + 1) % 1 : 0;
  const k = Math.cos(2 * Math.PI * p); // 1 new, 0 quarter, -1 full
  const lit = (1 - k) / 2;
  const waxing = p <= 0.5;
  const gibbous = k < 0;
  const R = 30;
  const cx = 50;
  const cy = 50;
  const rx = f2(Math.abs(k) * R);
  // Limb: semicircle on the lit side. Terminator: half ellipse back to the top.
  const limbSweep = waxing ? 1 : 0;
  const termSweep = (gibbous ? 1 : 0) ^ (waxing ? 0 : 1);
  const litD = `M ${cx} ${cy - R} A ${R} ${R} 0 0 ${limbSweep} ${cx} ${cy + R} A ${rx} ${R} 0 0 ${termSweep} ${cx} ${cy - R} Z`;
  const name = NAMES[Math.round(p * 8) % 8];
  const haloOpacity = 0.25 + 0.75 * lit;

  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} role="img" aria-label={name} style={{ overflow: "visible" }}>
      <title>{name}</title>
      <style>{CSS}</style>
      <defs>
        <radialGradient id={`${u}-halo`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0.55" stopColor="#fff6ea" stopOpacity="0.95" />
          <stop offset="0.72" stopColor="#ffd9ef" stopOpacity="0.45" />
          <stop offset="1" stopColor="#d9c6ff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${u}-lit`} cx="0.38" cy="0.32" r="0.78">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.45" stopColor="#fff4f8" />
          <stop offset="0.78" stopColor="#f6dcf0" />
          <stop offset="1" stopColor="#d8e6f7" />
        </radialGradient>
        <radialGradient id={`${u}-dark`} cx="0.4" cy="0.35" r="0.8">
          <stop offset="0" stopColor="#8d86cf" />
          <stop offset="0.7" stopColor="#6c66b4" />
          <stop offset="1" stopColor="#57519c" />
        </radialGradient>
        <clipPath id={`${u}-clip`}>
          <path d={litD} />
        </clipPath>
      </defs>

      <circle cx={cx} cy={cy} r={48} fill={`url(#${u}-halo)`} opacity={haloOpacity} className="pcm-halo" />

      {/* unlit disc */}
      <circle cx={cx} cy={cy} r={R} fill={`url(#${u}-dark)`} />
      {CRATERS.map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill="#5a549f" opacity={0.6} />
      ))}
      <circle cx={cx} cy={cy} r={R - 1.6} fill="none" stroke="#b8b0f0" strokeWidth={1.2} opacity={0.45} />

      {/* lit part */}
      {lit > 0.002 && (
        <g clipPath={`url(#${u}-clip)`}>
          <circle cx={cx} cy={cy} r={R} fill={`url(#${u}-lit)`} />
          {CRATERS.map(([x, y, r], i) => (
            <g key={i}>
              <circle cx={x} cy={y} r={r} fill="#ecd2ea" opacity={0.75} />
              <circle cx={x + r * 0.2} cy={y + r * 0.2} r={r * 0.7} fill="#f8e6f3" opacity={0.8} />
            </g>
          ))}
          <path d={litD} fill="none" stroke="#fff" strokeWidth={2.4} opacity={0.35} />
          <ellipse cx={39} cy={34} rx={7} ry={3.6} fill="#fff" opacity={0.85} transform="rotate(-35 39 34)" />
        </g>
      )}

      <circle cx={cx} cy={cy} r={R} fill="none" stroke={OUTLINE} strokeWidth={1.8} />

      {STARS.map(([x, y, s, c], i) => (
        <g key={i} transform={`translate(${x} ${y}) scale(${s})`}>
          <path d={SPARKLE_D} fill={c} stroke="#e9c27a" strokeWidth={0.5} className="pcm-tw" style={{ animationDelay: `${(i * 0.37) % 2}s` }} />
        </g>
      ))}
    </svg>
  );
}
