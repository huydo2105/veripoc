import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const hash = value => createHash("sha256").update(value).digest("hex");
const digest = path => hash(readFileSync(new URL(path, import.meta.url)));
const workerFiles = ["foundry.toml", "src/Counter.sol", "contracts/evm/MockAsset.sol",
  "contracts/evm/FixtureVault.sol", "test/Counter.t.sol", "test/VaultFixture.t.sol", "test/TrustedVaultWorker.t.sol"];

// These bytes are the reviewed local fixture. Fail closed if either changes.
export const DEMO_PROGRAM = Object.freeze({
  id: "demo-vault",
  name: "Demo Vault Audit Program",
  ownerId: "demo-team",
  invitedResearcherIds: ["demo-researcher"],
  status: "active",
  confidentiality: "members-only",
  runLimit: 4,
  target: "contracts/evm/FixtureVault.sol",
  targetSha256: "0151b8d3c7e0dfa8cb1851f4663761e06c4e676c50df31b0acd1baf4acfa1eb1",
  oracle: "test/TrustedVaultWorker.t.sol",
  oracleSha256: "337e97250e8b011dd147164f55cf6c9e3a1247ae74d1b99b9fa6613eb2642d79",
  // Dockerfile input.sha256: SHA-256 of its ordered sha256sum manifest.
  workerInputSha256: "3ce6e777e225148970bf679dfa821ec56c6aa845e2861ff61cbfaed6d2b828e9",
  allowedFixtures: ["vulnerable", "patched"],
  rules: ["Reviewed local EVM fixtures only", "No deployed or external targets", "No arbitrary code or PoC uploads", "Private results for program members only"],
  authorization: "Auditor-owned synthetic fixture; local demonstration only",
});

export function fixtureRevisionMatches() {
  try { return digest("../../contracts/evm/FixtureVault.sol") === DEMO_PROGRAM.targetSha256
    && digest("../../test/TrustedVaultWorker.t.sol") === DEMO_PROGRAM.oracleSha256
    && hash(workerFiles.map(path => `${digest(`../../${path}`)}  ${path}\n`).join("")) === DEMO_PROGRAM.workerInputSha256; }
  catch { return false; }
}

export function publicProgram(runsUsed) {
  return { ...DEMO_PROGRAM, runsUsed };
}
