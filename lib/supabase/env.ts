// Public values (safe in the browser; data is protected by RLS). Env vars override them,
// e.g. .env.local for local development against `npx supabase start`.
const PROD_SUPABASE_URL = "https://ogvydqsynyksgbymptzm.supabase.co";
const PROD_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_MJeu6Zp0ihXXAOHCz87rBA_oWo1hnO9";
const PROD_SITE_URL = "https://rocha-merwitch-world.vercel.app";

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || PROD_SUPABASE_URL;
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || PROD_SUPABASE_PUBLISHABLE_KEY;
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || PROD_SITE_URL).replace(/\/$/, "");
export const isConfigured = () => Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
