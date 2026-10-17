"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Glint, PLUM, Palm, Pearl, Sparkles, lobedPath, rng, star5Path, starPath, useArtId } from "./Sparkles";

/* ---------------- geometry helpers ---------------- */

type Wedge = { rot: number; L: number; hw: number; b: number; phi: number };

const r2 = (n: number) => Math.round(n * 100) / 100;

function ellipseR(phi: number, rx: number, ry: number) {
  return 1 / Math.sqrt((Math.sin(phi) / rx) ** 2 + (Math.cos(phi) / ry) ** 2);
}

/** Radiating scallop wedges around a hinge. dir 1 = fan opens downward, -1 = upward. */
function makeFan(rx: number, ry: number, n: number, spanDeg: number, dir: 1 | -1): Wedge[] {
  const span = (spanDeg * Math.PI) / 180;
  const step = span / n;
  return Array.from({ length: n }, (_, k) => {
    const phi = -span / 2 + step * (k + 0.5);
    const L = ellipseR(phi, rx, ry);
    const hw = L * Math.tan(step / 2) * 1.03;
    const deg = (phi * 180) / Math.PI;
    return { phi, L: r2(L), hw: r2(hw), b: r2(hw * 0.62), rot: r2(dir === 1 ? -deg : 180 + deg) };
  });
}

function wedgeD(w: Wedge) {
  const { L, hw, b } = w;
  return `M0 0L${-hw} ${L}C${-hw * 0.55} ${L + b * 1.35} ${hw * 0.55} ${L + b * 1.35} ${hw} ${L}Z`;
}

function rot(x: number, y: number, deg: number): [number, number] {
  const a = (deg * Math.PI) / 180;
  return [r2(x * Math.cos(a) - y * Math.sin(a)), r2(x * Math.sin(a) + y * Math.cos(a))];
}

/** Outer outline of the fan (hinge + all scallop lobes). */
function fanOutline(hx: number, hy: number, wedges: Wedge[]) {
  let d = `M${hx} ${hy}`;
  wedges.forEach((w) => {
    const pt = (x: number, y: number) => {
      const [rx, ry] = rot(x, y, w.rot);
      return `${(hx + rx).toFixed(1)} ${(hy + ry).toFixed(1)}`;
    };
    d += `L${pt(-w.hw, w.L)}C${pt(-w.hw * 0.55, w.L + w.b * 1.35)} ${pt(w.hw * 0.55, w.L + w.b * 1.35)} ${pt(w.hw, w.L)}`;
  });
  return d + "Z";
}

function valleyPoints(hx: number, hy: number, wedges: Wedge[]) {
  const pts: [number, number][] = [];
  wedges.forEach((w) => {
    const [x, y] = rot(w.hw, w.L, w.rot);
    pts.push([r2(hx + x), r2(hy + y)]);
  });
  pts.pop();
  return pts;
}

/* ---------------- constants ---------------- */

const LID_RATIO = 0.95; // lid height / width
const BASE_RATIO = 680 / 520; // base height / width
const HINGE_OPEN = 0.46; // open lid (mirror) height / width
const LID_W = 520;
const LID_H = 494;

const FRONT_H: [number, number] = [260, 44];
const FRONT_FAN = makeFan(236, 398, 11, 154, 1);

/* ---------------- lid outer face ---------------- */

function LidFront() {
  const id = useArtId("lid");
  const [hx, hy] = FRONT_H;
  const outline = fanOutline(hx, hy, FRONT_FAN);
  const valleys = valleyPoints(hx, hy, FRONT_FAN);
  const r = rng(7);
  const surfaceGlints = Array.from({ length: 7 }, () => ({ x: 90 + r() * 340, y: 120 + r() * 300, s: 4 + r() * 6, d: r() * 3 }));
  return (
    <svg viewBox={`0 0 ${LID_W} ${LID_H}`} width="100%" height="100%" style={{ overflow: "visible", display: "block" }} aria-hidden>
      <defs>
        <linearGradient id={`${id}-rib`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#f08ab9" />
          <stop offset="0.28" stopColor="#ffc2df" />
          <stop offset="0.5" stopColor="#ffeaf4" />
          <stop offset="0.72" stopColor="#ffc6e1" />
          <stop offset="1" stopColor="#ea84b5" />
        </linearGradient>
        <linearGradient id={`${id}-irid`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffb3d6" />
          <stop offset="0.3" stopColor="#c9b0ff" />
          <stop offset="0.55" stopColor="#7ee6dc" />
          <stop offset="0.78" stopColor="#fbe9c4" />
          <stop offset="1" stopColor="#ff9fcb" />
        </linearGradient>
        <radialGradient id={`${id}-gloss`} cx="0.36" cy="0.2" r="0.6">
          <stop offset="0" stopColor="#fff" stopOpacity="0.9" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-shade`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.45" stopColor="#c2559a" stopOpacity="0" />
          <stop offset="1" stopColor="#b44a8f" stopOpacity="0.35" />
        </linearGradient>
        <linearGradient id={`${id}-gold`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff3c9" />
          <stop offset="0.45" stopColor="#ecc77f" />
          <stop offset="0.75" stopColor="#bb8b3c" />
          <stop offset="1" stopColor="#f3d596" />
        </linearGradient>
        <linearGradient id={`${id}-band`} x1="0" x2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.85" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`${id}-cameo`} cx="0.4" cy="0.35" r="0.75">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.35" stopColor="#f3e6ff" />
          <stop offset="0.7" stopColor="#d8c4ff" />
          <stop offset="1" stopColor="#a8e9ef" />
        </radialGradient>
        <clipPath id={`${id}-clip`}>
          <path d={outline} />
        </clipPath>
      </defs>

      {/* ears */}
      <path d="M170 46Q172 18 198 14L322 14Q348 18 350 46L300 70L220 70Z" fill={`url(#${id}-rib)`} stroke={PLUM} strokeWidth="3" strokeLinejoin="round" />
      {[196, 214, 306, 324].map((x) => (
        <line key={x} x1={x} y1={20} x2={x < 260 ? x + 18 : x - 18} y2={58} stroke={PLUM} strokeOpacity="0.25" strokeWidth="2" />
      ))}

      {/* shell body */}
      <path d={outline} fill="#ffd0e6" />
      {FRONT_FAN.map((w, i) => (
        <path key={i} d={wedgeD(w)} transform={`translate(${hx} ${hy}) rotate(${w.rot})`} fill={`url(#${id}-rib)`} />
      ))}
      <g clipPath={`url(#${id}-clip)`}>
        <rect x="0" y="0" width={LID_W} height={LID_H} fill={`url(#${id}-irid)`} opacity="0.3" style={{ mixBlendMode: "multiply" }} />
        <rect x="0" y="0" width={LID_W} height={LID_H} fill={`url(#${id}-shade)`} />
        <rect x="0" y="0" width={LID_W} height={LID_H} fill={`url(#${id}-gloss)`} />
        {/* concentric growth lines */}
        {[0.42, 0.62, 0.8].map((t) => (
          <path
            key={t}
            d={fanOutline(hx, hy, FRONT_FAN.map((w) => ({ ...w, L: w.L * t, hw: w.hw * t, b: w.b * t })))}
            fill="none"
            stroke="#fff"
            strokeOpacity="0.55"
            strokeWidth="2"
          />
        ))}
        {/* grooves */}
        {valleys.map(([x, y], i) => (
          <g key={i}>
            <line x1={hx} y1={hy} x2={x} y2={y} stroke={PLUM} strokeOpacity="0.28" strokeWidth="2.2" />
            <line x1={hx + 3} y1={hy} x2={x + 3} y2={y} stroke="#fff" strokeOpacity="0.7" strokeWidth="1.4" />
          </g>
        ))}
        {/* pearlescent shimmer sweep */}
        <rect className="pc-shimmer" x="-60" y="-120" width="120" height="760" fill={`url(#${id}-band)`} />
      </g>
      <path d={outline} fill="none" stroke={PLUM} strokeWidth="3.5" strokeLinejoin="round" />
      <path d={outline} fill="none" stroke="#fff" strokeOpacity="0.6" strokeWidth="1.5" transform="translate(0 -3)" clipPath={`url(#${id}-clip)`} />

      {/* rim pearls */}
      {valleys.map(([x, y], i) => (
        <Pearl key={i} x={x} y={y} r={8} />
      ))}

      {/* cameo medallion */}
      <g>
        <ellipse cx="260" cy="262" rx="52" ry="60" fill="#c45b98" opacity="0.25" transform="translate(0 6)" />
        <ellipse cx="260" cy="258" rx="50" ry="58" fill={`url(#${id}-cameo)`} stroke={`url(#${id}-gold)`} strokeWidth="9" />
        <ellipse cx="260" cy="258" rx="54.5" ry="62.5" fill="none" stroke={PLUM} strokeWidth="2.5" />
        <ellipse cx="260" cy="258" rx="45" ry="53" fill="none" stroke={PLUM} strokeOpacity="0.4" strokeWidth="1.5" />
        <path d="M262 226A28 28 0 1 0 262 286A35 35 0 0 1 262 226Z" fill={`url(#${id}-gold)`} stroke={PLUM} strokeWidth="2" strokeLinejoin="round" transform="translate(4 2)" />
        <path d={star5Path(282, 240, 11)} fill="#fff3c9" stroke={PLUM} strokeWidth="1.6" strokeLinejoin="round" />
        <Glint x={286} y={278} r={6} />
        <ellipse cx="244" cy="226" rx="16" ry="7" fill="#fff" opacity="0.85" transform="rotate(-30 244 226)" />
        {[
          [260, 196, "#ff7fb6"],
          [260, 320, "#ff7fb6"],
          [206, 258, "#5fd8cf"],
          [314, 258, "#5fd8cf"],
        ].map(([x, y, c]) => (
          <g key={`${x}-${y}`}>
            <circle cx={x as number} cy={y as number} r="8" fill={c as string} stroke={PLUM} strokeWidth="2" />
            <circle cx={(x as number) - 2.5} cy={(y as number) - 2.5} r="2.6" fill="#fff" />
          </g>
        ))}
      </g>

      {/* surface glitter */}
      {surfaceGlints.map((g, i) => (
        <Glint key={i} x={g.x} y={g.y} r={g.s} delay={g.d} />
      ))}

      {/* clasp */}
      <g>
        <path d="M226 452Q260 440 294 452L290 478Q260 490 230 478Z" fill={`url(#${id}-gold)`} stroke={PLUM} strokeWidth="3" strokeLinejoin="round" />
        <path d="M260 476C250 466 242 460 248 454C252 450 258 452 260 457C262 452 268 450 272 454C278 460 270 466 260 476Z" fill="#ff7fb6" stroke={PLUM} strokeWidth="2" />
        <circle cx="255" cy="458" r="2.2" fill="#fff" />
      </g>
    </svg>
  );
}

/* ---------------- lid inner face (mirror) ---------------- */

function LidMirror() {
  const id = useArtId("mir");
  const outer = lobedPath(260, 494, 252, 252, 16, 1.1);
  const glass = lobedPath(260, 486, 196, 196, 14, 1.06);
  return (
    <svg viewBox={`0 0 ${LID_W} ${LID_H}`} width="100%" height="100%" style={{ overflow: "visible", display: "block" }} aria-hidden>
      <defs>
        <radialGradient id={`${id}-in`} cx="0.5" cy="1" r="0.9">
          <stop offset="0" stopColor="#ffe6f1" />
          <stop offset="0.55" stopColor="#ffb2d6" />
          <stop offset="1" stopColor="#ea7cb3" />
        </radialGradient>
        <linearGradient id={`${id}-irid`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#c9b0ff" stopOpacity="0.35" />
          <stop offset="0.5" stopColor="#7ee6dc" stopOpacity="0.2" />
          <stop offset="1" stopColor="#fbe9c4" stopOpacity="0.35" />
        </linearGradient>
        <linearGradient id={`${id}-glass`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f6fbff" />
          <stop offset="0.35" stopColor="#d6def8" />
          <stop offset="0.6" stopColor="#efe1ff" />
          <stop offset="0.85" stopColor="#c9eef0" />
          <stop offset="1" stopColor="#f3f7ff" />
        </linearGradient>
        <linearGradient id={`${id}-gold`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff3c9" />
          <stop offset="0.5" stopColor="#e7bf73" />
          <stop offset="1" stopColor="#b98a3a" />
        </linearGradient>
        <clipPath id={`${id}-half`}>
          <rect x="-20" y="0" width="560" height="490" />
        </clipPath>
        <clipPath id={`${id}-gclip`}>
          <path d={glass} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}-half)`}>
        <path d={outer} fill={`url(#${id}-in)`} />
        <path d={outer} fill={`url(#${id}-irid)`} />
        {Array.from({ length: 15 }, (_, i) => {
          const a = Math.PI * (1.04 + (i / 14) * 0.92);
          return <line key={i} x1="260" y1="490" x2={r2(260 + Math.cos(a) * 300)} y2={r2(490 + Math.sin(a) * 300)} stroke={PLUM} strokeOpacity="0.14" strokeWidth="2" />;
        })}
        <path d={outer} fill="none" stroke={PLUM} strokeWidth="3.5" strokeLinejoin="round" />
        <path d={glass} fill={`url(#${id}-glass)`} />
        <g clipPath={`url(#${id}-gclip)`}>
          <path d="M110 490L240 280L292 280L162 490Z" fill="#fff" opacity="0.6" />
          <path d="M190 490L312 296L330 296L208 490Z" fill="#fff" opacity="0.45" />
          <path d="M330 490L404 360L432 360L358 490Z" fill="#fff" opacity="0.3" />
          <path className="pc-shimmer-m" d="M-40 490L60 280L110 280L10 490Z" fill="#fff" opacity="0.8" />
        </g>
        <path d={glass} fill="none" stroke={`url(#${id}-gold)`} strokeWidth="8" strokeLinejoin="round" />
        <path d={glass} fill="none" stroke={PLUM} strokeWidth="2" strokeLinejoin="round" />
      </g>
      <path d="M8 490H512" stroke={PLUM} strokeWidth="3" />
      <Glint x={168} y={380} r={9} delay={0.2} />
      <Glint x={352} y={420} r={6} delay={1.1} />
      <Glint x={300} y={330} r={5} delay={1.8} fill="#fff6d0" />
    </svg>
  );
}

/* ---------------- base ---------------- */

const BASE_D = lobedPath(260, 334, 252, 318, 16, 1.1);
/** Box (in base viewBox units 520 x 660) that holds the 4:5 world map. */
const POCKET = { x: 36, y: 54, w: 448, h: 560 };
const RECESS_D = lobedPath(260, 334, 211, 263, 16, 1.1);
/** Same lobed shape in objectBoundingBox units, used to clip whatever sits in the pocket. */
const POCKET_CLIP_D = lobedPath(0.5, 0.5, 0.4725, 0.4725, 16, 1.1);

function BaseShell() {
  const id = useArtId("base");
  return (
    <svg viewBox="0 0 520 660" width="100%" height="100%" style={{ overflow: "visible", display: "block" }} aria-hidden>
      <defs>
        <radialGradient id={`${id}-body`} cx="0.5" cy="0.4" r="0.7">
          <stop offset="0.45" stopColor="#ffc2de" />
          <stop offset="0.8" stopColor="#ff97c6" />
          <stop offset="1" stopColor="#e5689f" />
        </radialGradient>
        <linearGradient id={`${id}-irid`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#c9b0ff" stopOpacity="0.4" />
          <stop offset="0.5" stopColor="#7ee6dc" stopOpacity="0.2" />
          <stop offset="1" stopColor="#fbe9c4" stopOpacity="0.45" />
        </linearGradient>
        <linearGradient id={`${id}-gold`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff3c9" />
          <stop offset="0.5" stopColor="#e7bf73" />
          <stop offset="1" stopColor="#b98a3a" />
        </linearGradient>
        <clipPath id={`${id}-clip`}>
          <path d={BASE_D} />
        </clipPath>
      </defs>
      <ellipse cx="260" cy="668" rx="230" ry="18" fill="#2a1240" opacity="0.35" />
      <path d={BASE_D} fill="#d9679f" transform="translate(0 10)" />
      <path d={BASE_D} fill={`url(#${id}-body)`} />
      <g clipPath={`url(#${id}-clip)`}>
        <rect width="520" height="680" fill={`url(#${id}-irid)`} />
        {Array.from({ length: 24 }, (_, i) => {
          const a = (i / 24) * Math.PI * 2;
          return <line key={i} x1={r2(260 + Math.cos(a) * 220)} y1={r2(334 + Math.sin(a) * 280)} x2={r2(260 + Math.cos(a) * 300)} y2={r2(334 + Math.sin(a) * 380)} stroke={PLUM} strokeOpacity="0.16" strokeWidth="2" />;
        })}
        <path className="pc-shimmer" d="M-60 -100h110v900h-110z" fill="#fff" opacity="0.35" />
        <ellipse cx="150" cy="70" rx="90" ry="22" fill="#fff" opacity="0.5" transform="rotate(-14 150 70)" />
      </g>
      <path d={BASE_D} fill="none" stroke={PLUM} strokeWidth="3.5" strokeLinejoin="round" />
      {/* recess the map sits in */}
      <path d={RECESS_D} fill={`url(#${id}-gold)`} stroke={PLUM} strokeWidth="2.5" transform="translate(260 334) scale(1.035) translate(-260 -334)" />
      <path d={RECESS_D} fill="#3a2766" />
      {/* clasp */}
      <g>
        <path d="M222 630Q260 618 298 630L292 664Q260 676 228 664Z" fill={`url(#${id}-gold)`} stroke={PLUM} strokeWidth="2.6" strokeLinejoin="round" />
        <rect x="244" y="638" width="32" height="16" rx="5" fill="#f6d590" stroke={PLUM} strokeWidth="1.6" />
        <circle cx="260" cy="646" r="5" fill="#ff7fb6" stroke={PLUM} strokeWidth="1.4" />
        <circle cx="258.5" cy="644.5" r="1.5" fill="#fff" />
      </g>
    </svg>
  );
}

/** Ring drawn over the map so its edge reads as set into the shell. */
function RecessRim() {
  const id = useArtId("rim");
  return (
    <svg viewBox="0 0 520 660" width="100%" height="100%" className="pointer-events-none absolute inset-0" style={{ overflow: "visible" }} aria-hidden>
      <defs>
        <linearGradient id={`${id}-gold`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff3c9" />
          <stop offset="0.5" stopColor="#e7bf73" />
          <stop offset="1" stopColor="#b98a3a" />
        </linearGradient>
        <clipPath id={`${id}-in`}>
          <path d={RECESS_D} />
        </clipPath>
        <filter id={`${id}-b`} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>
      <path d={RECESS_D} fill="none" stroke="#2a1240" strokeOpacity="0.55" strokeWidth="14" clipPath={`url(#${id}-in)`} filter={`url(#${id}-b)`} />
      <path d={RECESS_D} fill="none" stroke={`url(#${id}-gold)`} strokeWidth="5" strokeLinejoin="round" />
      <path d={RECESS_D} fill="none" stroke={PLUM} strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

/** Dusky violet night sky with stars and palms, to sit behind the compact (absolute, fills its parent). */
export function ShellNightSky({ className = "" }: { className?: string }) {
  const id = useArtId("sky");
  const r = rng(77);
  const stars = Array.from({ length: 46 }, () => ({ x: r2(r() * 100), y: r2(r() * 80), s: r2(0.25 + r() * 0.6), d: r2(r() * 3) }));
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" width="100%" height="100%" className="absolute inset-0">
        <defs>
          <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1c1546" />
            <stop offset="0.45" stopColor="#47307e" />
            <stop offset="0.8" stopColor="#a25aa6" />
            <stop offset="1" stopColor="#e98fbd" />
          </linearGradient>
          <radialGradient id={`${id}-glow`} cx="0.5" cy="0.55" r="0.5">
            <stop offset="0" stopColor="#ffd3ea" stopOpacity="0.55" />
            <stop offset="1" stopColor="#ffd3ea" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="100" height="100" fill={`url(#${id}-g)`} />
        <rect width="100" height="100" fill={`url(#${id}-glow)`} />
      </svg>
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" className="absolute inset-0">
        {stars.map((s, i) => (
          <Glint key={i} x={s.x} y={s.y} r={s.s} delay={s.d} fill={i % 4 ? "#fff" : "#ffe7b0"} />
        ))}
      </svg>
      <svg viewBox="0 0 100 160" preserveAspectRatio="xMinYMax meet" className="absolute bottom-0 left-0 h-[85%]" style={{ maxWidth: "45%" }}>
        <Palm x={10} y={162} h={120} lean={14} frond="#2f6d6a" frondDark="#21504f" trunk="#5a4060" />
        <Palm x={-4} y={162} h={80} lean={10} frond="#3a7d74" frondDark="#265d58" trunk="#5a4060" delay={1} />
      </svg>
      <svg viewBox="0 0 100 160" preserveAspectRatio="xMaxYMax meet" className="absolute bottom-0 right-0 h-[80%]" style={{ maxWidth: "45%" }}>
        <Palm x={90} y={162} h={115} lean={-14} frond="#2f6d6a" frondDark="#21504f" trunk="#5a4060" delay={0.6} />
        <Palm x={104} y={162} h={76} lean={-10} frond="#3a7d74" frondDark="#265d58" trunk="#5a4060" delay={1.6} />
      </svg>
    </div>
  );
}

/* ---------------- hinge & charms ---------------- */

function Hinge() {
  const id = useArtId("hng");
  return (
    <svg viewBox="0 0 160 30" width="100%" height="100%" style={{ display: "block", overflow: "visible" }} aria-hidden>
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff6d6" />
          <stop offset="0.45" stopColor="#ebc57c" />
          <stop offset="0.8" stopColor="#b3843a" />
          <stop offset="1" stopColor="#e8c27c" />
        </linearGradient>
      </defs>
      <rect x="10" y="11" width="140" height="8" rx="4" fill={`url(#${id}-g)`} stroke={PLUM} strokeWidth="1.6" />
      {[0, 56, 112].map((x) => (
        <rect key={x} x={x + 2} y="4" width="44" height="22" rx="11" fill={`url(#${id}-g)`} stroke={PLUM} strokeWidth="2.2" />
      ))}
      {[0, 56, 112].map((x) => (
        <rect key={`h${x}`} x={x + 9} y="8" width="30" height="4" rx="2" fill="#fff" opacity="0.7" />
      ))}
    </svg>
  );
}

function Charms() {
  const id = useArtId("chm");
  const chain = (x2: number, y2: number) => (
    <line x1="80" y1="8" x2={x2} y2={y2} stroke="#d4a554" strokeWidth="2.4" strokeDasharray="0.1 4.4" strokeLinecap="round" />
  );
  return (
    <svg viewBox="0 0 160 150" width="100%" height="100%" style={{ display: "block", overflow: "visible" }} aria-hidden>
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff3c9" />
          <stop offset="0.5" stopColor="#e7bf73" />
          <stop offset="1" stopColor="#b98a3a" />
        </linearGradient>
        <linearGradient id={`${id}-p`} x1="0" x2="1">
          <stop offset="0" stopColor="#f6a9cf" />
          <stop offset="0.5" stopColor="#fff2f8" />
          <stop offset="1" stopColor="#f39cc7" />
        </linearGradient>
      </defs>
      <g className="pc-swing" style={{ animationDuration: "3.1s" }}>
        {chain(44, 92)}
        <path d="M50 92A20.5 20.5 0 1 0 50 132A27 27 0 0 1 50 92Z" transform="translate(-6 0)" fill={`url(#${id}-g)`} stroke={PLUM} strokeWidth="2" strokeLinejoin="round" />
        <circle cx="46" cy="112" r="4" fill="#ff7fb6" stroke={PLUM} strokeWidth="1.2" />
      </g>
      <g className="pc-swing" style={{ animationDuration: "2.6s", animationDelay: "-0.8s" }}>
        {chain(80, 112)}
        <path d={star5Path(80, 128, 17)} fill={`url(#${id}-g)`} stroke={PLUM} strokeWidth="2" strokeLinejoin="round" />
        <path d={star5Path(80, 128, 7)} fill="#fff6d6" />
        <path d={starPath(92, 114, 5)} fill="#fff" className="anim-twinkle" />
      </g>
      <g className="pc-swing" style={{ animationDuration: "3.6s", animationDelay: "-1.6s" }}>
        {chain(118, 90)}
        <path d="M118 88L100 108Q104 126 118 128Q132 126 136 108Z" fill={`url(#${id}-p)`} stroke={PLUM} strokeWidth="2" strokeLinejoin="round" />
        {[106, 112, 118, 124, 130].map((x) => (
          <line key={x} x1="118" y1="90" x2={x} y2="125" stroke={PLUM} strokeOpacity="0.3" strokeWidth="1.2" />
        ))}
        <circle cx="118" cy="88" r="4" fill="#fff7fb" stroke={PLUM} strokeWidth="1.2" />
      </g>
      <circle cx="80" cy="7" r="6" fill="none" stroke={`url(#${id}-g)`} strokeWidth="3.5" />
    </svg>
  );
}

/* ---------------- main component ---------------- */

const SHELL_CSS = `
@keyframes pcShimmer { 0% { transform: translateX(-140px) rotate(16deg); } 55%, 100% { transform: translateX(720px) rotate(16deg); } }
@keyframes pcShimmerM { 0% { transform: translateX(0); } 50%, 100% { transform: translateX(560px); } }
@keyframes pcSwing { 0%, 100% { transform: rotate(-7deg); } 50% { transform: rotate(7deg); } }
@keyframes pcFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
.pc-shimmer { animation: pcShimmer 4.2s ease-in-out infinite; transform-box: view-box; }
.pc-shimmer-m { animation: pcShimmerM 5s ease-in-out infinite 1s; }
.pc-swing { animation: pcSwing 3s ease-in-out infinite; transform-origin: 80px 7px; }
.pc-shell-float { animation: pcFloat 3.6s ease-in-out infinite; }
.pc-shell-btn:focus-visible { outline: 3px solid #fff; outline-offset: 4px; border-radius: 40%; box-shadow: 0 0 0 7px #f76fae; }
@media (prefers-reduced-motion: reduce) { .pc-shimmer, .pc-shimmer-m, .pc-swing, .pc-shell-float { animation: none !important; } }
`;

export function ShellCompact({
  open,
  onToggle,
  children,
  className = "",
}: {
  open: boolean;
  onToggle: () => void;
  children?: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const pocketClip = useArtId("pkt");
  const wrapRef = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(360);
  const [burstKey, setBurstKey] = useState(0);
  // Fire a sparkle burst each time the shell opens (adjusting state on prop change, no effect needed).
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setBurstKey((k) => k + 1);
  }

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setW(el.getBoundingClientRect().width || 360);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const lidH = w * LID_RATIO;
  const baseH = w * BASE_RATIO;
  const hingeY = open ? w * HINGE_OPEN : 0;
  const closedH = w * 1.24;
  const openH = w * HINGE_OPEN + baseH + w * 0.03;
  const dur = reduce ? 0 : 1;
  const ease = [0.65, 0, 0.35, 1] as const;

  return (
    <div
      ref={wrapRef}
      className={`relative mx-auto select-none ${className}`}
      style={{ width: "min(92vw, 520px)", marginTop: "calc(min(92vw, 520px) * 0.05)" }}
    >
      <style>{SHELL_CSS}</style>
      <motion.div
        className="relative"
        initial={false}
        animate={{ height: open ? openH : closedH }}
        transition={{ duration: reduce ? 0 : 0.9, ease, delay: open || reduce ? 0 : 0.25 }}
        style={{ perspective: Math.max(900, w * 3.2) }}
      >
        <div className={!open ? "pc-shell-float absolute inset-0" : "absolute inset-0"}>
          {/* soft halo */}
          <div
            aria-hidden
            className="pointer-events-none absolute"
            style={{
              left: "-8%",
              right: "-8%",
              top: open ? "10%" : "-4%",
              bottom: open ? "-2%" : "8%",
              background: "radial-gradient(closest-side, rgba(255,255,255,.75), rgba(255,214,236,.35) 60%, rgba(255,214,236,0))",
              transition: "top .8s, bottom .8s",
            }}
          />
          {!open && <Sparkles count={16} className="-inset-[6%]" />}

          <motion.div
            className="absolute left-0 top-0 w-full"
            initial={false}
            animate={{ y: hingeY }}
            transition={{ duration: reduce ? 0 : 0.85, ease, delay: open || reduce ? 0 : 0.3 }}
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* BASE (holds the world) */}
            <motion.div
              className="absolute left-0 top-0 w-full"
              style={{ height: baseH, transformOrigin: "50% 0%" }}
              initial={false}
              animate={{ opacity: open ? 1 : 0, scale: open ? 1 : 0.94 }}
              transition={{ duration: reduce ? 0.2 : 0.55, delay: open && !reduce ? 0.38 : 0, ease: "easeOut" }}
              inert={!open}
              aria-hidden={!open}
            >
              <div className="absolute left-0 top-0 w-full" style={{ height: `${(660 / 680) * 100}%` }}>
                <BaseShell />
              </div>
              <div
                className="absolute"
                style={{
                  left: `${(POCKET.x / 520) * 100}%`,
                  top: `${(POCKET.y / 680) * 100}%`,
                  width: `${(POCKET.w / 520) * 100}%`,
                  height: `${(POCKET.h / 680) * 100}%`,
                  clipPath: `url(#${pocketClip})`,
                }}
              >
                <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
                  <clipPath id={pocketClip} clipPathUnits="objectBoundingBox">
                    <path d={POCKET_CLIP_D} />
                  </clipPath>
                </svg>
                {children}
              </div>
              <div className="pointer-events-none absolute left-0 top-0 w-full" style={{ height: `${(660 / 680) * 100}%` }}>
                <RecessRim />
              </div>
            </motion.div>

            {/* LID */}
            <motion.div
              className="absolute left-0 top-0 w-full"
              style={{ height: lidH, transformOrigin: "50% 0%", transformStyle: "preserve-3d", zIndex: 3 }}
              initial={false}
              animate={{ rotateX: open ? 180 : 0 }}
              transition={{ duration: dur, ease }}
            >
              {/* outer face */}
              <div className="absolute inset-0" style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}>
                <div
                  aria-hidden
                  className="absolute"
                  style={{ left: "6%", right: "6%", top: "84%", height: "14%", borderRadius: "50%", background: "radial-gradient(closest-side, rgba(150,60,120,.35), rgba(150,60,120,0))", transform: "translateY(22%)" }}
                />
                <LidFront />
                {!open && (
                  <button
                    type="button"
                    onClick={onToggle}
                    aria-label="Open the seashell"
                    className="pc-shell-btn absolute cursor-pointer"
                    style={{ left: "3%", right: "3%", top: "2%", bottom: "4%", borderRadius: "46% 46% 50% 50% / 30% 30% 70% 70%", background: "transparent" }}
                  />
                )}
              </div>
              {/* inner face: mirror */}
              <div
                className="absolute inset-0"
                style={{ transform: "rotateX(180deg)", backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", pointerEvents: "none" }}
              >
                <LidMirror />
                {open && (
                  <button
                    type="button"
                    onClick={onToggle}
                    aria-label="Close the seashell"
                    className="pc-shell-btn absolute cursor-pointer"
                    style={{ left: "10%", right: "10%", top: "50%", bottom: "2%", borderRadius: "50% 50% 12% 12% / 80% 80% 20% 20%", background: "transparent", pointerEvents: "auto" }}
                  />
                )}
              </div>
            </motion.div>

            {/* hinge sits on top of both */}
            <div aria-hidden className="pointer-events-none absolute" style={{ left: "35%", width: "30%", top: -w * 0.03, height: w * 0.056, zIndex: 4 }}>
              <Hinge />
            </div>
          </motion.div>

          {/* charms dangle from the closed clasp */}
          <AnimatePresence>
            {!open && (
              <motion.div
                key="charms"
                aria-hidden
                className="pointer-events-none absolute"
                style={{ left: "34%", width: "32%", top: lidH * (474 / LID_H), zIndex: 5 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: reduce ? 0 : 0.5, delay: reduce ? 0 : 0.9 } }}
                exit={{ opacity: 0, y: -10, transition: { duration: reduce ? 0 : 0.2 } }}
              >
                <div style={{ aspectRatio: "160 / 150" }}>
                  <Charms />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* sparkle burst on open */}
          {!reduce && burstKey > 0 && <OpenBurst key={burstKey} y={w * HINGE_OPEN} />}
        </div>
      </motion.div>
    </div>
  );
}

function OpenBurst({ y }: { y: number }) {
  const parts = Array.from({ length: 26 }, (_, i) => {
    const r = rng(i * 31 + 5);
    const a = -Math.PI * (0.05 + r() * 0.9) + (i % 2 ? 0 : Math.PI * 0.08);
    const d = 90 + r() * 160;
    return { x: Math.cos(a) * d * 1.3, y: Math.sin(a) * d, s: 10 + r() * 14, delay: 0.15 + r() * 0.35, c: ["#fff", "#fff3c4", "#ffd2ea", "#d9fbf7", "#efe2ff"][i % 5], dot: i % 4 === 0 };
  });
  return (
    <div aria-hidden className="pointer-events-none absolute left-1/2" style={{ top: y, zIndex: 6 }}>
      <motion.div
        className="absolute rounded-full"
        style={{ left: -120, top: -60, width: 240, height: 120, background: "radial-gradient(closest-side, rgba(255,255,255,.95), rgba(255,226,242,.5), rgba(255,226,242,0))" }}
        initial={{ opacity: 0, scale: 0.3 }}
        animate={{ opacity: [0, 1, 0], scale: [0.3, 1.6, 2] }}
        transition={{ duration: 1.1, ease: "easeOut" }}
      />
      {parts.map((p, i) => (
        <motion.svg
          key={i}
          viewBox="-10 -10 20 20"
          width={p.s}
          height={p.s}
          className="absolute"
          style={{ left: -p.s / 2, top: -p.s / 2, filter: "drop-shadow(0 0 4px #fff)" }}
          initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
          animate={{ x: p.x, y: p.y, scale: [0, 1.25, 0.5], opacity: [0, 1, 0], rotate: 90 }}
          transition={{ duration: 1.4, delay: p.delay, ease: "easeOut" }}
        >
          {p.dot ? <circle r={4} fill={p.c} /> : <path d={starPath(0, 0, 9.5)} fill={p.c} />}
        </motion.svg>
      ))}
    </div>
  );
}
