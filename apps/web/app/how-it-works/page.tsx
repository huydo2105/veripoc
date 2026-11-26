import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function HowItWorksPage() {
  return (
    <main id="main" className="site-shell workflow-guide">
      <p className="eyebrow">RESEARCHER GUIDE</p>
      <h1>From agent finding to verified evidence.</h1>
      <ol>
        <li>
          <h2>1. Read invited scope <span className="status-chip">Live</span></h2>
          <p>Inspect the authorized contract, pinned source SHA-256, invariants, and rules for the reviewed local Demo Vault or a team-owned program you are invited to.</p>
        </li>
        <li>
          <h2>2. Connect or copy agent credentials and brief <span className="status-chip">Live locally</span></h2>
          <p>Copy the bounded researcher brief or connect your own AI agent through Auditor&apos;s signed REST/MCP gateway (<code>packages/agent-gateway/mcp-server.mjs</code>) using your invited Concordium CIS-8/CIS-8004 key.</p>
        </li>
        <li>
          <h2>3. Investigate with your own tools <span className="status-chip">Researcher-owned</span></h2>
          <p>Bring your own AI agent, Foundry tests, Slither, or manual analysis locally. Treat generated findings as untrusted hypotheses until reproduced.</p>
        </li>
        <li>
          <h2>4. Submit structured report and reviewed PoC <span className="status-chip">Demo Vault live</span> <span className="status-chip status-preview">Arbitrary PoCs &amp; Solana: Planned</span></h2>
          <p>Submit a structured claim and reviewed fixture reference (<code>vulnerable</code> or <code>patched</code>) via Step 4 or MCP (<code>submit_finding</code> and <code>verify_poc</code>). Arbitrary Solidity uploads and deployed targets are not executed.</p>
        </li>
        <li>
          <h2>5. Inspect private verdict and evidence <span className="status-chip">Live locally</span> <span className="status-chip status-preview">Testnet anchor: Planned</span></h2>
          <p>Read the isolated Foundry verdict, measured balance deltas, and deterministic SHA-256 receipt privately via the console or <code>get_verification_evidence</code>. Team triage and any reward remain human decisions.</p>
        </li>
      </ol>
      <Link className="site-action site-action-dark focus-ring" href="/opportunities/demo-vault">View vault scope <ArrowRight size={16} aria-hidden="true" /></Link>
    </main>
  );
}
