import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createApiServer } from "./server.mjs";

const token = "test-token-with-at-least-thirty-two-characters";
async function withServer(fn, options = {}) {
  const server = createApiServer({ token, ...options });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  try { await fn(`http://127.0.0.1:${server.address().port}`); }
  finally { await new Promise(resolve => server.close(resolve)); }
}
async function call(base, path, body, key = randomUUID(), auth = token) {
  const response = await fetch(base + path, { method: "POST", headers: {
    Authorization: `Bearer ${auth}`, "Content-Type": "application/json", "Idempotency-Key": key }, body: JSON.stringify(body) });
  return { status: response.status, data: await response.json() };
}
const body = fixture => ({ artifactFormat: "repo-fixture-v1", fixture });
test("authenticated positive and negative jobs expose executor outcomes", async () => {
  await withServer(async base => {
    for (const fixture of ["vulnerable", "patched"]) {
      const posted = await call(base, "/v1/verify-poc", body(fixture));
      assert.equal(posted.status, 202);
      let job;
      for (let i = 0; i < 20; i++) {
        const response = await fetch(`${base}/v1/jobs/${posted.data.id}`, { headers: { Authorization: `Bearer ${token}` } });
        job = await response.json();
        if (job.state === "finished") break;
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      assert.equal(job.result.status, fixture === "vulnerable" ? "reproduced" : "not_reproduced");
    }
  }, { execute: async (_kind, request) => ({ status: request.fixture === "vulnerable" ? "reproduced" : "not_reproduced" }) });
});
test("auth, artifact allowlist, idempotency and missing jobs fail closed", async () => {
  await withServer(async base => {
    assert.equal((await call(base, "/v1/verify-poc", body("vulnerable"), randomUUID(), "wrong")).status, 401);
    assert.equal((await call(base, "/v1/verify-poc", { ...body("vulnerable"), source: "evil" })).status, 400);
    const key = randomUUID();
    const first = await call(base, "/v1/verify-poc", body("vulnerable"), key);
    assert.equal((await call(base, "/v1/verify-poc", body("vulnerable"), key)).data.id, first.data.id);
    assert.equal((await call(base, "/v1/verify-poc", body("patched"), key)).status, 409);
    const missing = await fetch(`${base}/v1/jobs/${randomUUID()}`, { headers: { Authorization: `Bearer ${token}` } });
    assert.equal(missing.status, 404);
  }, { execute: async () => ({ status: "tool_error" }) });
});
test("request size and POST rate are bounded", async () => {
  await withServer(async base => {
    const oversized = await call(base, "/v1/verify-poc", { ...body("patched"), padding: "x".repeat(5000) });
    assert.equal(oversized.status, 413);
    for (let i = 0; i < 4; i++) await call(base, "/v1/verify-poc", body("patched"));
    assert.equal((await call(base, "/v1/verify-poc", body("patched"))).status, 429);
  }, { execute: async () => ({ status: "not_reproduced" }) });
});

test("scan route accepts only the reviewed target", async () => {
  await withServer(async base => {
    assert.equal((await call(base, "/v1/scan", { artifactFormat: "repo-fixture-v1", target: "other" })).status, 400);
    const posted = await call(base, "/v1/scan", { artifactFormat: "repo-fixture-v1", target: "local-vaults" });
    assert.equal(posted.status, 202);
    let job;
    for (let i = 0; i < 20; i++) {
      const response = await fetch(`${base}/v1/jobs/${posted.data.id}`, { headers: { Authorization: `Bearer ${token}` } });
      job = await response.json();
      if (job.state === "finished") break;
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    assert.equal(job.kind, "scan");
    assert.equal(job.result.status, "analyzed_no_findings");
  }, { execute: async () => ({ status: "analyzed_no_findings", report: { findings: [] } }) });
});
