#!/usr/bin/env node
import { runFixture } from "./runner.mjs";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { receiptFromWorker, publicAnchor } from "../../packages/core/receipt.mjs";

const results = [runFixture("vulnerable"), runFixture("patched")];
const artifacts = resolve(dirname(fileURLToPath(import.meta.url)), "../../artifacts");
mkdirSync(artifacts, { recursive: true });
for (const result of results) {
  console.log(JSON.stringify(result));
  const receipt = receiptFromWorker(result);
  writeFileSync(resolve(artifacts, `${result.case}-receipt.private.json`), `${JSON.stringify(receipt, null, 2)}\n`, { mode: 0o600 });
  writeFileSync(resolve(artifacts, `${result.case}-anchor.public.json`), `${JSON.stringify(publicAnchor(receipt), null, 2)}\n`);
}
if (results[0].status !== "reproduced" || results[1].status !== "not_reproduced") process.exitCode = 1;
