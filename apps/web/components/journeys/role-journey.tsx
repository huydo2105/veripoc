import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, LockKeyhole } from "lucide-react";
import { RoleWorkflow } from "@/components/journeys/role-workflow";
import { VerificationConsole } from "@/components/verification/verification-console";

export function RoleJourney({ role }: { role: "researcher" | "team" }) {
  return <main id="main" className="site-shell opportunity-detail">
    <Link href="/get-started" className="back-link focus-ring"><ArrowLeft size={16} aria-hidden="true" /> All opportunities</Link>
    <header className="opportunity-detail-header">
      <div className="opportunity-identity"><span className="opportunity-identity-mark" aria-hidden="true">V</span><div><p className="eyebrow">Reviewed local fixture</p><h1>Vault Audit Program</h1><div className="opportunity-tags"><span><CheckCircle2 size={14} /> Runnable fixture</span><span>ERC-4626</span><span>No bounty</span></div></div></div>
      <p>Examine the scoped vault and reproduce its share-inflation claim with the existing Foundry verifier.</p>
    </header>
    <div className="opportunity-detail-layout">
      <div className="opportunity-detail-main">
        <nav className="opportunity-detail-nav" aria-label="Program sections"><a href="#instructions">Instructions</a><a href="#scope">Scope</a><a href="#submission">Verify PoC</a></nav>
        <section id="instructions" className="opportunity-copy"><h2>What to investigate</h2><p>The reviewed vault has vulnerable and patched implementations. An asset donation can change the vulnerable vault’s share calculation before a victim deposit. The same trusted PoC tests both implementations.</p><h3>Researcher path</h3><ol><li>Read the permitted scope and checked-in source.</li><li>Investigate with your own agent, tools, or manual review.</li><li>Run the reviewed PoC and compare the returned evidence.</li></ol><p className="opportunity-boundary"><LockKeyhole size={17} aria-hidden="true" /> External contracts and arbitrary uploads are not authorized.</p></section>
        <section id="scope" className="opportunity-copy"><h2>Authorized scope</h2><dl className="opportunity-scope"><div><dt>Target</dt><dd>contracts/evm/FixtureVault.sol</dd></div><div><dt>PoC reference</dt><dd>test/TrustedVaultWorker.t.sol</dd></div><div><dt>Environment</dt><dd>Isolated local Foundry worker</dd></div><div><dt>Permitted input</dt><dd>Reviewed fixture references only</dd></div></dl></section>
        <RoleWorkflow role={role} />
      </div>
      <aside className="opportunity-detail-aside" aria-label="Program summary"><p className="eyebrow">Verification access</p><h2>One claim. Two controls.</h2><p>Run the vulnerable and patched fixtures, then inspect the actual verdict and private evidence receipt.</p><dl><div><dt>Reward</dt><dd>None offered</dd></div><div><dt>Program</dt><dd>Local fixture only</dd></div><div><dt>Submission</dt><dd>API token required</dd></div><div><dt>Team review</dt><dd>Planned</dd></div></dl><a className="site-action site-action-dark focus-ring" href="#submission">Open verifier <ArrowRight size={16} aria-hidden="true" /></a></aside>
    </div>
    <VerificationConsole embedded />
  </main>;
}
