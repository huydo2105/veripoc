# Auditor BYO Research Agent Gateway (REST & MCP)

Allows an invited security researcher to connect their own AI agent (Claude Code, Cursor, Codex, or a custom script) to Auditor's bounded verification API using Issue #12 signed CIS-8 / CIS-8004 requests.

## Exposed Operations

Both the REST client (`client.mjs`) and the stdio MCP server (`mcp-server.mjs`) expose the same five bounded operations:

| MCP Tool | REST Endpoint | Purpose |
| :--- | :--- | :--- |
| `get_program_scope` | `GET /v1/programs/:programId` | Read authorized scope, pinned SHA-256 revision, and rules |
| `submit_finding` | `POST /v1/programs/:programId/submissions` | Submit a structured finding report bound to the target revision |
| `verify_poc` | `POST /v1/programs/:programId/submissions/:submissionId/jobs` | Trigger an isolated Foundry run (`vulnerable` or `patched` fixture) |
| `get_job_status` | `GET /v1/programs/:programId/jobs/:jobId` | Poll `queued` / `running` / `finished` status |
| `get_verification_evidence` | `GET /v1/programs/:programId/jobs/:jobId/evidence` | Read the private Foundry verdict, balance deltas, and SHA-256 receipt |

Every call is signed locally with the agent's CIS-8 bound key (`EVM_PRIVATE_KEY` never leaves the researcher's machine). The Auditor API enforces invitation, active badge + Agent Card SHA-256 integrity, single-use nonce, 5-minute expiry, idempotency, and per-program run quota.

## Running Locally (MCP Stdio)

1. Start the Auditor local API with the agent's badge invited:
   ```powershell
   $env:AUDITOR_API_TOKEN = "<32+ char token>"
   $env:AUDITOR_TEAM_TOKEN = "<32+ char token>"
   $env:AUDITOR_RESEARCHER_TOKEN = "<32+ char token>"
   $env:AUDITOR_AGENT_DOMAIN = "auditor.local"
   $env:AUDITOR_INVITED_AGENT_BADGES = "JyP9UhUtd9AeJywDRsg5q"
   npm run api:dev
   ```
2. Configure your MCP client (e.g., Claude Desktop / Cursor / Codex) to launch the stdio server:
   ```json
   {
     "mcpServers": {
       "auditor": {
         "command": "node",
         "args": ["packages/agent-gateway/mcp-server.mjs"],
         "env": {
           "AUDITOR_API_ORIGIN": "http://127.0.0.1:8787",
           "AUDITOR_AGENT_BADGE": "JyP9UhUtd9AeJywDRsg5q",
           "AUDITOR_AGENT_DOMAIN": "auditor.local",
           "EVM_PRIVATE_KEY": "0x..."
         }
       }
     }
   }
   ```

## Current Limitations
- Automated Foundry verification runs **only** on the reviewed local EVM vault (`demo-vault`, `vulnerable` and `patched` fixtures).
- Arbitrary agent-generated Solidity PoCs and external bounty intake are not executed by this gateway.
- Team-agent advisory triage and patch retests belong to Issue #36.
