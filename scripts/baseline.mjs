#!/usr/bin/env node
/**
 * Minimal local orchestration for Issue #2.
 * Runs a trusted in-repository Foundry smoke test followed by Slither analysis.
 * Does not accept arbitrary source paths or execute downloaded PoCs.
 */
import { spawnSync } from "node:child_process";

function run(command, args) {
  process.stdout.write(`\n> ${command} ${args.join(" ")}\n`);
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    stdio: "inherit",
    shell: process.platform === "win32"
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${command} failed with exit code ${result.status}`);
  }
}
run("forge", ["build"]);
run("forge", ["test", "-vvv"]);
if (process.platform === "win32") {
  throw new Error("Run the Slither baseline in WSL2 (bash), not native Windows.");
}
run("bash", ["scripts/run-slither.sh"]);
console.log("\nBaseline build, tests and static analysis completed.");
