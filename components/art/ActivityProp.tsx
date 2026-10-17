"use client";

import { useId, type CSSProperties, type ReactNode } from "react";
import type { AnimationKey } from "@/lib/game/types";
import { OUTLINE, safeId } from "./color";
import { HEART_D, SPARKLE_D, starD } from "./Witch";

const ol = { stroke: OUTLINE, strokeWidth: 1.8, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
const thin = { stroke: OUTLINE, strokeWidth: 1.1, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

const CSS = `
@media (prefers-reduced-motion: no-preference) {
  .pcp-rise { animation: pcpRise 2.4s ease-out infinite; }
  .pcp-bob { animation: pcpBob 2s ease-in-out infinite; }
  .pcp-bounce { animation: pcpBounce 0.9s cubic-bezier(.3,0,.7,1) infinite; }
  .pcp-spin { animation: pcpSpin 6s linear infinite; transform-box: fill-box; transform-origin: 50% 50%; }
  .pcp-pulse { animation: pcpPulse 1.6s ease-in-out infinite; transform-box: fill-box; transform-origin: 50% 50%; }
  .pcp-ring { animation: pcpRing 2.4s ease-out infinite; transform-box: fill-box; transform-origin: 50% 50%; }
  .pcp-lift { animation: pcpLift 1.4s ease-in-out infinite; }
  .pcp-sway { animation: pcpSway 1.8s ease-in-out infinite; transform-box: fill-box; transform-origin: 50% 100%; }
  .pcp-clink-l { animation: pcpClinkL 1.6s ease-in-out infinite; transform-box: fill-box; transform-origin: 50% 100%; }
  .pcp-clink-r { animation: pcpClinkR 1.6s ease-in-out infinite; transform-box: fill-box; transform-origin: 50% 100%; }
  .pcp-blink { animation: pcpBlink 1.2s steps(2) infinite; }
  .pcp-dig { animation: pcpDig 1.2s ease-in-out infinite; transform-box: fill-box; transform-origin: 80% 90%; }
  .pcp-shoot { animation: pcpShoot 2.6s ease-in infinite; }
  .pcp-twinkle { animation: pcpPulse 1.4s ease-in-out infinite; transform-box: fill-box; transform-origin: 50% 50%; }
}
@keyframes pcpRise { 0% { transform: translateY(8px); opacity: 0; } 25% { opacity: 1; } 100% { transform: translateY(-18px); opacity: 0; } }
@keyframes pcpBob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
@keyframes pcpBounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-24px); } }
@keyframes pcpSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes pcpPulse { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(0.7); opacity: 0.6; } }
@keyframes pcpRing { 0% { transform: scale(0.4); opacity: 0.9; } 100% { transform: scale(1.5); opacity: 0; } }
@keyframes pcpLift { 0%,100% { transform: translateY(10px); } 50% { transform: translateY(-10px); } }
@keyframes pcpSway { 0%,100% { transform: rotate(-6deg); } 50% { transform: rotate(6deg); } }
@keyframes pcpClinkL { 0%,100% { transform: rotate(-4deg); } 50% { transform: rotate(10deg) translateX(3px); } }
@keyframes pcpClinkR { 0%,100% { transform: rotate(4deg); } 50% { transform: rotate(-10deg) translateX(-3px); } }
@keyframes pcpBlink { 0% { opacity: 1; } 50% { opacity: 0.2; } }
@keyframes pcpDig { 0%,100% { transform: rotate(0deg); } 50% { transform: rotate(-22deg); } }
@keyframes pcpShoot { 0% { transform: translate(-30px,-20px); opacity: 0; } 20% { opacity: 1; } 70%,100% { transform: translate(30px,20px); opacity: 0; } }
`;

const Spark = ({ x, y, s = 0.6, c = "#fff", cls }: { x: number; y: number; s?: number; c?: string; cls?: string }) => (
  <g className={cls}>
    <path d={SPARKLE_D} transform={`translate(${x} ${y}) scale(${s})`} fill={c} stroke={c === "#fff" ? "#e9c27a" : "none"} strokeWidth={0.5} />
  </g>
);
const delay = (s: number): CSSProperties => ({ animationDelay: `${s}s` });
const Note = ({ x, y, c = "#8f6bf0" }: { x: number; y: number; c?: string }) => (
  <g transform={`translate(${x} ${y})`}>
    <path d="M 3 -10 L 3 2" stroke={c} strokeWidth={1.8} />
    <path d="M 3 -10 Q 8 -8 9 -4" stroke={c} strokeWidth={1.8} fill="none" strokeLinecap="round" />
    <ellipse cx={0} cy={2} rx={3.4} ry={2.6} fill={c} transform="rotate(-20)" />
  </g>
);
const Bubble = ({ x, y, r }: { x: number; y: number; r: number }) => (
  <g>
    <circle cx={x} cy={y} r={r} fill="#e8fbff" fillOpacity={0.45} stroke="#7fc6e0" strokeWidth={1.1} />
    <circle cx={x - r * 0.35} cy={y - r * 0.35} r={r * 0.25} fill="#fff" />
  </g>
);

function art(a: AnimationKey, u: string): ReactNode {
  switch (a) {
    case "drink":
      return (
        <g>
          <defs>
            <linearGradient id={`${u}-m`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ffd3e6" />
              <stop offset="0.45" stopColor="#ff9fc4" />
              <stop offset="0.55" stopColor="#c7e8a4" />
              <stop offset="1" stopColor="#86c46c" />
            </linearGradient>
          </defs>
          <g className="pcp-bob">
            <path d="M 54 10 L 48 30" stroke={OUTLINE} strokeWidth={5} strokeLinecap="round" />
            <path d="M 54 10 L 48 30" stroke="#ff8fc8" strokeWidth={3} strokeLinecap="round" />
            <path d="M 30 30 L 70 30 L 64 88 Q 50 92 36 88 Z" fill={`url(#${u}-m)`} {...ol} />
            <rect x={36} y={38} width={9} height={8} rx={2} fill="#fff" opacity={0.7} transform="rotate(-12 40 42)" />
            <rect x={52} y={44} width={8} height={7} rx={2} fill="#fff" opacity={0.6} transform="rotate(14 56 48)" />
            <path d="M 42 64 Q 46 60 50 64 Q 46 70 42 64 Z M 52 70 Q 56 66 60 70 Q 56 76 52 70 Z" fill="#ff5c8a" stroke={OUTLINE} strokeWidth={0.6} />
            <path d="M 28 26 Q 50 22 72 26 L 72 31 Q 50 35 28 31 Z" fill="#fff4fb" {...ol} />
            <path d="M 34 36 L 38 84" stroke="#fff" strokeWidth={2.4} opacity={0.6} strokeLinecap="round" />
          </g>
          <Spark x={78} y={30} s={0.6} cls="pcp-twinkle" />
        </g>
      );
    case "eat":
      return (
        <g>
          {[38, 50, 62].map((x, i) => (
            <path key={x} className="pcp-rise" style={delay(i * 0.6)} d={`M ${x} 44 Q ${x - 5} 36 ${x} 28 Q ${x + 5} 20 ${x} 12`} stroke="#c9c6d6" strokeWidth={2.4} fill="none" strokeLinecap="round" />
          ))}
          <ellipse cx={50} cy={56} rx={34} ry={8} fill="#f6d39a" {...ol} />
          <path d="M 22 54 Q 50 50 78 54" stroke="#fff3cf" strokeWidth={1.4} fill="none" />
          <circle cx={40} cy={55} r={2.4} fill="#7cc795" />
          <circle cx={58} cy={54} r={2} fill="#ff9a7a" />
          <path d="M 16 56 Q 18 84 50 86 Q 82 84 84 56 Q 50 66 16 56 Z" fill="#ffc6dd" {...ol} />
          <path d="M 24 64 Q 28 78 42 82" stroke="#fff" strokeWidth={2.4} fill="none" opacity={0.6} strokeLinecap="round" />
          <path d={starD(66, 72, 4, 1.8)} fill="#fff" opacity={0.85} />
          <path d="M 76 30 L 92 72" stroke={OUTLINE} strokeWidth={4.4} strokeLinecap="round" />
          <path d="M 76 30 L 92 72" stroke="#e9c27a" strokeWidth={2.4} strokeLinecap="round" />
          <ellipse cx={74} cy={26} rx={5} ry={7} fill="#e9c27a" {...thin} transform="rotate(-22 74 26)" />
        </g>
      );
    case "sleep":
      return (
        <g>
          <path d="M 14 60 C 16 84 40 94 62 88 C 76 84 86 74 88 64 C 80 76 64 80 50 76 C 34 72 24 64 22 54 C 18 54 15 56 14 60 Z" fill="#e7dcff" {...ol} />
          <path d="M 24 68 C 32 78 46 84 62 82" stroke="#fff" strokeWidth={2.2} fill="none" opacity={0.75} strokeLinecap="round" />
          <path d="M 20 62 C 26 78 44 88 64 84 C 74 82 80 76 84 70" stroke="#b39ef0" strokeWidth={1.2} fill="none" strokeDasharray="2 2.4" />
          <path d={starD(60, 70, 4, 1.8)} fill="#f4d68e" stroke={OUTLINE} strokeWidth={0.8} />
          <g fill="none" stroke="#8f6bf0" strokeLinecap="round" strokeLinejoin="round">
            <path className="pcp-rise" d="M 30 40 h 10 l -10 11 h 10" strokeWidth={2.6} />
            <path className="pcp-rise" style={delay(0.8)} d="M 48 30 h 14 l -14 15 h 14" strokeWidth={3} />
            <path className="pcp-rise" style={delay(1.6)} d="M 68 20 h 8 l -8 9 h 8" strokeWidth={2.2} />
          </g>
        </g>
      );
    case "bathe":
      return (
        <g>
          {[[30, 70, 12, 0], [56, 60, 16, 0.5], [74, 78, 9, 1], [44, 42, 8, 1.4], [70, 34, 6, 1.9], [24, 46, 5, 0.9]].map(([x, y, r, d], i) => (
            <g key={i} className="pcp-rise" style={delay(d)}>
              <Bubble x={x} y={y} r={r} />
            </g>
          ))}
          <Spark x={84} y={52} s={0.6} c="#ff9fcb" cls="pcp-twinkle" />
        </g>
      );
    case "cuddle":
      return (
        <g>
          {[[50, 64, 2.6, 0], [28, 52, 1.5, 0.6], [74, 46, 1.8, 1.1], [44, 30, 1.2, 1.6]].map(([x, y, s, d], i) => (
            <g key={i} className="pcp-rise" style={delay(d)}>
              <path d={HEART_D} transform={`translate(${x} ${y}) scale(${s})`} fill={i % 2 ? "#ffb3d5" : "#ff6fa8"} stroke={OUTLINE} strokeWidth={0.7} />
              <circle cx={x - 1.6 * s} cy={y - 2.4 * s} r={0.9 * s} fill="#fff" opacity={0.85} />
            </g>
          ))}
        </g>
      );
    case "play":
      return (
        <g>
          <ellipse cx={50} cy={90} rx={14} ry={3} fill={OUTLINE} opacity={0.15} />
          <g className="pcp-bounce">
            <circle cx={50} cy={72} r={14} fill="#fff4fb" {...ol} />
            <path d="M 37 68 Q 50 76 63 68 M 50 58 Q 44 72 50 86" stroke="#ff9fcb" strokeWidth={3} fill="none" />
            <path d="M 40 64 Q 46 60 52 61" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" />
            <circle cx={58} cy={66} r={2} fill="#c9f2f0" />
          </g>
          <Spark x={26} y={40} s={0.6} c="#ff9fcb" cls="pcp-twinkle" />
          <Spark x={76} y={34} s={0.5} cls="pcp-twinkle" />
        </g>
      );
    case "dance":
      return (
        <g>
          <Spark x={24} y={26} s={1} cls="pcp-twinkle" />
          <g className="pcp-twinkle" style={delay(0.5)}>
            <path d={SPARKLE_D} transform="translate(76 22) scale(0.8)" fill="#ff9fcb" />
          </g>
          <g className="pcp-twinkle" style={delay(0.9)}>
            <path d={SPARKLE_D} transform="translate(60 52) scale(0.6)" fill="#9be8d8" />
          </g>
          <g className="pcp-rise">
            <Note x={36} y={70} />
          </g>
          <g className="pcp-rise" style={delay(1.1)}>
            <Note x={70} y={80} c="#ff6fa8" />
          </g>
          <circle cx={20} cy={60} r={1.6} fill="#f4d68e" className="pcp-blink" />
          <circle cx={86} cy={58} r={1.6} fill="#c9b0ff" className="pcp-blink" style={delay(0.6)} />
        </g>
      );
    case "spell":
      return (
        <g>
          <g className="pcp-spin">
            {Array.from({ length: 8 }, (_, i) => {
              const ang = (i / 8) * Math.PI * 2;
              return <path key={i} d={`M ${70 + Math.cos(ang) * 10} ${28 + Math.sin(ang) * 10} L ${70 + Math.cos(ang) * 20} ${28 + Math.sin(ang) * 20}`} stroke={i % 2 ? "#ff9fcb" : "#f4d68e"} strokeWidth={2.4} strokeLinecap="round" />;
            })}
          </g>
          <path d="M 24 86 L 64 36" stroke={OUTLINE} strokeWidth={6} strokeLinecap="round" />
          <path d="M 24 86 L 64 36" stroke="#c9b0ff" strokeWidth={3.6} strokeLinecap="round" />
          <path d="M 24 86 L 32 76" stroke="#ff9fcb" strokeWidth={3.6} strokeLinecap="round" />
          <g className="pcp-pulse">
            <path d={starD(70, 28, 12, 5)} fill="#f4d68e" {...ol} />
            <circle cx={67} cy={25} r={2} fill="#fff" />
          </g>
          <Spark x={40} y={30} s={0.6} cls="pcp-twinkle" />
          <Spark x={86} y={58} s={0.5} c="#ff9fcb" cls="pcp-twinkle" />
        </g>
      );
    case "swim":
    case "float":
      return (
        <g>
          {[0, 0.8, 1.6].map((d, i) => (
            <ellipse key={i} className="pcp-ring" style={delay(d)} cx={50} cy={78} rx={30} ry={8} fill="none" stroke="#5fd0c8" strokeWidth={2} />
          ))}
          <path d="M 10 78 q 10 -6 20 0 t 20 0 t 20 0 t 20 0" stroke="#7fe3e0" strokeWidth={3} fill="none" strokeLinecap="round" />
          {[[30, 56, 4, 0], [62, 46, 6, 0.6], [44, 30, 3, 1.2], [74, 24, 3.6, 1.8]].map(([x, y, r, d], i) => (
            <g key={i} className="pcp-rise" style={delay(d)}>
              <Bubble x={x} y={y} r={r} />
            </g>
          ))}
        </g>
      );
    case "pilates":
      return (
        <g>
          <rect x={10} y={66} width={80} height={10} rx={5} fill="#f7e8d4" {...ol} />
          <rect x={30} y={60} width={26} height={8} rx={3} fill="#ffb3d1" {...ol} />
          <path d="M 14 76 L 14 88 M 86 76 L 86 88" stroke="#c99a6a" strokeWidth={4} strokeLinecap="round" />
          <path d="M 82 66 L 82 40" stroke={OUTLINE} strokeWidth={4.6} strokeLinecap="round" />
          <path d="M 82 66 L 82 40" stroke="#e9c27a" strokeWidth={2.6} strokeLinecap="round" />
          <g className="pcp-bob">
            <path d="M 70 40 L 94 40" stroke={OUTLINE} strokeWidth={5} strokeLinecap="round" />
            <path d="M 70 40 L 94 40" stroke="#9fd8c8" strokeWidth={3} strokeLinecap="round" />
          </g>
          <path d="M 56 64 Q 68 56 82 50" stroke="#c9c6d6" strokeWidth={1.4} fill="none" strokeDasharray="2 2" />
          <Spark x={22} y={40} s={0.5} c="#ff9fcb" cls="pcp-twinkle" />
        </g>
      );
    case "yoga":
      return (
        <g>
          <circle cx={50} cy={54} r={30} fill="#fff1c4" opacity={0.6} className="pcp-pulse" />
          <path d="M 8 82 L 92 82 L 86 90 L 14 90 Z" fill="#c9b6ff" {...ol} />
          <path d="M 14 86 L 86 86" stroke="#fff" strokeWidth={1} opacity={0.6} />
          <g transform="translate(50 60)">
            {[-60, -30, 0, 30, 60].map((r, i) => (
              <path key={r} d="M 0 4 C -6 -2 -6 -12 0 -18 C 6 -12 6 -2 0 4 Z" fill={i % 2 ? "#ffc6dd" : "#ff9fcb"} {...thin} transform={`rotate(${r})`} />
            ))}
            <ellipse cx={0} cy={5} rx={12} ry={3} fill="#7cc795" {...thin} />
          </g>
          <Spark x={24} y={30} s={0.5} cls="pcp-twinkle" />
          <Spark x={78} y={26} s={0.5} cls="pcp-twinkle" />
        </g>
      );
    case "weights":
      return (
        <g>
          <g className="pcp-lift">
            <path d="M 30 50 L 70 50" stroke={OUTLINE} strokeWidth={5.6} strokeLinecap="round" />
            <path d="M 30 50 L 70 50" stroke="#e9e6f2" strokeWidth={3.4} strokeLinecap="round" />
            {[20, 80].map((x) => (
              <g key={x}>
                <rect x={x - 8} y={36} width={16} height={28} rx={6} fill={x < 50 ? "#ffb3d1" : "#9fe6dc"} {...ol} />
                <rect x={x - 5} y={39} width={4} height={18} rx={2} fill="#fff" opacity={0.55} />
              </g>
            ))}
          </g>
          <path d="M 40 82 q 2 -4 4 0 M 54 82 q 2 -4 4 0" stroke="#8fd0e8" strokeWidth={1.6} fill="none" className="pcp-blink" />
          <Spark x={88} y={24} s={0.5} c="#ff9fcb" cls="pcp-twinkle" />
        </g>
      );
    case "sound":
      return (
        <g>
          {[0, 0.8, 1.6].map((d) => (
            <ellipse key={d} className="pcp-ring" style={delay(d)} cx={50} cy={60} rx={38} ry={24} fill="none" stroke="#c9b0ff" strokeWidth={2} />
          ))}
          <path d="M 22 58 Q 24 86 50 88 Q 76 86 78 58 Z" fill="#f4f0fb" {...ol} />
          <ellipse cx={50} cy={58} rx={28} ry={7} fill="#e3dbf3" {...ol} />
          <ellipse cx={50} cy={58} rx={20} ry={4} fill="#d4c8ee" />
          <path d="M 28 66 Q 32 80 44 84" stroke="#fff" strokeWidth={2.4} fill="none" opacity={0.8} strokeLinecap="round" />
          <path d="M 70 30 L 86 52" stroke={OUTLINE} strokeWidth={5} strokeLinecap="round" />
          <path d="M 70 30 L 86 52" stroke="#e9c27a" strokeWidth={3} strokeLinecap="round" />
          <circle cx={68} cy={27} r={4} fill="#f2e6ff" {...thin} />
          <g className="pcp-rise">
            <Note x={30} y={38} />
          </g>
        </g>
      );
    case "stretch":
      return (
        <g fill="none" strokeLinecap="round">
          <g className="pcp-pulse">
            <path d="M 20 70 Q 20 26 50 18" stroke="#9fe6dc" strokeWidth={3.4} />
            <path d="M 80 70 Q 80 26 50 18" stroke="#ffb3d1" strokeWidth={3.4} />
          </g>
          <g className="pcp-pulse" style={delay(0.5)}>
            <path d="M 30 72 Q 30 38 50 30" stroke="#c9b0ff" strokeWidth={2.4} strokeDasharray="4 4" />
            <path d="M 70 72 Q 70 38 50 30" stroke="#c9b0ff" strokeWidth={2.4} strokeDasharray="4 4" />
          </g>
          <path d="M 16 26 l 6 -2 l -2 6 M 84 26 l -6 -2 l 2 6" stroke={OUTLINE} strokeWidth={2} strokeLinejoin="round" />
          <Spark x={50} y={10} s={0.6} cls="pcp-twinkle" />
        </g>
      );
    case "work":
      return (
        <g>
          <path d="M 22 40 Q 22 34 28 34 L 72 34 Q 78 34 78 40 L 78 70 L 22 70 Z" fill="#e9e6f2" {...ol} />
          <rect x={27} y={39} width={46} height={27} rx={2} fill="#ffe8f3" {...thin} />
          <path d="M 32 46 L 56 46 M 32 52 L 64 52 M 32 58 L 48 58" stroke="#c9b0ff" strokeWidth={2} strokeLinecap="round" />
          <rect x={49} y={56} width={2} height={5} fill="#8f6bf0" className="pcp-blink" />
          <path d="M 12 70 L 88 70 L 82 80 L 18 80 Z" fill="#d6d1e3" {...ol} />
          <path d="M 42 74 L 58 74" stroke={OUTLINE} strokeWidth={1.2} opacity={0.5} strokeLinecap="round" />
          <Spark x={80} y={28} s={0.7} c="#ff9fcb" cls="pcp-twinkle" />
          <Spark x={20} y={26} s={0.5} cls="pcp-twinkle" />
        </g>
      );
    case "dig":
      return (
        <g>
          <path d="M 10 88 Q 30 72 50 80 Q 70 70 90 88 Z" fill="#f7deb0" {...ol} />
          {[[40, 60, 0], [56, 54, 0.3], [48, 48, 0.6], [62, 64, 0.9]].map(([x, y, d], i) => (
            <circle key={i} className="pcp-rise" style={delay(d)} cx={x} cy={y} r={i % 2 ? 2 : 2.8} fill="#f2c98a" stroke={OUTLINE} strokeWidth={0.6} />
          ))}
          <g className="pcp-dig">
            <path d="M 76 20 L 58 66" stroke={OUTLINE} strokeWidth={5} strokeLinecap="round" />
            <path d="M 76 20 L 58 66" stroke="#c99a6a" strokeWidth={3} strokeLinecap="round" />
            <path d="M 70 16 L 82 22" stroke={OUTLINE} strokeWidth={5} strokeLinecap="round" />
            <path d="M 70 16 L 82 22" stroke="#ff9fcb" strokeWidth={3} strokeLinecap="round" />
            <path d="M 52 62 L 64 68 L 58 84 Q 50 86 46 78 Z" fill="#9fe6dc" {...ol} />
          </g>
          <Spark x={24} y={60} s={0.6} c="#f4d68e" cls="pcp-twinkle" />
        </g>
      );
    case "explore":
      return (
        <g>
          <g className="pcp-sway">
            <path d="M 22 92 C 14 72 28 60 20 42 C 14 30 24 20 20 8" stroke={OUTLINE} strokeWidth={6} fill="none" strokeLinecap="round" />
            <path d="M 22 92 C 14 72 28 60 20 42 C 14 30 24 20 20 8" stroke="#5fae7c" strokeWidth={3.8} fill="none" strokeLinecap="round" />
            {[[16, 30, -30], [24, 54, 30], [18, 74, -30]].map(([x, y, r], i) => (
              <ellipse key={i} cx={x} cy={y} rx={6} ry={2.8} fill="#7cc795" {...thin} transform={`rotate(${r} ${x} ${y})`} />
            ))}
          </g>
          <g className="pcp-bob">
            <circle cx={58} cy={44} r={16} fill="#e6f6ff" fillOpacity={0.7} stroke={OUTLINE} strokeWidth={2} />
            <circle cx={58} cy={44} r={16} fill="none" stroke="#e9c27a" strokeWidth={3.4} />
            <path d="M 50 36 Q 54 32 60 32" stroke="#fff" strokeWidth={2.4} fill="none" strokeLinecap="round" />
            <path d="M 70 56 L 84 72" stroke={OUTLINE} strokeWidth={7} strokeLinecap="round" />
            <path d="M 70 56 L 84 72" stroke="#ff9fcb" strokeWidth={4.6} strokeLinecap="round" />
            <path d={SPARKLE_D} transform="translate(58 46) scale(0.6)" fill="#c9b0ff" />
          </g>
        </g>
      );
    case "stargaze":
      return (
        <g>
          <g className="pcp-shoot">
            <path d="M 20 30 L 56 52" stroke="#f4d68e" strokeWidth={3} strokeLinecap="round" opacity={0.6} />
            <path d="M 30 36 L 56 52" stroke="#fff" strokeWidth={1.4} strokeLinecap="round" />
            <path d={starD(58, 53, 7, 3)} fill="#f4d68e" {...thin} />
          </g>
          <Spark x={80} y={20} s={0.6} cls="pcp-twinkle" />
          <g className="pcp-twinkle" style={delay(0.7)}>
            <path d={starD(24, 74, 4, 1.8)} fill="#c9b0ff" />
          </g>
          <Spark x={76} y={78} s={0.4} cls="pcp-twinkle" />
          <path d="M0 -8 A8 8 0 1 0 6 6 A6 6 0 1 1 0 -8 Z" transform="translate(80 46) scale(0.8)" fill="#fff4cf" stroke={OUTLINE} strokeWidth={1} />
        </g>
      );
    case "toast": {
      const coupe = (fill: string) => (
        <g>
          <path d="M -16 0 Q 0 18 16 0 Z" fill={fill} {...ol} />
          <path d="M -15 1 Q 0 4 15 1" stroke="#fff" strokeWidth={1.2} opacity={0.8} fill="none" />
          <path d="M 0 11 L 0 30" stroke={OUTLINE} strokeWidth={3.6} strokeLinecap="round" />
          <path d="M 0 11 L 0 30" stroke="#f4f0fb" strokeWidth={1.8} strokeLinecap="round" />
          <ellipse cx={0} cy={31} rx={9} ry={2.6} fill="#f4f0fb" {...thin} />
        </g>
      );
      return (
        <g>
          <g className="pcp-clink-l">
            <g transform="translate(34 50) rotate(14)">{coupe("#fbe2a6")}</g>
          </g>
          <g className="pcp-clink-r">
            <g transform="translate(66 50) rotate(-14)">{coupe("#ffd0e2")}</g>
          </g>
          {[[46, 34, 2, 0], [54, 28, 1.6, 0.4], [50, 22, 2.4, 0.9], [44, 18, 1.4, 1.3]].map(([x, y, r, d], i) => (
            <circle key={i} className="pcp-rise" style={delay(d)} cx={x} cy={y} r={r} fill="#fffbe9" stroke="#e9c27a" strokeWidth={0.7} />
          ))}
          <Spark x={50} y={40} s={0.8} cls="pcp-twinkle" />
        </g>
      );
    }
    case "gossip":
      return (
        <g>
          <g className="pcp-bob">
            <path d="M 14 18 Q 14 10 22 10 L 58 10 Q 66 10 66 18 L 66 36 Q 66 44 58 44 L 30 44 L 20 54 L 22 44 Q 14 44 14 36 Z" fill="#fff4fb" {...ol} />
            {[28, 40, 52].map((x, i) => (
              <circle key={x} cx={x} cy={27} r={3.2} fill="#ff9fcb" className="pcp-blink" style={delay(i * 0.25)} />
            ))}
          </g>
          <g className="pcp-bob" style={delay(0.7)}>
            <path d="M 40 58 Q 40 52 46 52 L 82 52 Q 88 52 88 58 L 88 74 Q 88 80 82 80 L 76 80 L 80 90 L 66 80 L 46 80 Q 40 80 40 74 Z" fill="#e7dcff" {...ol} />
            {[54, 64, 74].map((x, i) => (
              <circle key={x} cx={x} cy={66} r={2.6} fill="#8f6bf0" className="pcp-blink" style={delay(0.4 + i * 0.25)} />
            ))}
          </g>
        </g>
      );
    case "mushroom":
      return (
        <g>
          <circle cx={46} cy={56} r={34} fill="#d9c2ff" opacity={0.45} className="pcp-pulse" />
          <path d="M 40 60 Q 38 78 36 88 L 56 88 Q 54 78 52 60 Z" fill="#fff4fb" {...ol} />
          <path d="M 18 62 C 16 36 32 26 46 26 C 60 26 76 36 74 62 Q 46 70 18 62 Z" fill="#a77ef0" {...ol} />
          {[[32, 46, 5], [52, 38, 4], [62, 52, 3.4], [44, 54, 2.6]].map(([x, y, r], i) => (
            <circle key={i} cx={x} cy={y} r={r} fill="#f3e8ff" />
          ))}
          <path d="M 26 48 Q 30 38 40 32" stroke="#fff" strokeWidth={2.2} fill="none" opacity={0.7} strokeLinecap="round" />
          <circle cx={42} cy={74} r={1.3} fill={OUTLINE} />
          <circle cx={50} cy={74} r={1.3} fill={OUTLINE} />
          <path d="M 44 77.5 Q 46 79.5 48 77.5" stroke={OUTLINE} strokeWidth={0.9} fill="none" />
          <g className="pcp-rise">
            <Note x={78} y={42} c="#8f6bf0" />
          </g>
          <g className="pcp-rise" style={delay(1.2)}>
            <Note x={84} y={64} c="#ff6fa8" />
          </g>
          <Spark x={18} y={30} s={0.5} cls="pcp-twinkle" />
        </g>
      );
    default:
      return <Spark x={50} y={50} s={1.4} cls="pcp-twinkle" />;
  }
}

export function ActivityProp({ animation, size = 96 }: { animation: AnimationKey; size?: number }) {
  const u = safeId(useId());
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} role="img" aria-label={`${animation} prop`} style={{ overflow: "visible" }}>
      <style>{CSS}</style>
      {art(animation, u)}
    </svg>
  );
}
