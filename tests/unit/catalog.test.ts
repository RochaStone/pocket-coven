import { describe, expect, it } from "vitest";
import { ACTIVITIES, CHARACTERS, ITEMS, LOCATIONS, SHARED_EVENTS, itemById } from "@/lib/game/catalog";
import { moodFromStats, projectStats, renderFlavour, levelFor, xpForLevel, moodLine } from "@/lib/game/logic";
import { SLOTS, STATS } from "@/lib/game/types";

describe("catalog integrity", () => {
  it("ids are unique", () => {
    for (const list of [ITEMS, ACTIVITIES, LOCATIONS, CHARACTERS] as { id: string }[][]) {
      const ids = list.map((x) => x.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("every activity points at a real location and real loot", () => {
    for (const a of ACTIVITIES) {
      expect(LOCATIONS.some((l) => l.id === a.locationId), a.id).toBe(true);
      for (const l of a.loot ?? []) {
        expect(itemById(l.itemId), `${a.id} loot ${l.itemId}`).toBeDefined();
        expect(l.chance).toBeGreaterThan(0);
        expect(l.chance).toBeLessThanOrEqual(1);
      }
      for (const k of Object.keys(a.effects)) expect(STATS).toContain(k);
      expect(a.spot.x).toBeGreaterThanOrEqual(0);
      expect(a.spot.x).toBeLessThanOrEqual(100);
      expect(a.flavour.length).toBeGreaterThan(0);
    }
  });

  it("every location has something to do", () => {
    for (const l of LOCATIONS) expect(ACTIVITIES.some((a) => a.locationId === l.id), l.id).toBe(true);
  });

  it("starter wardrobes are coherent: equipped items are owned and in the right slot", () => {
    for (const c of CHARACTERS) {
      for (const it of c.starterItems) expect(itemById(it), `${c.id} starter ${it}`).toBeDefined();
      for (const [slot, id] of Object.entries(c.equipped)) {
        expect(SLOTS).toContain(slot);
        expect(itemById(id!)?.slot, `${c.id} ${slot}`).toBe(slot);
        expect(c.starterItems, `${c.id} owns ${id}`).toContain(id);
      }
    }
  });

  it("wearables have slots, placeables do not", () => {
    for (const i of ITEMS) {
      if (["outfit", "tail", "hat", "jewellery", "hair_acc", "companion"].includes(i.category)) expect(i.slot, i.id).toBeDefined();
      if (i.placeable) expect(i.slot, i.id).toBeUndefined();
    }
  });

  it("every character has several clearly different wearables available", () => {
    for (const slot of SLOTS) expect(ITEMS.filter((i) => i.slot === slot).length, slot).toBeGreaterThanOrEqual(4);
  });

  it("Kairos has pool, café and all five classes", () => {
    const kairos = ACTIVITIES.filter((a) => a.locationId.startsWith("kairos_")).map((a) => a.animation);
    for (const k of ["swim", "drink", "pilates", "yoga", "weights", "sound", "stretch", "work"]) expect(kairos).toContain(k);
  });

  it("adult-themed activities are flagged so the baby merwitch never gets them", () => {
    for (const id of ["grotto_toast", "grotto_gossip_break", "reef_mushroom"]) {
      expect(ACTIVITIES.find((a) => a.id === id)?.adultOnly, id).toBe(true);
    }
    expect(CHARACTERS.find((c) => c.id === "rocha")?.babyAesthetic).toBe(true);
    expect(CHARACTERS.filter((c) => c.babyAesthetic)).toHaveLength(1);
  });

  it("shared events reference real places and loot", () => {
    for (const e of Object.values(SHARED_EVENTS)) {
      expect(LOCATIONS.some((l) => l.id === e.locationId)).toBe(true);
      expect(itemById(e.lootItemId)).toBeDefined();
    }
  });

  it("flavour templates only use known tokens and never hard-code a pronoun", () => {
    const allowed = new Set(["{name}", "{they}", "{them}", "{their}", "{They}", "{Their}", "{is}", "{has}", "{are}"]);
    for (const a of ACTIVITIES) {
      for (const f of a.flavour) {
        for (const tok of f.match(/\{[^}]+\}/g) ?? []) expect(allowed.has(tok), `${a.id}: ${tok}`).toBe(true);
        expect(/[.!?]\s+\{(they|them|their)\}/.test(f), `${a.id}: capitalise sentence-initial pronoun`).toBe(false);
        // Lines about the acting witch must not assume gender.
        expect(/\b(she|her|hers|he|him|his)\b/i.test(f), `${a.id}: "${f}"`).toBe(false);
      }
    }
  });
});

describe("pronouns", () => {
  const lizz = CHARACTERS.find((c) => c.id === "lizz")!;
  const rocha = CHARACTERS.find((c) => c.id === "rocha")!;

  it("Lizz uses they/them everywhere", () => {
    expect(lizz.pronouns).toEqual({ subject: "they", object: "them", possessive: "their", plural: true });
    const t = "{name} {has} consumed {their} strawberry iced matcha and {is} now accepting compliments.";
    expect(renderFlavour(t, lizz.name, lizz.pronouns)).toBe("Lizz has consumed their strawberry iced matcha and is now accepting compliments.");
  });

  it("verb agreement follows the pronoun", () => {
    const t = "{name} {is} here and {they} {are} thriving.";
    expect(renderFlavour(t, "Rocha", rocha.pronouns)).toBe("Rocha is here and she is thriving.");
    expect(renderFlavour(t, "Lizz", lizz.pronouns)).toBe("Lizz is here and they are thriving.");
  });

  it("mood lines respect pronouns", () => {
    expect(moodLine("Lizz", lizz.pronouns, "offended")).toContain("their shell");
    expect(moodLine("Rocha", rocha.pronouns, "offended")).toContain("her shell");
  });
});

describe("rules", () => {
  it("moods", () => {
    expect(moodFromStats({ nourishment: 70, energy: 70, joy: 70, magic: 70, social: 70 })).toBe("happy");
    expect(moodFromStats({ nourishment: 20, energy: 70, joy: 70, magic: 70, social: 70 })).toBe("hungry");
    expect(moodFromStats({ nourishment: 10, energy: 10, joy: 10, magic: 10, social: 10 })).toBe("offended");
    expect(moodFromStats({ nourishment: 90, energy: 90, joy: 90, magic: 90, social: 90 })).toBe("magical");
  });
  it("decay never goes below the floor and never kills", () => {
    const cfg = { decay_per_hour: { nourishment: 4, energy: 3, joy: 3, magic: 2, social: 3 }, decay_floor: 10, decay_max_hours: 72 };
    const s = projectStats({ nourishment: 100, energy: 100, joy: 100, magic: 100, social: 100 }, new Date(0), new Date(), cfg);
    for (const v of Object.values(s)) expect(v).toBeGreaterThanOrEqual(10);
  });
  it("levels", () => {
    expect(levelFor(0)).toBe(1);
    expect(levelFor(40)).toBe(2);
    expect(xpForLevel(levelFor(500))).toBeLessThanOrEqual(500);
  });
});
