import test from "node:test";
import assert from "node:assert/strict";
import { normalizeSlither, parseCallGraph, classifyFailure } from "./index.mjs";

const provenance = { version: "0.11.6", sourceHash: "a".repeat(64) };
const location = { filename_relative: "contracts/evm/FixtureVault.sol", lines: [45, 46], start: 120, length: 24 };
const detector = { check: "divide-before-multiply", impact: "Medium", confidence: "High",
  description: "synthetic static finding", elements: [{ source_mapping: location }] };
test("normalizes and deduplicates with stable source-based IDs", () => {
  const input = { success: true, results: { detectors: [detector, { ...detector, id: "different" }] } };
  const result = normalizeSlither(input, { ...provenance, callGraph: '"A" -> "B";\n' });
  assert.equal(result.findings.length, 1);
  assert.equal(result.findings[0].primaryLocation.startLine, 45);
  assert.equal(result.findings[0].severity, "Medium");
  assert.deepEqual(result.callGraph.edges, [{ from: "A", to: "B" }]);
  assert.equal(result.findings[0].findingId, normalizeSlither(input, provenance).findings[0].findingId);
});
test("empty successful result is not an error", () => {
  assert.deepEqual(normalizeSlither({ success: true, results: { detectors: [] } }, provenance).findings, []);
});
test("rejects failed and malformed reports", () => {
  assert.throws(() => normalizeSlither({ success: false }, provenance));
  assert.throws(() => normalizeSlither({ success: true, results: {} }, provenance));
  assert.throws(() => normalizeSlither({ success: true, results: { detectors: [] } }, { ...provenance, sourceHash: "x" }));
});
test("classifies compile failures and timeouts without inventing findings", () => {
  assert.equal(classifyFailure({ stderr: "solc compilation failed", exitCode: 2 }).error.code, "compile_error");
  assert.equal(classifyFailure({ timedOut: true }).error.code, "timeout");
});
test("call graph rejects invalid input and deduplicates edges", () => {
  assert.throws(() => parseCallGraph(null));
  assert.deepEqual(parseCallGraph('"1_deposit(uint256)" -> "2_transferFrom(address,address,uint256)"\n"1_deposit(uint256)" -> "2_transferFrom(address,address,uint256)"'),
    [{ from: "1_deposit(uint256)", to: "2_transferFrom(address,address,uint256)" }]);
});
