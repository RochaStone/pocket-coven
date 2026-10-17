// Pure game rules mirrored on the client for display. The database is authoritative;
// tests/db asserts these agree with the SQL implementations.
import type { Mood, Pronouns, Stats } from "./types.ts";

export function moodFromStats(s: Stats): Mood {
  const { nourishment: n, energy: e, joy: j, magic: m, social: so } = s;
  const avg = (n + e + j + m + so) / 5;
  if (Math.min(n, e, j, m, so) <= 15 || avg < 25) return "offended";
  if (n < 30) return "hungry";
  if (e < 30) return "sleepy";
  if (j < 35 || so < 30) return "bored";
  if (m >= 85 && avg >= 60) return "magical";
  if (avg >= 80) return "thriving";
  return "happy";
}

export interface DecayConfig {
  decay_per_hour: Stats;
  decay_floor: number;
  decay_max_hours: number;
}

// Projects a friend's stats forward from their last server update, for live display.
export function projectStats(s: Stats, updatedAt: string | Date, now: Date, cfg: DecayConfig): Stats {
  const hours = Math.min(Math.max(0, (now.getTime() - new Date(updatedAt).getTime()) / 3_600_000), cfg.decay_max_hours);
  const out = { ...s };
  for (const k of Object.keys(out) as (keyof Stats)[]) {
    const v = Number(out[k]);
    out[k] = v <= cfg.decay_floor ? v : Math.round(Math.max(cfg.decay_floor, v - cfg.decay_per_hour[k] * hours) * 100) / 100;
  }
  return out;
}

export const levelFor = (xp: number) => Math.floor(Math.sqrt(Math.max(xp, 0) / 40)) + 1;
export const xpForLevel = (level: number) => (level - 1) ** 2 * 40;

export const MOOD_LABEL: Record<Mood, string> = {
  thriving: "Thriving",
  happy: "Happy",
  sleepy: "Sleepy",
  hungry: "Hungry",
  bored: "Bored",
  magical: "Magical",
  offended: "Dramatically offended",
};

export function moodLine(name: string, p: Pronouns, mood: Mood): string {
  const lines: Record<Mood, string> = {
    thriving: "{name} {is} thriving and would like everyone to know.",
    happy: "{name} {is} content. Keep the matcha coming.",
    sleepy: "{name} {is} yawning dramatically. An oyster nap is overdue.",
    hungry: "{name}'s tummy just rumbled in three languages.",
    bored: "{name} {is} bored. Someone suggest something glamorous.",
    magical: "{name} {is} crackling with magic. Things are floating.",
    offended: "{name} {has} retreated into {their} shell. {They} {are} available for apologies.",
  };
  return renderFlavour(lines[mood], name, p);
}

// Fills pronoun tokens: {name} {they} {them} {their} {They} {Their}.
// {is}/{has} follow the name, so they are always singular ("Lizz is").
// {are} follows the pronoun and agrees with it ("she is" / "they are").
export function renderFlavour(template: string, name: string, p: Pronouns): string {
  const cap = (x: string) => x.charAt(0).toUpperCase() + x.slice(1);
  return template
    .replaceAll("{name}", name)
    .replaceAll("{They}", cap(p.subject))
    .replaceAll("{Their}", cap(p.possessive))
    .replaceAll("{they}", p.subject)
    .replaceAll("{them}", p.object)
    .replaceAll("{their}", p.possessive)
    .replaceAll("{is}", "is")
    .replaceAll("{has}", "has")
    .replaceAll("{are}", p.plural ? "are" : "is");
}

export function formatSeconds(sec: number): string {
  if (sec >= 3600) return `${Math.ceil(sec / 3600)}h`;
  if (sec >= 60) return `${Math.ceil(sec / 60)}m`;
  return `${Math.max(1, Math.ceil(sec))}s`;
}
