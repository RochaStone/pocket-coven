"use client";

import { useId, type ReactNode } from "react";
import { itemById } from "@/lib/game/catalog";
import { OUTLINE, safeId } from "./color";
import { CompanionPart, DEFAULT_BUILD, EarringPart, HairAccPart, HatPart, NecklacePart, OutfitIconPart, SPARKLE_D, TailPart, starD } from "./Witch";

const ol = { stroke: OUTLINE, strokeWidth: 1.8, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
const thin = { stroke: OUTLINE, strokeWidth: 1.1, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

function LG({ id, stops, x2 = 0, y2 = 1 }: { id: string; stops: [number, string][]; x2?: number; y2?: number }) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2={x2} y2={y2}>
      {stops.map(([o, c], i) => (
        <stop key={i} offset={o} stopColor={c} />
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

const Floor = ({ w = 34, y = 92 }: { w?: number; y?: number }) => <ellipse cx={50} cy={y} rx={w} ry={4} fill="#6b3a5e" opacity={0.14} />;
const Spark = ({ x, y, s = 0.6, c = "#fff" }: { x: number; y: number; s?: number; c?: string }) => <path d={SPARKLE_D} transform={`translate(${x} ${y}) scale(${s})`} fill={c} />;

function fan(cx: number, cy: number, r: number, n: number, a0 = 180, a1 = 360, bump = 6) {
  const pts: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180;
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  let d = `M ${cx} ${cy} L ${pts[0][0].toFixed(2)} ${pts[0][1].toFixed(2)}`;
  for (let i = 1; i < pts.length; i++) {
    const a = ((a0 + ((a1 - a0) * (i - 0.5)) / n) * Math.PI) / 180;
    d += ` Q ${(cx + (r + bump) * Math.cos(a)).toFixed(2)} ${(cy + (r + bump) * Math.sin(a)).toFixed(2)} ${pts[i][0].toFixed(2)} ${pts[i][1].toFixed(2)}`;
  }
  return { d: d + " Z", pts };
}

function Pearl({ cx, cy, r, u, dark = false }: { cx: number; cy: number; r: number; u: string; dark?: boolean }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={`url(#${u}-${dark ? "bp" : "pearl"})`} {...ol} />
      <ellipse cx={cx - r * 0.35} cy={cy - r * 0.4} rx={r * 0.3} ry={r * 0.22} fill="#fff" opacity={0.95} />
    </g>
  );
}

function SharedDefs({ u }: { u: string }) {
  return (
    <defs>
      <RG id={`${u}-pearl`} stops={[[0, "#ffffff"], [0.45, "#fff3f8"], [0.8, "#f0dcf5"], [1, "#d9e8f5"]]} />
      <RG id={`${u}-bp`} stops={[[0, "#8a7aa8"], [0.5, "#2e2638"], [1, "#151018"]]} />
      <RG id={`${u}-glow`} stops={[[0, "#fff6d8", 0.9], [0.5, "#ffd9a8", 0.35], [1, "#ffd9a8", 0]]} cx={0.5} cy={0.5} r={0.5} />
      <RG id={`${u}-vglow`} stops={[[0, "#f1e2ff", 0.95], [0.5, "#c9a6ff", 0.4], [1, "#c9a6ff", 0]]} cx={0.5} cy={0.5} r={0.5} />
      <LG id={`${u}-gold`} stops={[[0, "#fff1c4"], [0.5, "#f0c76e"], [1, "#c8923c"]]} />
      <LG id={`${u}-pink`} stops={[[0, "#ffe0ef"], [0.55, "#ffaed4"], [1, "#f084b8"]]} />
    </defs>
  );
}

function drawPlaced(id: string, u: string): ReactNode {
  switch (id) {
    case "furn_oyster_bed": {
      const top = fan(50, 64, 40, 9, 180, 360, 7);
      return (
        <g>
          <Floor w={40} />
          <path d={top.d} fill={`url(#${u}-pink)`} {...ol} />
          {top.pts.slice(1, -1).map(([x, y], i) => (
            <path key={i} d={`M 50 64 L ${x.toFixed(1)} ${y.toFixed(1)}`} stroke="#e47aae" strokeWidth={1.1} opacity={0.7} />
          ))}
          <path d="M 18 46 Q 30 30 48 27" stroke="#fff" strokeWidth={2.4} fill="none" opacity={0.6} strokeLinecap="round" />
          <path d="M 12 64 Q 50 56 88 64 Q 86 70 80 70 L 20 70 Q 14 70 12 64 Z" fill="#fff4fb" {...ol} />
          <path d="M 44 62 Q 62 56 86 64 Q 84 72 70 72 Q 52 72 44 62 Z" fill="#c9b6ff" {...thin} />
          <path d="M 52 64 Q 66 60 80 65" stroke="#fff" strokeWidth={1.2} fill="none" opacity={0.7} />
          <Pearl cx={30} cy={60} r={8} u={u} />
          <path d="M 10 68 Q 50 62 90 68 L 84 84 Q 50 94 16 84 Z" fill="#f7b4d3" {...ol} />
          {[24, 37, 50, 63, 76].map((x) => (
            <path key={x} d={`M ${x} 70 Q ${50 + (x - 50) * 0.9} 80 ${50 + (x - 50) * 0.85} 89`} stroke="#e47aae" strokeWidth={1} fill="none" opacity={0.7} />
          ))}
          <Spark x={80} y={30} s={0.6} c="#f4d68e" />
        </g>
      );
    }
    case "furn_shell_vanity": {
      const m = fan(50, 46, 24, 7, 180, 360, 5);
      return (
        <g>
          <Floor w={30} />
          <path d={m.d} fill={`url(#${u}-pink)`} {...ol} />
          <path d={fan(50, 46, 17, 6, 180, 360, 3).d} fill="#e6f6ff" {...thin} />
          <path d="M 38 40 L 44 30 M 42 42 L 48 32" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" />
          <rect x={18} y={48} width={64} height={18} rx={4} fill="#fff4fb" {...ol} />
          <rect x={40} y={53} width={20} height={8} rx={2} fill="#ffd9ea" {...thin} />
          <circle cx={50} cy={57} r={1.4} fill={`url(#${u}-gold)`} {...thin} />
          <path d="M 24 66 Q 22 78 20 88 M 76 66 Q 78 78 80 88" stroke="#e2b65e" strokeWidth={4} strokeLinecap="round" fill="none" />
          <path d="M 24 66 Q 22 78 20 88 M 76 66 Q 78 78 80 88" stroke={OUTLINE} strokeWidth={0.8} fill="none" opacity={0.5} />
          <rect x={24} y={40} width={7} height={8} rx={2} fill="#c9f2f0" {...thin} />
          <circle cx={27.5} cy={38} r={2} fill="#ff8fc8" {...thin} />
          <Pearl cx={72} cy={45} r={3} u={u} />
        </g>
      );
    }
    case "furn_clam_chair": {
      const back = fan(50, 70, 36, 8, 180, 360, 7);
      return (
        <g>
          <Floor w={34} />
          <path d={back.d} fill="#c9b6ff" {...ol} />
          {back.pts.slice(1, -1).map(([x, y], i) => (
            <path key={i} d={`M 50 70 L ${x.toFixed(1)} ${y.toFixed(1)}`} stroke="#9f8ae8" strokeWidth={1.1} opacity={0.8} />
          ))}
          <path d="M 22 50 Q 32 38 46 36" stroke="#fff" strokeWidth={2.2} fill="none" opacity={0.6} strokeLinecap="round" />
          <ellipse cx={50} cy={68} rx={28} ry={8} fill="#ffb3d5" {...ol} />
          <path d="M 30 66 Q 50 60 70 66" stroke="#fff" strokeWidth={1.4} fill="none" opacity={0.7} />
          <path d="M 14 70 Q 50 66 86 70 Q 82 84 50 86 Q 18 84 14 70 Z" fill="#b39ef0" {...ol} />
          <path d="M 26 86 L 24 92 M 74 86 L 76 92" stroke="#e2b65e" strokeWidth={4} strokeLinecap="round" />
        </g>
      );
    }
    case "furn_coral_lamp":
      return (
        <g>
          <Floor w={22} />
          <circle cx={50} cy={36} r={34} fill={`url(#${u}-glow)`} />
          <path d="M 50 80 C 50 64 48 54 40 44 C 34 38 30 30 32 22 M 47 58 C 56 50 62 44 64 32 C 65 26 68 22 70 18 M 44 48 C 40 46 34 48 26 42 M 58 46 C 64 46 72 44 76 38" stroke={OUTLINE} strokeWidth={8} strokeLinecap="round" fill="none" />
          <path d="M 50 80 C 50 64 48 54 40 44 C 34 38 30 30 32 22 M 47 58 C 56 50 62 44 64 32 C 65 26 68 22 70 18 M 44 48 C 40 46 34 48 26 42 M 58 46 C 64 46 72 44 76 38" stroke="#ff8a8a" strokeWidth={5} strokeLinecap="round" fill="none" />
          <path d="M 48 74 C 48 62 46 54 39 46" stroke="#ffc2b8" strokeWidth={1.4} fill="none" strokeLinecap="round" />
          {[[32, 21], [70, 17], [26, 42], [76, 38]].map(([x, y], i) => (
            <g key={i}>
              <circle cx={x} cy={y} r={4.4} fill="#fff6d8" {...thin} />
              <circle cx={x - 1.3} cy={y - 1.3} r={1.3} fill="#fff" />
            </g>
          ))}
          <path d="M 34 80 L 66 80 L 62 92 L 38 92 Z" fill={`url(#${u}-pink)`} {...ol} />
          <path d="M 34 80 L 66 80" stroke="#fff" strokeWidth={1} opacity={0.7} />
        </g>
      );
    case "furn_pearl_rug":
      return (
        <g>
          <defs>
            <LG id={`${u}-rug`} x2={1} y2={0} stops={[[0, "#ffd9ec"], [0.35, "#e7dcff"], [0.65, "#cdf3f5"], [1, "#fff1d6"]]} />
          </defs>
          <ellipse cx={50} cy={72} rx={45} ry={17} fill="#e4c9e6" {...ol} />
          <ellipse cx={50} cy={69} rx={45} ry={17} fill={`url(#${u}-rug)`} {...ol} />
          <ellipse cx={50} cy={69} rx={32} ry={11} fill="none" stroke="#fff" strokeWidth={1.6} opacity={0.8} />
          <ellipse cx={50} cy={69} rx={18} ry={6} fill="#fff" opacity={0.5} />
          {Array.from({ length: 16 }, (_, i) => {
            const a = (i / 16) * Math.PI * 2;
            return <circle key={i} cx={50 + Math.cos(a) * 40} cy={69 + Math.sin(a) * 14} r={2} fill="#fffaf6" stroke="#c9a4c6" strokeWidth={0.6} />;
          })}
          <Spark x={70} y={62} s={0.5} />
        </g>
      );
    case "furn_kelp_shelf":
      return (
        <g>
          <Floor w={32} />
          <rect x={20} y={14} width={60} height={76} rx={6} fill="#bfe8d4" {...ol} />
          {[38, 62].map((y) => (
            <rect key={y} x={22} y={y} width={56} height={4} fill="#86cfae" {...thin} />
          ))}
          {[[26, 22, "#ff9fcb", 16], [32, 24, "#c9b6ff", 14], [38, 20, "#7fd9d2", 18], [44, 23, "#f4d68e", 15], [28, 47, "#ff8a73", 15], [35, 45, "#b9a3f5", 17], [42, 48, "#ffc6dd", 14]].map(([x, y, c, h], i) => (
            <rect key={i} x={x as number} y={y as number} width={5.4} height={h as number} rx={1} fill={c as string} {...thin} />
          ))}
          <path d="M 58 36 L 66 28 Q 70 28 72 32 L 64 37 Z" fill="#ffd9ea" {...thin} />
          <circle cx={66} cy={54} r={6} fill={`url(#${u}-pearl)`} {...thin} />
          <rect x={50} y={68} width={20} height={12} rx={2} fill="#ff9fcb" {...thin} />
          <path d={starD(60, 74, 3.4, 1.5)} fill="#fff" />
          <path d="M 18 88 C 12 72 22 62 14 46 C 8 34 18 24 14 12 M 82 88 C 88 72 78 62 86 46 C 92 34 82 24 86 12" stroke={OUTLINE} strokeWidth={6} fill="none" strokeLinecap="round" />
          <path d="M 18 88 C 12 72 22 62 14 46 C 8 34 18 24 14 12 M 82 88 C 88 72 78 62 86 46 C 92 34 82 24 86 12" stroke="#5fae7c" strokeWidth={3.6} fill="none" strokeLinecap="round" />
          {[[13, 30, -30], [17, 56, 30], [87, 30, 30], [83, 60, -30]].map(([x, y, r], i) => (
            <ellipse key={i} cx={x} cy={y} rx={5} ry={2.4} fill="#7cc795" {...thin} transform={`rotate(${r} ${x} ${y})`} />
          ))}
        </g>
      );
    case "furn_crystal_ball_table":
      return (
        <g>
          <Floor w={28} />
          <circle cx={50} cy={36} r={26} fill={`url(#${u}-vglow)`} />
          <path d="M 22 58 Q 50 50 78 58 L 74 76 Q 50 82 26 76 Z" fill="#6b54c4" {...ol} />
          <path d="M 26 76 Q 50 82 74 76" stroke="#f0c76e" strokeWidth={2.4} fill="none" strokeDasharray="1 2.2" />
          <path d="M 44 78 L 40 92 M 56 78 L 60 92" stroke="#e2b65e" strokeWidth={4} strokeLinecap="round" />
          <path d="M 40 56 L 60 56 L 57 50 L 43 50 Z" fill={`url(#${u}-gold)`} {...thin} />
          <defs>
            <RG id={`${u}-cb`} stops={[[0, "#ffffff"], [0.4, "#e7dcff"], [0.8, "#b9a3f5"], [1, "#8f6bf0"]]} />
          </defs>
          <circle cx={50} cy={36} r={15} fill={`url(#${u}-cb)`} {...ol} />
          <path d="M 42 40 Q 48 32 56 36 Q 50 44 44 38" stroke="#fff" strokeWidth={1.2} fill="none" opacity={0.8} />
          <ellipse cx={44} cy={30} rx={4} ry={2.6} fill="#fff" opacity={0.9} transform="rotate(-30 44 30)" />
          <Spark x={66} y={22} s={0.6} c="#f4d68e" />
          <Spark x={32} y={46} s={0.4} />
        </g>
      );
    case "furn_disco_shell": {
      const s = fan(50, 70, 34, 8, 180, 360, 7);
      return (
        <g>
          <Floor w={26} />
          <defs>
            <clipPath id={`${u}-dc`}>
              <path d={s.d} />
            </clipPath>
          </defs>
          <path d={s.d} fill="#e9e6f2" {...ol} />
          <g clipPath={`url(#${u}-dc)`}>
            {Array.from({ length: 9 }, (_, r) =>
              Array.from({ length: 12 }, (_, c) => {
                const cols = ["#ffffff", "#ffd9ec", "#cdf3f5", "#e7dcff", "#fff1c4", "#c9c6d6"];
                return <rect key={`${r}-${c}`} x={14 + c * 6.2} y={34 + r * 4.4} width={5.4} height={3.8} fill={cols[(r * 3 + c * 2) % cols.length]} stroke="#b7b2c9" strokeWidth={0.4} />;
              }),
            )}
          </g>
          <path d={s.d} fill="none" {...ol} />
          <path d="M 42 74 L 58 74 L 62 92 L 38 92 Z" fill={`url(#${u}-gold)`} {...ol} />
          <Spark x={20} y={30} s={0.9} />
          <Spark x={82} y={34} s={0.7} c="#ffd9ec" />
          <Spark x={62} y={24} s={0.5} c="#cdf3f5" />
          <Spark x={30} y={52} s={0.5} />
        </g>
      );
    }
    case "decor_palm_pot":
      return (
        <g>
          <Floor w={20} />
          <path d="M 50 70 C 50 56 52 46 50 34" stroke={OUTLINE} strokeWidth={5} fill="none" strokeLinecap="round" />
          <path d="M 50 70 C 50 56 52 46 50 34" stroke="#c99a6a" strokeWidth={3} fill="none" strokeLinecap="round" />
          {[
            "M 50 34 C 40 24 26 24 16 34 C 28 30 38 32 50 36 Z",
            "M 50 34 C 60 24 74 24 84 34 C 72 30 62 32 50 36 Z",
            "M 50 34 C 44 20 36 12 26 12 C 36 18 42 26 49 36 Z",
            "M 50 34 C 56 20 64 12 74 12 C 64 18 58 26 51 36 Z",
            "M 50 34 C 38 34 28 40 24 52 C 32 44 40 40 50 37 Z",
            "M 50 34 C 62 34 72 40 76 52 C 68 44 60 40 50 37 Z",
          ].map((d, i) => (
            <path key={i} d={d} fill={i % 2 ? "#5fbf8f" : "#7fd3a3"} {...thin} />
          ))}
          <path d="M 32 68 L 68 68 L 63 92 L 37 92 Z" fill={`url(#${u}-pink)`} {...ol} />
          <rect x={30} y={64} width={40} height={7} rx={3} fill="#ffc6dd" {...ol} />
          <path d={starD(50, 80, 4, 1.8)} fill="#fff" opacity={0.85} />
        </g>
      );
    case "decor_treasure_chest":
      return (
        <g>
          <Floor w={32} />
          <circle cx={50} cy={50} r={30} fill={`url(#${u}-glow)`} />
          <path d="M 20 52 Q 22 30 50 28 Q 78 30 80 52 L 80 46 L 20 46 Z" fill="#c78b5a" {...ol} transform="rotate(-12 20 52)" />
          <path d="M 20 52 L 80 52 L 78 88 L 22 88 Z" fill="#d39a66" {...ol} />
          <path d="M 20 60 L 80 60 M 34 52 L 34 88 M 66 52 L 66 88" stroke="#e2b65e" strokeWidth={3.4} />
          <rect x={45} y={56} width={10} height={11} rx={2} fill={`url(#${u}-gold)`} {...thin} />
          <circle cx={50} cy={61} r={1.4} fill={OUTLINE} />
          {[[30, 50], [38, 47], [46, 49], [56, 47], [64, 50], [72, 48]].map(([x, y], i) => (
            <Pearl key={i} cx={x} cy={y} r={3.6} u={u} />
          ))}
          <circle cx={52} cy={44} r={3} fill={`url(#${u}-gold)`} {...thin} />
          <Spark x={28} y={34} s={0.7} c="#f4d68e" />
          <Spark x={76} y={30} s={0.5} />
        </g>
      );
    case "decor_moon_lantern":
      return (
        <g>
          <path d="M 50 2 L 50 22" stroke={OUTLINE} strokeWidth={1.2} />
          <circle cx={50} cy={52} r={36} fill={`url(#${u}-glow)`} />
          <circle cx={50} cy={50} r={25} fill="#fff4cf" {...ol} />
          <path d="M 50 25 A 25 25 0 0 1 50 75 A 18 25 0 0 0 50 25 Z" fill="#f4d68e" opacity={0.7} />
          {[[42, 40, 4], [58, 58, 3], [40, 60, 2.4]].map(([x, y, r], i) => (
            <circle key={i} cx={x} cy={y} r={r} fill="#f2dfa0" opacity={0.8} />
          ))}
          <path d="M 30 40 Q 50 34 70 40 M 26 52 Q 50 48 74 52 M 30 64 Q 50 62 70 64" stroke="#e9c27a" strokeWidth={0.8} fill="none" opacity={0.6} />
          <rect x={44} y={20} width={12} height={6} rx={2} fill={`url(#${u}-gold)`} {...thin} />
          <rect x={44} y={74} width={12} height={5} rx={2} fill={`url(#${u}-gold)`} {...thin} />
          <path d="M 47 79 L 46 90 M 50 79 L 50 92 M 53 79 L 54 90" stroke="#ff9fcb" strokeWidth={1.6} strokeLinecap="round" />
          <ellipse cx={40} cy={36} rx={5} ry={3} fill="#fff" opacity={0.8} transform="rotate(-35 40 36)" />
        </g>
      );
    case "decor_starfish_garland": {
      const pts: [number, number, string][] = [[16, 38, "#ffa98a"], [33, 50, "#ff9fcb"], [50, 54, "#f4d68e"], [67, 50, "#c9b6ff"], [84, 38, "#7fd9d2"]];
      return (
        <g>
          <path d="M 6 26 Q 50 66 94 26" stroke={OUTLINE} strokeWidth={1.6} fill="none" />
          <circle cx={6} cy={26} r={2.4} fill={`url(#${u}-gold)`} {...thin} />
          <circle cx={94} cy={26} r={2.4} fill={`url(#${u}-gold)`} {...thin} />
          {pts.map(([x, y, c], i) => (
            <g key={i} transform={`translate(${x} ${y + 6}) rotate(${i * 13 - 20})`}>
              <path d={starD(0, 0, 10, 4.4)} fill={c} stroke={OUTLINE} strokeWidth={1.4} strokeLinejoin="round" />
              <circle r={1.6} fill="#fff" opacity={0.7} />
              {[0, 72, 144, 216, 288].map((a) => (
                <circle key={a} cx={0} cy={-5.5} r={0.7} fill="#fff" opacity={0.8} transform={`rotate(${a})`} />
              ))}
            </g>
          ))}
        </g>
      );
    }
    case "decor_mushroom_lamp":
      return (
        <g>
          <Floor w={22} />
          <circle cx={50} cy={42} r={36} fill={`url(#${u}-vglow)`} />
          <path d="M 42 56 Q 40 76 36 86 L 64 86 Q 60 76 58 56 Z" fill="#fff4fb" {...ol} />
          <path d="M 18 56 C 16 30 34 18 50 18 C 66 18 84 30 82 56 Q 50 64 18 56 Z" fill="#b48cf0" {...ol} />
          <path d="M 18 56 Q 50 64 82 56 Q 50 70 18 56 Z" fill="#8f6bf0" {...thin} />
          {[[34, 36, 5], [56, 28, 4], [68, 44, 4.4], [46, 46, 3]].map(([x, y, r], i) => (
            <circle key={i} cx={x} cy={y} r={r} fill="#f3e8ff" opacity={0.9} />
          ))}
          <path d="M 26 40 Q 30 28 42 24" stroke="#fff" strokeWidth={2.2} fill="none" opacity={0.7} strokeLinecap="round" />
          <rect x={32} y={84} width={36} height={7} rx={3.5} fill="#c9b6ff" {...ol} />
        </g>
      );
    case "col_spiral_shell":
      return (
        <g>
          <Floor w={22} y={86} />
          <path d="M 22 70 C 18 46 40 18 66 22 C 82 26 84 44 74 54 C 66 62 54 58 56 50 C 58 44 66 46 64 50 L 80 76 Q 50 88 22 70 Z" fill={`url(#${u}-pink)`} {...ol} />
          <path d="M 30 66 C 30 50 44 32 62 32 M 40 72 C 42 58 52 46 66 44" stroke="#e47aae" strokeWidth={1.2} fill="none" />
          <path d="M 64 50 C 74 60 80 68 80 76 C 72 70 62 66 56 60 Z" fill="#fff1d6" {...thin} />
          <path d="M 30 50 Q 38 34 52 28" stroke="#fff" strokeWidth={2.4} fill="none" opacity={0.7} strokeLinecap="round" />
        </g>
      );
    case "col_sea_glass_aqua":
    case "col_sea_glass_rose": {
      const aqua = id === "col_sea_glass_aqua";
      return (
        <g>
          <Floor w={22} y={82} />
          <path d="M 24 56 C 20 38 40 24 58 28 C 78 32 84 52 74 66 C 64 80 32 78 24 56 Z" fill={aqua ? "#9fe6dc" : "#ffb8d4"} opacity={0.9} {...ol} />
          <path d="M 34 54 C 32 42 44 34 56 36 C 68 38 72 50 66 58 C 60 66 38 66 34 54 Z" fill="#fff" opacity={0.35} />
          <path d="M 34 42 Q 42 34 52 34" stroke="#fff" strokeWidth={2.6} fill="none" strokeLinecap="round" opacity={0.85} />
          <Spark x={70} y={36} s={0.6} />
          {!aqua && <Spark x={30} y={70} s={0.4} />}
        </g>
      );
    }
    case "col_amethyst":
      return (
        <g>
          <Floor w={28} y={86} />
          <path d="M 16 82 Q 20 70 34 70 L 70 70 Q 84 72 86 82 Z" fill="#c9bfd6" {...ol} />
          {[[30, 76, 30, -18, "#b48cf0"], [44, 74, 46, -6, "#9f6fe8"], [58, 74, 38, 10, "#c4a6f5"], [70, 76, 24, 24, "#a77ef0"]].map(([x, y, h, r, c], i) => (
            <g key={i} transform={`rotate(${r} ${x} ${y})`}>
              <path d={`M ${(x as number) - 6} ${y} L ${(x as number) - 6} ${(y as number) - (h as number) + 8} L ${x} ${(y as number) - (h as number)} L ${(x as number) + 6} ${(y as number) - (h as number) + 8} L ${(x as number) + 6} ${y} Z`} fill={c as string} {...ol} />
              <path d={`M ${x} ${(y as number) - (h as number)} L ${x} ${y}`} stroke="#e7dcff" strokeWidth={1} />
              <path d={`M ${(x as number) - 3.5} ${(y as number) - 3} L ${(x as number) - 3.5} ${(y as number) - (h as number) + 9}`} stroke="#fff" strokeWidth={1.4} opacity={0.7} />
            </g>
          ))}
          <Spark x={72} y={34} s={0.6} />
        </g>
      );
    case "col_rose_quartz":
      return (
        <g>
          <Floor w={24} y={84} />
          <path d="M 20 64 L 30 34 L 56 22 L 78 38 L 82 64 L 58 80 L 32 78 Z" fill="#ffc2d8" {...ol} />
          <path d="M 30 34 L 48 46 L 56 22 M 48 46 L 78 38 M 48 46 L 58 80 M 48 46 L 20 64" stroke="#f08fb6" strokeWidth={1.2} fill="none" />
          <path d="M 30 34 L 48 46 L 20 64 Z" fill="#ffe0ec" />
          <path d="M 48 46 L 78 38 L 82 64 L 58 80 Z" fill="#f7a8c8" opacity={0.6} />
          <path d="M 30 36 L 46 46 L 22 62 Z" fill="none" {...thin} />
          <Spark x={36} y={44} s={0.5} />
        </g>
      );
    case "col_moonstone":
      return (
        <g>
          <defs>
            <RG id={`${u}-mst`} stops={[[0, "#ffffff"], [0.4, "#e6f6ff"], [0.75, "#b9d4ff"], [1, "#b39ef0"]]} />
          </defs>
          <Floor w={24} y={82} />
          <ellipse cx={50} cy={52} rx={28} ry={22} fill={`url(#${u}-mst)`} {...ol} />
          <path d="M 30 56 Q 50 40 72 50 Q 56 52 40 62 Z" fill="#9fd8ff" opacity={0.55} />
          <ellipse cx={40} cy={42} rx={8} ry={4.4} fill="#fff" opacity={0.9} transform="rotate(-25 40 42)" />
          <Spark x={70} y={32} s={0.6} c="#e7dcff" />
        </g>
      );
    case "col_talisman_eye":
      return (
        <g>
          <circle cx={50} cy={50} r={30} fill={`url(#${u}-gold)`} {...ol} />
          <circle cx={50} cy={50} r={25} fill="#2a63c9" {...thin} />
          <circle cx={50} cy={50} r={17} fill="#ffffff" {...thin} />
          <circle cx={50} cy={50} r={11} fill="#7fc8f5" {...thin} />
          <circle cx={50} cy={50} r={5.4} fill="#1a1f4d" />
          <circle cx={46} cy={45} r={2.6} fill="#fff" />
          <path d="M 32 34 Q 40 26 52 25" stroke="#fff" strokeWidth={2} fill="none" opacity={0.5} strokeLinecap="round" />
          <circle cx={50} cy={16} r={3} fill={`url(#${u}-gold)`} {...thin} />
        </g>
      );
    case "col_golden_scallop": {
      const s = fan(50, 76, 34, 9, 180, 360, 6);
      return (
        <g>
          <Floor w={26} y={86} />
          <circle cx={50} cy={52} r={36} fill={`url(#${u}-glow)`} />
          <path d={s.d} fill={`url(#${u}-gold)`} {...ol} />
          {s.pts.slice(1, -1).map(([x, y], i) => (
            <path key={i} d={`M 50 76 L ${x.toFixed(1)} ${y.toFixed(1)}`} stroke="#b98a3a" strokeWidth={1.1} opacity={0.8} />
          ))}
          <path d="M 40 76 L 34 84 L 66 84 L 60 76 Z" fill="#e2b65e" {...ol} />
          <path d="M 24 60 Q 32 46 46 42" stroke="#fff" strokeWidth={2.6} fill="none" opacity={0.75} strokeLinecap="round" />
          <Spark x={76} y={30} s={0.8} />
          <Spark x={22} y={36} s={0.5} c="#fff1c4" />
        </g>
      );
    }
    case "col_glowshroom":
      return (
        <g>
          <Floor w={20} y={86} />
          <circle cx={50} cy={50} r={32} fill={`url(#${u}-vglow)`} />
          <path d="M 44 58 Q 42 74 40 84 L 60 84 Q 58 74 56 58 Z" fill="#fff4fb" {...ol} />
          <path d="M 24 60 C 22 38 38 28 50 28 C 62 28 78 38 76 60 Q 50 66 24 60 Z" fill="#a77ef0" {...ol} />
          {[[38, 44, 4], [56, 38, 3.4], [64, 52, 3]].map(([x, y, r], i) => (
            <circle key={i} cx={x} cy={y} r={r} fill="#f3e8ff" />
          ))}
          <path d="M 32 48 Q 36 38 44 34" stroke="#fff" strokeWidth={2} fill="none" opacity={0.7} strokeLinecap="round" />
          <circle cx={46} cy={70} r={1.2} fill={OUTLINE} />
          <circle cx={54} cy={70} r={1.2} fill={OUTLINE} />
          <path d="M 48 73 Q 50 75 52 73" stroke={OUTLINE} strokeWidth={0.9} fill="none" />
          <Spark x={76} y={28} s={0.5} />
        </g>
      );
    default:
      return null;
  }
}

const HAT_FIT: Record<string, [number, number]> = {
  hat_witch_pink: [0.72, -4],
  hat_crescent: [0.72, -4],
  hat_pearl_crown: [1.55, 0],
  hat_sun_straw: [0.56, 6],
  hat_sun_pink: [0.54, 12],
  hat_flower_crown: [0.85, 8],
  hat_beanie_black: [0.72, 10],
  hat_crystal_tiara: [1.35, -4],
};

function drawWearable(id: string, slot: string, u: string): ReactNode {
  switch (slot) {
    case "outfit":
      return (
        <g>
          <path d="M 50 18 L 50 12 Q 50 6 55 6 Q 59 6 59 10" stroke="#c8923c" strokeWidth={1.8} fill="none" strokeLinecap="round" />
          <path d="M 28 24 L 50 16 L 72 24" stroke="#c8923c" strokeWidth={2.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <g transform="translate(50 57) scale(0.68) translate(-100 -199)">
            <OutfitIconPart id={id} u={u} />
          </g>
        </g>
      );
    case "tail":
      return (
        <g transform="translate(50 52) scale(1.02) translate(-104 -220)">
          <TailPart id={id} b={DEFAULT_BUILD} u={u} sway={false} />
        </g>
      );
    case "hat": {
      const [s, cy] = HAT_FIT[id] ?? [0.7, 0];
      return (
        <g transform={`translate(50 ${54 - cy * s}) scale(${s})`}>
          <HatPart id={id} u={u} />
        </g>
      );
    }
    case "necklace":
      return (
        <g transform={id === "neck_black_pearl" ? "translate(50 58) scale(3.6)" : "translate(50 34) scale(3)"}>
          <NecklacePart id={id} u={u} />
        </g>
      );
    case "earrings":
      return (
        <g>
          <g transform="translate(34 30) scale(3.2)">
            <EarringPart id={id} />
          </g>
          <g transform="translate(66 30) scale(3.2)">
            <EarringPart id={id} />
          </g>
        </g>
      );
    case "hair_acc":
      if (id === "hair_moon_pins")
        return (
          <g>
            {[[-16, 6, -20], [0, -2, 0], [16, 6, 20]].map(([x, y, r], i) => (
              <g key={i} transform={`translate(${50 + x} ${50 + y}) rotate(${r})`}>
                <path d="M -1.6 4 L -1.6 34 M 1.6 4 L 1.6 30" stroke="#a87a2a" strokeWidth={1.8} strokeLinecap="round" />
                {i === 1 ? (
                  <path d={starD(0, -2, 11, 4.6)} fill="#f4d68e" stroke={OUTLINE} strokeWidth={1.4} strokeLinejoin="round" />
                ) : (
                  <path d="M0 -10 A10 10 0 1 0 8 7 A7.6 7.6 0 1 1 0 -10 Z" fill="#f4d68e" stroke={OUTLINE} strokeWidth={1.4} transform="translate(0 -2)" />
                )}
              </g>
            ))}
            <Spark x={78} y={24} s={0.6} />
          </g>
        );
      return (
        <g transform={`translate(50 ${id === "hair_moon_pins" ? 40 : 50}) scale(${id === "hair_sunglasses" ? 1.35 : id === "hair_moon_pins" ? 0.95 : 2.6})`}>
          <HairAccPart id={id} />
        </g>
      );
    case "companion":
      return (
        <g transform="translate(50 50) scale(1.65)">
          <CompanionPart id={id} u={u} />
        </g>
      );
    default:
      return null;
  }
}

export function ItemIcon({ itemId, size = 56, className }: { itemId: string; size?: number; className?: string }) {
  const u = safeId(useId());
  const item = itemById(itemId);
  let art: ReactNode = null;
  if (item?.slot) art = drawWearable(itemId, item.slot, u);
  else if (item) art = drawPlaced(itemId, u);
  if (!art) {
    art = (
      <g>
        <Floor w={20} y={80} />
        <Pearl cx={50} cy={52} r={22} u={u} />
        <Spark x={72} y={30} s={0.7} />
      </g>
    );
  }
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} role="img" aria-label={item?.name ?? "Pearl"} style={{ overflow: "visible" }}>
      <SharedDefs u={u} />
      {art}
    </svg>
  );
}
