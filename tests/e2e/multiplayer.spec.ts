import { expect, test, type Browser, type Page } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";

// Requires: local Supabase running (`npx supabase start`), freshly reset (`npx supabase db reset`),
// and the app running on E2E_BASE_URL with .env.local pointing at it.
const MAILPIT = process.env.MAILPIT_URL ?? "http://127.0.0.1:54324";
const SHOTS = "screenshots/e2e";
mkdirSync(SHOTS, { recursive: true });
const shot = (page: Page, name: string) => page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: false });

async function latestCode(email: string, after: number): Promise<string> {
  for (let i = 0; i < 40; i++) {
    const res = await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:${email}`)}`);
    const data = (await res.json()) as { messages: { ID: string; Created: string }[] };
    const msg = data.messages?.find((m) => new Date(m.Created).getTime() >= after - 2000);
    if (msg) {
      const full = (await (await fetch(`${MAILPIT}/api/v1/message/${msg.ID}`)).json()) as { Text: string; HTML: string };
      const code = (full.Text || full.HTML).match(/\b(\d{6})\b/)?.[1];
      if (code) return code;
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`no code email for ${email}`);
}

async function signIn(page: Page, email: string) {
  const t = Date.now();
  await page.getByLabel("Your email").fill(email);
  await page.getByRole("button", { name: /send my magic link/i }).click();
  const code = await latestCode(email, t);
  await page.getByLabel("Code from the email").fill(code);
  await page.getByRole("button", { name: /enter the coven/i }).click();
}

async function claimViaInvite(browser: Browser, url: string, email: string, name: string) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && !/Failed to load resource/.test(m.text()) && errors.push(m.text()));
  page.on("response", (r) => r.status() >= 400 && errors.push(`${r.status()} ${r.url()}`));
  await page.goto(url);
  await expect(page.getByRole("heading", { name })).toBeVisible();
  await signIn(page, email);
  await page.getByRole("button", { name: `Claim ${name}` }).click();
  await page.waitForURL("**/play");
  return { ctx, page, errors };
}

async function dismissDaily(page: Page) {
  const collect = page.getByRole("button", { name: /collect daily gift/i });
  await collect.waitFor({ timeout: 10_000 });
  await collect.click();
  await page.getByRole("button", { name: /lovely, thank you/i }).click();
}

async function goToLocation(page: Page, name: RegExp) {
  await page.getByRole("button", { name: /^Shell$/ }).click();
  await page.getByRole("button", { name }).first().click();
}

const pearls = async (page: Page) => Number(await page.locator('[aria-label$=" pearls"]').first().getAttribute("aria-label").then((s) => s!.split(" ")[0]));

test("five-witch coven core loop: invites, claims, chat, presence, shared ritual, persistence", async ({ browser }) => {
  // 1. Owner invite minted with the service role, exactly as the README describes.
  const out = execFileSync("node", ["--env-file=.env.local", "scripts/create-invite.mjs", "rocha"], { encoding: "utf8" });
  const rochaUrl = out.match(/http\S+\/invite\/[0-9a-f]{48}/)![0];

  const rocha = await claimViaInvite(browser, rochaUrl, "rocha@coven.test", "Rocha");
  await dismissDaily(rocha.page);
  await expect(rocha.page.getByText("Baby Merwitch").first()).toBeVisible();
  await rocha.page.waitForTimeout(1500);
  await shot(rocha.page, "01-rocha-world");

  // 2. Owner creates Lizz's invite in-app.
  await rocha.page.goto("/admin");
  await rocha.page.locator("li", { hasText: "Lizz" }).getByRole("button", { name: "New invite" }).click();
  const lizzUrl = (await rocha.page.locator("code").first().textContent())!.trim();
  expect(lizzUrl).toMatch(/\/invite\/[0-9a-f]{48}$/);
  await rocha.page.goto("/play");

  const lizz = await claimViaInvite(browser, lizzUrl, "lizz@coven.test", "Lizz");
  await dismissDaily(lizz.page);
  await expect(lizz.page.getByText("The Lesbian Witch").first()).toBeVisible();

  // 3. The used invite cannot be reused by a third person.
  const thief = await browser.newContext();
  const tp = await thief.newPage();
  await tp.goto(lizzUrl);
  await expect(tp.getByText(/already been claimed/i)).toBeVisible();
  await thief.close();

  // 4. Presence + chat across devices, in the Coven Lounge.
  await goToLocation(rocha.page, /coven lounge/i);
  await goToLocation(lizz.page, /coven lounge/i);
  await expect(rocha.page.getByText("Lizz", { exact: true }).first()).toBeVisible();
  await lizz.page.getByLabel("Message").fill("hello from Lizz, they/them and fabulous");
  await lizz.page.getByRole("button", { name: "Send" }).click();
  await expect(rocha.page.getByText("hello from Lizz, they/them and fabulous")).toBeVisible();
  await rocha.page.getByLabel("Message").fill("welcome to the shell <b>not bold</b>");
  await rocha.page.getByRole("button", { name: "Send" }).click();
  await expect(lizz.page.getByText("welcome to the shell <b>not bold</b>")).toBeVisible();
  await shot(lizz.page, "02-lizz-lounge-chat");

  // 5. Shared moon ritual: start, join from the other device, host begins, both rewarded.
  await goToLocation(rocha.page, /moon deck/i);
  await rocha.page.getByRole("button", { name: /light the candles/i }).click();
  await goToLocation(lizz.page, /moon deck/i);
  await lizz.page.getByRole("button", { name: /join the circle/i }).click();
  const before = await pearls(lizz.page);
  await expect(rocha.page.getByRole("button", { name: /begin the ceremony/i })).toBeEnabled();
  await shot(rocha.page, "03-rocha-ritual-gathering");
  await rocha.page.getByRole("button", { name: /begin the ceremony/i }).click();
  await expect(rocha.page.getByText(/treasure discovered/i)).toBeVisible();
  await expect(lizz.page.getByText(/coven ritual is complete/i)).toBeVisible();
  await expect.poll(() => pearls(lizz.page)).toBe(before + 30);
  await rocha.page.getByRole("button", { name: /into the treasure chest/i }).click();

  // 6. Care action changes stats and pearls; state survives a reload.
  await goToLocation(lizz.page, /matcha caf/i);
  const p0 = await pearls(lizz.page);
  await lizz.page.getByRole("button", { name: /strawberry iced matcha/i }).last().click();
  await expect(lizz.page.getByText(/accepting compliments|perfection/i).first()).toBeVisible();
  await expect.poll(() => pearls(lizz.page)).toBe(p0 - 8);
  await shot(lizz.page, "04-lizz-cafe");
  await lizz.page.reload();
  await expect.poll(() => pearls(lizz.page)).toBe(p0 - 8);

  // 7. Wardrobe: try on, buy, wear.
  await lizz.page.getByRole("button", { name: /^Wardrobe$/ }).click();
  await lizz.page.getByRole("tab", { name: "Hats" }).click();
  await lizz.page.getByRole("button", { name: /try on pink witch hat/i }).click();
  await lizz.page.getByRole("button", { name: /buy 70/i }).click();
  await expect(lizz.page.getByText(/is yours/i)).toBeVisible();
  await shot(lizz.page, "05-lizz-wardrobe");

  // 8. Rocha sees Lizz's new hat live on the coven roster, then visits the room.
  await rocha.page.getByRole("button", { name: /^Coven/ }).click();
  await expect(rocha.page.getByText("2 online")).toBeVisible();
  await shot(rocha.page, "06-rocha-coven");

  for (const s of [rocha, lizz]) {
    const real = s.errors.filter((e) => !/favicon|Download the React DevTools/i.test(e));
    expect(real, `console errors: ${real.join("\n")}`).toEqual([]);
  }
  await rocha.ctx.close();
  await lizz.ctx.close();
});
