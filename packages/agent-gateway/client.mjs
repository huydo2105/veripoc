import { randomUUID } from "node:crypto";
import { privateKeyToAccount } from "viem/accounts";
import { agentMessage } from "../../apps/api/agent-auth.mjs";

const PROGRAM_ID_RE = /^(?:demo-vault|[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/;
const UUID_RE = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
const IDEMPOTENCY_RE = /^[a-zA-Z0-9_-]{8,64}$/;
const MAX_BODY_BYTES = 4096;

function assertProgramId(programId) {
  if (typeof programId !== "string" || !PROGRAM_ID_RE.test(programId)) {
    throw new Error("programId must be 'demo-vault' or a valid program UUID");
  }
}

function assertUuid(value, label) {
  if (typeof value !== "string" || !UUID_RE.test(value)) {
    throw new Error(`${label} must be a valid UUID`);
  }
}

export function createAgentGatewayClient({
  apiOrigin = `http://127.0.0.1:${process.env.AUDITOR_PORT ?? 8787}`,
  badge,
  domain,
  privateKey,
  fetchImpl = fetch,
  now = Date.now,
} = {}) {
  if (typeof badge !== "string" || !/^[1-9A-HJ-NP-Za-km-z]{15,40}$/.test(badge)) {
    throw new Error("valid Concordium agent badge is required");
  }
  if (typeof domain !== "string" || !/^[a-zA-Z0-9.-]{3,100}$/.test(domain)) {
    throw new Error("valid agent signing domain is required");
  }
  if (typeof privateKey !== "string" || !/^0x[0-9a-fA-F]{64}$/.test(privateKey)) {
    throw new Error("valid 32-byte hex EVM_PRIVATE_KEY is required");
  }
  const originUrl = new URL(apiOrigin);
  if (originUrl.protocol !== "http:" && originUrl.protocol !== "https:") {
    throw new Error("apiOrigin must use http or https");
  }
  const account = privateKeyToAccount(privateKey);

  async function signedRequest(method, path, { payload, idempotencyKey } = {}) {
    const rawBody = method === "POST" ? Buffer.from(JSON.stringify(payload ?? {}), "utf8") : Buffer.alloc(0);
    if (rawBody.byteLength > MAX_BODY_BYTES) {
      throw new Error("request body exceeds 4096-byte API limit");
    }
    const nonce = randomUUID();
    const expires = now() + 60_000;
    const message = agentMessage({ domain, method, path, body: rawBody, nonce, expires });
    const signature = await account.signMessage({ message });

    const headers = {
      "x-auditor-agent-badge": badge,
      "x-auditor-agent-nonce": nonce,
      "x-auditor-agent-expires": String(expires),
      "x-auditor-agent-signature": signature,
    };
    if (method === "POST") {
      const key = idempotencyKey ?? randomUUID();
      if (!IDEMPOTENCY_RE.test(key)) throw new Error("idempotencyKey must be 8-64 ASCII characters");
      headers["content-type"] = "application/json";
      headers["idempotency-key"] = key;
    }

    const response = await fetchImpl(new URL(path, originUrl), {
      method,
      headers,
      ...(method === "POST" ? { body: rawBody } : {}),
      signal: AbortSignal.timeout(15_000),
    });
    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }
    return { ok: response.ok, status: response.status, data };
  }

  return {
    getProgramScope: async (programId = "demo-vault") => {
      assertProgramId(programId);
      return signedRequest("GET", `/v1/programs/${programId}`);
    },
    submitFinding: async ({ programId = "demo-vault", claim, targetSha256, report, idempotencyKey }) => {
      assertProgramId(programId);
      const payload = { claim, targetSha256, ...(report !== undefined ? { report } : {}) };
      return signedRequest("POST", `/v1/programs/${programId}/submissions`, { payload, idempotencyKey });
    },
    verifyPoc: async ({ programId = "demo-vault", submissionId, fixture, idempotencyKey }) => {
      assertProgramId(programId);
      assertUuid(submissionId, "submissionId");
      const payload = { artifactFormat: "repo-fixture-v1", fixture };
      return signedRequest("POST", `/v1/programs/${programId}/submissions/${submissionId}/jobs`, { payload, idempotencyKey });
    },
    getJobStatus: async ({ programId = "demo-vault", jobId }) => {
      assertProgramId(programId);
      assertUuid(jobId, "jobId");
      return signedRequest("GET", `/v1/programs/${programId}/jobs/${jobId}`);
    },
    getVerificationEvidence: async ({ programId = "demo-vault", jobId }) => {
      assertProgramId(programId);
      assertUuid(jobId, "jobId");
      return signedRequest("GET", `/v1/programs/${programId}/jobs/${jobId}/evidence`);
    },
  };
}
