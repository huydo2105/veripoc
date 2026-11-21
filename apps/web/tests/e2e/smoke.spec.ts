import { expect, test } from "@playwright/test";
import { AccountAddress } from "@concordium/web-sdk";
import { createApiServer } from "../../../api/server.mjs";
import { DEMO_PROGRAM } from "../../../api/program.mjs";

test("brand mark keeps its accessible home link and adapts to both themes", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const brand = page.locator("header").getByRole("link", { name: "VeriPoC home" });
  await expect(brand).toBeVisible();
  await expect(brand.locator("svg")).toHaveAttribute("aria-hidden", "true");
  const box = await brand.boundingBox();
  expect(box?.width).toBeGreaterThanOrEqual(44);
  expect(box?.height).toBeGreaterThanOrEqual(44);
  const heroAction = page.getByRole("link", { name: "Get started" });
  const actionBox = await heroAction.boundingBox();
  expect(actionBox?.width).toBeGreaterThanOrEqual(260);
  expect(actionBox?.height).toBeGreaterThanOrEqual(72);
  expect(await heroAction.evaluate(element => parseFloat(getComputedStyle(element).fontSize))).toBeGreaterThanOrEqual(20);

  if (await page.getByRole("button", { name: "Switch to light mode" }).isVisible()) {
    await page.getByRole("button", { name: "Switch to light mode" }).click();
  }
  await expect.poll(() => page.locator("body").evaluate(body => getComputedStyle(body).backgroundColor)).toBe("rgb(246, 245, 242)");
  const lightStroke = await brand.locator("path").first().evaluate(path => getComputedStyle(path).stroke);
  await page.screenshot({ path: testInfo.outputPath("brand-light-1440.png"), fullPage: false });
  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  await expect.poll(() => page.locator("body").evaluate(body => getComputedStyle(body).backgroundColor)).toBe("rgb(20, 20, 20)");
  const darkStroke = await brand.locator("path").first().evaluate(path => getComputedStyle(path).stroke);
  expect(lightStroke).not.toBe(darkStroke);
  await page.screenshot({ path: testInfo.outputPath("brand-dark-1440.png"), fullPage: false });
  await brand.focus();
  await expect(brand).toBeFocused();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("button", { name: "Connect Concordium wallet" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Opportunities" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.screenshot({ path: testInfo.outputPath("brand-dark-390.png"), fullPage: false });
  await page.setViewportSize({ width: 320, height: 700 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  const favicon = await page.request.get("/brand/veripoc-app-icon.svg");
  expect(favicon.ok()).toBe(true);
  expect(await favicon.text()).toContain("#ee9077");
});

for (const width of [1440, 1024, 390, 320]) {
  test(`workflow, leaderboard, and vault detail fit ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/");
    await expect(page.locator(".story-section")).toHaveCount(3);
    await expect(page.getByRole("heading", { name: "Frequently asked questions" })).toBeVisible();
    await page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Leaderboard" }).click();
    await expect(page).toHaveURL(/\/leaderboard$/);
    await expect(page.getByRole("heading", { name: "Leaderboard" })).toBeVisible();
    await expect(page.getByText("AGENT DIRECTORY PREVIEW")).toBeVisible();
    await expect(page.locator(".agent-board tbody tr")).toHaveCount(3);
    await page.getByRole("searchbox", { name: "Search AI agents" }).fill("vault");
    await expect(page.locator(".agent-board tbody tr")).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    await page.goto("/opportunities/demo-vault");
    await expect(page.getByRole("heading", { name: "Vault Audit Program" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    await page.goto("/submit-report");
    await expect(page.getByRole("heading", { name: /Turn an agent finding.*into evidence/ })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    await page.getByRole("button", { name: "Continue to agent brief" }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  });
}

test("authorized workspace uses the 4-step layout, requires a token, and fits mobile", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/programs/demo-vault");
  await expect(page.getByText("DEMO VAULT AUDIT PROGRAM", { exact: false })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Finding preparation steps" }).getByRole("button")).toHaveCount(4);
  await expect(page.getByRole("heading", { name: "Know what you may investigate." })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  await page.getByRole("button", { name: /Verify evidence/ }).click();
  await expect(page.getByTestId("finding-status")).toContainText("Draft only — not yet submitted");
  await expect(page.getByRole("button", { name: "Open authorized program" })).toBeDisabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  await page.getByLabel("LOCAL PROGRAM TOKEN").fill("invalid-token");
  await page.getByRole("button", { name: "Open authorized program" }).click();
  await expect(page.getByTestId("program-error")).toContainText("verification API is unavailable", { timeout: 20000 });
  await expect(page.locator("#verification").getByRole("alert")).toContainText("verification API is unavailable");
  await expect(page.getByText("Private submissions")).toHaveCount(0);
});

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

test("reviewed vault opens only the supported local report flow", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: {
      writeText: async (value: string) => { sessionStorage.setItem("copied-agent-brief", value); },
    } });
  });
  await page.goto("/opportunities/demo-vault");
  await expect(page.getByText("None offered")).toBeVisible();
  await page.getByRole("link", { name: "Enter authorized program" }).click();
  await expect(page).toHaveURL(/\/programs\/demo-vault$/);
  await expect(page.getByRole("navigation", { name: "Finding preparation steps" }).getByRole("button")).toHaveCount(4);
  await page.getByRole("button", { name: "Open protected program view" }).click();
  await expect(page.getByLabel("LOCAL PROGRAM TOKEN")).toBeVisible();
  await expect(page.getByRole("button", { name: "Open authorized program" })).toBeDisabled();
  await page.goto("/submit-report");
  await expect(page.getByRole("heading", { name: /Turn an agent finding.*into evidence/ })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Finding preparation steps" }).getByRole("button")).toHaveCount(4);
  await page.getByRole("button", { name: "Continue to agent brief" }).click();
  await expect(page.getByRole("heading", { name: "Give your agent a bounded brief." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Give your agent a bounded brief." })).toBeFocused();
  await page.getByRole("button", { name: "Copy brief" }).click();
  await expect(page.getByRole("status")).toContainText("Agent brief copied");
  expect(await page.evaluate(() => sessionStorage.getItem("copied-agent-brief"))).toContain("contracts/evm/FixtureVault.sol");
  await page.getByRole("button", { name: "Draft a finding" }).click();
  await page.getByRole("button", { name: "Review and verify" }).click();
  await expect(page.locator(".report-field-error")).toContainText("Complete the required finding fields");
  await expect(page.getByLabel("Claim title")).toBeFocused();
  await page.getByRole("button", { name: "Skip draft" }).click();
  await expect(page.getByRole("button", { name: /Verify PoC/ })).toBeVisible();
  await expect(page.locator("#verification").getByText("Awaiting run", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /Verify PoC/ }).click();
  await expect(page.locator("#verification").getByRole("alert")).toContainText("Enter the local API token");
  await page.getByLabel("LOCAL PROGRAM TOKEN").fill("invalid-test-token");
  await page.getByRole("button", { name: /Verify PoC/ }).click();
  await expect(page.locator("#verification").getByRole("alert")).toContainText(/verification API is unavailable|API token rejected/i, { timeout: 20000 });
  await expect(page.locator("#verification").getByText("Awaiting run", { exact: true })).toBeVisible();
});

test("researcher draft is local, reviewable, and cleared on reload", async ({ page }) => {
  const posts: string[] = [];
  page.on("request", request => { if (request.method() === "POST") posts.push(request.url()); });
  await page.goto("/submit-report");
  await page.getByRole("button", { name: "Continue to agent brief" }).click();
  await page.getByRole("button", { name: "Draft a finding" }).click();
  for (const [label, value] of [
    ["Claim title", "Share inflation"], ["Affected code location", "FixtureVault.sol:deposit"],
    ["Root cause and preconditions", "Donation before victim deposit"], ["Observed or expected impact", "Victim receives no shares"],
    ["Security invariant", "Victim receives positive shares"], ["Reproduction steps and PoC reference", "Run reviewed vault oracle"],
  ]) await page.getByLabel(label).fill(value);
  await page.getByRole("button", { name: "Review and verify" }).click();
  await expect(page.getByText("Unsent finding draft")).toBeVisible();
  await expect(page.getByText("Share inflation", { exact: true })).toBeVisible();
  expect(posts).toEqual([]);
  await page.getByRole("button", { name: "Edit draft" }).click();
  await expect(page.getByLabel("Claim title")).toHaveValue("Share inflation");
  await page.reload();
  await page.getByRole("button", { name: "Continue to agent brief" }).click();
  await page.getByRole("button", { name: "Draft a finding" }).click();
  await expect(page.getByLabel("Claim title")).toHaveValue("");
});

test("agent brief stays readable when clipboard permission is unavailable", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: {
      writeText: async () => { throw new Error("clipboard denied"); },
    } });
  });
  await page.goto("/submit-report");
  await page.getByRole("button", { name: "Continue to agent brief" }).click();
  await page.getByRole("button", { name: "Copy brief" }).click();
  await expect(page.getByRole("status")).toContainText("Select and copy the brief below");
  await expect(page.locator(".report-agent-brief")).toContainText("contracts/evm/FixtureVault.sol");
});

test("directory shows real external bounties and one separate runnable fixture", async ({ page }) => {
  await page.goto("/get-started");
  await expect(page.locator(".directory-row")).toHaveCount(19);
  await expect(page.locator(".directory-bounty")).toHaveCount(8);
  await expect(page.locator(".directory-source")).toHaveCount(10);
  await expect(page.locator(".directory-bounty img.directory-project-logo")).toHaveCount(8);
  await expect(page.locator(".directory-source img.directory-project-logo")).toHaveCount(10);
  const firstBountyLogo = page.locator(".directory-bounty img.directory-project-logo").first();
  await firstBountyLogo.scrollIntoViewIfNeeded();
  await expect.poll(() => firstBountyLogo.evaluate(image => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0)).toBe(true);
  const firstSourceLogo = page.locator(".directory-source img.directory-project-logo").first();
  await firstSourceLogo.scrollIntoViewIfNeeded();
  await expect.poll(() => firstSourceLogo.evaluate(image => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0)).toBe(true);
  const soladyLogo = page.locator(".directory-source").filter({ hasText: "Solady" }).locator("img.directory-project-logo");
  await soladyLogo.scrollIntoViewIfNeeded();
  await expect.poll(() => soladyLogo.evaluate(image => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0)).toBe(true);
  await expect(page.getByText("Showing 19 entries")).toBeVisible();
  await expect(page.locator(".directory-source").first()).toBeVisible();
  await expect(page.getByText(/External programs are hosted by their owners on Immunefi/)).toBeVisible();
  const uniswap = page.getByRole("link", { name: /Open official source for Uniswap v4 Core/ });
  await expect(uniswap).toHaveAttribute("href", /^https:\/\/github\.com\/Uniswap\/v4-core\/tree\/[a-f0-9]{40}$/);
  await expect(uniswap).toHaveAttribute("rel", "noopener noreferrer");
  await expect(page.getByRole("group", { name: "Filter by ecosystem" })).toHaveCount(0);
  await page.getByRole("group", { name: "Opportunity category" }).getByRole("button", { name: /Bug bounties/ }).click();
  await expect(page.locator(".directory-bounty")).toHaveCount(8);
  await expect(page.locator(".directory-source")).toHaveCount(0);
  await expect(page.locator(".directory-bounty").filter({ hasText: "Solana" })).not.toHaveCount(0);
  await page.getByRole("link", { name: "View Raydium bounty summary" }).click();
  await expect(page).toHaveURL(/\/opportunities\/raydium$/);
  await expect(page.locator(".opportunity-project-logo")).toHaveAttribute("src", /raydium\.png/);
  const join = page.getByRole("link", { name: "Join bounty" });
  await expect(join).toHaveAttribute("href", "/submit-report?bounty=raydium");
  await expect(page.getByText(/External bug bounty/)).toHaveCount(0);
  const bountyTabs = page.getByRole("tablist", { name: "Bounty information" });
  await expect(bountyTabs.getByRole("tab", { name: "Instructions" })).toHaveAttribute("aria-selected", "true");
  await bountyTabs.getByRole("tab", { name: "Scope" }).click();
  await expect(page.getByRole("heading", { name: "Scope" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Read complete current scope/ })).toHaveAttribute("href", "https://immunefi.com/bug-bounty/raydium/scope/");
  await expect(page.getByRole("heading", { name: "Assets and systems to inspect" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Impact categories" })).toBeVisible();
  await bountyTabs.getByRole("tab", { name: "Scope" }).press("ArrowRight");
  await expect(bountyTabs.getByRole("tab", { name: "Prior audits" })).toHaveAttribute("aria-selected", "true");
  await expect(bountyTabs.getByRole("tab", { name: "Use your agent" })).toHaveCount(0);
  await join.click();
  await expect(page).toHaveURL(/\/submit-report\?bounty=raydium$/);
  await expect(page.getByRole("heading", { name: "Turn a finding into a report." })).toBeVisible();
  await expect(page.getByRole("button", { name: /Verify PoC/ })).toHaveCount(0);
  await page.getByRole("link", { name: "Raydium scope" }).click();
  await expect(page).toHaveURL(/\/opportunities\/raydium$/);
  await page.getByRole("link", { name: "All opportunities" }).click();
  await page.getByRole("group", { name: "Opportunity category" }).getByRole("button", { name: /Public source/ }).click();
  await expect(page.locator(".directory-source")).toHaveCount(8);
  await expect(page.getByRole("link", { name: "Open Demo Vault Audit Program details" })).toHaveCount(0);
  await page.getByRole("group", { name: "Opportunity category" }).getByRole("button", { name: /Practice labs/ }).click();
  await expect(page.locator(".directory-source")).toHaveCount(2);
  await page.getByRole("searchbox", { name: "Search opportunities" }).fill("Ethernaut");
  await expect(page.locator(".directory-source")).toHaveCount(1);
  await page.getByRole("searchbox", { name: "Search opportunities" }).fill("no such repository");
  await expect(page.getByRole("status")).toContainText("No matching entries");
  await page.getByRole("searchbox", { name: "Search opportunities" }).clear();
  await page.getByRole("group", { name: "Opportunity category" }).getByRole("button", { name: /All/ }).click();
  await page.getByRole("link", { name: "Open Demo Vault Audit Program details" }).click();
  await expect(page).toHaveURL(/\/opportunities\/demo-vault$/);
});

test("external report draft stays local and never starts a verifier job", async ({ page }) => {
  const posts: string[] = [];
  page.on("request", request => { if (request.method() === "POST") posts.push(request.url()); });
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: {
      writeText: async (value: string) => { sessionStorage.setItem("external-report-draft", value); },
    } });
  });
  await page.goto("/submit-report?bounty=orca");
  await expect(page.getByRole("navigation", { name: "Finding preparation steps" }).getByRole("button")).toHaveCount(4);
  await expect(page.getByRole("heading", { name: "Targets" })).toBeVisible();
  await expect(page.getByText("Orca Whirlpools", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /Read complete current scope/ })).toHaveAttribute("href", "https://immunefi.com/bug-bounty/orca/scope/");
  await page.getByRole("button", { name: "Continue to agent brief" }).click();
  await expect(page.getByRole("heading", { name: "Give your agent a bounded brief." })).toBeFocused();
  await page.getByRole("button", { name: "Draft a finding" }).click();
  await page.getByLabel("Finding title").fill("Candidate accounting issue");
  await page.getByLabel("Affected asset and revision").fill("Official Orca scoped asset at reviewed revision");
  await page.getByLabel("Impact and broken invariant").fill("Candidate impact requiring local reproduction");
  await page.getByLabel("Reproduction steps and PoC").fill("Local test steps and observations");
  await page.getByRole("button", { name: "Review finding" }).click();
  await expect(page.getByRole("heading", { name: "Review before submission." })).toBeFocused();
  await page.getByRole("button", { name: "Copy report" }).click();
  await expect(page.getByRole("status")).toContainText("Draft copied");
  const copied = await page.evaluate(() => sessionStorage.getItem("external-report-draft"));
  expect(copied).toContain("https://immunefi.com/bug-bounty/orca/scope/");
  expect(copied).toContain("Candidate accounting issue");
  await expect(page.getByRole("link", { name: "Continue on Immunefi" })).toHaveAttribute("href", "https://immunefi.com/bug-bounty/orca/information/");
  expect(posts).toEqual([]);
});

test("unknown bounty query cannot fall through to the vault verifier", async ({ page }) => {
  await page.goto("/submit-report?bounty=unknown-program");
  await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Verify PoC/ })).toHaveCount(0);
});

for (const width of [1440, 1024, 390, 320]) {
  test(`public source directory fits ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/get-started");
  await expect(page.locator(".directory-source")).toHaveCount(10);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    await page.getByRole("group", { name: "Opportunity category" }).getByRole("button", { name: /Practice labs/ }).focus();
    await expect(page.getByRole("group", { name: "Opportunity category" }).getByRole("button", { name: /Practice labs/ })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator(".directory-source")).toHaveCount(2);
    await page.goto("/submit-report?bounty=orca");
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  });
}

test("public scope remains readable without JavaScript", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto("/opportunities/demo-vault");
    await expect(page.getByRole("heading", { name: "What we’re looking for" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Enter authorized program" })).toBeVisible();
  } finally { await context.close(); }
});

test("team draft wizard previews locally and shows saved state only after API success", async ({ page }) => {
  const posts: string[] = [];
  page.on("request", request => { if (request.method() === "POST") posts.push(request.url()); });
  await page.goto("/teams/new");
  await expect(page.getByRole("heading", { name: "Create a bug bounty project" })).toBeVisible();
  await expect(page.getByText("Team workspace preview")).toHaveCount(0);
  await page.getByRole("textbox", { name: /Project name/ }).fill("Sample vault review");
  await page.getByRole("textbox", { name: /Team contact/ }).fill("team@example.org");
  await page.getByRole("button", { name: /Continue/ }).click();
  await expect(page.getByRole("complementary", { name: "Program draft preview" })).toContainText("Sample vault review");
  await page.getByRole("button", { name: "Help for System overview and investigation goals" }).focus();
  await expect(page.getByRole("tooltip")).toContainText("Describe assets, trust boundaries");
  await page.getByRole("textbox", { name: /System overview and investigation goals/ }).fill("Review share accounting and record a PoC.");
  await page.getByRole("navigation", { name: "Draft sections" }).getByRole("button", { name: /Scope/ }).click();
  await page.getByRole("textbox", { name: /Primary source repository URL/ }).fill("https://github.com/example/vault");
  await page.getByRole("textbox", { name: /Pinned source commit or digest/ }).fill("a".repeat(40));
  await page.getByRole("textbox", { name: /Permitted contract paths/ }).fill("contracts/Vault.sol");
  await page.getByRole("combobox", { name: /Chain and test environment/ }).selectOption("evm-local");
  await page.getByRole("spinbutton", { name: /Verification run limit/ }).fill("2");
  await page.getByRole("navigation", { name: "Draft sections" }).getByRole("button", { name: /Links/ }).click();
  await page.getByRole("textbox", { name: /Technical documentation URL/ }).fill("https://docs.example.org/vault");
  await page.getByRole("button", { name: "Add reference" }).click();
  await page.getByRole("textbox", { name: "Name", exact: true }).fill("Vault library");
  await page.getByRole("textbox", { name: /HTTPS link or address/ }).fill("https://github.com/example/library");
  await page.getByRole("navigation", { name: "Draft sections" }).getByRole("button", { name: /Agent setup/ }).click();
  await page.getByRole("button", { name: /Preview unsaved draft/ }).click();
  await expect(page.getByRole("complementary", { name: "Program draft preview" })).toContainText("Sample vault review");
  expect(posts).toEqual([]);
  const id = "11111111-1111-4111-8111-111111111111";
  await page.route("**/v1/auth/me", route => route.fulfill({ status: 200, contentType: "application/json",
    body: JSON.stringify({ authenticated: true, account: "test-owner", csrfToken: "csrf" }) }));
  await page.route("**/v1/programs/agent-setup", async route => {
    const body = route.request().postDataJSON();
    expect(body.name).toBe("Sample vault review");
    expect(body.permittedTargets).toBe("contracts/Vault.sol");
    expect(body.additionalContext).toContain("Vault library");
    expect(body.additionalContext).not.toContain("researcherAccount");
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
      agentContext: "Use the pinned source revision.", agentRules: "Stay within contracts/Vault.sol.",
    }) });
  });
  await page.getByRole("button", { name: "Generate agent setup with AI" }).click();
  await expect(page.getByRole("textbox", { name: /Agent-readable setup/ })).toHaveValue("Use the pinned source revision.");
  await page.getByRole("textbox", { name: /Agent permissions and tool limits/ }).fill("Stay within the authorized source.");
  await page.getByRole("button", { name: /Preview unsaved draft/ }).click();
  await page.route("**/v1/programs", async route => {
    expect(route.request().headers()["x-veripoc-csrf"]).toBe("csrf");
    const body = route.request().postDataJSON();
    expect(body.contact).toBe("team@example.org");
    expect(body.docsUrl).toBe("https://docs.example.org/vault");
    expect(body.agentContext).toBe("Use the pinned source revision.");
    expect(body.references).toHaveLength(1);
    await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ program: { id } }) });
  });
  await page.getByRole("button", { name: "Publish authorized program" }).click();
  await expect(page.getByRole("link", { name: "Open saved program" })).toHaveAttribute("href", `/programs/${id}`);
  await page.reload();
  await expect(page.getByRole("complementary", { name: "Program draft preview" })).not.toContainText("Sample vault review");
});

test("profile has projects and findings without exposing private programs to visitors", async ({ page }) => {
  await page.goto("/profile/projects");
  await expect(page.getByRole("navigation", { name: "Profile sections" }).getByRole("link")).toHaveCount(2);
  await expect(page.getByRole("link", { name: "Our projects" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("button", { name: "Sign with Concordium to view programs" })).toBeVisible();
  await page.getByRole("link", { name: "Our findings" }).click();
  await expect(page).toHaveURL(/\/profile\/findings$/);
  await expect(page.getByRole("link", { name: "Our findings" })).toHaveAttribute("aria-current", "page");
});

test("owner can sign into profile and revisit saved programs", async ({ page }) => {
  let signedIn = false;
  await page.addInitScript(() => {
    Object.defineProperty(window, "concordium", { value: {
      requestAccounts: async () => ["mock-team-account"],
      signMessage: async () => ({ signature: "mock-signature" }),
    } });
  });
  await page.route("**/v1/auth/me", route => route.fulfill({ status: 200, contentType: "application/json",
    body: JSON.stringify(signedIn ? { authenticated: true, account: "mock-team-account", csrfToken: "mock-csrf" } : { authenticated: false }) }));
  await page.route("**/v1/auth/concordium/challenge", route => route.fulfill({ status: 200, contentType: "application/json",
    body: JSON.stringify({ challengeId: "mock-challenge", message: "Sign this challenge" }) }));
  await page.route("**/v1/auth/concordium/verify", route => {
    signedIn = true;
    return route.fulfill({ status: 200, contentType: "application/json",
      body: JSON.stringify({ authenticated: true, account: "mock-team-account", csrfToken: "mock-csrf" }) });
  });
  await page.route("**/v1/programs/mine", route => route.fulfill({ status: signedIn ? 200 : 403,
    contentType: "application/json", body: JSON.stringify(signedIn ? { programs: [{ id: "11111111-1111-1111-1111-111111111111",
      name: "Saved vault", ownerAccount: "mock-team-account", status: "active", visibility: "private",
      verification: "not-configured", sourceUrl: "https://example.org/vault", sourceRevision: "a".repeat(40),
      chain: "evm-local", permittedTargets: ["src/Vault.sol"], rules: "Review the vault", exclusions: "Other targets",
      runLimit: 2 }] } : { error: "team account required" }) }));
  await page.route("**/v1/programs/invited", route => route.fulfill({ status: signedIn ? 200 : 401,
    contentType: "application/json", body: JSON.stringify(signedIn ? { programs: [] } : { error: "wallet session required" }) }));
  await page.goto("/profile/projects");
  await page.getByRole("button", { name: "Sign with Concordium to view programs" }).click();
  await expect(page.getByRole("heading", { name: "Saved vault" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open program" })).toHaveAttribute("href", "/programs/11111111-1111-1111-1111-111111111111");
});

test("legacy /verify operator console remains available", async ({ page }) => {
  await page.goto("/verify");
  await expect(page.getByRole("heading", { name: /Verify a.*PoC/ })).toBeVisible();
  await expect(page.getByLabel("LOCAL API TOKEN")).toBeVisible();
  await expect(page.getByRole("button", { name: "Verify PoC", exact: true })).toBeVisible();
});

test("Demo Vault wizard runs invited researcher verification and shows private evidence to team", async ({ browser, baseURL }) => {
  const operatorToken = "operator-token-with-at-least-thirty-two-characters";
  const teamToken = "team-token-with-at-least-thirty-two-characters";
  const researcherToken = "researcher-token-with-at-least-thirty-two-characters";
  const vulnDigest = "1".repeat(64);
  const patchedDigest = "2".repeat(64);

  const serverOptions = {
    token: operatorToken,
    teamToken,
    researcherToken,
    execute: async (_kind: string, body: { fixture: "vulnerable" | "patched" }) => {
      const vulnerable = body.fixture === "vulnerable";
      return {
        status: vulnerable ? "reproduced" : "not_reproduced",
        financialEvidence: vulnerable
          ? { attackerBefore: "101", attackerAfter: "201", victimShares: "0" }
          : { attackerBefore: "101", attackerAfter: "51", victimShares: "1960784" },
        receipt: {
          fixture: body.fixture,
          invariant: {
            passed: true,
            name: vulnerable ? "testVulnerableDonationReproduces" : "testPatchedDonationDoesNotReproduce",
          },
          input: { imageId: "sha256:local-test", sourceSha256: DEMO_PROGRAM.workerInputSha256 },
          tools: { forge: "1.0.0", solc: "0.8.28" },
          evidence: { executionLogSha256: vulnerable ? "a".repeat(64) : "b".repeat(64) },
        },
        anchor: { receiptSha256: vulnerable ? vulnDigest : patchedDigest },
      };
    },
  };
  const server = createApiServer(serverOptions);
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const apiBase = `http://127.0.0.1:${(server.address() as { port: number }).port}`;

  async function forwardProgramApi(targetPage: import("@playwright/test").Page) {
    await targetPage.route("**/v1/**", async route => {
      const req = route.request();
      const url = new URL(req.url());
      const headers: Record<string, string> = {};
      for (const name of ["authorization", "content-type", "idempotency-key"]) {
        const value = req.headers()[name];
        if (value) headers[name] = value;
      }
      const upstream = await fetch(`${apiBase}${url.pathname}${url.search}`, {
        method: req.method(),
        headers,
        body: req.method() === "POST" ? (req.postData() ?? "") : undefined,
      });
      await route.fulfill({
        status: upstream.status,
        contentType: upstream.headers.get("content-type") ?? "application/json",
        body: await upstream.text(),
      });
    });
  }

  try {
    const researcherContext = await browser.newContext({ baseURL });
    try {
      const page = await researcherContext.newPage();
      await forwardProgramApi(page);

      await page.goto("/submit-report?bounty=demo-vault");
      await expect(page.getByRole("heading", { name: "Know what you may investigate." })).toBeVisible();
      await page.getByRole("button", { name: "Continue to agent brief" }).click();
      await page.getByRole("button", { name: "Draft a finding" }).click();
      for (const [label, value] of [
        ["Claim title", "Donation share inflation"],
        ["Affected code location", "FixtureVault.sol:deposit"],
        ["Root cause and preconditions", "Donation before victim deposit inflates share price"],
        ["Observed or expected impact", "Victim receives zero shares"],
        ["Security invariant", "Victim receives positive shares"],
        ["Reproduction steps and PoC reference", "Run vulnerable and patched fixtures"],
      ]) await page.getByLabel(label).fill(value);
      await page.getByRole("button", { name: "Review and verify" }).click();

      await expect(page.getByTestId("finding-status")).toContainText("Draft only — not yet submitted");
      await expect(page.getByText("Unsent finding draft")).toBeVisible();

      // Operator token must be denied on program routes.
      await page.getByLabel("LOCAL PROGRAM TOKEN").fill(operatorToken);
      await page.getByRole("button", { name: "Open authorized program" }).click();
      await expect(page.getByTestId("program-error")).toContainText("API token rejected");

      // Team token can open the program but cannot submit or run jobs.
      await page.getByLabel("LOCAL PROGRAM TOKEN").fill(teamToken);
      await page.getByRole("button", { name: /Verify PoC/ }).click();
      await expect(page.locator("#verification").getByRole("alert")).toContainText("researcher role required");
      await expect(page.getByText(/Signed in locally as team/)).toBeVisible();

      // Invited researcher token submits the claim and runs the vulnerable fixture.
      await page.getByLabel("LOCAL PROGRAM TOKEN").fill(researcherToken);
      await page.getByRole("button", { name: /Verify PoC/ }).click();
      await expect(page.getByTestId("finding-status")).toContainText("Real worker verdict returned — Reproduced", { timeout: 10_000 });
      await expect(page.locator("#verification")).toContainText("Reproduced");
      await expect(page.locator("#verification")).toContainText("201");
      await expect(page.locator("#evidence")).toContainText(vulnDigest);
      await expect(page.getByRole("region", { name: "Protected program view" })).toContainText("Signed in locally as researcher (demo-researcher)");
      await expect(page.getByRole("region", { name: "Protected program view" })).toContainText("1 / 4");

      // Researcher runs the patched control fixture on the same submission.
      await page.getByRole("group", { name: "Choose reviewed fixture" }).getByRole("button", { name: /Patched control/ }).click();
      await page.getByRole("button", { name: /Verify PoC/ }).click();
      await expect(page.getByTestId("finding-status")).toContainText("Real worker verdict returned — Not reproduced", { timeout: 10_000 });
      await expect(page.getByRole("complementary", { name: "Run comparison" })).toContainText("Reproduced");
      await expect(page.getByRole("complementary", { name: "Run comparison" })).toContainText("Not reproduced");
      await expect(page.getByRole("region", { name: "Protected program view" })).toContainText("2 / 4");
    } finally {
      await researcherContext.close();
    }

    const teamContext = await browser.newContext({ baseURL });
    try {
      const teamPage = await teamContext.newPage();
      await forwardProgramApi(teamPage);

      await teamPage.goto("/programs/demo-vault");
      await expect(teamPage.getByRole("navigation", { name: "Finding preparation steps" }).getByRole("button")).toHaveCount(4);
      await expect(teamPage.getByRole("heading", { name: "Know what you may investigate." })).toBeVisible();
      await teamPage.getByRole("button", { name: /Verify evidence/ }).click();
      await teamPage.getByLabel("LOCAL PROGRAM TOKEN").fill(teamToken);
      await teamPage.getByRole("button", { name: "Open authorized program" }).click();

      const protectedView = teamPage.getByRole("region", { name: "Protected program view" });
      await expect(protectedView).toContainText("Signed in locally as team (demo-team)");
      await expect(protectedView).toContainText("2 / 4");
      await expect(protectedView).toContainText("donation-share-inflation");
      await expect(protectedView).toContainText("demo-researcher");
      await expect(teamPage.getByRole("button", { name: "Submit reviewed vault claim" })).toHaveCount(0);
      await expect(teamPage.getByRole("button", { name: /Run .* fixture/ })).toHaveCount(0);

      // Inspect the first (vulnerable) job and verify private evidence and absence of secrets in URL/storage.
      await protectedView.getByRole("button", { name: /View private job/ }).first().click();
      await expect(teamPage.locator("#verification")).toContainText("Reproduced");
      await expect(teamPage.locator("#verification")).toContainText("201");
      await expect(teamPage.locator("#evidence")).toContainText(vulnDigest);

      const url = teamPage.url();
      const storageDump = await teamPage.evaluate(() =>
        JSON.stringify({ local: { ...localStorage }, session: { ...sessionStorage } })
      );
      for (const secret of [operatorToken, teamToken, researcherToken, vulnDigest, patchedDigest]) {
        expect(url).not.toContain(secret);
        expect(storageDump).not.toContain(secret);
      }
    } finally {
      await teamContext.close();
    }
  } finally {
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
});

test("Concordium wallet connects and disconnects while the API is unavailable", async ({ page }) => {
  const authPosts: string[] = [];
  await page.route("**/v1/auth/**", route => {
    if (route.request().method() === "POST") authPosts.push(new URL(route.request().url()).pathname);
    return route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: "verification API is unavailable" }),
    });
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Connect Concordium wallet" }).click();
  await expect(page.getByTestId("wallet-auth-error")).toContainText("Concordium Browser Wallet not detected");
  const toaster = page.locator("[data-sonner-toaster]");
  await expect(toaster).toHaveAttribute("data-y-position", "bottom");
  await expect(toaster).toHaveAttribute("data-x-position", "right");
  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  await expect(toaster).toHaveAttribute("data-sonner-theme", "dark");
  await page.getByRole("button", { name: "Close toast" }).click();

  const address = AccountAddress.fromBuffer(new Uint8Array(32).fill(0x55).buffer).address;
  await page.addInitScript((account: string) => {
    (window as unknown as Record<string, unknown>).concordium = {
      requestAccounts: async () => [account],
      connect: async () => account,
    };
  }, address);

  await page.reload();
  await page.getByRole("button", { name: "Connect Concordium wallet" }).click();
  const walletButton = page.getByRole("button", { name: /Connected wallet/ });
  await expect(walletButton).toBeVisible();
  expect(authPosts).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await expect(page.getByRole("link", { name: "Program inbox" })).toHaveCount(0);

  await walletButton.click();
  await expect(page.getByTestId("wallet-only-account")).toContainText(address.slice(0, 6));
  await expect(page.getByText("Wallet connected", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign in to VeriPoC" })).toHaveCount(0);
  await page.getByRole("button", { name: "Disconnect wallet from this page" }).click();
  await expect(page.getByRole("button", { name: "Connect Concordium wallet" })).toBeVisible();
  expect(authPosts).toEqual([]);
});
