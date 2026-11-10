import { spawnSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const IMAGE = "veripoc-foundry-worker:issue-5";
export const CASES = Object.freeze({
  vulnerable: { test: "testVulnerableDonationReproduces", verdict: "reproduced" },
  patched: { test: "testPatchedDonationDoesNotReproduce", verdict: "not_reproduced" }
});
const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const inputs = ["foundry.toml", "src/Counter.sol", "contracts/evm/MockAsset.sol",
  "contracts/evm/FixtureVault.sol", "test/Counter.t.sol", "test/VaultFixture.t.sol",
  "test/TrustedVaultWorker.t.sol", "infrastructure/docker/foundry-worker.Dockerfile"];
const sha = data => createHash("sha256").update(data).digest("hex");
export function inputHash() {
  return sha(inputs.map(path => `${path}\0${sha(readFileSync(resolve(root, path)))}\n`).join(""));
}
export function runArgs(imageId, test, containerName = "veripoc-fixture-00000000-0000-0000-0000-000000000000") {
  if (!/^sha256:[a-f0-9]{64}$/.test(imageId)) throw new Error("invalid image ID");
  if (!Object.values(CASES).some(item => item.test === test)) throw new Error("untrusted test name");
  if (!/^veripoc-fixture-[a-f0-9-]+$/.test(containerName)) throw new Error("invalid container name");
  return ["run", "--rm", "--name", containerName, "--init", "--network", "none", "--read-only", "--cap-drop", "ALL",
    "--security-opt", "no-new-privileges", "--pids-limit", "64", "--memory", "512m",
    "--cpus", "1", "--user", "10001:10001", "--tmpfs", "/tmp:rw,noexec,nosuid,size=64m,mode=1777",
    "--tmpfs", "/workspace/out:rw,nosuid,size=128m,mode=1777",
    "--tmpfs", "/workspace/cache:rw,nosuid,size=32m,mode=1777",
    "--env", "FOUNDRY_OUT=/workspace/out", "--env", "FOUNDRY_CACHE_PATH=/workspace/cache",
    "--env", "FOUNDRY_FUZZ_RUNS=1", "--entrypoint", "forge", imageId,
    "test", "--offline", "--match-contract", "TrustedVaultTest", "--match-test", test, "-vvv"];
}
function clean(output) {
  return String(output ?? "").replace(/\x1b\[[0-9;]*m/g, "").replace(/[\x00-\x08\x0b-\x1f\x7f]/g, "")
    .slice(0, 65536);
}
export function classifyRun(caseName, result) {
  const selected = CASES[caseName];
  if (!selected) throw new Error("unknown fixture case");
  const timedOut = result.error?.code === "ETIMEDOUT";
  const aborted = result.error?.code === "ABORT_ERR";
  return { case: caseName, status: timedOut || aborted ? "inconclusive" : result.status === 0 ? selected.verdict : "tool_error",
    reason: timedOut ? "timeout" : aborted ? "aborted" : result.status === 0 ? "trusted invariant passed" : "foundry failed",
    exitCode: result.status, output: clean(result.stdout), errorOutput: clean(result.stderr) };
}
export function runFixture(caseName, { invoke = spawnSync, timeoutMs = 30_000 } = {}) {
  if (!CASES[caseName]) throw new Error("unknown fixture case");
  const inspect = invoke("docker", ["image", "inspect", IMAGE, "--format", "{{.Id}}"],
    { cwd: root, encoding: "utf8", timeout: 5000, maxBuffer: 65536 });
  if (inspect.status !== 0) return classifyRun(caseName, inspect);
  const imageId = String(inspect.stdout).trim();
  const containerName = `veripoc-fixture-${randomUUID()}`;
  const result = invoke("docker", runArgs(imageId, CASES[caseName].test, containerName),
    { cwd: root, encoding: "utf8", timeout: timeoutMs, maxBuffer: 65536 });
  if (result.error?.code === "ETIMEDOUT" || result.error?.code === "ABORT_ERR") {
    const cleanup = invoke("docker", ["kill", containerName],
      { cwd: root, encoding: "utf8", timeout: 5000, maxBuffer: 65536 });
    if (cleanup.status !== 0) return { ...classifyRun(caseName, result), status: "tool_error",
      reason: "container cleanup failed", imageId, inputHash: inputHash() };
  }
  return { ...classifyRun(caseName, result), imageId, inputHash: inputHash() };
}
