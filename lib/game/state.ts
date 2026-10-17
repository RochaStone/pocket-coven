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
