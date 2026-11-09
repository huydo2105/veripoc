import { privateKeyToAccount } from 'viem/accounts';
import { createHash } from 'crypto';
import * as fs from 'fs';

const MCP_ENDPOINT = 'https://agent-registry-mcp.concordium.com/mcp';
const REST_BASE = 'https://agent-registry-mcp.concordium.com/v1';

// Replace via .env before running
const CONCORDIUM_ACCOUNT = process.env.CONCORDIUM_ACCOUNT!; // Your Base58 Testnet Account
const EVM_PRIVATE_KEY = process.env.EVM_PRIVATE_KEY as `0x${string}`; // Your Agent's EVM Private Key
const CARD_PUBLIC_URL =
  process.env.CARD_PUBLIC_URL || 'https://raw.githubusercontent.com/huydo2105/veripoc/main/agent-card.json';
const NETWORK = 'testnet'; // Switch to 'mainnet' after Dec 9

async function callMcpTool(name: string, args: Record<string, unknown>) {
  const res = await fetch(MCP_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: { name, arguments: args },
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(`MCP Error (${name}): ${JSON.stringify(data.error)}`);
  const textContent = data.result?.content?.[0]?.text;
  return textContent ? JSON.parse(textContent) : data.result;
}

async function main() {
  if (!CONCORDIUM_ACCOUNT || !EVM_PRIVATE_KEY) {
    throw new Error('Set CONCORDIUM_ACCOUNT and EVM_PRIVATE_KEY in your environment');
  }

  const evmAccount = privateKeyToAccount(EVM_PRIVATE_KEY);
  // Extract uncompressed secp256k1 public key without 0x prefix as required by CIS-8
  const uncompressedPubKeyHex = evmAccount.publicKey.slice(2);

  console.log(`1. EVM Agent Address: ${evmAccount.address}`);
  console.log(`   Uncompressed Public Key: ${uncompressedPubKeyHex.slice(0, 24)}...`);

  // STEP 1: Derive canonical bytes for CIS-8 External Key Registry
  console.log('\n[Step 1] Calling build_cis8_canonical_bytes...');
  const canonicalRes = await callMcpTool('build_cis8_canonical_bytes', {
    network: NETWORK,
    concordium_account: CONCORDIUM_ACCOUNT,
    external_namespace: 'eip155:84532', // Base Sepolia (or eip155:1 for Ethereum Mainnet)
    external_key_namespace: 'eip155:84532',
    external_key_type: 'secp256k1-uncompressed',
    external_public_key_hex: uncompressedPubKeyHex,
    proof_scheme: 'ethereum-personal-sign',
  });

  const canonicalBytesHex: `0x${string}` = `0x${canonicalRes.canonical_bytes_hex.replace(/^0x/, '')}`;
  console.log(`   Canonical Bytes (Hex): ${canonicalBytesHex}`);

  // STEP 2: Sign canonical bytes with Ethereum private key (ethereum-personal-sign)
  console.log('\n[Step 2] Signing canonical bytes with EVM key...');
  const signatureHex = await evmAccount.signMessage({
    message: { raw: canonicalBytesHex },
  });
  console.log(`   EVM Signature: ${signatureHex}`);

  // STEP 3: Build the CIS-8 Register transaction payload
  console.log('\n[Step 3] Calling build_cis8_register...');
  const cis8TxPayload = await callMcpTool('build_cis8_register', {
    network: NETWORK,
    sender: CONCORDIUM_ACCOUNT,
    external_namespace: 'eip155:84532',
    external_key_namespace: 'eip155:84532',
    external_key_type: 'secp256k1-uncompressed',
    external_public_key_hex: uncompressedPubKeyHex,
    proof_scheme: 'ethereum-personal-sign',
    signature_hex: signatureHex.replace(/^0x/, ''),
  });
  fs.writeFileSync('cis8-register-tx.json', JSON.stringify(cis8TxPayload, null, 2));
  console.log('   Saved sign-ready CIS-8 transaction payload to cis8-register-tx.json');

  // STEP 4A: Build initial Agent Card (Pass 1)
  console.log('\n[Step 4A] Generating initial Agent Card via build_agent_card...');
  const cardRes = await callMcpTool('build_agent_card', {
    network: NETWORK,
    owner_account: CONCORDIUM_ACCOUNT,
    name: 'VeriPoC Security & Exploit Triage Agent',
    description: 'Autonomous EVM smart contract pre-flight simulator and deterministic Foundry PoC verifier gated by Concordium identity and x402.',
    agent_uri: CARD_PUBLIC_URL,
    organization_name: 'VeriPoC Labs',
    organization_url: 'https://github.com/YOUR-GITHUB-USER/veripoc',
    mcp_endpoint: 'https://api.veripoc.xyz/mcp',
    x402_support: true,
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
  });

  const cardJsonString = JSON.stringify(cardRes.card ?? cardRes, null, 2);
  fs.writeFileSync('agent-card.json', cardJsonString);
  const sha256Hex = createHash('sha256').update(cardJsonString).digest('hex');
  console.log(`   Saved agent-card.json (SHA-256: ${sha256Hex})`);

  // STEP 4B: Build CIS-8004 Register transaction with CIS-8 external reference
  console.log('\n[Step 4B] Calling build_register (CIS-8004 with CIS-8 reference)...');
  const cis8004TxPayload = await callMcpTool('build_register', {
    network: NETWORK,
    sender: CONCORDIUM_ACCOUNT,
    agent_uri: CARD_PUBLIC_URL,
    metadata_hash_hex: sha256Hex,
    external_reference: {
      kind: 'Cis8',
      external_namespace: 'eip155:84532',
      external_key_namespace: 'eip155:84532',
      external_key_type: 'secp256k1-uncompressed',
      external_public_key_hex: uncompressedPubKeyHex,
    },
  });
  fs.writeFileSync('cis8004-register-tx.json', JSON.stringify(cis8004TxPayload, null, 2));
  console.log('   Saved sign-ready CIS-8004 registration payload to cis8004-register-tx.json');
}

main().catch(console.error);