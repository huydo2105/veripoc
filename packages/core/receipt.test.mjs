import test from "node:test";
import assert from "node:assert/strict";
import { receiptFromWorker, receiptHash, publicAnchor, validateReceipt } from "./receipt.mjs";

const run = { case: "vulnerable", status: "reproduced", inputHash: "a".repeat(64),
  imageId: `sha256:${"b".repeat(64)}`, output: "trusted fixture passed" };
test("receipt hash is reproducible and sensitive to evidence", () => {
  const receipt = receiptFromWorker(run);
  assert.equal(receiptHash(receipt), "1bf26e54d392ca788f010ca8123eeb7432e9b12ee49af848aea290527f872e0e");
  assert.equal(receiptHash(receipt), receiptHash(JSON.parse(JSON.stringify(receipt))));
  assert.notEqual(receiptHash(receipt), receiptHash(receiptFromWorker({ ...run, output: "different" })));
  assert.notEqual(receiptHash(receipt), receiptHash(receiptFromWorker({ ...run, errorOutput: "compile error" })));
  assert.notEqual(receiptHash(receipt), receiptHash(receiptFromWorker({ ...run, exitCode: 2 })));
  assert.equal(publicAnchor(receipt).receiptSha256, receiptHash(receipt));
});
test("distinct tool errors commit their stderr and exit code", () => {
  const failed = { ...run, status: "tool_error", output: "", errorOutput: "compiler A", exitCode: 1 };
  const first = receiptFromWorker(failed);
  const second = receiptFromWorker({ ...failed, errorOutput: "compiler B" });
  const third = receiptFromWorker({ ...failed, exitCode: 2 });
  assert.notEqual(publicAnchor(first).receiptSha256, publicAnchor(second).receiptSha256);
  assert.notEqual(publicAnchor(first).receiptSha256, publicAnchor(third).receiptSha256);
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
