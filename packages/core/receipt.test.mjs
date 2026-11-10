import test from "node:test";
import assert from "node:assert/strict";
import { receiptFromWorker, receiptHash, publicAnchor, validateReceipt } from "./receipt.mjs";

const run = { case: "vulnerable", status: "reproduced", inputHash: "a".repeat(64),
  imageId: `sha256:${"b".repeat(64)}`, output: "trusted fixture passed" };
test("receipt hash is reproducible and sensitive to evidence", () => {
  const receipt = receiptFromWorker(run);
  assert.equal(receiptHash(receipt), "b08d24938cb93236a17943e75d2a7818ae5ca3e0293344154a58109f42da65bf");
  assert.equal(receiptHash(receipt), receiptHash(JSON.parse(JSON.stringify(receipt))));
  assert.notEqual(receiptHash(receipt), receiptHash(receiptFromWorker({ ...run, output: "different" })));
  assert.equal(publicAnchor(receipt).receiptSha256, receiptHash(receipt));
});
test("public anchor excludes fixture, outcome, trace, and secret fields", () => {
  const anchor = publicAnchor(receiptFromWorker(run));
  assert.deepEqual(Object.keys(anchor).sort(), ["algorithm", "receiptSha256", "schemaVersion"]);
  assert.ok(!JSON.stringify(anchor).includes("vulnerable"));
});
test("rejects secrets, missing provenance, inconsistent verdicts, and unpinned forks", () => {
  const receipt = receiptFromWorker(run);
  assert.throws(() => validateReceipt({ ...receipt, privateKey: "secret" }));
  assert.throws(() => validateReceipt({ ...receipt, input: { ...receipt.input, sourceSha256: null } }));
  assert.throws(() => validateReceipt({ ...receipt, invariant: { ...receipt.invariant, passed: false } }));
  assert.throws(() => validateReceipt({ ...receipt, chain: { chainId: 1, forkBlock: null, forkBlockHash: null } }));
  assert.throws(() => receiptFromWorker({ ...run, inputHash: undefined }));
});
test("patched worker outcome is not reproduced", () => {
  const receipt = receiptFromWorker({ ...run, case: "patched", status: "not_reproduced" });
  assert.equal(receipt.verdict, "not_reproduced");
});
