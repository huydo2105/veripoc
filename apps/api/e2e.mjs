import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { createApiServer } from "./server.mjs";

const token = randomBytes(32).toString("hex");
const server = createApiServer({ token });
await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${server.address().port}`;
try {
  for (const fixture of ["vulnerable", "patched"]) {
    const accepted = await fetch(`${base}/v1/verify-poc`, { method: "POST", headers: {
      Authorization: `Bearer ${token}`, "Content-Type": "application/json", "Idempotency-Key": randomUUID() },
      body: JSON.stringify({ artifactFormat: "repo-fixture-v1", fixture }) });
    assert.equal(accepted.status, 202);
    const { id } = await accepted.json();
    let job;
    for (let attempt = 0; attempt < 60; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const response = await fetch(`${base}/v1/jobs/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      job = await response.json();
      if (job.state === "finished") break;
    }
    assert.equal(job.state, "finished");
    assert.equal(job.result.status, fixture === "vulnerable" ? "reproduced" : "not_reproduced");
    assert.equal(job.result.receipt?.fixture, fixture);
    assert.match(job.result.anchor?.receiptSha256 ?? "", /^[a-f0-9]{64}$/);
    console.log(`${fixture}: ${job.result.status}; receipt ${job.result.anchor.receiptSha256}`);
  }
} finally {
  await new Promise(resolve => server.close(resolve));
}
