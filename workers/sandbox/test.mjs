import test from "node:test";
import assert from "node:assert/strict";
import { runArgs, manifestArgs, classifyRun, runFixture, CASES } from "./runner.mjs";

const id = `sha256:${"a".repeat(64)}`;
test("fixed cases have distinct honest verdicts", () => {
  assert.equal(classifyRun("vulnerable", { status: 0 }).status, "reproduced");
  assert.equal(classifyRun("patched", { status: 0 }).status, "not_reproduced");
  assert.equal(classifyRun("patched", { status: 1 }).status, "tool_error");
});
test("Docker arguments enforce isolation and fixed harness", () => {
  const args = runArgs(id, CASES.vulnerable.test);
  for (const flag of ["none", "--read-only", "ALL", "no-new-privileges", "--pids-limit",
    "--memory", "--cpus", "10001:10001", "--offline"]) assert.ok(args.includes(flag));
  assert.ok(!args.join(" ").includes("docker.sock"));
  assert.throws(() => runArgs(id, "arbitrary"));
  assert.throws(() => runArgs("untrusted:latest", CASES.vulnerable.test));
  assert.ok(manifestArgs(id).includes("/workspace/input.sha256"));
});
test("timeout is inconclusive and strips control characters", () => {
  const result = classifyRun("vulnerable", { status: null, error: { code: "ETIMEDOUT" }, stdout: "\x1b[31mbad\x1b[0m\x00" });
  assert.equal(result.status, "inconclusive");
  assert.equal(result.output, "bad");
  assert.equal(classifyRun("patched", { status: null, error: { code: "ABORT_ERR" } }).reason, "aborted");
});
test("abort and missing image never become a reproduced verdict", () => {
  const missing = runFixture("vulnerable", { invoke: () => ({ status: 1, stderr: "image missing" }) });
  assert.equal(missing.status, "tool_error");
  assert.throws(() => runFixture("custom"));
});
test("timed-out Docker run triggers container kill", () => {
  const calls = [];
  const invoke = (_command, args) => {
    calls.push(args);
    if (args[0] === "image") return { status: 0, stdout: id };
    if (args.includes("/workspace/input.sha256")) return { status: 0, stdout: "b".repeat(64) };
    if (args[0] === "run") return { status: null, error: { code: "ETIMEDOUT" } };
    return { status: 0 };
  };
  assert.equal(runFixture("vulnerable", { invoke }).status, "inconclusive");
  assert.equal(calls[3][0], "kill");
  assert.equal(calls[3][1], calls[2][calls[2].indexOf("--name") + 1]);
});
test("reported hash comes from the inspected image, never host checkout", () => {
  const baked = "c".repeat(64);
  const invoke = (_command, args) => args[0] === "image" ? { status: 0, stdout: id }
    : args.includes("/workspace/input.sha256") ? { status: 0, stdout: baked }
    : { status: 0, stdout: "[PASS]" };
  const result = runFixture("patched", { invoke });
  assert.equal(result.status, "not_reproduced");
  assert.equal(result.inputHash, baked);
});
