import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = path => readFileSync(new URL(path, import.meta.url), "utf8");

test("Next homepage offers exactly two role cards and no scanner path", () => {
  const home = read("./app/page.tsx");
  const card = read("./components/landing/role-card.tsx");
  assert.match(home, /Find vulnerabilities/);
  assert.match(home, /Verify the evidence/);
  assert.equal((home.match(/<RoleCard role=/g) ?? []).length, 2);
  assert.match(card, /I have a smart contract to audit/);
  assert.match(card, /I want to audit/);
  assert.match(card, /href: "\/teams\/start"/);
  assert.match(card, /href: "\/researchers\/start"/);
  assert.doesNotMatch(home + card, /scanner dashboard|scan contract|type="file"/i);
});

test("both server-rendered role pages link to the same fixture verifier", () => {
  assert.match(read("./app/teams/start/page.tsx"), /<RoleJourney role="team"/);
  assert.match(read("./app/researchers/start/page.tsx"), /<RoleJourney role="researcher"/);
  const journey = read("./components/journeys/role-journey.tsx");
  assert.match(journey, /reviewed local vault fixtures/);
  assert.match(journey, /href="\/verify"/);
  assert.match(journey, /Program permissions and the findings inbox are planned/);
});

test("logo is icon-only, accessible, and Agent Card remains byte-identical", () => {
  const logo = read("./components/brand/logo.tsx");
  assert.match(logo, /aria-label="VeriPoC home"/);
  assert.match(logo, /veripoc-mark.svg/);
  assert.doesNotMatch(logo, />VeriPoC</);
  assert.equal(read("./public/.well-known/agent-card.json"), read("../../.well-known/agent-card.json"));
  assert.match(read("./app/layout.tsx"), /veripoc-app-icon.svg/);
});

test("workflow links to live verification and identifies example outcomes", () => {
  const workflow = read("./components/landing/workflow-preview.tsx");
  for (const step of ["Authorize", "Investigate", "Verify"]) assert.match(workflow, new RegExp(step));
  assert.match(workflow, /Illustrative example/);
  assert.match(workflow, /href="\/verify"/);
  const css = read("./app/globals.css");
  assert.match(css, /#f8f9f7/i);
  assert.match(css, /#276c55/i);
  assert.match(css, /prefers-reduced-motion/);
});
