import { createServer } from "node:http";
import { timingSafeEqual, createHash, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Worker } from "node:worker_threads";

const here = dirname(fileURLToPath(import.meta.url));
const pages = new Map([["/", ["home.html", "text/html; charset=utf-8"]],
  ["/teams/start", ["teams.html", "text/html; charset=utf-8"]],
  ["/researchers/start", ["researchers.html", "text/html; charset=utf-8"]],
  ["/verify", ["index.html", "text/html; charset=utf-8"]],
  ["/journey.css", ["journey.css", "text/css; charset=utf-8"]],\n  ["/logo.svg", ["logo.svg", "image/svg+xml"]],\n  ["/app-icon.svg", ["app-icon.svg", "image/svg+xml"]],
  ["/app.js", ["app.js", "text/javascript; charset=utf-8"]],
  ["/state.mjs", ["state.mjs", "text/javascript; charset=utf-8"]],
  ["/style.css", ["style.css", "text/css; charset=utf-8"]]]);
const sha = value => createHash("sha256").update(value).digest("hex");
const json = (res, code, value) => {
  res.writeHead(code, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store",
    "x-content-type-options": "nosniff" });
  res.end(JSON.stringify(value));
};
const fail = (status, message) => Object.assign(new Error(message), { status });
const equalToken = (given, expected) => {
  if (typeof given !== "string" || !given.startsWith("Bearer ")) return false;
  const a = Buffer.from(sha(given.slice(7)));
  const b = Buffer.from(sha(expected));
  return timingSafeEqual(a, b);
};
async function readBody(req) {
  if (req.headers["content-type"]?.split(";")[0] !== "application/json") throw fail(415, "JSON body required");
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 4096) throw fail(413, "request too large");
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); }
  catch { throw fail(400, "invalid JSON"); }
}
function validBody(kind, body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return false;
  const keys = Object.keys(body).sort().join();
  if (kind === "scan") return keys === "artifactFormat,target" && body.artifactFormat === "repo-fixture-v1"
    && body.target === "local-vaults";
  return keys === "artifactFormat,fixture" && body.artifactFormat === "repo-fixture-v1"
    && ["vulnerable", "patched"].includes(body.fixture);
}
export function executeJob(kind, body) {
  return new Promise((resolveJob, rejectJob) => {
    const worker = new Worker(resolve(here, "job-worker.mjs"), { workerData: { kind, body },
      resourceLimits: { maxOldGenerationSizeMb: 64 } });
    let settled = false;
    const finish = (error, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (error) rejectJob(error); else resolveJob(value);
    };
    const timer = setTimeout(() => { worker.terminate(); finish(new Error("job deadline exceeded")); }, 150_000);
    worker.once("message", data => data.ok ? finish(null, data.value) : finish(new Error(data.error)));
    worker.once("error", error => finish(error));
    worker.once("exit", code => { if (!settled) finish(new Error(`worker exited ${code}`)); });
  });
}
export function createApiServer({ token, execute = executeJob, now = Date.now, maxJobs = 16 } = {}) {
  if (typeof token !== "string" || token.length < 32) throw new Error("VERIPOC_API_TOKEN must be at least 32 characters");
  const jobs = new Map();
  const idempotency = new Map();
  const buckets = new Map();
  let running = false;
  const queue = [];
  const pump = () => {
    if (running || !queue.length) return;
    running = true;
    const job = queue.shift();
    job.state = "running";
    Promise.resolve().then(() => execute(job.kind, job.body)).then(result => {
      job.state = "finished";
      job.result = result;
    }, error => {
      job.state = "finished";
      job.result = { status: "tool_error", reason: String(error.message || error) };
    }).finally(() => { running = false; pump(); });
  };
  return createServer(async (req, res) => {
    const path = new URL(req.url, "http://localhost").pathname;
    res.setHeader("content-security-policy", "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'none'");
    if (req.method === "GET" && pages.has(path)) {
      const [file, type] = pages.get(path);
      res.writeHead(200, { "content-type": type, "cache-control": "no-store", "x-content-type-options": "nosniff" });
      res.end(readFileSync(resolve(here, "../web", file)));
      return;
    }
    if (req.method === "GET" && path === "/.well-known/agent-card.json") {
      res.writeHead(200, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store",
        "x-content-type-options": "nosniff" });
      res.end(readFileSync(resolve(here, "../../.well-known/agent-card.json")));
      return;
    }
    if (!path.startsWith("/v1/")) return json(res, 404, { error: "not found" });
    if (!equalToken(req.headers.authorization, token)) return json(res, 401, { error: "unauthorized" });
    const key = `${req.socket.remoteAddress}:${req.method === "POST" ? "write" : "read"}`;
    const limit = req.method === "POST" ? 5 : 120;
    const bucket = buckets.get(key);
    const current = now();
    const next = !bucket || current - bucket.start >= 60_000 ? { start: current, count: 0 } : bucket;
    next.count++;
    buckets.set(key, next);
    if (next.count > limit) return json(res, 429, { error: "rate limit exceeded" });
    try {
      if (req.method === "GET" && /^\/v1\/jobs\/[a-f0-9-]{36}$/.test(path)) {
        const job = jobs.get(path.slice(9));
        return job ? json(res, 200, { id: job.id, kind: job.kind, state: job.state,
          fixture: job.body.fixture ?? null, result: job.result ?? null }) : json(res, 404, { error: "job not found" });
      }
      const kind = path === "/v1/scan" ? "scan" : path === "/v1/verify-poc" ? "verify" : null;
      if (req.method !== "POST" || !kind) return json(res, 404, { error: "not found" });
      const requestKey = req.headers["idempotency-key"];
      if (typeof requestKey !== "string" || !/^[a-zA-Z0-9_-]{8,64}$/.test(requestKey)) throw fail(400, "valid Idempotency-Key required");
      const body = await readBody(req);
      if (!validBody(kind, body)) throw fail(400, "only reviewed repository fixtures are accepted");
      const fingerprint = sha(JSON.stringify([kind, body]));
      const prior = idempotency.get(requestKey);
      if (prior) return prior.fingerprint === fingerprint ? json(res, 202, { id: prior.id, state: jobs.get(prior.id).state })
        : json(res, 409, { error: "idempotency key reused for a different request" });
      if (jobs.size >= maxJobs) throw fail(503, "job capacity reached; restart local server after reviewing results");
      const job = { id: randomUUID(), kind, body, state: "queued", result: null };
      jobs.set(job.id, job);
      idempotency.set(requestKey, { fingerprint, id: job.id });
      queue.push(job);
      pump();
      return json(res, 202, { id: job.id, state: job.state });
    } catch (error) {
      return json(res, error.status ?? 500, { error: error.status ? error.message : "internal error" });
    }
  });
}
