import { defineConfig, devices } from "@playwright/test";

// End-to-end multiplayer test against a local Supabase stack (see README "Testing").
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 300_000,
  expect: { timeout: 15_000 },
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    ...devices["iPhone 13"],
    browserName: "chromium",
    launchOptions: { executablePath: process.env.PW_CHROMIUM ?? undefined },
    trace: "retain-on-failure",
    reducedMotion: "reduce",
  },
});
