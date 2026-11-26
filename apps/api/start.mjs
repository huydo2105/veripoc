#!/usr/bin/env node
import { createApiServer } from "./server.mjs";

const port = Number(process.env.AUDITOR_PORT ?? 8787);
if (!Number.isSafeInteger(port) || port < 1 || port > 65535) throw new Error("invalid AUDITOR_PORT");
const listEnv = value => (value ?? "").split(",").map(item => item.trim()).filter(Boolean);
const server = createApiServer({ token: process.env.AUDITOR_API_TOKEN,
  teamToken: process.env.AUDITOR_TEAM_TOKEN, researcherToken: process.env.AUDITOR_RESEARCHER_TOKEN,
  agentDomain: process.env.AUDITOR_AGENT_DOMAIN,
  invitedAgentBadges: listEnv(process.env.AUDITOR_INVITED_AGENT_BADGES),
  allowedOrigins: listEnv(process.env.AUDITOR_ALLOWED_ORIGINS),
  teamAccounts: listEnv(process.env.AUDITOR_TEAM_ACCOUNTS),
  invitedResearcherAccounts: listEnv(process.env.AUDITOR_RESEARCHER_ACCOUNTS),
  programStorePath: process.env.AUDITOR_PROGRAM_STORE ?? ".local/programs.json" });
server.listen(port, "127.0.0.1", () => console.log(`Auditor local API: http://127.0.0.1:${port}`));
