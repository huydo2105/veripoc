import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = path => readFileSync(new URL(path, import.meta.url), "utf8");

test("homepage explains the shared product and has one Get started entry", () => {
  const home = read("./app/page.tsx");
  const card = read("./components/landing/role-card.tsx");
  assert.match(home, /Security claims need/);
  assert.match(home, /href="\/get-started"/);
  assert.equal((home.match(/<RoleCard role=/g) ?? []).length, 2);
  assert.match(card, /I have a project to audit/);
  assert.match(card, /I want to audit/);
  assert.doesNotMatch(home + card, /Explore workflow|scanner dashboard|scan contract|type="file"/i);
});

test("both role routes use the same verifier and only the vault listing is actionable", () => {
  assert.match(read("./app/teams/start/page.tsx"), /<RoleJourney role="team"/);
  assert.match(read("./app/researchers/start/page.tsx"), /<RoleJourney role="researcher"/);
  assert.match(read("./app/get-started/page.tsx"), /<RoleJourney role="researcher"/);
  const journey = read("./components/journeys/role-journey.tsx");
  assert.match(journey, /href="\/verify"/);
  assert.match(journey, /Runnable local demo/);
  assert.match(journey, /Preview · unavailable/);
  assert.match(journey, /not authorized targets/);
  assert.match(journey, /Issue #35/);
});

test("team can preview an unsaved project draft without publishing it", () => {
  const draft = read("./components/journeys/program-draft.tsx");
  assert.match(read("./app/teams/new/page.tsx"), /ProgramDraft/);
  assert.match(draft, /Nothing here is saved, published, sent to the verifier/);
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
