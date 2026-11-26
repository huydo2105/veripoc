import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { extname } from "node:path";

const sources = JSON.parse(readFileSync(new URL("./public/data/public-sources.json", import.meta.url), "utf8"));
const bounties = JSON.parse(readFileSync(new URL("./public/data/bug-bounties.json", import.meta.url), "utf8"));

function assertLocalLogo(item) {
  assert.match(item.logo, /^\/projects\/[a-z0-9-]+\.(png|svg)$/);
  const asset = readFileSync(new URL(`./public${item.logo}`, import.meta.url));
  assert.ok(asset.length > 100, `${item.id} logo is empty`);
  if (extname(item.logo) === ".png") assert.equal(asset.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
  else assert.match(asset.toString("utf8"), /<svg\b/);
}

test("eight external bounties carry official terms, scope and dated summaries", () => {
  assert.equal(bounties.length, 8);
  assert.equal(new Set(bounties.map(item => item.id)).size, 8);
  assert.ok(bounties.filter(item => item.ecosystems.includes("solana")).length >= 2);
  assert.ok(bounties.filter(item => item.ecosystems.includes("ethereum")).length >= 2);
  for (const item of bounties) {
    assertLocalLogo(item);
    assert.match(item.programUrl, /^https:\/\/immunefi\.com\/bug-bounty\/[a-z0-9]+\/information\/$/);
    assert.match(item.scopeUrl, /^https:\/\/immunefi\.com\/bug-bounty\/[a-z0-9]+\/scope\/$/);
    assert.match(item.resourcesUrl, /^https:\/\/immunefi\.com\/bug-bounty\/[a-z0-9]+\/resources\/$/);
    assert.match(item.checkedAt, /^\d{4}-\d{2}-\d{2}$/);
    for (const section of ["instructions", "reporting", "restrictions", "targets", "impacts", "scope"]) {
      assert.ok(Array.isArray(item[section]) && item[section].length > 0, `${item.id} needs ${section}`);
      assert.ok(item[section].every(line => typeof line === "string" && line.trim()), `${item.id} has an empty ${section} entry`);
    }
    assert.ok(item.auditsUrl === null || item.auditsUrl.startsWith("https://github.com/"));
  }
});

test("catalog has ten distinct pinned GitHub source references across two ecosystems", () => {
  assert.equal(sources.length, 10);
  assert.equal(new Set(sources.map(source => source.id)).size, 10);
  assert.equal(sources.filter(source => source.kind === "protocol").length, 8);
  assert.equal(sources.filter(source => source.kind === "practice").length, 2);
  assert.equal(sources.filter(source => source.ecosystem === "ethereum").length, 8);
  assert.equal(sources.filter(source => source.ecosystem === "solana").length, 2);
  for (const source of sources) {
    assertLocalLogo(source);
    assert.match(source.repository, /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/);
    assert.match(source.revision, /^[a-f0-9]{40}$/);
    assert.ok(["ethereum", "solana"].includes(source.ecosystem));
    assert.ok(source.title && source.owner && source.description);
    assert.ok(!JSON.stringify(source).match(/bounty|payout|authorized|verify|submit/i));
  }
});

test("catalog cards never route external sources to Auditor submission or execution", () => {
  const component = readFileSync(new URL("./components/opportunities/opportunity-list.tsx", import.meta.url), "utf8");
  assert.match(component, /github\.com\/\$\{source\.repository\}\/tree\/\$\{source\.revision\}/);
  assert.match(component, /target="_blank" rel="noopener noreferrer"/);
  assert.doesNotMatch(component, /Filter by ecosystem/);
  assert.match(component, /Bug bounties/);
  const sourceRow = component.match(/function SourceRow\([\s\S]*?\n}\n/)?.[0];
  assert.ok(sourceRow);
  assert.doesNotMatch(sourceRow, /fetch\(|type="file"|href="\/submit-report"|href="\/verify"/);
});

test("external bounty joins through a guarded local draft, not the vault verifier", () => {
  const page = readFileSync(new URL("./app/opportunities/[slug]/page.tsx", import.meta.url), "utf8");
  const tabs = readFileSync(new URL("./components/opportunities/external-bounty-tabs.tsx", import.meta.url), "utf8");
  const route = readFileSync(new URL("./app/submit-report/page.tsx", import.meta.url), "utf8");
  const draft = readFileSync(new URL("./components/journeys/external-report-draft.tsx", import.meta.url), "utf8");
  assert.match(page, /Join bounty/);
  assert.match(page, /submit-report\?bounty=\$\{bounty\.id\}/);
  assert.doesNotMatch(page, /External bug bounty|Join bounty on Immunefi/);
  assert.doesNotMatch(tabs, /Use your agent/);
  assert.match(route, /if \(!bounty\) notFound\(\)/);
  assert.match(draft, /report-wizard-layout/);
  assert.match(draft, /Finding preparation steps/);
  assert.match(draft, /Continue on Immunefi/);
  assert.doesNotMatch(draft, /VerificationConsole|fetch\(|type="file"/);
});
