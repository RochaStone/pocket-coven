"use client";

import { useId, useMemo, type CSSProperties, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

/* ------------------------------------------------------------------ */
/* Shared art primitives (used by every component in components/art)  */
/* ------------------------------------------------------------------ */

export const PLUM = "#6b3a5e";

/** SVG-safe unique id prefix (useId output contains characters url(#) dislikes). */
export function useArtId(prefix = "pc"): string {
  const id = useId();
  return prefix + id.replace(/[^a-zA-Z0-9]/g, "");
}

/** Deterministic PRNG so server and client render identical sparkle fields. */
export function rng(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const r2 = (n: number) => Math.round(n * 100) / 100;

/** Four-point "glint" star path centred on (cx, cy). */
export function starPath(cx: number, cy: number, r: number, pinch = 0.16): string {
  const p = r * pinch;
  return `M${cx} ${cy - r}Q${cx + p} ${cy - p} ${cx + r} ${cy}Q${cx + p} ${cy + p} ${cx} ${cy + r}Q${cx - p} ${cy + p} ${cx - r} ${cy}Q${cx - p} ${cy - p} ${cx} ${cy - r}Z`;
}

/**
 * Lobed "Polly Pocket clamshell" outline: a superellipse sampled at n points,
 * each segment bulging outward into a scallop lobe. Shared by the shell base and the world map.
 */
export function lobedPath(cx: number, cy: number, a: number, b: number, n = 14, bump = 1.12, power = 3.2, phase = 0): string {
  const pt = (t: number, k = 1): [number, number] => {
    const c = Math.cos(t);
    const s = Math.sin(t);
    const x = Math.sign(c) * Math.pow(Math.abs(c), 2 / power) * a * k;
    const y = Math.sign(s) * Math.pow(Math.abs(s), 2 / power) * b * k;
    return [Math.round((cx + x) * 1e4) / 1e4, Math.round((cy + y) * 1e4) / 1e4];
  };
  const step = (Math.PI * 2) / n;
  const t0 = -Math.PI / 2 + step / 2 + phase;
  const [sx, sy] = pt(t0);
  let d = `M${sx} ${sy}`;
  for (let i = 0; i < n; i++) {
    const ta = t0 + i * step;
    const [ex, ey] = pt(ta + step);
    const [qx, qy] = pt(ta + step / 2, bump);
    d += `Q${qx} ${qy} ${ex} ${ey}`;
  }
  return d + "Z";
}

/** Five-point star path. */
export function star5Path(cx: number, cy: number, r: number, inner = 0.45): string {
  let d = "";
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * inner;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    d += `${i === 0 ? "M" : "L"}${(cx + rad * Math.cos(a)).toFixed(2)} ${(cy + rad * Math.sin(a)).toFixed(2)}`;
  }
  return d + "Z";
}

/** A twinkling glint inside an SVG. */
export function Glint({
  x,
  y,
  r = 4,
  fill = "#fff",
  delay = 0,
  dur = 2.4,
  still = false,
  opacity = 1,
}: {
  x: number;
  y: number;
  r?: number;
  fill?: string;
  delay?: number;
  dur?: number;
  still?: boolean;
  opacity?: number;
}) {
  return (
    <path
      d={starPath(x, y, r)}
      fill={fill}
      opacity={opacity}
      className={still ? undefined : "anim-twinkle"}
      style={still ? undefined : { animationDelay: `${delay}s`, animationDuration: `${dur}s` }}
    />
  );
}

/** A glossy pearl built from layered flat shapes (no gradient ids needed). */
export function Pearl({ x, y, r, tint = "#f6d5ec" }: { x: number; y: number; r: number; tint?: string }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill="#fff7fb" stroke={PLUM} strokeOpacity={0.45} strokeWidth={Math.max(0.6, r * 0.18)} />
      <path d={`M${x - r * 0.9} ${y + r * 0.1}A${r * 0.9} ${r * 0.9} 0 0 0 ${x + r * 0.9} ${y + r * 0.1}A${r} ${r * 0.7} 0 0 1 ${x - r * 0.9} ${y + r * 0.1}Z`} fill={tint} opacity={0.8} />
      <circle cx={x - r * 0.32} cy={y - r * 0.35} r={r * 0.32} fill="#fff" />
    </g>
  );
}

/** Stylised Bali palm. (x, y) is the base of the trunk. */
export function Palm({
  x,
  y,
  h = 80,
  lean = 8,
  flip = false,
  frond = "#3fbf9f",
  frondDark = "#23907c",
  trunk = "#c99a6a",
  sway = true,
  delay = 0,
}: {
  x: number;
  y: number;
  h?: number;
  lean?: number;
  flip?: boolean;
  frond?: string;
  frondDark?: string;
  trunk?: string;
  sway?: boolean;
  delay?: number;
}) {
  const s = flip ? -1 : 1;
  const topX = x + lean * s;
  const topY = y - h;
  const fl = h * 0.55;
  const fronds = [-150, -115, -80, -45, -10, 25].map((deg, i) => {
    const a = (deg * Math.PI) / 180;
    const ex = topX + Math.cos(a) * fl * (i % 2 ? 0.9 : 1) * s;
    const ey = topY + Math.sin(a) * fl * 0.55 + fl * 0.25;
    const mx = topX + Math.cos(a) * fl * 0.5 * s;
    const my = topY + Math.sin(a) * fl * 0.5 - fl * 0.12;
    return { ex: r2(ex), ey: r2(ey), mx: r2(mx), my: r2(my), i };
  });
  return (
    <g>
      <path
        d={`M${x - h * 0.05} ${y}Q${x + lean * 0.3 * s} ${y - h * 0.5} ${topX - h * 0.025} ${topY}L${topX + h * 0.025} ${topY}Q${x + lean * 0.3 * s + h * 0.05} ${y - h * 0.5} ${x + h * 0.05} ${y}Z`}
        fill={trunk}
        stroke={PLUM}
        strokeWidth={1}
        strokeOpacity={0.6}
      />
      {[0.25, 0.45, 0.65, 0.82].map((t) => {
        const cx = x + (topX - x) * t * t;
        const cy = y - h * t;
        return <path key={t} d={`M${cx - h * 0.045} ${cy}q${h * 0.045} ${h * 0.03} ${h * 0.09} 0`} stroke={PLUM} strokeOpacity={0.35} strokeWidth={0.8} fill="none" />;
      })}
      <g
        className={sway ? "pc-palm-sway" : undefined}
        style={{ transformOrigin: `${topX}px ${topY}px`, animationDelay: `${delay}s` }}
      >
        {fronds.map(({ ex, ey, mx, my, i }) => (
          <path
            key={i}
            d={`M${topX} ${topY}Q${mx} ${my - fl * 0.12} ${ex} ${ey}Q${mx + (ex - topX) * 0.1} ${my + fl * 0.14} ${topX} ${topY}Z`}
            fill={i % 2 ? frondDark : frond}
            stroke={PLUM}
            strokeWidth={0.9}
            strokeOpacity={0.55}
          />
        ))}
        <circle cx={topX - 2 * s} cy={topY + 2} r={h * 0.035} fill="#9c6a3a" />
        <circle cx={topX + 2 * s} cy={topY + 3} r={h * 0.03} fill="#b07a45" />
      </g>
    </g>
  );
}

/** Frangipani blossom. */
export function Frangipani({ x, y, r = 6, rot = 0 }: { x: number; y: number; r?: number; rot?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cx={0} cy={-r * 0.62} rx={r * 0.42} ry={r * 0.68} transform={`rotate(${a})`} fill="#fffaf2" stroke={PLUM} strokeOpacity={0.4} strokeWidth={0.6} />
      ))}
      <circle r={r * 0.36} fill="#ffd36e" />
    </g>
  );
}

/** Global keyframes used by art components (rendered once per component, harmless if duplicated). */
export function ArtKeyframes() {
  return (
    <style>{`
@keyframes pcSway { 0% { transform: rotate(-5deg); } 100% { transform: rotate(5deg); } }
@keyframes pcPalm { 0%,100% { transform: rotate(-2.5deg); } 50% { transform: rotate(2.5deg); } }
@keyframes pcRise { 0% { transform: translateY(0); opacity: 0; } 15% { opacity: .95; } 100% { transform: translateY(-46px); opacity: 0; } }
@keyframes pcPulse { 0%,100% { opacity: .55; } 50% { opacity: 1; } }
@keyframes pcSpin { to { transform: rotate(360deg); } }
@keyframes pcBob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
@keyframes pcSteam { 0% { transform: translateY(0) scaleX(1); opacity: 0; } 30% { opacity: .8; } 100% { transform: translateY(-18px) scaleX(1.4); opacity: 0; } }
@keyframes pcGlow { 0%,100% { opacity: .35; } 50% { opacity: .85; } }
@keyframes pcRay { 0%,100% { opacity: .18; } 50% { opacity: .42; } }
.pc-palm-sway { animation: pcPalm 5s ease-in-out infinite; }
.pc-sway { animation: pcSway 3.2s ease-in-out infinite alternate; transform-box: fill-box; transform-origin: 50% 100%; }
.pc-rise { animation: pcRise 4.2s ease-in infinite; transform-box: fill-box; }
.pc-pulse { animation: pcPulse 2.2s ease-in-out infinite; }
.pc-bob { animation: pcBob 3s ease-in-out infinite; transform-box: fill-box; }
.pc-steam { animation: pcSteam 2.8s ease-out infinite; transform-box: fill-box; transform-origin: 50% 100%; }
.pc-glow { animation: pcGlow 3s ease-in-out infinite; }
.pc-ray { animation: pcRay 4s ease-in-out infinite; }
.pc-spin { animation: pcSpin 14s linear infinite; transform-box: fill-box; transform-origin: center; }
@media (prefers-reduced-motion: reduce) {
  .pc-palm-sway, .pc-sway, .pc-rise, .pc-pulse, .pc-bob, .pc-steam, .pc-glow, .pc-ray, .pc-spin { animation: none !important; }
}
`}</style>
  );
}

/* ------------------------------------------------------------------ */
/* Sparkles: ambient glitter overlay                                  */
/* ------------------------------------------------------------------ */

const GLITTER = ["#ffffff", "#fff3c4", "#ffd2ea", "#d9fbf7", "#efe2ff"];

export function Sparkles({ count = 14, className = "" }: { count?: number; className?: string }) {
  const reduce = useReducedMotion();
  const items = useMemo(() => {
    const r = rng(count * 7919 + 13);
    return Array.from({ length: count }, (_, i) => ({
      left: 4 + r() * 92,
      top: 4 + r() * 92,
      size: 6 + r() * 12,
      delay: r() * 3,
      dur: 1.8 + r() * 2.4,
      color: GLITTER[i % GLITTER.length],
      dot: r() > 0.7,
    }));
  }, [count]);
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 overflow-visible ${className}`}>
      {items.map((s, i) => (
        <svg
          key={i}
          viewBox="-10 -10 20 20"
          width={s.size}
          height={s.size}
          className={reduce ? undefined : "anim-twinkle"}
          style={{
            position: "absolute",
            left: `${s.left}%`,
            top: `${s.top}%`,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.dur}s`,
            filter: "drop-shadow(0 0 3px rgba(255,255,255,.9))",
            opacity: reduce ? 0.7 : undefined,
          }}
        >
          {s.dot ? <circle r={3.2} fill={s.color} /> : <path d={starPath(0, 0, 9)} fill={s.color} />}
        </svg>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* TreasureBurst: celebratory reveal                                   */
/* ------------------------------------------------------------------ */

export function TreasureBurst({ show, children }: { show: boolean; children?: ReactNode }) {
  const reduce = useReducedMotion();
  const id = useArtId("tb");
  const particles = useMemo(() => {
    const r = rng(42);
    return Array.from({ length: 22 }, (_, i) => {
      const a = (i / 22) * Math.PI * 2 + r() * 0.3;
      const dist = 110 + r() * 90;
      return { x: Math.cos(a) * dist, y: Math.sin(a) * dist, size: 8 + r() * 12, delay: r() * 0.25, color: GLITTER[i % GLITTER.length], dot: i % 3 === 0 };
    });
  }, []);
  const rays = Array.from({ length: 16 }, (_, i) => i);
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="burst"
          className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.35 } }}
          transition={{ duration: reduce ? 0.15 : 0.25 }}
        >
          <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 50% 50%, rgba(255,246,214,.75) 0%, rgba(255,214,234,.45) 35%, rgba(255,214,234,0) 70%)" }} />
          <motion.svg
            viewBox="-200 -200 400 400"
            className="absolute"
            style={{ width: "min(120vw, 560px)", height: "min(120vw, 560px)" }}
            initial={{ scale: reduce ? 1 : 0.2, rotate: 0 }}
            animate={reduce ? { scale: 1 } : { scale: 1, rotate: 360 }}
            transition={reduce ? { duration: 0 } : { scale: { type: "spring", stiffness: 120, damping: 14 }, rotate: { duration: 24, ease: "linear", repeat: Infinity } }}
          >
            <defs>
              <radialGradient id={`${id}-ray`} cx="0" cy="0" r="200" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#fff6cf" stopOpacity="1" />
                <stop offset="0.6" stopColor="#ffd0e6" stopOpacity="0.55" />
                <stop offset="1" stopColor="#ffd0e6" stopOpacity="0" />
              </radialGradient>
            </defs>
            {rays.map((i) => {
              const a0 = (i / 16) * Math.PI * 2;
              const a1 = a0 + Math.PI / 22;
              return <path key={i} d={`M0 0L${Math.cos(a0) * 200} ${Math.sin(a0) * 200}L${Math.cos(a1) * 200} ${Math.sin(a1) * 200}Z`} fill={`url(#${id}-ray)`} opacity={i % 2 ? 0.55 : 0.9} />;
            })}
          </motion.svg>
          {!reduce &&
            particles.map((p, i) => (
              <motion.svg
                key={i}
                viewBox="-10 -10 20 20"
                width={p.size}
                height={p.size}
                className="absolute"
                style={{ filter: "drop-shadow(0 0 4px #fff)" }}
                initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                animate={{ x: p.x, y: p.y, scale: [0, 1.3, 0.6], opacity: [1, 1, 0] }}
                transition={{ duration: 1.3, delay: 0.15 + p.delay, ease: "easeOut" }}
              >
                {p.dot ? <circle r={4} fill={p.color} /> : <path d={starPath(0, 0, 9.5)} fill={p.color} />}
              </motion.svg>
            ))}
          <motion.div
            className="relative flex flex-col items-center"
            initial={reduce ? { opacity: 0 } : { scale: 0, y: 40, rotate: -12 }}
            animate={reduce ? { opacity: 1 } : { scale: 1, y: 0, rotate: 0 }}
            transition={reduce ? { duration: 0.2 } : { type: "spring", stiffness: 260, damping: 13, delay: 0.12 }}
          >
            <div className="relative grid place-items-center" style={{ width: 148, height: 148 }}>
              <svg viewBox="0 0 148 148" className="absolute inset-0" aria-hidden>
                <defs>
                  <radialGradient id={`${id}-orb`} cx="40%" cy="35%" r="70%">
                    <stop offset="0" stopColor="#ffffff" />
                    <stop offset="0.55" stopColor="#ffe9f5" />
                    <stop offset="0.85" stopColor="#f1ddff" />
                    <stop offset="1" stopColor="#d9f6f6" />
                  </radialGradient>
                </defs>
                <circle cx="74" cy="74" r="66" fill={`url(#${id}-orb)`} stroke="#e9c27a" strokeWidth="5" />
                <circle cx="74" cy="74" r="66" fill="none" stroke={PLUM} strokeOpacity={0.35} strokeWidth="1.5" />
                <circle cx="74" cy="74" r="58" fill="none" stroke="#fff" strokeWidth="2" strokeDasharray="2 7" strokeLinecap="round" />
                <ellipse cx="52" cy="40" rx="20" ry="9" fill="#fff" opacity="0.8" transform="rotate(-28 52 40)" />
              </svg>
              <div className="relative z-10 grid place-items-center" style={{ width: 100, height: 100 }}>
                {children}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ */
/* JoinRipple: small pearly ring burst                                 */
/* ------------------------------------------------------------------ */

export function JoinRipple() {
  const reduce = useReducedMotion();
  const dots = [0, 60, 120, 180, 240, 300];
  const wrap: CSSProperties = { position: "absolute", left: "50%", top: "50%", width: 0, height: 0, pointerEvents: "none" };
  if (reduce) {
    return (
      <span aria-hidden style={wrap}>
        <motion.span
          initial={{ opacity: 0.9 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          style={{ position: "absolute", left: -36, top: -36, width: 72, height: 72, borderRadius: "50%", border: "3px solid #ffd2ea", boxShadow: "0 0 12px #fff" }}
        />
      </span>
    );
  }
  return (
    <span aria-hidden style={wrap}>
      {[0, 0.15, 0.3].map((d, i) => (
        <motion.span
          key={i}
          initial={{ scale: 0.25, opacity: 0.95 }}
          animate={{ scale: 1.9, opacity: 0 }}
          transition={{ duration: 1.1, delay: d, ease: "easeOut" }}
          style={{
            position: "absolute",
            left: -40,
            top: -40,
            width: 80,
            height: 80,
            borderRadius: "50%",
            border: `${3 - i * 0.6}px solid ${["#ffffff", "#ffc8e2", "#7ee6dc"][i]}`,
            boxShadow: "0 0 10px rgba(255,255,255,.9), inset 0 0 8px rgba(255,200,226,.8)",
          }}
        />
      ))}
      {dots.map((deg, i) => {
        const a = (deg * Math.PI) / 180;
        return (
          <motion.svg
            key={deg}
            viewBox="-10 -10 20 20"
            width={14}
            height={14}
            style={{ position: "absolute", left: -7, top: -7, filter: "drop-shadow(0 0 3px #fff)" }}
            initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
            animate={{ x: Math.cos(a) * 58, y: Math.sin(a) * 58, scale: [0, 1.2, 0.4], opacity: [1, 1, 0] }}
            transition={{ duration: 0.9, delay: 0.1, ease: "easeOut" }}
          >
            <path d={starPath(0, 0, 9)} fill={GLITTER[i % GLITTER.length]} />
          </motion.svg>
        );
      })}
    </span>
  );
}
