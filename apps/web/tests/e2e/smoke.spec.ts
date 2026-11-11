import { test, expect } from "@playwright/test";

for (const width of [1440, 1024, 390, 320]) {
  test(`homepage roles and layout at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Find vulnerabilities.*Verify the evidence/i })).toBeVisible();
    await expect(page.getByTestId("role-card")).toHaveCount(2);
    await expect(page.getByRole("link", { name: /I have a smart contract to audit/ })).toHaveAttribute("href", "/teams/start");
    await expect(page.getByRole("link", { name: /I want to audit/ })).toHaveAttribute("href", "/researchers/start");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow).toBe(false);
    if (width <= 390) {
      const cards = page.getByTestId("role-card");
      expect((await cards.nth(1).boundingBox())!.y).toBeGreaterThan((await cards.first().boundingBox())!.y);
    }
    if (process.env.CAPTURE_SCREENSHOTS) await page.screenshot({ path: testInfo.outputPath(`home-${width}.png`), fullPage: true });
  });
}

test("deep links, home navigation and shared verifier", async ({ page }) => {
  await page.goto("/teams/start");
  await expect(page.getByText("Demo Vault Audit Program")).toBeVisible();
  await expect(page.getByText(/permission enforcement belong to Issue #35/)).toBeVisible();
  await page.getByRole("link", { name: "VeriPoC home" }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.getByRole("link", { name: /I want to audit/ }).click();
  await expect(page).toHaveURL(/\/researchers\/start$/);
  await expect(page.getByText(/no live networks, external targets, or arbitrary uploads/)).toBeVisible();
  await page.getByRole("link", { name: /Open verification demo/ }).click();
  await expect(page).toHaveURL(/\/verify$/);
  await expect(page.getByRole("button", { name: /Verify PoC/ })).toBeVisible();
});

test("keyboard focus, icon-only brand and reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const brand = page.getByRole("link", { name: "VeriPoC home" });
  await expect(brand).toHaveText("");
  await expect(brand.locator("img")).toHaveCount(1);
  for (let index = 0; index < 7; index++) await page.keyboard.press("Tab");
  await expect(page.getByTestId("role-card").first()).toBeFocused();
  expect(await page.getByTestId("role-card").first().evaluate(element => element.matches(":focus-visible"))).toBe(true);
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe("auto");
});

test("verification never claims a result without an authenticated backend response", async ({ page }, testInfo) => {
  await page.goto("/verify");
  await expect(page.locator("#verification").getByText("Awaiting run", { exact: true })).toBeVisible();
  await expect(page.getByText("Not captured", { exact: true })).toHaveCount(3);
  await expect(page.getByText(/Agent #1067 is listed in the published card/)).toBeVisible();
  if (process.env.CAPTURE_SCREENSHOTS) await page.screenshot({ path: testInfo.outputPath("verify-empty.png"), fullPage: true });
  await page.getByRole("button", { name: /Verify PoC/ }).click();
  await expect(page.locator("#verification").getByRole("alert")).toContainText("Enter the local API token");
  await page.getByLabel("LOCAL API TOKEN").fill("invalid-demo-token");
  await page.getByRole("button", { name: /Verify PoC/ }).click();
  await expect(page.locator("#verification").getByRole("alert")).toContainText(/verification API is unavailable|API token rejected/i);
  await expect(page.locator("#verification").getByText("Awaiting run", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /Patched control/ }).click();
  await expect(page.getByText("Same PoC against the patched vault")).toBeVisible();
});
