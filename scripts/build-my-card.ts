import * as fs from 'fs';
import { createHash } from 'crypto';

const BADGE = 'JyP9UYj3AwBDfz2yHCMgx';
const ACCOUNT = '4kL7NH18ytDXaKsoHZi8mfRC9LfNC9meiATmoqs2n2NnBZskhm';
// IMPORTANT: Set this to the exact public HTTPS URL where you will upload agent-card.json in Step 2!
const AGENT_URI = process.env.AGENT_URI || 'https://raw.githubusercontent.com/huydo2105/veripoc/main/agent-card.json';

async function main() {
  // 1. Fetch the exact normative badge block from Concordium for JyP9UXdZEugHqroAHnhbn
  const badgeRes = await fetch(`https://agent-registry-mcp.concordium.com/v1/get-badge-JSON/${BADGE}`);
  const badgeData = await badgeRes.json();

  if (!badgeData.extension) {
    throw new Error(`Failed to fetch badge JSON: ${JSON.stringify(badgeData)}`);
  }

  // 2. Construct the combined ERC-8004 + A2A v1.0 Agent Card with the normative extension
  const agentCard = {
    type: 'https://eips.ethereum.org/EIPS/eip-8004#registration-v1',
    name: 'VeriPoC Security & Exploit Triage Agent',
    description:
      'Autonomous EVM smart contract pre-flight simulator and deterministic Foundry PoC verifier gated by Concordium identity and x402.',
    image: 'https://concordium.com/favicon.ico',
    version: '1.0.0',
    provider: {
      organization: 'VeriPoC Labs',
      url: 'https://github.com',
    },
    supportedInterfaces: [
      {
        url: AGENT_URI,
        protocolBinding: 'HTTP+JSON',
        protocolVersion: '1.0',
      },
    ],
    capabilities: {
      streaming: false,
      pushNotifications: false,
      extensions: [badgeData.extension], // Exact normative block from Concordium chain
    },
    defaultInputModes: ['text/plain'],
    defaultOutputModes: ['text/plain'],
    skills: [
      {
        id: 'preflight-scan',
        name: 'EVM Pre-Flight Simulation & Audit',
        description: 'Simulates EVM calldata and checks ERC-4626 invariants before execution.',
        tags: ['security', 'evm', 'foundry', 'audit'],
      },
      {
        id: 'verify-exploit-poc',
        name: 'Verify Foundry Exploit PoC',
        description: 'Runs deterministic Foundry exploit tests against pinned block forks and settles bounties.',
        tags: ['bounty', 'poc', 'security', 'x402'],
      },
    ],
    services: [
      {
        name: 'A2A',
        endpoint: AGENT_URI,
        version: '1.0',
      },
      {
        name: 'MCP',
        endpoint: 'https://agent-registry-mcp.concordium.com/mcp',
        version: '2025-06-18',
      },
    ],
    x402Support: true,
    active: true,
    registrations: [badgeData.registrations_entry], // Exact ERC-8004 registration entry (agentId: 1058)
  };

  const canonicalString = JSON.stringify(agentCard, null, 2);
  fs.writeFileSync('agent-card.json', canonicalString, 'utf-8');

  const localHash = createHash('sha256').update(canonicalString).digest('hex');
  console.log('✅ Generated agent-card.json with badge JyP9UXdZEugHqroAHnhbn!');
  console.log(`   Local SHA-256: ${localHash}`);
  console.log(`   Next: Upload agent-card.json to ${AGENT_URI}`);
}

main().catch(console.error);