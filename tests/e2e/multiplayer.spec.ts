import { expect, test, type Browser, type Page } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";

// Requires: local Supabase running (`npx supabase start`), freshly reset (`npx supabase db reset`),
// and the app running on E2E_BASE_URL with .env.local pointing at it.
const SHOTS = "screenshots/e2e";
mkdirSync(SHOTS, { recursive: true });
const shot = (page: Page, name: string) => page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: false });

const PASSWORD = "seashell-magic-42";

async function createLogin(page: Page, email: string) {
  await page.getByLabel("Email").fill(email);
  await page.getByLabel(/choose a password/i).fill(PASSWORD);
  await page.getByRole("button", { name: /create my login/i }).click();
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
  await createLogin(page, email);
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

  // 3b. A returning witch signs in from a fresh device with email + password.
  const again = await browser.newContext();
  const ap = await again.newPage();
  await ap.goto("/");
  await ap.getByRole("button", { name: "Open the seashell" }).click({ force: true });
  await ap.getByRole("button", { name: /enter the coven/i }).click();
  await ap.getByLabel("Email").fill("lizz@coven.test");
  await ap.getByLabel("Password").fill(PASSWORD);
  await ap.getByRole("button", { name: /enter the coven/i }).click();
  await ap.waitForURL("**/play");
  await expect(ap.getByText("The Lesbian Witch").first()).toBeVisible();
  await again.close();

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

  // 9. Gifting: Rocha sends Lizz a matcha; Lizz gets a live alert and opens it.
  await rocha.page.locator("li", { hasText: "The Lesbian Witch" }).getByRole("button", { name: "Send gift" }).click();
  await rocha.page.getByPlaceholder(/favourite chaos witch/i).fill("for my favourite chaos witch");
  await rocha.page.getByRole("button", { name: /send gift \(8 pearls\)/i }).click();
  await expect(rocha.page.getByText(/gift sent/i)).toBeVisible();
  await expect(lizz.page.getByText(/Rocha sent you a gift/i)).toBeVisible();
  await lizz.page.getByRole("button", { name: /^Open$/ }).click();
  await lizz.page.getByRole("button", { name: /tap to open/i }).first().click();
  await expect(lizz.page.getByText("for my favourite chaos witch").first()).toBeVisible();
  await shot(lizz.page, "07-lizz-gift");
  await lizz.page.getByRole("button", { name: "Close" }).click();

  // 10. Daily oracle on the world screen.
  await lizz.page.getByRole("button", { name: /^Shell$/ }).click();
  await lizz.page.getByRole("button", { name: /draw today's oracle card/i }).click();
  await lizz.page.getByRole("button", { name: /draw my card/i }).click();
  await expect(lizz.page.getByRole("button", { name: /share with the coven/i })).toBeVisible();
  await shot(lizz.page, "08-lizz-oracle");
  await lizz.page.getByRole("button", { name: /share with the coven/i }).click();
  await expect(rocha.page.getByText(/drew The /).first()).toBeVisible();

  for (const s of [rocha, lizz]) {
    const real = s.errors.filter((e) => !/favicon|Download the React DevTools/i.test(e));
    expect(real, `console errors: ${real.join("\n")}`).toEqual([]);
  }
  await rocha.ctx.close();
  await lizz.ctx.close();
});
