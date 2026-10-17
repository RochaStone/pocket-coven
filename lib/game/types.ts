// Shared contracts between the database, the game engine and the art layer.

export const CHARACTER_IDS = ["rocha", "lizz", "dray", "cheryl", "veda"] as const;
export type CharacterId = (typeof CHARACTER_IDS)[number];

export const STATS = ["nourishment", "energy", "joy", "magic", "social"] as const;
export type StatKey = (typeof STATS)[number];
export type Stats = Record<StatKey, number>;

export const MOODS = ["thriving", "happy", "sleepy", "hungry", "bored", "magical", "offended"] as const;
export type Mood = (typeof MOODS)[number];

export const SLOTS = ["outfit", "tail", "hat", "necklace", "earrings", "hair_acc", "companion"] as const;
export type Slot = (typeof SLOTS)[number];
export type Equipped = Partial<Record<Slot, string>>;

export const HAIR_STYLES = [
  "long_waves",
  "short_undercut",
  "straight_long",
  "beach_waves",
  "ethereal_long",
  "pixie",
  "space_buns",
] as const;
export type HairStyle = (typeof HAIR_STYLES)[number];

export interface Look {
  skin: string;
  hairColor: string;
  hairStyle: HairStyle;
  eyeColor: string;
  tattoos?: boolean;
}

export interface Pronouns {
  subject: string; // she / they / he
  object: string; // her / them / him
  possessive: string; // her / their / his
  plural: boolean; // true for they/them verb agreement ("they are")
}

export type ItemCategory =
  | "outfit"
  | "tail"
  | "hat"
  | "jewellery"
  | "hair_acc"
  | "companion"
  | "furniture"
  | "decor"
  | "collectible";

export interface ItemDef {
  id: string;
  name: string;
  category: ItemCategory;
  slot?: Slot; // wearables only
  price?: number; // pearls; undefined = not sold, found only
  placeable?: boolean; // can go in a room
  rarity: "common" | "rare" | "mythic";
  description: string;
}

export type AnimationKey =
  | "eat"
  | "drink"
  | "sleep"
  | "bathe"
  | "cuddle"
  | "play"
  | "dance"
  | "spell"
  | "swim"
  | "float"
  | "pilates"
  | "yoga"
  | "weights"
  | "sound"
  | "stretch"
  | "work"
  | "dig"
  | "explore"
  | "stargaze"
  | "toast"
  | "gossip"
  | "mushroom";

export interface ActivityDef {
  id: string;
  locationId: string;
  name: string;
  effects: Partial<Stats>;
  pearls: number; // positive = earned, negative = costs
  xp: number;
  cooldownSeconds: number;
  adultOnly?: boolean; // never offered to the baby-aesthetic character
  loot?: { itemId: string; chance: number }[];
  animation: AnimationKey;
  // Hotspot position inside the location scene, in % of the scene box.
  spot: { x: number; y: number };
  // Flavour templates. Tokens: {name} {they} {them} {their} {They} {Their}; {is}/{has} follow the name, {are} follows the pronoun.
  flavour: string[];
}

export interface LocationDef {
  id: string;
  name: string;
  world: "shell" | "kairos";
  blurb: string;
}

export interface CharacterDef {
  id: CharacterId;
  name: string;
  title: string;
  pronouns: Pronouns;
  babyAesthetic: boolean;
  isOwnerCharacter: boolean;
  description: string;
  personality: string;
  look: Look;
  equipped: Equipped;
  starterItems: string[];
}

export const WALLPAPERS = ["pearl_stripe", "lagoon_tile", "moon_velvet", "coral_damask", "kelp_mural"] as const;
export type Wallpaper = (typeof WALLPAPERS)[number];
export const FLOORS = ["shell_parquet", "sand", "marble", "moss"] as const;
export type Floor = (typeof FLOORS)[number];
export const ROOM_COLS = 6;
export const ROOM_ROWS = 4;

export const STICKERS = ["heart_shell", "sparkle", "moon_kiss", "matcha_cheers", "dramatic_gasp", "pearl_rain"] as const;
export type Sticker = (typeof STICKERS)[number];
