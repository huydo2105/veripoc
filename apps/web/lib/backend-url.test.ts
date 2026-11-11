import test from "node:test";
import assert from "node:assert/strict";
import { backendOrigin } from "./backend-url";

test("local fallback works only in development", () => {
  assert.equal(backendOrigin(undefined, false)?.origin, "http://127.0.0.1:8787");
  assert.equal(backendOrigin(undefined, true), null);
});
test("production requires explicit HTTPS origin and rejects unsafe URL parts", () => {
  assert.equal(backendOrigin("https://verify.example.org", true)?.origin, "https://verify.example.org");
  for (const value of ["http://verify.example.org", "http://127.0.0.1:8787", "https://user:pass@verify.example.org", "https://verify.example.org/path", "https://verify.example.org/?x=1", "file:///tmp/api"])
    assert.throws(() => backendOrigin(value, true));
});
test("development never forwards plaintext tokens to non-loopback targets", () => {
  assert.equal(backendOrigin("http://localhost:8787", false)?.origin, "http://localhost:8787");
  assert.throws(() => backendOrigin("http://192.168.1.2:8787", false));
});
