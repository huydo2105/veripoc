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
  assert.match(home, /WorkflowVideoCard/);
  assert.match(home, /HomeFaq/);
  const board = read("./app/leaderboard/page.tsx");
  assert.match(board, /AGENT DIRECTORY PREVIEW/);
  assert.match(board, /Rankings will use real evidence/);
  assert.match(read("./components/layout/site-header.tsx"), /href="\/leaderboard">Leaderboard/);
  const agents = JSON.parse(read("./public/data/agent-leaderboard.json"));
  assert.ok(agents.agents.every(agent => agent.verifiedFindings === 0));
  assert.doesNotMatch(home, /Choose your path|Two perspectives|Explore workflow|scanner dashboard|scan contract|type="file"/i);
});

test("opportunities distinguish public source references from the runnable vault", () => {
  assert.match(read("./app/get-started/page.tsx"), /OpportunityList/);
  assert.match(read("./app/opportunities/demo-vault/page.tsx"), /<RoleJourney \/>/);
  const list = read("./components/opportunities/opportunity-list.tsx");
  assert.match(list, /href="\/opportunities\/demo-vault"/);
  assert.match(list, /Runnable fixture/);
  assert.match(list, /Read-only reference/);
  assert.match(list, /Public source/);
  assert.match(list, /Practice labs/);
  assert.match(list, /noopener noreferrer/);
  assert.match(list, /External programs are hosted by their owners on Immunefi/);
  assert.doesNotMatch(list, /Lending market review|AMM pool review|Preview · unavailable/);
  assert.match(list, /No bounty/);
  assert.match(list, /Bug bounties/);
  assert.doesNotMatch(list, /Filter by ecosystem/);
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

test("vault detail links to the protected program while preserving the fixed verifier", () => {
  assert.match(read("./app/opportunities/demo-vault/page.tsx"), /<RoleJourney \/>/);
  const journey = read("./components/journeys/role-journey.tsx");
  assert.match(journey, /role="tablist"/);
  assert.match(journey, /href="\/programs\/demo-vault"/);
  assert.match(read("./app/programs/demo-vault/page.tsx"), /<ProgramWorkspace \/>/);
  assert.match(read("./components/programs/program-workspace.tsx"), /<ReportWizard unlockAllSteps \/>/);
  assert.match(journey, /Runnable fixture/);
  assert.match(read("./app/submit-report/page.tsx"), /<ReportWizard \/>/);
  const wizard = read("./components/journeys/report-wizard.tsx");
  assert.match(wizard, /<ProgramConsole/);
  assert.match(wizard, /Draft only — not yet submitted/);
  assert.match(wizard, /Claim submitted — awaiting worker verdict/);
  assert.match(wizard, /Real worker verdict returned/);
  const consoleSource = read("./components/programs/program-console.tsx");
  assert.match(consoleSource, /\/v1\/programs\/demo-vault/);
  assert.doesNotMatch(consoleSource + wizard, /localStorage|sessionStorage/);
  assert.match(read("./app/how-it-works/page.tsx"), /researcher-owned|your own AI agent/);
  const program = JSON.parse(read("./public/data/vault-program.json"));
  assert.equal(program.reward, "None offered");
  assert.equal(program.status, "local_fixture_only");
  assert.ok(program.outOfScope.includes("Arbitrary contract or PoC uploads"));
  assert.match(read("./app/verify/page.tsx"), /<VerificationConsole/);
  const footer = read("./components/layout/site-footer.tsx");
  assert.doesNotMatch(footer, /\/teams\/start|\/researchers\/start|\/verify/);
});

test("team wizard previews locally and has a final editable agent setup", () => {
  const draft = read("./components/journeys/program-draft.tsx");
  assert.match(read("./app/teams/new/page.tsx"), /ProgramDraft/);
  assert.match(draft, /Unsaved local preview/);
  for (const section of ["Instructions", "Agent setup", "Scope", "Exclusions", "Rewards", "Links"]) assert.match(draft, new RegExp(section));
  assert.match(draft, /role="tooltip"/);
  assert.match(draft, /Create bounty/);
  assert.match(draft, /Generate with AI/);
  assert.doesNotMatch(draft, /localStorage|type="file"/);
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
  const mark = read("./components/brand/brand-mark.tsx");
  const icon = read("./public/brand/auditor-app-icon.svg");
  assert.match(logo, /aria-label="Auditor home"/);
  assert.match(logo, /<BrandMark/);
  assert.doesNotMatch(logo, />Auditor</);
  assert.match(mark, /var\(--ink\)/);
  assert.match(mark, /var\(--accent\)/);
  assert.match(icon, /#181716/);
  assert.match(icon, /#ee9077/);
  assert.equal(icon, read("./app/icon.svg"));
  assert.equal(read("./public/.well-known/agent-card.json"), read("../../.well-known/agent-card.json"));
});
