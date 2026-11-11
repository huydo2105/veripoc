import test from "node:test";
import assert from "node:assert/strict";
import { createApiServer } from "../../api/server.mjs";
import { GET, POST } from "../app/v1/[...segments]/route";

const token = "test-token-with-at-least-thirty-two-characters";
const context = (...segments: string[]) => ({ params: Promise.resolve({ segments }) });

test("same-origin proxy forwards only allowed verification requests and backend auth", async () => {
  // The existing JavaScript API infers its options from a default empty object.
  // @ts-expect-error token is required and validated by createApiServer at runtime.
  const server = createApiServer({ token, execute: async () => ({ status: "tool_error", reason: "test executor" }) });
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const oldOrigin = process.env.VERIPOC_API_ORIGIN;
  process.env.VERIPOC_API_ORIGIN = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
  try {
    const request = (fixture: string, auth = token, key = "proxytestkey") => new Request("http://localhost:3000/v1/verify-poc", {
      method: "POST", headers: { authorization: `Bearer ${auth}`, "content-type": "application/json", "idempotency-key": key },
      body: JSON.stringify({ artifactFormat: "repo-fixture-v1", fixture }),
    });
    const denied = await POST(request("vulnerable", "wrong", "proxydenied"), context("verify-poc"));
    assert.equal(denied.status, 401);
    const invalid = await POST(request("external", token, "proxyinvalid"), context("verify-poc"));
    assert.equal(invalid.status, 400);
    const accepted = await POST(request("vulnerable"), context("verify-poc"));
    assert.equal(accepted.status, 202);
    const job = await accepted.json();
    assert.match(job.id, /^[a-f0-9-]{36}$/);
    const status = await GET(new Request(`http://localhost:3000/v1/jobs/${job.id}`, { headers: { authorization: `Bearer ${token}` } }), context("jobs", job.id));
    assert.equal(status.status, 200);
    assert.equal((await status.json()).fixture, "vulnerable");
    assert.equal((await POST(request("vulnerable"), context("scan"))).status, 404);
    assert.equal((await GET(new Request("http://localhost:3000/v1/jobs/../bad"), context("jobs", "../bad"))).status, 404);
    assert.equal((await POST(request("x".repeat(5000), token, "proxylarge"), context("verify-poc"))).status, 413);
  } finally {
    if (oldOrigin === undefined) delete process.env.VERIPOC_API_ORIGIN;
    else process.env.VERIPOC_API_ORIGIN = oldOrigin;
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});
