"use client";
// Tiny synthesized sound effects (WebAudio, no files). Quiet, short and pentatonic.
import { useCallback, useSyncExternalStore } from "react";

export type SoundName = "shell" | "bubble" | "chime" | "gift" | "join" | "coin" | "oracle" | "tap";

const MUTE_KEY = "pocket-coven:muted";
const MASTER = 0.22;

// C major pentatonic, in Hz.
const N = {
  A4: 440, C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880,
  C6: 1046.5, D6: 1174.66, E6: 1318.51, G6: 1567.98, A6: 1760,
} as const;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let mutedCache: boolean | null = null;
const listeners = new Set<() => void>();

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    try {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = MASTER;
      // A gentle lowpass keeps everything soft on phone speakers.
      const soften = ctx.createBiquadFilter();
      soften.type = "lowpass";
      soften.frequency.value = 6000;
      master.connect(soften).connect(ctx.destination);
    } catch {
      ctx = null;
      return null;
    }
  }
  return ctx;
}

// Browsers only let audio start inside a user gesture: unlock on the first one.
function unlock() {
  const ac = audio();
  if (!ac) return;
  if (ac.state === "suspended") ac.resume().catch(() => undefined);
  try {
    const b = ac.createBuffer(1, 1, 22050);
    const src = ac.createBufferSource();
    src.buffer = b;
    src.connect(ac.destination);
    src.start(0);
  } catch {
    // Nothing to do: the next gesture tries again.
  }
  if (ac.state === "running") {
    for (const ev of ["pointerdown", "touchend", "keydown"] as const) window.removeEventListener(ev, unlock, true);
  }
}
if (typeof window !== "undefined") {
  for (const ev of ["pointerdown", "touchend", "keydown"] as const) window.addEventListener(ev, unlock, { capture: true, passive: true });
}

export function isMuted(): boolean {
  if (mutedCache !== null) return mutedCache;
  try {
    mutedCache = typeof localStorage !== "undefined" && localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    mutedCache = false;
  }
  return mutedCache;
}

export function setMuted(muted: boolean) {
  mutedCache = muted;
  try {
    localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
  } catch {
    // Storage unavailable: the choice lasts for this visit.
  }
  listeners.forEach((l) => l());
}

type Voice = { freq: number; at?: number; dur?: number; type?: OscillatorType; gain?: number; attack?: number; glideTo?: number; detune?: number; vibrato?: number };

function tone(ac: AudioContext, out: AudioNode, t0: number, v: Voice) {
  const start = t0 + (v.at ?? 0);
  const dur = v.dur ?? 0.3;
  const attack = v.attack ?? 0.008;
  const peak = v.gain ?? 0.5;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = v.type ?? "sine";
  osc.frequency.setValueAtTime(v.freq, start);
  if (v.glideTo) osc.frequency.exponentialRampToValueAtTime(v.glideTo, start + dur * 0.8);
  if (v.detune) osc.detune.value = v.detune;
  if (v.vibrato) {
    const lfo = ac.createOscillator();
    const depth = ac.createGain();
    lfo.frequency.value = 5;
    depth.gain.value = v.vibrato;
    lfo.connect(depth).connect(osc.frequency);
    lfo.start(start);
    lfo.stop(start + dur + 0.05);
  }
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(peak, start + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(g).connect(out);
  osc.start(start);
  osc.stop(start + dur + 0.05);
}

// Bell: a fundamental plus a soft, slightly inharmonic overtone.
function bell(ac: AudioContext, out: AudioNode, t0: number, freq: number, at: number, dur = 0.9, gain = 0.4) {
  tone(ac, out, t0, { freq, at, dur, gain, attack: 0.004 });
  tone(ac, out, t0, { freq: freq * 2.76, at, dur: dur * 0.45, gain: gain * 0.18, attack: 0.002 });
}

const SOUNDS: Record<SoundName, (ac: AudioContext, out: AudioNode, t: number) => void> = {
  // Soft shimmering open: a rising pentatonic sweep with a twinkle on top.
  shell: (ac, out, t) => {
    [N.C5, N.E5, N.G5, N.A5, N.C6].forEach((f, i) => {
      tone(ac, out, t, { freq: f, at: i * 0.05, dur: 0.6, type: "triangle", gain: 0.22 });
      tone(ac, out, t, { freq: f, at: i * 0.05, dur: 0.6, type: "sine", gain: 0.12, detune: 7 });
    });
    bell(ac, out, t, N.E6, 0.28, 0.7, 0.14);
    bell(ac, out, t, N.A6, 0.34, 0.6, 0.08);
  },
  bubble: (ac, out, t) => {
    tone(ac, out, t, { freq: 380, glideTo: 980, dur: 0.12, gain: 0.35, attack: 0.004 });
    tone(ac, out, t, { freq: 520, glideTo: 1250, at: 0.07, dur: 0.1, gain: 0.22, attack: 0.004 });
  },
  chime: (ac, out, t) => {
    bell(ac, out, t, N.G5, 0, 1.0, 0.35);
    bell(ac, out, t, N.D6, 0.09, 1.1, 0.28);
  },
  gift: (ac, out, t) => {
    [N.E5, N.G5, N.C6, N.E6].forEach((f, i) => bell(ac, out, t, f, i * 0.07, 0.55, 0.26));
    tone(ac, out, t, { freq: N.G6, at: 0.3, dur: 0.5, gain: 0.08, vibrato: 6 });
  },
  join: (ac, out, t) => {
    tone(ac, out, t, { freq: N.C5, dur: 0.35, type: "triangle", gain: 0.28, attack: 0.02 });
    tone(ac, out, t, { freq: N.G5, at: 0.12, dur: 0.5, type: "triangle", gain: 0.28, attack: 0.02 });
  },
  coin: (ac, out, t) => {
    tone(ac, out, t, { freq: N.A5, dur: 0.08, type: "square", gain: 0.07, attack: 0.002 });
    tone(ac, out, t, { freq: N.E6, at: 0.07, dur: 0.32, type: "square", gain: 0.07, attack: 0.002 });
    tone(ac, out, t, { freq: N.E6, at: 0.07, dur: 0.32, gain: 0.18, attack: 0.002 });
  },
  // Low mystic hum, then a single twinkle.
  oracle: (ac, out, t) => {
    tone(ac, out, t, { freq: N.A4, dur: 1.1, type: "triangle", gain: 0.16, attack: 0.25, vibrato: 3 });
    tone(ac, out, t, { freq: N.E5, dur: 1.1, gain: 0.12, attack: 0.3, vibrato: 4 });
    bell(ac, out, t, N.D6, 0.45, 0.8, 0.18);
  },
  tap: (ac, out, t) => {
    tone(ac, out, t, { freq: N.E6, glideTo: N.D6, dur: 0.06, gain: 0.18, attack: 0.002 });
  },
};

export function play(name: SoundName) {
  if (isMuted()) return;
  const ac = audio();
  if (!ac || !master) return;
  if (ac.state === "suspended") ac.resume().catch(() => undefined);
  try {
    SOUNDS[name](ac, master, ac.currentTime + 0.01);
  } catch {
    // Sound is decoration: never let it break a tap.
  }
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function useSound() {
  const muted = useSyncExternalStore(subscribe, isMuted, () => false);
  const toggle = useCallback(() => {
    const next = !isMuted();
    setMuted(next);
    if (!next) play("tap");
  }, []);
  return { play, muted, toggle };
}
