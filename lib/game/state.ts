import type { Equipped, Floor, Look, Mood, Pronouns, Stats, Wallpaper } from "./types";

export interface Decoration {
  id: number;
  item_id: string;
  col: number;
  row: number;
}

export interface WitchPublic {
  character: {
    id: string;
    name: string;
    title: string;
    description: string;
    personality: string;
    pronouns: Pronouns;
    baby_aesthetic: boolean;
    look: Look;
    claimed: boolean;
  };
  stats: Stats & { level: number; updated_at: string };
  mood: Mood;
  equipment: Equipped;
  room: { wallpaper: Wallpaper; floor: Floor; privacy: "coven" | "private" };
  decorations: Decoration[];
}

export interface MyState extends WitchPublic {
  pearls: number;
  xp: number;
  inventory: { item_id: string; qty: number }[];
  achievements: string[];
  daily_available: boolean;
  cooldowns: Record<string, number>;
  is_admin: boolean;
  coven_id: string;
  oracle_today: string | null;
  unopened_gifts: number;
  push_enabled: boolean;
  moon: { phase: number; window: "full" | "new" | null };
  month: number;
}

export interface Gift {
  id: number;
  from_char: string;
  to_char: string;
  kind: "treat" | "pearls" | "item";
  ref: string | null;
  pearls: number | null;
  note: string | null;
  created_at: string;
  opened_at: string | null;
}

export interface CovenGoal {
  kind: string;
  name: string;
  description: string;
  target: number;
  progress: number;
  completed_at: string | null;
  ends_at: string;
  reward: { pearls: number; itemId: string };
}

export interface ActivityRow {
  id: string;
  name: string;
  claimed: boolean;
  last_seen: string | null;
  actions_today: number;
  actions_7d: number;
  days_active_7d: number;
  chats_7d: number;
  gifts_sent_7d: number;
  alerts_on: boolean;
}

export interface ActivityResult {
  ok: boolean;
  replayed?: boolean;
  activity_id: string;
  animation: string;
  flavour_index: number;
  effects: Partial<Stats>;
  pearls_delta: number;
  loot: string[];
  friends: string[];
  xp: { xp: number; level: number; leveled_up: boolean };
  achievements: string[];
  state: MyState;
}

export interface ChatMsg {
  id: number;
  character_id: string | null;
  kind: "text" | "sticker" | "system";
  body: string;
  created_at: string;
  deleted_at?: string | null;
}

export interface SharedEvent {
  id: string;
  kind: "moon_ritual" | "sound_bath";
  location_id: string;
  host_character_id: string;
  status: "gathering" | "complete" | "cancelled";
  created_at: string;
  completed_at: string | null;
  participants: string[];
}

export const normaliseStats = (s: Record<string, unknown>): Stats => ({
  nourishment: Number(s.nourishment),
  energy: Number(s.energy),
  joy: Number(s.joy),
  magic: Number(s.magic),
  social: Number(s.social),
});
