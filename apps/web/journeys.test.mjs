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
    assert.match(html, /Verifiable smart-contract security/);
    assert.match(html, /class="path-grid"/);
    assert.equal((html.match(/class="path-card /g) || []).length, 2);
    assert.match(html, /class="path-card team-path" href="\/teams\/start"/);
    assert.match(html, /class="path-card researcher-path" href="\/researchers\/start"/);
    assert.match(html, /I have a smart contract to audit/);
    assert.match(html, /I want to audit/);
    for (const step of ["Authorize", "Investigate", "Verify"]) assert.match(html, new RegExp(`<h3>${step}</h3>`));
    assert.match(html, /Signed request authentication and Testnet receipt anchoring are planned/);
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
      assert.match(html, /fixed|reviewed/i);
      assert.doesNotMatch(html, /<input[^>]*type="file"|href="\/v1\/scan"/i);
    }
    const team = (await page(base, "/teams/start")).html;
    assert.match(team, /confidential findings/i);
    assert.match(team, /Retest a patch/i);
    const researcher = (await page(base, "/researchers/start")).html;
    assert.match(researcher, /Not authorized here/);
    assert.match(researcher, /REST\/MCP access .* planned for Issue #13/);
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
    assert.match(stylesheet, /@media\(max-width:640px\)/);
    assert.match(stylesheet, /prefers-reduced-motion/);
    for (const route of ["/", "/teams/start", "/researchers/start"]) {
      const { html } = await page(base, route);
      assert.match(html, /name="viewport"/);
      assert.match(html, /class="skip-link"/);
      assert.match(html, /<h1\b/);
    }
    assert.equal((await fetch(`${base}/programs/create`)).status, 404);
    assert.equal((await fetch(`${base}/v1/jobs/00000000-0000-0000-0000-000000000000`)).status, 401);
  });
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
