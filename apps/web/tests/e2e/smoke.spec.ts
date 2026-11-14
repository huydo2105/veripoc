import { expect, test } from "@playwright/test";

for (const width of [1440, 1024, 390, 320]) {
  test(`workflow, leaderboard, and vault detail fit ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/");
    await expect(page.locator(".story-section")).toHaveCount(3);
    await expect(page.getByText("Payouts available")).toBeVisible();
    await page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Leaderboard" }).click();
    await expect(page).toHaveURL(/\/leaderboard$/);
    await expect(page.getByRole("heading", { name: "AI agent leaderboard" })).toBeVisible();
    await expect(page.getByText("ILLUSTRATIVE PROFILES · NO LIVE RANKINGS")).toBeVisible();
    await expect(page.locator(".agent-board tbody tr")).toHaveCount(3);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    await page.goto("/opportunities/demo-vault");
    await expect(page.getByRole("heading", { name: "Vault Audit Program" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  });
}

test("opportunity tabs show reviewed instructions and scope", async ({ page }) => {
  await page.goto("/opportunities/demo-vault");
  const tabs = page.getByRole("tablist", { name: "Program information" });
  await expect(tabs.getByRole("tab", { name: "Instructions" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("heading", { name: "What we’re looking for" })).toBeVisible();
  await page.getByRole("link", { name: /Read the researcher workflow/ }).click();
  await expect(page).toHaveURL(/\/how-it-works$/);
  await page.goBack();
  await tabs.getByRole("tab", { name: "Scope" }).click();
  await expect(page.getByRole("heading", { name: "In scope" })).toBeVisible();
  await expect(page.getByText("contracts/evm/FixtureVault.sol")).toBeVisible();
  await expect(page.getByText("Deployed contracts", { exact: true })).toBeVisible();
});

test("Join bounty opens only the supported local report flow", async ({ page }) => {
  await page.goto("/opportunities/demo-vault");
  await expect(page.getByText("None offered")).toBeVisible();
  await page.getByRole("link", { name: /Join bounty/ }).click();
  await expect(page).toHaveURL(/\/submit-report$/);
  await expect(page.getByRole("button", { name: /Verify PoC/ })).toBeVisible();
  await expect(page.locator("#verification").getByText("Awaiting run", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /Verify PoC/ }).click();
  await expect(page.locator("#verification").getByRole("alert")).toContainText("Enter the local API token");
  await page.getByLabel("LOCAL API TOKEN").fill("invalid-test-token");
  await page.getByRole("button", { name: /Verify PoC/ }).click();
  await expect(page.locator("#verification").getByRole("alert")).toContainText(/verification API is unavailable|API token rejected/i, { timeout: 20000 });
  await expect(page.locator("#verification").getByText("Awaiting run", { exact: true })).toBeVisible();
});

test("directory keeps runnable fixture distinct from unavailable previews", async ({ page }) => {
  await page.goto("/get-started");
  await expect(page.locator(".directory-row")).toHaveCount(3);
  await page.getByRole("group", { name: "Opportunity category" }).getByRole("button", { name: /Bounties/ }).click();
  await expect(page.getByRole("status")).toContainText("There are no live bounties");
  await page.getByRole("group", { name: "Opportunity category" }).getByRole("button", { name: /All/ }).click();
  await page.getByRole("link", { name: "Open Demo Vault Audit Program details" }).click();
  await expect(page).toHaveURL(/\/opportunities\/demo-vault$/);
});

test("public scope remains readable without JavaScript", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto("/opportunities/demo-vault");
    await expect(page.getByRole("heading", { name: "What we’re looking for" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Join bounty/ })).toBeVisible();
  } finally { await context.close(); }
});

test("team draft wizard keeps fields locally and never submits a program", async ({ page }) => {
  const posts: string[] = [];
  page.on("request", request => { if (request.method() === "POST") posts.push(request.url()); });
  await page.goto("/teams/new");
  await expect(page.getByRole("heading", { name: "Draft a bug bounty project" })).toBeVisible();
  await expect(page.getByText("Team workspace preview")).toHaveCount(0);
  await page.getByRole("textbox", { name: /Project name/ }).fill("Sample vault review");
  await page.getByRole("button", { name: /Continue/ }).click();
  await expect(page.getByRole("complementary", { name: "Program draft preview" })).toContainText("Sample vault review");
  await page.getByRole("button", { name: "Help for System overview and investigation goals" }).focus();
  await expect(page.getByRole("tooltip")).toContainText("Describe assets, trust boundaries");
  await page.getByRole("textbox", { name: /System overview and investigation goals/ }).fill("Review share accounting and record a PoC.");
  await page.getByRole("navigation", { name: "Draft sections" }).getByRole("button", { name: /Scope/ }).click();
  await page.getByRole("textbox", { name: /Target contract and immutable revision/ }).fill("Vault.sol at commit abc123");
  await page.getByRole("textbox", { name: /Permitted testing scope/ }).fill("Local fixture only");
  await page.getByRole("navigation", { name: "Draft sections" }).getByRole("button", { name: /Links/ }).click();
  await page.getByRole("button", { name: /Preview unsaved draft/ }).click();
  await expect(page.getByRole("complementary", { name: "Program draft preview" })).toContainText("Sample vault review");
  expect(posts).toEqual([]);
  await page.reload();
  await expect(page.getByRole("complementary", { name: "Program draft preview" })).not.toContainText("Sample vault review");
});
