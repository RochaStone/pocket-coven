// Tiny colour helpers for the art layer. All inputs are hex strings (#rgb or #rrggbb).

export const OUTLINE = "#6b3a5e";
export const INK = "#4a2448";

type RGB = [number, number, number];

export function hexToRgb(hex: string): RGB {
  let h = hex.trim().replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return [255, 192, 220];
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

export function rgbToHex([r, g, b]: RGB): string {
  const c = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

/** Linear mix: t=0 returns a, t=1 returns b. */
export function mix(a: string, b: string, t: number): string {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  return rgbToHex([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t]);
}

export const lighten = (hex: string, t: number) => mix(hex, "#ffffff", t);
/** Darkens toward a deep plum rather than black, so shadows stay warm and toy-like. */
export const darken = (hex: string, t: number) => mix(hex, "#1c0e22", t);

export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export interface HairPalette {
  base: string;
  light: string;
  shine: string;
  shade: string;
  deep: string;
  line: string;
}

export function hairPalette(hex: string): HairPalette {
  const lum = luminance(hex);
  const dark = lum < 0.06;
  return {
    base: hex,
    light: lighten(hex, dark ? 0.22 : 0.3),
    shine: lighten(hex, dark ? 0.45 : 0.65),
    shade: darken(hex, dark ? 0.15 : 0.22),
    deep: darken(hex, dark ? 0.3 : 0.42),
    line: dark ? "#140c1a" : mix(darken(hex, 0.5), OUTLINE, 0.55),
  };
}

export interface SkinPalette {
  base: string;
  light: string;
  shade: string;
  blush: string;
  line: string;
}

export function skinPalette(hex: string): SkinPalette {
  return {
    base: hex,
    light: lighten(hex, 0.35),
    shade: mix(darken(hex, 0.14), "#e2788f", 0.18),
    blush: mix(hex, "#ff5c93", 0.55),
    line: mix(darken(hex, 0.55), OUTLINE, 0.6),
  };
}

/** Strips characters that are not safe inside SVG ids / url(#...) references. */
export function safeId(raw: string): string {
  return "pc" + raw.replace(/[^a-zA-Z0-9_-]/g, "");
}
