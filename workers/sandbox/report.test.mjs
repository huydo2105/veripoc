import test from "node:test";
import assert from "node:assert/strict";
import { prepareWorkerReports } from "./report.mjs";

test("missing provenance preserves both results and fails closed for only that receipt", () => {
  const failed = { case: "vulnerable", status: "tool_error", output: "", errorOutput: "image missing", exitCode: 1 };
  const patched = { case: "patched", status: "not_reproduced", inputHash: "a".repeat(64),
    imageId: `sha256:${"b".repeat(64)}`, output: "passed", errorOutput: "", exitCode: 0 };
  const reports = prepareWorkerReports([failed, patched]);
  assert.equal(reports.length, 2);
  assert.equal(reports[0].result.status, "tool_error");
  assert.equal(reports[0].receipt, null);
  assert.ok(reports[0].receiptError);
  assert.equal(reports[1].receipt.verdict, "not_reproduced");
  assert.ok(reports[1].anchor.receiptSha256);
});
