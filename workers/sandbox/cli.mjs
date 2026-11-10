#!/usr/bin/env node
import { runFixture } from "./runner.mjs";

const results = [runFixture("vulnerable"), runFixture("patched")];
for (const result of results) console.log(JSON.stringify(result));
if (results[0].status !== "reproduced" || results[1].status !== "not_reproduced") process.exitCode = 1;
