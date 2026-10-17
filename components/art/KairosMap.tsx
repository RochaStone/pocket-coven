"use client";

import type { KeyboardEvent, ReactNode } from "react";
import { ArtKeyframes, Frangipani, Glint, PLUM, Palm, Pearl, lobedPath, useArtId } from "./Sparkles";

const SHELL_D = lobedPath(200, 250, 188, 235, 16, 1.1);

const VB_W = 400;
const VB_H = 500;
type Rect = { x: number; y: number; w: number; h: number };

/** Original drawing extents for each pavilion (art is fitted into AREAS below). */
const ART: Record<string, Rect> = {
  kairos_studio: { x: 10, y: 58, w: 186, h: 132 },
  kairos_sound: { x: 204, y: 58, w: 186, h: 132 },
  kairos_pool: { x: 10, y: 198, w: 380, h: 136 },
  kairos_gym: { x: 10, y: 344, w: 122, h: 146 },
  kairos_cowork: { x: 139, y: 344, w: 122, h: 146 },
  kairos_cafe: { x: 268, y: 344, w: 122, h: 146 },
};

/** Tappable areas (SVG units, viewBox 400 x 500). */
const AREAS: Record<string, Rect> = {
  kairos_pool: { x: 14, y: 58, w: 372, h: 182 },
  kairos_studio: { x: 12, y: 244, w: 186, h: 114 },
  kairos_sound: { x: 202, y: 244, w: 186, h: 114 },
  kairos_gym: { x: 52, y: 362, w: 104, h: 96 },
  kairos_cowork: { x: 148, y: 362, w: 104, h: 96 },
  kairos_cafe: { x: 244, y: 362, w: 104, h: 96 },
};

function fitK(id: string) {
  const o = ART[id];
  const n = AREAS[id];
  const sc = Math.min(n.w / o.w, n.h / o.h);
  const tx = n.x + (n.w - o.w * sc) / 2 - o.x * sc;
  const ty = n.y + n.h - o.h * sc - o.y * sc;
  return `translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${sc.toFixed(4)})`;
}

/** Area rectangles in % of the Kairos map box (for HTML overlays). */
export const KAIROS_ROOMS: Record<string, { x: number; y: number; w: number; h: number }> = Object.fromEntries(
  Object.entries(AREAS).map(([k, r]) => [
    k,
    { x: +((r.x / VB_W) * 100).toFixed(2), y: +((r.y / VB_H) * 100).toFixed(2), w: +((r.w / VB_W) * 100).toFixed(2), h: +((r.h / VB_H) * 100).toFixed(2) },
  ]),
);

const LABELS: Record<string, { aria: string; plaque: string }> = {
  kairos_studio: { aria: "Kairos Studio", plaque: "STUDIO" },
  kairos_sound: { aria: "Sound Sanctuary", plaque: "SOUND HEALING" },
  kairos_pool: { aria: "Kairos Pool", plaque: "THE POOL" },
  kairos_gym: { aria: "Kairos Gym", plaque: "GYM" },
  kairos_cowork: { aria: "Kairos Co-Work", plaque: "CO-WORK" },
  kairos_cafe: { aria: "Kairos Matcha Bar", plaque: "MATCHA BAR" },
};

const CSS = `
.pck-area { cursor: pointer; outline: none; -webkit-tap-highlight-color: transparent; }
.pck-area .pck-glow { opacity: 0; transition: opacity .2s; }
.pck-area:hover .pck-glow, .pck-area:focus-visible .pck-glow { opacity: 1; }
.pck-back { transition: transform .15s ease; }
.pck-back:hover { transform: scale(1.05) rotate(-4deg); }
.pck-back:active { transform: scale(.95); }
.pck-back:focus-visible { outline: 3px solid #fff; outline-offset: 2px; border-radius: 50%; box-shadow: 0 0 0 6px #e9c27a; }
`;

/** Bali thatched roof over a pavilion. */
function Roof({ x, y, w, h, g }: { x: number; y: number; w: number; h: number; g: string }) {
  const inset = w * 0.2;
  const fringe = Math.round(w / 9);
  return (
    <g>
      <path d={`M${x} ${y + h}L${x + inset} ${y + h * 0.18}H${x + w - inset}L${x + w} ${y + h}Z`} fill={`url(#${g}-thatch)`} stroke={PLUM} strokeWidth="1.4" strokeLinejoin="round" />
      {Array.from({ length: Math.round(w / 10) }, (_, i) => {
        const bx = x + 6 + i * 10;
        const t = (bx - x) / w;
        const tx = x + inset + (w - 2 * inset) * t;
        return <line key={i} x1={bx} y1={y + h - 2} x2={tx} y2={y + h * 0.22} stroke="#9d7330" strokeOpacity="0.4" strokeWidth="1" />;
      })}
      <path d={`M${x + inset} ${y + h * 0.18}L${x + w / 2} ${y}L${x + w - inset} ${y + h * 0.18}Z`} fill="#e6c07e" stroke={PLUM} strokeWidth="1.2" strokeLinejoin="round" />
      {Array.from({ length: fringe }, (_, i) => (
        <path key={i} d={`M${x + i * (w / fringe)} ${y + h}q${w / fringe / 2} 6 ${w / fringe} 0`} fill="#d7a75e" stroke={PLUM} strokeWidth="0.8" strokeOpacity="0.6" />
      ))}
      <path d={`M${x + w / 2 - 3} ${y + 1}L${x + w / 2} ${y - 6}L${x + w / 2 + 3} ${y + 1}Z`} fill={`url(#${g}-gold)`} stroke={PLUM} strokeWidth="0.8" />
    </g>
  );
}

function Pavilion({ r, roofH, wall, floor, g, children }: { r: Rect; roofH: number; wall: string; floor: string; g: string; children?: ReactNode }) {
  const top = r.y + roofH;
  const bottom = r.y + r.h - 10;
  return (
    <g>
      <rect x={r.x + 6} y={top - 4} width={r.w - 12} height={bottom - top + 4} fill={wall} />
      <rect x={r.x + 6} y={bottom - 16} width={r.w - 12} height="16" fill={floor} />
      <rect x={r.x + 6} y={bottom - 16} width={r.w - 12} height="2" fill="#fff" opacity="0.5" />
      {children}
      <rect x={r.x + 4} y={top - 2} width="6" height={bottom - top + 2} fill={`url(#${g}-timber)`} stroke={PLUM} strokeWidth="0.9" />
      <rect x={r.x + r.w - 10} y={top - 2} width="6" height={bottom - top + 2} fill={`url(#${g}-timber)`} stroke={PLUM} strokeWidth="0.9" />
      <rect x={r.x} y={bottom} width={r.w} height="10" rx="2" fill="#efdcc4" stroke={PLUM} strokeWidth="1.1" />
      {Array.from({ length: Math.floor(r.w / 14) }, (_, i) => (
        <line key={i} x1={r.x + 7 + i * 14} y1={bottom + 1} x2={r.x + 7 + i * 14} y2={bottom + 9} stroke="#c9a37a" strokeWidth="0.8" />
      ))}
      <Roof x={r.x - 4} y={r.y + 2} w={r.w + 8} h={roofH} g={g} />
    </g>
  );
}

function PlaqueK({ cx, cy, text, g }: { cx: number; cy: number; text: string; g: string }) {
  const w = text.length * 8.1 + 16;
  return (
    <g style={{ pointerEvents: "none" }}>
      <rect x={cx - w / 2} y={cy - 9} width={w} height="21" rx="5" fill={PLUM} opacity="0.35" />
      <rect x={cx - w / 2} y={cy - 11} width={w} height="21" rx="5" fill="#fffaf6" stroke={`url(#${g}-gold)`} strokeWidth="1.8" />
      <text x={cx} y={cy + 3.8} textAnchor="middle" fontSize="12.2" fontWeight={700} fill="#4a2148" style={{ fontFamily: "var(--font-display), ui-rounded, system-ui, sans-serif", letterSpacing: "0.05em" }}>
        {text}
      </text>
    </g>
  );
}

export function KairosMap({
  onSelect,
  onBack,
  occupants,
}: {
  onSelect: (locationId: string) => void;
  onBack: () => void;
  occupants?: Record<string, ReactNode[]>;
}) {
  const g = useArtId("km");
  const key = (id: string) => (e: KeyboardEvent<SVGGElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect(id);
    }
  };
  const S = ART.kairos_studio;
  const SO = ART.kairos_sound;
  const P = AREAS.kairos_pool;
  const G = ART.kairos_gym;
  const C = ART.kairos_cowork;
  const F = ART.kairos_cafe;

  return (
    <div className="relative w-full select-none" style={{ aspectRatio: "4 / 5" }}>
      <ArtKeyframes />
      <style>{CSS}</style>
      <svg viewBox={`0 0 ${VB_W} ${VB_H}`} width="100%" height="100%" className="absolute inset-0 block" role="group" aria-label="Kairos Club map">
        <defs>
          <linearGradient id={`${g}-ground`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f8e8d4" />
            <stop offset="1" stopColor="#efd3b6" />
          </linearGradient>
          <pattern id={`${g}-tiles`} width="20" height="20" patternUnits="userSpaceOnUse">
            <rect width="20" height="20" fill="none" stroke="#e2c09c" strokeWidth="0.8" />
            <circle cx="10" cy="10" r="1" fill="#e7b48f" opacity="0.6" />
          </pattern>
          <linearGradient id={`${g}-gold`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff3c9" />
            <stop offset="0.5" stopColor="#e7bf73" />
            <stop offset="1" stopColor="#b98a3a" />
          </linearGradient>
          <linearGradient id={`${g}-thatch`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f3d79a" />
            <stop offset="1" stopColor="#c48f48" />
          </linearGradient>
          <linearGradient id={`${g}-timber`} x1="0" x2="1">
            <stop offset="0" stopColor="#c48a55" />
            <stop offset="0.5" stopColor="#e3b07a" />
            <stop offset="1" stopColor="#a8703f" />
          </linearGradient>
          <linearGradient id={`${g}-pool`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#8ff0e5" />
            <stop offset="0.5" stopColor="#34c4ba" />
            <stop offset="1" stopColor="#1aa0b0" />
          </linearGradient>
          <radialGradient id={`${g}-soundglow`} cx="0.5" cy="0.45" r="0.6">
            <stop offset="0" stopColor="#fff6fb" />
            <stop offset="0.6" stopColor="#e6d6ff" />
            <stop offset="1" stopColor="#c7b0f2" />
          </radialGradient>
          <linearGradient id={`${g}-glass`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#e8fbff" stopOpacity="0.95" />
            <stop offset="0.5" stopColor="#ffe9f2" stopOpacity="0.9" />
            <stop offset="1" stopColor="#fff1dc" stopOpacity="0.95" />
          </linearGradient>
          <radialGradient id={`${g}-warm`} cx="0.5" cy="0.75" r="0.6">
            <stop offset="0" stopColor="#ffe7a6" stopOpacity="0.55" />
            <stop offset="1" stopColor="#ffe7a6" stopOpacity="0" />
          </radialGradient>
          <filter id={`${g}-blur`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>

        <clipPath id={`${g}-shell`}>
          <path d={SHELL_D} />
        </clipPath>
        <g clipPath={`url(#${g}-shell)`}>
        {/* ground */}
        <rect width={VB_W} height={VB_H} fill={`url(#${g}-ground)`} />
        <rect width={VB_W} height={VB_H} fill={`url(#${g}-tiles)`} />
        {/* lush border */}
        {[
          [0, 20],
          [400, 20],
          [0, 246],
          [400, 246],
          [0, 372],
          [400, 372],
          [0, 500],
          [400, 500],
        ].map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r="26" fill="#57c49e" stroke={PLUM} strokeWidth="1" strokeOpacity="0.5" />
            <circle cx={x + (x ? -14 : 14)} cy={y - 10} r="14" fill="#7fd8b4" />
            <Frangipani x={x + (x ? -12 : 12)} y={y + 6} r={4.5} rot={i * 20} />
          </g>
        ))}

        {/* title plaque */}
        <g style={{ pointerEvents: "none" }}>
          <rect x="100" y="24" width="200" height="30" rx="8" fill={PLUM} opacity="0.3" transform="translate(0 2)" />
          <rect x="100" y="24" width="200" height="30" rx="8" fill="#fffaf6" stroke={`url(#${g}-gold)`} strokeWidth="2.5" />
          <text x="200" y="44.5" textAnchor="middle" fontSize="14.5" fontWeight={700} fill="#4a2148" style={{ fontFamily: "var(--font-display), ui-rounded, system-ui, sans-serif", letterSpacing: "0.06em" }}>
            KAIROS MEMBERS’ CLUB
          </text>
        </g>

        {/* ---- studio ---- */}
        <g role="button" tabIndex={0} aria-label={LABELS.kairos_studio.aria} className="pck-area" onClick={() => onSelect("kairos_studio")} onKeyDown={key("kairos_studio")}>
          <rect x={AREAS.kairos_studio.x} y={AREAS.kairos_studio.y} width={AREAS.kairos_studio.w} height={AREAS.kairos_studio.h} fill="#fff" fillOpacity={0} />
          <g transform={fitK("kairos_studio")}>
          <Pavilion r={S} roofH={40} wall="#f6e2cb" floor="#d9a874" g={g}>
            <rect x={S.x + 60} y={S.y + 50} width="66" height="34" rx="4" fill="#bfeee6" stroke="#c48a55" strokeWidth="2" />
            <path d={`M${S.x + 93} ${S.y + 50}v34`} stroke="#c48a55" strokeWidth="2" />
            <Palm x={S.x + 74} y={S.y + 86} h={30} lean={4} sway={false} />
            {[S.x + 30, S.x + 112].map((x) => (
              <g key={x}>
                <rect x={x} y={S.y + 104} width="44" height="7" rx="2" fill="#f6efe6" stroke={PLUM} strokeWidth="1" />
                <rect x={x + 4} y={S.y + 100} width="16" height="5" rx="2" fill="#ffc8e2" stroke={PLUM} strokeWidth="0.8" />
                <path d={`M${x + 2} ${S.y + 111}v6M${x + 42} ${S.y + 111}v6`} stroke="#a8703f" strokeWidth="2" />
                <path d={`M${x + 38} ${S.y + 104}v-12`} stroke="#a8703f" strokeWidth="1.6" />
              </g>
            ))}
            <rect x={S.x + 80} y={S.y + 112} width="26" height="5" rx="2" fill="#c9b0ff" stroke={PLUM} strokeWidth="0.8" />
          </Pavilion>
          </g>
          <g className="pck-glow" pointerEvents="none">
            <rect x={AREAS.kairos_studio.x} y={AREAS.kairos_studio.y} width={AREAS.kairos_studio.w} height={AREAS.kairos_studio.h} rx="12" fill="#fff6c9" fillOpacity="0.12" stroke="#fff6c9" strokeWidth="5" filter={`url(#${g}-blur)`} />
          </g>
          <PlaqueK cx={AREAS.kairos_studio.x + AREAS.kairos_studio.w / 2} cy={AREAS.kairos_studio.y + 40} text={LABELS.kairos_studio.plaque} g={g} />
        </g>

        {/* ---- sound sanctuary ---- */}
        <g role="button" tabIndex={0} aria-label={LABELS.kairos_sound.aria} className="pck-area" onClick={() => onSelect("kairos_sound")} onKeyDown={key("kairos_sound")}>
          <rect x={AREAS.kairos_sound.x} y={AREAS.kairos_sound.y} width={AREAS.kairos_sound.w} height={AREAS.kairos_sound.h} fill="#fff" fillOpacity={0} />
          <g transform={fitK("kairos_sound")}>
          <path d={`M${SO.x + 14} ${SO.y + 122}V${SO.y + 66}Q${SO.x + SO.w / 2} ${SO.y - 4} ${SO.x + SO.w - 14} ${SO.y + 66}V${SO.y + 122}Z`} fill={`url(#${g}-soundglow)`} stroke={PLUM} strokeWidth="1.4" />
          <path d={`M${SO.x + 14} ${SO.y + 66}Q${SO.x + SO.w / 2} ${SO.y - 4} ${SO.x + SO.w - 14} ${SO.y + 66}`} fill="none" stroke={`url(#${g}-gold)`} strokeWidth="4" />
          <circle cx={SO.x + SO.w / 2} cy={SO.y + 30} r="9" fill="#fff6d6" stroke={`url(#${g}-gold)`} strokeWidth="2" />
          <path d={`M${SO.x + SO.w / 2 - 10} ${SO.y + 38}L${SO.x + 50} ${SO.y + 118}H${SO.x + SO.w - 50}L${SO.x + SO.w / 2 + 10} ${SO.y + 38}Z`} fill="#fff" className="pc-ray" />
          <rect x={SO.x + 14} y={SO.y + 108} width={SO.w - 28} height="14" fill="#d9c6f5" />
          {[0, 1, 2].map((i) => {
            const cx = SO.x + 60 + i * 33;
            const rr = 12 - i * 1.5;
            return (
              <g key={i}>
                <ellipse cx={cx} cy={SO.y + 114} rx={rr + 4} ry="4" fill="#ffc8e2" stroke={PLUM} strokeWidth="0.8" />
                <path d={`M${cx - rr} ${SO.y + 104}Q${cx - rr} ${SO.y + 114} ${cx} ${SO.y + 114}Q${cx + rr} ${SO.y + 114} ${cx + rr} ${SO.y + 104}Z`} fill="#fbf8ff" stroke={PLUM} strokeWidth="1" />
                <ellipse cx={cx} cy={SO.y + 104} rx={rr} ry="2.6" fill="#e6f7ff" stroke={PLUM} strokeWidth="0.8" />
                <ellipse cx={cx} cy={SO.y + 100} rx={rr + 6} ry="5" fill="none" stroke="#c9b0ff" strokeWidth="1" className="pc-glow" style={{ animationDelay: `${i * 0.6}s` }} />
              </g>
            );
          })}
          {[SO.x + 30, SO.x + SO.w - 30].map((x, i) => (
            <g key={x}>
              <rect x={x - 2} y={SO.y + 98} width="4" height="10" fill="#fff6ea" stroke={PLUM} strokeWidth="0.5" />
              <ellipse cx={x} cy={SO.y + 96} rx="1.8" ry="3" fill="#ffcf6e" className="pc-pulse" style={{ animationDelay: `${i * 0.7}s` }} />
            </g>
          ))}
          <Glint x={SO.x + 40} y={SO.y + 70} r={4} delay={0.3} />
          <Glint x={SO.x + SO.w - 44} y={SO.y + 62} r={3.5} delay={1.4} fill="#efe2ff" />
          <rect x={SO.x + 6} y={SO.y + 122} width={SO.w - 12} height="10" rx="2" fill="#efdcc4" stroke={PLUM} strokeWidth="1.1" />
          </g>
          <g className="pck-glow" pointerEvents="none">
            <rect x={AREAS.kairos_sound.x} y={AREAS.kairos_sound.y} width={AREAS.kairos_sound.w} height={AREAS.kairos_sound.h} rx="12" fill="#fff6c9" fillOpacity="0.12" stroke="#fff6c9" strokeWidth="5" filter={`url(#${g}-blur)`} />
          </g>
          <PlaqueK cx={AREAS.kairos_sound.x + AREAS.kairos_sound.w / 2} cy={AREAS.kairos_sound.y + 44} text={LABELS.kairos_sound.plaque} g={g} />
        </g>

        {/* ---- pool: glass conservatory ---- */}
        <g role="button" tabIndex={0} aria-label={LABELS.kairos_pool.aria} className="pck-area" onClick={() => onSelect("kairos_pool")} onKeyDown={key("kairos_pool")}>
          <rect x={P.x} y={P.y} width={P.w} height={P.h} fill="#fff" fillOpacity={0} />
          {/* glass house */}
          <path d={`M${P.x + 8} ${P.y + P.h}V${P.y + 96}Q${P.x + 8} ${P.y + 4} ${P.x + P.w / 2} ${P.y + 4}Q${P.x + P.w - 8} ${P.y + 4} ${P.x + P.w - 8} ${P.y + 96}V${P.y + P.h}Z`} fill={`url(#${g}-glass)`} stroke={`url(#${g}-gold)`} strokeWidth="4" />
          <path d={`M${P.x + 8} ${P.y + P.h}V${P.y + 96}Q${P.x + 8} ${P.y + 4} ${P.x + P.w / 2} ${P.y + 4}Q${P.x + P.w - 8} ${P.y + 4} ${P.x + P.w - 8} ${P.y + 96}V${P.y + P.h}Z`} fill={`url(#${g}-warm)`} />
          <Palm x={P.x + 46} y={P.y + 128} h={86} lean={10} delay={0.3} />
          <Palm x={P.x + 104} y={P.y + 122} h={66} lean={4} delay={1.6} />
          <Palm x={P.x + P.w - 46} y={P.y + 128} h={86} lean={-10} delay={1.1} />
          <Palm x={P.x + P.w - 104} y={P.y + 122} h={66} lean={-4} delay={0.7} />
          {/* gold mullions */}
          {[-0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75].map((t) => (
            <line key={t} x1={P.x + P.w / 2 + t * 40} y1={P.y + 6} x2={P.x + P.w / 2 + t * 184} y2={P.y + 100} stroke={`url(#${g}-gold)`} strokeWidth="1.6" opacity="0.8" />
          ))}
          <path d={`M${P.x + 22} ${P.y + 56}Q${P.x + P.w / 2} ${P.y - 14} ${P.x + P.w - 22} ${P.y + 56}`} fill="none" stroke={`url(#${g}-gold)`} strokeWidth="1.6" opacity="0.8" />
          <path d={`M${P.x + 8} ${P.y + 100}H${P.x + P.w - 8}`} stroke={`url(#${g}-gold)`} strokeWidth="3" />
          {[0.12, 0.25, 0.375, 0.5, 0.625, 0.75, 0.88].map((t) => (
            <line key={t} x1={P.x + P.w * t} y1={P.y + 100} x2={P.x + P.w * t} y2={P.y + P.h} stroke={`url(#${g}-gold)`} strokeWidth="1.4" opacity="0.55" />
          ))}
          <path d={`M${P.x + 70} ${P.y + 30}l40 -14M${P.x + 60} ${P.y + 50}l26 -10`} stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity="0.7" />
          <circle cx={P.x + P.w / 2} cy={P.y + 4} r="6" fill={`url(#${g}-gold)`} stroke={PLUM} strokeWidth="1" />
          {/* deck + pool */}
          <rect x={P.x + 10} y={P.y + 128} width={P.w - 20} height={P.h - 130} fill="#f6e4cd" />
          <rect x={P.x + 58} y={P.y + 136} width={P.w - 116} height={P.h - 148} rx="26" fill="#fffaf2" stroke={PLUM} strokeWidth="1.2" />
          <rect x={P.x + 63} y={P.y + 141} width={P.w - 126} height={P.h - 158} rx="22" fill={`url(#${g}-pool)`} />
          {Array.from({ length: 7 }, (_, i) => (
            <path key={i} d={`M${P.x + 84 + i * 32} ${P.y + 152 + (i % 3) * 10}q7 -4 14 0q7 4 14 0`} fill="none" stroke="#fff" strokeOpacity="0.7" strokeWidth="1.4" strokeLinecap="round" className="pc-pulse" style={{ animationDelay: `${i * 0.35}s` }} />
          ))}
          <g className="pc-bob">
            <circle cx={P.x + 100} cy={P.y + 160} r="9" fill="#ff9fcb" stroke={PLUM} strokeWidth="1" />
            <circle cx={P.x + 100} cy={P.y + 160} r="3.6" fill="#fff6ea" />
          </g>
          <g className="pc-bob" style={{ animationDelay: "1s" }}>
            <ellipse cx={P.x + 268} cy={P.y + 168} rx="12" ry="6" fill="#ffe08a" stroke={PLUM} strokeWidth="1" />
            <ellipse cx={P.x + 268} cy={P.y + 167} rx="5" ry="2.4" fill="#7ee6dc" />
          </g>
          {/* loungers with umbrellas */}
          {[P.x + 14, P.x + P.w - 54].map((x, i) => (
            <g key={x}>
              {[0, 26].map((dy) => (
                <g key={dy}>
                  <rect x={x} y={P.y + 140 + dy} width="40" height="13" rx="5" fill="#ffc8e2" stroke={PLUM} strokeWidth="1" />
                  <rect x={x + (i ? 28 : 2)} y={P.y + 142 + dy} width="10" height="9" rx="3" fill="#fff6ea" />
                  <path d={`M${x + 2} ${P.y + 153 + dy}v4M${x + 38} ${P.y + 153 + dy}v4`} stroke="#d9ac5c" strokeWidth="2" />
                </g>
              ))}
              <path d={`M${x + 20} ${P.y + 150}V${P.y + 126}`} stroke="#b98a3a" strokeWidth="1.6" />
              <path d={`M${x - 2} ${P.y + 128}Q${x + 20} ${P.y + 108} ${x + 42} ${P.y + 128}Z`} fill="#fffaf2" stroke={PLUM} strokeWidth="1" />
              <path d={`M${x + 9} ${P.y + 120}L${x + 20} ${P.y + 128}L${x + 31} ${P.y + 120}Q${x + 20} ${P.y + 112} ${x + 9} ${P.y + 120}Z`} fill={`url(#${g}-gold)`} opacity="0.85" />
            </g>
          ))}
          {/* sofas, pink and blue */}
          <g>
            <rect x={P.x + 16} y={P.y + 176} width="38" height="14" rx="6" fill="#ff9fcb" stroke={PLUM} strokeWidth="1" />
            <rect x={P.x + 16} y={P.y + 170} width="38" height="9" rx="4" fill="#ffb8d8" stroke={PLUM} strokeWidth="1" />
            <rect x={P.x + P.w - 54} y={P.y + 176} width="38" height="14" rx="6" fill="#8ccff0" stroke={PLUM} strokeWidth="1" />
            <rect x={P.x + P.w - 54} y={P.y + 170} width="38" height="9" rx="4" fill="#a9ddf5" stroke={PLUM} strokeWidth="1" />
          </g>
          <Glint x={P.x + 200} y={P.y + 40} r={5} delay={0.2} fill="#fff6d6" />
          <Glint x={P.x + 150} y={P.y + 170} r={3.5} delay={1.6} />
          <Glint x={P.x + 250} y={P.y + 60} r={3.5} delay={0.9} />
          <g className="pck-glow" pointerEvents="none">
            <rect x={P.x} y={P.y} width={P.w} height={P.h} rx="12" fill="#fff6c9" fillOpacity="0.12" stroke="#fff6c9" strokeWidth="5" filter={`url(#${g}-blur)`} />
          </g>
          <PlaqueK cx={P.x + P.w / 2} cy={P.y + 116} text={LABELS.kairos_pool.plaque} g={g} />
        </g>

        {/* ---- gym ---- */}
        <g role="button" tabIndex={0} aria-label={LABELS.kairos_gym.aria} className="pck-area" onClick={() => onSelect("kairos_gym")} onKeyDown={key("kairos_gym")}>
          <rect x={AREAS.kairos_gym.x} y={AREAS.kairos_gym.y} width={AREAS.kairos_gym.w} height={AREAS.kairos_gym.h} fill="#fff" fillOpacity={0} />
          <g transform={fitK("kairos_gym")}>
          <Pavilion r={G} roofH={44} wall="#ffe3ee" floor="#c9b0ff" g={g}>
            <rect x={G.x + 24} y={G.y + 60} width="74" height="34" rx="3" fill="#eef4ff" stroke="#d9ac5c" strokeWidth="2" />
            <path d={`M${G.x + 34} ${G.y + 88}l14 -20M${G.x + 50} ${G.y + 90}l16 -24`} stroke="#fff" strokeWidth="2" />
            <rect x={G.x + 24} y={G.y + 112} width="74" height="4" rx="2" fill="#a8703f" />
            {[
              [G.x + 34, "#ff9fcb"],
              [G.x + 52, "#7ee6dc"],
              [G.x + 70, "#c9b0ff"],
              [G.x + 88, "#ffd36e"],
            ].map(([x, c]) => (
              <g key={x as number}>
                <rect x={(x as number) - 7} y={G.y + 106} width="4" height="7" rx="1.5" fill={c as string} stroke={PLUM} strokeWidth="0.7" />
                <rect x={(x as number) + 3} y={G.y + 106} width="4" height="7" rx="1.5" fill={c as string} stroke={PLUM} strokeWidth="0.7" />
                <rect x={(x as number) - 4} y={G.y + 108.5} width="8" height="2" fill="#b9a6c8" />
              </g>
            ))}
            <path d={`M${G.x + 28} ${G.y + 128}h20`} stroke="#ff9fcb" strokeWidth="5" strokeLinecap="round" />
          </Pavilion>
          </g>
          <g className="pck-glow" pointerEvents="none">
            <rect x={AREAS.kairos_gym.x} y={AREAS.kairos_gym.y} width={AREAS.kairos_gym.w} height={AREAS.kairos_gym.h} rx="12" fill="#fff6c9" fillOpacity="0.12" stroke="#fff6c9" strokeWidth="5" filter={`url(#${g}-blur)`} />
          </g>
          <PlaqueK cx={AREAS.kairos_gym.x + AREAS.kairos_gym.w / 2} cy={AREAS.kairos_gym.y + 40} text={LABELS.kairos_gym.plaque} g={g} />
        </g>

        {/* ---- co-work ---- */}
        <g role="button" tabIndex={0} aria-label={LABELS.kairos_cowork.aria} className="pck-area" onClick={() => onSelect("kairos_cowork")} onKeyDown={key("kairos_cowork")}>
          <rect x={AREAS.kairos_cowork.x} y={AREAS.kairos_cowork.y} width={AREAS.kairos_cowork.w} height={AREAS.kairos_cowork.h} fill="#fff" fillOpacity={0} />
          <g transform={fitK("kairos_cowork")}>
          <Pavilion r={C} roofH={44} wall="#fdf0dc" floor="#d9a874" g={g}>
            {[C.x + 40, C.x + 82].map((x) => (
              <g key={x}>
                <line x1={x} y1={C.y + 56} x2={x} y2={C.y + 70} stroke={PLUM} strokeWidth="0.7" />
                <path d={`M${x - 9} ${C.y + 78}Q${x} ${C.y + 64} ${x + 9} ${C.y + 78}Z`} fill="#e3b07a" stroke={PLUM} strokeWidth="0.8" />
                <ellipse cx={x} cy={C.y + 80} rx="9" ry="3" fill="#fff3c4" className="pc-glow" />
              </g>
            ))}
            {[C.x + 20, C.x + 66].map((x, i) => (
              <g key={x}>
                <rect x={x} y={C.y + 110} width="36" height="5" rx="2" fill="#e3b07a" stroke={PLUM} strokeWidth="0.9" />
                <path d={`M${x + 3} ${C.y + 115}v12M${x + 33} ${C.y + 115}v12`} stroke="#b9804a" strokeWidth="2" />
                <path d={`M${x + 8} ${C.y + 110}l3 -12h16l-3 12z`} fill="#f4f0ff" stroke={PLUM} strokeWidth="0.9" />
                <circle cx={x + 19} cy={C.y + 104} r="1.6" fill={i ? "#ff9fcb" : "#7ee6dc"} />
              </g>
            ))}
            <path d={`M${C.x + 104} ${C.y + 128}c-6 -10 -2 -22 0 -26c2 4 6 16 0 26z`} fill="#57c49e" stroke={PLUM} strokeWidth="0.7" />
          </Pavilion>
          </g>
          <g className="pck-glow" pointerEvents="none">
            <rect x={AREAS.kairos_cowork.x} y={AREAS.kairos_cowork.y} width={AREAS.kairos_cowork.w} height={AREAS.kairos_cowork.h} rx="12" fill="#fff6c9" fillOpacity="0.12" stroke="#fff6c9" strokeWidth="5" filter={`url(#${g}-blur)`} />
          </g>
          <PlaqueK cx={AREAS.kairos_cowork.x + AREAS.kairos_cowork.w / 2} cy={AREAS.kairos_cowork.y + 40} text={LABELS.kairos_cowork.plaque} g={g} />
        </g>

        {/* ---- café ---- */}
        <g role="button" tabIndex={0} aria-label={LABELS.kairos_cafe.aria} className="pck-area" onClick={() => onSelect("kairos_cafe")} onKeyDown={key("kairos_cafe")}>
          <rect x={AREAS.kairos_cafe.x} y={AREAS.kairos_cafe.y} width={AREAS.kairos_cafe.w} height={AREAS.kairos_cafe.h} fill="#fff" fillOpacity={0} />
          <g transform={fitK("kairos_cafe")}>
          <Pavilion r={F} roofH={44} wall="#e4f7f1" floor="#e7b48f" g={g}>
            <rect x={F.x + 34} y={F.y + 64} width="54" height="22" rx="3" fill="#5d4a6e" stroke="#d9ac5c" strokeWidth="1.6" />
            <path d={`M${F.x + 40} ${F.y + 72}h26M${F.x + 40} ${F.y + 78}h36`} stroke="#fff" strokeWidth="1.3" strokeLinecap="round" opacity="0.85" />
            <rect x={F.x + 16} y={F.y + 104} width="90" height="6" rx="2" fill="#fff6ea" stroke={PLUM} strokeWidth="0.9" />
            <rect x={F.x + 18} y={F.y + 110} width="86" height="18" fill="#e08a6b" stroke={PLUM} strokeWidth="0.9" />
            {Array.from({ length: 6 }, (_, i) => (
              <line key={i} x1={F.x + 24 + i * 14} y1={F.y + 112} x2={F.x + 24 + i * 14} y2={F.y + 126} stroke="#fff" strokeOpacity="0.4" strokeWidth="2" />
            ))}
            {[F.x + 32, F.x + 46].map((x) => (
              <g key={x}>
                <path d={`M${x - 4} ${F.y + 90}h8l-1 14h-6z`} fill="#e8fff5" stroke={PLUM} strokeWidth="0.8" />
                <path d={`M${x - 3.6} ${F.y + 95}h7.2l-0.8 9h-5.6z`} fill="#8fd48a" />
                <path d={`M${x - 3.2} ${F.y + 100}h6.4l-0.4 4h-5.6z`} fill="#ff8fb7" />
              </g>
            ))}
            <path d={`M${F.x + 66} ${F.y + 104}q10 8 20 0z`} fill="#ff6fa8" stroke={PLUM} strokeWidth="0.8" />
            <circle cx={F.x + 72} cy={F.y + 102} r="2" fill="#ffd36e" />
            <circle cx={F.x + 79} cy={F.y + 101} r="2" fill="#fff" />
          </Pavilion>
          </g>
          <g className="pck-glow" pointerEvents="none">
            <rect x={AREAS.kairos_cafe.x} y={AREAS.kairos_cafe.y} width={AREAS.kairos_cafe.w} height={AREAS.kairos_cafe.h} rx="12" fill="#fff6c9" fillOpacity="0.12" stroke="#fff6c9" strokeWidth="5" filter={`url(#${g}-blur)`} />
          </g>
          <PlaqueK cx={AREAS.kairos_cafe.x + AREAS.kairos_cafe.w / 2} cy={AREAS.kairos_cafe.y + 40} text={LABELS.kairos_cafe.plaque} g={g} />
        </g>

        

        </g>
        <path d={SHELL_D} fill="none" stroke={PLUM} strokeOpacity="0.5" strokeWidth="1.5" />
      </svg>

      {/* back button */}
      <button
        type="button"
        onClick={onBack}
        aria-label="Back to the seashell"
        className="pck-back absolute grid place-items-center"
        style={{ left: "9%", top: "9%", width: 54, height: 54 }}
      >
        <svg viewBox="0 0 60 60" width="58" height="58" aria-hidden>
          <path d="M30 6L8 30Q10 50 30 54Q50 50 52 30Z" fill="#ffd2e8" stroke={PLUM} strokeWidth="2" strokeLinejoin="round" />
          {[14, 20, 26, 34, 40, 46].map((x) => (
            <line key={x} x1="30" y1="9" x2={x} y2="50" stroke={PLUM} strokeOpacity="0.25" strokeWidth="1.2" />
          ))}
          <path d="M30 6L8 30Q10 50 30 54Q50 50 52 30Z" fill="none" stroke="#fff" strokeOpacity="0.7" strokeWidth="1" transform="translate(0 2) scale(0.98)" />
          <Pearl x={30} y={8} r={3.5} />
          <path d="M34 26l-8 8l8 8" fill="none" stroke={PLUM} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span
          className="absolute -bottom-1 rounded-full px-1.5 text-[11px] font-semibold leading-4"
          style={{ background: "#fffaf2", color: PLUM, border: "1.5px solid #e9c27a", fontFamily: "var(--font-display)" }}
        >
          Back
        </span>
      </button>

      {occupants && (
        <div className="pointer-events-none absolute inset-0">
          {Object.entries(occupants).map(([id, nodes]) => {
            const rr = KAIROS_ROOMS[id];
            if (!rr || !nodes?.length) return null;
            return (
              <div
                key={id}
                className="absolute flex flex-wrap content-end items-end justify-center"
                style={{ left: `${rr.x}%`, top: `${rr.y + rr.h * 0.4}%`, width: `${rr.w}%`, height: `${rr.h * 0.5}%`, gap: 2, paddingBottom: "3%" }}
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
