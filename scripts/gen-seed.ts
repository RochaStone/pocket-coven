// Generates supabase/seed.sql from lib/game/catalog.ts.
// Run: node scripts/gen-seed.ts   (Node 22.18+ strips types natively)
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { buildSeedSql } from "../lib/game/seed-sql.ts";

const out = fileURLToPath(new URL("../supabase/seed.sql", import.meta.url));
writeFileSync(out, buildSeedSql());
console.log(`wrote ${out}`);
