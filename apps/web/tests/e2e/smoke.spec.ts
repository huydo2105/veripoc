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
    await expect(page.getByRole("banner").getByRole("link", { name: "Verify PoC" })).toHaveAttribute("href", "/verify");
    await expect(page.getByRole("contentinfo").getByRole("link", { name: "GitHub" })).toBeVisible();
    await expect(page.getByRole("link", { name: /demo|connect wallet/i })).toHaveCount(0);
    if (width <= 390) {
      const cards = page.getByTestId("role-card");
      expect((await cards.nth(1).boundingBox())!.y).toBeGreaterThan((await cards.first().boundingBox())!.y);
    }
    if (process.env.CAPTURE_SCREENSHOTS) await page.screenshot({ path: testInfo.outputPath(`home-${width}.png`), fullPage: true });
  });
}

test("deep links, home navigation and shared verifier", async ({ page }) => {
  await page.goto("/teams/start");
  await expect(page.getByText(/Program permissions and the findings inbox are planned/)).toBeVisible();
  await page.getByRole("link", { name: "VeriPoC home" }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.getByRole("link", { name: /I want to audit/ }).click();
  await expect(page).toHaveURL(/\/researchers\/start$/);
  await expect(page.getByText(/Agent access and new PoC submissions are planned/)).toBeVisible();
  await page.getByRole("link", { name: "Open verifier" }).click();
  await expect(page).toHaveURL(/\/verify$/);
  await expect(page.getByRole("button", { name: /Verify PoC/ })).toBeVisible();
});

test("keyboard focus, icon-only brand and reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const brand = page.getByRole("link", { name: "VeriPoC home" });
  await expect(brand).toHaveText("");
  await expect(brand.locator("img")).toHaveCount(1);
  for (let index = 0; index < 8; index++) await page.keyboard.press("Tab");
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
  await page.getByLabel("LOCAL API TOKEN").fill("invalid-test-token");
  await page.getByRole("button", { name: /Verify PoC/ }).click();
  await expect(page.locator("#verification").getByRole("alert")).toContainText(/verification API is unavailable|API token rejected/i);
  await expect(page.locator("#verification").getByText("Awaiting run", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /Patched control/ }).click();
  await expect(page.getByText("Same PoC against the patched vault")).toBeVisible();
  await page.getByText("Fixture and test details").click();
  await expect(page.getByText("Trusted test", { exact: true })).toBeVisible();
});

test("workflow supports keyboard and compares examples without submitting jobs", async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Workflow" }).click();
  await expect(page).toHaveURL(/\/workflow$/);
  const postRequests: string[] = [];
  page.on("request", request => { if (request.method() === "POST" && request.url().endsWith("/v1/verify-poc")) postRequests.push(request.url()); });
  const steps = page.getByRole("group", { name: "Workflow steps" });
  const authorize = steps.getByRole("button", { name: "Authorize" });
  const investigate = steps.getByRole("button", { name: "Investigate" });
  const verify = steps.getByRole("button", { name: "Verify" });
  await expect(authorize).toHaveAttribute("aria-pressed", "true");
  await authorize.press("ArrowRight");
  await expect(investigate).toBeFocused();
  await expect(page.getByRole("heading", { name: "Share-inflation claim" })).toBeVisible();
  await investigate.press("ArrowRight");
  await expect(verify).toBeFocused();
  await expect(page.getByText("Reproduced", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Patched", exact: true }).click();
  await expect(page.getByText("Not reproduced", { exact: true })).toBeVisible();
  await expect(page.getByText(/Illustrative outcome/)).toBeVisible();
  expect(postRequests).toEqual([]);
  if (process.env.CAPTURE_SCREENSHOTS) await page.screenshot({ path: testInfo.outputPath("workflow-patched.png"), fullPage: true });
  await page.getByRole("link", { name: "Run real PoC" }).click();
  await expect(page).toHaveURL(/\/verify$/);
});

test("desktop scroll follows the stages and a click can override", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 800 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("button", { name: "Authorize" }).click();
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect(page.getByRole("button", { name: "Verify", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Investigate" }).click();
  await expect(page.getByRole("heading", { name: "Share-inflation claim" })).toBeVisible();
});

test("workflow stays readable with JavaScript disabled", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto("/workflow");
    const summary = page.getByRole("list", { name: "Workflow summary" });
    await expect(summary.getByText(/Researchers submit a claim and executable proof/)).toBeVisible();
    await expect(page.getByRole("link", { name: "Run real PoC" })).toBeVisible();
  } finally {
    await context.close();
  }
});
