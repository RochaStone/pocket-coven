import next from "eslint-config-next";

const config = [...next, { ignores: [".next/**", ".next-*/**", "node_modules/**", "next-env.d.ts", "scripts/tmp-*/**", "supabase/functions/**", "screenshots/**"] }];

export default config;
