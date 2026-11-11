import { test, expect } from "@playwright/test";

async function themeContrast(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    const css = getComputedStyle(document.documentElement);
    const value = (name: string) => css.getPropertyValue(name).trim();
    const luminance = (hex: string) => {
      const full = hex.length === 4 ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}` : hex;
      const channels = [1, 3, 5].map(start => parseInt(full.slice(start, start + 2), 16) / 255);
      const linear = channels.map(channel => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
      return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
    };
    const ratio = (a: string, b: string) => {
      const values = [luminance(value(a)), luminance(value(b))].sort((x, y) => y - x);
      return (values[0] + 0.05) / (values[1] + 0.05);
    };
    return [ratio("--ink", "--page"), ratio("--muted", "--page"), ratio("--accent", "--page"), ratio("--on-accent", "--accent")];
  });
}

for (const width of [1440, 1024, 390, 320]) {
  test(`homepage and vertical story fit ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Find the vulnerability.*Verify the proof/i })).toBeVisible();
    await expect(page.getByRole("link", { name: "Get started" })).toHaveAttribute("href", "/get-started");
    await expect(page.getByRole("navigation", { name: "Main navigation" }).getByRole("link")).toHaveCount(2);
    await expect(page.locator(".story-section")).toHaveCount(3);
    await expect(page.getByRole("heading", { name: "Start with a clear boundary." })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Researchers bring their own tools." })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Check the claim. Keep the evidence." })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    if (process.env.CAPTURE_SCREENSHOTS) await page.screenshot({ path: testInfo.outputPath(`home-${width}.png`), fullPage: true });
  });
}

test("Get started lists all opportunities, then opens the reviewed vault details", async ({ page }, testInfo) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Get started" }).click();
  await expect(page).toHaveURL(/\/get-started$/);
  await expect(page.getByRole("heading", { name: "Opportunities", exact: true })).toBeVisible();
  await expect(page.locator(".directory-row")).toHaveCount(3);
  await expect(page.getByText("Runnable local demo")).toBeVisible();
  await expect(page.getByText("Preview · unavailable")).toHaveCount(2);
  await expect(page.getByText(/public preview does not authorize/i)).toBeVisible();
  if (process.env.CAPTURE_SCREENSHOTS) await page.screenshot({ path: testInfo.outputPath("opportunities.png"), fullPage: true });
  await page.getByRole("link", { name: "Open Demo Vault Audit Program details" }).click();
  await expect(page).toHaveURL(/\/opportunities\/demo-vault$/);
  await expect(page.getByRole("heading", { name: /What you can investigate/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: /From bug report to verification/ })).toBeVisible();
  if (process.env.CAPTURE_SCREENSHOTS) await page.screenshot({ path: testInfo.outputPath("demo-detail.png"), fullPage: true });
  await page.getByRole("navigation", { name: "Choose an audit path" }).getByRole("link", { name: "I have a project to audit" }).click();
  await expect(page).toHaveURL(/\/teams\/start$/);
  await expect(page.getByRole("link", { name: /Preview unsaved project/ })).toBeVisible();
  await page.getByRole("link", { name: "Open verification console" }).click();
  await expect(page).toHaveURL(/\/verify$/);
});

test("team draft is local, unsaved, and never creates an authorization", async ({ page }, testInfo) => {
  const posts: string[] = [];
  page.on("request", request => { if (request.method() === "POST") posts.push(request.url()); });
  await page.goto("/teams/start");
  await page.getByRole("link", { name: /Preview unsaved project/ }).click();
  await expect(page).toHaveURL(/\/teams\/new$/);
  await page.getByLabel("Project name").fill("Sample lending protocol");
  await page.getByLabel("Target contract and immutable revision").fill("Vault.sol at commit abc123");
  await page.getByLabel("Permitted testing scope").fill("Local test environment only");
  await page.getByRole("button", { name: "Preview unsaved draft" }).click();
  await expect(page.getByRole("complementary", { name: "Program draft preview" })).toContainText("Sample lending protocol");
  await expect(page.getByRole("complementary", { name: "Program draft preview" })).toContainText("not published");
  expect(posts).toEqual([]);
  if (process.env.CAPTURE_SCREENSHOTS) await page.screenshot({ path: testInfo.outputPath("draft-preview.png"), fullPage: true });
  await page.reload();
  await expect(page.getByRole("complementary", { name: "Program draft preview" })).not.toContainText("Sample lending protocol");
});

test("real fixture code changes with a step and contract toggle, without running the API", async ({ page }, testInfo) => {
  const posts: string[] = [];
  page.on("request", request => { if (request.method() === "POST" && request.url().includes("/v1/")) posts.push(request.url()); });
  await page.setViewportSize({ width: 1440, height: 800 });
  await page.goto("/opportunities/demo-vault");
  const workflow = page.getByRole("group", { name: "Researcher workflow steps" });
  await workflow.getByRole("button", { name: /Investigate the code/ }).click();
  const source = page.locator("#source-preview");
  await expect(source).toContainText("assets * totalSupply / totalAssets()");
  await source.getByRole("button", { name: "Patched" }).click();
  await expect(source).toContainText("VIRTUAL_SHARES");
  await expect(source).toContainText("Code selection does not execute Foundry");
  await workflow.getByRole("button", { name: /Submit a reproducible PoC/ }).click();
  await expect(source).toContainText("testVulnerableDonationReproduces");
  expect(posts).toEqual([]);
  if (process.env.CAPTURE_SCREENSHOTS) await page.screenshot({ path: testInfo.outputPath("researcher-workflow.png"), fullPage: true });
});

test("desktop scroll selects the visible workflow step", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 800 });
  await page.goto("/teams/start");
  const steps = page.getByRole("group", { name: "Team workflow steps" });
  const patch = steps.getByRole("button", { name: /Check the patch/ });
  await patch.scrollIntoViewIfNeeded();
  await expect(patch).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#source-preview")).toContainText("VIRTUAL_SHARES");
});

test("theme toggle persists, remains keyboard accessible, and keeps reduced motion", async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  for (const ratio of await themeContrast(page)) expect(ratio).toBeGreaterThanOrEqual(4.5);
  const dark = page.getByRole("button", { name: "Switch to dark theme" });
  await dark.focus();
  await expect(dark).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.getByRole("button", { name: "Switch to light theme" })).toHaveAttribute("aria-pressed", "true");
  for (const ratio of await themeContrast(page)) expect(ratio).toBeGreaterThanOrEqual(4.5);
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe("auto");
  if (process.env.CAPTURE_SCREENSHOTS) await page.screenshot({ path: testInfo.outputPath("home-dark.png"), fullPage: true });
  await page.goto("/get-started");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("verifier still needs a real authenticated backend result", async ({ page }) => {
  await page.goto("/verify");
  await expect(page.locator("#verification").getByText("Awaiting run", { exact: true })).toBeVisible();
  await expect(page.getByText("Not captured", { exact: true })).toHaveCount(3);
  await page.getByRole("button", { name: /Verify PoC/ }).click();
  await expect(page.locator("#verification").getByRole("alert")).toContainText("Enter the local API token");
  await page.getByLabel("LOCAL API TOKEN").fill("invalid-test-token");
  await page.getByRole("button", { name: /Verify PoC/ }).click();
  await expect(page.locator("#verification").getByRole("alert")).toContainText(/verification API is unavailable|API token rejected/i);
  await expect(page.locator("#verification").getByText("Awaiting run", { exact: true })).toBeVisible();
});

test("role steps and code remain readable without JavaScript", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto("/researchers/start");
    await expect(page.getByText("Read the scope", { exact: true })).toBeVisible();
    await expect(page.locator(".mobile-source").first()).toContainText("FixtureVault");
    await expect(page.getByRole("link", { name: "Open verification console" })).toBeVisible();
  } finally { await context.close(); }
});
