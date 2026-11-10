import { createHash } from "node:crypto";

const digest = value => createHash("sha256").update(value).digest("hex");
const hex = value => typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
const exact = (value, keys) => value && typeof value === "object" && !Array.isArray(value)
  && Object.keys(value).sort().join() === [...keys].sort().join();
const verdicts = new Set(["identified", "reproduced", "not_reproduced", "inconclusive", "tool_error"]);
const fixtures = { vulnerable: "testVulnerableDonationReproduces", patched: "testPatchedDonationDoesNotReproduce" };

export function validateReceipt(r) {
  if (!exact(r, ["schemaVersion", "fixture", "verdict", "input", "tools", "chain", "evidence", "invariant"])
    || r.schemaVersion !== 1 || !Object.hasOwn(fixtures, r.fixture) || !verdicts.has(r.verdict)) throw new Error("invalid receipt header");
  if (!exact(r.input, ["sourceSha256", "imageId"]) || !hex(r.input.sourceSha256)
    || !/^sha256:[a-f0-9]{64}$/.test(r.input.imageId)) throw new Error("invalid receipt input");
  if (!exact(r.tools, ["forge", "solc", "slither"]) || typeof r.tools.forge !== "string" || !r.tools.forge
    || typeof r.tools.solc !== "string" || !r.tools.solc
    || !(r.tools.slither === null || typeof r.tools.slither === "string")) throw new Error("invalid tool versions");
  if (!exact(r.chain, ["chainId", "forkBlock", "forkBlockHash"]) ||
    !((r.chain.chainId === null && r.chain.forkBlock === null && r.chain.forkBlockHash === null)
      || (Number.isSafeInteger(r.chain.chainId) && r.chain.chainId > 0 && Number.isSafeInteger(r.chain.forkBlock)
        && r.chain.forkBlock >= 0 && /^0x[a-f0-9]{64}$/.test(r.chain.forkBlockHash)))) throw new Error("invalid pinned chain state");
  if (!exact(r.evidence, ["executionLogSha256", "traceSha256", "slitherReportSha256"])
    || !hex(r.evidence.executionLogSha256) || !(r.evidence.traceSha256 === null || hex(r.evidence.traceSha256))
    || !(r.evidence.slitherReportSha256 === null || hex(r.evidence.slitherReportSha256))) throw new Error("invalid evidence hashes");
  if (!exact(r.invariant, ["name", "passed"]) || r.invariant.name !== fixtures[r.fixture]
    || typeof r.invariant.passed !== "boolean") throw new Error("invalid invariant");
  if (r.invariant.passed !== ["reproduced", "not_reproduced"].includes(r.verdict)) throw new Error("verdict contradicts invariant");
  if (r.fixture === "vulnerable" && r.verdict === "not_reproduced"
    || r.fixture === "patched" && r.verdict === "reproduced") throw new Error("verdict contradicts fixture");
  return r;
}

function canonical(value) {
  if (value === null || typeof value === "string" || typeof value === "boolean") return JSON.stringify(value);
  if (typeof value === "number" && Number.isSafeInteger(value)) return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${canonical(value[k])}`).join(",")}}`;
  throw new Error("noncanonical value");
}

export function receiptHash(receipt) {
  validateReceipt(receipt);
  return digest(`VeriPoC receipt v1\n${canonical(receipt)}`);
}

export function publicAnchor(receipt) {
  return { schemaVersion: 1, algorithm: "sha256", receiptSha256: receiptHash(receipt) };
}

export function receiptFromWorker(run) {
  if (!run || !Object.hasOwn(fixtures, run.case) || !verdicts.has(run.status)
    || !hex(run.inputHash) || !/^sha256:[a-f0-9]{64}$/.test(run.imageId)) throw new Error("invalid worker result");
  const executionEvidence = JSON.stringify({ status: run.status, exitCode: run.exitCode ?? null,
    stdout: String(run.output ?? ""), stderr: String(run.errorOutput ?? "") });
  const receipt = { schemaVersion: 1, fixture: run.case, verdict: run.status,
    input: { sourceSha256: run.inputHash, imageId: run.imageId },
    tools: { forge: "1.9.0", solc: "0.8.24", slither: null },
    chain: { chainId: null, forkBlock: null, forkBlockHash: null },
    evidence: { executionLogSha256: digest(executionEvidence), traceSha256: null, slitherReportSha256: null },
    invariant: { name: fixtures[run.case], passed: run.status === "reproduced" || run.status === "not_reproduced" } };
  return validateReceipt(receipt);
}
