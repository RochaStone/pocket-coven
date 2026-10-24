// Single source of truth for game content. supabase/seed.sql is generated from
// this file by scripts/gen-seed.ts; tests fail if the two drift.
import type { ActivityDef, CharacterDef, ItemDef, LocationDef } from "./types.ts";

const SHE = { subject: "she", object: "her", possessive: "her", plural: false };
const THEY = { subject: "they", object: "them", possessive: "their", plural: true };

export const CHARACTERS: CharacterDef[] = [
  {
    id: "rocha",
    name: "Rocha",
    title: "Baby Merwitch",
    pronouns: SHE,
    babyAesthetic: true,
    isOwnerCharacter: true,
    description: "The original keeper of the seashell world. Pink hair, pearl crown, a tail that shimmers pink to aqua.",
    personality: "Playful, powerful, spoiled, sacred. Mystical but irreverent. Takes neglect personally.",
    look: { skin: "#f9d6c3", hairColor: "#ff8fc8", hairStyle: "long_waves", eyeColor: "#8a4fe0" },
    equipped: { outfit: "outfit_babydoll_y2k", tail: "tail_pink_aqua", hat: "hat_pearl_crown", necklace: "neck_pearls", hair_acc: "hair_shell_clip" },
    starterItems: ["outfit_babydoll_y2k", "tail_pink_aqua", "hat_pearl_crown", "neck_pearls", "hair_shell_clip", "hat_witch_pink", "pet_seahorse", "furn_oyster_bed", "decor_palm_pot"],
  },
  {
    id: "lizz",
    name: "Lizz",
    title: "The Lesbian Witch",
    pronouns: THEY,
    babyAesthetic: false,
    isOwnerCharacter: false,
    description: "Platinum short hair, shades pushed up, inked arms, all black, a black cat who also means business.",
    personality: "Androgynous, tattooed, protective, chaotic, cool, deep.",
    look: { skin: "#b47a52", hairColor: "#f2ece2", hairStyle: "short_undercut", eyeColor: "#c99a3c", tattoos: true },
    equipped: { outfit: "outfit_leather_jacket", necklace: "neck_chain_dark", earrings: "ear_silver_hoops", hair_acc: "hair_sunglasses", companion: "pet_black_cat" },
    starterItems: ["outfit_leather_jacket", "neck_chain_dark", "ear_silver_hoops", "hair_sunglasses", "hat_beanie_black", "pet_black_cat", "furn_clam_chair", "decor_moon_lantern"],
  },
  {
    id: "dray",
    name: "Dray",
    title: "The Moon Witch",
    pronouns: SHE,
    babyAesthetic: false,
    isOwnerCharacter: false,
    description: "Long midnight curls pinned with moons and stars, tattoos, a glowing crystal ball, a violet butterfly in tow.",
    personality: "Intuitive, mysterious, dreamy, cosmic, a little unhinged.",
    look: { skin: "#c48c69", hairColor: "#24204f", hairStyle: "long_waves", eyeColor: "#b49bff", tattoos: true },
    equipped: { outfit: "outfit_moon_robe", necklace: "neck_moonstone", earrings: "ear_star_studs", hair_acc: "hair_moon_pins", companion: "pet_butterfly" },
    starterItems: ["outfit_moon_robe", "hat_crescent", "neck_moonstone", "ear_star_studs", "hair_moon_pins", "tail_midnight", "pet_butterfly", "furn_crystal_ball_table", "decor_moon_lantern"],
  },
  {
    id: "cheryl",
    name: "Cheryl",
    title: "The Practical Witch",
    pronouns: SHE,
    babyAesthetic: false,
    isOwnerCharacter: false,
    description: "Honey-gold curls under a big pink sun hat, shell jewellery that clinks, always has snacks.",
    personality: "Grounded, funny, brutally honest. Snacks. Solutions.",
    look: { skin: "#c98d5e", hairColor: "#e3a54c", hairStyle: "beach_waves", eyeColor: "#7a4a2a" },
    equipped: { outfit: "outfit_coral_sarong", hat: "hat_sun_pink", necklace: "neck_shell", earrings: "ear_shell_dangles" },
    starterItems: ["outfit_coral_sarong", "hat_sun_pink", "hat_sun_straw", "neck_shell", "ear_shell_dangles", "tail_coral_sunset", "pet_jellyfish", "furn_coral_lamp", "decor_starfish_garland"],
  },
  {
    id: "veda",
    name: "Veda",
    title: "The Mystic Oracle",
    pronouns: SHE,
    babyAesthetic: false,
    isOwnerCharacter: false,
    description: "Silver-blue waves, a crystal tiara, pale aqua and pearl, and a tiny white kitten who sees the future.",
    personality: "Spiritual, soft, otherworldly, prophetic, gentle.",
    look: { skin: "#f5dacb", hairColor: "#dce8f6", hairStyle: "ethereal_long", eyeColor: "#5f9fe0" },
    equipped: { outfit: "outfit_mist_gown", hat: "hat_crystal_tiara", necklace: "neck_crystal", earrings: "ear_pearl_drop", companion: "pet_white_kitten" },
    starterItems: ["outfit_mist_gown", "hat_crystal_tiara", "neck_crystal", "ear_pearl_drop", "tail_lavender_moon", "pet_white_kitten", "furn_shell_vanity", "decor_mushroom_lamp"],
  },
  {
    id: "christiana",
    name: "Christiana",
    title: "The Rose Witch",
    pronouns: SHE,
    babyAesthetic: false,
    isOwnerCharacter: false,
    description: "Long brown hair, a dusty-rose wrap dress and a frangipani crown. Never far from her little fairy.",
    personality: "Warm, steady, quietly magic. Remembers everyone's favourite treat.",
    look: { skin: "#ecc3a6", hairColor: "#6b4428", hairStyle: "straight_long", eyeColor: "#6b4a2e" },
    equipped: { outfit: "outfit_rose_wrap", hat: "hat_flower_crown", earrings: "ear_pearl_drop", necklace: "neck_pearls" },
    starterItems: ["outfit_rose_wrap", "hat_flower_crown", "ear_pearl_drop", "neck_pearls", "tail_coral_sunset", "furn_coral_lamp", "decor_palm_pot"],
  },
  {
    id: "layla",
    name: "LaLa",
    title: "The Pink Fairy",
    pronouns: SHE,
    // Child player: the baby flag also keeps every adults-only activity away from her.
    babyAesthetic: true,
    isOwnerCharacter: false,
    description: "A pink fairy with long brown pigtails, shimmering wings, a twirly tutu and her fluffy Pomeranian puppy.",
    personality: "Giggly, brave, pink about everything. Asks the best questions.",
    look: { skin: "#ecc3a6", hairColor: "#6b4428", hairStyle: "pigtails", eyeColor: "#6b4a2e" },
    equipped: { outfit: "outfit_fairy_tutu", companion: "pet_pomeranian" },
    starterItems: ["outfit_fairy_tutu", "pet_pomeranian", "hat_witch_pink", "hair_bow_pink", "tail_pink_aqua", "furn_oyster_bed", "decor_starfish_garland"],
  },
];

const W = (id: string, name: string, category: ItemDef["category"], slot: ItemDef["slot"], price: number | undefined, rarity: ItemDef["rarity"], description: string): ItemDef => ({ id, name, category, slot, price, rarity, description });
const P = (id: string, name: string, category: ItemDef["category"], price: number | undefined, rarity: ItemDef["rarity"], description: string): ItemDef => ({ id, name, category, price, rarity, description, placeable: true });
const seasonal = (item: ItemDef, months: number[]): ItemDef => ({ ...item, season: months });

export const ITEMS: ItemDef[] = [
  // Outfits
  W("outfit_babydoll_y2k", "Y2K Babydoll", "outfit", "outfit", 60, "common", "Pink, puffed, glittered. Dial-up era glamour."),
  W("outfit_pearl_gown", "Pearl Gown", "outfit", "outfit", 180, "rare", "Hand-strung by a very patient oyster."),
  W("outfit_moon_robe", "Moon Robe", "outfit", "outfit", 120, "common", "Navy velvet scattered with stars."),
  W("outfit_leather_jacket", "Inkwell Jacket", "outfit", "outfit", 120, "common", "Black leather, silver studs, zero apologies."),
  W("outfit_coral_sarong", "Coral Sarong Set", "outfit", "outfit", 90, "common", "Sunset coral wrap and shell bandeau."),
  W("outfit_mist_gown", "Mist Gown", "outfit", "outfit", 150, "rare", "Lavender chiffon that drifts like sea fog."),
  W("outfit_kairos_active", "Kairos Activewear", "outfit", "outfit", 80, "common", "Matching set. Pilates-ready, brunch-approved."),
  W("outfit_shell_suit", "Shell Tailored Suit", "outfit", "outfit", 160, "rare", "Sharp pearl-grey suit with a scallop lapel pin."),
  W("outfit_fairy_tutu", "Fairy Tutu", "outfit", "outfit", 70, "common", "Pink tutu, heart tee, leggings built for running about."),
  W("outfit_rose_wrap", "Rose Wrap Dress", "outfit", "outfit", 110, "common", "Dusty rose, flutter sleeves, ties with a pearl button."),
  W("outfit_overalls", "Sea-Glass Overalls", "outfit", "outfit", 70, "common", "Washed denim with sea-glass buttons."),
  // Tails
  W("tail_pink_aqua", "Pink Aqua Tail", "tail", "tail", 100, "common", "Shimmers pink to aqua as you swim."),
  W("tail_lavender_moon", "Lavender Moon Tail", "tail", "tail", 140, "rare", "Pale lilac scales with a moonlit fin."),
  W("tail_gold_champagne", "Champagne Gold Tail", "tail", "tail", 260, "mythic", "Effervescent. Literally."),
  W("tail_coral_sunset", "Coral Sunset Tail", "tail", "tail", 120, "common", "Every scale a little sunset."),
  W("tail_midnight", "Midnight Tail", "tail", "tail", 140, "rare", "Deep navy with starlight freckles."),
  // Hats
  W("hat_witch_pink", "Pink Witch Hat", "hat", "hat", 70, "common", "Pointy, pink, perfect."),
  W("hat_pearl_crown", "Pearl Crown", "hat", "hat", 150, "rare", "Tiny, bossy, iconic."),
  W("hat_sun_straw", "Straw Sun Hat", "hat", "hat", 60, "common", "Wide brim, wider attitude."),
  W("hat_crescent", "Crescent Hat", "hat", "hat", 110, "common", "Navy witch hat with a golden crescent."),
  W("hat_flower_crown", "Frangipani Crown", "hat", "hat", 80, "common", "Fresh from a Bali morning."),
  W("hat_beanie_black", "Black Beanie", "hat", "hat", 40, "common", "Slouchy. Cool without trying. (Trying a bit.)"),
  W("hat_sun_pink", "Pink Sun Hat", "hat", "hat", 70, "common", "Huge, pink, bow on the band. Practical about shade, impractical about everything else."),
  W("hat_crystal_tiara", "Crystal Tiara", "hat", "hat", 170, "rare", "Quartz points that catch every light."),
  // Jewellery
  W("neck_pearls", "Pearl Strand", "jewellery", "necklace", 80, "common", "Classic. Smug."),
  W("neck_shell", "Cowrie Necklace", "jewellery", "necklace", 50, "common", "Clinks when you laugh."),
  W("neck_moonstone", "Moonstone Pendant", "jewellery", "necklace", 120, "rare", "Glows faintly at night."),
  W("neck_chain_dark", "Dark Silver Chain", "jewellery", "necklace", 60, "common", "Heavy links, oxidised silver."),
  W("neck_crystal", "Crystal Point Pendant", "jewellery", "necklace", 90, "common", "Clear quartz on a fine chain."),
  W("neck_black_pearl", "Black Pearl Choker", "jewellery", "necklace", undefined, "mythic", "Found, never bought."),
  W("ear_pearl_drop", "Pearl Drops", "jewellery", "earrings", 50, "common", "A single pearl, swinging."),
  W("ear_silver_hoops", "Silver Hoops", "jewellery", "earrings", 40, "common", "Sturdy, shiny, essential."),
  W("ear_star_studs", "Star Studs", "jewellery", "earrings", 45, "common", "Two tiny stars."),
  W("ear_shell_dangles", "Shell Dangles", "jewellery", "earrings", 45, "common", "Mini scallops on gold."),
  // Hair accessories
  W("hair_shell_clip", "Shell Clip", "hair_acc", "hair_acc", 30, "common", "A pearly scallop clip."),
  W("hair_bow_pink", "Satin Bow", "hair_acc", "hair_acc", 30, "common", "Big. Pink. Unignorable."),
  W("hair_starfish", "Starfish Pin", "hair_acc", "hair_acc", 35, "common", "A sleepy starfish who agreed to this."),
  W("hair_moon_pins", "Moon and Star Pins", "hair_acc", "hair_acc", 45, "common", "Tiny gold crescents scattered through the curls."),
  W("hair_sunglasses", "Shades on Head", "hair_acc", "hair_acc", 40, "common", "Black cat-eye shades pushed up."),
  // Companions
  W("pet_seahorse", "Pearl Seahorse", "companion", "companion", 200, "rare", "Loyal, glittery, mildly judgemental."),
  W("pet_jellyfish", "Moon Jelly", "companion", "companion", 180, "rare", "Bobs beside you. Glows when happy."),
  W("pet_crab_bat", "Bat Crab", "companion", "companion", 220, "rare", "A crab with tiny bat wings. Do not ask."),
  W("pet_black_cat", "Black Cat", "companion", "companion", 200, "rare", "Sleek, unbothered, protective. A classic for a reason."),
  W("pet_white_kitten", "White Kitten", "companion", "companion", 200, "rare", "Fluffy, gentle, occasionally prophetic."),
  W("pet_butterfly", "Violet Butterfly", "companion", "companion", 160, "common", "Flutters in moon-shaped loops."),
  W("pet_pomeranian", "Pomeranian Puppy", "companion", "companion", 200, "rare", "An orange fluffball with a plume tail. Answers to whatever you name her."),
  W("pet_moth_moon", "Luna Moth", "companion", "companion", 220, "rare", "Pale green wings, moon-drunk."),
  // Furniture
  P("furn_oyster_bed", "Oyster Bed", "furniture", 150, "rare", "A clam bed with a pearl pillow."),
  P("furn_shell_vanity", "Shell Vanity", "furniture", 120, "common", "Scallop mirror, gold legs."),
  P("furn_clam_chair", "Clam Chair", "furniture", 70, "common", "Sit inside a clam. Feel held."),
  P("furn_coral_lamp", "Coral Lamp", "furniture", 60, "common", "Branching coral with a warm glow."),
  P("furn_pearl_rug", "Pearl Rug", "furniture", 50, "common", "Round, iridescent, plush."),
  P("furn_kelp_shelf", "Kelp Bookshelf", "furniture", 90, "common", "Holds spellbooks and gossip mags."),
  P("furn_crystal_ball_table", "Crystal Ball Table", "furniture", 130, "rare", "Sees everything. Says little."),
  P("furn_disco_shell", "Disco Shell", "furniture", 200, "mythic", "A mirrorball scallop for emergencies."),
  // Decor
  P("decor_palm_pot", "Potted Palm", "decor", 40, "common", "A tiny Bali palm."),
  P("decor_treasure_chest", "Treasure Chest", "decor", 110, "rare", "Slightly ajar. Glittering."),
  P("decor_moon_lantern", "Moon Lantern", "decor", 55, "common", "A paper moon on a string."),
  P("decor_starfish_garland", "Starfish Garland", "decor", 35, "common", "Starfish holding hands."),
  P("decor_mushroom_lamp", "Glowshroom Lamp", "decor", 65, "common", "Soft violet mushroom light."),
  // Collectibles (found, placeable in the treasure display)
  P("col_spiral_shell", "Spiral Shell", "collectible", undefined, "common", "Listen closely: it's gossiping."),
  P("col_sea_glass_aqua", "Aqua Sea Glass", "collectible", undefined, "common", "Frosted by a hundred tides."),
  P("col_sea_glass_rose", "Rose Sea Glass", "collectible", undefined, "rare", "Pink sea glass. Rare and smug about it."),
  P("col_amethyst", "Amethyst Cluster", "collectible", undefined, "common", "Violet points, calming energy."),
  P("col_rose_quartz", "Rose Quartz", "collectible", undefined, "common", "Soft pink, softer heart."),
  P("col_moonstone", "Moonstone", "collectible", undefined, "rare", "Holds a sliver of moonlight."),
  P("col_talisman_eye", "Evil-Eye Talisman", "collectible", undefined, "rare", "Watches your back so you don't have to."),
  P("col_golden_scallop", "Golden Scallop", "collectible", undefined, "mythic", "The rarest shell in the lagoon."),
  P("col_glowshroom", "Glowshroom Cap", "collectible", undefined, "common", "A tiny violet mushroom that hums."),
  // Rewards from moon ceremonies and coven goals (found, never sold)
  P("col_full_moon_pearl", "Full Moon Pearl", "collectible", undefined, "mythic", "Only rises from a full moon ceremony. Glows silver."),
  P("col_new_moon_shard", "New Moon Shard", "collectible", undefined, "mythic", "A sliver of dark sky, gifted by the new moon."),
  P("col_coven_charm", "Coven Charm", "collectible", undefined, "mythic", "Five tiny shells on one gold thread. Earned together."),
  // Seasonal (shop and daily gifts only in their months)
  seasonal(P("decor_pumpkin_lantern", "Moonlit Pumpkin Lantern", "decor", 60, "rare", "A pink pumpkin with a crescent-moon grin."), [10]),
  seasonal(W("hair_bat_clips", "Bat Wing Clips", "hair_acc", "hair_acc", 45, "rare", "Tiny velvet bat wings. Spooky, but make it cute."), [10]),
  seasonal(P("decor_coral_tree", "Coral Festive Tree", "decor", 80, "rare", "Pink coral strung with pearls and starlight."), [12]),
  seasonal(W("hat_snow_pearl", "Snow Pearl Beret", "hat", "hat", 70, "rare", "Fluffy white beret with a single pearl."), [12]),
];

export const LOCATIONS: LocationDef[] = [
  { id: "palace", name: "Pearl Palace", world: "shell", blurb: "Your bedroom: oyster bed, vanity and shell spa." },
  { id: "cafe", name: "Matcha Café", world: "shell", blurb: "Strawberry iced matcha and bone broth on the reef terrace." },
  { id: "grotto", name: "Champagne Grotto", world: "shell", blurb: "Glittering cave for celebrations. Grown witches only." },
  { id: "moon_deck", name: "Moon Deck", world: "shell", blurb: "Rituals, stargazing and coven ceremonies." },
  { id: "lagoon", name: "Mermaid Lagoon", world: "shell", blurb: "Turquoise water, warm and clear." },
  { id: "reef", name: "Crystal Reef", world: "shell", blurb: "Enchanted kelp forest, crystals and whimsical mushrooms." },
  { id: "beach", name: "Shell Beach", world: "shell", blurb: "Treasure, sea glass and serious lounging." },
  { id: "lounge", name: "Coven Lounge", world: "shell", blurb: "Where the coven gathers to gossip in real time." },
  { id: "kairos_pool", name: "Kairos Pool", world: "kairos", blurb: "Palms, loungers, warm stone and a very blue pool." },
  { id: "kairos_studio", name: "Kairos Studio", world: "kairos", blurb: "Pilates reformers, yoga mats, stretch corner." },
  { id: "kairos_gym", name: "Kairos Gym", world: "kairos", blurb: "Tiny pastel dumbbells, enormous effort." },
  { id: "kairos_sound", name: "Sound Sanctuary", world: "kairos", blurb: "Crystal singing bowls and soft light." },
  { id: "kairos_cowork", name: "Kairos Co-Work", world: "kairos", blurb: "Rattan desks, laptops and oracle deadlines." },
  { id: "kairos_cafe", name: "Kairos Matcha Bar", world: "kairos", blurb: "Matcha, broth and nourishing bowls by the pool." },
];

const A = (a: ActivityDef) => a;

export const ACTIVITIES: ActivityDef[] = [
  // Pearl Palace
  A({ id: "nap_oyster", locationId: "palace", name: "Nap in the oyster bed", effects: { energy: 35, joy: 5 }, pearls: 0, xp: 5, cooldownSeconds: 600, animation: "sleep", spot: { x: 30, y: 62 },
    flavour: ["{name} {is} asleep in the oyster bed. Do not disturb unless bearing snacks.", "{name} napped like it was a paid position."] }),
  A({ id: "shell_spa", locationId: "palace", name: "Bathe in the shell spa", effects: { joy: 20, magic: 10, energy: 5 }, pearls: 0, xp: 6, cooldownSeconds: 900, animation: "bathe", spot: { x: 72, y: 64 },
    flavour: ["{name} soaked in the shell spa and emerged significantly more mysterious.", "Bubbles: applied. Worries: dissolved. {name}: glowing."] }),
  A({ id: "cuddle", locationId: "palace", name: "Cuddle", effects: { joy: 15, social: 10 }, pearls: 0, xp: 4, cooldownSeconds: 300, animation: "cuddle", spot: { x: 50, y: 48 },
    flavour: ["{name} accepted a cuddle and would like it noted that {they} allowed it.", "Maximum snuggle achieved. {name} {is} purring. Possibly a witch thing."] }),
  A({ id: "play", locationId: "palace", name: "Play dress-up", effects: { joy: 20, energy: -8 }, pearls: 2, xp: 5, cooldownSeconds: 300, animation: "play", spot: { x: 18, y: 40 },
    flavour: ["{name} tried on four outfits and chose the first one. Iconic.", "Playtime complete. {name} {is} now wearing a lampshade as a hat."] }),
  A({ id: "cast_spell", locationId: "palace", name: "Cast a little spell", effects: { magic: 20, energy: -10 }, pearls: 3, xp: 8, cooldownSeconds: 600, animation: "spell", spot: { x: 84, y: 34 },
    loot: [{ itemId: "col_rose_quartz", chance: 0.15 }],
    flavour: ["{name} cast a spell. Something somewhere is now sparkly.", "The spell worked. Nobody knows what it did. {name} refuses to elaborate."] }),
  // Pearl Café
  A({ id: "cafe_matcha", locationId: "cafe", name: "Strawberry iced matcha", effects: { nourishment: 15, joy: 15, energy: 10 }, pearls: -8, xp: 4, cooldownSeconds: 180, animation: "drink", spot: { x: 30, y: 58 },
    flavour: ["{name} {has} consumed {their} strawberry iced matcha and {is} now accepting compliments.", "Pink layer, green layer, {name} layer: perfection."] }),
  A({ id: "cafe_broth", locationId: "cafe", name: "Bone broth", effects: { nourishment: 30, energy: 5 }, pearls: -6, xp: 4, cooldownSeconds: 180, animation: "eat", spot: { x: 55, y: 62 },
    flavour: ["{name} sipped bone broth and feels ancestrally supported.", "Collagen: acquired. {name}: radiant."] }),
  A({ id: "cafe_feed", locationId: "cafe", name: "Pearl pancakes", effects: { nourishment: 25, joy: 8 }, pearls: -5, xp: 3, cooldownSeconds: 180, animation: "eat", spot: { x: 76, y: 56 },
    flavour: ["{name} ate pearl pancakes. The syrup was iridescent. Questions were not asked.", "Fed. Happy. Sticky."] }),
  A({ id: "cafe_socialise", locationId: "cafe", name: "Chat with the regulars", effects: { social: 20, joy: 5 }, pearls: 1, xp: 4, cooldownSeconds: 300, animation: "gossip", spot: { x: 50, y: 34 },
    flavour: ["{name} caught up with a seahorse barista. The tea was hot (both kinds).", "{name} made three new friends and one tiny enemy."] }),
  // Champagne Grotto (adult witches only)
  A({ id: "grotto_toast", locationId: "grotto", name: "Champagne toast", effects: { joy: 25, social: 15, energy: -5 }, pearls: 0, xp: 6, cooldownSeconds: 900, adultOnly: true, animation: "toast", spot: { x: 36, y: 58 },
    flavour: ["{name} raised a glass of fantasy fizz. The bubbles spelled a compliment.", "Someone brought champagne. {name} brought a speech."] }),
  A({ id: "grotto_dance", locationId: "grotto", name: "Dance under the disco shell", effects: { joy: 25, energy: -15, social: 10 }, pearls: 2, xp: 6, cooldownSeconds: 600, animation: "dance", spot: { x: 62, y: 44 },
    flavour: ["{name} danced until the stalactites applauded.", "The disco shell spun. {name} spun faster."] }),
  A({ id: "grotto_gossip_break", locationId: "grotto", name: "Balcony gossip break", effects: { social: 25, joy: 10 }, pearls: 0, xp: 5, cooldownSeconds: 900, adultOnly: true, animation: "gossip", spot: { x: 82, y: 30 },
    flavour: ["{name} stepped onto the balcony with a sparkly cartoon ciggie and a scandal. Only one of those is real.", "Gossip break complete. {name} knows things now."] }),
  // Moon Deck
  A({ id: "moon_stargaze", locationId: "moon_deck", name: "Stargaze", effects: { magic: 20, joy: 10 }, pearls: 2, xp: 6, cooldownSeconds: 600, animation: "stargaze", spot: { x: 40, y: 50 },
    loot: [{ itemId: "col_moonstone", chance: 0.1 }],
    flavour: ["{name} counted stars and lost count on purpose.", "A shooting star winked at {name}. {name} winked back."] }),
  A({ id: "moon_ritual_solo", locationId: "moon_deck", name: "Personal moon ritual", effects: { magic: 30, energy: -10 }, pearls: 4, xp: 10, cooldownSeconds: 1800, animation: "spell", spot: { x: 70, y: 40 },
    loot: [{ itemId: "col_amethyst", chance: 0.25 }],
    flavour: ["{name} performed a moon ritual. The moon has been informed.", "Candles, crystals, intention. {name} {is} humming at a new frequency."] }),
  // Mermaid Lagoon
  A({ id: "lagoon_swim", locationId: "lagoon", name: "Swim", effects: { joy: 20, energy: -10, magic: 5 }, pearls: 2, xp: 6, cooldownSeconds: 300, animation: "swim", spot: { x: 50, y: 60 },
    loot: [{ itemId: "col_sea_glass_aqua", chance: 0.2 }],
    flavour: ["{name} did three laps and one dramatic hair flip.", "{name} swam with a pod of very supportive dolphins."] }),
  A({ id: "lagoon_float", locationId: "lagoon", name: "Float and do nothing", effects: { energy: 15, joy: 10 }, pearls: 0, xp: 3, cooldownSeconds: 300, animation: "float", spot: { x: 26, y: 46 },
    flavour: ["{name} floated. That's it. That's the activity.", "{name} {is} drifting. Productivity has left the building."] }),
  // Crystal Reef
  A({ id: "reef_explore", locationId: "reef", name: "Explore the kelp forest", effects: { joy: 10, energy: -12, magic: 8 }, pearls: 3, xp: 8, cooldownSeconds: 600, animation: "explore", spot: { x: 30, y: 55 },
    loot: [{ itemId: "col_amethyst", chance: 0.3 }, { itemId: "col_spiral_shell", chance: 0.3 }, { itemId: "col_golden_scallop", chance: 0.02 }],
    flavour: ["{name} wandered the kelp and found a crystal humming {their} name.", "{name} explored. The kelp waved. Politely."] }),
  A({ id: "reef_crystals", locationId: "reef", name: "Collect crystals", effects: { magic: 15, energy: -8 }, pearls: 2, xp: 6, cooldownSeconds: 600, animation: "dig", spot: { x: 70, y: 62 },
    loot: [{ itemId: "col_rose_quartz", chance: 0.4 }, { itemId: "col_amethyst", chance: 0.3 }, { itemId: "col_talisman_eye", chance: 0.05 }],
    flavour: ["{name} pocketed a crystal and apologised to the reef.", "Crystal collected. {name} feels 4% more psychic."] }),
  A({ id: "reef_mushroom", locationId: "reef", name: "Glowshroom giggles", effects: { joy: 25, magic: 15, energy: -5 }, pearls: 0, xp: 6, cooldownSeconds: 1800, adultOnly: true, animation: "mushroom", spot: { x: 50, y: 32 },
    loot: [{ itemId: "col_glowshroom", chance: 0.5 }],
    flavour: ["{name} sat under a giant glowshroom. The colours got louder. The mushroom told a joke. It was good.", "A fantasy mushroom sang {name} a lullaby in purple."] }),
  // Shell Beach
  A({ id: "beach_treasure", locationId: "beach", name: "Treasure hunt", effects: { joy: 15, energy: -12 }, pearls: 6, xp: 8, cooldownSeconds: 600, animation: "dig", spot: { x: 34, y: 66 },
    loot: [{ itemId: "col_spiral_shell", chance: 0.4 }, { itemId: "col_sea_glass_rose", chance: 0.12 }, { itemId: "col_golden_scallop", chance: 0.03 }, { itemId: "neck_black_pearl", chance: 0.01 }],
    flavour: ["{name} dug a hole, found a shell, declared victory.", "X marked the spot. {name} marked it harder."] }),
  A({ id: "beach_glass", locationId: "beach", name: "Sea-glass stroll", effects: { joy: 10, magic: 5, energy: -5 }, pearls: 3, xp: 5, cooldownSeconds: 300, animation: "explore", spot: { x: 66, y: 72 },
    loot: [{ itemId: "col_sea_glass_aqua", chance: 0.4 }, { itemId: "col_sea_glass_rose", chance: 0.1 }],
    flavour: ["{name} found frosted glass and a new life philosophy.", "Sea glass: collected. Toes: sandy."] }),
  A({ id: "beach_lounge", locationId: "beach", name: "Lounge on the sand", effects: { energy: 20, joy: 10 }, pearls: 0, xp: 3, cooldownSeconds: 300, animation: "float", spot: { x: 76, y: 46 },
    flavour: ["{name} {is} horizontal and thriving.", "{name} achieved peak lounge."] }),
  // Coven Lounge (shared events start here too)
  A({ id: "lounge_dance", locationId: "lounge", name: "Dance it out", effects: { joy: 20, social: 15, energy: -10 }, pearls: 2, xp: 5, cooldownSeconds: 300, animation: "dance", spot: { x: 50, y: 58 },
    flavour: ["The coven has gathered. Productivity has left the building.", "{name} busted out a move last seen in 2003."] }),
  A({ id: "lounge_movie", locationId: "lounge", name: "Movie night", effects: { joy: 20, social: 15, energy: 5 }, pearls: 0, xp: 5, cooldownSeconds: 1800, animation: "play", spot: { x: 26, y: 40 },
    flavour: ["{name} cried at the rom-com and denies it entirely.", "Movie night: three films started, zero finished, all the gossip covered."] }),
  A({ id: "lounge_gossip", locationId: "lounge", name: "Gossip on the shell sofa", effects: { social: 25, joy: 10 }, pearls: 0, xp: 4, cooldownSeconds: 600, animation: "gossip", spot: { x: 76, y: 44 },
    flavour: ["{name} heard something. {name} cannot say what. {name} is going to say what.", "The tea was piping hot. {name} took notes."] }),
  A({ id: "beach_day", locationId: "beach", name: "Beach day picnic", effects: { joy: 20, social: 10, nourishment: 10 }, pearls: 0, xp: 5, cooldownSeconds: 1800, animation: "eat", spot: { x: 18, y: 40 },
    flavour: ["{name} laid out a picnic blanket and a frankly elite snack spread.", "Sun, sand, sandwiches. {name} declares it a beach day."] }),
  // Kairos
  A({ id: "kairos_swim", locationId: "kairos_pool", name: "Laps in the pool", effects: { joy: 20, energy: -10, social: 5 }, pearls: 3, xp: 6, cooldownSeconds: 300, animation: "swim", spot: { x: 50, y: 62 },
    flavour: ["{name} swam laps at Kairos and pretended not to notice everyone noticing.", "Ten laps. {name} counted eleven."] }),
  A({ id: "kairos_float", locationId: "kairos_pool", name: "Float and lounge", effects: { energy: 20, joy: 15 }, pearls: 0, xp: 3, cooldownSeconds: 300, animation: "float", spot: { x: 24, y: 40 },
    flavour: ["{name} claimed a lounger with the authority of a small nation.", "{name} floated. A palm frond fanned {them}. Unclear who arranged that."] }),
  A({ id: "kairos_pilates", locationId: "kairos_studio", name: "Pilates class", effects: { energy: -15, joy: 10, magic: 5, social: 5 }, pearls: 5, xp: 10, cooldownSeconds: 900, animation: "pilates", spot: { x: 26, y: 58 },
    flavour: ["{name} attended Pilates and would like the universe to acknowledge {their} sacrifice.", "The reformer reformed {name}. Briefly."] }),
  A({ id: "kairos_yoga", locationId: "kairos_studio", name: "Yoga flow", effects: { magic: 20, energy: -5, joy: 10 }, pearls: 4, xp: 9, cooldownSeconds: 900, animation: "yoga", spot: { x: 56, y: 60 },
    flavour: ["{name} held tree pose for an entire breath. Enlightenment pending.", "Downward witch. Upward witch. {name}: centred."] }),
  A({ id: "kairos_stretch", locationId: "kairos_studio", name: "Gentle stretch", effects: { energy: 10, joy: 8 }, pearls: 2, xp: 4, cooldownSeconds: 300, animation: "stretch", spot: { x: 82, y: 50 },
    flavour: ["{name} stretched and something cracked delightfully.", "Long, slow, luxurious. {name} {is} three centimetres taller (spiritually)."] }),
  A({ id: "kairos_weights", locationId: "kairos_gym", name: "Lift tiny weights", effects: { energy: -18, joy: 12, nourishment: -8 }, pearls: 5, xp: 10, cooldownSeconds: 900, animation: "weights", spot: { x: 50, y: 60 },
    flavour: ["{name} lifted a pastel dumbbell and made eye contact with {their} reflection.", "Gains: spiritual and literal. {name}: unstoppable."] }),
  A({ id: "kairos_sound", locationId: "kairos_sound", name: "Sound healing", effects: { magic: 25, energy: 15, joy: 5 }, pearls: 3, xp: 9, cooldownSeconds: 900, animation: "sound", spot: { x: 50, y: 58 },
    loot: [{ itemId: "col_moonstone", chance: 0.08 }],
    flavour: ["The crystal bowls sang. {name} sang back, slightly off-key, entirely sincere.", "{name} {is} vibrating at a frequency only dolphins understand."] }),
  A({ id: "kairos_cowork", locationId: "kairos_cowork", name: "Write an oracle column", effects: { energy: -20, social: -5, magic: 5 }, pearls: 25, xp: 12, cooldownSeconds: 1200, animation: "work", spot: { x: 50, y: 56 },
    flavour: ["{name} wrote 400 words and three of them were 'Mercury'.", "{name} worked. Briefly. Profitably. Then ordered a matcha.", "Deadline met. {name} would like a parade."] }),
  A({ id: "kairos_matcha", locationId: "kairos_cafe", name: "Strawberry iced matcha", effects: { nourishment: 15, joy: 15, energy: 10 }, pearls: -10, xp: 4, cooldownSeconds: 180, animation: "drink", spot: { x: 32, y: 56 },
    flavour: ["{name} {has} consumed {their} strawberry iced matcha and {is} now accepting compliments.", "Poolside matcha. {name} {is} unbearable now (affectionate)."] }),
  A({ id: "kairos_broth", locationId: "kairos_cafe", name: "Bone broth", effects: { nourishment: 30, energy: 5 }, pearls: -8, xp: 4, cooldownSeconds: 180, animation: "eat", spot: { x: 56, y: 60 },
    flavour: ["{name} had the bone broth. {Their} skin is now legally a mirror."] }),
  A({ id: "kairos_bowl", locationId: "kairos_cafe", name: "Dragonfruit bowl", effects: { nourishment: 25, joy: 10 }, pearls: -9, xp: 4, cooldownSeconds: 180, animation: "eat", spot: { x: 78, y: 54 },
    flavour: ["{name} ate a bowl so pink it counted as an outfit."] }),
];

// Shared coven events. Rewards land for every participant on completion.
export const SHARED_EVENTS = {
  moon_ritual: { name: "Coven Moon Ritual", locationId: "moon_deck", minParticipants: 2, effects: { magic: 30, social: 25, joy: 10 }, pearls: 30, xp: 25, lootItemId: "col_moonstone" },
  sound_bath: { name: "Group Sound Bath", locationId: "kairos_sound", minParticipants: 2, effects: { magic: 25, energy: 20, social: 20 }, pearls: 25, xp: 20, lootItemId: "col_amethyst" },
  // Only startable while the real moon is full / new (about 3 nights each cycle).
  full_moon: { name: "Full Moon Ceremony", locationId: "moon_deck", minParticipants: 2, effects: { magic: 40, social: 30, joy: 20 }, pearls: 60, xp: 40, lootItemId: "col_full_moon_pearl", moonPhase: "full" },
  new_moon: { name: "New Moon Intentions", locationId: "moon_deck", minParticipants: 2, effects: { magic: 35, energy: 20, social: 25 }, pearls: 50, xp: 35, lootItemId: "col_new_moon_shard", moonPhase: "new" },
} as const;
export type SharedEventKind = keyof typeof SHARED_EVENTS;

export const ACHIEVEMENTS = [
  { id: "first_care", name: "Tender Witch", description: "Complete your first care action." },
  { id: "first_treasure", name: "Finders Keepers", description: "Discover your first treasure." },
  { id: "kairos_regular", name: "Kairos Regular", description: "Complete five Kairos activities." },
  { id: "coven_ritual", name: "Coven Bound", description: "Complete a shared coven event." },
  { id: "fashionista", name: "Fashion Familiar", description: "Wear five accessories at once." },
  { id: "interior_witch", name: "Interior Witch", description: "Place five items in your room." },
  { id: "pearl_hoarder", name: "Pearl Hoarder", description: "Hold 300 pearls at once." },
  { id: "generous_witch", name: "Generous Witch", description: "Send five gifts to the coven." },
  { id: "oracle_devotee", name: "Oracle Devotee", description: "Draw seven oracle cards." },
  { id: "moon_child", name: "Moon Child", description: "Complete a full or new moon ceremony." },
] as const;

// Treats a witch can send a friend. The sender pays; the recipient gets the effects when they open it.
export const GIFT_TREATS = [
  { id: "treat_matcha", name: "Strawberry iced matcha", cost: 8, effects: { nourishment: 15, joy: 15, energy: 10 } },
  { id: "treat_broth", name: "Bone broth", cost: 6, effects: { nourishment: 30, energy: 5 } },
  { id: "treat_pancakes", name: "Pearl pancakes", cost: 5, effects: { nourishment: 25, joy: 8 } },
  { id: "treat_bouquet", name: "Frangipani bouquet", cost: 10, effects: { joy: 25, magic: 5 } },
] as const;

// Weekly shared goals, rotating by ISO week. Everyone in the coven is rewarded on completion.
export const COVEN_GOALS = [
  { kind: "matcha", name: "Matcha Marathon", description: "Brew strawberry iced matchas together", target: 30 },
  { kind: "rituals", name: "Ritual Week", description: "Complete coven ceremonies together", target: 3 },
  { kind: "gifts", name: "Generous Tides", description: "Send gifts to each other", target: 15 },
  { kind: "kairos", name: "Kairos Era", description: "Take Kairos classes and swims", target: 25 },
] as const;
export const COVEN_GOAL_REWARD = { pearls: 40, itemId: "col_coven_charm" } as const;

// One card per witch per day. Messages are second person so they suit any pronouns.
export const ORACLE_CARDS = [
  { id: "pearl", name: "The Pearl", symbol: "pearl", message: "What irritated you is quietly becoming something precious. Let it." },
  { id: "moon", name: "The Moon", symbol: "moon", message: "Trust the half you cannot see. It is still there." },
  { id: "shell", name: "The Shell", symbol: "shell", message: "Retreat is allowed. Rest is allowed. Return glowing." },
  { id: "tide", name: "The Tide", symbol: "tide", message: "What went out is coming back in. Leave the door open." },
  { id: "star", name: "The Star", symbol: "star", message: "Make the wish out loud today. Someone in the coven will hear it." },
  { id: "matcha", name: "The Matcha", symbol: "matcha", message: "Nourish first, decide second. Strawberry optional, but advised." },
  { id: "crown", name: "The Crown", symbol: "crown", message: "Act like the sovereign you are. Nobody needs to approve." },
  { id: "key", name: "The Key", symbol: "key", message: "The answer is in something you already own. Look again." },
  { id: "mirror", name: "The Mirror", symbol: "mirror", message: "Say the kind thing you would say to a friend, to yourself." },
  { id: "flame", name: "The Flame", symbol: "flame", message: "Small fire, steady fire. Tend one thing today." },
  { id: "butterfly", name: "The Butterfly", symbol: "butterfly", message: "You are mid-change. Messy is part of the magic." },
  { id: "cat", name: "The Familiar", symbol: "cat", message: "Follow your instincts like a cat follows the sun." },
  { id: "crystal", name: "The Crystal", symbol: "crystal", message: "Clarity arrives when you stop shaking the snow globe." },
  { id: "palm", name: "The Palm", symbol: "palm", message: "Bend, do not break. Then sway like you meant it." },
  { id: "sun", name: "The Sun", symbol: "sun", message: "Say yes to the warm thing. Joy counts as productivity." },
  { id: "lantern", name: "The Lantern", symbol: "lantern", message: "You only need to see the next step. Light it." },
  { id: "mushroom", name: "The Glowshroom", symbol: "mushroom", message: "Growth is happening where you cannot see it yet." },
  { id: "compact", name: "The Compact", symbol: "compact", message: "Your whole world fits in your palm today. Keep it close." },
  { id: "comet", name: "The Comet", symbol: "comet", message: "Something fast and bright is heading your way. Look up." },
  { id: "rose", name: "The Rose", symbol: "rose", message: "Softness is a strength. So are the thorns." },
  { id: "eye", name: "The Eye", symbol: "eye", message: "You already know. Stop asking everyone else." },
  { id: "wave", name: "The Wave", symbol: "wave", message: "Ride it, do not fight it. Then tell the coven how it went." },
] as const;

export const GAME_CONFIG = {
  decay_per_hour: { nourishment: 4, energy: 3, joy: 3, magic: 2, social: 3 },
  decay_floor: 10,
  decay_max_hours: 72,
  daily_pearls: 30,
  daily_loot: ["col_spiral_shell", "col_sea_glass_aqua", "col_rose_quartz", "col_amethyst"],
  gift_daily_limit: 12,
  starting_pearls: 120,
  chat_rate_limit: { messages: 5, seconds: 10 },
  visit_social_bonus: 10,
} as const;

export const itemById = (id: string) => ITEMS.find((i) => i.id === id);
export const activityById = (id: string) => ACTIVITIES.find((a) => a.id === id);
export const locationById = (id: string) => LOCATIONS.find((l) => l.id === id);
export const characterById = (id: string) => CHARACTERS.find((c) => c.id === id);
