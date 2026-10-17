"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import { ACTIVITIES } from "@/lib/game/catalog";
import { ArtKeyframes, Frangipani, Glint, PLUM, Palm, Pearl, rng, star5Path, starPath, useArtId } from "./Sparkles";

/* =================================================================== */
/* Shared object defs                                                   */
/* =================================================================== */

function ObjDefs({ p }: { p: string }) {
  return (
    <defs>
      <linearGradient id={`${p}gold`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fff3c9" />
        <stop offset="0.5" stopColor="#e7bf73" />
        <stop offset="1" stopColor="#b98a3a" />
      </linearGradient>
      <linearGradient id={`${p}pearl`} x1="0" x2="1">
        <stop offset="0" stopColor="#f3cfe6" />
        <stop offset="0.45" stopColor="#fffafd" />
        <stop offset="1" stopColor="#e3d3fb" />
      </linearGradient>
      <linearGradient id={`${p}pink`} x1="0" x2="1">
        <stop offset="0" stopColor="#f39ac6" />
        <stop offset="0.5" stopColor="#ffe8f3" />
        <stop offset="1" stopColor="#ef94c2" />
      </linearGradient>
      <radialGradient id={`${p}aqua`} cx="0.45" cy="0.35" r="0.75">
        <stop offset="0" stopColor="#d9fbf7" />
        <stop offset="0.55" stopColor="#6fe0d6" />
        <stop offset="1" stopColor="#22b8b0" />
      </radialGradient>
      <linearGradient id={`${p}glass`} x1="0" x2="1">
        <stop offset="0" stopColor="#ffffff" stopOpacity="0.9" />
        <stop offset="0.5" stopColor="#eaf6ff" stopOpacity="0.5" />
        <stop offset="1" stopColor="#ffffff" stopOpacity="0.85" />
      </linearGradient>
      <linearGradient id={`${p}wood`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#ecc08d" />
        <stop offset="1" stopColor="#b9804a" />
      </linearGradient>
      <linearGradient id={`${p}lilac`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#f3eaff" />
        <stop offset="1" stopColor="#b99cf5" />
      </linearGradient>
      <linearGradient id={`${p}mint`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#c9f5df" />
        <stop offset="1" stopColor="#5cc79a" />
      </linearGradient>
      <radialGradient id={`${p}shadow`} cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#6b3a5e" stopOpacity="0.35" />
        <stop offset="1" stopColor="#6b3a5e" stopOpacity="0" />
      </radialGradient>
      <radialGradient id={`${p}glow`} cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#fff" stopOpacity="0.95" />
        <stop offset="0.5" stopColor="#ffe3f4" stopOpacity="0.5" />
        <stop offset="1" stopColor="#ffe3f4" stopOpacity="0" />
      </radialGradient>
    </defs>
  );
}

const O = { sw: 1.5 }; // object outline width
const sh = (p: string, cx = 50, cy = 88, rx = 34, ry = 6) => <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={`url(#${p}shadow)`} />;

/* ---------------- palace ---------------- */

const oysterBed = (p: string) => (
  <g>
    {sh(p, 50, 86, 46, 7)}
    <path d="M14 60Q12 22 50 16Q88 22 86 60Z" fill={`url(#${p}pink)`} stroke={PLUM} strokeWidth={O.sw} />
    {[22, 31, 40, 50, 60, 69, 78].map((x) => (
      <line key={x} x1="50" y1="58" x2={x} y2={24 + Math.abs(50 - x) * 0.25} stroke={PLUM} strokeOpacity="0.22" strokeWidth="1.2" />
    ))}
    <path d="M18 56Q50 46 82 56" fill="none" stroke="#fff" strokeWidth="2" opacity="0.7" />
    <path d="M6 62Q50 52 94 62Q92 86 50 88Q8 86 6 62Z" fill="#ffc8e2" stroke={PLUM} strokeWidth={O.sw} />
    <path d="M12 64Q50 56 88 64Q82 76 50 78Q18 76 12 64Z" fill={`url(#${p}lilac)`} />
    <path d="M44 62Q66 58 86 64Q80 76 52 77Z" fill="#ff9fcb" opacity="0.85" />
    <path d="M60 66l3 3l3 -3a2 2 0 0 0 -3 -2a2 2 0 0 0 -3 2z" fill="#fff" />
    <ellipse cx="28" cy="60" rx="13" ry="6" fill="#fff7fb" stroke={PLUM} strokeWidth="1.1" />
    <Pearl x={50} y={20} r={4} />
    <path d="M20 86l-3 6M80 86l3 6" stroke="#d9ac5c" strokeWidth="3" strokeLinecap="round" />
    <Glint x={80} y={28} r={4} delay={0.4} />
  </g>
);

const shellSpa = (p: string) => (
  <g>
    {sh(p, 50, 88, 42, 6)}
    <path d="M18 54Q16 24 50 20Q84 24 82 54Z" fill={`url(#${p}pearl)`} stroke={PLUM} strokeWidth={O.sw} />
    {[26, 36, 50, 64, 74].map((x) => (
      <line key={x} x1="50" y1="52" x2={x} y2="26" stroke={PLUM} strokeOpacity="0.2" strokeWidth="1.1" />
    ))}
    <path d="M8 56Q50 48 92 56Q88 84 50 86Q12 84 8 56Z" fill={`url(#${p}pink)`} stroke={PLUM} strokeWidth={O.sw} />
    <ellipse cx="50" cy="57" rx="40" ry="7" fill={`url(#${p}aqua)`} stroke={PLUM} strokeWidth="1" />
    {[
      [26, 53, 5],
      [36, 51, 6],
      [62, 51, 5],
      [72, 53, 6],
      [48, 50, 4],
    ].map(([x, y, r], i) => (
      <circle key={i} cx={x} cy={y} r={r} fill="#fff" stroke="#ffd2ea" strokeWidth="0.8" />
    ))}
    {[0, 1.2, 2.4].map((d, i) => (
      <circle key={i} cx={40 + i * 10} cy={44} r={2.2} fill="none" stroke="#fff" strokeWidth="1" className="pc-rise" style={{ animationDelay: `${d}s` }} />
    ))}
    <path d="M20 84l-4 8h8zM80 84l4 8h-8z" fill={`url(#${p}gold)`} stroke={PLUM} strokeWidth="0.8" />
    <Glint x={84} y={40} r={4} delay={1} />
  </g>
);

const cuddlePile = (p: string) => (
  <g>
    {sh(p, 50, 86, 36, 6)}
    <ellipse cx="50" cy="80" rx="38" ry="9" fill={`url(#${p}lilac)`} stroke={PLUM} strokeWidth="1.2" />
    <circle cx="28" cy="66" r="13" fill={`url(#${p}pearl)`} stroke={PLUM} strokeWidth={O.sw} />
    <circle cx="74" cy="68" r="11" fill="#bdeee6" stroke={PLUM} strokeWidth={O.sw} />
    <path d="M50 82C30 68 26 54 34 46C40 40 48 42 50 50C52 42 60 40 66 46C74 54 70 68 50 82Z" fill="#ff9fcb" stroke={PLUM} strokeWidth={O.sw} />
    <path d="M38 50Q42 46 46 50" stroke="#fff" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    {/* plush baby seal */}
    <g>
      <ellipse cx="62" cy="62" rx="12" ry="9" fill="#f6f1ff" stroke={PLUM} strokeWidth="1.2" />
      <circle cx="58" cy="60" r="1.4" fill={PLUM} />
      <circle cx="65" cy="60" r="1.4" fill={PLUM} />
      <ellipse cx="61.5" cy="63.5" rx="2" ry="1.2" fill="#ff9fcb" />
      <ellipse cx="55" cy="64" rx="2" ry="1" fill="#ffc8e2" />
      <ellipse cx="68" cy="64" rx="2" ry="1" fill="#ffc8e2" />
    </g>
    <Glint x={22} y={50} r={3.5} delay={0.6} />
  </g>
);

const wardrobe = (p: string) => (
  <g>
    {sh(p, 50, 94, 30, 4)}
    <path d="M22 26Q22 6 50 4Q78 6 78 26V92H22Z" fill={`url(#${p}pearl)`} stroke={PLUM} strokeWidth={O.sw} />
    <path d="M28 18Q50 0 72 18" fill="none" stroke={`url(#${p}gold)`} strokeWidth="3" />
    <rect x="27" y="26" width="23" height="62" rx="3" fill="#ffe1ef" stroke={PLUM} strokeWidth="1.1" />
    <rect x="50" y="26" width="23" height="62" rx="3" fill="#fff6fb" stroke={PLUM} strokeWidth="1.1" />
    <line x1="29" y1="32" x2="48" y2="32" stroke="#b98a3a" strokeWidth="1.4" />
    <path d="M32 33l-3 20h12l-3 -20z" fill="#ff9fcb" stroke={PLUM} strokeWidth="0.8" />
    <path d="M42 33l-2 22h9l-2 -22z" fill="#7ee6dc" stroke={PLUM} strokeWidth="0.8" />
    <ellipse cx="61.5" cy="52" rx="8" ry="16" fill="#dfe6fb" stroke={`url(#${p}gold)`} strokeWidth="2" />
    <path d="M57 46l7 -8M58 54l8 -9" stroke="#fff" strokeWidth="1.4" />
    <circle cx="48" cy="60" r="1.6" fill={`url(#${p}gold)`} />
    <circle cx="52" cy="60" r="1.6" fill={`url(#${p}gold)`} />
    <path d="M40 8l3 -5l3 4l4 -5l4 5l3 -4l3 5" fill="none" stroke={`url(#${p}gold)`} strokeWidth="2" strokeLinejoin="round" />
    <circle cx="50" cy="3" r="1.6" fill="#ff9fcb" />
  </g>
);

const spellStand = (p: string) => (
  <g>
    {sh(p, 50, 94, 22, 4)}
    <circle cx="50" cy="34" r="28" fill={`url(#${p}glow)`} className="pc-glow" />
    <path d="M40 92h20l-4 -8h-12zM44 84l2 -26h8l2 26z" fill={`url(#${p}gold)`} stroke={PLUM} strokeWidth="1.2" />
    <ellipse cx="50" cy="58" rx="12" ry="3.4" fill={`url(#${p}gold)`} stroke={PLUM} strokeWidth="1" />
    <circle cx="50" cy="40" r="17" fill={`url(#${p}lilac)`} stroke={PLUM} strokeWidth={O.sw} opacity="0.95" />
    <circle cx="50" cy="40" r="17" fill={`url(#${p}aqua)`} opacity="0.35" />
    <path d={star5Path(52, 41, 6)} fill="#fff6d6" />
    <ellipse cx="43" cy="32" rx="5" ry="3" fill="#fff" opacity="0.85" transform="rotate(-30 43 32)" />
    <g className="pc-bob">
      <path d="M66 18l12 -4l2 10l-12 4z" fill="#ff9fcb" stroke={PLUM} strokeWidth="1" />
      <path d="M68 19l9 -3" stroke="#fff" strokeWidth="1" />
    </g>
    <Glint x={28} y={22} r={4} delay={0.2} />
    <Glint x={74} y={44} r={3} delay={1.1} fill="#fff6d6" />
  </g>
);

/* ---------------- cafe & kairos cafe ---------------- */

const matcha = (p: string) => (
  <g>
    {sh(p, 50, 92, 22, 4)}
    <ellipse cx="50" cy="90" rx="20" ry="4" fill="#fff6fb" stroke={PLUM} strokeWidth="1" />
    <path d="M34 26H66L62 88H38Z" fill={`url(#${p}glass)`} stroke={PLUM} strokeWidth={O.sw} />
    <path d="M35.5 44H64.5L62 88H38Z" fill="#9edb92" />
    <path d="M37 66H63L62 88H38Z" fill="#ff93ba" />
    <path d="M37 64Q50 70 63 64" fill="none" stroke="#fff" strokeOpacity="0.7" strokeWidth="1.5" />
    {[
      [42, 50],
      [54, 56],
      [46, 74],
    ].map(([x, y], i) => (
      <rect key={i} x={x} y={y} width="9" height="8" rx="2" fill="#fff" opacity="0.6" stroke="#e6f7ff" strokeWidth="0.8" />
    ))}
    <path d="M57 26L64 6" stroke="#ff6fa8" strokeWidth="4" strokeLinecap="round" />
    <path d="M57 26L64 6" stroke="#fff" strokeWidth="1" strokeDasharray="2 3" />
    <path d="M30 28q4 -10 12 -6q2 6 -6 9q-5 1 -6 -3z" fill="#ff4f7b" stroke={PLUM} strokeWidth="1" />
    <path d="M36 21l2 -4l3 3z" fill="#5cc79a" />
    <rect x="37" y="30" width="3" height="52" rx="1.5" fill="#fff" opacity="0.6" />
  </g>
);

const broth = (p: string, warm = false) => (
  <g>
    {sh(p, 50, 90, 34, 5)}
    {[34, 50, 66].map((x, i) => (
      <path key={x} d={`M${x} 44q-5 -8 0 -16q5 -8 0 -16`} fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" className="pc-steam" style={{ animationDelay: `${i * 0.8}s` }} />
    ))}
    <ellipse cx="50" cy="52" rx="38" ry="9" fill="#f3b75e" stroke={PLUM} strokeWidth="1.2" />
    <ellipse cx="50" cy="52" rx="34" ry="6.5" fill="#f7c873" />
    <circle cx="40" cy="51" r="2.4" fill="#5cc79a" />
    <circle cx="58" cy="53" r="2" fill="#5cc79a" />
    <circle cx="50" cy="50" r="1.6" fill="#fff3c4" />
    <path d="M12 52Q14 86 50 88Q86 86 88 52Q50 64 12 52Z" fill={warm ? "#e08a6b" : `url(#${p}aqua)`} stroke={PLUM} strokeWidth={O.sw} />
    <path d="M22 66Q50 76 78 66" fill="none" stroke="#fff" strokeOpacity="0.6" strokeWidth="2" />
    {!warm && <path d="M50 70l-6 8h12z" fill="#fff" opacity="0.6" />}
    <path d="M72 48L90 26" stroke="#d9ac5c" strokeWidth="3.4" strokeLinecap="round" />
    <ellipse cx="70" cy="50" rx="5" ry="2.6" fill="#e7bf73" transform="rotate(-40 70 50)" />
  </g>
);

const pancakes = (p: string) => (
  <g>
    {sh(p, 50, 90, 36, 5)}
    <ellipse cx="50" cy="84" rx="40" ry="8" fill={`url(#${p}pearl)`} stroke={PLUM} strokeWidth="1.2" />
    {[74, 64, 54].map((y, i) => (
      <g key={y}>
        <ellipse cx="50" cy={y + 4} rx="30" ry="7" fill="#d9944f" stroke={PLUM} strokeWidth="1.1" />
        <ellipse cx="50" cy={y} rx="30" ry="7" fill="#f2c27f" stroke={PLUM} strokeWidth="1.1" />
        {i === 2 && <ellipse cx="50" cy={y} rx="26" ry="5" fill="#f7d394" />}
      </g>
    ))}
    <path d="M28 54q4 10 2 14M62 56q2 8 0 12" stroke="#c9733a" strokeWidth="3" strokeLinecap="round" fill="none" />
    <path d="M36 50Q38 38 50 38Q62 38 64 50Q50 56 36 50Z" fill="#fffaf6" stroke={PLUM} strokeWidth="1.1" />
    <path d="M44 40q6 -8 12 0" fill="#fffaf6" stroke={PLUM} strokeWidth="1" />
    {[
      [30, 82],
      [70, 82],
      [40, 86],
      [60, 86],
      [50, 80],
    ].map(([x, y], i) => (
      <Pearl key={i} x={x} y={y} r={3} />
    ))}
    <path d="M52 36q3 -8 9 -5q1 5 -5 7q-3 1 -4 -2z" fill="#ff4f7b" stroke={PLUM} strokeWidth="0.9" />
  </g>
);

const regularsBooth = (p: string) => (
  <g>
    <path d="M10 92V40Q10 8 50 8Q90 8 90 40V92Z" fill="#fff6fb" stroke={PLUM} strokeWidth={O.sw} />
    <path d="M16 86V42Q16 14 50 14Q84 14 84 42V86Z" fill={`url(#${p}aqua)`} stroke={`url(#${p}gold)`} strokeWidth="3" />
    <path d="M22 86V48L48 22H62L28 86Z" fill="#fff" opacity="0.25" />
    {/* seahorse patron */}
    <g className="pc-bob">
      <path d="M32 74q-6 -8 0 -16q-4 -6 2 -12q6 -4 10 2q2 4 -2 6q4 4 2 10q-2 6 -6 8q2 4 -2 6q-4 -1 -4 -4z" fill="#ffc8e2" stroke={PLUM} strokeWidth="1.2" />
      <circle cx="39" cy="48" r="1.6" fill={PLUM} />
      <path d="M43 50l6 -1" stroke={PLUM} strokeWidth="1.4" strokeLinecap="round" />
      <ellipse cx="37" cy="52" rx="1.8" ry="1" fill="#ff7fb6" />
    </g>
    {/* pufferfish patron */}
    <g className="pc-bob" style={{ animationDelay: "1s" }}>
      <circle cx="64" cy="58" r="11" fill="#ffd36e" stroke={PLUM} strokeWidth="1.2" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
        <path key={a} d="M64 45l1.6 -3l1.4 3" fill="#ffd36e" stroke={PLUM} strokeWidth="0.8" transform={`rotate(${a} 64 58)`} />
      ))}
      <circle cx="60" cy="56" r="1.6" fill={PLUM} />
      <circle cx="68" cy="56" r="1.6" fill={PLUM} />
      <path d="M62 62q2 2 4 0" stroke={PLUM} strokeWidth="1" fill="none" />
      <ellipse cx="57" cy="60" rx="2" ry="1" fill="#ff9fcb" />
      <ellipse cx="71" cy="60" rx="2" ry="1" fill="#ff9fcb" />
    </g>
    <rect x="16" y="78" width="68" height="8" fill="#fbe9c4" stroke={PLUM} strokeWidth="1" />
    {[34, 56].map((x) => (
      <g key={x}>
        <path d={`M${x} 70h8l-1 8h-6z`} fill="#fff" stroke={PLUM} strokeWidth="0.9" />
        <path d={`M${x + 8} 72q4 1 0 5`} fill="none" stroke={PLUM} strokeWidth="0.9" />
      </g>
    ))}
    <path d="M44 32q3 -4 6 0q3 -4 6 0q0 4 -6 8q-6 -4 -6 -8z" fill="#ff7fb6" className="pc-pulse" />
  </g>
);

const dragonBowl = (p: string) => (
  <g>
    {sh(p, 50, 90, 34, 5)}
    <path d="M10 50Q12 86 50 88Q88 86 90 50Z" fill="#f6efe6" stroke={PLUM} strokeWidth={O.sw} />
    <path d="M18 64Q50 74 82 64" fill="none" stroke="#e7b48f" strokeWidth="3" />
    <ellipse cx="50" cy="50" rx="40" ry="10" fill="#ff5fa2" stroke={PLUM} strokeWidth="1.2" />
    <ellipse cx="50" cy="49" rx="36" ry="7.5" fill="#ff7fb6" />
    {[30, 36, 42].map((x) => (
      <ellipse key={x} cx={x} cy={48} rx="4" ry="2.6" fill="#ffe08a" stroke={PLUM} strokeWidth="0.6" />
    ))}
    <path d="M52 44l10 -4l6 6l-8 6z" fill="#fff" stroke={PLUM} strokeWidth="0.8" />
    {[55, 58, 61, 63].map((x, i) => (
      <circle key={i} cx={x} cy={46 + (i % 2)} r="0.7" fill="#3a2a3f" />
    ))}
    {[70, 74, 66].map((x, i) => (
      <circle key={x} cx={x} cy={50 - i} r="2.6" fill="#5b5bd6" stroke={PLUM} strokeWidth="0.6" />
    ))}
    <path d="M44 52q2 -6 6 0" fill="#5cc79a" />
    <Frangipani x={22} y={52} r={5} />
  </g>
);

/* ---------------- grotto ---------------- */

const coupeTower = (p: string) => {
  const rows = [
    [26, 38, 50, 62, 74],
    [32, 44, 56, 68],
    [38, 50, 62],
    [44, 56],
  ];
  return (
    <g>
      {sh(p, 50, 94, 38, 4)}
      <rect x="16" y="86" width="68" height="6" rx="3" fill={`url(#${p}gold)`} stroke={PLUM} strokeWidth="1" />
      {rows.map((row, ri) =>
        row.map((x) => {
          const y = 76 - ri * 16;
          return (
            <g key={`${ri}-${x}`}>
              <path d={`M${x - 7} ${y}Q${x} ${y + 6} ${x + 7} ${y}Z`} fill="#ffe7a6" stroke={PLUM} strokeWidth="0.9" />
              <path d={`M${x - 6} ${y + 0.6}Q${x} ${y + 2.4} ${x + 6} ${y + 0.6}`} stroke="#fff" strokeWidth="0.8" fill="none" />
              <line x1={x} y1={y + 3} x2={x} y2={y + 9} stroke="#fff" strokeWidth="1.4" />
              <line x1={x - 3.5} y1={y + 9.5} x2={x + 3.5} y2={y + 9.5} stroke="#fff" strokeWidth="1.4" />
            </g>
          );
        }),
      )}
      <path d="M50 10q4 6 0 14" stroke="#ffe7a6" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M44 4l12 -2l-2 8h-8z" fill="#5cc79a" stroke={PLUM} strokeWidth="0.9" />
      {[0, 1.3, 2.6].map((d, i) => (
        <circle key={i} cx={42 + i * 8} cy={60} r="1.4" fill="#fff" className="pc-rise" style={{ animationDelay: `${d}s` }} />
      ))}
      <Glint x={20} y={40} r={4} delay={0.4} fill="#fff3c4" />
      <Glint x={82} y={52} r={3.5} delay={1.6} />
    </g>
  );
};

const discoFloor = (p: string) => {
  const cols = ["#ff9fcb", "#7ee6dc", "#c9b0ff", "#ffe08a"];
  return (
    <g>
      <ellipse cx="50" cy="76" rx="46" ry="16" fill="#7a3f78" stroke={`url(#${p}gold)`} strokeWidth="2.4" />
      <ellipse cx="50" cy="74" rx="40" ry="11" fill="#fff6c9" opacity="0.25" className="pc-glow" />
      {Array.from({ length: 6 }, (_, i) =>
        Array.from({ length: 3 }, (_, j) => {
          const x = 18 + i * 11 + j * 2;
          const y = 66 + j * 7;
          return <rect key={`${i}-${j}`} x={x} y={y} width="9" height="5" rx="1" fill={cols[(i + j) % 4]} opacity="0.85" className="pc-pulse" style={{ animationDelay: `${((i + j) % 4) * 0.5}s` }} transform={`skewX(-18) translate(${j * 2 + 20} 0)`} />;
        }),
      )}
      <path d="M50 4v8" stroke="#e7bf73" strokeWidth="1.4" />
      <path d="M50 12L36 30Q40 44 50 45Q60 44 64 30Z" fill={`url(#${p}pearl)`} stroke={PLUM} strokeWidth={O.sw} />
      {[40, 45, 50, 55, 60].map((x) => (
        <line key={x} x1="50" y1="14" x2={x} y2="43" stroke="#c9d6f5" strokeWidth="1" />
      ))}
      <path d="M38 30h24M41 37h18" stroke="#c9d6f5" strokeWidth="1" />
      <path d="M46 40L30 70H38ZM54 40L70 70H62Z" fill="#fff6c9" opacity="0.35" className="pc-ray" />
      <Glint x={40} y={22} r={4} />
      <Glint x={62} y={34} r={3} delay={0.8} fill="#ffd2ea" />
    </g>
  );
};

const balcony = (p: string) => (
  <g>
    <path d="M8 70V34Q8 6 50 6Q92 6 92 34V70Z" fill="#4a2a4f" stroke={`url(#${p}gold)`} strokeWidth="3" />
    <path d="M14 70V36Q14 12 50 12Q86 12 86 36V70Z" fill="#6d3a63" />
    {Array.from({ length: 9 }, (_, i) => (
      <circle key={i} cx={18 + i * 8} cy={18 + Math.abs(4 - i) * 3} r="1.6" fill="#fff3c4" className="anim-twinkle" style={{ animationDelay: `${i * 0.25}s` }} />
    ))}
    <ellipse cx="34" cy="62" rx="12" ry="6" fill="#c9b0ff" stroke={PLUM} strokeWidth="1" />
    <ellipse cx="62" cy="62" rx="12" ry="6" fill="#ff9fcb" stroke={PLUM} strokeWidth="1" />
    <rect x="44" y="52" width="10" height="10" rx="2" fill="#ffe7a6" stroke={PLUM} strokeWidth="0.8" />
    <rect x="4" y="70" width="92" height="7" rx="2" fill={`url(#${p}gold)`} stroke={PLUM} strokeWidth="1.2" />
    {Array.from({ length: 10 }, (_, i) => (
      <rect key={i} x={8 + i * 9.4} y="77" width="3.2" height="14" rx="1.4" fill="#fff3d6" stroke={PLUM} strokeWidth="0.6" />
    ))}
    <rect x="4" y="90" width="92" height="5" rx="2" fill={`url(#${p}gold)`} stroke={PLUM} strokeWidth="1" />
  </g>
);

/* ---------------- moon deck ---------------- */

const telescope = (p: string) => (
  <g>
    {sh(p, 50, 92, 28, 4)}
    <path d="M50 54L30 92M50 54L70 92M50 54V92" stroke="#b98a3a" strokeWidth="3" strokeLinecap="round" />
    <circle cx="50" cy="54" r="5" fill={`url(#${p}gold)`} stroke={PLUM} strokeWidth="1.1" />
    <g transform="rotate(-38 50 50)">
      <rect x="18" y="42" width="66" height="16" rx="4" fill={`url(#${p}gold)`} stroke={PLUM} strokeWidth={O.sw} />
      <rect x="10" y="40" width="12" height="20" rx="3" fill="#f2d48f" stroke={PLUM} strokeWidth="1.2" />
      <rect x="82" y="44" width="8" height="12" rx="2" fill="#8f6bf0" stroke={PLUM} strokeWidth="1.1" />
      <rect x="26" y="45" width="40" height="3" rx="1.5" fill="#fff" opacity="0.7" />
      <rect x="44" y="40" width="6" height="20" fill="#ff9fcb" opacity="0.9" />
    </g>
    <Glint x={80} y={10} r={5} />
    <Glint x={92} y={26} r={3} delay={0.7} fill="#fff6d6" />
  </g>
);

const ritualAltar = (p: string) => (
  <g>
    <ellipse cx="50" cy="78" rx="44" ry="13" fill="#c9b0ff" opacity="0.5" />
    <ellipse cx="50" cy="78" rx="38" ry="10" fill="none" stroke="#fff6d6" strokeWidth="1.6" strokeDasharray="3 4" />
    <path d="M44 72A10 10 0 1 0 54 84A8 8 0 0 1 44 72Z" fill="#fff6d6" opacity="0.9" />
    {[0, 60, 120, 180, 240, 300].map((a, i) => {
      const x = Math.round((50 + Math.cos((a * Math.PI) / 180) * 38) * 100) / 100;
      const y = Math.round((78 + Math.sin((a * Math.PI) / 180) * 10) * 100) / 100;
      return i % 2 ? (
        <g key={a}>
          <rect x={x - 2.4} y={y - 10} width="4.8" height="10" rx="1.2" fill="#fff6ea" stroke={PLUM} strokeWidth="0.8" />
          <ellipse cx={x} cy={y - 13} rx="2.2" ry="3.6" fill="#ffcf6e" className="pc-pulse" style={{ animationDelay: `${i * 0.3}s` }} />
        </g>
      ) : (
        <path key={a} d={`M${x} ${y - 12}l4 8l-4 4l-4 -4z`} fill={["#7ee6dc", "#ff9fcb", "#c9b0ff"][i % 3]} stroke={PLUM} strokeWidth="0.8" />
      );
    })}
    <circle cx="50" cy="36" r="22" fill={`url(#${p}glow)`} className="pc-glow" />
    <g className="pc-bob">
      <path d="M50 18L60 36L50 54L40 36Z" fill={`url(#${p}lilac)`} stroke={PLUM} strokeWidth={O.sw} />
      <path d="M50 18L54 36L50 54Z" fill="#fff" opacity="0.6" />
      <path d="M40 36H60" stroke={PLUM} strokeOpacity="0.4" strokeWidth="1" />
    </g>
    <Glint x={28} y={30} r={3.5} delay={0.3} />
    <Glint x={72} y={22} r={4} delay={1.2} fill="#fff6d6" />
  </g>
);

/* ---------------- lagoon & pools ---------------- */

const swimRipples = (p: string, kick = false) => (
  <g>
    {[0, 1, 2].map((i) => (
      <ellipse key={i} cx="50" cy="66" rx={16 + i * 14} ry={5 + i * 4.5} fill="none" stroke="#fff" strokeOpacity={0.85 - i * 0.25} strokeWidth="2" className="pc-pulse" style={{ animationDelay: `${i * 0.5}s` }} />
    ))}
    {kick ? (
      <g className="pc-bob">
        <rect x="34" y="52" width="32" height="16" rx="8" fill="#ff8a73" stroke={PLUM} strokeWidth={O.sw} />
        <rect x="38" y="55" width="24" height="4" rx="2" fill="#fff" opacity="0.6" />
      </g>
    ) : (
      <g className="pc-bob">
        <path d="M50 64Q38 50 44 36Q50 44 50 56Q50 44 56 36Q62 50 50 64Z" fill="#7ee6dc" stroke={PLUM} strokeWidth={O.sw} />
        <path d="M44 36Q36 30 32 34Q38 34 44 40ZM56 36Q64 30 68 34Q62 34 56 40Z" fill="#c9b0ff" stroke={PLUM} strokeWidth="1.2" />
        <path d="M47 48q3 -3 6 0" stroke="#fff" strokeWidth="1.4" fill="none" />
      </g>
    )}
    {[
      [30, 50],
      [70, 46],
      [64, 56],
      [36, 58],
    ].map(([x, y], i) => (
      <ellipse key={i} cx={x} cy={y} rx="2" ry="3" fill="#fff" stroke="#bfeee6" strokeWidth="0.6" className="pc-bob" style={{ animationDelay: `${i * 0.4}s` }} />
    ))}
    <Glint x={76} y={60} r={4} delay={0.5} />
  </g>
);

const shellFloat = (p: string) => (
  <g>
    {[0, 1].map((i) => (
      <ellipse key={i} cx="50" cy="70" rx={40 + i * 8} ry={10 + i * 4} fill="none" stroke="#fff" strokeOpacity={0.7 - i * 0.3} strokeWidth="1.6" />
    ))}
    <g className="pc-bob">
      <path d="M14 66Q14 34 50 30Q86 34 86 66Q50 76 14 66Z" fill={`url(#${p}pink)`} stroke={PLUM} strokeWidth={O.sw} />
      {[24, 34, 44, 56, 66, 76].map((x) => (
        <line key={x} x1="50" y1="70" x2={x} y2={38 + Math.abs(50 - x) * 0.3} stroke={PLUM} strokeOpacity="0.22" strokeWidth="1.2" />
      ))}
      <ellipse cx="34" cy="44" rx="10" ry="4" fill="#fff" opacity="0.6" transform="rotate(-20 34 44)" />
      <Pearl x={50} y={70} r={4} />
    </g>
  </g>
);

const flowerFloat = (p: string) => (
  <g>
    <ellipse cx="50" cy="66" rx="44" ry="12" fill="none" stroke="#fff" strokeOpacity="0.6" strokeWidth="1.6" />
    <g className="pc-bob">
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cx="50" cy="44" rx="13" ry="20" transform={`rotate(${a} 50 60) translate(0 -2)`} fill="#fffaf2" stroke={PLUM} strokeWidth="1.3" />
      ))}
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={`i${a}`} cx="50" cy="50" rx="5" ry="9" transform={`rotate(${a} 50 60)`} fill="#ffd36e" opacity="0.7" />
      ))}
      <circle cx="50" cy="60" r="7" fill="#ffb347" stroke={PLUM} strokeWidth="1" />
      <ellipse cx="36" cy="40" rx="5" ry="2.4" fill="#fff" transform="rotate(-30 36 40)" />
    </g>
  </g>
);

/* ---------------- reef ---------------- */

const kelpArch = (p: string) => (
  <g>
    {sh(p, 50, 94, 40, 4)}
    <path className="pc-sway" d="M18 94C10 70 26 48 22 30C20 18 34 8 50 8C40 14 32 22 34 34C38 52 26 72 30 94Z" fill={`url(#${p}mint)`} stroke={PLUM} strokeWidth={O.sw} />
    <path className="pc-sway" style={{ animationDelay: "1s" }} d="M82 94C90 70 74 48 78 30C80 18 66 8 50 8C60 14 68 22 66 34C62 52 74 72 70 94Z" fill={`url(#${p}mint)`} stroke={PLUM} strokeWidth={O.sw} />
    {[
      [30, 30],
      [70, 34],
      [50, 12],
    ].map(([x, y], i) => (
      <g key={i}>
        <line x1={x} y1={y} x2={x} y2={y + 10} stroke="#fff" strokeWidth="0.8" />
        <Pearl x={x} y={y + 12} r={3} />
      </g>
    ))}
    <g className="pc-bob">
      <path d="M44 56q8 -6 14 0q-6 6 -14 0zM58 56l5 -4v8z" fill="#ff9fcb" stroke={PLUM} strokeWidth="0.8" />
      <circle cx="48" cy="55" r="0.9" fill={PLUM} />
    </g>
    <ellipse cx="50" cy="84" rx="18" ry="5" fill="#fff" opacity="0.18" />
  </g>
);

const crystals = (p: string) => (
  <g>
    {sh(p, 50, 92, 36, 5)}
    <circle cx="50" cy="50" r="40" fill={`url(#${p}glow)`} className="pc-glow" />
    <path d="M12 90Q16 74 34 74Q50 68 66 74Q86 74 90 90Z" fill="#a99bc6" stroke={PLUM} strokeWidth="1.3" />
    {[
      [30, 80, 10, 38, "#c9b0ff"],
      [50, 78, 13, 62, "#7ee6dc"],
      [68, 80, 10, 44, "#ffc8e2"],
      [40, 82, 7, 26, "#efe2ff"],
      [76, 84, 6, 24, "#c9b0ff"],
    ].map(([x, y, w, h, c], i) => {
      const X = x as number;
      const Y = y as number;
      const W = w as number;
      const H = h as number;
      return (
        <g key={i}>
          <path d={`M${X - W / 2} ${Y}L${X - W / 2} ${Y - H * 0.7}L${X} ${Y - H}L${X + W / 2} ${Y - H * 0.7}L${X + W / 2} ${Y}Z`} fill={c as string} stroke={PLUM} strokeWidth="1.2" strokeLinejoin="round" />
          <path d={`M${X} ${Y - H}L${X} ${Y}L${X - W / 2} ${Y}L${X - W / 2} ${Y - H * 0.7}Z`} fill="#fff" opacity="0.35" />
        </g>
      );
    })}
    <Glint x={52} y={18} r={5} delay={0.2} />
    <Glint x={72} y={36} r={3.5} delay={1.2} />
  </g>
);

const glowshrooms = (p: string) => (
  <g>
    <path d="M6 92Q10 74 30 72Q50 66 70 72Q92 74 94 92Z" fill="#7d6aa6" stroke={PLUM} strokeWidth="1.2" />
    {[
      [30, 74, 18, "#ff9fcb", 0],
      [58, 70, 22, "#c9b0ff", 0.8],
      [80, 76, 12, "#7ee6dc", 1.6],
    ].map(([x, y, s, c, d], i) => {
      const X = x as number;
      const Y = y as number;
      const S = s as number;
      return (
        <g key={i}>
          <ellipse cx={X} cy={Y - S * 0.9} rx={S * 1.3} ry={S} fill={c as string} opacity="0.4" className="pc-glow" style={{ animationDelay: `${d}s` }} />
          <path d={`M${X - S * 0.18} ${Y}Q${X - S * 0.3} ${Y - S * 0.6} ${X - S * 0.15} ${Y - S * 0.9}H${X + S * 0.15}Q${X + S * 0.3} ${Y - S * 0.6} ${X + S * 0.18} ${Y}Z`} fill="#fff6ea" stroke={PLUM} strokeWidth="1.1" />
          <path d={`M${X - S} ${Y - S * 0.8}Q${X} ${Y - S * 2.1} ${X + S} ${Y - S * 0.8}Q${X} ${Y - S * 0.5} ${X - S} ${Y - S * 0.8}Z`} fill={c as string} stroke={PLUM} strokeWidth="1.3" />
          <circle cx={X - S * 0.4} cy={Y - S * 1.2} r={S * 0.12} fill="#fff" />
          <circle cx={X + S * 0.3} cy={Y - S * 1.35} r={S * 0.09} fill="#fff" />
          <circle cx={X + S * 0.05} cy={Y - S * 1.05} r={S * 0.07} fill="#fff" />
        </g>
      );
    })}
    <Glint x={44} y={30} r={4} delay={0.5} fill="#fff6d6" />
  </g>
);

/* ---------------- beach ---------------- */

const treasureChest = (p: string) => (
  <g>
    <path d="M18 86l14 -6M18 80l14 6" stroke="#c9733a" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
    {sh(p, 54, 88, 34, 5)}
    <circle cx="56" cy="56" r="30" fill={`url(#${p}glow)`} className="pc-glow" />
    <path d="M30 42Q56 22 82 42L80 50H32Z" fill="#e3a368" stroke={PLUM} strokeWidth={O.sw} transform="rotate(-18 32 50)" />
    <rect x="30" y="52" width="52" height="34" rx="4" fill={`url(#${p}wood)`} stroke={PLUM} strokeWidth={O.sw} />
    <path d="M30 52Q56 46 82 52" fill="#ffe08a" stroke={PLUM} strokeWidth="1" />
    {[
      [42, 50],
      [52, 48],
      [62, 49],
      [70, 51],
    ].map(([x, y], i) => (
      <circle key={i} cx={x} cy={y} r="3.4" fill={i % 2 ? "#ffe08a" : "#fff7fb"} stroke={PLUM} strokeWidth="0.7" />
    ))}
    <rect x="30" y="58" width="52" height="4" fill={`url(#${p}gold)`} />
    <rect x="52" y="60" width="8" height="10" rx="2" fill={`url(#${p}gold)`} stroke={PLUM} strokeWidth="0.9" />
    <path d={starPath(62, 38, 6)} fill="#fff" className="anim-twinkle" />
    <Glint x={40} y={36} r={4} delay={0.8} fill="#fff6d6" />
  </g>
);

const seaGlass = (p: string) => (
  <g>
    {sh(p, 50, 86, 36, 5)}
    {[
      [22, 80, "#7ee6dc", 10],
      [34, 86, "#c9b0ff", -20],
      [46, 80, "#9be7c4", 30],
      [72, 84, "#ffc8e2", 10],
      [82, 78, "#7ee6dc", -30],
      [28, 70, "#ffe08a", 50],
    ].map(([x, y, c, r], i) => (
      <ellipse key={i} cx={x as number} cy={y as number} rx="6" ry="4" fill={c as string} stroke={PLUM} strokeWidth="1" opacity="0.92" transform={`rotate(${r} ${x} ${y})`} />
    ))}
    <path d="M52 30h16v6q6 4 6 14v24q0 6 -6 6h-16q-6 0 -6 -6V50q0 -10 6 -14z" fill={`url(#${p}glass)`} stroke={PLUM} strokeWidth={O.sw} />
    <rect x="52" y="24" width="16" height="7" rx="2" fill="#d9a874" stroke={PLUM} strokeWidth="1" />
    {[
      [54, 72, "#7ee6dc"],
      [62, 74, "#c9b0ff"],
      [58, 66, "#ffc8e2"],
      [66, 66, "#9be7c4"],
    ].map(([x, y, c], i) => (
      <circle key={i} cx={x as number} cy={y as number} r="3.4" fill={c as string} stroke={PLUM} strokeWidth="0.6" />
    ))}
    <rect x="50" y="40" width="3" height="30" rx="1.5" fill="#fff" opacity="0.7" />
    <Glint x={76} y={36} r={4} delay={0.3} />
  </g>
);

const beachLounger = (p: string) => (
  <g>
    {sh(p, 50, 90, 42, 5)}
    <line x1="64" y1="16" x2="70" y2="88" stroke="#b98a3a" strokeWidth="2.4" />
    <path d="M30 26Q64 -4 98 24Z" fill="#ff9fcb" stroke={PLUM} strokeWidth={O.sw} />
    <path d="M52 18L64 10L74 18L64 24Z" fill="#fff" opacity="0.9" />
    <path d="M86 18L94 22H78Z" fill="#fff" opacity="0.9" />
    <path d="M10 70L40 54L48 62L88 62L90 72L16 78Z" fill="#fffaf2" stroke={PLUM} strokeWidth={O.sw} strokeLinejoin="round" />
    <path d="M14 70L40 56L46 62L86 63L87 70L18 75Z" fill="#7ee6dc" />
    <path d="M30 64l4 8M44 64l2 8M58 64l1 8M72 64l1 8" stroke="#fff" strokeWidth="2" />
    <path d="M18 78v10M84 72v14M50 76v12" stroke="#d9a874" strokeWidth="3" strokeLinecap="round" />
    <Frangipani x={26} y={60} r={5} rot={15} />
  </g>
);

/* ---------------- lounge ---------------- */

const loungeDance = (p: string) => (
  <g>
    <ellipse cx="50" cy="72" rx="48" ry="18" fill={`url(#${p}lilac)`} stroke={`url(#${p}gold)`} strokeWidth="3" />
    <ellipse cx="50" cy="72" rx="40" ry="14" fill="none" stroke="#fff" strokeWidth="1.4" strokeDasharray="2 5" />
    {[0, 1, 2, 3].map((i) => (
      <ellipse key={i} cx={30 + i * 13} cy={70 + (i % 2) * 5} rx="6" ry="2.4" fill={["#ff9fcb", "#7ee6dc", "#ffe08a", "#fff"][i]} opacity="0.8" className="pc-pulse" style={{ animationDelay: `${i * 0.4}s` }} />
    ))}
    <path d="M50 0v10" stroke="#e7bf73" strokeWidth="1.4" />
    <g className="pc-spin" style={{ animationDuration: "8s" }}>
      <circle cx="50" cy="22" r="12" fill={`url(#${p}pearl)`} stroke={PLUM} strokeWidth={O.sw} />
      <path d="M38 22h24M40 16h20M40 28h20M50 10v24M44 11q-4 11 0 22M56 11q4 11 0 22" stroke="#c9d6f5" strokeWidth="0.9" fill="none" />
    </g>
    <path d="M44 32L26 66H36ZM56 32L74 66H64Z" fill="#fff6c9" opacity="0.3" className="pc-ray" />
    <Glint x={34} y={14} r={4} />
    <Glint x={68} y={26} r={3} delay={0.9} fill="#ffd2ea" />
  </g>
);

/* ---------------- kairos studio / gym / sound / cowork ---------------- */

const reformer = (p: string) => (
  <g>
    {sh(p, 50, 88, 46, 5)}
    <rect x="6" y="62" width="88" height="10" rx="4" fill={`url(#${p}wood)`} stroke={PLUM} strokeWidth={O.sw} />
    <path d="M10 72v12M90 72v12M50 72v12" stroke="#a8703f" strokeWidth="3.4" strokeLinecap="round" />
    <rect x="36" y="54" width="34" height="9" rx="3" fill="#fff6ea" stroke={PLUM} strokeWidth="1.2" />
    <rect x="62" y="48" width="8" height="8" rx="2" fill="#ffc8e2" stroke={PLUM} strokeWidth="1" />
    <path d="M10 62V44M14 44h-8" stroke="#a8703f" strokeWidth="3" strokeLinecap="round" />
    <path d="M86 62V40" stroke="#a8703f" strokeWidth="3" strokeLinecap="round" />
    <path d="M22 66q4 -3 8 0q4 3 8 0" stroke="#b9a6c8" strokeWidth="1.4" fill="none" />
    <path d="M86 42q-10 6 -14 12M86 42q-8 10 -10 14" stroke="#ff9fcb" strokeWidth="1.6" fill="none" />
    <circle cx="86" cy="40" r="3" fill={`url(#${p}gold)`} />
  </g>
);

const yogaMat = (p: string) => (
  <g>
    {sh(p, 50, 84, 44, 5)}
    <path d="M14 82L28 56H86L76 82Z" fill="#c9b0ff" stroke={PLUM} strokeWidth={O.sw} strokeLinejoin="round" />
    <path d="M18 78L30 60H82L72 78Z" fill="none" stroke="#fff" strokeWidth="1" strokeDasharray="3 3" />
    <ellipse cx="20" cy="80" rx="6" ry="4" fill="#b99cf5" stroke={PLUM} strokeWidth="1.1" />
    <rect x="66" y="40" width="16" height="11" rx="2" fill="#ffc8e2" stroke={PLUM} strokeWidth="1.1" transform="rotate(-8 74 46)" />
    <rect x="72" y="30" width="14" height="10" rx="2" fill="#bdeee6" stroke={PLUM} strokeWidth="1.1" transform="rotate(6 79 35)" />
    <path d="M40 66q10 -6 20 0" stroke="#ffe08a" strokeWidth="3" fill="none" strokeLinecap="round" />
    <path d="M20 48c-4 -10 0 -24 4 -28c2 8 2 20 -4 28zM20 48c4 -8 12 -12 16 -12c-4 6 -10 10 -16 12z" fill="#5cc79a" stroke={PLUM} strokeWidth="0.8" />
    <path d="M14 48h14l-2 10h-10z" fill="#e3b07a" stroke={PLUM} strokeWidth="1" />
  </g>
);

const stretchCorner = (p: string) => (
  <g>
    {sh(p, 50, 90, 38, 5)}
    <rect x="8" y="22" width="84" height="5" rx="2.5" fill={`url(#${p}wood)`} stroke={PLUM} strokeWidth="1.2" />
    <path d="M14 27v10M86 27v10" stroke="#a8703f" strokeWidth="3" />
    <circle cx="66" cy="70" r="18" fill="#bdeee6" stroke={PLUM} strokeWidth={O.sw} />
    <path d="M52 62q14 -8 28 2" stroke="#fff" strokeWidth="2" fill="none" />
    <rect x="12" y="72" width="40" height="16" rx="8" fill="#ff9fcb" stroke={PLUM} strokeWidth={O.sw} />
    <ellipse cx="14" cy="80" rx="3.4" ry="8" fill="#ffc8e2" stroke={PLUM} strokeWidth="1" />
    <path d="M20 76h26" stroke="#fff" strokeWidth="1.6" opacity="0.7" />
    <path d="M30 40q6 14 0 26" stroke="#c9b0ff" strokeWidth="4" fill="none" strokeLinecap="round" />
  </g>
);

const dumbbells = (p: string) => {
  const cols = ["#ff9fcb", "#7ee6dc", "#c9b0ff", "#ffe08a"];
  return (
    <g>
      {sh(p, 50, 92, 42, 5)}
      <rect x="10" y="40" width="80" height="5" rx="2" fill={`url(#${p}wood)`} stroke={PLUM} strokeWidth="1.2" />
      <rect x="10" y="66" width="80" height="5" rx="2" fill={`url(#${p}wood)`} stroke={PLUM} strokeWidth="1.2" />
      <path d="M14 45v44M86 45v44" stroke="#a8703f" strokeWidth="3.4" strokeLinecap="round" />
      {[0, 1].map((row) =>
        [0, 1, 2].map((i) => {
          const cx = 26 + i * 24;
          const cy = 34 + row * 26;
          const c = cols[(i + row) % 4];
          const s = 1 - i * 0.12;
          return (
            <g key={`${row}-${i}`}>
              <rect x={cx - 8 * s} y={cy - 1.5} width={16 * s} height="3" fill="#b9a6c8" />
              <rect x={cx - 11 * s} y={cy - 5 * s} width={5 * s} height={10 * s} rx="1.6" fill={c} stroke={PLUM} strokeWidth="1" />
              <rect x={cx + 6 * s} y={cy - 5 * s} width={5 * s} height={10 * s} rx="1.6" fill={c} stroke={PLUM} strokeWidth="1" />
            </g>
          );
        }),
      )}
      <path d="M40 92q0 -12 10 -12q10 0 10 12z" fill="#c9b0ff" stroke={PLUM} strokeWidth={O.sw} />
      <path d="M44 82q0 -8 6 -8q6 0 6 8" fill="none" stroke={PLUM} strokeWidth="2.6" />
      <Glint x={84} y={28} r={3.5} delay={0.4} />
    </g>
  );
};

const crystalBowls = (p: string) => (
  <g>
    {[0, 1, 2].map((i) => (
      <ellipse key={i} cx="50" cy="50" rx={22 + i * 12} ry={12 + i * 7} fill="none" stroke="#c9b0ff" strokeWidth="1.4" opacity="0.6" className="pc-glow" style={{ animationDelay: `${i * 0.7}s` }} />
    ))}
    {sh(p, 50, 88, 44, 5)}
    {[
      [26, 74, 14],
      [56, 76, 18],
      [82, 74, 11],
    ].map(([x, y, r], i) => (
      <g key={i}>
        <ellipse cx={x} cy={y + 8} rx={r + 5} ry="4.5" fill={["#ffc8e2", "#c9b0ff", "#bdeee6"][i]} stroke={PLUM} strokeWidth="1" />
        <path d={`M${x - r} ${y - r * 0.5}Q${x - r} ${y + 8} ${x} ${y + 8}Q${x + r} ${y + 8} ${x + r} ${y - r * 0.5}Z`} fill={`url(#${p}glass)`} stroke={PLUM} strokeWidth={O.sw} />
        <ellipse cx={x} cy={y - r * 0.5} rx={r} ry={r * 0.22} fill="#f7f4ff" stroke={PLUM} strokeWidth="1.1" />
        <path d={`M${x - r * 0.7} ${y - r * 0.2}Q${x - r * 0.6} ${y + 4} ${x - r * 0.2} ${y + 6}`} stroke="#ffc8e2" strokeWidth="1.6" fill="none" />
        <path d={`M${x + r * 0.5} ${y - r * 0.1}Q${x + r * 0.5} ${y + 3} ${x + r * 0.2} ${y + 5}`} stroke="#7ee6dc" strokeWidth="1.4" fill="none" />
      </g>
    ))}
    <path d="M66 52l16 -16" stroke="#e3b07a" strokeWidth="3" strokeLinecap="round" />
    <circle cx="65" cy="53" r="3.4" fill="#fff6ea" stroke={PLUM} strokeWidth="0.9" />
    <Glint x={40} y={40} r={4} />
    <Glint x={70} y={28} r={3} delay={1} fill="#efe2ff" />
  </g>
);

const rattanDesk = (p: string) => (
  <g>
    {sh(p, 50, 92, 44, 5)}
    <rect x="8" y="58" width="84" height="8" rx="3" fill={`url(#${p}wood)`} stroke={PLUM} strokeWidth={O.sw} />
    <path d="M14 66V90M86 66V90" stroke="#b9804a" strokeWidth="3.4" strokeLinecap="round" />
    <path d="M16 70h68v14h-68z" fill="#e8c592" stroke={PLUM} strokeWidth="1" />
    {Array.from({ length: 8 }, (_, i) => (
      <path key={i} d={`M${18 + i * 8.5} 70l4 14M${22 + i * 8.5} 70l-4 14`} stroke="#c9a06a" strokeWidth="0.8" />
    ))}
    <path d="M30 58l5 -26h32l-5 26z" fill="#f4f0ff" stroke={PLUM} strokeWidth={O.sw} strokeLinejoin="round" />
    <path d="M34 54l4 -18h24l-4 18z" fill={`url(#${p}aqua)`} opacity="0.7" />
    <path d="M44 44q4 -6 8 0q-4 4 -8 0z" fill="#fff" opacity="0.9" />
    <path d="M24 58h50" stroke={PLUM} strokeWidth="1.2" />
    <path d="M76 58h8l-1 -10h-6z" fill="#e8fff5" stroke={PLUM} strokeWidth="0.9" />
    <path d="M76.6 52h6.8l-0.4 6h-6z" fill="#9edb92" />
    <path d="M14 58c-4 -8 -2 -18 2 -22c2 6 2 14 -2 22zM14 58c4 -6 10 -10 14 -10c-4 6 -8 8 -14 10z" fill="#5cc79a" stroke={PLUM} strokeWidth="0.8" />
    <Glint x={70} y={26} r={3.5} delay={0.4} />
  </g>
);


const retroTV = (p: string) => (
  <g>
    {sh(p, 50, 92, 30, 4)}
    <path d="M38 14L48 26M62 12L52 26" stroke="#b98a3a" strokeWidth="2" strokeLinecap="round" />
    <circle cx="38" cy="13" r="2.4" fill="#ff9fcb" stroke={PLUM} strokeWidth="0.8" />
    <circle cx="62" cy="11" r="2.4" fill="#7ee6dc" stroke={PLUM} strokeWidth="0.8" />
    <rect x="14" y="26" width="72" height="54" rx="14" fill={`url(#${p}pink)`} stroke={PLUM} strokeWidth={O.sw} />
    <rect x="20" y="32" width="46" height="40" rx="10" fill="#3a2766" stroke={PLUM} strokeWidth="1.2" />
    <rect x="23" y="35" width="40" height="34" rx="8" fill={`url(#${p}aqua)`} opacity="0.9" className="pc-pulse" />
    <path d="M34 60q6 -12 12 0q-6 6 -12 0z" fill="#ff9fcb" />
    <path d={star5Path(50, 46, 5)} fill="#fff6d6" />
    <path d="M26 38l10 -2" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
    <circle cx="76" cy="42" r="4.5" fill={`url(#${p}gold)`} stroke={PLUM} strokeWidth="1" />
    <circle cx="76" cy="56" r="4.5" fill={`url(#${p}gold)`} stroke={PLUM} strokeWidth="1" />
    <path d="M72 66h8M72 70h8" stroke={PLUM} strokeOpacity="0.4" strokeWidth="1.2" />
    <path d="M26 80l-4 10M74 80l4 10" stroke="#d9ac5c" strokeWidth="3" strokeLinecap="round" />
    <Glint x={88} y={24} r={4} delay={0.6} />
  </g>
);

const shellSofa = (p: string) => (
  <g>
    {sh(p, 50, 90, 44, 5)}
    <path d="M10 70Q6 20 50 14Q94 20 90 70Z" fill={`url(#${p}pink)`} stroke={PLUM} strokeWidth={O.sw} />
    {[18, 28, 39, 50, 61, 72, 82].map((x) => (
      <line key={x} x1="50" y1="66" x2={x} y2={22 + Math.abs(50 - x) * 0.35} stroke={PLUM} strokeOpacity="0.22" strokeWidth="1.3" />
    ))}
    <path d="M16 62Q50 52 84 62" fill="none" stroke="#fff" strokeWidth="2" opacity="0.7" />
    <rect x="6" y="62" width="88" height="20" rx="10" fill="#ffc8e2" stroke={PLUM} strokeWidth={O.sw} />
    <path d="M12 66Q50 60 88 66" stroke="#fff" strokeWidth="2" opacity="0.7" fill="none" />
    <circle cx="28" cy="58" r="8" fill="#bdeee6" stroke={PLUM} strokeWidth="1.1" />
    <path d="M66 62c-6 -6 -8 -10 -4 -13c2.5 -2 5 -1 6 1c1 -2 3.5 -3 6 -1c4 3 2 7 -4 13z" fill="#c9b0ff" stroke={PLUM} strokeWidth="1" />
    <path d="M16 82v8M84 82v8" stroke="#d9ac5c" strokeWidth="3.4" strokeLinecap="round" />
    <Pearl x={50} y={16} r={3.6} />
  </g>
);

const picnic = (p: string) => (
  <g>
    <path d="M4 80L24 52H96L82 80Z" fill="#fff6fb" stroke={PLUM} strokeWidth={O.sw} strokeLinejoin="round" />
    <path d="M18 60H90M11 70H86M38 52L30 80M60 52L56 80M80 52L78 80" stroke="#ff9fcb" strokeWidth="3.6" opacity="0.75" />
    <g>
      <path d="M30 62H62L58 82H34Z" fill={`url(#${p}wood)`} stroke={PLUM} strokeWidth={O.sw} />
      <path d="M33 68h26M34 74h24" stroke="#9c6a3a" strokeWidth="1" opacity="0.6" />
      <path d="M34 62Q46 40 58 62" fill="none" stroke="#b9804a" strokeWidth="3.4" />
      <path d="M32 62q14 -6 28 0" fill="#ffd2e8" stroke={PLUM} strokeWidth="1" />
      <circle cx="42" cy="58" r="3.6" fill="#ff4f7b" stroke={PLUM} strokeWidth="0.7" />
    </g>
    <g>
      <path d="M70 46h8l-1 14h-6z" fill="#e8fff5" stroke={PLUM} strokeWidth="1" />
      <path d="M70.5 51h7l-0.6 9h-5.8z" fill="#9edb92" />
      <path d="M75 46l3 -7" stroke="#ff6fa8" strokeWidth="1.8" strokeLinecap="round" />
    </g>
    <ellipse cx="80" cy="70" rx="8" ry="3.4" fill="#fff" stroke={PLUM} strokeWidth="0.9" />
    <path d="M75 69q5 -4 10 0" fill="#ffb3d6" />
    <Frangipani x={18} y={74} r={4.5} />
    <Glint x={90} y={40} r={3.5} delay={0.4} />
  </g>
);

/* =================================================================== */
/* Object registry: activity id -> art + size (in cqmin)               */
/* =================================================================== */

const OBJECTS: Record<string, { draw: (p: string) => ReactNode; size: number }> = {
  nap_oyster: { draw: oysterBed, size: 40 },
  shell_spa: { draw: shellSpa, size: 34 },
  cuddle: { draw: cuddlePile, size: 26 },
  play: { draw: wardrobe, size: 28 },
  cast_spell: { draw: spellStand, size: 22 },
  cafe_matcha: { draw: matcha, size: 20 },
  cafe_broth: { draw: (p) => broth(p), size: 24 },
  cafe_feed: { draw: pancakes, size: 24 },
  cafe_socialise: { draw: regularsBooth, size: 30 },
  grotto_toast: { draw: coupeTower, size: 30 },
  grotto_dance: { draw: discoFloor, size: 36 },
  grotto_gossip_break: { draw: balcony, size: 28 },
  moon_stargaze: { draw: telescope, size: 34 },
  moon_ritual_solo: { draw: ritualAltar, size: 30 },
  lagoon_swim: { draw: (p) => swimRipples(p), size: 34 },
  lagoon_float: { draw: shellFloat, size: 30 },
  reef_explore: { draw: kelpArch, size: 34 },
  reef_crystals: { draw: crystals, size: 30 },
  reef_mushroom: { draw: glowshrooms, size: 28 },
  beach_treasure: { draw: treasureChest, size: 30 },
  beach_glass: { draw: seaGlass, size: 26 },
  beach_lounge: { draw: beachLounger, size: 34 },
  lounge_dance: { draw: loungeDance, size: 42 },
  lounge_movie: { draw: retroTV, size: 26 },
  lounge_gossip: { draw: shellSofa, size: 32 },
  beach_day: { draw: picnic, size: 30 },
  kairos_swim: { draw: (p) => swimRipples(p, true), size: 32 },
  kairos_float: { draw: flowerFloat, size: 28 },
  kairos_pilates: { draw: reformer, size: 34 },
  kairos_yoga: { draw: yogaMat, size: 32 },
  kairos_stretch: { draw: stretchCorner, size: 26 },
  kairos_weights: { draw: dumbbells, size: 36 },
  kairos_sound: { draw: crystalBowls, size: 40 },
  kairos_cowork: { draw: rattanDesk, size: 40 },
  kairos_matcha: { draw: matcha, size: 20 },
  kairos_broth: { draw: (p) => broth(p, true), size: 24 },
  kairos_bowl: { draw: dragonBowl, size: 24 },
};

function SceneObject({ activityId, x, y }: { activityId: string; x: number; y: number }) {
  const p = useArtId("o");
  const def = OBJECTS[activityId];
  if (!def) return null;
  const depth = 0.85 + Math.max(0, Math.min(1, (y - 30) / 45)) * 0.3;
  const style: CSSProperties = {
    position: "absolute",
    left: `${x}%`,
    top: `${y}%`,
    width: `calc(${(def.size * depth * 1.3).toFixed(1)} * 1cqmin)`,
    aspectRatio: "1 / 1",
    transform: "translate(-50%, -54%)",
    pointerEvents: "none",
    filter: "drop-shadow(0 2px 0 rgba(255,255,255,.6))",
  };
  return (
    <div style={style} aria-hidden>
      <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ overflow: "visible", display: "block" }}>
        <ObjDefs p={p} />
        {def.draw(p)}
      </svg>
    </div>
  );
}

/* =================================================================== */
/* Backdrops (viewBox 400 x 400, sliced to any aspect)                  */
/* =================================================================== */

function Floor({ y0, a, b, line = PLUM, lineOp = 0.12, rows = [12, 30, 56, 92, 140] }: { y0: number; a: string; b: string; line?: string; lineOp?: number; rows?: number[] }) {
  return (
    <g>
      <rect x="-20" y={y0} width="440" height={420 - y0} fill={a} />
      <rect x="-20" y={y0} width="440" height="12" fill={b} opacity="0.6" />
      {Array.from({ length: 15 }, (_, i) => i - 7).map((i) => (
        <line key={i} x1={200 + i * 30} y1={y0} x2={200 + i * 110} y2={420} stroke={line} strokeOpacity={lineOp} strokeWidth="1.2" />
      ))}
      {rows.map((r) => (
        <line key={r} x1="-20" y1={y0 + r} x2="420" y2={y0 + r} stroke={line} strokeOpacity={lineOp} strokeWidth="1.2" />
      ))}
    </g>
  );
}

function Lin({ id, stops, x2 = 0, y2 = 1 }: { id: string; stops: [number, string, number?][]; x2?: number; y2?: number }) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2={x2} y2={y2}>
      {stops.map(([o, c, op], i) => (
        <stop key={i} offset={o} stopColor={c} stopOpacity={op ?? 1} />
      ))}
    </linearGradient>
  );
}

function GoldDefs({ p }: { p: string }) {
  return <Lin id={`${p}gold`} stops={[[0, "#fff3c9"], [0.5, "#e7bf73"], [1, "#b98a3a"]]} />;
}

function Field({ seed, n, x0 = 0, x1 = 400, y0 = 0, y1 = 200, colors = ["#fff"], rMax = 3.5 }: { seed: number; n: number; x0?: number; x1?: number; y0?: number; y1?: number; colors?: string[]; rMax?: number }) {
  const r = rng(seed);
  return (
    <g>
      {Array.from({ length: n }, (_, i) => (
        <Glint key={i} x={Math.round((x0 + r() * (x1 - x0)) * 10) / 10} y={Math.round((y0 + r() * (y1 - y0)) * 10) / 10} r={Math.round((1.2 + r() * rMax) * 10) / 10} delay={Math.round(r() * 30) / 10} fill={colors[i % colors.length]} />
      ))}
    </g>
  );
}

function Bubbles({ pts }: { pts: [number, number, number][] }) {
  return (
    <g>
      {pts.map(([x, y, d], i) => (
        <circle key={i} cx={x} cy={y} r={2 + (i % 3)} fill="#fff" fillOpacity="0.25" stroke="#fff" strokeWidth="1" className="pc-rise" style={{ animationDelay: `${d}s`, animationDuration: `${4 + (i % 3)}s` }} />
      ))}
    </g>
  );
}

function PalaceBG({ p }: { p: string }) {
  return (
    <g>
      <defs>
        <GoldDefs p={p} />
        <Lin id={`${p}wall`} stops={[[0, "#ffe9f4"], [1, "#ffcfe5"]]} />
        <Lin id={`${p}view`} stops={[[0, "#4b2f86"], [0.55, "#c07ac0"], [0.75, "#7ee6dc"], [1, "#22b8b0"]]} />
        <pattern id={`${p}dam`} width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M20 8q6 6 0 12q-6 -6 0 -12zM20 28q4 4 0 8q-4 -4 0 -8z" fill="#ffc0dc" opacity="0.8" />
          <circle cx="0" cy="20" r="1.6" fill="#fff" />
          <circle cx="40" cy="20" r="1.6" fill="#fff" />
        </pattern>
      </defs>
      <rect x="-20" y="-20" width="440" height="260" fill={`url(#${p}wall)`} />
      <rect x="-20" y="-20" width="440" height="260" fill={`url(#${p}dam)`} />
      <rect x="-20" y="168" width="440" height="52" fill="#fff4fa" />
      {Array.from({ length: 12 }, (_, i) => (
        <rect key={i} x={-10 + i * 38} y="176" width="30" height="36" rx="4" fill="none" stroke="#f2b6d3" strokeWidth="1.4" />
      ))}
      <rect x="-20" y="164" width="440" height="5" fill={`url(#${p}gold)`} />
      {/* crown molding */}
      <rect x="-20" y="30" width="440" height="10" fill={`url(#${p}gold)`} />
      {Array.from({ length: 22 }, (_, i) => (
        <Pearl key={i} x={-10 + i * 20} y={44} r={3.4} />
      ))}
      {/* window */}
      <path d="M150 168V96Q150 52 200 52Q250 52 250 96V168Z" fill={`url(#${p}view)`} stroke={`url(#${p}gold)`} strokeWidth="7" />
      <path d="M150 168V96Q150 52 200 52Q250 52 250 96V168Z" fill="none" stroke={PLUM} strokeWidth="1.4" />
      <path d="M210 74A14 14 0 1 0 210 102A18 18 0 0 1 210 74Z" fill="#fff4d6" />
      <path d="M150 140Q176 130 200 140Q224 150 250 138V168H150Z" fill="#5fd8cf" opacity="0.8" />
      <path d="M200 52V168M150 112H250" stroke="#fff" strokeOpacity="0.7" strokeWidth="2" />
      <Field seed={5} n={6} x0={160} x1={240} y0={64} y1={120} rMax={2} />
      {/* curtains */}
      <path d="M128 40Q148 110 136 176H158Q146 110 176 40Z" fill="#d7c2ff" stroke={PLUM} strokeWidth="1.2" opacity="0.95" />
      <path d="M272 40Q252 110 264 176H242Q254 110 224 40Z" fill="#d7c2ff" stroke={PLUM} strokeWidth="1.2" opacity="0.95" />
      <path d="M120 40Q200 76 280 40" fill="#ffb3d6" stroke={PLUM} strokeWidth="1.2" />
      {/* shell sconces */}
      {[86, 314].map((x, i) => (
        <g key={x}>
          <circle cx={x} cy="100" r="22" fill="#fff6d6" opacity="0.45" className="pc-glow" style={{ animationDelay: `${i}s` }} />
          <path d={`M${x - 12} 108Q${x} 82 ${x + 12} 108Z`} fill="#ffd2e8" stroke={PLUM} strokeWidth="1.2" />
          <path d={`M${x} 106L${x - 6} 92M${x} 106V88M${x} 106L${x + 6} 92`} stroke={PLUM} strokeOpacity="0.3" />
          <rect x={x - 3} y="108" width="6" height="8" fill={`url(#${p}gold)`} />
        </g>
      ))}
      <Floor y0={216} a="#f8d9be" b="#fff" line="#b9804a" lineOp={0.18} />
      <ellipse cx="200" cy="300" rx="130" ry="40" fill="#e7d6fb" stroke="#fff" strokeWidth="4" />
      <ellipse cx="200" cy="300" rx="112" ry="32" fill="none" stroke="#ffc8e2" strokeWidth="2" strokeDasharray="4 6" />
      <Field seed={8} n={8} y0={50} y1={200} colors={["#fff", "#fff3c4"]} rMax={2.5} />
    </g>
  );
}

function CafeBG({ p }: { p: string }) {
  return (
    <g>
      <defs>
        <GoldDefs p={p} />
        <Lin id={`${p}sea`} stops={[[0, "#ffd6e6"], [0.45, "#ffe9d6"], [0.5, "#7ee6dc"], [1, "#22b8b0"]]} />
        <pattern id={`${p}tile`} width="16" height="16" patternUnits="userSpaceOnUse">
          <rect width="16" height="16" fill="#dff8f4" stroke="#fff" strokeWidth="1.4" />
          <path d="M3 10q5 -5 10 0" stroke="#9fe5dc" strokeWidth="1.2" fill="none" />
        </pattern>
        <pattern id={`${p}check`} width="40" height="40" patternUnits="userSpaceOnUse">
          <rect width="40" height="40" fill="#fff4fa" />
          <rect width="20" height="20" fill="#ffd2e8" />
          <rect x="20" y="20" width="20" height="20" fill="#ffd2e8" />
        </pattern>
      </defs>
      <rect x="-20" y="-20" width="440" height="250" fill={`url(#${p}tile)`} />
      {/* big window to the reef terrace */}
      <rect x="54" y="64" width="292" height="104" rx="14" fill={`url(#${p}sea)`} stroke={`url(#${p}gold)`} strokeWidth="6" />
      <Palm x={90} y={130} h={50} lean={6} />
      <Palm x={318} y={132} h={44} lean={-6} delay={1} />
      <path d="M54 150Q130 140 200 150Q270 160 346 148V168H54Z" fill="#5fd8cf" opacity="0.7" />
      <path d="M150 64V168M250 64V168" stroke="#fff" strokeWidth="3" opacity="0.8" />
      {/* awning */}
      <rect x="-20" y="34" width="440" height="14" fill="#fff" />
      {Array.from({ length: 16 }, (_, i) => (
        <path key={i} d={`M${-20 + i * 28} 34h28v16a14 14 0 0 1 -28 0z`} fill={i % 2 ? "#fff" : "#ff9fcb"} stroke={PLUM} strokeWidth="1.2" />
      ))}
      {/* shelves */}
      {[40, 304].map((x) => (
        <g key={x}>
          <rect x={x} y="182" width="56" height="5" rx="2" fill={`url(#${p}gold)`} />
          {[0, 1, 2].map((i) => (
            <g key={i}>
              <rect x={x + 6 + i * 17} y={166} width="11" height="16" rx="3" fill={["#ffc8e2", "#c9f5df", "#efe2ff"][i]} stroke={PLUM} strokeWidth="1" />
              <rect x={x + 7 + i * 17} y={163} width="9" height="4" rx="1.5" fill="#e3b07a" />
            </g>
          ))}
        </g>
      ))}
      {/* counter */}
      <rect x="-20" y="212" width="440" height="12" fill="#fbf2e6" stroke={PLUM} strokeWidth="1.4" />
      <rect x="-20" y="224" width="440" height="50" fill="#ffb3d6" stroke={PLUM} strokeWidth="1.4" />
      {Array.from({ length: 16 }, (_, i) => (
        <path key={i} d={`M${-12 + i * 28} 272v-30a10 10 0 0 1 20 0v30`} fill="#ffd2e8" stroke={PLUM} strokeOpacity="0.4" strokeWidth="1.2" />
      ))}
      <rect x="-20" y="272" width="440" height="128" fill={`url(#${p}check)`} />
      <rect x="-20" y="272" width="440" height="6" fill="#e9a3c6" opacity="0.6" />
      {/* pendant lamps */}
      {[110, 290].map((x, i) => (
        <g key={x}>
          <line x1={x} y1="48" x2={x} y2="68" stroke={PLUM} strokeWidth="1.2" />
          <path d={`M${x - 14} 82Q${x} 60 ${x + 14} 82Z`} fill="#e9c27a" stroke={PLUM} strokeWidth="1.2" />
          <ellipse cx={x} cy="88" rx="22" ry="8" fill="#fff3c4" opacity="0.6" className="pc-glow" style={{ animationDelay: `${i}s` }} />
        </g>
      ))}
    </g>
  );
}

function GrottoBG({ p }: { p: string }) {
  return (
    <g>
      <defs>
        <GoldDefs p={p} />
        <Lin id={`${p}cave`} stops={[[0, "#2c1838"], [0.6, "#5b2f58"], [1, "#8d5a68"]]} />
        <Lin id={`${p}floor`} stops={[[0, "#c9946a"], [0.3, "#f2d0a0"], [1, "#e0b383"]]} />
      </defs>
      <rect x="-20" y="-20" width="440" height="440" fill={`url(#${p}cave)`} />
      <path d="M-20 -20H420V60L400 50L388 92L370 58L350 80L330 40L310 76L290 52L270 96L250 54L228 78L208 46L188 84L168 52L146 74L126 44L104 88L86 54L64 80L44 50L24 90L4 56L-20 70Z" fill="#1d0f26" />
      {/* gold veins */}
      <path d="M20 120q40 -20 60 10t70 0M260 140q30 -30 70 -10t60 -6M40 200q30 10 50 -6" stroke="#e7bf73" strokeOpacity="0.55" strokeWidth="2" fill="none" />
      {/* wall crystals */}
      {[
        [40, 170, "#c9b0ff"],
        [360, 160, "#7ee6dc"],
        [74, 140, "#ffc8e2"],
      ].map(([x, y, c], i) => (
        <g key={i}>
          <path d={`M${x} ${y}l8 -26l8 26z`} fill={c as string} stroke={PLUM} strokeWidth="1" opacity="0.9" />
          <path d={`M${(x as number) + 10} ${y}l6 -18l6 18z`} fill={c as string} stroke={PLUM} strokeWidth="1" opacity="0.8" />
        </g>
      ))}
      {/* light rays */}
      <path d="M248 60L160 300H230Z" fill="#fff3c4" className="pc-ray" />
      <path d="M248 60L330 300H270Z" fill="#ffd2ea" className="pc-ray" style={{ animationDelay: "1.8s" }} />
      <Floor y0={232} a={`url(#${p}floor)`} b="#fff3d6" line="#8d5a3a" lineOp={0.15} />
      <ellipse cx="200" cy="300" rx="150" ry="26" fill="#fff6d6" opacity="0.35" />
      {/* string lights */}
      <path d="M-20 100Q100 140 200 110Q300 80 420 120" stroke="#e7bf73" strokeWidth="1.4" fill="none" />
      {Array.from({ length: 14 }, (_, i) => {
        const x = -10 + i * 31;
        const y = 100 + Math.round(Math.sin(i * 0.7) * 14);
        return <circle key={i} cx={x} cy={y + 14} r="3" fill={i % 2 ? "#fff3c4" : "#ffd2ea"} className="anim-twinkle" style={{ animationDelay: `${i * 0.2}s` }} />;
      })}
      <Field seed={21} n={26} y0={40} y1={380} colors={["#ffe3a3", "#fff", "#ffd2ea"]} rMax={3} />
    </g>
  );
}

function MoonBG({ p }: { p: string }) {
  return (
    <g>
      <defs>
        <GoldDefs p={p} />
        <Lin id={`${p}sky`} stops={[[0, "#1a1548"], [0.45, "#43307f"], [0.75, "#a35aa8"], [0.9, "#f0a2c4"]]} />
        <Lin id={`${p}sea`} stops={[[0, "#5b3d9a"], [1, "#2a6d8f"]]} />
        <Lin id={`${p}aur`} x2={1} y2={0} stops={[[0, "#7ee6dc", 0], [0.5, "#7ee6dc", 0.55], [1, "#c9b0ff", 0]]} />
      </defs>
      <rect x="-20" y="-20" width="440" height="250" fill={`url(#${p}sky)`} />
      <path d="M-20 90Q100 40 200 80T420 60" stroke={`url(#${p}aur)`} strokeWidth="26" fill="none" className="pc-glow" />
      <path d="M-20 130Q120 90 220 120T420 100" stroke={`url(#${p}aur)`} strokeWidth="14" fill="none" opacity="0.6" className="pc-glow" style={{ animationDelay: "1.5s" }} />
      <Field seed={31} n={34} y0={0} y1={190} colors={["#fff", "#fff3c4", "#efe2ff"]} rMax={3} />
      <circle cx="300" cy="80" r="44" fill="#fff3c4" opacity="0.12" />
      <path d="M306 46A34 34 0 1 0 306 114A42 42 0 0 1 306 46Z" fill="#fff4d6" stroke={PLUM} strokeWidth="1.2" />
      <circle cx="290" cy="74" r="4" fill="#f1d9a4" />
      <circle cx="286" cy="96" r="2.6" fill="#f1d9a4" />
      <rect x="-20" y="196" width="440" height="40" fill={`url(#${p}sea)`} />
      <path d="M286 200h28M280 210h40M290 220h22" stroke="#fff4d6" strokeWidth="2" opacity="0.6" />
      <Floor y0={232} a="#d9c3f2" b="#fff" line={PLUM} lineOp={0.16} />
      {/* railing */}
      <rect x="-20" y="208" width="440" height="5" rx="2" fill="#fff3d6" stroke={PLUM} strokeWidth="1" />
      {Array.from({ length: 22 }, (_, i) => (
        <g key={i}>
          <rect x={-14 + i * 20} y="213" width="5" height="20" rx="2" fill="#fff3d6" stroke={PLUM} strokeWidth="0.8" />
        </g>
      ))}
      {Array.from({ length: 11 }, (_, i) => (
        <Pearl key={i} x={-12 + i * 40} y={208} r={3.6} />
      ))}
      <Palm x={30} y={250} h={70} lean={10} frond="#7a68c4" frondDark="#5a4aa4" trunk="#a68ac4" />
      <Palm x={372} y={252} h={66} lean={-10} frond="#7a68c4" frondDark="#5a4aa4" trunk="#a68ac4" delay={1} />
    </g>
  );
}

function LagoonBG({ p }: { p: string }) {
  return (
    <g>
      <defs>
        <Lin id={`${p}sky`} stops={[[0, "#c9b0ff"], [0.5, "#ffc8dd"], [1, "#ffe6d0"]]} />
        <Lin id={`${p}water`} stops={[[0, "#9ff3e8"], [0.4, "#4fd1c7"], [1, "#1696a6"]]} />
      </defs>
      <rect x="-20" y="-20" width="440" height="160" fill={`url(#${p}sky)`} />
      <circle cx="300" cy="70" r="30" fill="#fff6e6" opacity="0.8" />
      <path d="M120 140Q170 112 230 140Z" fill="#7fd8b4" />
      <Palm x={176} y={130} h={36} lean={4} />
      <Palm x={196} y={132} h={30} lean={-4} delay={0.8} />
      <rect x="-20" y="136" width="440" height="284" fill={`url(#${p}water)`} />
      {Array.from({ length: 12 }, (_, i) => (
        <path key={i} d={`M${(i * 71) % 400} ${170 + ((i * 53) % 220)}q10 -5 20 0q10 5 20 0`} stroke="#fff" strokeOpacity="0.55" strokeWidth="2" fill="none" strokeLinecap="round" className="pc-pulse" style={{ animationDelay: `${i * 0.3}s` }} />
      ))}
      <path d="M-20 136H420" stroke="#fff" strokeWidth="2" opacity="0.7" />
      {/* pearly rocks */}
      {[
        [10, 200, 40],
        [400, 230, 46],
        [-10, 380, 60],
        [410, 390, 56],
        [60, 410, 30],
      ].map(([x, y, r], i) => (
        <g key={i}>
          <ellipse cx={x} cy={y} rx={r} ry={r * 0.7} fill={i % 2 ? "#f6dcea" : "#ead9f7"} stroke={PLUM} strokeWidth="1.4" />
          <ellipse cx={x - r * 0.3} cy={y - r * 0.3} rx={r * 0.35} ry={r * 0.18} fill="#fff" opacity="0.8" />
        </g>
      ))}
      {[
        [340, 300],
        [90, 260],
      ].map(([x, y]) => (
        <g key={x}>
          <path d={`M${x} ${y}a14 7 0 1 0 12 3l-12 -3z`} fill="#6fd1a8" stroke={PLUM} strokeWidth="1" />
          <circle cx={x + 6} cy={y - 3} r="4" fill="#ffb3d6" stroke={PLUM} strokeWidth="0.8" />
        </g>
      ))}
      <Bubbles pts={[[120, 340, 0], [160, 360, 1.2], [260, 330, 2.4], [300, 370, 0.6], [210, 380, 3]]} />
      <Palm x={20} y={210} h={90} lean={22} delay={0.4} />
      <Field seed={41} n={10} y0={150} y1={380} rMax={3} />
    </g>
  );
}

function ReefBG({ p }: { p: string }) {
  return (
    <g>
      <defs>
        <Lin id={`${p}deep`} stops={[[0, "#8ff0e5"], [0.45, "#2fb3b4"], [1, "#1d5c86"]]} />
        <Lin id={`${p}sand`} stops={[[0, "#f6e6c8"], [1, "#e6c99a"]]} />
      </defs>
      <rect x="-20" y="-20" width="440" height="440" fill={`url(#${p}deep)`} />
      {[60, 150, 250, 330].map((x, i) => (
        <path key={x} d={`M${x} -20L${x - 40} 400H${x + 10}Z`} fill="#fff" opacity="0.12" className="pc-ray" style={{ animationDelay: `${i * 0.9}s` }} />
      ))}
      {/* far kelp silhouettes */}
      {[20, 70, 120, 290, 340, 380].map((x, i) => (
        <path key={x} d={`M${x} 400C${x - 12} 320 ${x + 14} 260 ${x} ${150 + (i % 3) * 30}C${x + 8} 260 ${x + 4} 330 ${x + 10} 400Z`} fill="#1f8f88" opacity="0.5" className="pc-sway" style={{ animationDelay: `${i * 0.5}s` }} />
      ))}
      <path d="M-20 300Q80 280 200 296T420 290V420H-20Z" fill={`url(#${p}sand)`} />
      {/* coral */}
      {[
        [30, 300, "#ff8a73"],
        [370, 296, "#ff9fcb"],
        [200, 310, "#c9b0ff"],
      ].map(([x, y, c], i) => (
        <path key={i} d={`M${x} ${y}c-4 -16 -16 -20 -16 -36M${x} ${y}c0 -20 8 -28 4 -44M${x} ${y}c4 -12 16 -16 20 -32`} stroke={c as string} strokeWidth="6" strokeLinecap="round" fill="none" />
      ))}
      {[
        [60, 340],
        [330, 350],
        [250, 380],
      ].map(([x, y], i) => (
        <path key={i} d={star5Path(x, y, 8, 0.5)} fill={i % 2 ? "#ffd36e" : "#ff8a73"} stroke={PLUM} strokeWidth="1" strokeLinejoin="round" />
      ))}
      <g className="pc-bob">
        <path d="M280 120q14 -10 26 0q-12 10 -26 0zM306 120l9 -7v14z" fill="#ffd36e" stroke={PLUM} strokeWidth="1" />
        <path d="M110 180q10 -8 20 0q-10 8 -20 0zM130 180l7 -5v10z" fill="#ff9fcb" stroke={PLUM} strokeWidth="1" />
      </g>
      <Bubbles pts={[[80, 260, 0], [140, 300, 1.5], [240, 240, 0.8], [310, 280, 2.2], [360, 220, 3.1], [190, 200, 1]]} />
      <Field seed={51} n={10} y0={20} y1={300} colors={["#fff", "#d9fbf7"]} rMax={2.5} />
    </g>
  );
}

function BeachBG({ p }: { p: string }) {
  return (
    <g>
      <defs>
        <Lin id={`${p}sky`} stops={[[0, "#9ee9f0"], [0.6, "#ffd3e2"], [1, "#ffe9d6"]]} />
        <Lin id={`${p}sea`} stops={[[0, "#5fd8cf"], [1, "#2bb5c0"]]} />
        <Lin id={`${p}sand`} stops={[[0, "#fff1d6"], [1, "#f2cf98"]]} />
      </defs>
      <rect x="-20" y="-20" width="440" height="170" fill={`url(#${p}sky)`} />
      <circle cx="110" cy="80" r="26" fill="#fff6e6" />
      {[
        [250, 50],
        [320, 80],
      ].map(([x, y]) => (
        <g key={x} fill="#fff" opacity="0.9">
          <ellipse cx={x} cy={y} rx="22" ry="8" />
          <ellipse cx={x + 12} cy={y - 5} rx="12" ry="8" />
        </g>
      ))}
      <rect x="-20" y="146" width="440" height="56" fill={`url(#${p}sea)`} />
      <path d="M-20 146H420" stroke="#fff" strokeWidth="2" opacity="0.6" />
      {[160, 176, 190].map((y, i) => (
        <path key={y} d={`M${-20 + i * 30} ${y}q20 -6 40 0t40 0t40 0t40 0t40 0t40 0t40 0t40 0t40 0t40 0t40 0`} stroke="#fff" strokeOpacity="0.5" strokeWidth="1.6" fill="none" className="pc-pulse" style={{ animationDelay: `${i * 0.6}s` }} />
      ))}
      <path d="M-20 200Q60 192 140 202T300 198T420 200V420H-20Z" fill={`url(#${p}sand)`} />
      <path d="M-20 200Q60 192 140 202T300 198T420 200" stroke="#fff" strokeWidth="5" fill="none" opacity="0.9" />
      {[
        [80, 300],
        [220, 360],
        [330, 250],
        [150, 240],
      ].map(([x, y], i) => (
        <g key={i}>
          <path d={`M${x} ${y}l-7 8q2 6 7 6q5 0 7 -6z`} fill={i % 2 ? "#ffc8e2" : "#fff6ea"} stroke={PLUM} strokeWidth="1" />
          <path d={`M${x} ${y}v12M${x} ${y}l-4 11M${x} ${y}l4 11`} stroke={PLUM} strokeOpacity="0.3" strokeWidth="0.8" />
        </g>
      ))}
      {[120, 140, 160, 180].map((x, i) => (
        <ellipse key={x} cx={x + (i % 2) * 8} cy={330 + i * 14} rx="4" ry="6" fill="#e8c38a" opacity="0.6" />
      ))}
      <Palm x={18} y={260} h={130} lean={26} delay={0.2} />
      <Palm x={390} y={240} h={110} lean={-22} delay={1.3} />
      <Frangipani x={300} y={380} r={7} rot={20} />
      <Field seed={61} n={8} y0={150} y1={200} rMax={2.4} />
    </g>
  );
}

function LoungeBG({ p }: { p: string }) {
  return (
    <g>
      <defs>
        <GoldDefs p={p} />
        <Lin id={`${p}wall`} stops={[[0, "#e5d6ff"], [1, "#c8b0f4"]]} />
        <Lin id={`${p}mir`} x2={1} y2={1} stops={[[0, "#f6fbff"], [0.5, "#d3dcf7"], [1, "#f3e2ff"]]} />
        <pattern id={`${p}tuft`} width="30" height="30" patternUnits="userSpaceOnUse">
          <path d="M0 15L15 0L30 15L15 30Z" fill="none" stroke="#b79be8" strokeWidth="1.2" />
          <circle cx="15" cy="15" r="1.6" fill="#fff" />
        </pattern>
      </defs>
      <rect x="-20" y="-20" width="440" height="250" fill={`url(#${p}wall)`} />
      <rect x="-20" y="-20" width="440" height="250" fill={`url(#${p}tuft)`} />
      <path d="M140 210V100Q140 44 200 44Q260 44 260 100V210Z" fill={`url(#${p}mir)`} stroke={`url(#${p}gold)`} strokeWidth="8" />
      <path d="M140 210V100Q140 44 200 44Q260 44 260 100V210Z" fill="none" stroke={PLUM} strokeWidth="1.4" />
      <path d="M160 180l60 -110M180 196l60 -110" stroke="#fff" strokeWidth="5" opacity="0.6" />
      {[130, 200, 270].map((x, i) => (
        <path key={x} d={`M${x} 40L${x - 12} 54Q${x - 10} 66 ${x} 68Q${x + 10} 66 ${x + 12} 54Z`} fill="#ffd2e8" stroke={PLUM} strokeWidth="1" transform={`translate(0 ${i === 1 ? -14 : 0})`} />
      ))}
      {[90, 310].map((x, i) => (
        <g key={x}>
          <line x1={x} y1="-20" x2={x} y2="40" stroke="#e7bf73" strokeWidth="1.4" />
          <path d={`M${x - 22} 46Q${x} 64 ${x + 22} 46`} fill="none" stroke={`url(#${p}gold)`} strokeWidth="3" />
          {[-22, -11, 0, 11, 22].map((dx, j) => (
            <g key={dx}>
              <line x1={x + dx} y1={46 + (j === 2 ? 9 : j % 2 ? 6 : 0)} x2={x + dx} y2={54 + (j === 2 ? 9 : j % 2 ? 6 : 0)} stroke="#fff" strokeWidth="1" />
              <circle cx={x + dx} cy={56 + (j === 2 ? 9 : j % 2 ? 6 : 0)} r="3" fill="#fff7fb" stroke={PLUM} strokeWidth="0.7" />
            </g>
          ))}
          <circle cx={x} cy="60" r="30" fill="#fff6d6" opacity="0.35" className="pc-glow" style={{ animationDelay: `${i}s` }} />
        </g>
      ))}
      <Floor y0={222} a="#ead7f4" b="#fff" line="#a07cc8" lineOp={0.2} />
      {/* potted palms */}
      {[40, 360].map((x) => (
        <g key={x}>
          <path d={`M${x - 16} 226h32l-4 22h-24z`} fill="#fffaf2" stroke={PLUM} strokeWidth="1.2" />
          <path d={`M${x} 226c-14 -20 -16 -50 -6 -70M${x} 226c6 -24 18 -40 30 -50M${x} 226c-6 -20 -24 -34 -34 -38`} stroke="#5cc79a" strokeWidth="5" fill="none" strokeLinecap="round" />
        </g>
      ))}

      <Field seed={71} n={10} y0={20} y1={220} colors={["#fff", "#fff3c4"]} rMax={2.5} />
    </g>
  );
}

function KPoolBG({ p }: { p: string }) {
  return (
    <g>
      <defs>
        <GoldDefs p={p} />
        <Lin id={`${p}sky`} stops={[[0, "#a6ecf0"], [1, "#ffe6d6"]]} />
        <Lin id={`${p}pool`} stops={[[0, "#8ff0e5"], [0.5, "#34c4ba"], [1, "#139aae"]]} />
        <Lin id={`${p}stone`} stops={[[0, "#f6e4cd"], [1, "#e9cdae"]]} />
        <Lin id={`${p}thatch`} stops={[[0, "#f3d79a"], [1, "#c48f48"]]} />
      </defs>
      <rect x="-20" y="-20" width="440" height="140" fill={`url(#${p}sky)`} />
      <Palm x={60} y={120} h={100} lean={10} />
      <Palm x={340} y={120} h={96} lean={-12} delay={1} />
      {/* back pavilion */}
      <rect x="110" y="70" width="180" height="50" fill="#f6e2cb" />
      <path d="M90 76L140 30H260L310 76Z" fill={`url(#${p}thatch)`} stroke={PLUM} strokeWidth="1.4" strokeLinejoin="round" />
      {Array.from({ length: 18 }, (_, i) => (
        <line key={i} x1={96 + i * 12} y1="74" x2={140 + i * 7} y2="34" stroke="#9d7330" strokeOpacity="0.4" strokeWidth="1" />
      ))}
      {[116, 284].map((x) => (
        <rect key={x} x={x - 4} y="76" width="8" height="46" fill="#c48a55" stroke={PLUM} strokeWidth="0.8" />
      ))}
      <rect x="-20" y="118" width="440" height="22" fill={`url(#${p}stone)`} stroke={PLUM} strokeWidth="1" strokeOpacity="0.4" />
      {/* pool */}
      <rect x="-20" y="138" width="440" height="200" fill={`url(#${p}pool)`} />
      {Array.from({ length: 6 }, (_, i) => (
        <line key={i} x1="-20" y1={170 + i * 30} x2="420" y2={170 + i * 30} stroke="#fff" strokeOpacity="0.15" strokeWidth="1" />
      ))}
      {Array.from({ length: 14 }, (_, i) => (
        <path key={i} d={`M${(i * 67) % 400} ${160 + ((i * 41) % 160)}q10 -6 20 0q10 6 20 0`} stroke="#fff" strokeOpacity="0.55" strokeWidth="2" fill="none" strokeLinecap="round" className="pc-pulse" style={{ animationDelay: `${i * 0.25}s` }} />
      ))}
      <rect x="-20" y="138" width="440" height="6" fill="#fff" opacity="0.6" />
      {/* deck */}
      <rect x="-20" y="330" width="440" height="90" fill={`url(#${p}stone)`} />
      <rect x="-20" y="330" width="440" height="8" fill="#fffaf2" stroke={PLUM} strokeWidth="1" strokeOpacity="0.5" />
      {Array.from({ length: 12 }, (_, i) => (
        <line key={i} x1={-20 + i * 40} y1="338" x2={-40 + i * 44} y2="420" stroke="#d9b48a" strokeWidth="1" />
      ))}
      <Frangipani x={40} y={370} r={9} />
      <Frangipani x={66} y={384} r={7} rot={30} />
      <Frangipani x={350} y={376} r={8} rot={50} />
      <Field seed={81} n={10} y0={150} y1={320} rMax={3} />
    </g>
  );
}

function KStudioBG({ p }: { p: string }) {
  return (
    <g>
      <defs>
        <Lin id={`${p}wall`} stops={[[0, "#f6e2cb"], [1, "#ecd0b0"]]} />
        <Lin id={`${p}view`} stops={[[0, "#a6ecf0"], [1, "#d9fbf7"]]} />
        <Lin id={`${p}floor`} stops={[[0, "#e3b07a"], [1, "#c48a55"]]} />
      </defs>
      <rect x="-20" y="-20" width="440" height="250" fill={`url(#${p}wall)`} />
      {Array.from({ length: 23 }, (_, i) => (
        <line key={i} x1={-20 + i * 20} y1="-20" x2={-20 + i * 20} y2="230" stroke="#d9b48a" strokeWidth="2" />
      ))}
      <rect x="100" y="50" width="200" height="110" rx="10" fill={`url(#${p}view)`} stroke="#b9804a" strokeWidth="6" />
      <Palm x={150} y={160} h={80} lean={8} />
      <Palm x={250} y={160} h={70} lean={-8} delay={1.2} />
      <path d="M100 140Q200 120 300 142V160H100Z" fill="#7fd8b4" />
      <path d="M200 50V160" stroke="#b9804a" strokeWidth="4" />
      {[40, 360].map((x) => (
        <g key={x}>
          <line x1={x} y1="-20" x2={x} y2="40" stroke={PLUM} strokeWidth="1" />
          <path d={`M${x - 16} 54h32l-4 18h-24z`} fill="#e7b48f" stroke={PLUM} strokeWidth="1.2" />
          <path d={`M${x - 14} 54c-8 10 -10 30 -6 40M${x} 54c0 14 2 30 0 42M${x + 14} 54c8 10 8 28 4 38`} stroke="#5cc79a" strokeWidth="4" fill="none" strokeLinecap="round" />
        </g>
      ))}
      <rect x="330" y="80" width="80" height="130" fill="#eef4ff" stroke="#b9804a" strokeWidth="4" />
      <path d="M340 190l40 -80M356 200l40 -80" stroke="#fff" strokeWidth="4" opacity="0.7" />
      <Floor y0={214} a={`url(#${p}floor)`} b="#f6d3a8" line="#7a4a24" lineOp={0.2} rows={[14, 34, 62, 100, 150]} />
      <Field seed={91} n={6} y0={40} y1={200} colors={["#fff"]} rMax={2.4} />
    </g>
  );
}

function KGymBG({ p }: { p: string }) {
  return (
    <g>
      <defs>
        <GoldDefs p={p} />
        <Lin id={`${p}wall`} stops={[[0, "#ffe7f1"], [1, "#ffd2e4"]]} />
        <Lin id={`${p}mir`} x2={1} y2={1} stops={[[0, "#f6fbff"], [0.5, "#dbe3f8"], [1, "#f3e8ff"]]} />
      </defs>
      <rect x="-20" y="-20" width="440" height="250" fill={`url(#${p}wall)`} />
      <rect x="-20" y="190" width="440" height="30" fill="#fff4fa" />
      <rect x="70" y="56" width="260" height="134" rx="8" fill={`url(#${p}mir)`} stroke={`url(#${p}gold)`} strokeWidth="6" />
      <path d="M100 180l70 -120M130 186l70 -120M240 186l60 -110" stroke="#fff" strokeWidth="6" opacity="0.6" />
      <g transform="translate(200 34)">
        <rect x="-26" y="-3" width="52" height="6" rx="3" fill={`url(#${p}gold)`} />
        <rect x="-34" y="-11" width="10" height="22" rx="3" fill="#ff9fcb" stroke={PLUM} strokeWidth="1" />
        <rect x="24" y="-11" width="10" height="22" rx="3" fill="#ff9fcb" stroke={PLUM} strokeWidth="1" />
      </g>
      {[30, 370].map((x) => (
        <g key={x}>
          <path d={`M${x - 16} 200h32l-4 22h-24z`} fill="#fffaf2" stroke={PLUM} strokeWidth="1.2" />
          <path d={`M${x} 200c-14 -20 -16 -50 -6 -70M${x} 200c6 -24 18 -40 30 -50M${x} 200c-6 -20 -24 -34 -34 -38`} stroke="#5cc79a" strokeWidth="5" fill="none" strokeLinecap="round" />
        </g>
      ))}
      <Floor y0={220} a="#dccbfb" b="#fff" line="#8f6bf0" lineOp={0.18} />
      <ellipse cx="200" cy="320" rx="150" ry="36" fill="#c9b0ff" opacity="0.5" />
      <Field seed={101} n={6} y0={40} y1={200} rMax={2.4} />
    </g>
  );
}

function KSoundBG({ p }: { p: string }) {
  return (
    <g>
      <defs>
        <GoldDefs p={p} />
        <Lin id={`${p}wall`} stops={[[0, "#3c2f6e"], [0.6, "#6c4fa0"], [1, "#a77cc0"]]} />
        <Lin id={`${p}beam`} stops={[[0, "#fff6e6", 0.85], [1, "#fff6e6", 0]]} />
      </defs>
      <rect x="-20" y="-20" width="440" height="250" fill={`url(#${p}wall)`} />
      {/* drapes */}
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <path key={i} d={`M${-20 + i * 55} -20q14 120 0 250h28q-12 -130 0 -250z`} fill="#8a6bc0" opacity="0.4" />
      ))}
      <ellipse cx="200" cy="20" rx="56" ry="18" fill="#fff6e6" stroke={`url(#${p}gold)`} strokeWidth="4" />
      <path d="M150 24L90 330H310L250 24Z" fill={`url(#${p}beam)`} className="pc-ray" />
      {/* shelves with crystals and candles */}
      {[48, 352].map((x, i) => (
        <g key={x}>
          <rect x={x - 34} y="150" width="68" height="5" rx="2" fill={`url(#${p}gold)`} />
          <path d={`M${x - 20} 150l6 -20l6 20z`} fill="#c9b0ff" stroke={PLUM} strokeWidth="1" />
          <path d={`M${x - 6} 150l5 -14l5 14z`} fill="#7ee6dc" stroke={PLUM} strokeWidth="1" />
          <rect x={x + 10} y="136" width="8" height="14" rx="2" fill="#fff6ea" stroke={PLUM} strokeWidth="0.8" />
          <ellipse cx={x + 14} cy="132" rx="3" ry="5" fill="#ffcf6e" className="pc-pulse" style={{ animationDelay: `${i * 0.5}s` }} />
          <circle cx={x + 14} cy="132" r="14" fill="#ffcf6e" opacity="0.2" />
        </g>
      ))}
      <Floor y0={224} a="#9c7ab8" b="#c9a8e0" line="#fff" lineOp={0.12} />
      <ellipse cx="200" cy="320" rx="160" ry="44" fill="#d9c6f5" opacity="0.55" />
      <ellipse cx="200" cy="320" rx="140" ry="36" fill="none" stroke="#fff6e6" strokeWidth="2" strokeDasharray="4 6" opacity="0.7" />
      {/* floor cushions */}
      {[60, 340].map((x, i) => (
        <g key={x}>
          <ellipse cx={x} cy="300" rx="34" ry="12" fill={i ? "#ffc8e2" : "#bdeee6"} stroke={PLUM} strokeWidth="1.2" />
          <ellipse cx={x} cy="296" rx="26" ry="7" fill="#fff" opacity="0.35" />
        </g>
      ))}
      <Field seed={111} n={16} y0={30} y1={220} colors={["#fff", "#efe2ff", "#fff3c4"]} rMax={2.6} />
    </g>
  );
}

function KCoworkBG({ p }: { p: string }) {
  return (
    <g>
      <defs>
        <Lin id={`${p}wall`} stops={[[0, "#fbefd9"], [1, "#f1dcbc"]]} />
        <Lin id={`${p}view`} stops={[[0, "#a6ecf0"], [1, "#e4fbf7"]]} />
        <Lin id={`${p}floor`} stops={[[0, "#e3b07a"], [1, "#c48a55"]]} />
        <pattern id={`${p}weave`} width="12" height="12" patternUnits="userSpaceOnUse">
          <rect width="12" height="12" fill="#ecd2a6" />
          <path d="M0 6h12M6 0v12" stroke="#d1b07c" strokeWidth="2.4" />
          <circle cx="6" cy="6" r="1.4" fill="#f6e2bf" />
        </pattern>
      </defs>
      <rect x="-20" y="-20" width="440" height="250" fill={`url(#${p}wall)`} />
      <rect x="-20" y="150" width="440" height="80" fill={`url(#${p}weave)`} />
      <rect x="-20" y="148" width="440" height="4" fill="#b9804a" />
      {[70, 200, 330].map((x) => (
        <g key={x}>
          <path d={`M${x - 44} 140V70Q${x - 44} 30 ${x} 30Q${x + 44} 30 ${x + 44} 70V140Z`} fill={`url(#${p}view)`} stroke="#b9804a" strokeWidth="5" />
          <Palm x={x} y={140} h={60} lean={x === 200 ? 4 : x < 200 ? 10 : -10} delay={x / 200} />
          <path d={`M${x - 44} 124Q${x} 114 ${x + 44} 124V140H${x - 44}Z`} fill="#7fd8b4" />
        </g>
      ))}
      {[136, 264].map((x, i) => (
        <g key={x}>
          <line x1={x} y1="-20" x2={x} y2="44" stroke={PLUM} strokeWidth="1" />
          <path d={`M${x - 20} 66Q${x} 30 ${x + 20} 66Z`} fill="#e8c592" stroke={PLUM} strokeWidth="1.2" />
          {[-12, -4, 4, 12].map((dx) => (
            <line key={dx} x1={x + dx} y1="64" x2={x + dx * 0.4} y2="42" stroke="#c9a06a" strokeWidth="1" />
          ))}
          <ellipse cx={x} cy="72" rx="24" ry="8" fill="#fff3c4" opacity="0.55" className="pc-glow" style={{ animationDelay: `${i}s` }} />
        </g>
      ))}
      <Floor y0={226} a={`url(#${p}floor)`} b="#f6d3a8" line="#7a4a24" lineOp={0.18} />
      <path d="M20 300c-10 -20 -8 -50 2 -64c6 14 6 40 -2 64zM20 300c12 -16 30 -24 42 -24c-10 12 -26 20 -42 24z" fill="#5cc79a" stroke={PLUM} strokeWidth="1" />
      <path d="M8 300h26l-4 26h-18z" fill="#e7b48f" stroke={PLUM} strokeWidth="1.2" />
      <Field seed={121} n={6} y0={30} y1={200} rMax={2.4} />
    </g>
  );
}

function KCafeBG({ p }: { p: string }) {
  return (
    <g>
      <defs>
        <GoldDefs p={p} />
        <Lin id={`${p}wall`} stops={[[0, "#e4f7f1"], [1, "#cdeee5"]]} />
        <Lin id={`${p}terra`} stops={[[0, "#e9997a"], [1, "#c9704f"]]} />
        <Lin id={`${p}pool`} stops={[[0, "#a6ecf0"], [0.5, "#ffe6d6"], [0.55, "#5fd8cf"], [1, "#2bb5c0"]]} />
      </defs>
      <rect x="-20" y="-20" width="440" height="250" fill={`url(#${p}wall)`} />
      {[40, 360].map((x) => (
        <g key={x}>
          <path d={`M${x - 36} 200V80Q${x - 36} 44 ${x} 44Q${x + 36} 44 ${x + 36} 80V200Z`} fill={`url(#${p}pool)`} stroke="#c48a55" strokeWidth="5" />
          <Palm x={x} y={130} h={50} lean={x < 200 ? 6 : -6} delay={x / 300} />
        </g>
      ))}
      {/* shelves */}
      {[90, 140].map((y) => (
        <g key={y}>
          <rect x="110" y={y} width="180" height="6" rx="2" fill="#c48a55" stroke={PLUM} strokeWidth="0.8" />
          {Array.from({ length: 7 }, (_, i) => (
            <g key={i}>
              <rect x={120 + i * 24} y={y - 20} width="14" height="20" rx="4" fill={["#c9f5df", "#ffc8e2", "#fff6ea", "#efe2ff"][i % 4]} stroke={PLUM} strokeWidth="1" />
              <rect x={121 + i * 24} y={y - 23} width="12" height="5" rx="2" fill="#e3b07a" />
            </g>
          ))}
        </g>
      ))}
      <rect x="150" y="160" width="100" height="40" rx="6" fill="#5d4a6e" stroke={`url(#${p}gold)`} strokeWidth="3" />
      <path d="M162 172h40M162 182h60M162 192h30" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" opacity="0.85" />
      {/* counter */}
      <rect x="-20" y="214" width="440" height="12" fill="#fff6ea" stroke={PLUM} strokeWidth="1.4" />
      <rect x="-20" y="226" width="440" height="56" fill={`url(#${p}terra)`} stroke={PLUM} strokeWidth="1.4" />
      {Array.from({ length: 22 }, (_, i) => (
        <line key={i} x1={-12 + i * 20} y1="230" x2={-12 + i * 20} y2="278" stroke="#fff" strokeOpacity="0.25" strokeWidth="3" />
      ))}
      <Floor y0={282} a="#f3dcc3" b="#fff" line="#c48a55" lineOp={0.22} rows={[10, 26, 50, 84]} />
      {[100, 300].map((x, i) => (
        <g key={x}>
          <line x1={x} y1="-20" x2={x} y2="30" stroke={PLUM} strokeWidth="1" />
          <path d={`M${x - 14} 44Q${x} 22 ${x + 14} 44Z`} fill="#e9c27a" stroke={PLUM} strokeWidth="1.2" />
          <ellipse cx={x} cy="50" rx="22" ry="8" fill="#fff3c4" opacity="0.6" className="pc-glow" style={{ animationDelay: `${i}s` }} />
        </g>
      ))}
      <Frangipani x={300} y={210} r={6} />
    </g>
  );
}

// Painted backdrops (Higgsfield, stored in the production `art` bucket). The drawn SVG scene stays
// underneath as a fallback until the painting has loaded, or if it never does.
const PAINTED_VERSION = 1;
const PAINTED = new Set(["palace", "cafe", "grotto", "moon_deck", "lagoon", "reef", "beach", "lounge", "kairos_pool", "kairos_studio", "kairos_gym", "kairos_sound", "kairos_cowork", "kairos_cafe"]);
export const paintedUrl = (locationId: string) =>
  PAINTED.has(locationId) ? `https://ogvydqsynyksgbymptzm.supabase.co/storage/v1/object/public/art/scenes/${locationId}.jpg?v=${PAINTED_VERSION}` : null;

const BACKDROPS: Record<string, (props: { p: string }) => ReactNode> = {
  palace: PalaceBG,
  cafe: CafeBG,
  grotto: GrottoBG,
  moon_deck: MoonBG,
  lagoon: LagoonBG,
  reef: ReefBG,
  beach: BeachBG,
  lounge: LoungeBG,
  kairos_pool: KPoolBG,
  kairos_studio: KStudioBG,
  kairos_gym: KGymBG,
  kairos_sound: KSoundBG,
  kairos_cowork: KCoworkBG,
  kairos_cafe: KCafeBG,
};

/* =================================================================== */
/* Hotspots                                                             */
/* =================================================================== */

const SCENE_CSS = `
.pcs-hot { position: absolute; width: 56px; height: 56px; transform: translate(-50%, -50%); display: grid; place-items: center; border-radius: 50%; -webkit-tap-highlight-color: transparent; cursor: pointer; z-index: 3; }
.pcs-hot:focus-visible { outline: none; }
.pcs-hot:focus-visible .pcs-ring { box-shadow: 0 0 0 3px #fff, 0 0 0 6px #f76fae, 0 0 18px 6px rgba(255,255,255,.9); }
.pcs-ring { position: absolute; inset: 7px; border-radius: 50%; border: 3px solid #fff; background: radial-gradient(circle, rgba(255,255,255,0) 46%, rgba(255,226,242,.45) 70%, rgba(255,255,255,.7) 100%); box-shadow: 0 0 0 2px rgba(230,75,147,.75), 0 0 14px 4px rgba(255,255,255,.85), inset 0 0 8px rgba(255,200,230,.9); animation: pcsPulse 2.2s ease-in-out infinite; }
.pcs-hot:hover .pcs-ring, .pcs-hot:active .pcs-ring { transform: scale(1.12); }
.pcs-pearl { position: absolute; width: 9px; height: 9px; border-radius: 50%; background: radial-gradient(circle at 35% 30%, #fff 0 30%, #ffe1f0 60%, #e9b6d6 100%); box-shadow: 0 0 0 1px rgba(107,58,94,.45); }
.pcs-label { position: absolute; top: 50px; left: 50%; transform: translateX(-50%); width: max-content; max-width: min(42cqw, 190px); text-align: center; font-family: var(--font-display), ui-rounded, system-ui, sans-serif; font-weight: 600; font-size: 12px; line-height: 1.15; color: #6b3a5e; background: rgba(255,250,253,.95); border: 1.5px solid #ffc0de; border-radius: 999px; padding: 4px 10px; box-shadow: 0 3px 8px -3px rgba(107,58,94,.45), inset 0 1px 0 #fff; pointer-events: none; }
.pcs-hot.lb-above .pcs-label { top: auto; bottom: 50px; }
.pcs-hot.al-left .pcs-label { left: 0; transform: none; }
.pcs-hot.al-right .pcs-label { left: auto; right: 0; transform: none; }
.pcs-badge { position: absolute; top: 0; right: -6px; min-width: 22px; padding: 1px 6px; border-radius: 999px; background: #6b3a5e; color: #fff; font-family: var(--font-display), ui-rounded, system-ui, sans-serif; font-size: 11px; font-weight: 600; line-height: 16px; border: 1.5px solid #fff; box-shadow: 0 2px 4px rgba(107,58,94,.4); pointer-events: none; }
.pcs-hot[aria-disabled="true"] { cursor: default; }
.pcs-hot[aria-disabled="true"] .pcs-ring { animation: none; filter: grayscale(.7); opacity: .55; border-style: dashed; }
.pcs-hot[aria-disabled="true"] .pcs-label { opacity: .75; }
@keyframes pcsPulse { 0%,100% { transform: scale(1); opacity: .9; } 50% { transform: scale(1.08); opacity: 1; } }
@media (prefers-reduced-motion: reduce) { .pcs-ring { animation: none !important; } }
`;

function Hotspot({ h, above, onHotspot }: { h: { id: string; label: string; x: number; y: number; disabled?: boolean; badge?: string }; above?: boolean; onHotspot: (id: string) => void }) {
  const align = h.x > 72 ? " al-right" : h.x < 24 ? " al-left" : "";
  return (
    <button
      type="button"
      className={`pcs-hot${align}${above ? " lb-above" : ""}`}
      style={{ left: `${h.x}%`, top: `${h.y}%` }}
      aria-label={h.badge ? `${h.label} (${h.badge})` : h.label}
      aria-disabled={h.disabled || undefined}
      onClick={() => {
        if (!h.disabled) onHotspot(h.id);
      }}
    >
      <span className="pcs-ring" />
      <span className="pcs-pearl" style={{ top: 3, left: 23.5 }} />
      <span className="pcs-pearl" style={{ bottom: 3, left: 23.5 }} />
      <span className="pcs-pearl" style={{ left: 3, top: 23.5 }} />
      <span className="pcs-pearl" style={{ right: 3, top: 23.5 }} />
      <svg viewBox="-10 -10 20 20" width="14" height="14" aria-hidden style={{ position: "relative", filter: "drop-shadow(0 0 3px #fff)" }}>
        <path d={starPath(0, 0, 9)} fill={h.disabled ? "#d9cbe0" : "#fff"} />
      </svg>
      <span className="pcs-label">{h.label}</span>
      {h.badge && <span className="pcs-badge">{h.badge}</span>}
    </button>
  );
}

/* =================================================================== */
/* LocationScene                                                        */
/* =================================================================== */

export function LocationScene({
  locationId,
  children,
  hotspots,
  onHotspot,
}: {
  locationId: string;
  children?: ReactNode;
  hotspots: { id: string; label: string; x: number; y: number; disabled?: boolean; badge?: string }[];
  onHotspot: (id: string) => void;
}) {
  const p = useArtId("ls");
  const BG = BACKDROPS[locationId] ?? PalaceBG;
  const painting = paintedUrl(locationId);
  const [loaded, setLoaded] = useState<string | null>(null);
  const showPainting = painting !== null && loaded === painting;
  const hotIds = new Set(hotspots.map((h) => h.id));
  const acts = ACTIVITIES.filter((a) => a.locationId === locationId && (!a.adultOnly || hotIds.has(a.id)));
  // Greedy label placement: each pill goes below its ring unless that collides with an
  // already-placed pill or ring, in which case it flips above. Estimated on a 360 x 480 box.
  const labelAbove = new Set<string>();
  {
    type Box = { x0: number; y0: number; x1: number; y1: number };
    const W = 360;
    const H = 480;
    const placed: Box[] = hotspots.map((h) => ({ x0: (h.x / 100) * W - 22, y0: (h.y / 100) * H - 22, x1: (h.x / 100) * W + 22, y1: (h.y / 100) * H + 22 }));
    const hit = (b: Box) => placed.reduce((n, o) => n + Math.max(0, Math.min(b.x1, o.x1) - Math.max(b.x0, o.x0)) * Math.max(0, Math.min(b.y1, o.y1) - Math.max(b.y0, o.y0)), 0);
    [...hotspots]
      .sort((p1, p2) => p2.y - p1.y)
      .forEach((h) => {
        const lw = Math.min(h.label.length * 6.3 + 22, 150);
        const lines = h.label.length * 6.3 + 22 > 150 ? 2 : 1;
        const lh = lines * 14 + 9;
        const cx = (h.x / 100) * W;
        const cy = (h.y / 100) * H;
        const x0 = h.x > 72 ? cx + 28 - lw : h.x < 24 ? cx - 28 : cx - lw / 2;
        const below: Box = { x0, x1: x0 + lw, y0: cy + 22, y1: cy + 22 + lh };
        const above: Box = { x0, x1: x0 + lw, y0: cy - 22 - lh, y1: cy - 22 };
        const useAbove = hit(above) < hit(below) && above.y0 > 4;
        if (useAbove) labelAbove.add(h.id);
        placed.push(useAbove ? above : below);
      });
  }
  return (
    <div
      className="relative w-full select-none overflow-hidden aspect-[3/4] md:aspect-[4/3]"
      style={{ containerType: "size", borderRadius: 28, background: "#ffe9f4", boxShadow: "inset 0 0 0 3px rgba(255,255,255,.8)" }}
    >
      <ArtKeyframes />
      <style>{SCENE_CSS}</style>
      <svg viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" className="absolute inset-0 block" aria-hidden>
        <BG p={p} />
      </svg>
      {painting && (
        // eslint-disable-next-line @next/next/no-img-element -- static public art; next/image adds nothing here
        <img
          src={painting}
          alt=""
          aria-hidden
          decoding="async"
          ref={(el) => {
            if (el?.complete && el.naturalWidth > 0 && loaded !== painting) setLoaded(painting);
          }}
          onLoad={() => setLoaded(painting)}
          className="absolute inset-0 block h-full w-full object-cover transition-opacity duration-500"
          style={{ opacity: showPainting ? 1 : 0 }}
        />
      )}
      {!showPainting && acts.map((a) => <SceneObject key={a.id} activityId={a.id} x={a.spot.x} y={a.spot.y} />)}
      <div className="pointer-events-none absolute inset-0" style={{ zIndex: 2 }}>
        {children}
      </div>
      <div aria-hidden className="pointer-events-none absolute inset-0" style={{ zIndex: 2, borderRadius: 28, boxShadow: "inset 0 0 0 3px rgba(255,255,255,.85), inset 0 0 24px rgba(107,58,94,.18)" }} />
      {hotspots.map((h) => (
        <Hotspot key={h.id} h={h} above={labelAbove.has(h.id)} onHotspot={onHotspot} />
      ))}
    </div>
  );
}
