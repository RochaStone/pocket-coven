"use client";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { ActivityResult, ActivityRow, ChatMsg, CovenGoal, Gift, MyState, SharedEvent, WitchPublic } from "./state";

export class GameError extends Error {
  constructor(public code: string, public hint: string) {
    super(hint || code);
  }
}

const FRIENDLY: Record<string, string> = {
  "Failed to fetch": "The shell lost its signal. Check your connection and try again.",
};

async function call<T>(fn: string, args: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await supabaseBrowser().rpc(fn, args);
  if (error) {
    const msg = error.message ?? "error";
    throw new GameError(msg, error.hint || FRIENDLY[msg] || "Something fizzled. Try again in a moment.");
  }
  return data as T;
}

const idem = () => crypto.randomUUID();

export const api = {
  myState: () => call<MyState>("get_my_state"),
  witch: (id: string) => call<WitchPublic>("get_witch", { p_character_id: id }),
  setLocation: (loc: string | null) => call<void>("set_location", { p_location_id: loc }),
  perform: (activityId: string, key = idem()) => call<ActivityResult>("perform_activity", { p_activity_id: activityId, p_key: key }),
  claimDaily: () => call<{ ok: boolean; already_claimed?: boolean; pearls_delta?: number; loot?: string[]; achievements?: string[]; state: MyState }>("claim_daily"),
  buy: (itemId: string, key = idem()) => call<{ ok: boolean; achievements: string[]; state: MyState }>("buy_item", { p_item_id: itemId, p_key: key }),
  equip: (slot: string, itemId: string | null) => call<{ ok: boolean; achievements: string[]; state: MyState }>("equip_item", { p_slot: slot, p_item_id: itemId }),
  setLook: (look: Record<string, unknown>) => call<MyState>("set_look", { p_look: look }),
  namePet: (itemId: string, name: string) => call<MyState>("name_pet", { p_item_id: itemId, p_name: name }),
  updateProfile: (description: string | null, personality: string | null, pronouns: unknown) =>
    call<MyState>("update_my_profile", { p_description: description, p_personality: personality, p_pronouns: pronouns }),
  place: (itemId: string, col: number, row: number) => call<{ ok: boolean; achievements: string[]; state: MyState }>("place_decoration", { p_item_id: itemId, p_col: col, p_row: row }),
  move: (id: number, col: number, row: number) => call<MyState>("move_decoration", { p_id: id, p_col: col, p_row: row }),
  remove: (id: number) => call<MyState>("remove_decoration", { p_id: id }),
  roomStyle: (wallpaper: string | null, floor: string | null, privacy: string | null) =>
    call<MyState>("set_room_style", { p_wallpaper: wallpaper, p_floor: floor, p_privacy: privacy }),
  visit: (host: string) => call<{ ok: boolean; first_visit_today: boolean; host: WitchPublic; state: MyState }>("visit_room", { p_host: host }),
  chat: (kind: "text" | "sticker", body: string) => call<ChatMsg>("send_chat", { p_kind: kind, p_body: body }),
  startEvent: (kind: string) => call<SharedEvent>("start_event", { p_kind: kind }),
  joinEvent: (id: string) => call<SharedEvent>("join_event", { p_event_id: id }),
  leaveEvent: (id: string) => call<void>("leave_event", { p_event_id: id }),
  completeEvent: (id: string) => call<{ ok: boolean; rewards: { effects: Record<string, number>; pearls: number; loot: string }; state: MyState }>("complete_event", { p_event_id: id }),
  claimInvite: (token: string) => call<MyState>("claim_invite", { p_token: token }),
  sendGift: (to: string, kind: "treat" | "pearls" | "item", ref: string | null, pearls: number | null, note: string | null, key = idem()) =>
    call<{ ok: boolean; achievements: string[]; state: MyState }>("send_gift", { p_to: to, p_kind: kind, p_ref: ref, p_pearls: pearls, p_note: note, p_key: key }),
  openGift: (id: number) => call<{ ok: boolean; already_opened?: boolean; gift: Gift; effects?: Record<string, number>; achievements?: string[]; state: MyState }>("open_gift", { p_id: id }),
  drawOracle: () => call<{ ok: boolean; card_id: string; new: boolean; achievements?: string[]; state: MyState }>("draw_oracle"),
  covenGoal: () => call<CovenGoal>("get_coven_goal"),
  inviteWitch: (to: string, locationId: string) => call<void>("invite_witch", { p_to: to, p_location_id: locationId }),
  admin: {
    createInvite: (characterId: string, days: number) => call<{ id: string; character_id: string; token: string; expires_at: string }>("admin_create_invite", { p_character_id: characterId, p_days: days }),
    revokeInvite: (id: string) => call<void>("admin_revoke_invite", { p_id: id }),
    deleteChat: (id: number) => call<void>("admin_delete_chat", { p_id: id }),
    updateCharacter: (id: string, title: string | null, description: string | null, personality: string | null, pronouns: unknown) =>
      call<void>("admin_update_character", { p_id: id, p_title: title, p_description: description, p_personality: personality, p_pronouns: pronouns }),
    setConfig: (key: string, value: unknown) => call<void>("admin_set_config", { p_key: key, p_value: value }),
    setItem: (itemId: string, price: number | null, active: boolean | null) => call<void>("admin_set_item", { p_item_id: itemId, p_price: price, p_active: active }),
    grant: (characterId: string, itemId: string | null, qty: number | null, pearls: number | null) =>
      call<void>("admin_grant", { p_character_id: characterId, p_item_id: itemId, p_qty: qty, p_pearls: pearls }),
    reset: (characterId: string) => call<void>("admin_reset_character", { p_character_id: characterId }),
    release: (characterId: string) => call<void>("admin_release_character", { p_character_id: characterId }),
    activity: () => call<ActivityRow[]>("admin_activity_summary"),
  },
};
