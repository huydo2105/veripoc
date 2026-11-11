import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createApiServer } from "../api/server.mjs";

const token = "test-token-with-at-least-thirty-two-characters";
async function withServer(fn) {
  const server = createApiServer({ token, execute: async () => ({ status: "tool_error" }) });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  try { await fn(`http://127.0.0.1:${server.address().port}`); }
  finally { await new Promise(resolve => server.close(resolve)); }
}
async function page(base, path) {
  const response = await fetch(base + path);
  return { response, html: await response.text() };
}

test("homepage offers exactly two equal role entries with correct destinations", async () => {
  await withServer(async base => {
    const { response, html } = await page(base, "/");
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type"), /text\/html/);
    assert.match(html, /Find vulnerabilities\.<br><span>Verify the evidence\.<\/span>/);
    assert.match(html, /What would you like to do\?/);
    assert.match(html, /class="choice-grid"/);
    assert.equal((html.match(/<a class="choice-card"/g) || []).length, 2);
    assert.match(html, /<a class="choice-card" href="\/teams\/start">[\s\S]*?Audit my contract/);
    assert.match(html, /<a class="choice-card" href="\/researchers\/start">[\s\S]*?Find vulnerabilities/);
    assert.match(html, /I have a smart contract to audit/);
    assert.match(html, /I want to audit/);
    for (const route of ["#how-it-works", "/teams/start", "/researchers/start", "/verify"])
      assert.match(html, new RegExp(`href="${route}"`));
    for (const step of ["Authorize", "Investigate", "Verify"]) assert.match(html, new RegExp(`<h3>${step}</h3>`));
    assert.match(html, /Signed requests and Testnet receipt anchoring are planned/);
    assert.match(html, /Exploring the demo requires no account or wallet/);
    assert.doesNotMatch(html, /<input[^>]*type="file"|scan contract|security score/i);
  });
});

test("both role routes explain scope and lead to the same existing console", async () => {
  await withServer(async base => {
    for (const route of ["/teams/start", "/researchers/start"]) {
      const { response, html } = await page(base, route);
      assert.equal(response.status, 200);
      assert.match(html, /<main id="main"/);
      assert.match(html, /Demo Vault Audit Program/);
      assert.match(html, /Issue #35/);
      assert.match(html, /href="\/verify"/);
      assert.match(html, /href="\/"/);
      assert.match(html, /Demo only/);
      assert.match(html, /fixed|reviewed/i);
      assert.doesNotMatch(html, /<input[^>]*type="file"|href="\/v1\/scan"/i);
    }
    const team = (await page(base, "/teams/start")).html;
    assert.match(team, /Confidential team inbox planned for Issue #36/);
    assert.match(team, /Retest a patch/i);
    assert.match(team, /href="\/researchers\/start"/);
    const researcher = (await page(base, "/researchers/start")).html;
    assert.match(researcher, /no live networks, external targets, or arbitrary uploads/);
    assert.match(researcher, /REST\/MCP access for external agents is planned in Issue #13/);
    assert.match(researcher, /href="\/teams\/start"/);
    const consolePage = await page(base, "/verify");
    assert.equal(consolePage.response.status, 200);
    assert.match(consolePage.html, /id="verify-button"/);
    assert.match(consolePage.html, /id="token"/);
    assert.match(consolePage.html, /href="\/" aria-label="VeriPoC home"/);
  });
});

test("assets, accessibility hooks, responsive styles, and unknown routes", async () => {
  await withServer(async base => {
    const css = await fetch(`${base}/journey.css`);
    assert.equal(css.status, 200);
    assert.match(css.headers.get("content-type"), /text\/css/);
    const stylesheet = await css.text();
    assert.match(stylesheet, /:focus-visible/);
    assert.match(stylesheet, /@media \(max-width: 620px\)/);
    assert.match(stylesheet, /@media \(max-width: 360px\)/);
    assert.match(stylesheet, /\.choice-grid, \.process-grid, \.provenance, \.fact-grid, \.compact-steps \{ grid-template-columns: 1fr; \}/);
    assert.match(stylesheet, /prefers-reduced-motion/);
    for (const color of ["#f8f9f7", "#ffffff", "#171f1b", "#68716c", "#276c55", "#e0e5e0"])
      assert.match(stylesheet, new RegExp(color, "i"));
    for (const route of ["/", "/teams/start", "/researchers/start"]) {
      const { html } = await page(base, route);
      assert.match(html, /name="viewport"/);
      assert.match(html, /class="skip-link"/);
      assert.match(html, /<h1\b/);
      assert.match(html, /<nav class="site-nav" aria-label="Main navigation">/);
      assert.doesNotMatch(html, /<input[^>]*type="file"|Connect wallet|scan contract/i);
    }
    assert.equal((await fetch(`${base}/programs/create`)).status, 404);
    assert.equal((await fetch(`${base}/v1/jobs/00000000-0000-0000-0000-000000000000`)).status, 401);
  });
});

test("core text colors meet normal-text contrast against their surfaces", () => {
  const luminance = hex => {
    const channels = hex.match(/[\da-f]{2}/gi).map(value => parseInt(value, 16) / 255);
    const linear = channels.map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
    return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
  };
  const ratio = (first, second) => {
    const values = [luminance(first), luminance(second)].sort((a, b) => b - a);
    return (values[0] + 0.05) / (values[1] + 0.05);
  };
  for (const [text, background] of [
    ["171f1b", "f8f9f7"], ["68716c", "ffffff"], ["276c55", "ffffff"],
    ["4f5d55", "f8f9f7"], ["526058", "ffffff"], ["ffffff", "276c55"]
  ]) assert.ok(ratio(text, background) >= 4.5, `${text} on ${background} needs 4.5:1 contrast`);
});

test("published Agent Card bytes and verification contract stay available", async () => {
  await withServer(async base => {
    const card = await fetch(`${base}/.well-known/agent-card.json`);
    assert.equal(await card.text(), readFileSync(new URL("../../.well-known/agent-card.json", import.meta.url), "utf8"));
    const invalid = await fetch(`${base}/v1/verify-poc`, { method: "POST", headers: {
      Authorization: `Bearer ${token}`, "Content-Type": "application/json", "Idempotency-Key": "issue34negative"
    }, body: JSON.stringify({ artifactFormat: "repo-fixture-v1", fixture: "external" }) });
    assert.equal(invalid.status, 400);
  });
});
