import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = path => readFileSync(new URL(path, import.meta.url), "utf8");

test("homepage has a centered product entry and vertical three-step story", () => {
  const home = read("./app/page.tsx");
  assert.match(home, /Find the vulnerability/);
  assert.match(home, /href="\/get-started"/);
  assert.match(home, /Authorize/);
  assert.match(home, /Investigate/);
  assert.match(home, /Verify/);
  assert.doesNotMatch(home, /Choose your path|Two perspectives|Explore workflow|scanner dashboard|scan contract|type="file"/i);
});

test("opportunities list all entries and only the reviewed vault opens a detail route", () => {
  assert.match(read("./app/get-started/page.tsx"), /OpportunityList/);
  assert.match(read("./app/opportunities/demo-vault/page.tsx"), /<RoleJourney role="researcher"/);
  const list = read("./components/opportunities/opportunity-list.tsx");
  assert.match(list, /href="\/opportunities\/demo-vault"/);
  assert.match(list, /Runnable local demo/);
  assert.match(list, /Preview · unavailable/);
  assert.match(list, /No bounty offered/);
  assert.doesNotMatch(list, /href="\/verify"|type="file"/);
});

test("both role routes use the same verifier and label authorization limits", () => {
  assert.match(read("./app/teams/start/page.tsx"), /<RoleJourney role="team"/);
  assert.match(read("./app/researchers/start/page.tsx"), /<RoleJourney role="researcher"/);
  const journey = read("./components/journeys/role-journey.tsx");
  assert.match(journey, /href="\/verify"/);
  assert.match(journey, /Runnable local demo/);
  assert.match(journey, /no external invitation/);
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
