#!/usr/bin/env node
import { runFixture } from "./runner.mjs";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { prepareWorkerReports } from "./report.mjs";

const results = [runFixture("vulnerable"), runFixture("patched")];
const artifacts = resolve(dirname(fileURLToPath(import.meta.url)), "../../artifacts");
mkdirSync(artifacts, { recursive: true });
const reports = prepareWorkerReports(results);
for (const report of reports) {
  console.log(JSON.stringify(report.result));
  if (report.receiptError) {
    console.error(JSON.stringify({ case: report.result.case, receiptStatus: "unavailable", reason: report.receiptError }));
    continue;
  }
  writeFileSync(resolve(artifacts, `${report.result.case}-receipt.private.json`), `${JSON.stringify(report.receipt, null, 2)}\n`, { mode: 0o600 });
  writeFileSync(resolve(artifacts, `${report.result.case}-anchor.public.json`), `${JSON.stringify(report.anchor, null, 2)}\n`);
}
if (reports.some(report => report.receiptError) || results[0].status !== "reproduced"
  || results[1].status !== "not_reproduced") process.exitCode = 1;
