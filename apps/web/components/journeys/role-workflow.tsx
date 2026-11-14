"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Code2 } from "lucide-react";

type Role = "team" | "researcher";
type Variant = "vulnerable" | "patched";

const source = {
  scope: `abstract contract FixtureVault {
    MockAsset public immutable asset;
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;

    function previewDeposit(uint256 assets)
        public view virtual returns (uint256);
}`,
  vulnerable: `contract VulnerableVault is FixtureVault {
    function previewDeposit(uint256 assets)
        public view override returns (uint256) {
        return totalSupply == 0 ? assets
            : assets * totalSupply / totalAssets();
    }
}`,
  patched: `contract PatchedVault is FixtureVault {
    uint256 public constant VIRTUAL_SHARES = 1_000_000;

    function previewDeposit(uint256 assets)
        public view override returns (uint256) {
        return assets * (totalSupply + VIRTUAL_SHARES)
            / (totalAssets() + 1);
    }
}`,
  oracle: `function testVulnerableDonationReproduces() public {
    (uint256 attackerBefore, uint256 shares,
     uint256 attackerAfter, uint256 victim) =
        _runAttack(false);
    require(
        attackerBefore == ATTACKER_START &&
        shares == 0 && attackerAfter == 201 &&
        victim == 0, "attack did not reproduce"
    );
    emit log_named_uint("VERIPOC_ATTACKER_BEFORE", attackerBefore);
    emit log_named_uint("VERIPOC_ATTACKER_AFTER", attackerAfter);
    emit log_named_uint("VERIPOC_VICTIM_SHARES", shares);
}`,
} as const;

const steps = {
  team: [
    { title: "Define the boundary", detail: "A team identifies the exact vault and permitted test environment. This demo is a reviewed local fixture; creating and authorizing other programs is planned.", code: "scope" },
    { title: "Review a researcher's claim", detail: "The researcher spots donation-driven rounding in previewDeposit. A future private inbox will keep unpublished claims and PoCs visible only to authorized reviewers.", code: "vulnerable" },
    { title: "Check the patch", detail: "The same controlled attack can run against the patched fixture. Compare actual receipts in the verifier before making a human remediation decision.", code: "patched" },
  ],
  researcher: [
    { title: "Read the scope", detail: "Start with the authorized target and rules. The current demo vault is local and synthetic; public opportunities for external contracts are not live yet.", code: "scope" },
    { title: "Investigate the code", detail: "Use your own agent, Foundry, Slither, or manual analysis. Here, asset donations can make a later victim deposit mint zero shares.", code: "vulnerable" },
    { title: "Submit a reproducible PoC", detail: "The reviewed Foundry oracle checks the exploit and measures evidence. Today the console accepts only the vulnerable and patched fixture references.", code: "oracle" },
  ],
} as const;

export function RoleWorkflow({ role }: { role: Role }) {
  const [active, setActive] = useState(0);
  const [variant, setVariant] = useState<Variant>("vulnerable");
  const nodes = useRef<(HTMLElement | null)[]>([]);
  const manualSelection = useRef(false);
  const selected = steps[role][active];
  const shownCode = selected.code === "vulnerable" ? variant : selected.code;

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (manualSelection.current) return;
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const index = nodes.current.indexOf(entry.target as HTMLElement);
          if (index >= 0) setActive(index);
        }
      }
    }, { rootMargin: "-20% 0px -48% 0px", threshold: 0 });
    nodes.current.forEach(node => { if (node) observer.observe(node); });
    return () => observer.disconnect();
  }, [role]);

  function choose(index: number) {
    manualSelection.current = true;
    setActive(index);
    nodes.current[index]?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
    window.setTimeout(() => { manualSelection.current = false; }, 700);
  }

  return <section id="role-workflow" className="journey-workflow" aria-labelledby="role-workflow-title">
    <div className="section-head"><p className="eyebrow">A closer look</p><h2 id="role-workflow-title">{role === "team" ? "From scope to patch review" : "From source code to proof"}</h2><p>Scroll through the steps or select one. The code excerpts come from this repository&apos;s reviewed vault fixtures.</p></div>
    <div className="journey-workflow-grid">
      <div className="journey-step-list" role="group" aria-label={`${role === "team" ? "Team" : "Researcher"} workflow steps`}>
        {steps[role].map((step, index) => <article key={step.title} ref={node => { nodes.current[index] = node; }} className="journey-step" data-active={active === index}>
          <button type="button" className="journey-step-button focus-ring" aria-pressed={active === index} onClick={() => choose(index)}>
            <span className="journey-step-number">0{index + 1}</span><span>{step.title}</span><ArrowRight size={17} aria-hidden="true" />
          </button>
          <p>{step.detail}</p>
          <div className="mobile-source"><span>Reviewed code excerpt</span><pre><code>{source[step.code]}</code></pre></div>
        </article>)}
      </div>
      <div id="source-preview" className="source-preview" role="region" aria-label="Reviewed vault code excerpt">
        <div className="source-preview-head"><span><Code2 size={17} aria-hidden="true" /> Reviewed Solidity fixture</span><span>READ-ONLY EXCERPT</span></div>
        <div className="source-preview-body">
          <p className="source-caption">{selected.title} <span>· {shownCode === "oracle" ? "test/TrustedVaultWorker.t.sol" : "contracts/evm/FixtureVault.sol"} (formatted excerpt)</span></p>
          {selected.code === "vulnerable" && <div className="source-switch" role="group" aria-label="Compare vault implementations">
            <button type="button" className="focus-ring" aria-pressed={variant === "vulnerable"} onClick={() => setVariant("vulnerable")}>Vulnerable</button>
            <button type="button" className="focus-ring" aria-pressed={variant === "patched"} onClick={() => setVariant("patched")}>Patched</button>
          </div>}
          <pre><code>{source[shownCode]}</code></pre>
          <p className="source-hint">{shownCode === "patched" ? "Virtual shares change the rounding behavior in this fixture." : shownCode === "vulnerable" ? "Donation increases assets while supply stays low; integer division can round shares to zero." : shownCode === "oracle" ? "This is the trusted test assertion, not a live execution log." : "This is the local contract under review, not an external deployed target."}</p>
        </div>
        <div className="source-preview-foot"><span>Code selection does not execute Foundry.</span><Link href="/opportunities/demo-vault#submission" className="focus-ring">Run reviewed PoC <ArrowRight size={15} aria-hidden="true" /></Link></div>
      </div>
    </div>
  </section>;
}
