import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = path => readFileSync(new URL(path, import.meta.url), "utf8");

test("Next homepage offers exactly two role cards and no scanner path", () => {
  const home = read("./app/page.tsx");
  const card = read("./components/landing/role-card.tsx");
  assert.match(home, /Find vulnerabilities/);
  assert.match(home, /Verify the evidence/);
  assert.match(home, /What would you like to do/);
  assert.equal((home.match(/<RoleCard role=/g) ?? []).length, 2);
  assert.match(card, /I have a smart contract to audit/);
  assert.match(card, /I want to audit/);
  assert.match(card, /href: "\/teams\/start"/);
  assert.match(card, /href: "\/researchers\/start"/);
  assert.doesNotMatch(home + card, /scanner dashboard|scan contract|type="file"/i);
});

test("both server-rendered role pages explain demo scope and share verifier", () => {
  for (const path of ["./app/teams/start/page.tsx", "./app/researchers/start/page.tsx"]) {
    const page = read(path);
    assert.match(page, /Demo Vault Audit Program|ProgramOverview/);
    assert.match(page, /Issue #35/);
    assert.match(page, /DemoEntry/);
  }
  const entry = read("./components/journeys/demo-entry.tsx");
  assert.match(entry, /href="\/verify"/);
  assert.match(read("./app/teams/start/page.tsx"), /Confidential team inbox planned/);
  assert.match(read("./app/researchers/start/page.tsx"), /no live networks, external targets, or arbitrary uploads/);
});

test("logo is icon-only, accessible, and Agent Card remains byte-identical", () => {
  const logo = read("./components/brand/logo.tsx");
  assert.match(logo, /aria-label="VeriPoC home"/);
  assert.match(logo, /veripoc-mark.svg/);
  assert.doesNotMatch(logo, />VeriPoC</);
  assert.equal(read("./public/.well-known/agent-card.json"), read("../../.well-known/agent-card.json"));
  assert.match(read("./app/layout.tsx"), /veripoc-app-icon.svg/);
});

test("workflow remains static and responsive until Issue #39", () => {
  const workflow = read("./components/landing/workflow-preview.tsx");
  for (const step of ["Authorize", "Investigate", "Verify"]) assert.match(workflow, new RegExp(step));
  assert.match(workflow, /md:grid-cols-3/);
  assert.doesNotMatch(workflow, /useScroll|whileInView|setTimeout/);
  const css = read("./app/globals.css");
  assert.match(css, /#f8f9f7/i);
  assert.match(css, /#276c55/i);
  assert.match(css, /prefers-reduced-motion/);
});
