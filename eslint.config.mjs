import next from "eslint-config-next";

const config = [...next, { ignores: [".next/**", ".next-*/**", "node_modules/**", "next-env.d.ts", "scripts/tmp-*/**", "screenshots/**"] }];

export default config;
