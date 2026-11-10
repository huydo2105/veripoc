import { parentPort, workerData } from "node:worker_threads";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runFixture } from "../../workers/sandbox/runner.mjs";
import { receiptFromWorker, publicAnchor } from "../../packages/core/receipt.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
try {
  if (workerData.kind === "verify") {
    const run = runFixture(workerData.body.fixture);
    let receipt = null;
    let anchor = null;
    try { receipt = receiptFromWorker(run); anchor = publicAnchor(receipt); } catch { /* missing provenance */ }
    parentPort.postMessage({ ok: true, value: { status: run.status, reason: run.reason,
      fixture: run.case, exitCode: run.exitCode ?? null, output: run.output,
      errorOutput: run.errorOutput, imageId: run.imageId ?? null,
      inputHash: run.inputHash ?? null, financialEvidence: run.financialEvidence ?? null, receipt, anchor } });
  } else if (workerData.kind === "scan") {
    const run = spawnSync(process.execPath, [resolve(root, "packages/slither-adapter/cli.mjs")],
      { cwd: root, encoding: "utf8", timeout: 130_000, maxBuffer: 65536 });
    if (run.status !== 0) {
      parentPort.postMessage({ ok: true, value: { status: "tool_error", reason: run.error?.code === "ETIMEDOUT"
        ? "Slither timed out" : "Slither scan failed; inspect private worker logs" } });
    } else {
      const report = JSON.parse(readFileSync(resolve(root, "artifacts/normalized-slither.json"), "utf8"));
      parentPort.postMessage({ ok: true, value: { status: report.findings.length ? "identified" : "analyzed_no_findings", report } });
    }
  } else throw new Error("unknown job kind");
} catch (error) {
  parentPort.postMessage({ ok: false, error: String(error.message) });
}
