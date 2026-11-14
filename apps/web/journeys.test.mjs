import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = path => readFileSync(new URL(path, import.meta.url), "utf8");

test("homepage shows the workflow and dedicated leaderboard remains illustrative", () => {
  const home = read("./app/page.tsx");
  assert.match(home, /Find the vulnerability/);
  assert.match(home, /href="\/get-started"/);
  assert.match(home, /story-stack/);
  assert.match(home, /Authorize/);
  assert.match(home, /Investigate/);
  assert.match(home, /DemoMetrics/);
  const board = read("./app/leaderboard/page.tsx");
  assert.match(board, /AI agent leaderboard/);
  assert.match(board, /ILLUSTRATIVE PROFILES/);
  assert.match(read("./components/layout/site-header.tsx"), /href="\/leaderboard">Leaderboard/);
  const agents = JSON.parse(read("./public/data/agent-leaderboard.json"));
  assert.ok(agents.agents.every(agent => agent.verifiedFindings === 0));
  assert.doesNotMatch(home, /Choose your path|Two perspectives|Explore workflow|scanner dashboard|scan contract|type="file"/i);
});

test("opportunities list all entries and only the reviewed vault opens a detail route", () => {
  assert.match(read("./app/get-started/page.tsx"), /OpportunityList/);
  assert.match(read("./app/opportunities/demo-vault/page.tsx"), /<RoleJourney \/>/);
  const list = read("./components/opportunities/opportunity-list.tsx");
  assert.match(list, /href="\/opportunities\/demo-vault"/);
  assert.match(list, /Runnable demo/);
  assert.match(list, /Preview · unavailable/);
  assert.match(list, /No bounty/);
  assert.match(list, /Bounties/);
  assert.match(list, /Competitions/);
  assert.match(list, /Ended/);
  assert.match(list, /directory-promo/);
  assert.doesNotMatch(list, /href="\/verify"|type="file"/);
});

test("interactive source and displayed figures are limited to the local demo", () => {
  const editor = read("./components/landing/fixture-code-card.tsx");
  const metrics = read("./components/landing/demo-metrics.tsx");
  assert.match(editor, /VulnerableVault.sol/);
  assert.match(editor, /PatchedVault.sol/);
  assert.match(editor, /READ ONLY/);
  assert.doesNotMatch(editor, /fetch\(|POST|type="file"/);
  assert.match(metrics, /Local demo figures/);
  assert.doesNotMatch(metrics, /detail:|demo-metrics-caption/);
  assert.match(metrics, /Payouts available/);
  assert.match(metrics, /Known fixture vulnerability/);
  assert.doesNotMatch(metrics, /Researchers registered|Total paid out|Customers/);
});

test("vault detail shows honest fixture data and sends submissions to the shared verifier", () => {
  assert.match(read("./app/opportunities/demo-vault/page.tsx"), /<RoleJourney \/>/);
  const journey = read("./components/journeys/role-journey.tsx");
  assert.match(journey, /role="tablist"/);
  assert.match(journey, /href="\/submit-report"/);
  assert.match(journey, /Runnable fixture/);
  assert.match(read("./app/submit-report/page.tsx"), /<VerificationConsole embedded/);
  assert.match(read("./app/how-it-works/page.tsx"), /researcher-owned|your own AI agent/);
  const program = JSON.parse(read("./public/data/vault-program.json"));
  assert.equal(program.reward, "None offered");
  assert.equal(program.status, "local_fixture_only");
  assert.ok(program.outOfScope.includes("Arbitrary contract or PoC uploads"));
  assert.match(read("./app/verify/page.tsx"), /<VerificationConsole/);
  const footer = read("./components/layout/site-footer.tsx");
  assert.doesNotMatch(footer, /\/teams\/start|\/researchers\/start|\/verify/);
});

test("team can preview an unsaved project draft without publishing it", () => {
  const draft = read("./components/journeys/program-draft.tsx");
  assert.match(read("./app/teams/new/page.tsx"), /ProgramDraft/);
  assert.match(draft, /Unsaved local preview/);
  for (const section of ["Instructions", "Agent access", "Scope", "Exclusions", "Rewards", "Links"]) assert.match(draft, new RegExp(section));
  assert.match(draft, /role="tooltip"/);
  assert.match(draft, /Preview unsaved draft/);
  assert.doesNotMatch(draft, /fetch\(|localStorage|type="file"/);
});

test("reviewed source excerpts and light/dark themes remain separate from live execution", () => {
  const workflow = read("./components/journeys/role-workflow.tsx");
  const source = read("../../contracts/evm/FixtureVault.sol");
  assert.match(workflow, /Code selection does not execute Foundry/);
  assert.match(workflow, /source\[shownCode\]/);
  assert.match(workflow, /totalSupply \+ VIRTUAL_SHARES/);
  assert.match(source, /totalSupply \+ VIRTUAL_SHARES/);
  const css = read("./app/globals.css");
  assert.match(css, /data-theme="dark"/);
  assert.match(css, /prefers-reduced-motion/);
});

test("logo is icon-only and published Agent Card remains byte-identical", () => {
  const logo = read("./components/brand/logo.tsx");
  assert.match(logo, /aria-label="VeriPoC home"/);
  assert.match(logo, /veripoc-mark.svg/);
  assert.doesNotMatch(logo, />VeriPoC</);
  assert.equal(read("./public/.well-known/agent-card.json"), read("../../.well-known/agent-card.json"));
});
