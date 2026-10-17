import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Lets parallel dev servers (art galleries, tests) run without sharing a build dir.
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
