#!/usr/bin/env node
import { createInterface } from "node:readline";
import { pathToFileURL } from "node:url";
import { createAgentGatewayClient } from "./client.mjs";

export const MCP_PROTOCOL_VERSION = "2024-11-05";

export const MCP_TOOLS = [
  {
    name: "get_program_scope",
    description: "Read the authorized scope, pinned source revision, and rules for an invited Auditor audit program.",
    inputSchema: {
      type: "object",
      properties: {
        programId: { type: "string", description: "Program identifier ('demo-vault' or invited program UUID)." },
      },
      required: ["programId"],
      additionalProperties: false,
    },
  },
  {
    name: "submit_finding",
    description: "Submit a structured vulnerability finding claim bound to the program's pinned target SHA-256.",
    inputSchema: {
      type: "object",
      properties: {
        programId: { type: "string" },
        claim: { type: "string", description: "Reviewed claim identifier (e.g. 'donation-share-inflation')." },
        targetSha256: { type: "string", description: "Pinned SHA-256 digest of the target contract." },
        idempotencyKey: { type: "string", description: "8-64 character idempotency key for safe retries." },
        report: {
          type: "object",
          properties: {
            title: { type: "string" },
            location: { type: "string" },
            rootCause: { type: "string" },
            impact: { type: "string" },
            invariant: { type: "string" },
            reproduction: { type: "string" },
            tools: { type: "string" },
          },
          required: ["title", "location", "rootCause", "impact", "invariant", "reproduction"],
          additionalProperties: false,
        },
      },
      required: ["programId", "claim", "targetSha256"],
      additionalProperties: false,
    },
  },
  {
    name: "verify_poc",
    description: "Start an isolated Foundry verification job for a reviewed fixture ('vulnerable' or 'patched') on a submitted finding.",
    inputSchema: {
      type: "object",
      properties: {
        programId: { type: "string" },
        submissionId: { type: "string", description: "UUID returned by submit_finding." },
        fixture: { type: "string", enum: ["vulnerable", "patched"] },
        idempotencyKey: { type: "string", description: "8-64 character idempotency key for safe retries." },
      },
      required: ["programId", "submissionId", "fixture"],
      additionalProperties: false,
    },
  },
  {
    name: "get_job_status",
    description: "Check the current execution state ('queued', 'running', or 'finished') of a private verification job.",
    inputSchema: {
      type: "object",
      properties: {
        programId: { type: "string" },
        jobId: { type: "string", description: "UUID returned by verify_poc." },
      },
      required: ["programId", "jobId"],
      additionalProperties: false,
    },
  },
  {
    name: "get_verification_evidence",
    description: "Read the private Foundry verdict, measured balance deltas, and deterministic SHA-256 receipt once a job finishes.",
    inputSchema: {
      type: "object",
      properties: {
        programId: { type: "string" },
        jobId: { type: "string", description: "UUID of a finished verification job." },
      },
      required: ["programId", "jobId"],
      additionalProperties: false,
    },
  },
];

function toolResponse(result) {
  return {
    content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }],
    isError: !result.ok,
    _meta: { httpStatus: result.status },
  };
}

export function createMcpHandler(client) {
  return async function handleMessage(msg) {
    if (!msg || typeof msg !== "object" || msg.jsonrpc !== "2.0" || typeof msg.method !== "string") {
      return { jsonrpc: "2.0", id: msg?.id ?? null, error: { code: -32600, message: "Invalid JSON-RPC request" } };
    }
    if (msg.method === "notifications/initialized") return null;
    const id = msg.id ?? null;

    if (msg.method === "initialize") {
      return {
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: MCP_PROTOCOL_VERSION,
          capabilities: { tools: {} },
          serverInfo: { name: "auditor-agent-gateway", version: "0.1.0" },
        },
      };
    }
    if (msg.method === "ping") {
      return { jsonrpc: "2.0", id, result: {} };
    }
    if (msg.method === "tools/list") {
      return { jsonrpc: "2.0", id, result: { tools: MCP_TOOLS } };
    }
    if (msg.method === "tools/call") {
      const name = msg.params?.name;
      const args = msg.params?.arguments ?? {};
      try {
        let result;
        if (name === "get_program_scope") result = await client.getProgramScope(args.programId);
        else if (name === "submit_finding") result = await client.submitFinding(args);
        else if (name === "verify_poc") result = await client.verifyPoc(args);
        else if (name === "get_job_status") result = await client.getJobStatus(args);
        else if (name === "get_verification_evidence") result = await client.getVerificationEvidence(args);
        else return { jsonrpc: "2.0", id, error: { code: -32602, message: `Unknown tool: ${String(name)}` } };
        return { jsonrpc: "2.0", id, result: toolResponse(result) };
      } catch (error) {
        return {
          jsonrpc: "2.0",
          id,
          result: {
            content: [{ type: "text", text: JSON.stringify({ error: error instanceof Error ? error.message : String(error) }) }],
            isError: true,
          },
        };
      }
    }
    return { jsonrpc: "2.0", id, error: { code: -32601, message: `Method not found: ${msg.method}` } };
  };
}

export function startStdioMcpServer(client) {
  const handle = createMcpHandler(client);
  const rl = createInterface({ input: process.stdin, crlfDelay: Infinity });
  rl.on("line", async line => {
    const trimmed = line.trim();
    if (!trimmed) return;
    let parsed;
    try { parsed = JSON.parse(trimmed); }
    catch {
      process.stdout.write(`${JSON.stringify({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } })}\n`);
      return;
    }
    const response = await handle(parsed);
    if (response) process.stdout.write(`${JSON.stringify(response)}\n`);
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const client = createAgentGatewayClient({
    apiOrigin: process.env.AUDITOR_API_ORIGIN ?? `http://127.0.0.1:${process.env.AUDITOR_PORT ?? 8787}`,
    badge: process.env.AUDITOR_AGENT_BADGE,
    domain: process.env.AUDITOR_AGENT_DOMAIN,
    privateKey: process.env.EVM_PRIVATE_KEY,
  });
  startStdioMcpServer(client);
}
