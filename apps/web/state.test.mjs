import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { FIXTURES, parseAcceptance, parseJob, stageStates, financialEvidence, receiptDigest, apiError } from "./state.mjs";

const id = "11111111-1111-4111-8111-111111111111";
const fixture = "vulnerable";
const base = (state, result = null) => ({ id, kind: "verify", fixture, state, result });
const success = { status: "reproduced", receipt: { invariant: { passed: true } }, anchor: { receiptSha256: "a".repeat(64) } };

test("job state and fixture must match the requested verification", () => {
  assert.equal(parseAcceptance({ id, state: "finished" }).state, "finished");
  assert.throws(() => parseAcceptance({ id: "../bad", state: "queued" }));
  assert.equal(parseJob(base("queued"), id, fixture).state, "queued");
  assert.equal(parseJob(base("finished", success), id, fixture).result.status, "reproduced");
  assert.throws(() => parseJob({ ...base("finished", success), kind: "scan" }, id, fixture));
  assert.throws(() => parseJob({ ...base("finished", success), fixture: "patched" }, id, fixture));
  assert.throws(() => parseJob(base("finished", { status: "identified" }), id, fixture));
  assert.throws(() => parseJob(base("running", success), id, fixture));
});

test("progress derives only from backend state and available evidence", () => {
  assert.deepEqual(stageStates(null), ["pending", "pending", "pending", "pending"]);
  assert.deepEqual(stageStates(base("queued")), ["done", "pending", "pending", "pending"]);
  assert.deepEqual(stageStates(base("running")), ["done", "active", "pending", "pending"]);
  assert.deepEqual(stageStates(base("finished", success)), ["done", "done", "done", "done"]);
  assert.deepEqual(stageStates(base("finished", { status: "tool_error", receipt: null, anchor: null })),
    ["done", "failed", "unavailable", "unavailable"]);
  assert.deepEqual(stageStates(base("finished", { status: "inconclusive", receipt: null, anchor: null })),
    ["done", "done", "unavailable", "unavailable"]);
});

test("financial values and receipt digests never come from expected fixture text", () => {
  assert.match(FIXTURES.vulnerable.expected, /201/);
  assert.equal(financialEvidence(success), null);
  assert.equal(financialEvidence({ ...success, financialEvidence: { attackerBefore: 101, attackerAfter: 201, victimShares: 0 } }), null);
  const measured = { ...success, financialEvidence: { attackerBefore: "101", attackerAfter: "201", victimShares: "0" } };
  assert.deepEqual(financialEvidence(measured),
    { attackerBefore: "101", attackerAfter: "201", victimShares: "0" });
  assert.equal(financialEvidence({ ...measured, status: "tool_error" }), null);
  assert.equal(receiptDigest(success), "a".repeat(64));
  assert.equal(receiptDigest({ anchor: success.anchor }), null);
  assert.equal(receiptDigest({ receipt: success.receipt, anchor: { receiptSha256: "fake" } }), null);
});

test("errors guide retry without claiming an exploit verdict", () => {
  assert.match(apiError(401), /token rejected/i);
  assert.match(apiError(429), /rate limit/i);
  assert.match(apiError(503), /capacity/i);
});

test("judge page exposes only the PoC operation and keeps Agent Card read-only", () => {
  const html = readFileSync(new URL("./index.html", import.meta.url), "utf8");
  const app = readFileSync(new URL("./app.js", import.meta.url), "utf8");
  assert.match(html, /Verify a<br><em>Vulnerability Claim<\/em>/);
  assert.match(html, /Verify PoC/);
  assert.doesNotMatch(html + app, /\/v1\/scan|Run Slither scan|scanner dashboard/i);
  assert.match(app, /\/v1\/verify-poc/);
  assert.match(html, /on-chain anchor exists/);
});
