#!/usr/bin/env node
import { createApiServer } from "./server.mjs";

const port = Number(process.env.VERIPOC_PORT ?? 8787);
if (!Number.isSafeInteger(port) || port < 1 || port > 65535) throw new Error("invalid VERIPOC_PORT");
const listEnv = value => (value ?? "").split(",").map(item => item.trim()).filter(Boolean);
const server = createApiServer({ token: process.env.VERIPOC_API_TOKEN,
  teamToken: process.env.VERIPOC_TEAM_TOKEN, researcherToken: process.env.VERIPOC_RESEARCHER_TOKEN,
  agentDomain: process.env.VERIPOC_AGENT_DOMAIN,
  invitedAgentBadges: listEnv(process.env.VERIPOC_INVITED_AGENT_BADGES),
  allowedOrigins: listEnv(process.env.VERIPOC_ALLOWED_ORIGINS),
  teamAccounts: listEnv(process.env.VERIPOC_TEAM_ACCOUNTS),
  invitedResearcherAccounts: listEnv(process.env.VERIPOC_RESEARCHER_ACCOUNTS),
  programStorePath: process.env.VERIPOC_PROGRAM_STORE ?? ".local/programs.json" });
server.listen(port, "127.0.0.1", () => console.log(`VeriPoC local API: http://127.0.0.1:${port}`));
