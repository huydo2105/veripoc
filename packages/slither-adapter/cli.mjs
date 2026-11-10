#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { normalizeSlither, classifyFailure } from "./index.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const output = resolve(root, "artifacts/normalized-slither.json");
const sha = data => createHash("sha256").update(data).digest("hex");
const paths = ["foundry.toml", "src/Counter.sol", "test/Counter.t.sol",
  "contracts/evm/MockAsset.sol", "contracts/evm/FixtureVault.sol", "test/VaultFixture.t.sol"];
const sourceHash = sha(paths.map(path => `${path}\0${sha(readFileSync(resolve(root, path)))}\n`).join(""));
let result;
const run = spawnSync("bash", ["scripts/run-slither.sh"], {
  cwd: root, encoding: "utf8", timeout: 120_000, maxBuffer: 8 * 1024 * 1024,
  env: { ...process.env, PYTHONUNBUFFERED: "1" }
});
if (run.status !== 0 || run.error) {
  result = classifyFailure({ timedOut: run.error?.code === "ETIMEDOUT", stderr: run.stderr,
    exitCode: run.status });
} else {
  try {
    const version = execFileSync("slither", ["--version"], { encoding: "utf8", timeout: 5000 }).trim();
    result = normalizeSlither(JSON.parse(readFileSync(resolve(root, "artifacts/slither.json"), "utf8")),
      { version, sourceHash, callGraph: readFileSync(resolve(root, "artifacts/call-graph.dot"), "utf8") });
  } catch (error) {
    result = classifyFailure({ stderr: String(error), exitCode: run.status });
  }
}
writeFileSync(output, `${JSON.stringify(result, null, 2)}\n`);
console.log(`${result.status}: ${output}`);
if (result.status !== "analyzed") process.exitCode = 1;
