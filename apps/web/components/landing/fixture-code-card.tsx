"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Code2, LockKeyhole } from "lucide-react";

const examples = {
  vulnerable: {
    name: "VulnerableVault.sol",
    code: [
      "function previewDeposit(uint256 assets)",
      "    public view override returns (uint256) {",
      "    return totalSupply == 0 ? assets",
      "        : assets * totalSupply / totalAssets();",
      "}",
    ].join("\n"),
    note: "Donated assets can change the share price before a victim deposit.",
  },
  patched: {
    name: "PatchedVault.sol",
    code: [
      "function previewDeposit(uint256 assets)",
      "    public view override returns (uint256) {",
      "    return assets * (totalSupply + VIRTUAL_SHARES)",
      "        / (totalAssets() + 1);",
      "}",
    ].join("\n"),
    note: "Virtual shares change the rounding behavior in the reviewed patch.",
  },
} as const;

export function FixtureCodeCard() {
  const [variant, setVariant] = useState<keyof typeof examples>("vulnerable");
  const selected = examples[variant];
  return <div className="fixture-editor" aria-label="Interactive local vault source preview">
    <div className="fixture-editor-top"><span className="editor-dots" aria-hidden="true"><i /><i /><i /></span><span><Code2 size={15} aria-hidden="true" /> contracts/evm/FixtureVault.sol</span><span className="editor-readonly"><LockKeyhole size={14} aria-hidden="true" /> READ ONLY</span></div>
    <div className="fixture-editor-tabs" role="group" aria-label="Compare reviewed vault implementations">
      {(["vulnerable", "patched"] as const).map(option => <button key={option} type="button" className="focus-ring" aria-pressed={variant === option} onClick={() => setVariant(option)}>{examples[option].name}</button>)}
    </div>
    <div className="fixture-editor-body"><p className="editor-caption">Reviewed local fixture · formatted source excerpt</p><pre><code>{selected.code}</code></pre><p className="editor-note">{selected.note}</p></div>
    <div className="fixture-editor-bottom"><span>Code selection never runs Foundry.</span><Link href="/opportunities/demo-vault" className="focus-ring">View scope <ArrowUpRight size={15} aria-hidden="true" /></Link></div>
  </div>;
}
